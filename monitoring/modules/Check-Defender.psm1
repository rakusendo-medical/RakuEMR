#Requires -Version 5.1
<#
    Check-Defender.psm1 — DEF: Microsoft Defender の状態監視

    日次。リアルタイム保護が無効になっていること、定義更新が止まっていることに
    誰も気づかないまま 1 年以上経過した事象への対策。

    Get-MpComputerStatus / Get-MpPreference は Defender 機能が入っている Windows で
    利用できる。取得できない場合は Unknown（＝気づけない状態）として通知する。
#>

Import-Module (Join-Path $PSScriptRoot 'Common.psm1') -DisableNameChecking -ErrorAction Stop

function Get-DefenderCheckFinding {
    <#
        .SYNOPSIS
        Defender の状態から検知事項を組み立てる。純粋関数。

        .PARAMETER Status
        RealTimeProtectionEnabled / AntivirusSignatureLastUpdated / TamperProtectionEnabled /
        AntivirusEnabled / AntispywareSignatureLastUpdated を持つオブジェクト。

        .PARAMETER Setting
        checks.defender の設定。

        .PARAMETER Now
        判定基準時刻。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Status,

        [Parameter()]
        [AllowNull()]
        $Setting = $null,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    $requireRealTime = [bool] (Get-ConfigValue -InputObject $Setting -Name 'requireRealTimeProtection' -Default $true)
    $requireTamper = [bool] (Get-ConfigValue -InputObject $Setting -Name 'requireTamperProtection' -Default $true)
    $warningAgeDays = [double] (Get-ConfigValue -InputObject $Setting -Name 'signatureWarningAgeDays' -Default 3)
    $criticalAgeDays = [double] (Get-ConfigValue -InputObject $Setting -Name 'signatureCriticalAgeDays' -Default 7)

    $findings = New-Object System.Collections.ArrayList

    if ($requireRealTime -and -not [bool] $Status.RealTimeProtectionEnabled) {
        $finding = New-CheckFinding -Key 'realtime' -Level 'Critical' `
            -Title 'Defender のリアルタイム保護が無効です' `
            -Message 'ウイルス対策が実質的に機能していません。無効化された経緯を確認してください。' `
            -Value $false
        $null = $findings.Add($finding)
    }

    if ($null -ne $Status.PSObject.Properties['AntivirusEnabled'] -and -not [bool] $Status.AntivirusEnabled) {
        $finding = New-CheckFinding -Key 'antivirus' -Level 'Critical' `
            -Title 'Defender のウイルス対策が無効です' `
            -Message '別のウイルス対策製品が導入されている場合を除き、無効のまま運用してはいけません。' `
            -Value $false
        $null = $findings.Add($finding)
    }

    if ($requireTamper -and $null -ne $Status.PSObject.Properties['TamperProtectionEnabled'] -and
        -not [bool] $Status.TamperProtectionEnabled) {
        $finding = New-CheckFinding -Key 'tamper' -Level 'Warning' `
            -Title 'Defender の改ざん防止が無効です' `
            -Message '改ざん防止が無効だと、保護設定が外部から変更されても検知できません。' `
            -Value $false
        $null = $findings.Add($finding)
    }

    $signatureDate = $Status.AntivirusSignatureLastUpdated
    if ($null -eq $signatureDate) {
        $finding = New-CheckFinding -Key 'signature' -Level 'Unknown' `
            -Title 'Defender の定義更新日を取得できません' `
            -Message '定義が最新かどうか判断できません。'
        $null = $findings.Add($finding)
    }
    else {
        $age = $Now - [datetime] $signatureDate
        $level = 'OK'
        if ($criticalAgeDays -gt 0 -and $age.TotalDays -ge $criticalAgeDays) { $level = 'Critical' }
        elseif ($warningAgeDays -gt 0 -and $age.TotalDays -ge $warningAgeDays) { $level = 'Warning' }

        if ($level -ne 'OK') {
            $finding = New-CheckFinding -Key 'signature' -Level $level `
                -Title 'Defender の定義が古くなっています' `
                -Message ('最終更新={0}（{1} 前 / 閾値 {2} 日）' -f `
                    ([datetime] $signatureDate).ToString('yyyy-MM-dd HH:mm:ss'), `
                    (Format-MonitorTimeSpan -TimeSpan $age), $warningAgeDays) `
                -Value ([Math]::Round($age.TotalDays, 1))
            $null = $findings.Add($finding)
        }
    }

    return $findings.ToArray()
}

