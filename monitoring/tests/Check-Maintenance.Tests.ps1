#Requires -Version 5.1
<#
    DEF / NTP / EVT / WU / CAL / VM の判定ロジックのテスト。
    いずれも外部依存から分離した純粋関数をモックデータで検証する。
#>

BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelper.ps1')
    Import-MonitorTestModule -Name @(
        'Check-Defender.psm1'
        'Check-TimeSync.psm1'
        'Check-EventLog.psm1'
        'Check-WindowsUpdate.psm1'
        'Check-RdsLicense.psm1'
        'Check-HyperV.psm1'
    )

    $script:now = [datetime]'2026-08-17T09:00:00'
}

Describe 'DEF: Get-DefenderCheckFinding' {

    BeforeAll {
        $script:defenderSetting = @{
            requireRealTimeProtection = $true
            requireTamperProtection   = $true
            signatureWarningAgeDays   = 3
            signatureCriticalAgeDays  = 7
        }

        function New-TestDefenderStatus {
            [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
                Justification = 'テスト用のモックデータを生成して返すだけのファクトリ関数。')]
            [CmdletBinding()]
            [OutputType([psobject])]
            param(
                [Parameter()] [bool] $RealTime = $true,
                [Parameter()] [bool] $Antivirus = $true,
                [Parameter()] [bool] $Tamper = $true,
                [Parameter()] [AllowNull()] $SignatureUpdated = $null
            )
            if ($null -eq $SignatureUpdated) { $SignatureUpdated = $script:now.AddHours(-6) }
            return [pscustomobject]@{
                RealTimeProtectionEnabled     = $RealTime
                AntivirusEnabled              = $Antivirus
                TamperProtectionEnabled       = $Tamper
                AntivirusSignatureLastUpdated = $SignatureUpdated
                AntivirusSignatureVersion     = '1.400.0.0'
            }
        }
    }

    It '正常な状態では検知事項を出さない' {
        @(Get-DefenderCheckFinding -Status (New-TestDefenderStatus) -Setting $script:defenderSetting -Now $script:now).Count |
            Should -Be 0
    }

    It 'リアルタイム保護が無効なら Critical' {
        $findings = @(Get-DefenderCheckFinding -Status (New-TestDefenderStatus -RealTime $false) `
                -Setting $script:defenderSetting -Now $script:now)
        ($findings | Where-Object { $_.Key -eq 'realtime' }).Level | Should -Be 'Critical'
    }

    It '改ざん防止が無効なら Warning' {
        $findings = @(Get-DefenderCheckFinding -Status (New-TestDefenderStatus -Tamper $false) `
                -Setting $script:defenderSetting -Now $script:now)
        ($findings | Where-Object { $_.Key -eq 'tamper' }).Level | Should -Be 'Warning'
    }

    It '定義が <Days> 日前なら <Expected>' -ForEach @(
        @{ Days = 0; Expected = 'なし' }
        @{ Days = 2; Expected = 'なし' }
        @{ Days = 3; Expected = 'Warning' }
        @{ Days = 6; Expected = 'Warning' }
        @{ Days = 7; Expected = 'Critical' }
        @{ Days = 400; Expected = 'Critical' }
    ) {
        $status = New-TestDefenderStatus -SignatureUpdated $script:now.AddDays(-1 * $Days)
        $finding = @(Get-DefenderCheckFinding -Status $status -Setting $script:defenderSetting -Now $script:now) |
            Where-Object { $_.Key -eq 'signature' }

        if ($Expected -eq 'なし') { $finding | Should -BeNullOrEmpty }
        else { $finding.Level | Should -Be $Expected }
    }

    It '定義更新日が取得できない場合は Unknown' {
        $status = [pscustomobject]@{
            RealTimeProtectionEnabled     = $true
            AntivirusEnabled              = $true
            TamperProtectionEnabled       = $true
            AntivirusSignatureLastUpdated = $null
        }
        $finding = @(Get-DefenderCheckFinding -Status $status -Setting $script:defenderSetting -Now $script:now) |
            Where-Object { $_.Key -eq 'signature' }
        $finding.Level | Should -Be 'Unknown'
    }
}

