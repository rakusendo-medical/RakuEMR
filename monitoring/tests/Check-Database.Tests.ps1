#Requires -Version 5.1

BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelper.ps1')
    Import-MonitorTestModule -Name 'Check-Database.psm1'

    $script:setting = @{
        excludeDatabases      = @('master', 'model', 'msdb', 'tempdb')
        ldfWarningRatio       = 2.0
        ldfCriticalRatio      = 3.0
        ldfIgnoreBelowMB      = 512
        ldfWarningSizeGB      = 0
        expectedRecoveryModel = 'SIMPLE'
        expectedCollation     = 'Japanese_CI_AS'
    }

    function New-TestDatabase {
        <#
            .SYNOPSIS
            sys.databases + sys.master_files 相当のモックを作る。
        #>
        [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
            Justification = 'テスト用のモックデータを生成して返すだけのファクトリ関数。')]
        [CmdletBinding()]
        [OutputType([psobject])]
        param(
            [Parameter()]
            [string] $Name = 'YAYOI_DB',

            [Parameter()]
            [double] $DataGB = 24,

            [Parameter()]
            [double] $LogGB = 2,

            [Parameter()]
            [string] $RecoveryModel = 'SIMPLE',

            [Parameter()]
            [string] $Collation = 'Japanese_CI_AS',

            [Parameter()]
            [string] $StateDesc = 'ONLINE'
        )

        return [pscustomobject]@{
            DatabaseName  = $Name
            RecoveryModel = $RecoveryModel
            CollationName = $Collation
            StateDesc     = $StateDesc
            DataBytes     = [long] ($DataGB * 1GB)
            LogBytes      = [long] ($LogGB * 1GB)
        }
    }
}

Describe 'Get-LogSizeLevel（ldf / mdf 比率）' {

    It 'ldf が mdf の <Ratio> 倍なら <Expected>' -ForEach @(
        @{ Ratio = 0.1; Expected = 'OK' }
        @{ Ratio = 1.0; Expected = 'OK' }
        @{ Ratio = 2.0; Expected = 'OK' }
        @{ Ratio = 2.5; Expected = 'Warning' }
        @{ Ratio = 3.0; Expected = 'OK2Critical' }
        @{ Ratio = 3.1; Expected = 'Critical' }
        @{ Ratio = 15.4; Expected = 'Critical' }
    ) {
        $data = 24GB
        $log = $data * $Ratio
        $actual = Get-LogSizeLevel -DataBytes $data -LogBytes $log `
            -WarningRatio 2.0 -CriticalRatio 3.0 -IgnoreBelowBytes 512MB

        if ($Expected -eq 'OK2Critical') {
            # ちょうど 3.0 倍は「超える」に該当しないため Warning 側にとどまる。
            $actual | Should -Be 'Warning'
        }
        else {
            $actual | Should -Be $Expected
        }
    }

    It '今回の障害の実測値（mdf 23.9GB / ldf 368.8GB）を Critical と判定する' {
        Get-LogSizeLevel -DataBytes (23.9GB) -LogBytes (368.8GB) `
            -WarningRatio 2.0 -CriticalRatio 3.0 -IgnoreBelowBytes 512MB | Should -Be 'Critical'
    }

    It '小規模 DB は比率が跳ねても誤検知しない' {
        # ldf 10MB / mdf 1MB は比率 10 倍だが、実害が無いので通知しない。
        Get-LogSizeLevel -DataBytes 1MB -LogBytes 10MB `
            -WarningRatio 2.0 -CriticalRatio 3.0 -IgnoreBelowBytes 512MB | Should -Be 'OK'
    }

    It '比率が正常でも ldf 単体が絶対サイズ閾値を超えたら Warning' {
        Get-LogSizeLevel -DataBytes 500GB -LogBytes 80GB `
            -WarningRatio 2.0 -CriticalRatio 3.0 -IgnoreBelowBytes 512MB -WarningSizeBytes 50GB | Should -Be 'Warning'
    }

    It 'ldf が 0 なら OK' {
        Get-LogSizeLevel -DataBytes 10GB -LogBytes 0 | Should -Be 'OK'
    }

    It 'mdf が 0（ファイル情報が取れない）でも例外にならない' {
        Get-LogSizeLevel -DataBytes 0 -LogBytes 10GB -IgnoreBelowBytes 512MB | Should -Be 'OK'
    }
}