function Get-DefenderStatusData {
    <#
        .SYNOPSIS
        監視対象から Defender の状態を収集する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target
    )

    $scriptBlock = {
        $status = Get-MpComputerStatus -ErrorAction Stop

        $tamper = $null
        if ($null -ne $status.PSObject.Properties['IsTamperProtected']) {
            $tamper = $status.IsTamperProtected
        }

        [pscustomobject]@{
            RealTimeProtectionEnabled       = $status.RealTimeProtectionEnabled
            AntivirusEnabled                = $status.AntivirusEnabled
            TamperProtectionEnabled         = $tamper
            AntivirusSignatureLastUpdated   = $status.AntivirusSignatureLastUpdated
            AntivirusSignatureVersion       = $status.AntivirusSignatureVersion
            AntispywareSignatureLastUpdated = $status.AntispywareSignatureLastUpdated
            AMServiceEnabled                = $status.AMServiceEnabled
            QuickScanEndTime                = $status.QuickScanEndTime
        }
    }

    return (Invoke-MonitorScriptBlock -Target $Target -ScriptBlock $scriptBlock)
}

function Invoke-DefenderCheck {
    <#
        .SYNOPSIS
        DEF チェックを 1 監視対象について実行する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    $checkId = 'DEF'
    $checkName = 'Defender'
    $targetName = [string] $Target.name

    if (-not (Test-CheckEnabled -Target $Target -CheckKey 'defender')) {
        return (New-SkippedCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName)
    }

    $config = Get-TargetCheckConfig -Target $Target -CheckKey 'defender'

    try {
        $status = Get-DefenderStatusData -Target $Target
    }
    catch {
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName -Reason $_.Exception.Message)
    }

    if ($null -eq $status) {
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
                -Reason 'Defender の状態を取得できませんでした。')
    }

    $findings = Get-DefenderCheckFinding -Status $status -Setting $config -Now $Now

    $signatureText = '-'
    $signatureAge = $null
    if ($null -ne $status.AntivirusSignatureLastUpdated) {
        $signatureDate = [datetime] $status.AntivirusSignatureLastUpdated
        $signatureText = $signatureDate.ToString('yyyy-MM-dd HH:mm:ss')
        $signatureAge = [Math]::Round(($Now - $signatureDate).TotalDays, 1)
    }

    $items = @([pscustomobject]@{
            RealTimeProtection = [bool] $status.RealTimeProtectionEnabled
            AntivirusEnabled   = [bool] $status.AntivirusEnabled
            TamperProtection   = $status.TamperProtectionEnabled
            SignatureUpdated   = $signatureText
            SignatureAgeDays   = $signatureAge
            SignatureVersion   = [string] $status.AntivirusSignatureVersion
        })

    $summary = 'リアルタイム保護={0} / 定義更新={1}' -f `
    (@{ $true = '有効'; $false = '無効' }[[bool] $status.RealTimeProtectionEnabled]), $signatureText

    $metrics = [pscustomobject]@{
        RealTimeProtection = [bool] $status.RealTimeProtectionEnabled
        SignatureAgeDays   = $signatureAge
    }

    return (New-CheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
            -Summary $summary -Findings $findings -Metrics $metrics -Items $items)
}

Export-ModuleMember -Function @(
    'Get-DefenderCheckFinding'
    'Get-DefenderStatusData'
    'Invoke-DefenderCheck'
)