Describe 'NTP: Test-FreeRunningSource' {

    It '<Source> / Type=<Type> は同期していないと判定される: <Expected>' -ForEach @(
        @{ Source = 'Free-running System Clock'; Type = 'NTP'; Expected = $true }
        @{ Source = 'Local CMOS Clock'; Type = 'NTP'; Expected = $true }
        @{ Source = ''; Type = 'NTP'; Expected = $true }
        @{ Source = 'ntp.nict.jp'; Type = 'NoSync'; Expected = $true }
        @{ Source = 'ntp.nict.jp'; Type = 'NTP'; Expected = $false }
        @{ Source = '192.168.252.1'; Type = 'NTP'; Expected = $false }
    ) {
        Test-FreeRunningSource -Source $Source -ConfiguredType $Type | Should -Be $Expected
    }
}

Describe 'NTP: Get-StripChartOffsetSecond' {

    It 'w32tm /stripchart の出力からオフセットを取り出す' {
        $output = @(
            'Tracking ntp.nict.jp [133.243.238.163:123].',
            'The current time is 2026/08/17 9:00:00.',
            '09:00:00, +00.0123456s'
        )
        Get-StripChartOffsetSecond -OutputLine $output | Should -BeGreaterThan 0.0123
    }

    It '負のオフセットも取り出せる' {
        Get-StripChartOffsetSecond -OutputLine @('09:00:00, -88.4500000s') | Should -Be -88.45
    }

    It '複数サンプルなら最後の値を採用する' {
        Get-StripChartOffsetSecond -OutputLine @('09:00:00, +01.0000000s', '09:00:01, +02.0000000s') | Should -Be 2.0
    }

    It '数値が見つからなければ $null を返す' {
        Get-StripChartOffsetSecond -OutputLine @('エラー: コンピューターに到達できません。') | Should -BeNullOrEmpty
        Get-StripChartOffsetSecond -OutputLine @() | Should -BeNullOrEmpty
    }
}

