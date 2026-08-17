#Requires -Version 5.1
<#
    Check-RdsLicense.psm1 — CAL: RDS デバイス CAL の発行数・残数

    日次。デバイス CAL 20 本が枯渇して一部端末が接続不能になった事象への対策。
    Win32_TSLicenseKeyPack（RD ライセンスサーバ上に存在する）から取得する。

    残数は割合と実数の両方で判定する。母数が小さい環境（20 本規模）では
    割合だけでは 1〜2 本の枯渇に気づくのが遅れるため。
#>

Import-Module (Join-Path $PSScriptRoot 'Common.psm1') -DisableNameChecking -ErrorAction Stop

function Get-RdsLicenseLevel {
    <#
        .SYNOPSIS
        CAL の発行数・総数から判定レベルを返す。純粋関数。

        .PARAMETER TotalLicenses
        CAL の総数。

        .PARAMETER AvailableLicenses
        残り本数。

        .PARAMETER MinRemainingCount
        残り本数がこれを下回ったら Critical。割合と OR で評価する。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [int] $TotalLicenses,

        [Parameter(Mandatory = $true)]
        [int] $AvailableLicenses,

        [Parameter()]
        [double] $WarningRemainingPercent = 20,

        [Parameter()]
        [double] $CriticalRemainingPercent = 10,

        [Parameter()]
        [int] $MinRemainingCount = 2
    )

    if ($TotalLicenses -le 0) { return 'Unknown' }

    $remainingPercent = ($AvailableLicenses / [double] $TotalLicenses) * 100

    if ($MinRemainingCount -gt 0 -and $AvailableLicenses -lt $MinRemainingCount) { return 'Critical' }
    if ($CriticalRemainingPercent -gt 0 -and $remainingPercent -lt $CriticalRemainingPercent) { return 'Critical' }
    if ($WarningRemainingPercent -gt 0 -and $remainingPercent -lt $WarningRemainingPercent) { return 'Warning' }
    return 'OK'
}

function Get-RdsLicenseFinding {
    <#
        .SYNOPSIS
        キーパック一覧から検知事項を組み立てる。純粋関数。

        .PARAMETER KeyPack
        KeyPackId / TypeAndModel / ProductVersion / KeyPackType / TotalLicenses /
        IssuedLicenses / AvailableLicenses を持つ配列。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter()]
        [AllowNull()]
        [psobject[]] $KeyPack = @(),

        [Parameter()]
        [AllowNull()]
        $Setting = $null
    )

    $warningPercent = [double] (Get-ConfigValue -InputObject $Setting -Name 'warningRemainingPercent' -Default 20)
    $criticalPercent = [double] (Get-ConfigValue -InputObject $Setting -Name 'criticalRemainingPercent' -Default 10)
    $minRemaining = [int] (Get-ConfigValue -InputObject $Setting -Name 'minRemainingCount' -Default 2)
    $includeTypes = @(Get-ConfigValue -InputObject $Setting -Name 'includeKeyPackTypes' -Default @())

    $packs = @(@($KeyPack) | Where-Object {
            $null -ne $_ -and [int] $_.TotalLicenses -gt 0 -and
        ($includeTypes.Count -eq 0 -or $includeTypes -contains [int] $_.KeyPackType)
        })

    if ($packs.Count -eq 0) {
        $finding = New-CheckFinding -Key 'nopack' -Level 'Unknown' `
            -Title 'RDS の CAL キーパックが見つかりません' `
            -Message 'Win32_TSLicenseKeyPack から有効なキーパックを取得できませんでした。RD ライセンスサーバ上で実行されているか確認してください。'
        return @($finding)
    }

    $total = 0
    $issued = 0
    $available = 0
    foreach ($pack in $packs) {
        $total += [int] $pack.TotalLicenses
        $issued += [int] $pack.IssuedLicenses
        $available += [int] $pack.AvailableLicenses
    }

    $level = Get-RdsLicenseLevel -TotalLicenses $total -AvailableLicenses $available `
        -WarningRemainingPercent $warningPercent -CriticalRemainingPercent $criticalPercent `
        -MinRemainingCount $minRemaining

    if ($level -eq 'OK') { return @() }

    $remainingPercent = if ($total -gt 0) { ($available / [double] $total) * 100 } else { 0 }
    $finding = New-CheckFinding -Key 'remaining' -Level $level `
        -Title 'RDS デバイス CAL の残数が少なくなっています' `
        -Message ('総数 {0} / 発行済 {1} / 残 {2}（残 {3:N1}%）。枯渇すると端末が接続できなくなります。' -f `
            $total, $issued, $available, $remainingPercent) `
        -Value $available

    return @($finding)
}

