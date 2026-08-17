#Requires -Version 5.1
<#
    iLO Redfish の判定ロジックのテスト。
    Redfish の応答は機種・ファーム世代で差があるため、
    「値が欠けていても落ちない」ことを重点的に確認する。
#>

BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelper.ps1')
    Import-MonitorTestModule -Name 'Check-Hardware.psm1'

    $script:now = [datetime]'2026-08-17T09:00:00'
    $script:thresholds = @{
        defaultTemperatureWarningCelsius  = 70
        defaultTemperatureCriticalCelsius = 85
        eventLogLookbackHours             = 24
        eventLogMaxEntries                = 100
    }
}

Describe 'Get-RedfishHealthLevel' {

    It '<Health> は <Expected> に変換される' -ForEach @(
        @{ Health = 'OK'; Expected = 'OK' }
        @{ Health = 'ok'; Expected = 'OK' }
        @{ Health = 'Warning'; Expected = 'Warning' }
        @{ Health = 'Critical'; Expected = 'Critical' }
        @{ Health = ''; Expected = 'Unknown' }
        @{ Health = 'Degraded'; Expected = 'Unknown' }
    ) {
        Get-RedfishHealthLevel -Health $Health | Should -Be $Expected
    }

    It 'null は Unknown' {
        Get-RedfishHealthLevel -Health $null | Should -Be 'Unknown'
    }
}