Describe 'NTP: Get-TimeSyncFinding' {

    BeforeAll {
        $script:ntpSetting = @{
            forbidFreeRunning     = $true
            warningOffsetSeconds  = 5
            criticalOffsetSeconds = 30
            maxSyncAgeHours       = 48
        }

        function New-TestTimeSyncData {
            [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
                Justification = 'テスト用のモックデータを生成して返すだけのファクトリ関数。')]
            [CmdletBinding()]
            [OutputType([psobject])]
            param(
                [Parameter()] [string] $Source = 'ntp.nict.jp',
                [Parameter()] [string] $Type = 'NTP',
                [Parameter()] [AllowNull()] $LastSync = $null,
                [Parameter()] [switch] $NoLastSync,
                [Parameter()] [AllowNull()] $Offset = 0.05,
                [Parameter()] [string] $OffsetError = ''
            )
            if ($null -eq $LastSync -and -not $NoLastSync) { $LastSync = $script:now.AddHours(-2) }
            return [pscustomobject]@{
                Source          = $Source
                ConfiguredType  = $Type
                NtpServer       = 'ntp.nict.jp,0x9'
                LastSyncTime    = $LastSync
                OffsetSeconds   = $Offset
                OffsetReference = 'ntp.nict.jp'
                OffsetError     = $OffsetError
            }
        }
    }

    It '正常な状態では検知事項を出さない' {
        @(Get-TimeSyncFinding -Data (New-TestTimeSyncData) -Setting $script:ntpSetting -Now $script:now).Count |
            Should -Be 0
    }

    It 'Free-running なら Critical' {
        $findings = @(Get-TimeSyncFinding -Data (New-TestTimeSyncData -Source 'Free-running System Clock') `
                -Setting $script:ntpSetting -Now $script:now)
        ($findings | Where-Object { $_.Key -eq 'source' }).Level | Should -Be 'Critical'
    }

    It '実測 1 分 28 秒のずれを Critical と判定する' {
        # 今回の障害の実測値。
        $findings = @(Get-TimeSyncFinding -Data (New-TestTimeSyncData -Offset 88.0) `
                -Setting $script:ntpSetting -Now $script:now)
        ($findings | Where-Object { $_.Key -eq 'offset' }).Level | Should -Be 'Critical'
    }

    It 'ずれが <Offset> 秒なら <Expected>' -ForEach @(
        @{ Offset = 0.5; Expected = 'なし' }
        @{ Offset = 4.9; Expected = 'なし' }
        @{ Offset = 5.0; Expected = 'Warning' }
        @{ Offset = -5.0; Expected = 'Warning' }
        @{ Offset = 30.0; Expected = 'Critical' }
        @{ Offset = -88.0; Expected = 'Critical' }
    ) {
        $finding = @(Get-TimeSyncFinding -Data (New-TestTimeSyncData -Offset $Offset) `
                -Setting $script:ntpSetting -Now $script:now) | Where-Object { $_.Key -eq 'offset' }

        if ($Expected -eq 'なし') { $finding | Should -BeNullOrEmpty }
        else { $finding.Level | Should -Be $Expected }
    }

    It '同期成功の記録が無ければ Warning' {
        $findings = @(Get-TimeSyncFinding -Data (New-TestTimeSyncData -NoLastSync) `
                -Setting $script:ntpSetting -Now $script:now)
        ($findings | Where-Object { $_.Key -eq 'lastsync' }).Level | Should -Be 'Warning'
    }

    It 'オフセットを測定できない場合は Unknown' {
        $findings = @(Get-TimeSyncFinding -Data (New-TestTimeSyncData -Offset $null -OffsetError '到達できません') `
                -Setting $script:ntpSetting -Now $script:now)
        ($findings | Where-Object { $_.Key -eq 'offset' }).Level | Should -Be 'Unknown'
    }
}

Describe 'EVT: Test-EventIgnored' {

    BeforeAll {
        $script:sampleEvent = [pscustomobject]@{
            LogName      = 'System'
            Id           = 10016
            Level        = 2
            ProviderName = 'Microsoft-Windows-DistributedCOM'
            TimeCreated  = $script:now
            Message      = 'DCOM の権限設定'
        }
    }

    It 'イベント ID とログ名が一致すれば除外する' {
        $rules = @([pscustomobject]@{ eventId = 10016; logName = 'System'; providerName = $null })
        Test-EventIgnored -LogEntry $script:sampleEvent -IgnoreRule $rules | Should -BeTrue
    }

    It 'ログ名が違えば除外しない' {
        $rules = @([pscustomobject]@{ eventId = 10016; logName = 'Application'; providerName = $null })
        Test-EventIgnored -LogEntry $script:sampleEvent -IgnoreRule $rules | Should -BeFalse
    }

    It 'プロバイダ名はワイルドカードで比較する' {
        $rules = @([pscustomobject]@{ eventId = 10016; logName = $null; providerName = 'Microsoft-Windows-Distributed*' })
        Test-EventIgnored -LogEntry $script:sampleEvent -IgnoreRule $rules | Should -BeTrue
    }

    It '条件が空の除外ルールは全件除外にせず無視する' {
        # 設定ミスで監視が丸ごと無効化される事故を防ぐ。
        $rules = @([pscustomobject]@{ eventId = $null; logName = $null; providerName = $null })
        Test-EventIgnored -LogEntry $script:sampleEvent -IgnoreRule $rules | Should -BeFalse
    }

    It '除外ルールが無ければ除外しない' {
        Test-EventIgnored -LogEntry $script:sampleEvent -IgnoreRule @() | Should -BeFalse
    }
}

Describe 'EVT: Get-EventLogFinding' {

    BeforeAll {
        $script:evtSetting = @{
            warningCount  = 1
            criticalCount = 20
            ignore        = @()
        }

        function New-TestEventEntry {
            [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
                Justification = 'テスト用のモックデータを生成して返すだけのファクトリ関数。')]
            [CmdletBinding()]
            [OutputType([psobject])]
            param(
                [Parameter()] [string] $LogName = 'System',
                [Parameter()] [int] $Id = 7031,
                [Parameter()] [int] $Level = 2,
                [Parameter()] [string] $ProviderName = 'Service Control Manager',
                [Parameter()] [AllowNull()] $TimeCreated = $null
            )
            if ($null -eq $TimeCreated) { $TimeCreated = $script:now }
            return [pscustomobject]@{
                LogName      = $LogName
                Id           = $Id
                Level        = $Level
                ProviderName = $ProviderName
                TimeCreated  = $TimeCreated
                Message      = 'サービスが予期せず終了しました。'
            }
        }
    }

    It 'イベントが無ければ検知事項なし' {
        @(Get-EventLogFinding -LogEntry @() -Setting $script:evtSetting).Count | Should -Be 0
    }

    It '同じプロバイダ・ID のイベントは 1 件にまとめる' {
        $events = @(1..5 | ForEach-Object { New-TestEventEntry })
        $findings = @(Get-EventLogFinding -LogEntry $events -Setting $script:evtSetting)

        $findings.Count | Should -Be 1
        $findings[0].Value | Should -Be 5
        $findings[0].Title | Should -Match '5 件'
    }

    It '件数が criticalCount 以上なら Critical' {
        $events = @(1..25 | ForEach-Object { New-TestEventEntry })
        @(Get-EventLogFinding -LogEntry $events -Setting $script:evtSetting)[0].Level | Should -Be 'Critical'
    }

    It 'レベル 1（重大）は件数が少なくても Critical' {
        $events = @((New-TestEventEntry -Level 1))
        @(Get-EventLogFinding -LogEntry $events -Setting $script:evtSetting)[0].Level | Should -Be 'Critical'
    }

    It '除外条件に該当するイベントは検知しない' {
        $setting = @{
            warningCount  = 1
            criticalCount = 20
            ignore        = @([pscustomobject]@{ eventId = 7031; logName = 'System'; providerName = $null })
        }
        @(Get-EventLogFinding -LogEntry @((New-TestEventEntry)) -Setting $setting).Count | Should -Be 0
    }

    It '異なるプロバイダ・ID は別の検知事項になる' {
        $events = @(
            (New-TestEventEntry -Id 7031),
            (New-TestEventEntry -Id 7034),
            (New-TestEventEntry -LogName 'Application' -Id 1000 -ProviderName 'Application Error')
        )
        @(Get-EventLogFinding -LogEntry $events -Setting $script:evtSetting).Count | Should -Be 3
    }
}

Describe 'WU: Get-WindowsUpdateLevel' {

    It '最終適用から <Days> 日で <Expected>' -ForEach @(
        @{ Days = 0; Expected = 'OK' }
        @{ Days = 29; Expected = 'OK' }
        @{ Days = 30; Expected = 'Warning' }
        @{ Days = 44; Expected = 'Warning' }
        @{ Days = 45; Expected = 'Critical' }
        @{ Days = 2680; Expected = 'Critical' }
    ) {
        Get-WindowsUpdateLevel -LastInstalledOn $script:now.AddDays(-1 * $Days) -Now $script:now `
            -WarningAgeDays 30 -CriticalAgeDays 45 | Should -Be $Expected
    }

    It '7 年 4 か月未適用は Critical' {
        Get-WindowsUpdateLevel -LastInstalledOn $script:now.AddYears(-7).AddMonths(-4) -Now $script:now |
            Should -Be 'Critical'
    }

    It '最終適用日が取得できなければ Unknown' {
        Get-WindowsUpdateLevel -LastInstalledOn $null -Now $script:now | Should -Be 'Unknown'
    }
}

