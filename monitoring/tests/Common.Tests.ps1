#Requires -Version 5.1

BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelper.ps1')
    Import-MonitorTestModule
}

Describe 'Get-StatusRank / Get-WorstStatus' {

    It '状態レベルの重みは OK < Skipped < Warning < Unknown < Critical の順である' {
        # 収集できていない Unknown を Warning より重く扱うのは意図的な設計。
        (Get-StatusRank -Status 'OK') | Should -BeLessThan (Get-StatusRank -Status 'Skipped')
        (Get-StatusRank -Status 'Skipped') | Should -BeLessThan (Get-StatusRank -Status 'Warning')
        (Get-StatusRank -Status 'Warning') | Should -BeLessThan (Get-StatusRank -Status 'Unknown')
        (Get-StatusRank -Status 'Unknown') | Should -BeLessThan (Get-StatusRank -Status 'Critical')
    }

    It '未知の文字列は Unknown として扱う' {
        (Get-StatusRank -Status 'なにか') | Should -Be (Get-StatusRank -Status 'Unknown')
    }

    It '最も深刻な状態を返す' {
        Get-WorstStatus -Status @('OK', 'Warning', 'OK') | Should -Be 'Warning'
        Get-WorstStatus -Status @('OK', 'Warning', 'Critical') | Should -Be 'Critical'
        Get-WorstStatus -Status @('OK', 'Unknown', 'Warning') | Should -Be 'Unknown'
        Get-WorstStatus -Status @('OK', 'Skipped') | Should -Be 'Skipped'
    }

    It '空の入力は Unknown を返す' {
        Get-WorstStatus -Status @() | Should -Be 'Unknown'
    }
}

Describe 'Get-ConfigValue' {

    It 'PSCustomObject からプロパティを取得できる' {
        $object = [pscustomobject]@{ warningFreePercent = 20 }
        Get-ConfigValue -InputObject $object -Name 'warningFreePercent' | Should -Be 20
    }

    It 'Hashtable からもプロパティを取得できる' {
        Get-ConfigValue -InputObject @{ maxAgeHours = 24 } -Name 'maxAgeHours' | Should -Be 24
    }

    It '存在しないキーは既定値を返す' {
        Get-ConfigValue -InputObject ([pscustomobject]@{}) -Name 'missing' -Default 99 | Should -Be 99
    }

    It '入力が $null でも既定値を返す' {
        Get-ConfigValue -InputObject $null -Name 'missing' -Default 'x' | Should -Be 'x'
    }

    It '値が $null のキーは既定値を返す' {
        $object = [pscustomobject]@{ warningFreeGB = $null }
        Get-ConfigValue -InputObject $object -Name 'warningFreeGB' -Default 50 | Should -Be 50
    }
}

Describe 'ConvertTo-ConfigObject' {

    It '"__" で始まるキーをコメントとして除去する' {
        $source = [pscustomobject]@{
            '__note'   = 'これはコメント'
            'enabled'  = $true
            'nested'   = [pscustomobject]@{ '__memo' = 'x'; 'value' = 1 }
        }
        $result = ConvertTo-ConfigObject -InputObject $source

        $result.PSObject.Properties.Name | Should -Not -Contain '__note'
        $result.enabled | Should -BeTrue
        $result.nested.PSObject.Properties.Name | Should -Not -Contain '__memo'
        $result.nested.value | Should -Be 1
    }

    It '配列の中身も再帰的に処理する' {
        $source = @(
            [pscustomobject]@{ '__c' = 'x'; 'name' = 'a' },
            [pscustomobject]@{ '__c' = 'y'; 'name' = 'b' }
        )
        $result = ConvertTo-ConfigObject -InputObject $source

        @($result).Count | Should -Be 2
        $result[1].name | Should -Be 'b'
        $result[1].PSObject.Properties.Name | Should -Not -Contain '__c'
    }
}

