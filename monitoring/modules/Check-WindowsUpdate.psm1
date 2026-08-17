#Requires -Version 5.1
<#
    Check-WindowsUpdate.psm1 — WU: Windows Update の最終適用日

    日次。踏み台サーバで 7 年 4 か月にわたり未適用だった事象への対策。

    PSWindowsUpdate などの外部モジュールには依存しない。取得は以下の順に試み、
    最も新しい日付を採用する。
      1. Microsoft.Update.Session の更新履歴（OS 標準の COM。最も正確）
      2. レジストリの LastSuccessTime（自動更新の最終成功時刻）
      3. Get-HotFix の InstalledOn（上の 2 つが取れない場合の保険）

    オンライン検索（未適用件数の照会）は行わない。外向き通信に制限がある環境で
    実行が長時間ブロックされるのを避けるため。
#>

Import-Module (Join-Path $PSScriptRoot 'Common.psm1') -DisableNameChecking -ErrorAction Stop

function Get-WindowsUpdateLevel {
    <#
        .SYNOPSIS
        最終適用日からの経過日数で判定レベルを返す。純粋関数。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter()]
        [AllowNull()]
        $LastInstalledOn,

        [Parameter()]
        [datetime] $Now = (Get-Date),

        [Parameter()]
        [double] $WarningAgeDays = 30,

        [Parameter()]
        [double] $CriticalAgeDays = 45
    )

    if ($null -eq $LastInstalledOn) { return 'Unknown' }

    $ageDays = ($Now - [datetime] $LastInstalledOn).TotalDays
    if ($CriticalAgeDays -gt 0 -and $ageDays -ge $CriticalAgeDays) { return 'Critical' }
    if ($WarningAgeDays -gt 0 -and $ageDays -ge $WarningAgeDays) { return 'Warning' }
    return 'OK'
}