Describe 'WU: Get-WindowsUpdateFinding' {

    It '取得できない場合は Unknown の検知事項を出す（黙って通さない）' {
        $data = [pscustomobject]@{ LastInstalledOn = $null; LastTitle = ''; Source = '取得できず' }
        $findings = @(Get-WindowsUpdateFinding -Data $data -Now $script:now)

        $findings.Count | Should -Be 1
        $findings[0].Level | Should -Be 'Unknown'
    }

    It '本文に取得元を書く（判断材料を残すため）' {
        $data = [pscustomobject]@{
            LastInstalledOn = $script:now.AddDays(-100)
            LastTitle       = 'KB5000000'
            Source          = '更新履歴 (Microsoft.Update.Session)'
        }
        @(Get-WindowsUpdateFinding -Data $data -Now $script:now)[0].Message | Should -Match '更新履歴'
    }
}

Describe 'CAL: Get-RdsLicenseLevel' {

    It '総数 20 / 残 <Available> なら <Expected>' -ForEach @(
        @{ Available = 20; Expected = 'OK' }
        @{ Available = 5; Expected = 'OK' }
        @{ Available = 4; Expected = 'OK' }
        @{ Available = 3; Expected = 'Warning' }
        @{ Available = 2; Expected = 'Warning' }
        @{ Available = 1; Expected = 'Critical' }
        @{ Available = 0; Expected = 'Critical' }
    ) {
        Get-RdsLicenseLevel -TotalLicenses 20 -AvailableLicenses $Available `
            -WarningRemainingPercent 20 -CriticalRemainingPercent 10 -MinRemainingCount 2 | Should -Be $Expected
    }

    It '残数の実数が下限を割ったら割合に関係なく Critical' {
        # 母数が大きくても、残り 1 本なら次の 1 台が繋がらない。
        Get-RdsLicenseLevel -TotalLicenses 1000 -AvailableLicenses 1 `
            -WarningRemainingPercent 20 -CriticalRemainingPercent 10 -MinRemainingCount 2 | Should -Be 'Critical'
    }

    It '総数 0 は Unknown' {
        Get-RdsLicenseLevel -TotalLicenses 0 -AvailableLicenses 0 | Should -Be 'Unknown'
    }
}