Describe 'Import-MonitorConfig（設定サンプル）' {

    BeforeAll {
        $script:sampleConfig = Import-MonitorConfig -Path (Join-Path (Get-MonitoringRoot) 'config.sample.json')
    }

    It '設定サンプルが読み込める' {
        $script:sampleConfig | Should -Not -BeNullOrEmpty
    }

    It '監視対象が 3 台（弥生 / Hyper-V ホスト / 踏み台）定義されている' {
        # ホスト OS を対象から外さないこと。ホストが未パッチだとゲストが無事でも意味がない。
        @($script:sampleConfig.targets).Count | Should -Be 3
        @($script:sampleConfig.targets | ForEach-Object { $_.name }) | Should -Contain 'YAYOI-SV'
        @($script:sampleConfig.targets | ForEach-Object { $_.name }) | Should -Contain 'HV-HOST'
        @($script:sampleConfig.targets | ForEach-Object { $_.name }) | Should -Contain 'BASTION-VM'
    }

    It '設定全体からコメントキーが除去されている' {
        $json = $script:sampleConfig | ConvertTo-Json -Depth 20
        $json | Should -Not -Match '"__'
    }

    It '日本語のパスがそのまま保持される' {
        $yayoi = $script:sampleConfig.targets | Where-Object { $_.name -eq 'YAYOI-SV' }
        $yayoi.checks.backup.paths[0].path | Should -Be 'D:\Backup\弥生'
    }

    It '認証情報が平文で書かれていない' {
        $json = $script:sampleConfig | ConvertTo-Json -Depth 20
        $json | Should -Not -Match '(?i)"password"\s*:'
        $json | Should -Not -Match '(?i)"apiKey"\s*:'
    }

    It 'ゲスト VM にはハードウェア監視を適用しない' {
        $bastion = $script:sampleConfig.targets | Where-Object { $_.name -eq 'BASTION-VM' }
        $bastion.hardware.enabled | Should -BeFalse
    }

    It '既定値がマージされる' {
        $script:sampleConfig.notification.renotifyIntervalHours | Should -Not -BeNullOrEmpty
        $script:sampleConfig.general.logRetentionDays | Should -Not -BeNullOrEmpty
    }
}

Describe 'New-CheckResult' {

    It '検知事項のうち最も深刻なレベルが結果の状態になる' {
        $findings = @(
            (New-CheckFinding -Key 'a' -Level 'Warning' -Title 'w'),
            (New-CheckFinding -Key 'b' -Level 'Critical' -Title 'c')
        )
        $result = New-CheckResult -CheckId 'DSK' -CheckName 'ディスク' -TargetName 'SV' -Findings $findings
        $result.Status | Should -Be 'Critical'
    }

    It '検知事項が無ければ OK になる' {
        $result = New-CheckResult -CheckId 'DSK' -CheckName 'ディスク' -TargetName 'SV'
        $result.Status | Should -Be 'OK'
        @($result.Findings).Count | Should -Be 0
    }

    It '収集失敗は Unknown になり、通知対象の検知事項を持つ' {
        $result = New-UnknownCheckResult -CheckId 'DSK' -CheckName 'ディスク' -TargetName 'SV' -Reason 'WinRM 接続不可'
        $result.Status | Should -Be 'Unknown'
        @($result.Findings).Count | Should -Be 1
        $result.Findings[0].Level | Should -Be 'Unknown'
    }

    It '無効化されたチェックは Skipped になる' {
        $result = New-SkippedCheckResult -CheckId 'VM' -CheckName 'Hyper-V' -TargetName 'SV'
        $result.Status | Should -Be 'Skipped'
    }
}

Describe 'Format-MonitorByte / Format-MonitorTimeSpan' {

    It 'バイト数を読みやすい単位に整形する' {
        Format-MonitorByte -Bytes 1024 | Should -Be '1.00 KB'
        Format-MonitorByte -Bytes (1GB * 23.9) | Should -Be '23.90 GB'
        Format-MonitorByte -Bytes $null | Should -Be '-'
    }

    It '経過時間を日本語で整形する' {
        Format-MonitorTimeSpan -TimeSpan ([TimeSpan]::FromHours(50)) | Should -Be '2日2時間'
        Format-MonitorTimeSpan -TimeSpan ([TimeSpan]::FromMinutes(90)) | Should -Be '1時間30分'
        Format-MonitorTimeSpan -TimeSpan $null | Should -Be '-'
    }
}

Describe 'Test-CheckEnabled / Test-TargetLocal' {

    BeforeAll {
        $script:target = [pscustomobject]@{
            name       = 'SV'
            connection = [pscustomobject]@{ mode = 'remote' }
            checks     = [pscustomobject]@{
                disk    = [pscustomobject]@{ enabled = $true }
                hyperV  = [pscustomobject]@{ enabled = $false }
            }
        }
    }

    It '有効なチェックを判定できる' {
        Test-CheckEnabled -Target $script:target -CheckKey 'disk' | Should -BeTrue
        Test-CheckEnabled -Target $script:target -CheckKey 'hyperV' | Should -BeFalse
    }

    It '設定が無いチェックは無効として扱う' {
        Test-CheckEnabled -Target $script:target -CheckKey 'database' | Should -BeFalse
    }

    It 'ローカル / リモートを判定できる' {
        Test-TargetLocal -Target $script:target | Should -BeFalse
        $local = [pscustomobject]@{ name = 'SV'; connection = [pscustomobject]@{ mode = 'local' } }
        Test-TargetLocal -Target $local | Should -BeTrue
    }
}
