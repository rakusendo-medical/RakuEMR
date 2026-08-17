#Requires -Version 5.1

BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelper.ps1')
    Import-MonitorTestModule -Name 'Notify.psm1'

    $script:t0 = [datetime]'2026-08-17T09:00:00'

    function New-TestAlertSet {
        <#
            .SYNOPSIS
            テスト用のチェック結果を作る。
        #>
        [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'テスト用のモックデータを生成して返すだけのファクトリ関数。')]
        [CmdletBinding()]
        [OutputType([object[]])]
        param(
            [Parameter()]
            [string] $DiskLevel = 'Warning'
        )

        $svc = New-CheckResult -CheckId 'SVC' -CheckName 'サービス稼働' -TargetName 'YAYOI-SV' `
            -Findings @((New-CheckFinding -Key 'MSSQL$YAYOI' -Level 'Critical' -Title 'サービス停止'))
        $dsk = New-CheckResult -CheckId 'DSK' -CheckName 'ディスク空き容量' -TargetName 'YAYOI-SV' `
            -Findings @((New-CheckFinding -Key 'D:' -Level $DiskLevel -Title '空き容量低下'))
        return @($svc, $dsk)
    }
}

Describe 'ConvertTo-MonitorAlert' {

    It '検知事項をアラートに変換し、対象・チェック・キーで一意な Key を作る' {
        $alerts = ConvertTo-MonitorAlert -CheckResult (New-TestAlertSet)

        @($alerts).Count | Should -Be 2
        @($alerts | ForEach-Object { $_.Key }) | Should -Contain 'YAYOI-SV|SVC|MSSQL$YAYOI'
        @($alerts | ForEach-Object { $_.Scope }) | Should -Contain 'YAYOI-SV|DSK'
    }

    It 'OK / Skipped の検知事項はアラートにしない' {
        $result = New-CheckResult -CheckId 'VM' -CheckName 'Hyper-V' -TargetName 'HV-HOST' `
            -Findings @((New-CheckFinding -Key 'x' -Level 'OK' -Title 'ok'))
        @(ConvertTo-MonitorAlert -CheckResult @($result)).Count | Should -Be 0
    }
}

Describe 'Get-EvaluatedScope' {

    It '判定できたスコープだけを返す' {
        $ok = New-CheckResult -CheckId 'SVC' -CheckName 'サービス' -TargetName 'SV' -Status 'OK'
        $unknown = New-UnknownCheckResult -CheckId 'DSK' -CheckName 'ディスク' -TargetName 'SV' -Reason '接続不可'

        $scopes = Get-EvaluatedScope -CheckResult @($ok, $unknown)
        $scopes | Should -Contain 'SV|SVC'
        $scopes | Should -Not -Contain 'SV|DSK'
    }
}

Describe 'Get-NotificationPlan（再通知抑制）' {

    BeforeAll {
        $script:results = New-TestAlertSet
        $script:alerts = ConvertTo-MonitorAlert -CheckResult $script:results
        $script:scopes = Get-EvaluatedScope -CheckResult $script:results
    }

    It '初回検知は即時通知する' {
        $plan = Get-NotificationPlan -Alert $script:alerts -PreviousState @{} -Now $script:t0 -EvaluatedScope $script:scopes

        @($plan.New).Count | Should -Be 2
        @($plan.Renotify).Count | Should -Be 0
        @($plan.Suppressed).Count | Should -Be 0
    }

    It '抑制間隔内の継続は通知しない' {
        $first = Get-NotificationPlan -Alert $script:alerts -PreviousState @{} -Now $script:t0 -EvaluatedScope $script:scopes
        $second = Get-NotificationPlan -Alert $script:alerts -PreviousState $first.NextState `
            -Now $script:t0.AddMinutes(15) -RenotifyIntervalHours 6 -EvaluatedScope $script:scopes

        @($second.New).Count | Should -Be 0
        @($second.Renotify).Count | Should -Be 0
        @($second.Suppressed).Count | Should -Be 2
    }

    It '抑制間隔を過ぎたら再通知する' {
        $first = Get-NotificationPlan -Alert $script:alerts -PreviousState @{} -Now $script:t0 -EvaluatedScope $script:scopes
        $later = Get-NotificationPlan -Alert $script:alerts -PreviousState $first.NextState `
            -Now $script:t0.AddHours(6) -RenotifyIntervalHours 6 -EvaluatedScope $script:scopes

        @($later.Renotify).Count | Should -Be 2
        @($later.Suppressed).Count | Should -Be 0
    }

    It '深刻度が上がったら抑制間隔内でも即時通知する' {
        $first = Get-NotificationPlan -Alert $script:alerts -PreviousState @{} -Now $script:t0 -EvaluatedScope $script:scopes

        $escalated = ConvertTo-MonitorAlert -CheckResult (New-TestAlertSet -DiskLevel 'Critical')
        $second = Get-NotificationPlan -Alert $escalated -PreviousState $first.NextState `
            -Now $script:t0.AddMinutes(10) -RenotifyIntervalHours 6 -EvaluatedScope $script:scopes

        @($second.Renotify).Count | Should -Be 1
        $second.Renotify[0].CheckId | Should -Be 'DSK'
        @($second.Suppressed).Count | Should -Be 1
    }

    It '通知回数が積み上がる' {
        $first = Get-NotificationPlan -Alert $script:alerts -PreviousState @{} -Now $script:t0 -EvaluatedScope $script:scopes
        $second = Get-NotificationPlan -Alert $script:alerts -PreviousState $first.NextState `
            -Now $script:t0.AddHours(7) -RenotifyIntervalHours 6 -EvaluatedScope $script:scopes

        $second.NextState['YAYOI-SV|DSK|D:'].notifyCount | Should -Be 2
    }

    It '初回検知時刻は再通知しても引き継がれる' {
        $first = Get-NotificationPlan -Alert $script:alerts -PreviousState @{} -Now $script:t0 -EvaluatedScope $script:scopes
        $second = Get-NotificationPlan -Alert $script:alerts -PreviousState $first.NextState `
            -Now $script:t0.AddHours(7) -EvaluatedScope $script:scopes

        $second.NextState['YAYOI-SV|DSK|D:'].firstDetectedOn |
            Should -Be $first.NextState['YAYOI-SV|DSK|D:'].firstDetectedOn
    }
}