Describe 'CAL: Get-RdsLicenseFinding' {

    BeforeAll {
        $script:calSetting = @{
            warningRemainingPercent  = 20
            criticalRemainingPercent = 10
            minRemainingCount        = 2
            includeKeyPackTypes      = @()
        }
    }

    It '複数キーパックを合算して判定する' {
        $packs = @(
            [pscustomobject]@{ KeyPackId = 1; KeyPackType = 2; TotalLicenses = 10; IssuedLicenses = 9; AvailableLicenses = 1 },
            [pscustomobject]@{ KeyPackId = 2; KeyPackType = 2; TotalLicenses = 10; IssuedLicenses = 10; AvailableLicenses = 0 }
        )
        $findings = @(Get-RdsLicenseFinding -KeyPack $packs -Setting $script:calSetting)

        $findings.Count | Should -Be 1
        $findings[0].Level | Should -Be 'Critical'
        $findings[0].Message | Should -Match '総数 20'
    }

    It '余裕があれば検知事項なし' {
        $packs = @([pscustomobject]@{ KeyPackId = 1; KeyPackType = 2; TotalLicenses = 20; IssuedLicenses = 5; AvailableLicenses = 15 })
        @(Get-RdsLicenseFinding -KeyPack $packs -Setting $script:calSetting).Count | Should -Be 0
    }

    It 'キーパックが取得できなければ Unknown' {
        @(Get-RdsLicenseFinding -KeyPack @() -Setting $script:calSetting)[0].Level | Should -Be 'Unknown'
    }

    It '総数 0 のキーパックは集計から除く' {
        $packs = @(
            [pscustomobject]@{ KeyPackId = 1; KeyPackType = 4; TotalLicenses = 0; IssuedLicenses = 0; AvailableLicenses = 0 },
            [pscustomobject]@{ KeyPackId = 2; KeyPackType = 2; TotalLicenses = 20; IssuedLicenses = 2; AvailableLicenses = 18 }
        )
        @(Get-RdsLicenseFinding -KeyPack $packs -Setting $script:calSetting).Count | Should -Be 0
    }

    It 'includeKeyPackTypes で集計対象を絞れる' {
        $packs = @(
            [pscustomobject]@{ KeyPackId = 1; KeyPackType = 4; TotalLicenses = 100; IssuedLicenses = 0; AvailableLicenses = 100 },
            [pscustomobject]@{ KeyPackId = 2; KeyPackType = 2; TotalLicenses = 20; IssuedLicenses = 19; AvailableLicenses = 1 }
        )
        $setting = @{
            warningRemainingPercent  = 20
            criticalRemainingPercent = 10
            minRemainingCount        = 2
            includeKeyPackTypes      = @(2)
        }
        @(Get-RdsLicenseFinding -KeyPack $packs -Setting $setting)[0].Level | Should -Be 'Critical'
    }
}