Describe 'Get-TemperatureLevel' {

    It 'Redfish が返す閾値を優先する' {
        Get-TemperatureLevel -ReadingCelsius 60 -UpperThresholdNonCritical 50 -UpperThresholdCritical 60 | Should -Be 'Critical'
        Get-TemperatureLevel -ReadingCelsius 55 -UpperThresholdNonCritical 50 -UpperThresholdCritical 60 | Should -Be 'Warning'
        Get-TemperatureLevel -ReadingCelsius 45 -UpperThresholdNonCritical 50 -UpperThresholdCritical 60 | Should -Be 'OK'
    }

    It '閾値が返らない機種では設定の既定値を使う' {
        Get-TemperatureLevel -ReadingCelsius 90 -DefaultWarningCelsius 70 -DefaultCriticalCelsius 85 | Should -Be 'Critical'
        Get-TemperatureLevel -ReadingCelsius 75 -DefaultWarningCelsius 70 -DefaultCriticalCelsius 85 | Should -Be 'Warning'
        Get-TemperatureLevel -ReadingCelsius 40 -DefaultWarningCelsius 70 -DefaultCriticalCelsius 85 | Should -Be 'OK'
    }

    It '閾値が 0 で返る機種でも既定値へフォールバックする' {
        Get-TemperatureLevel -ReadingCelsius 90 -UpperThresholdCritical 0 -UpperThresholdNonCritical 0 `
            -DefaultWarningCelsius 70 -DefaultCriticalCelsius 85 | Should -Be 'Critical'
    }
}

Describe 'Get-ThermalFinding' {

    It '正常なセンサーは検知事項を出さない' {
        $thermal = [pscustomobject]@{
            Temperatures = @([pscustomobject]@{
                    Name                      = '01-Inlet Ambient'
                    ReadingCelsius            = 22
                    UpperThresholdNonCritical = 42
                    UpperThresholdCritical    = 46
                    Status                    = [pscustomobject]@{ State = 'Enabled'; Health = 'OK' }
                })
            Fans         = @([pscustomobject]@{
                    Name         = 'Fan 1'
                    Reading      = 25
                    ReadingUnits = 'Percent'
                    Status       = [pscustomobject]@{ State = 'Enabled'; Health = 'OK' }
                })
        }
        @(Get-ThermalFinding -Thermal $thermal -Threshold $script:thresholds).Count | Should -Be 0
    }

    It '無効なセンサー（未搭載スロット等）は判定から外す' {
        # 未実装センサーは 0 ℃ を返すため、そのまま判定すると誤検知になる。
        $thermal = [pscustomobject]@{
            Temperatures = @([pscustomobject]@{
                    Name           = '30-Unused'
                    ReadingCelsius = 0
                    Status         = [pscustomobject]@{ State = 'Absent'; Health = $null }
                })
            Fans         = @()
        }
        @(Get-ThermalFinding -Thermal $thermal -Threshold $script:thresholds).Count | Should -Be 0
    }

    It '温度超過を検知する' {
        $thermal = [pscustomobject]@{
            Temperatures = @([pscustomobject]@{
                    Name                      = '04-P1 DIMM'
                    ReadingCelsius            = 92
                    UpperThresholdNonCritical = 85
                    UpperThresholdCritical    = 90
                    Status                    = [pscustomobject]@{ State = 'Enabled'; Health = 'Critical' }
                })
            Fans         = @()
        }
        $findings = @(Get-ThermalFinding -Thermal $thermal -Threshold $script:thresholds)

        $findings.Count | Should -Be 1
        $findings[0].Level | Should -Be 'Critical'
        $findings[0].Key | Should -Be 'temp/04-P1 DIMM'
    }

    It '温度は閾値内でもセンサーが異常を申告していれば拾う' {
        $thermal = [pscustomobject]@{
            Temperatures = @([pscustomobject]@{
                    Name                      = '01-Inlet Ambient'
                    ReadingCelsius            = 20
                    UpperThresholdNonCritical = 42
                    UpperThresholdCritical    = 46
                    Status                    = [pscustomobject]@{ State = 'Enabled'; Health = 'Warning' }
                })
            Fans         = @()
        }
        @(Get-ThermalFinding -Thermal $thermal -Threshold $script:thresholds)[0].Level | Should -Be 'Warning'
    }

    It '停止しているファンを Critical として検知する' {
        $thermal = [pscustomobject]@{
            Temperatures = @()
            Fans         = @([pscustomobject]@{
                    Name         = 'Fan 3'
                    Reading      = 0
                    ReadingUnits = 'Percent'
                    Status       = [pscustomobject]@{ State = 'Enabled'; Health = 'OK' }
                })
        }
        $findings = @(Get-ThermalFinding -Thermal $thermal -Threshold $script:thresholds)
        $findings[0].Level | Should -Be 'Critical'
    }

    It 'Reading ではなく CurrentReading を返す機種にも対応する' {
        $thermal = [pscustomobject]@{
            Temperatures = @()
            Fans         = @([pscustomobject]@{
                    Name           = 'Fan 1'
                    CurrentReading = 0
                    Status         = [pscustomobject]@{ State = 'Enabled'; Health = 'OK' }
                })
        }
        @(Get-ThermalFinding -Thermal $thermal -Threshold $script:thresholds)[0].Level | Should -Be 'Critical'
    }

    It 'Thermal が取得できなくても例外にならない' {
        @(Get-ThermalFinding -Thermal $null -Threshold $script:thresholds).Count | Should -Be 0
        @(Get-ThermalFinding -Thermal ([pscustomobject]@{}) -Threshold $script:thresholds).Count | Should -Be 0
    }
}

Describe 'Get-PowerFinding' {

    It '正常な電源ユニットは検知事項を出さない' {
        $power = [pscustomobject]@{
            PowerSupplies = @([pscustomobject]@{
                    Name   = 'HpeServerPowerSupply'
                    Status = [pscustomobject]@{ State = 'Enabled'; Health = 'OK' }
                })
        }
        @(Get-PowerFinding -Power $power).Count | Should -Be 0
    }

    It '未搭載スロット（Absent）は異常としない' {
        # 冗長構成で片側が空でも運用上の異常ではない。
        $power = [pscustomobject]@{
            PowerSupplies = @([pscustomobject]@{
                    Name   = 'PSU 2'
                    Status = [pscustomobject]@{ State = 'Absent'; Health = $null }
                })
        }
        @(Get-PowerFinding -Power $power).Count | Should -Be 0
    }

    It '電源ユニットの異常を検知する' {
        $power = [pscustomobject]@{
            PowerSupplies = @([pscustomobject]@{
                    Name             = 'PSU 1'
                    LineInputVoltage = 0
                    Status           = [pscustomobject]@{ State = 'Enabled'; Health = 'Critical' }
                })
        }
        @(Get-PowerFinding -Power $power)[0].Level | Should -Be 'Critical'
    }

    It 'Power が取得できなくても例外にならない' {
        @(Get-PowerFinding -Power $null).Count | Should -Be 0
    }
}

Describe 'Get-SystemHealthFinding' {

    It '全体ヘルスが OK なら検知事項を出さない' {
        $system = [pscustomobject]@{
            PowerState = 'On'
            Status     = [pscustomobject]@{ State = 'Enabled'; Health = 'OK' }
        }
        @(Get-SystemHealthFinding -System $system).Count | Should -Be 0
    }

    It '全体ヘルスの異常を検知する' {
        $system = [pscustomobject]@{
            PowerState = 'On'
            Status     = [pscustomobject]@{ State = 'Enabled'; Health = 'Critical' }
        }
        @(Get-SystemHealthFinding -System $system)[0].Level | Should -Be 'Critical'
    }

    It 'HPE の部位別ヘルス（AggregateHealthStatus）も走査する' {
        $system = [pscustomobject]@{
            PowerState = 'On'
            Status     = [pscustomobject]@{ State = 'Enabled'; Health = 'Warning' }
            Oem        = [pscustomobject]@{
                Hpe = [pscustomobject]@{
                    AggregateHealthStatus = [pscustomobject]@{
                        '@odata.id' = '/redfish/v1/x'
                        Memory      = [pscustomobject]@{ Status = [pscustomobject]@{ Health = 'OK' } }
                        Storage     = [pscustomobject]@{ Status = [pscustomobject]@{ Health = 'Critical' } }
                        Fans        = [pscustomobject]@{ Status = [pscustomobject]@{ Health = 'Warning' } }
                    }
                }
            }
        }
        $findings = @(Get-SystemHealthFinding -System $system)

        @($findings | Where-Object { $_.Key -eq 'system/Storage' }).Level | Should -Be 'Critical'
        @($findings | Where-Object { $_.Key -eq 'system/Fans' }).Level | Should -Be 'Warning'
        @($findings | Where-Object { $_.Key -eq 'system/Memory' }).Count | Should -Be 0
    }

    It 'Oem セクションが無い機種でも例外にならない' {
        $system = [pscustomobject]@{ Status = [pscustomobject]@{ Health = 'OK' } }
        { Get-SystemHealthFinding -System $system } | Should -Not -Throw
    }

    It 'System が取得できなくても例外にならない' {
        @(Get-SystemHealthFinding -System $null).Count | Should -Be 0
    }
}

Describe 'Get-StorageFinding' {

    It 'RAID・物理ディスクの異常を検知する' {
        $resources = @(
            [pscustomobject]@{ Name = 'Smart Array P408i'; Status = [pscustomobject]@{ Health = 'OK' } },
            [pscustomobject]@{ Name = 'Physical Drive 1I:1:2'; Model = 'MB008000JWJRQ'; Location = '1I:1:2'
                Status = [pscustomobject]@{ Health = 'Critical' }
            }
        )
        $findings = @(Get-StorageFinding -StorageResource $resources)

        $findings.Count | Should -Be 1
        $findings[0].Level | Should -Be 'Critical'
        $findings[0].Message | Should -Match '1I:1:2'
    }

    It '空でも例外にならない' {
        @(Get-StorageFinding -StorageResource @()).Count | Should -Be 0
        @(Get-StorageFinding -StorageResource $null).Count | Should -Be 0
    }
}

Describe 'Get-HardwareLogFinding' {

    It '対象期間内の警告・重大エントリのみを検知する' {
        $entries = @(
            [pscustomobject]@{ Id = '1'; Severity = 'OK'; Created = $script:now.AddHours(-1).ToString('o'); Message = '正常' },
            [pscustomobject]@{ Id = '2'; Severity = 'Critical'; Created = $script:now.AddHours(-2).ToString('o'); Message = 'DIMM 障害' },
            [pscustomobject]@{ Id = '3'; Severity = 'Warning'; Created = $script:now.AddDays(-10).ToString('o'); Message = '古い記録' }
        )
        $findings = @(Get-HardwareLogFinding -LogEntry $entries -Now $script:now -LookbackHours 24)

        $findings.Count | Should -Be 1
        $findings[0].Key | Should -Be 'iml/2'
        $findings[0].Level | Should -Be 'Critical'
    }

    It '日時が解釈できないエントリも取りこぼさない' {
        # 期間で絞れない以上、握りつぶすより通知する側に倒す。
        $entries = @([pscustomobject]@{ Id = '9'; Severity = 'Critical'; Created = ''; Message = '不明な時刻' })
        @(Get-HardwareLogFinding -LogEntry $entries -Now $script:now -LookbackHours 24).Count | Should -Be 1
    }

    It '空でも例外にならない' {
        @(Get-HardwareLogFinding -LogEntry @() -Now $script:now).Count | Should -Be 0
    }
}

Describe 'Invoke-HardwareCheck（設定による分岐）' {

    It 'ゲスト VM ではハードウェア監視をスキップする' {
        $target = [pscustomobject]@{
            name     = 'BASTION-VM'
            hardware = [pscustomobject]@{ enabled = $false }
        }
        $result = Invoke-HardwareCheck -Target $target
        $result.Status | Should -Be 'Skipped'
    }

    It 'hardware セクションが無い対象でもスキップになる' {
        $result = Invoke-HardwareCheck -Target ([pscustomobject]@{ name = 'SV' })
        $result.Status | Should -Be 'Skipped'
    }

    It 'iLO に到達できない場合でも例外を外へ出さない（他項目の監視を止めない）' {
        $target = [pscustomobject]@{
            name     = 'YAYOI-SV'
            hardware = [pscustomobject]@{
                enabled        = $true
                address        = '192.0.2.1'
                credentialName = 'not-registered'
                timeoutSeconds = 1
            }
        }
        { Invoke-HardwareCheck -Target $target } | Should -Not -Throw

        $result = Invoke-HardwareCheck -Target $target
        $result.Status | Should -Be 'Unknown'
        $result.Summary | Should -Match 'iLO に接続できません'
    }

    It 'treatUnreachableAsUnknown を false にすると Skipped になる' {
        $target = [pscustomobject]@{
            name     = 'YAYOI-SV'
            hardware = [pscustomobject]@{
                enabled                   = $true
                address                   = '192.0.2.1'
                credentialName            = 'not-registered'
                timeoutSeconds            = 1
                treatUnreachableAsUnknown = $false
            }
        }
        (Invoke-HardwareCheck -Target $target).Status | Should -Be 'Skipped'
    }
}