Describe 'Get-NotificationPlan（解消判定）' {

    BeforeAll {
        $script:results = New-TestAlertSet
        $script:alerts = ConvertTo-MonitorAlert -CheckResult $script:results
        $script:scopes = Get-EvaluatedScope -CheckResult $script:results
        $script:first = Get-NotificationPlan -Alert $script:alerts -PreviousState @{} -Now $script:t0 -EvaluatedScope $script:scopes
    }

    It '異常が消えたら解消として通知する' {
        $recovered = @(
            (New-CheckResult -CheckId 'SVC' -CheckName 'サービス稼働' -TargetName 'YAYOI-SV' -Status 'OK'),
            (New-CheckResult -CheckId 'DSK' -CheckName 'ディスク空き容量' -TargetName 'YAYOI-SV' -Status 'OK')
        )
        $plan = Get-NotificationPlan -Alert (ConvertTo-MonitorAlert -CheckResult $recovered) `
            -PreviousState $script:first.NextState -Now $script:t0.AddHours(1) `
            -EvaluatedScope (Get-EvaluatedScope -CheckResult $recovered)

        @($plan.Resolved).Count | Should -Be 2
        $plan.NextState.Count | Should -Be 0
    }

    It '収集に失敗したチェックのアラートを解消と誤判定しない' {
        # 監視対象に到達できないときに「解消しました」を送るのが最悪の誤報。
        $unreachable = @(
            (New-UnknownCheckResult -CheckId 'SVC' -CheckName 'サービス稼働' -TargetName 'YAYOI-SV' -Reason 'WinRM 接続不可'),
            (New-UnknownCheckResult -CheckId 'DSK' -CheckName 'ディスク空き容量' -TargetName 'YAYOI-SV' -Reason 'WinRM 接続不可')
        )
        $plan = Get-NotificationPlan -Alert (ConvertTo-MonitorAlert -CheckResult $unreachable) `
            -PreviousState $script:first.NextState -Now $script:t0.AddHours(1) `
            -EvaluatedScope (Get-EvaluatedScope -CheckResult $unreachable)

        @($plan.Resolved).Count | Should -Be 0
        $plan.NextState.Keys | Should -Contain 'YAYOI-SV|DSK|D:'
    }

    It '解消通知を無効にすると Resolved を返さない' {
        $recovered = @((New-CheckResult -CheckId 'SVC' -CheckName 'サービス稼働' -TargetName 'YAYOI-SV' -Status 'OK'))
        $plan = Get-NotificationPlan -Alert @() -PreviousState $script:first.NextState `
            -Now $script:t0.AddHours(1) -NotifyOnResolve $false `
            -EvaluatedScope (Get-EvaluatedScope -CheckResult $recovered)

        @($plan.Resolved).Count | Should -Be 0
    }
}

