#Requires -Version 5.1
<#
    Check-EventLog.psm1 — EVT: イベントログ監視

    1 時間間隔。System / Application の Error（レベル 2）・Critical（レベル 1）を集計する。
    既知で無害なイベントは設定の ignore で除外できる。除外には必ず理由を書かせる方針
    （理由の無い除外は、後から誰も妥当性を判断できなくなるため）。
#>

Import-Module (Join-Path $PSScriptRoot 'Common.psm1') -DisableNameChecking -ErrorAction Stop

function Test-EventIgnored {
    <#
        .SYNOPSIS
        1 件のイベントが除外条件に該当するかを判定する。純粋関数。

        .PARAMETER LogEntry
        LogName / Id / ProviderName を持つオブジェクト。

        .PARAMETER IgnoreRule
        eventId / logName / providerName を持つ除外条件の配列。
        logName / providerName が未指定（null または空）なら、その条件は問わない。
        providerName はワイルドカード（-like）で比較する。
    #>
    [CmdletBinding()]
    [OutputType([bool])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $LogEntry,

        [Parameter()]
        [AllowNull()]
        [psobject[]] $IgnoreRule = @()
    )

    foreach ($rule in @($IgnoreRule)) {
        if ($null -eq $rule) { continue }

        $ruleId = Get-ConfigValue -InputObject $rule -Name 'eventId'
        if ($null -ne $ruleId -and [int] $ruleId -ne [int] $LogEntry.Id) { continue }

        $ruleLog = [string] (Get-ConfigValue -InputObject $rule -Name 'logName' -Default '')
        if (-not [string]::IsNullOrWhiteSpace($ruleLog) -and $ruleLog -ne [string] $LogEntry.LogName) { continue }

        $ruleProvider = [string] (Get-ConfigValue -InputObject $rule -Name 'providerName' -Default '')
        if (-not [string]::IsNullOrWhiteSpace($ruleProvider) -and [string] $LogEntry.ProviderName -notlike $ruleProvider) { continue }

        # eventId が未指定かつログ・プロバイダも未指定の除外条件は、全件除外になり危険なので無視する。
        if ($null -eq $ruleId -and [string]::IsNullOrWhiteSpace($ruleLog) -and [string]::IsNullOrWhiteSpace($ruleProvider)) {
            continue
        }

        return $true
    }

    return $false
}

function Get-EventLogFinding {
    <#
        .SYNOPSIS
        取得したイベントから検知事項を組み立てる。純粋関数。

        .DESCRIPTION
        イベントは「プロバイダ + イベント ID」でまとめる。1 件ごとに通知すると
        同じ障害で通知が溢れるため、まとめたうえで件数を添える。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter()]
        [AllowNull()]
        [psobject[]] $LogEntry = @(),

        [Parameter()]
        [AllowNull()]
        $Setting = $null
    )

    $ignoreRules = @(Get-ConfigValue -InputObject $Setting -Name 'ignore' -Default @())
    $warningCount = [int] (Get-ConfigValue -InputObject $Setting -Name 'warningCount' -Default 1)
    $criticalCount = [int] (Get-ConfigValue -InputObject $Setting -Name 'criticalCount' -Default 20)

    $targets = @(@($LogEntry) | Where-Object { $null -ne $_ -and -not (Test-EventIgnored -LogEntry $_ -IgnoreRule $ignoreRules) })
    if ($targets.Count -eq 0) { return @() }

    $findings = New-Object System.Collections.ArrayList

    $groups = $targets | Group-Object -Property { '{0}|{1}|{2}' -f $_.LogName, $_.ProviderName, $_.Id }
    foreach ($group in ($groups | Sort-Object Count -Descending)) {
        $sample = $group.Group[0]
        $count = $group.Count

        $level = 'Warning'
        if ($criticalCount -gt 0 -and $count -ge $criticalCount) { $level = 'Critical' }
        elseif ([int] $sample.Level -eq 1) { $level = 'Critical' }
        elseif ($warningCount -gt 0 -and $count -lt $warningCount) { continue }

        $latest = ($group.Group | Sort-Object TimeCreated -Descending | Select-Object -First 1)
        $message = [string] $sample.Message
        if ($message.Length -gt 300) { $message = $message.Substring(0, 300) + '…' }

        $finding = New-CheckFinding -Key $group.Name -Level $level `
            -Title ('{0} ログにエラー: {1} (ID {2}) {3} 件' -f $sample.LogName, $sample.ProviderName, $sample.Id, $count) `
            -Message ('最終発生={0}{1}{2}' -f `
                ([datetime] $latest.TimeCreated).ToString('yyyy-MM-dd HH:mm:ss'), [Environment]::NewLine, $message) `
            -Value $count
        $null = $findings.Add($finding)
    }

    return $findings.ToArray()
}

