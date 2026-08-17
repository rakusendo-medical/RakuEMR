#Requires -Version 5.1

BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelper.ps1')
    Import-MonitorTestModule -Name 'Check-Disk.psm1'
}

Describe 'Get-DiskStatusLevel（空き率による判定）' {

    It '空き率 <FreePercent>% は <Expected> と判定される' -ForEach @(
        @{ FreePercent = 50.0; Expected = 'OK' }
        @{ FreePercent = 21.0; Expected = 'OK' }
        @{ FreePercent = 20.0; Expected = 'OK' }
        @{ FreePercent = 19.9; Expected = 'Warning' }
        @{ FreePercent = 10.1; Expected = 'Warning' }
        @{ FreePercent = 10.0; Expected = 'Warning' }
        @{ FreePercent = 9.9; Expected = 'Critical' }
        @{ FreePercent = 0.0; Expected = 'Critical' }
    ) {
        Get-DiskStatusLevel -FreePercent $FreePercent -FreeGB 999999 `
            -WarningFreePercent 20 -CriticalFreePercent 10 | Should -Be $Expected
    }
}

Describe 'Get-DiskStatusLevel（空き容量 GB による判定）' {

    It '空き率に余裕があっても空き容量が閾値を割れば通知する' {
        # 大容量ボリュームでは率だけでは検知が遅れるため、GB 閾値と OR で判定する。
        Get-DiskStatusLevel -FreePercent 40 -FreeGB 30 `
            -WarningFreePercent 20 -CriticalFreePercent 10 `
            -WarningFreeGB 50 -CriticalFreeGB 20 | Should -Be 'Warning'

        Get-DiskStatusLevel -FreePercent 40 -FreeGB 15 `
            -WarningFreePercent 20 -CriticalFreePercent 10 `
            -WarningFreeGB 50 -CriticalFreeGB 20 | Should -Be 'Critical'
    }

    It 'GB 閾値に 0 または $null を渡すと率だけで判定する' {
        Get-DiskStatusLevel -FreePercent 40 -FreeGB 1 `
            -WarningFreePercent 20 -CriticalFreePercent 10 `
            -WarningFreeGB 0 -CriticalFreeGB 0 | Should -Be 'OK'

        Get-DiskStatusLevel -FreePercent 40 -FreeGB 1 `
            -WarningFreePercent 20 -CriticalFreePercent 10 `
            -WarningFreeGB $null -CriticalFreeGB $null | Should -Be 'OK'
    }

    It '率と容量の両方が危険なら Critical' {
        Get-DiskStatusLevel -FreePercent 5 -FreeGB 3 `
            -WarningFreePercent 20 -CriticalFreePercent 10 `
            -WarningFreeGB 50 -CriticalFreeGB 20 | Should -Be 'Critical'
    }
}

Describe 'Get-DiskCheckFinding' {

    BeforeAll {
        $script:setting = @{
            warningFreePercent  = 20
            criticalFreePercent = 10
            warningFreeGB       = 0
            criticalFreeGB      = 0
        }
    }

    It '正常なボリュームは検知事項を出さない' {
        $volumes = @(
            (New-TestVolume -DeviceID 'C:' -SizeGB 200 -FreeGB 120),
            (New-TestVolume -DeviceID 'D:' -SizeGB 1000 -FreeGB 800)
        )
        @(Get-DiskCheckFinding -Volume $volumes -Setting $script:setting).Count | Should -Be 0
    }

    It '閾値を割ったボリュームだけを検知する' {
        $volumes = @(
            (New-TestVolume -DeviceID 'C:' -SizeGB 200 -FreeGB 120),
            (New-TestVolume -DeviceID 'D:' -SizeGB 1000 -FreeGB 50 -VolumeName 'データ')
        )
        $findings = @(Get-DiskCheckFinding -Volume $volumes -Setting $script:setting)

        $findings.Count | Should -Be 1
        $findings[0].Key | Should -Be 'D:'
        $findings[0].Level | Should -Be 'Critical'
        $findings[0].Title | Should -Match 'データ'
    }

    It '検知キーはドライブレターのみで、実行のたびに変わる値を含まない' {
        # 再通知抑制と解消判定は Key の同一性で成立するため、測定値を含めてはならない。
        $volumes = @((New-TestVolume -DeviceID 'E:' -SizeGB 100 -FreeGB 5))
        $first = @(Get-DiskCheckFinding -Volume $volumes -Setting $script:setting)[0]

        $volumes2 = @((New-TestVolume -DeviceID 'E:' -SizeGB 100 -FreeGB 4))
        $second = @(Get-DiskCheckFinding -Volume $volumes2 -Setting $script:setting)[0]

        $first.Key | Should -Be $second.Key
    }

    It 'サイズ 0 のボリューム（マウントされていない等）は無視する' {
        $volumes = @([pscustomobject]@{ DeviceID = 'X:'; VolumeName = ''; Size = 0; FreeSpace = 0 })
        @(Get-DiskCheckFinding -Volume $volumes -Setting $script:setting).Count | Should -Be 0
    }

    It '空の入力でも例外にならない' {
        @(Get-DiskCheckFinding -Volume @() -Setting $script:setting).Count | Should -Be 0
        @(Get-DiskCheckFinding -Volume $null -Setting $script:setting).Count | Should -Be 0
    }
}
