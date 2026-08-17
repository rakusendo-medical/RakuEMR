#Requires -Version 5.1
<#
    .SYNOPSIS
    監視のエントリポイント。タスクスケジューラから頻度別に呼び出される。

    .DESCRIPTION
    実行サイクルごとに対象チェックを実行し、通知判定・状態保存を行う。
    読み取り専用。サービスの再起動などの復旧アクションは一切行わない。

    .PARAMETER Cycle
    実行サイクル。
      Fast   … 15 分間隔（SVC）
      Hourly … 1 時間間隔（DSK / EVT）※ Fast の項目も併せて実行する
      Daily  … 日次（全項目）＋ 日次サマリの送信
      All    … 全項目を実行するが日次サマリは送らない（手動確認用）

    .PARAMETER ConfigPath
    設定ファイルのパス。monitoring からの相対パスまたは絶対パス。

    .PARAMETER Only
    指定したチェック ID のみ実行する（例: -Only SVC,DSK）。動作確認用。

    .PARAMETER TargetName
    指定した監視対象のみ実行する。動作確認用。

    .PARAMETER SkipNotification
    通知を送らない。動作確認用。

    .PARAMETER SendSummary
    サイクルにかかわらず日次サマリを送る。

    .EXAMPLE
    .\Invoke-Monitor.ps1 -Cycle Fast

    .EXAMPLE
    .\Invoke-Monitor.ps1 -Cycle All -SkipNotification -Verbose
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter()]
    [ValidateSet('Fast', 'Hourly', 'Daily', 'All')]
    [string] $Cycle = 'Fast',

    [Parameter()]
    [string] $ConfigPath = 'config.json',

    [Parameter()]
    [string[]] $Only,

    [Parameter()]
    [string[]] $TargetName,

    [Parameter()]
    [switch] $SkipNotification,

    [Parameter()]
    [switch] $SendSummary
)

$ErrorActionPreference = 'Stop'

$moduleRoot = Join-Path $PSScriptRoot 'modules'
Import-Module (Join-Path $moduleRoot 'Common.psm1') -Force -DisableNameChecking
Import-Module (Join-Path $moduleRoot 'Notify.psm1') -Force -DisableNameChecking

# チェックの登録表。Cycles に含まれるサイクルで実行される。
$checkRegistry = @(
    [pscustomobject]@{ Id = 'SVC'; Module = 'Check-Service.psm1'; Function = 'Invoke-ServiceCheck'; Cycles = @('Fast', 'Hourly', 'Daily', 'All') }
    [pscustomobject]@{ Id = 'DSK'; Module = 'Check-Disk.psm1'; Function = 'Invoke-DiskCheck'; Cycles = @('Hourly', 'Daily', 'All') }
    [pscustomobject]@{ Id = 'BKP'; Module = 'Check-Backup.psm1'; Function = 'Invoke-BackupCheck'; Cycles = @('Daily', 'All') }
    [pscustomobject]@{ Id = 'DB'; Module = 'Check-Database.psm1'; Function = 'Invoke-DatabaseCheck'; Cycles = @('Daily', 'All') }
)

function Get-ActiveCheck {
    <#
        .SYNOPSIS
        今回のサイクルで実行するチェックを絞り込む。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject[]] $Registry,

        [Parameter(Mandatory = $true)]
        [string] $CycleName,

        [Parameter()]
        [AllowNull()]
        [string[]] $IdFilter
    )

    $selected = @($Registry | Where-Object { $_.Cycles -contains $CycleName })
    if ($null -ne $IdFilter -and $IdFilter.Count -gt 0) {
        $selected = @($selected | Where-Object { $IdFilter -contains $_.Id })
    }
    return $selected
}

function Merge-CheckResultStore {
    <#
        .SYNOPSIS
        今回の結果を、前回までの結果に上書きマージする。

        .DESCRIPTION
        Fast サイクルでは一部のチェックしか走らないため、ダッシュボードと日次サマリが
        全項目を表示できるよう、対象 × チェック ID をキーに最新結果を保持する。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter()]
        [AllowNull()]
        [psobject[]] $Previous,

        [Parameter()]
        [AllowNull()]
        [psobject[]] $Current
    )

    $store = [ordered]@{}
    foreach ($item in @($Previous)) {
        if ($null -eq $item) { continue }
        $store['{0}|{1}' -f $item.TargetName, $item.CheckId] = $item
    }
    foreach ($item in @($Current)) {
        if ($null -eq $item) { continue }
        $store['{0}|{1}' -f $item.TargetName, $item.CheckId] = $item
    }
    return @($store.Values)
}

