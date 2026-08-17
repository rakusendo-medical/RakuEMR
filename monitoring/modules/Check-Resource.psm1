#Requires -Version 5.1
<#
    Check-Resource.psm1 — RES: CPU / メモリ使用率

    ダッシュボードの「リソース」ブロックを埋めるための項目。
    既定では閾値を 0（無効）にしてあり、通知は行わない。
    瞬間値での通知は誤検知が多く、通知の信頼性を下げるため。
    継続的な高負荷を検知したい場合のみ設定で閾値を有効にする。
#>

Import-Module (Join-Path $PSScriptRoot 'Common.psm1') -DisableNameChecking -ErrorAction Stop

function Get-ResourceUsageLevel {
    <#
        .SYNOPSIS
        使用率から判定レベルを返す。純粋関数。閾値 0 または $null で判定を行わない。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [double] $UsagePercent,

        [Parameter()]
        [AllowNull()]
        $WarningPercent = $null,

        [Parameter()]
        [AllowNull()]
        $CriticalPercent = $null
    )

    $critical = if ($null -eq $CriticalPercent) { 0 } else { [double] $CriticalPercent }
    $warning = if ($null -eq $WarningPercent) { 0 } else { [double] $WarningPercent }

    if ($critical -gt 0 -and $UsagePercent -ge $critical) { return 'Critical' }
    if ($warning -gt 0 -and $UsagePercent -ge $warning) { return 'Warning' }
    return 'OK'
}

function Get-ResourceCheckFinding {
    <#
        .SYNOPSIS
        CPU / メモリ使用率から検知事項を組み立てる。純粋関数。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Usage,

        [Parameter()]
        [AllowNull()]
        $Setting = $null
    )

    $findings = New-Object System.Collections.ArrayList

    $cpuLevel = Get-ResourceUsageLevel -UsagePercent ([double] $Usage.CpuPercent) `
        -WarningPercent (Get-ConfigValue -InputObject $Setting -Name 'cpuWarningPercent' -Default 0) `
        -CriticalPercent (Get-ConfigValue -InputObject $Setting -Name 'cpuCriticalPercent' -Default 0)
    if ($cpuLevel -ne 'OK') {
        $finding = New-CheckFinding -Key 'cpu' -Level $cpuLevel -Title 'CPU 使用率が高い状態です' `
            -Message ('{0:N1}%' -f [double] $Usage.CpuPercent) -Value ([Math]::Round([double] $Usage.CpuPercent, 1))
        $null = $findings.Add($finding)
    }

    $memoryLevel = Get-ResourceUsageLevel -UsagePercent ([double] $Usage.MemoryPercent) `
        -WarningPercent (Get-ConfigValue -InputObject $Setting -Name 'memoryWarningPercent' -Default 0) `
        -CriticalPercent (Get-ConfigValue -InputObject $Setting -Name 'memoryCriticalPercent' -Default 0)
    if ($memoryLevel -ne 'OK') {
        $finding = New-CheckFinding -Key 'memory' -Level $memoryLevel -Title 'メモリ使用率が高い状態です' `
            -Message ('{0:N1}%（空き {1}）' -f [double] $Usage.MemoryPercent, (Format-MonitorByte -Bytes $Usage.FreeMemoryBytes)) `
            -Value ([Math]::Round([double] $Usage.MemoryPercent, 1))
        $null = $findings.Add($finding)
    }

    return $findings.ToArray()
}

function Get-ResourceUsageData {
    <#
        .SYNOPSIS
        監視対象から CPU / メモリの使用率を収集する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target
    )

    $scriptBlock = {
        $operatingSystem = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop
        $totalBytes = [double] $operatingSystem.TotalVisibleMemorySize * 1024
        $freeBytes = [double] $operatingSystem.FreePhysicalMemory * 1024
        $memoryPercent = if ($totalBytes -gt 0) { (($totalBytes - $freeBytes) / $totalBytes) * 100 } else { 0 }

        # LoadPercentage はプロセッサごとに返るため平均を取る。
        $processors = @(Get-CimInstance -ClassName Win32_Processor -ErrorAction Stop)
        $cpuPercent = 0
        if ($processors.Count -gt 0) {
            $cpuPercent = ($processors | Measure-Object -Property LoadPercentage -Average).Average
        }

        [pscustomobject]@{
            CpuPercent       = [double] $cpuPercent
            MemoryPercent    = [double] $memoryPercent
            TotalMemoryBytes = [long] $totalBytes
            FreeMemoryBytes  = [long] $freeBytes
            LastBootUpTime   = $operatingSystem.LastBootUpTime
        }
    }

    return (Invoke-MonitorScriptBlock -Target $Target -ScriptBlock $scriptBlock)
}

function Invoke-ResourceCheck {
    <#
        .SYNOPSIS
        RES チェックを 1 監視対象について実行する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target
    )

    $checkId = 'RES'
    $checkName = 'CPU / メモリ'
    $targetName = [string] $Target.name

    if (-not (Test-CheckEnabled -Target $Target -CheckKey 'resource')) {
        return (New-SkippedCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName)
    }

    $config = Get-TargetCheckConfig -Target $Target -CheckKey 'resource'

    try {
        $usage = Get-ResourceUsageData -Target $Target
    }
    catch {
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName -Reason $_.Exception.Message)
    }

    if ($null -eq $usage) {
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
                -Reason 'リソース使用率を取得できませんでした。')
    }

    $findings = Get-ResourceCheckFinding -Usage $usage -Setting $config

    $items = @([pscustomobject]@{
            CpuPercent      = [Math]::Round([double] $usage.CpuPercent, 1)
            MemoryPercent   = [Math]::Round([double] $usage.MemoryPercent, 1)
            TotalMemoryText = Format-MonitorByte -Bytes $usage.TotalMemoryBytes
            FreeMemoryText  = Format-MonitorByte -Bytes $usage.FreeMemoryBytes
            LastBootUpTime  = if ($null -ne $usage.LastBootUpTime) { ([datetime] $usage.LastBootUpTime).ToString('yyyy-MM-dd HH:mm:ss') } else { '-' }
        })

    $summary = 'CPU {0:N1}% / メモリ {1:N1}%（空き {2}）' -f `
        [double] $usage.CpuPercent, [double] $usage.MemoryPercent, (Format-MonitorByte -Bytes $usage.FreeMemoryBytes)

    $metrics = [pscustomobject]@{
        CpuPercent    = [Math]::Round([double] $usage.CpuPercent, 1)
        MemoryPercent = [Math]::Round([double] $usage.MemoryPercent, 1)
    }

    return (New-CheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
            -Summary $summary -Findings $findings -Metrics $metrics -Items $items)
}

Export-ModuleMember -Function @(
    'Get-ResourceUsageLevel'
    'Get-ResourceCheckFinding'
    'Get-ResourceUsageData'
    'Invoke-ResourceCheck'
)
