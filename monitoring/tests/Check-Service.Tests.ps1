#Requires -Version 5.1

BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelper.ps1')
    Import-MonitorTestModule -Name 'Check-Service.psm1'
}

Describe 'Get-ServiceStateLevel' {

    It 'Running なら OK' {
        Get-ServiceStateLevel -State 'Running' -Exists $true -IsRequired $true | Should -Be 'OK'
    }

    It '必須サービスが停止していたら Critical' {
        Get-ServiceStateLevel -State 'Stopped' -Exists $true -IsRequired $true | Should -Be 'Critical'
    }

    It '任意サービスが停止していたら Warning にとどめる' {
        Get-ServiceStateLevel -State 'Stopped' -Exists $true -IsRequired $false | Should -Be 'Warning'
    }

    It '必須サービスが存在しない場合は設定に従う' {
        Get-ServiceStateLevel -State '' -Exists $false -IsRequired $true -TreatMissingAsCritical $true | Should -Be 'Critical'
        Get-ServiceStateLevel -State '' -Exists $false -IsRequired $true -TreatMissingAsCritical $false | Should -Be 'Unknown'
    }

    It '任意サービスが存在しない場合は Warning' {
        Get-ServiceStateLevel -State '' -Exists $false -IsRequired $false | Should -Be 'Warning'
    }
}

Describe 'Get-ServiceCheckFinding' {

    It '全サービスが Running なら検知事項なし' {
        $services = @(
            (New-TestService -Name 'MSSQL$YAYOI'),
            (New-TestService -Name 'w32time'),
            (New-TestService -Name 'WinDefend')
        )
        $findings = @(Get-ServiceCheckFinding -ServiceState $services -Required @('MSSQL$YAYOI', 'w32time', 'WinDefend'))
        $findings.Count | Should -Be 0
    }

    It 'サービス名に $ を含んでも正しく突き合わせできる' {
        # MSSQL$YAYOI のようなインスタンス名付きサービスを取りこぼさないこと。
        $services = @((New-TestService -Name 'MSSQL$YAYOI' -State 'Stopped' -DisplayName 'SQL Server (YAYOI)'))
        $findings = @(Get-ServiceCheckFinding -ServiceState $services -Required @('MSSQL$YAYOI'))

        $findings.Count | Should -Be 1
        $findings[0].Key | Should -Be 'MSSQL$YAYOI'
        $findings[0].Level | Should -Be 'Critical'
        $findings[0].Title | Should -Match 'SQL Server \(YAYOI\)'
    }

    It 'サービス名の大文字小文字を区別しない' {
        $services = @((New-TestService -Name 'W32Time' -State 'Running'))
        @(Get-ServiceCheckFinding -ServiceState $services -Required @('w32time')).Count | Should -Be 0
    }

    It '存在しないサービスを検知する' {
        $findings = @(Get-ServiceCheckFinding -ServiceState @() -Required @('TermServLicensing'))
        $findings.Count | Should -Be 1
        $findings[0].Level | Should -Be 'Critical'
        $findings[0].Title | Should -Match '存在しません'
    }

    It 'スタートアップの種類が無効なら本文で明示する' {
        $services = @((New-TestService -Name 'WinDefend' -State 'Stopped' -StartMode 'Disabled'))
        $findings = @(Get-ServiceCheckFinding -ServiceState $services -Required @('WinDefend'))
        $findings[0].Message | Should -Match '無効'
    }

    It '必須と任意で深刻度が分かれる' {
        $services = @(
            (New-TestService -Name 'TermService' -State 'Stopped'),
            (New-TestService -Name 'UmRdpService' -State 'Stopped')
        )
        $findings = @(Get-ServiceCheckFinding -ServiceState $services `
                -Required @('TermService') -Optional @('UmRdpService'))

        ($findings | Where-Object { $_.Key -eq 'TermService' }).Level | Should -Be 'Critical'
        ($findings | Where-Object { $_.Key -eq 'UmRdpService' }).Level | Should -Be 'Warning'
    }

    It '監視対象に挙げていないサービスの停止は無視する' {
        $services = @(
            (New-TestService -Name 'w32time' -State 'Running'),
            (New-TestService -Name 'Spooler' -State 'Stopped')
        )
        @(Get-ServiceCheckFinding -ServiceState $services -Required @('w32time')).Count | Should -Be 0
    }
}
