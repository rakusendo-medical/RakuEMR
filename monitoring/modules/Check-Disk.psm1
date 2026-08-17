#Requires -Version 5.1
<#
    Check-Disk.psm1 — DSK: ディスク空き容量監視

    1 時間間隔。空き率と空き容量の両方を見る。
    率だけでは大容量ボリュームで検知が遅れ、容量だけでは小容量ボリュームで検知が遅れるため、
    どちらか一方でも閾値を割ったら通知する（OR 判定）。
#>

Import-Module (Join-Path $PSScriptRoot 'Common.psm1') -DisableNameChecking -ErrorAction Stop

function Get-DiskStatusLevel {
    <#
        .SYNOPSIS
        空き率と空き容量から判定レベルを返す。純粋関数。

        .DESCRIPTION
        率の閾値と容量（GB）の閾値は OR で評価する。どちらか一方を無効にしたい場合は
        0 または $null を渡す。

        .PARAMETER FreePercent
        空き率（0〜100）。

        .PARAMETER FreeGB
        空き容量（GB）。

        .OUTPUTS
        OK / Warning / Critical のいずれか。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [double] $FreePercent,

        [Parameter(Mandatory = $true)]
        [double] $FreeGB,

        [Parameter()]
        [AllowNull()]
        $WarningFreePercent = 20,

        [Parameter()]
        [AllowNull()]
        $CriticalFreePercent = 10,

        [Parameter()]
        [AllowNull()]
        $WarningFreeGB = $null,

        [Parameter()]
        [AllowNull()]
        $CriticalFreeGB = $null
    )

    $criticalPercent = if ($null -eq $CriticalFreePercent) { 0 } else { [double] $CriticalFreePercent }
    $warningPercent = if ($null -eq $WarningFreePercent) { 0 } else { [double] $WarningFreePercent }
    $criticalGB = if ($null -eq $CriticalFreeGB) { 0 } else { [double] $CriticalFreeGB }
    $warningGB = if ($null -eq $WarningFreeGB) { 0 } else { [double] $WarningFreeGB }

    if ($criticalPercent -gt 0 -and $FreePercent -lt $criticalPercent) { return 'Critical' }
    if ($criticalGB -gt 0 -and $FreeGB -lt $criticalGB) { return 'Critical' }
    if ($warningPercent -gt 0 -and $FreePercent -lt $warningPercent) { return 'Warning' }
    if ($warningGB -gt 0 -and $FreeGB -lt $warningGB) { return 'Warning' }
    return 'OK'
}

function Get-DiskCheckFinding {
    <#
        .SYNOPSIS
        収集したボリューム一覧から検知事項を組み立てる。純粋関数。

        .PARAMETER Volume
        DeviceID / Size / FreeSpace / VolumeName を持つオブジェクトの配列。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter()]
        [AllowNull()]
        [psobject[]] $Volume = @(),

        [Parameter()]
        [AllowNull()]
        $Setting = $null
    )

    $warningPercent = Get-ConfigValue -InputObject $Setting -Name 'warningFreePercent' -Default 20
    $criticalPercent = Get-ConfigValue -InputObject $Setting -Name 'criticalFreePercent' -Default 10
    $warningGB = Get-ConfigValue -InputObject $Setting -Name 'warningFreeGB' -Default 0
    $criticalGB = Get-ConfigValue -InputObject $Setting -Name 'criticalFreeGB' -Default 0

    $findings = New-Object System.Collections.ArrayList

    foreach ($item in @($Volume)) {
        if ($null -eq $item) { continue }

        $size = [double] $item.Size
        if ($size -le 0) { continue }

        $free = [double] $item.FreeSpace
        $freePercent = ($free / $size) * 100
        $freeGB = $free / 1GB

        $level = Get-DiskStatusLevel -FreePercent $freePercent -FreeGB $freeGB `
            -WarningFreePercent $warningPercent -CriticalFreePercent $criticalPercent `
            -WarningFreeGB $warningGB -CriticalFreeGB $criticalGB

        if ($level -eq 'OK') { continue }

        $label = [string] $item.DeviceID
        if (-not [string]::IsNullOrWhiteSpace([string] $item.VolumeName)) {
            $label = '{0} ({1})' -f $label, $item.VolumeName
        }

        $title = 'ディスク空き容量が不足しています: {0}' -f $label
        $message = '空き {0} / 全体 {1}（空き率 {2:N1}%）' -f `
        (Format-MonitorByte -Bytes $free), (Format-MonitorByte -Bytes $size), $freePercent

        $finding = New-CheckFinding -Key ([string] $item.DeviceID) -Level $level -Title $title `
            -Message $message -Value ([Math]::Round($freePercent, 1))
        $null = $findings.Add($finding)
    }

    return $findings.ToArray()
}