function Get-RdsLicenseData {
    <#
        .SYNOPSIS
        監視対象から RDS の CAL キーパック一覧を収集する。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target
    )

    $scriptBlock = {
        Get-CimInstance -ClassName Win32_TSLicenseKeyPack -Namespace 'root\CIMV2' -ErrorAction Stop |
            Select-Object -Property KeyPackId, KeyPackType, ProductVersion, TypeAndModel,
            TotalLicenses, IssuedLicenses, AvailableLicenses, ExpirationDate
    }

    return @(Invoke-MonitorScriptBlock -Target $Target -ScriptBlock $scriptBlock)
}

function Invoke-RdsLicenseCheck {
    <#
        .SYNOPSIS
        CAL チェックを 1 監視対象について実行する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target
    )

    $checkId = 'CAL'
    $checkName = 'RDS デバイス CAL'
    $targetName = [string] $Target.name

    if (-not (Test-CheckEnabled -Target $Target -CheckKey 'rdsLicense')) {
        return (New-SkippedCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName)
    }

    $config = Get-TargetCheckConfig -Target $Target -CheckKey 'rdsLicense'

    try {
        $keyPacks = Get-RdsLicenseData -Target $Target
    }
    catch {
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName -Reason $_.Exception.Message)
    }

    $findings = Get-RdsLicenseFinding -KeyPack $keyPacks -Setting $config

    $includeTypes = @(Get-ConfigValue -InputObject $config -Name 'includeKeyPackTypes' -Default @())
    $packs = @(@($keyPacks) | Where-Object {
            [int] $_.TotalLicenses -gt 0 -and ($includeTypes.Count -eq 0 -or $includeTypes -contains [int] $_.KeyPackType)
        })

    $total = 0
    $issued = 0
    $available = 0
    $items = @()
    foreach ($pack in $packs) {
        $total += [int] $pack.TotalLicenses
        $issued += [int] $pack.IssuedLicenses
        $available += [int] $pack.AvailableLicenses
        $items += [pscustomobject]@{
            KeyPackId    = [string] $pack.KeyPackId
            TypeAndModel = [string] $pack.TypeAndModel
            KeyPackType  = [int] $pack.KeyPackType
            Total        = [int] $pack.TotalLicenses
            Issued       = [int] $pack.IssuedLicenses
            Available    = [int] $pack.AvailableLicenses
        }
    }

    $remainingPercent = if ($total -gt 0) { [Math]::Round(($available / [double] $total) * 100, 1) } else { $null }
    $summary = if ($total -gt 0) {
        '総数 {0} / 発行済 {1} / 残 {2}（残 {3}%）' -f $total, $issued, $available, $remainingPercent
    }
    else {
        '有効な CAL キーパックが見つかりません。'
    }

    $metrics = [pscustomobject]@{
        Total            = $total
        Issued           = $issued
        Available        = $available
        RemainingPercent = $remainingPercent
    }

    return (New-CheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
            -Summary $summary -Findings $findings -Metrics $metrics -Items $items)
}

Export-ModuleMember -Function @(
    'Get-RdsLicenseLevel'
    'Get-RdsLicenseFinding'
    'Get-RdsLicenseData'
    'Invoke-RdsLicenseCheck'
)
