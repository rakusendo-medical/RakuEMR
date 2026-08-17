#Requires -Version 5.1
<#
    Check-HyperV.psm1 — VM: Hyper-V の状態監視

    日次。Hyper-V ホスト上でのみ有効にする。
      - 稼働しているべき VM が停止していないか
      - チェックポイント（スナップショット）が残っていないか
      - 割当メモリとホストの空きメモリ

    チェックポイントの残存を既定で通知するのは、放置すると差分ディスクが
    際限なく肥大し、ディスク枯渇に直結するため。
#>

Import-Module (Join-Path $PSScriptRoot 'Common.psm1') -DisableNameChecking -ErrorAction Stop

function Get-HyperVFinding {
    <#
        .SYNOPSIS
        Hyper-V の収集結果から検知事項を組み立てる。純粋関数。

        .PARAMETER Data
        VirtualMachines / Checkpoints / HostFreeMemoryBytes を持つオブジェクト。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Data,

        [Parameter()]
        [AllowNull()]
        $Setting = $null,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    $expectedRunning = @(Get-ConfigValue -InputObject $Setting -Name 'expectedRunningVms' -Default @())
    $warnOnCheckpoint = [bool] (Get-ConfigValue -InputObject $Setting -Name 'warnOnAnyCheckpoint' -Default $true)
    $checkpointCriticalDays = [double] (Get-ConfigValue -InputObject $Setting -Name 'checkpointCriticalAgeDays' -Default 7)
    $minFreeMemoryGB = [double] (Get-ConfigValue -InputObject $Setting -Name 'minHostFreeMemoryGB' -Default 0)

    $findings = New-Object System.Collections.ArrayList
    $machines = @($Data.VirtualMachines)

    # 稼働しているべき VM
    foreach ($name in $expectedRunning) {
        if ([string]::IsNullOrWhiteSpace([string] $name)) { continue }

        $machine = $machines | Where-Object { [string] $_.Name -eq [string] $name } | Select-Object -First 1
        if ($null -eq $machine) {
            $finding = New-CheckFinding -Key ('vm/{0}/missing' -f $name) -Level 'Critical' `
                -Title ('VM が存在しません: {0}' -f $name) `
                -Message '設定に挙げた VM がホスト上に見つかりません。VM 名の誤り、または削除された可能性があります。'
            $null = $findings.Add($finding)
            continue
        }

        if ([string] $machine.State -ne 'Running') {
            $finding = New-CheckFinding -Key ('vm/{0}/state' -f $name) -Level 'Critical' `
                -Title ('VM が停止しています: {0}' -f $name) `
                -Message ('状態={0}' -f $machine.State) -Value ([string] $machine.State)
            $null = $findings.Add($finding)
        }
    }

    # チェックポイントの残存
    if ($warnOnCheckpoint) {
        foreach ($checkpoint in @($Data.Checkpoints)) {
            if ($null -eq $checkpoint) { continue }

            $level = 'Warning'
            $ageText = '-'
            if ($null -ne $checkpoint.CreationTime) {
                $age = $Now - [datetime] $checkpoint.CreationTime
                $ageText = Format-MonitorTimeSpan -TimeSpan $age
                if ($checkpointCriticalDays -gt 0 -and $age.TotalDays -ge $checkpointCriticalDays) { $level = 'Critical' }
            }

            $finding = New-CheckFinding -Key ('checkpoint/{0}/{1}' -f $checkpoint.VMName, $checkpoint.Name) -Level $level `
                -Title ('チェックポイントが残っています: {0} / {1}' -f $checkpoint.VMName, $checkpoint.Name) `
                -Message ('作成={0}（{1} 前）。差分ディスクが肥大し続けるため、不要なら削除してください。' -f `
                (@{ $true = '不明'; $false = (([datetime] $checkpoint.CreationTime).ToString('yyyy-MM-dd HH:mm:ss')) }[$null -eq $checkpoint.CreationTime]), `
                    $ageText) `
                -Value $ageText
            $null = $findings.Add($finding)
        }
    }

    # ホストの空きメモリ
    if ($minFreeMemoryGB -gt 0 -and $null -ne $Data.HostFreeMemoryBytes) {
        $freeGB = [double] $Data.HostFreeMemoryBytes / 1GB
        if ($freeGB -lt $minFreeMemoryGB) {
            $finding = New-CheckFinding -Key 'host/memory' -Level 'Warning' `
                -Title 'Hyper-V ホストの空きメモリが不足しています' `
                -Message ('空き {0}（下限 {1:N0} GB）' -f (Format-MonitorByte -Bytes $Data.HostFreeMemoryBytes), $minFreeMemoryGB) `
                -Value ([Math]::Round($freeGB, 1))
            $null = $findings.Add($finding)
        }
    }

    return $findings.ToArray()
}