Describe 'Get-DatabaseCheckFinding（RCV: 復旧モデル）' {

    It 'SIMPLE から変わっていたら通知する' {
        $databases = @((New-TestDatabase -RecoveryModel 'FULL'))
        $findings = @(Get-DatabaseCheckFinding -Database $databases -Setting $script:setting)

        $recovery = $findings | Where-Object { $_.Key -like '*recovery' }
        $recovery | Should -Not -BeNullOrEmpty
        $recovery.Level | Should -Be 'Warning'
        $recovery.Message | Should -Match 'FULL'
    }

    It '期待どおり SIMPLE なら通知しない' {
        $databases = @((New-TestDatabase -RecoveryModel 'SIMPLE'))
        @(Get-DatabaseCheckFinding -Database $databases -Setting $script:setting |
                Where-Object { $_.Key -like '*recovery' }).Count | Should -Be 0
    }
}

Describe 'Get-DatabaseCheckFinding（DBC: 照合順序）' {

    It 'Japanese_CI_AS と異なれば通知する' {
        $databases = @((New-TestDatabase -Collation 'SQL_Latin1_General_CP1_CI_AS'))
        $collation = @(Get-DatabaseCheckFinding -Database $databases -Setting $script:setting) |
            Where-Object { $_.Key -like '*collation' }

        $collation | Should -Not -BeNullOrEmpty
        $collation.Level | Should -Be 'Warning'
    }

    It '一致していれば通知しない' {
        $databases = @((New-TestDatabase -Collation 'Japanese_CI_AS'))
        @(Get-DatabaseCheckFinding -Database $databases -Setting $script:setting |
                Where-Object { $_.Key -like '*collation' }).Count | Should -Be 0
    }
}

Describe 'Get-DatabaseCheckFinding（全体）' {

    It 'システム DB は除外する' {
        $databases = @(
            (New-TestDatabase -Name 'master' -RecoveryModel 'FULL' -Collation 'SQL_Latin1_General_CP1_CI_AS'),
            (New-TestDatabase -Name 'tempdb' -RecoveryModel 'FULL')
        )
        @(Get-DatabaseCheckFinding -Database $databases -Setting $script:setting).Count | Should -Be 0
    }

    It 'ONLINE でない DB は Critical にし、他の判定は行わない' {
        $databases = @((New-TestDatabase -StateDesc 'RECOVERY_PENDING' -RecoveryModel 'FULL' -LogGB 200))
        $findings = @(Get-DatabaseCheckFinding -Database $databases -Setting $script:setting)

        $findings.Count | Should -Be 1
        $findings[0].Level | Should -Be 'Critical'
        $findings[0].Key | Should -Match 'state$'
    }

    It '複数の異常が同時に出ても検知キーは重複しない' {
        $databases = @((New-TestDatabase -DataGB 24 -LogGB 369 -RecoveryModel 'FULL' -Collation 'Latin1_General_CI_AS'))
        $findings = @(Get-DatabaseCheckFinding -Database $databases -Setting $script:setting)

        $findings.Count | Should -Be 3
        @($findings | ForEach-Object { $_.Key } | Select-Object -Unique).Count | Should -Be 3
    }

    It '検知キーに測定値を含めない（再通知抑制のため）' {
        $first = @(Get-DatabaseCheckFinding -Database @((New-TestDatabase -DataGB 24 -LogGB 100)) -Setting $script:setting)
        $second = @(Get-DatabaseCheckFinding -Database @((New-TestDatabase -DataGB 24 -LogGB 150)) -Setting $script:setting)

        $first[0].Key | Should -Be $second[0].Key
    }

    It '正常な DB は検知事項を出さない' {
        @(Get-DatabaseCheckFinding -Database @((New-TestDatabase)) -Setting $script:setting).Count | Should -Be 0
    }

    It '空の入力でも例外にならない' {
        @(Get-DatabaseCheckFinding -Database @() -Setting $script:setting).Count | Should -Be 0
        @(Get-DatabaseCheckFinding -Database $null -Setting $script:setting).Count | Should -Be 0
    }
}

Describe 'Get-SqlConnectionString' {

    It 'Windows 認証の接続文字列を組み立てる' {
        $connectionString = Get-SqlConnectionString -ServerInstance '.\YAYOI' -UseIntegratedSecurity $true -ConnectTimeoutSeconds 10

        $connectionString | Should -Match 'Data Source=\.\\YAYOI'
        $connectionString | Should -Match 'Integrated Security=True'
        $connectionString | Should -Match 'Connect Timeout=10'
    }

    It 'SQL 認証の接続文字列を組み立てる' {
        $connectionString = Get-SqlConnectionString -ServerInstance '192.168.252.210\YAYOI' `
            -UseIntegratedSecurity $false -UserId 'monitor' -Password 'p@ss'

        $connectionString | Should -Match 'User ID=monitor'
        $connectionString | Should -Not -Match 'Integrated Security=True'
    }

    It 'SqlConnectionStringBuilder が利用できる（sqlcmd / SqlServer モジュール非依存の確認）' {
        { New-Object System.Data.SqlClient.SqlConnectionStringBuilder } | Should -Not -Throw
    }
}
