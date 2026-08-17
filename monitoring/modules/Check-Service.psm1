#Requires -Version 5.1
<#
    Check-Service.psm1 — SVC: サービス稼働監視

    15 分間隔。required に挙げたサービスが Running でなければ即通知する。
    読み取り専用。サービスの起動・再起動は行わない（誤判定で会計システムを止めないため）。
#>

# -Force を付けないこと（呼び出し元の Common がアンロードされるため）。
Import-Module (Join-Path $PSScriptRoot 'Common.psm1') -DisableNameChecking -ErrorAction Stop

function Get-ServiceStateLevel {
    <#
        .SYNOPSIS
        1 サービスの状態から判定レベルを返す。純粋関数。

        .PARAMETER State
        サービスの状態文字列（Running / Stopped / 等）。サービスが存在しない場合は空文字。

        .PARAMETER Exists
        サービスが存在するか。

        .PARAMETER IsRequired
        必須サービスか。false の場合、停止していても Warning にとどめる。

        .PARAMETER TreatMissingAsCritical
        サービスが存在しない場合に Critical とするか。false なら Unknown。

        .OUTPUTS
        OK / Warning / Critical / Unknown のいずれか。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter()]
        [AllowEmptyString()]
        [AllowNull()]
        [string] $State,

        [Parameter()]
        [bool] $Exists = $true,

        [Parameter()]
        [bool] $IsRequired = $true,

        [Parameter()]
        [bool] $TreatMissingAsCritical = $true
    )

    if (-not $Exists) {
        if (-not $IsRequired) { return 'Warning' }
        if ($TreatMissingAsCritical) { return 'Critical' }
        return 'Unknown'
    }

    if ($State -eq 'Running') { return 'OK' }
    if ($IsRequired) { return 'Critical' }
    return 'Warning'
}

function Get-ServiceCheckFinding {
    <#
        .SYNOPSIS
        収集したサービス一覧から検知事項を組み立てる。純粋関数。

        .PARAMETER ServiceState
        Name / DisplayName / State / StartMode / Exists を持つオブジェクトの配列。

        .PARAMETER Required
        必須サービス名の配列。

        .PARAMETER Optional
        任意サービス名の配列。停止していても Warning にとどめる。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter()]
        [AllowNull()]
        [psobject[]] $ServiceState = @(),

        [Parameter()]
        [AllowNull()]
        [string[]] $Required = @(),

        [Parameter()]
        [AllowNull()]
        [string[]] $Optional = @(),

        [Parameter()]
        [bool] $TreatMissingAsCritical = $true
    )

    $findings = New-Object System.Collections.ArrayList
    $index = @{}
    foreach ($item in @($ServiceState)) {
        if ($null -eq $item) { continue }
        $index[([string] $item.Name).ToLowerInvariant()] = $item
    }

    $entries = @()
    foreach ($name in @($Required)) { $entries += , @($name, $true) }
    foreach ($name in @($Optional)) { $entries += , @($name, $false) }

    foreach ($entry in $entries) {
        $name = [string] $entry[0]
        if ([string]::IsNullOrWhiteSpace($name)) { continue }
        $isRequired = [bool] $entry[1]

        $key = $name.ToLowerInvariant()
        $service = $null
        if ($index.ContainsKey($key)) { $service = $index[$key] }

        $exists = ($null -ne $service)
        $state = if ($exists) { [string] $service.State } else { '' }
        $displayName = if ($exists -and -not [string]::IsNullOrWhiteSpace([string] $service.DisplayName)) { [string] $service.DisplayName } else { $name }
        $startMode = if ($exists) { [string] $service.StartMode } else { '' }

        $level = Get-ServiceStateLevel -State $state -Exists $exists -IsRequired $isRequired `
            -TreatMissingAsCritical $TreatMissingAsCritical
        if ($level -eq 'OK') { continue }

        if (-not $exists) {
            $title = 'サービスが存在しません: {0}' -f $name
            $message = '設定に挙げたサービス名が対象サーバに見つかりません。サービス名の誤り、または未インストールの可能性があります。'
        }
        else {
            $title = 'サービスが停止しています: {0} ({1})' -f $displayName, $name
            $message = '状態={0} / スタートアップの種類={1}' -f $state, $startMode
            if ($startMode -eq 'Disabled') {
                $message = '{0} ※スタートアップの種類が「無効」になっています。' -f $message
            }
        }

        $finding = New-CheckFinding -Key $name -Level $level -Title $title -Message $message -Value $state
        $null = $findings.Add($finding)
    }

    return $findings.ToArray()
}

function Get-ServiceStateData {
    <#
        .SYNOPSIS
        監視対象からサービス一覧を収集する。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target
    )

    # サービス名に '$'（例: MSSQL$YAYOI）が含まれるため WQL でのフィルタは行わず、
    # 全件取得して PowerShell 側で突き合わせる。
    $scriptBlock = {
        Get-CimInstance -ClassName Win32_Service -ErrorAction Stop |
            Select-Object -Property Name, DisplayName, State, StartMode, StartName
    }

    return @(Invoke-MonitorScriptBlock -Target $Target -ScriptBlock $scriptBlock)
}

function Invoke-ServiceCheck {
    <#
        .SYNOPSIS
        SVC チェックを 1 監視対象について実行する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target
    )

    $checkId = 'SVC'
    $checkName = 'サービス稼働'
    $targetName = [string] $Target.name

    if (-not (Test-CheckEnabled -Target $Target -CheckKey 'service')) {
        return (New-SkippedCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName)
    }

    $config = Get-TargetCheckConfig -Target $Target -CheckKey 'service'
    $required = @(Get-ConfigValue -InputObject $config -Name 'required' -Default @())
    $optional = @(Get-ConfigValue -InputObject $config -Name 'optional' -Default @())
    $treatMissingAsCritical = [bool] (Get-ConfigValue -InputObject $config -Name 'treatMissingAsCritical' -Default $true)

    try {
        $services = Get-ServiceStateData -Target $Target
    }
    catch {
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName -Reason $_.Exception.Message)
    }

    $findings = Get-ServiceCheckFinding -ServiceState $services -Required $required -Optional $optional `
        -TreatMissingAsCritical $treatMissingAsCritical

    $watched = @($required) + @($optional)
    $items = @()
    foreach ($name in $watched) {
        $service = $services | Where-Object { $_.Name -eq $name } | Select-Object -First 1
        $items += [pscustomobject]@{
            Name        = $name
            DisplayName = if ($null -ne $service) { [string] $service.DisplayName } else { $name }
            State       = if ($null -ne $service) { [string] $service.State } else { '(存在しません)' }
            StartMode   = if ($null -ne $service) { [string] $service.StartMode } else { '-' }
        }
    }

    $summary = '監視対象 {0} 件中 {1} 件に問題があります。' -f $watched.Count, $findings.Count
    if ($findings.Count -eq 0) { $summary = '監視対象 {0} 件はすべて稼働中です。' -f $watched.Count }

    $metrics = [pscustomobject]@{
        WatchedCount = $watched.Count
        ProblemCount = $findings.Count
    }

    return (New-CheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
            -Summary $summary -Findings $findings -Metrics $metrics -Items $items)
}

Export-ModuleMember -Function @(
    'Get-ServiceStateLevel'
    'Get-ServiceCheckFinding'
    'Get-ServiceStateData'
    'Invoke-ServiceCheck'
)