function Get-EventLogData {
    <#
        .SYNOPSIS
        監視対象から対象期間のエラー・重大イベントを収集する。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target,

        [Parameter(Mandatory = $true)]
        [psobject] $Setting,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    $logNames = @(Get-ConfigValue -InputObject $Setting -Name 'logNames' -Default @('System', 'Application'))
    $levels = @(Get-ConfigValue -InputObject $Setting -Name 'levels' -Default @(1, 2))
    $lookbackHours = [double] (Get-ConfigValue -InputObject $Setting -Name 'lookbackHours' -Default 2)
    $maxEvents = [int] (Get-ConfigValue -InputObject $Setting -Name 'maxEventsPerLog' -Default 200)
    $startTime = $Now.AddHours(-1 * $lookbackHours)

    $scriptBlock = {
        param($LogNames, $Levels, $StartTime, $MaxEvents)

        $collected = @()
        foreach ($logName in $LogNames) {
            try {
                $filter = @{
                    LogName   = $logName
                    Level     = $Levels
                    StartTime = $StartTime
                }
                # 該当が 0 件のとき Get-WinEvent は終了エラーを出すため、個別に握りつぶす。
                $events = @(Get-WinEvent -FilterHashtable $filter -MaxEvents $MaxEvents -ErrorAction Stop)
                foreach ($entry in $events) {
                    $collected += [pscustomobject]@{
                        LogName      = $logName
                        Id           = $entry.Id
                        Level        = $entry.Level
                        ProviderName = $entry.ProviderName
                        TimeCreated  = $entry.TimeCreated
                        Message      = $entry.Message
                    }
                }
            }
            catch {
                if ($_.Exception.Message -notmatch 'No events were found|一致するイベントが見つかりません') {
                    throw
                }
            }
        }
        return $collected
    }

    return @(Invoke-MonitorScriptBlock -Target $Target -ScriptBlock $scriptBlock `
            -ArgumentList @($logNames, $levels, $startTime, $maxEvents))
}

function Invoke-EventLogCheck {
    <#
        .SYNOPSIS
        EVT チェックを 1 監視対象について実行する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    $checkId = 'EVT'
    $checkName = 'イベントログ'
    $targetName = [string] $Target.name

    if (-not (Test-CheckEnabled -Target $Target -CheckKey 'eventLog')) {
        return (New-SkippedCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName)
    }

    $config = Get-TargetCheckConfig -Target $Target -CheckKey 'eventLog'

    try {
        $events = Get-EventLogData -Target $Target -Setting $config -Now $Now
    }
    catch {
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName -Reason $_.Exception.Message)
    }

    $findings = Get-EventLogFinding -LogEntry $events -Setting $config

    $ignoreRules = @(Get-ConfigValue -InputObject $config -Name 'ignore' -Default @())
    $ignoredCount = @(@($events) | Where-Object { Test-EventIgnored -LogEntry $_ -IgnoreRule $ignoreRules }).Count
    $lookbackHours = [double] (Get-ConfigValue -InputObject $config -Name 'lookbackHours' -Default 2)

    $items = @()
    foreach ($finding in @($findings)) {
        $items += [pscustomobject]@{
            Key   = $finding.Key
            Level = $finding.Level
            Title = $finding.Title
            Count = $finding.Value
        }
    }

    $summary = '直近 {0} 時間: 対象 {1} 件（除外 {2} 件） / 通知 {3} 種類' -f `
        $lookbackHours, (@($events).Count - $ignoredCount), $ignoredCount, @($findings).Count
    if (@($findings).Count -eq 0) {
        $summary = '直近 {0} 時間にエラー・重大イベントはありません（除外 {1} 件）。' -f $lookbackHours, $ignoredCount
    }

    $metrics = [pscustomobject]@{
        TotalCount   = @($events).Count
        IgnoredCount = $ignoredCount
        GroupCount   = @($findings).Count
    }

    return (New-CheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
            -Summary $summary -Findings $findings -Metrics $metrics -Items $items)
}

Export-ModuleMember -Function @(
    'Test-EventIgnored'
    'Get-EventLogFinding'
    'Get-EventLogData'
    'Invoke-EventLogCheck'
)