Describe 'VM: Get-HyperVFinding' {

    BeforeAll {
        $script:vmSetting = @{
            expectedRunningVms        = @('BASTION-VM')
            warnOnAnyCheckpoint       = $true
            checkpointCriticalAgeDays = 7
            minHostFreeMemoryGB       = 4
        }

        function New-TestHyperVData {
            [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
                Justification = 'テスト用のモックデータを生成して返すだけのファクトリ関数。')]
            [CmdletBinding()]
            [OutputType([psobject])]
            param(
                [Parameter()] [string] $State = 'Running',
                [Parameter()] [AllowNull()] [psobject[]] $Checkpoints = @(),
                [Parameter()] [double] $HostFreeGB = 16,
                [Parameter()] [string] $VmName = 'BASTION-VM'
            )
            return [pscustomobject]@{
                VirtualMachines     = @([pscustomobject]@{
                        Name            = $VmName
                        State           = $State
                        MemoryAssigned  = [long] (8GB)
                        CPUUsagePercent = 5
                    })
                Checkpoints         = $Checkpoints
                HostFreeMemoryBytes = [long] ($HostFreeGB * 1GB)
            }
        }
    }

    It '正常な状態では検知事項を出さない' {
        @(Get-HyperVFinding -Data (New-TestHyperVData) -Setting $script:vmSetting -Now $script:now).Count | Should -Be 0
    }

    It '稼働すべき VM が停止していたら Critical' {
        $findings = @(Get-HyperVFinding -Data (New-TestHyperVData -State 'Off') -Setting $script:vmSetting -Now $script:now)
        ($findings | Where-Object { $_.Key -like 'vm/*state' }).Level | Should -Be 'Critical'
    }

    It '稼働すべき VM が存在しなければ Critical' {
        $findings = @(Get-HyperVFinding -Data (New-TestHyperVData -VmName 'OTHER-VM') -Setting $script:vmSetting -Now $script:now)
        ($findings | Where-Object { $_.Key -like '*missing' }).Level | Should -Be 'Critical'
    }

    It 'チェックポイントが残っていたら Warning' {
        $checkpoints = @([pscustomobject]@{ VMName = 'BASTION-VM'; Name = '適用前'; CreationTime = $script:now.AddDays(-1); Type = 'Standard' })
        $findings = @(Get-HyperVFinding -Data (New-TestHyperVData -Checkpoints $checkpoints) -Setting $script:vmSetting -Now $script:now)

        $findings.Count | Should -Be 1
        $findings[0].Level | Should -Be 'Warning'
    }

    It '古いチェックポイントは Critical' {
        $checkpoints = @([pscustomobject]@{ VMName = 'BASTION-VM'; Name = '適用前'; CreationTime = $script:now.AddDays(-30); Type = 'Standard' })
        @(Get-HyperVFinding -Data (New-TestHyperVData -Checkpoints $checkpoints) -Setting $script:vmSetting -Now $script:now)[0].Level |
            Should -Be 'Critical'
    }

    It 'warnOnAnyCheckpoint が false ならチェックポイントを通知しない' {
        $setting = @{ expectedRunningVms = @('BASTION-VM'); warnOnAnyCheckpoint = $false; minHostFreeMemoryGB = 4 }
        $checkpoints = @([pscustomobject]@{ VMName = 'BASTION-VM'; Name = '適用前'; CreationTime = $script:now.AddDays(-30) })
        @(Get-HyperVFinding -Data (New-TestHyperVData -Checkpoints $checkpoints) -Setting $setting -Now $script:now).Count |
            Should -Be 0
    }

    It 'ホストの空きメモリ不足を検知する' {
        $findings = @(Get-HyperVFinding -Data (New-TestHyperVData -HostFreeGB 2) -Setting $script:vmSetting -Now $script:now)
        ($findings | Where-Object { $_.Key -eq 'host/memory' }).Level | Should -Be 'Warning'
    }
}