function Get-HyperVData {
    <#
        .SYNOPSIS
        監視対象（Hyper-V ホスト）から VM とチェックポイントの情報を収集する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target
    )

    $scriptBlock = {
        $machines = @()
        foreach ($machine in @(Get-VM -ErrorAction Stop)) {
            $machines += [pscustomobject]@{
                Name             = $machine.Name
                State            = [string] $machine.State
                Status           = [string] $machine.Status
                MemoryAssigned   = [long] $machine.MemoryAssigned
                MemoryStartup    = [long] $machine.MemoryStartup
                DynamicMemory    = [bool] $machine.DynamicMemoryEnabled
                UptimeSeconds    = [long] $machine.Uptime.TotalSeconds
                CPUUsagePercent  = [int] $machine.CPUUsage
                IntegrationState = [string] $machine.Status
            }
        }

        $checkpoints = @()
        foreach ($snapshot in @(Get-VMSnapshot -VMName '*' -ErrorAction SilentlyContinue)) {
            $checkpoints += [pscustomobject]@{
                VMName       = $snapshot.VMName
                Name         = $snapshot.Name
                CreationTime = $snapshot.CreationTime
                Type         = [string] $snapshot.SnapshotType
            }
        }

        $freeMemoryBytes = $null
        try {
            $operatingSystem = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction Stop
            $freeMemoryBytes = [long] $operatingSystem.FreePhysicalMemory * 1024
        }
        catch {
            $freeMemoryBytes = $null
        }

        return [pscustomobject]@{
            VirtualMachines     = $machines
            Checkpoints         = $checkpoints
            HostFreeMemoryBytes = $freeMemoryBytes
        }
    }

    return (Invoke-MonitorScriptBlock -Target $Target -ScriptBlock $scriptBlock)
}

function Invoke-HyperVCheck {
    <#
        .SYNOPSIS
        VM チェックを 1 監視対象について実行する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    $checkId = 'VM'
    $checkName = 'Hyper-V'
    $targetName = [string] $Target.name

    if (-not (Test-CheckEnabled -Target $Target -CheckKey 'hyperV')) {
        return (New-SkippedCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName)
    }

    $config = Get-TargetCheckConfig -Target $Target -CheckKey 'hyperV'

    try {
        $data = Get-HyperVData -Target $Target
    }
    catch {
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName -Reason $_.Exception.Message)
    }

    if ($null -eq $data) {
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
                -Reason 'Hyper-V の情報を取得できませんでした。')
    }

    $findings = Get-HyperVFinding -Data $data -Setting $config -Now $Now

    $machines = @($data.VirtualMachines)
    $checkpoints = @($data.Checkpoints)

    $items = @()
    foreach ($machine in $machines) {
        $items += [pscustomobject]@{
            Name            = [string] $machine.Name
            State           = [string] $machine.State
            MemoryAssigned  = [long] $machine.MemoryAssigned
            MemoryText      = Format-MonitorByte -Bytes $machine.MemoryAssigned
            CPUUsagePercent = [int] $machine.CPUUsagePercent
            CheckpointCount = @($checkpoints | Where-Object { [string] $_.VMName -eq [string] $machine.Name }).Count
        }
    }

    $runningCount = @($machines | Where-Object { [string] $_.State -eq 'Running' }).Count
    $summary = 'VM {0} 台（稼働 {1} 台） / チェックポイント {2} 件 / ホスト空きメモリ {3}' -f `
        $machines.Count, $runningCount, $checkpoints.Count, (Format-MonitorByte -Bytes $data.HostFreeMemoryBytes)

    $metrics = [pscustomobject]@{
        VmCount             = $machines.Count
        RunningCount        = $runningCount
        CheckpointCount     = $checkpoints.Count
        HostFreeMemoryBytes = $data.HostFreeMemoryBytes
    }

    return (New-CheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
            -Summary $summary -Findings $findings -Metrics $metrics -Items $items)
}

Export-ModuleMember -Function @(
    'Get-HyperVFinding'
    'Get-HyperVData'
    'Invoke-HyperVCheck'
)
