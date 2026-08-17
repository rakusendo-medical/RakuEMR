#Requires -Version 5.1

BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelper.ps1')
    Import-MonitorTestModule -Name 'Dashboard.psm1'

    $script:now = [datetime]'2026-08-17T09:00:00'

    $script:results = @(
        (New-CheckResult -CheckId 'SVC' -CheckName 'サービス稼働' -TargetName 'YAYOI-SV' -Status 'OK' -Summary '全て稼働中'),
        (New-CheckResult -CheckId 'DSK' -CheckName 'ディスク空き容量' -TargetName 'YAYOI-SV' `
                -Findings @((New-CheckFinding -Key 'D:' -Level 'Warning' -Title '空き容量不足')) `
                -Metrics ([pscustomobject]@{ MinFreePercent = 15.2 }) `
                -Items @([pscustomobject]@{ DeviceID = 'D:'; VolumeName = 'データ'; FreePercent = 15.2; UsedPercent = 84.8; FreeText = '150.00 GB' })),
        (New-CheckResult -CheckId 'SVC' -CheckName 'サービス稼働' -TargetName 'BASTION-VM' `
                -Findings @((New-CheckFinding -Key 'TermService' -Level 'Critical' -Title 'サービス停止')))
    )
}

Describe 'ConvertTo-HtmlText' {

    It 'HTML の特殊文字をエスケープする' {
        ConvertTo-HtmlText -Text '<script>alert("x")</script>' |
            Should -Be '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    }

    It 'アンパサンドを二重エスケープしない順序で処理する' {
        ConvertTo-HtmlText -Text '<a & b>' | Should -Be '&lt;a &amp; b&gt;'
    }

    It '日本語はそのまま通す' {
        ConvertTo-HtmlText -Text 'D:\Backup\弥生' | Should -Be 'D:\Backup\弥生'
    }

    It 'null / 空文字でも例外にならない' {
        ConvertTo-HtmlText -Text $null | Should -Be ''
        ConvertTo-HtmlText -Text '' | Should -Be ''
    }
}

Describe 'Get-StatusPalette / New-StatusPillHtml' {

    It '状態ごとに異なる信号色を返す' {
        (Get-StatusPalette -Status 'OK').Color | Should -Not -Be (Get-StatusPalette -Status 'Critical').Color
        (Get-StatusPalette -Status 'Warning').Color | Should -Not -Be (Get-StatusPalette -Status 'Critical').Color
    }

    It 'Unknown と Skipped を区別する' {
        (Get-StatusPalette -Status 'Unknown').Label | Should -Not -Be (Get-StatusPalette -Status 'Skipped').Label
    }

    It '未知の状態でも例外にならない' {
        { Get-StatusPalette -Status 'なにか' } | Should -Not -Throw
    }

    It 'バッジに日本語ラベルが入る' {
        New-StatusPillHtml -Status 'Critical' | Should -Match '危険'
    }
}

Describe 'New-GaugeHtml' {

    It '割合を幅に反映する' {
        New-GaugeHtml -Percent 65.8 -Status 'Warning' -Caption '使用 65.8%' | Should -Match 'width:65.8%'
    }

    It '0〜100 の範囲に丸める' {
        New-GaugeHtml -Percent 150 -Caption 'x' | Should -Match 'width:100.0%'
        New-GaugeHtml -Percent -20 -Caption 'x' | Should -Match 'width:0.0%'
    }

    It '割合が無い測定値ではバーを描かない' {
        # 空のバーは 0% に見えてしまい誤読を招くため。
        $html = New-GaugeHtml -Percent $null -Caption '210 W'
        $html | Should -Not -Match 'gauge-bar'
        $html | Should -Match '210 W'
    }

    It 'キャプションをエスケープする' {
        New-GaugeHtml -Percent 50 -Caption '<b>x</b>' | Should -Match '&lt;b&gt;'
    }
}

Describe 'New-LineChartSvg' {

    It 'データ点から折れ線を生成する' {
        $points = @(1..5 | ForEach-Object { [pscustomobject]@{ Value = $_ * 10 } })
        $svg = New-LineChartSvg -Point $points -MinValue 0 -MaxValue 100

        $svg | Should -Match '<polyline'
        $svg | Should -Match 'viewBox'
    }

    It 'データが無ければその旨を表示する' {
        New-LineChartSvg -Point @() | Should -Match 'データがありません'
    }

    It '欠測（null）があると線を分割し、例外にならない' {
        $points = @(
            [pscustomobject]@{ Value = 10 },
            [pscustomobject]@{ Value = $null },
            [pscustomobject]@{ Value = 30 },
            [pscustomobject]@{ Value = 40 }
        )
        $svg = New-LineChartSvg -Point $points -MinValue 0 -MaxValue 100
        ([regex]::Matches($svg, '<polyline')).Count + ([regex]::Matches($svg, '<circle')).Count | Should -BeGreaterThan 1
    }

    It '全て同じ値でもゼロ除算にならない' {
        $points = @(1..3 | ForEach-Object { [pscustomobject]@{ Value = 50 } })
        { New-LineChartSvg -Point $points -MinValue $null -MaxValue $null } | Should -Not -Throw
    }

    It '外部リソースを参照しない' {
        $points = @([pscustomobject]@{ Value = 1 })
        New-LineChartSvg -Point $points | Should -Not -Match 'http'
    }
}

Describe 'New-StatusTimelineSvg' {

    It '状態の数だけ矩形を描く' {
        $svg = New-StatusTimelineSvg -Status @('OK', 'Warning', 'Critical', 'OK')
        ([regex]::Matches($svg, '<rect')).Count | Should -Be 4
    }

    It '履歴が無ければその旨を表示する' {
        New-StatusTimelineSvg -Status @() | Should -Match '履歴なし'
    }
}

Describe 'Add-MonitorHistorySample' {

    BeforeEach {
        $script:context = Initialize-MonitorTestContext
    }

    It '履歴にサンプルを追加する' {
        $samples = Add-MonitorHistorySample -CheckResult $script:results -HistoryDays 7 -Now $script:now -Confirm:$false
        @($samples).Count | Should -Be 1

        $entry = Get-ConfigValue -InputObject $samples[0].targets -Name 'YAYOI-SV'
        $entry.status | Should -Be 'Warning'
        $entry.minFreePercent | Should -Be 15.2
    }

    It '保持期間を超えた古いサンプルを捨てる' {
        $null = Add-MonitorHistorySample -CheckResult $script:results -HistoryDays 7 -Now $script:now.AddDays(-30) -Confirm:$false
        $samples = Add-MonitorHistorySample -CheckResult $script:results -HistoryDays 7 -Now $script:now -Confirm:$false

        @($samples).Count | Should -Be 1
    }

    It '保持期間内のサンプルは残す' {
        $null = Add-MonitorHistorySample -CheckResult $script:results -HistoryDays 7 -Now $script:now.AddDays(-2) -Confirm:$false
        $samples = Add-MonitorHistorySample -CheckResult $script:results -HistoryDays 7 -Now $script:now -Confirm:$false

        @($samples).Count | Should -Be 2
    }
}

Describe 'New-MonitorDashboardHtml' {

    BeforeAll {
        $script:history = @(
            [pscustomobject]@{
                timestamp = $script:now.AddHours(-3).ToString('o')
                targets   = [pscustomobject]@{
                    'YAYOI-SV' = [pscustomobject]@{ status = 'OK'; minFreePercent = 20.0; cpuPercent = 10.0 }
                }
            },
            [pscustomobject]@{
                timestamp = $script:now.ToString('o')
                targets   = [pscustomobject]@{
                    'YAYOI-SV' = [pscustomobject]@{ status = 'Warning'; minFreePercent = 15.2; cpuPercent = 12.0 }
                }
            }
        )

        $script:html = New-MonitorDashboardHtml -CheckResult $script:results -History $script:history `
            -OpenAlert @([pscustomobject]@{
                level = 'Critical'; target = 'BASTION-VM'; checkName = 'サービス稼働'
                title = 'サービス停止'; firstDetectedOn = '2026-08-16T09:00:00'; notifyCount = 3
            }) -Now $script:now -TargetOrder @('YAYOI-SV', 'BASTION-VM')
    }

    It '単一の完結した HTML を返す' {
        $script:html | Should -Match '^<!DOCTYPE html>'
        $script:html | Should -Match '</html>$'
        $script:html | Should -Match '<meta charset="utf-8">'
    }

    It '外部 CDN を一切参照しない' {
        # 外向き通信に制限がある可能性があるため、外部参照があってはならない。
        $script:html | Should -Not -Match 'https?://'
        $script:html | Should -Not -Match '<script'
        $script:html | Should -Not -Match '<link'
        $script:html | Should -Not -Match '@import'
        $script:html | Should -Not -Match 'src='
    }

    It '自動リロードを設定する' {
        $script:html | Should -Match 'http-equiv="refresh" content="300"'
    }

    It '自動リロードを 0 にすると meta refresh を出さない' {
        $html = New-MonitorDashboardHtml -CheckResult $script:results -RefreshSeconds 0 -Now $script:now
        $html | Should -Not -Match 'http-equiv="refresh"'
    }

    It '仕様どおりのブロックをすべて含む' {
        foreach ($block in @('サマリ', 'ハードウェア', 'リソース', 'データベース', 'バックアップ', 'ライセンス', '保守状態', '直近アラート')) {
            $script:html | Should -Match ([regex]::Escape($block))
        }
    }

    It '対象サーバ名を表示する' {
        $script:html | Should -Match 'YAYOI-SV'
        $script:html | Should -Match 'BASTION-VM'
    }

    It '未解消アラートを一覧に出す' {
        $script:html | Should -Match 'サービス停止'
        $script:html | Should -Match '2026-08-16 09:00'
    }

    It 'ダッシュボードが補助である旨を明記する' {
        # 画面があることを理由に通知を軽視させないため。
        $script:html | Should -Match 'この画面は補助です'
    }

    It '結果が空でも例外にならず HTML を返す' {
        { New-MonitorDashboardHtml -CheckResult @() -Now $script:now } | Should -Not -Throw
        (New-MonitorDashboardHtml -CheckResult @() -Now $script:now) | Should -Match '</html>$'
    }

    It '対象名に HTML 特殊文字が入っていてもエスケープされる' {
        $malicious = @((New-CheckResult -CheckId 'SVC' -CheckName 'サービス' -TargetName '<img onerror=x>' -Status 'OK'))
        $html = New-MonitorDashboardHtml -CheckResult $malicious -Now $script:now

        $html | Should -Not -Match '<img onerror'
        $html | Should -Match '&lt;img onerror'
    }
}

Describe 'Write-MonitorDashboard' {

    BeforeEach {
        $script:context = Initialize-MonitorTestContext
        $script:outputPath = Join-Path $script:context.StateDir 'status.html'
    }

    It '出力先が未設定なら生成しない' {
        $config = [pscustomobject]@{ enabled = $true; outputPath = '' }
        Write-MonitorDashboard -CheckResult $script:results -DashboardConfig $config -Confirm:$false | Should -Be ''
    }

    It '無効化されていれば生成しない' {
        $config = [pscustomobject]@{ enabled = $false; outputPath = $script:outputPath }
        Write-MonitorDashboard -CheckResult $script:results -DashboardConfig $config -Confirm:$false | Should -Be ''
        Test-Path -LiteralPath $script:outputPath | Should -BeFalse
    }

    It 'HTML を UTF-8 BOM 付きで書き出す' {
        $config = [pscustomobject]@{ enabled = $true; outputPath = $script:outputPath; refreshSeconds = 60; historyDays = 7 }
        $null = Write-MonitorDashboard -CheckResult $script:results -DashboardConfig $config -Now $script:now -Confirm:$false

        Test-Path -LiteralPath $script:outputPath | Should -BeTrue

        $bytes = [System.IO.File]::ReadAllBytes($script:outputPath)
        $bytes[0] | Should -Be 0xEF
        $bytes[1] | Should -Be 0xBB
        $bytes[2] | Should -Be 0xBF
    }
}