Describe 'Get-NotificationPlan（通知レベルの下限）' {

    It 'minimumLevel を Critical にすると Warning は通知しない' {
        $results = New-TestAlertSet -DiskLevel 'Warning'
        $plan = Get-NotificationPlan -Alert (ConvertTo-MonitorAlert -CheckResult $results) `
            -PreviousState @{} -Now $script:t0 -MinimumLevel 'Critical' `
            -EvaluatedScope (Get-EvaluatedScope -CheckResult $results)

        @($plan.New).Count | Should -Be 1
        $plan.New[0].CheckId | Should -Be 'SVC'
    }

    It '既定（Warning）では Unknown も通知対象になる' {
        $unknown = @((New-UnknownCheckResult -CheckId 'DSK' -CheckName 'ディスク' -TargetName 'SV' -Reason '接続不可'))
        $plan = Get-NotificationPlan -Alert (ConvertTo-MonitorAlert -CheckResult $unknown) `
            -PreviousState @{} -Now $script:t0 -EvaluatedScope @()

        @($plan.New).Count | Should -Be 1
    }
}

Describe 'Format-AlertSubject / Format-AlertBody' {

    It '件名に最も深刻なレベルと件数が入る' {
        $alerts = ConvertTo-MonitorAlert -CheckResult (New-TestAlertSet)
        $subject = Format-AlertSubject -Alert $alerts -Prefix '[監視]'

        $subject | Should -Match '^\[監視\]'
        $subject | Should -Match 'Critical'
        $subject | Should -Match '2 件'
    }

    It '異常が無く解消のみなら件名は解消になる' {
        $resolved = @([pscustomobject]@{ TargetName = 'SV'; CheckName = 'ディスク'; Title = 'x'; FirstDetectedOn = '' })
        Format-AlertSubject -Alert @() -Resolved $resolved -Prefix '[監視]' | Should -Match '解消 1 件'
    }

    It '本文に対象・チェック名・内容が含まれる' {
        $alerts = ConvertTo-MonitorAlert -CheckResult (New-TestAlertSet)
        $body = Format-AlertBody -Alert $alerts -Now $script:t0

        $body | Should -Match 'YAYOI-SV'
        $body | Should -Match 'サービス稼働'
        $body | Should -Match 'Critical'
    }

    It '掲載上限を超えた分は件数のみ表示する' {
        $many = @()
        foreach ($index in 1..10) {
            $many += New-CheckResult -CheckId 'DSK' -CheckName 'ディスク' -TargetName ('SV{0}' -f $index) `
                -Findings @((New-CheckFinding -Key 'D:' -Level 'Warning' -Title ('空き不足 {0}' -f $index)))
        }
        $body = Format-AlertBody -Alert (ConvertTo-MonitorAlert -CheckResult $many) -MaxItems 3 -Now $script:t0
        $body | Should -Match '他 7 件'
    }
}

Describe 'Format-DailySummaryBody' {

    It '異常がゼロでもサマリを生成する' {
        # 「今日も届いた＝監視は生きている」を成立させるため、正常時も必ず本文を作る。
        $results = @(
            (New-CheckResult -CheckId 'SVC' -CheckName 'サービス稼働' -TargetName 'YAYOI-SV' -Status 'OK' -Summary '全サービス稼働中'),
            (New-CheckResult -CheckId 'DSK' -CheckName 'ディスク空き容量' -TargetName 'HV-HOST' -Status 'OK' -Summary '閾値内')
        )
        $body = Format-DailySummaryBody -CheckResult $results -OpenAlert @() -Now $script:t0

        $body | Should -Match '総合判定'
        $body | Should -Match 'YAYOI-SV'
        $body | Should -Match 'HV-HOST'
        $body | Should -Match '未解消の異常 \(0 件\)'
        $body | Should -Match '異常の有無にかかわらず毎日送信'
    }

    It '未解消の異常を一覧に出す' {
        $open = @([pscustomobject]@{
                level           = 'Critical'
                target          = 'YAYOI-SV'
                checkName       = 'バックアップ鮮度'
                title           = 'バックアップが更新されていません'
                firstDetectedOn = '2026-08-10T02:00:00'
                notifyCount     = 12
            })
        $body = Format-DailySummaryBody -CheckResult @() -OpenAlert $open -Now $script:t0

        $body | Should -Match '未解消の異常 \(1 件\)'
        $body | Should -Match 'バックアップ鮮度'
        $body | Should -Match '通知回数: 12'
    }

    It '総合判定は最も深刻なチェック結果になる' {
        $results = @(
            (New-CheckResult -CheckId 'SVC' -CheckName 'サービス' -TargetName 'SV' -Status 'OK'),
            (New-CheckResult -CheckId 'DSK' -CheckName 'ディスク' -TargetName 'SV' `
                    -Findings @((New-CheckFinding -Key 'C:' -Level 'Critical' -Title 'x')))
        )
        $body = Format-DailySummaryBody -CheckResult $results -OpenAlert @() -Now $script:t0
        $body | Should -Match '総合判定  : Critical'
    }
}