function Get-WindowsUpdateFinding {
    <#
        .SYNOPSIS
        Windows Update の収集結果から検知事項を組み立てる。純粋関数。

        .PARAMETER Data
        LastInstalledOn / Source / LastTitle を持つオブジェクト。
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

    $warningAgeDays = [double] (Get-ConfigValue -InputObject $Setting -Name 'warningAgeDays' -Default 30)
    $criticalAgeDays = [double] (Get-ConfigValue -InputObject $Setting -Name 'criticalAgeDays' -Default 45)

    $level = Get-WindowsUpdateLevel -LastInstalledOn $Data.LastInstalledOn -Now $Now `
        -WarningAgeDays $warningAgeDays -CriticalAgeDays $criticalAgeDays

    if ($level -eq 'OK') { return @() }

    if ($level -eq 'Unknown') {
        $finding = New-CheckFinding -Key 'lastinstall' -Level 'Unknown' `
            -Title 'Windows Update の最終適用日を取得できません' `
            -Message '更新履歴・レジストリ・Get-HotFix のいずれからも取得できませんでした。手動で確認してください。'
        return @($finding)
    }

    $age = $Now - [datetime] $Data.LastInstalledOn
    $finding = New-CheckFinding -Key 'lastinstall' -Level $level `
        -Title 'Windows Update が長期間適用されていません' `
        -Message ('最終適用={0}（{1} 前 / 閾値 警告 {2} 日・危険 {3} 日）{4}取得元={5}' -f `
            ([datetime] $Data.LastInstalledOn).ToString('yyyy-MM-dd'), `
            (Format-MonitorTimeSpan -TimeSpan $age), $warningAgeDays, $criticalAgeDays, `
            [Environment]::NewLine, $Data.Source) `
        -Value ([Math]::Round($age.TotalDays, 0))

    return @($finding)
}

function Get-WindowsUpdateData {
    <#
        .SYNOPSIS
        監視対象から Windows Update の最終適用日を収集する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target
    )

    $scriptBlock = {
        $candidates = @()

        # 1. 更新履歴（OS 標準の COM。ResultCode 2 = 成功、3 = 一部成功）
        try {
            $session = New-Object -ComObject Microsoft.Update.Session
            $searcher = $session.CreateUpdateSearcher()
            $total = $searcher.GetTotalHistoryCount()
            if ($total -gt 0) {
                $history = $searcher.QueryHistory(0, [Math]::Min($total, 200))
                foreach ($entry in $history) {
                    # Operation 1 = インストール
                    if ($entry.Operation -ne 1) { continue }
                    if ($entry.ResultCode -ne 2 -and $entry.ResultCode -ne 3) { continue }
                    $candidates += [pscustomobject]@{
                        Date   = $entry.Date
                        Title  = $entry.Title
                        Source = '更新履歴 (Microsoft.Update.Session)'
                    }
                }
            }
        }
        catch {
            $candidates += @()
        }

        # 2. 自動更新の最終成功時刻
        try {
            $resultKey = 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\Results\Install'
            $property = Get-ItemProperty -Path $resultKey -ErrorAction Stop
            if (-not [string]::IsNullOrWhiteSpace([string] $property.LastSuccessTime)) {
                $parsed = [datetime]::MinValue
                if ([datetime]::TryParse([string] $property.LastSuccessTime, [ref] $parsed)) {
                    $candidates += [pscustomobject]@{
                        Date   = $parsed
                        Title  = ''
                        Source = 'レジストリ (Auto Update / LastSuccessTime)'
                    }
                }
            }
        }
        catch {
            $candidates += @()
        }

        # 3. Get-HotFix（保険）
        try {
            $hotfix = Get-HotFix -ErrorAction Stop |
                Where-Object { $null -ne $_.InstalledOn } |
                Sort-Object InstalledOn -Descending |
                Select-Object -First 1
            if ($null -ne $hotfix) {
                $candidates += [pscustomobject]@{
                    Date   = $hotfix.InstalledOn
                    Title  = [string] $hotfix.HotFixID
                    Source = 'Get-HotFix'
                }
            }
        }
        catch {
            $candidates += @()
        }

        $newest = $candidates | Where-Object { $null -ne $_.Date } | Sort-Object Date -Descending | Select-Object -First 1

        return [pscustomobject]@{
            LastInstalledOn = if ($null -ne $newest) { $newest.Date } else { $null }
            LastTitle       = if ($null -ne $newest) { [string] $newest.Title } else { '' }
            Source          = if ($null -ne $newest) { [string] $newest.Source } else { '取得できず' }
            CandidateCount  = @($candidates).Count
        }
    }

    return (Invoke-MonitorScriptBlock -Target $Target -ScriptBlock $scriptBlock)
}

function Invoke-WindowsUpdateCheck {
    <#
        .SYNOPSIS
        WU チェックを 1 監視対象について実行する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    $checkId = 'WU'
    $checkName = 'Windows Update'
    $targetName = [string] $Target.name

    if (-not (Test-CheckEnabled -Target $Target -CheckKey 'windowsUpdate')) {
        return (New-SkippedCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName)
    }

    $config = Get-TargetCheckConfig -Target $Target -CheckKey 'windowsUpdate'

    try {
        $data = Get-WindowsUpdateData -Target $Target
    }
    catch {
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName -Reason $_.Exception.Message)
    }

    if ($null -eq $data) {
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
                -Reason 'Windows Update の情報を取得できませんでした。')
    }

    $findings = Get-WindowsUpdateFinding -Data $data -Setting $config -Now $Now

    $lastText = '-'
    $ageDays = $null
    if ($null -ne $data.LastInstalledOn) {
        $last = [datetime] $data.LastInstalledOn
        $lastText = $last.ToString('yyyy-MM-dd')
        $ageDays = [Math]::Round(($Now - $last).TotalDays, 0)
    }

    $items = @([pscustomobject]@{
            LastInstalledOn = $lastText
            AgeDays         = $ageDays
            LastTitle       = [string] $data.LastTitle
            Source          = [string] $data.Source
        })

    $summary = '最終適用={0}{1}' -f $lastText, (@{ $true = ''; $false = (' ({0} 日前)' -f $ageDays) }[$null -eq $ageDays])

    $metrics = [pscustomobject]@{ AgeDays = $ageDays }

    return (New-CheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
            -Summary $summary -Findings $findings -Metrics $metrics -Items $items)
}

Export-ModuleMember -Function @(
    'Get-WindowsUpdateLevel'
    'Get-WindowsUpdateFinding'
    'Get-WindowsUpdateData'
    'Invoke-WindowsUpdateCheck'
)