function Get-DiskVolumeData {
    <#
        .SYNOPSIS
        監視対象からローカルディスクのボリューム一覧を収集する。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target
    )

    # DriveType=3 はローカル固定ディスク。ネットワークドライブ・光学ドライブは対象外。
    $scriptBlock = {
        Get-CimInstance -ClassName Win32_LogicalDisk -Filter 'DriveType = 3' -ErrorAction Stop |
            Select-Object -Property DeviceID, VolumeName, Size, FreeSpace, FileSystem
    }

    return @(Invoke-MonitorScriptBlock -Target $Target -ScriptBlock $scriptBlock)
}

function Invoke-DiskCheck {
    <#
        .SYNOPSIS
        DSK チェックを 1 監視対象について実行する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target
    )

    $checkId = 'DSK'
    $checkName = 'ディスク空き容量'
    $targetName = [string] $Target.name

    if (-not (Test-CheckEnabled -Target $Target -CheckKey 'disk')) {
        return (New-SkippedCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName)
    }

    $config = Get-TargetCheckConfig -Target $Target -CheckKey 'disk'
    $excluded = @(Get-ConfigValue -InputObject $config -Name 'excludeVolumes' -Default @())

    try {
        $volumes = Get-DiskVolumeData -Target $Target
    }
    catch {
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName -Reason $_.Exception.Message)
    }

    $volumes = @($volumes | Where-Object { $excluded -notcontains [string] $_.DeviceID })

    $findings = Get-DiskCheckFinding -Volume $volumes -Setting $config

    $items = @()
    foreach ($item in $volumes) {
        $size = [double] $item.Size
        $free = [double] $item.FreeSpace
        $freePercent = if ($size -gt 0) { ($free / $size) * 100 } else { 0 }
        $items += [pscustomobject]@{
            DeviceID    = [string] $item.DeviceID
            VolumeName  = [string] $item.VolumeName
            SizeBytes   = $size
            FreeBytes   = $free
            FreePercent = [Math]::Round($freePercent, 1)
            UsedPercent = [Math]::Round(100 - $freePercent, 1)
            SizeText    = Format-MonitorByte -Bytes $size
            FreeText    = Format-MonitorByte -Bytes $free
        }
    }

    $summary = 'ボリューム {0} 件中 {1} 件が閾値を下回っています。' -f $volumes.Count, $findings.Count
    if ($findings.Count -eq 0) {
        $summary = 'ボリューム {0} 件はすべて閾値内です。' -f $volumes.Count
    }

    $lowest = $items | Sort-Object FreePercent | Select-Object -First 1
    $metrics = [pscustomobject]@{
        VolumeCount    = $volumes.Count
        ProblemCount   = $findings.Count
        MinFreePercent = if ($null -ne $lowest) { $lowest.FreePercent } else { $null }
    }

    return (New-CheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
            -Summary $summary -Findings $findings -Metrics $metrics -Items $items)
}

Export-ModuleMember -Function @(
    'Get-DiskStatusLevel'
    'Get-DiskCheckFinding'
    'Get-DiskVolumeData'
    'Invoke-DiskCheck'
)
