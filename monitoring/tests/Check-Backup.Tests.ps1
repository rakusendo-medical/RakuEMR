#Requires -Version 5.1

BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelper.ps1')
    Import-MonitorTestModule -Name 'Check-Backup.psm1'

    $script:now = [datetime]'2026-08-17T08:00:00'
    $script:setting = @{
        maxAgeHours      = 24
        criticalAgeHours = 48
        minFileCount     = 1
        minTotalSizeMB   = 10
        minLatestSizeMB  = 1
    }
}

Describe 'Get-BackupFreshnessFinding（鮮度判定）' {

    It '最新ファイルが <AgeHours> 時間前なら <Expected>' -ForEach @(
        @{ AgeHours = 1; Expected = 0 }
        @{ AgeHours = 23; Expected = 0 }
        @{ AgeHours = 24; Expected = 1 }
        @{ AgeHours = 47; Expected = 1 }
        @{ AgeHours = 48; Expected = 1 }
    ) {
        $snapshot = New-TestBackupSnapshot -LatestWriteTime $script:now.AddHours(-1 * $AgeHours)
        $findings = @(Get-BackupFreshnessFinding -Snapshot $snapshot -Setting $script:setting -Now $script:now)
        @($findings | Where-Object { $_.Key -like '*stale' }).Count | Should -Be $Expected
    }

    It '24 時間以上更新が無ければ Warning、48 時間以上なら Critical' {
        $warn = New-TestBackupSnapshot -LatestWriteTime $script:now.AddHours(-30)
        $crit = New-TestBackupSnapshot -LatestWriteTime $script:now.AddHours(-72)

        (@(Get-BackupFreshnessFinding -Snapshot $warn -Setting $script:setting -Now $script:now) |
            Where-Object { $_.Key -like '*stale' }).Level | Should -Be 'Warning'
        (@(Get-BackupFreshnessFinding -Snapshot $crit -Setting $script:setting -Now $script:now) |
            Where-Object { $_.Key -like '*stale' }).Level | Should -Be 'Critical'
    }

    It '7 年放置されていても Critical 1 件として通知される' {
        $snapshot = New-TestBackupSnapshot -LatestWriteTime $script:now.AddYears(-7)
        $stale = @(Get-BackupFreshnessFinding -Snapshot $snapshot -Setting $script:setting -Now $script:now) |
            Where-Object { $_.Key -like '*stale' }
        $stale.Level | Should -Be 'Critical'
    }
}

Describe 'Get-BackupFreshnessFinding（出力先の異常）' {

    It '出力先フォルダが存在しなければ Critical' {
        $snapshot = New-TestBackupSnapshot -Exists $false
        $findings = @(Get-BackupFreshnessFinding -Snapshot $snapshot -Setting $script:setting -Now $script:now)

        $findings.Count | Should -Be 1
        $findings[0].Level | Should -Be 'Critical'
        $findings[0].Title | Should -Match '存在しません'
    }

    It 'ファイルが 1 つも無ければ Critical' {
        $snapshot = New-TestBackupSnapshot -FileCount 0 -TotalMB 0 -LatestMB 0 -LatestWriteTime $script:now
        $findings = @(Get-BackupFreshnessFinding -Snapshot $snapshot -Setting $script:setting -Now $script:now)

        $findings.Count | Should -Be 1
        $findings[0].Level | Should -Be 'Critical'
    }

    It '収集時のエラーは Unknown として通知する' {
        # アクセス拒否などで確認できない状態も「気づけない」状態なので黙って通すことはしない。
        $snapshot = New-TestBackupSnapshot -ErrorMessage 'アクセスが拒否されました。'
        $findings = @(Get-BackupFreshnessFinding -Snapshot $snapshot -Setting $script:setting -Now $script:now)

        $findings.Count | Should -Be 1
        $findings[0].Level | Should -Be 'Unknown'
    }
}

Describe 'Get-BackupFreshnessFinding（サイズと件数）' {

    It '合計サイズが下限未満なら Warning（中身が空のバックアップの検知）' {
        $snapshot = New-TestBackupSnapshot -LatestWriteTime $script:now.AddHours(-1) -TotalMB 2 -LatestMB 2
        $findings = @(Get-BackupFreshnessFinding -Snapshot $snapshot -Setting $script:setting -Now $script:now)

        @($findings | Where-Object { $_.Key -like '*size' }).Count | Should -Be 1
    }

    It '最新ファイルのサイズが下限未満なら Warning' {
        $snapshot = New-TestBackupSnapshot -LatestWriteTime $script:now.AddHours(-1) -TotalMB 500 -LatestMB 0.2
        $findings = @(Get-BackupFreshnessFinding -Snapshot $snapshot -Setting $script:setting -Now $script:now)

        @($findings | Where-Object { $_.Key -like '*latestsize' }).Count | Should -Be 1
    }

    It 'サイズ閾値に 0 を渡すとサイズ判定を行わない' {
        $setting = @{ maxAgeHours = 24; criticalAgeHours = 48; minFileCount = 0; minTotalSizeMB = 0; minLatestSizeMB = 0 }
        $snapshot = New-TestBackupSnapshot -LatestWriteTime $script:now.AddHours(-1) -TotalMB 0.001 -LatestMB 0.001
        @(Get-BackupFreshnessFinding -Snapshot $snapshot -Setting $setting -Now $script:now).Count | Should -Be 0
    }

    It '正常なバックアップは検知事項を出さない' {
        $snapshot = New-TestBackupSnapshot -LatestWriteTime $script:now.AddHours(-3)
        @(Get-BackupFreshnessFinding -Snapshot $snapshot -Setting $script:setting -Now $script:now).Count | Should -Be 0
    }

    It '複数の異常が同時に出ても検知キーは重複しない' {
        $snapshot = New-TestBackupSnapshot -LatestWriteTime $script:now.AddHours(-72) -TotalMB 1 -LatestMB 0.1
        $findings = @(Get-BackupFreshnessFinding -Snapshot $snapshot -Setting $script:setting -Now $script:now)

        $findings.Count | Should -BeGreaterThan 1
        @($findings | ForEach-Object { $_.Key } | Select-Object -Unique).Count | Should -Be $findings.Count
    }
}