$exitCode = 0
$context = $null

try {
    $context = Initialize-MonitorContext -ConfigPath $ConfigPath -CycleName $Cycle
    Write-MonitorLog -Category 'run' -Message ('=== 実行開始 RunId={0} サイクル={1} ===' -f $context.RunId, $Cycle)

    $config = $context.Config
    $targets = @($config.targets | Where-Object {
            [bool] (Get-ConfigValue -InputObject $_ -Name 'enabled' -Default $true)
        })

    if ($null -ne $TargetName -and $TargetName.Count -gt 0) {
        $targets = @($targets | Where-Object { $TargetName -contains [string] $_.name })
    }

    if ($targets.Count -eq 0) {
        Write-MonitorLog -Level 'Warn' -Category 'run' -Message '有効な監視対象がありません。設定を確認してください。'
    }

    $activeChecks = Get-ActiveCheck -Registry $checkRegistry -CycleName $Cycle -IdFilter $Only
    Write-MonitorLog -Category 'run' -Message ('対象 {0} 件 / チェック {1} 件 ({2})' -f `
            $targets.Count, $activeChecks.Count, ((@($activeChecks | ForEach-Object { $_.Id })) -join ', '))

    foreach ($check in $activeChecks) {
        Import-Module (Join-Path $moduleRoot $check.Module) -Force -DisableNameChecking
    }

    $results = @()
    foreach ($target in $targets) {
        foreach ($check in $activeChecks) {
            $label = '{0}/{1}' -f $target.name, $check.Id
            try {
                Write-MonitorLog -Level 'Debug' -Category 'check' -Message ('実行: {0}' -f $label)
                $result = & $check.Function -Target $target
                $results += $result
                Write-MonitorLog -Category 'check' -Message ('{0} → {1} : {2}' -f $label, $result.Status, $result.Summary)
            }
            catch {
                Write-MonitorLog -Level 'Error' -Category 'check' -Message ('{0} で例外が発生しました: {1}' -f $label, $_.Exception.Message)
                $results += New-UnknownCheckResult -CheckId $check.Id -CheckName $check.Id `
                    -TargetName ([string] $target.name) -Reason $_.Exception.Message
            }
        }
    }

    # 直近の全チェック結果を保存（ダッシュボード・日次サマリ用）
    $previousResults = @()
    $stored = Read-MonitorState -Name 'last-results.json'
    if ($null -ne $stored) { $previousResults = @(Get-ConfigValue -InputObject $stored -Name 'results' -Default @()) }
    $merged = Merge-CheckResultStore -Previous $previousResults -Current $results

    Save-MonitorState -Name 'last-results.json' -InputObject ([pscustomobject]@{
            updatedOn = (Get-Date).ToString('o')
            runId     = $context.RunId
            cycle     = $Cycle
            results   = $merged
        }) -Confirm:$false

    if ($SkipNotification) {
        Write-MonitorLog -Level 'Warn' -Category 'notify' -Message '-SkipNotification が指定されたため通知しません。'
    }
    else {
        $null = Publish-MonitorAlert -CheckResult $results -NotificationConfig $config.notification -Confirm:$false

        if ($Cycle -eq 'Daily' -or $SendSummary) {
            $null = Publish-MonitorDailySummary -CheckResult $merged -NotificationConfig $config.notification -Confirm:$false
        }
    }

    $overall = Get-WorstStatus -Status @($results | ForEach-Object { $_.Status })
    Write-MonitorLog -Category 'run' -Message ('=== 実行完了 総合判定={0} ===' -f $overall)

    Remove-MonitorOldLog -RetentionDays ([int] (Get-ConfigValue -InputObject $config.general -Name 'logRetentionDays' -Default 30)) -Confirm:$false
}
catch {
    $message = '監視の実行中に回復不能なエラーが発生しました: {0}' -f $_.Exception.Message
    if ($null -ne $context) {
        Write-MonitorLog -Level 'Error' -Category 'run' -Message $message
        Write-MonitorLog -Level 'Error' -Category 'run' -Message ($_.ScriptStackTrace)
    }
    else {
        Write-Error $message
    }
    $exitCode = 1
}
finally {
    Close-MonitorTargetSession -Confirm:$false -ErrorAction SilentlyContinue
}

exit $exitCode
