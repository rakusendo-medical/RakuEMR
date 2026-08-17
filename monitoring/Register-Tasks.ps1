#Requires -Version 5.1
<#
    .SYNOPSIS
    監視をタスクスケジューラへ登録 / 解除する。

    .DESCRIPTION
    Windows サービスとしては常駐させない。タスクスケジューラで十分であり、
    障害切り分けが単純になるため。

    登録されるタスクは 3 つ。
      RakuEMR Monitor - Fast   15 分間隔  … サービス稼働（SVC）
      RakuEMR Monitor - Hourly 1 時間間隔 … ディスク / イベントログ / リソース / ハードウェア
      RakuEMR Monitor - Daily  日次       … 全項目 + 日次サマリの送信

    実行アカウントは資格情報の復号可否に直結する。
    Install-Credentials.ps1 を実行したアカウントと必ず一致させること。

    .PARAMETER Action
    Register（登録）/ Unregister（解除）/ Show（現在の登録状況の表示）。

    .PARAMETER TaskUser
    タスクの実行アカウント。省略時は SYSTEM。
    リモート収集や共有フォルダへの出力を行う場合は、権限のあるドメイン外ローカル
    アカウントを指定すること（SYSTEM はネットワーク越しの認証に使えない）。

    .PARAMETER TaskPathPrefix
    タスクスケジューラ上のフォルダ。

    .PARAMETER DailyAt
    日次サマリを送る時刻（HH:mm）。運用者が出勤して確認できる時刻に合わせる。

    .PARAMETER FastIntervalMinutes
    Fast サイクルの実行間隔（分）。

    .EXAMPLE
    .\Register-Tasks.ps1 -Action Register -TaskUser '.\svc-monitor' -DailyAt 08:00

    .EXAMPLE
    .\Register-Tasks.ps1 -Action Show

    .EXAMPLE
    .\Register-Tasks.ps1 -Action Unregister
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Position = 0)]
    [ValidateSet('Register', 'Unregister', 'Show')]
    [string] $Action = 'Show',

    [Parameter()]
    [AllowEmptyString()]
    [string] $TaskUser = '',

    [Parameter()]
    [string] $TaskPathPrefix = '\RakuEMR\',

    [Parameter()]
    [ValidatePattern('^\d{1,2}:\d{2}$')]
    [string] $DailyAt = '08:00',

    [Parameter()]
    [ValidateRange(1, 1440)]
    [int] $FastIntervalMinutes = 15,

    [Parameter()]
    [string] $ConfigPath = 'config.json'
)

$ErrorActionPreference = 'Stop'

$scriptPath = Join-Path $PSScriptRoot 'Invoke-Monitor.ps1'
if (-not (Test-Path -LiteralPath $scriptPath)) {
    throw ('Invoke-Monitor.ps1 が見つかりません: {0}' -f $scriptPath)
}

# タスク定義。名前は変更しないこと（解除時に名前で照合するため）。
$taskDefinitions = @(
    [pscustomobject]@{
        Name        = 'RakuEMR Monitor - Fast'
        Cycle       = 'Fast'
        Description = 'サービス稼働（SVC）を 15 分間隔で確認します。'
    }
    [pscustomobject]@{
        Name        = 'RakuEMR Monitor - Hourly'
        Cycle       = 'Hourly'
        Description = 'ディスク・イベントログ・リソース・ハードウェアを 1 時間間隔で確認します。'
    }
    [pscustomobject]@{
        Name        = 'RakuEMR Monitor - Daily'
        Cycle       = 'Daily'
        Description = '全項目を確認し、日次サマリを 1 通送信します。異常がゼロでも送ります。'
    }
)

function Get-MonitorTaskAction {
    <#
        .SYNOPSIS
        指定サイクルを実行するタスクアクションを組み立てる。
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'ScheduledTaskAction オブジェクトを生成して返すだけで、システム状態を変更しない。')]
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string] $Cycle,

        [Parameter(Mandatory = $true)]
        [string] $ScriptFile,

        [Parameter(Mandatory = $true)]
        [string] $Configuration,

        [Parameter(Mandatory = $true)]
        [string] $WorkingDirectory
    )

    # -File ではなく -Command を使うと引用の扱いが環境依存になるため -File を使う。
    $arguments = '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "{0}" -Cycle {1} -ConfigPath "{2}"' -f `
        $ScriptFile, $Cycle, $Configuration

    return (New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arguments -WorkingDirectory $WorkingDirectory)
}

function Get-MonitorTaskTrigger {
    <#
        .SYNOPSIS
        サイクルに対応するトリガーを組み立てる。
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'ScheduledTaskTrigger オブジェクトを生成して返すだけで、システム状態を変更しない。')]
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string] $Cycle,

        [Parameter(Mandatory = $true)]
        [int] $IntervalMinutes,

        [Parameter(Mandatory = $true)]
        [string] $DailyTime
    )

    switch ($Cycle) {
        'Fast' {
            # 起動直後から回し続ける。RepetitionDuration は最大値にして無期限運転にする。
            $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date `
                -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
                -RepetitionDuration ([TimeSpan]::FromDays(3650))
            return $trigger
        }
        'Hourly' {
            $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date `
                -RepetitionInterval (New-TimeSpan -Hours 1) `
                -RepetitionDuration ([TimeSpan]::FromDays(3650))
            return $trigger
        }
        default {
            return (New-ScheduledTaskTrigger -Daily -At $DailyTime)
        }
    }
}

switch ($Action) {

    'Show' {
        $tasks = @(Get-ScheduledTask -TaskPath $TaskPathPrefix -ErrorAction SilentlyContinue)
        if ($tasks.Count -eq 0) {
            Write-Output ('{0} 配下に登録されたタスクはありません。' -f $TaskPathPrefix)
            break
        }

        $tasks | ForEach-Object {
            $info = Get-ScheduledTaskInfo -TaskName $_.TaskName -TaskPath $_.TaskPath -ErrorAction SilentlyContinue
            [pscustomobject]@{
                タスク名     = $_.TaskName
                状態         = $_.State
                実行アカウント = $_.Principal.UserId
                前回実行     = if ($null -ne $info) { $info.LastRunTime } else { $null }
                前回結果     = if ($null -ne $info) { $info.LastTaskResult } else { $null }
                次回実行     = if ($null -ne $info) { $info.NextRunTime } else { $null }
            }
        } | Format-Table -AutoSize
        break
    }

    'Unregister' {
        foreach ($definition in $taskDefinitions) {
            $existing = Get-ScheduledTask -TaskName $definition.Name -TaskPath $TaskPathPrefix -ErrorAction SilentlyContinue
            if ($null -eq $existing) {
                Write-Output ('未登録のためスキップ: {0}' -f $definition.Name)
                continue
            }
            if ($PSCmdlet.ShouldProcess($definition.Name, 'タスクの解除')) {
                Unregister-ScheduledTask -TaskName $definition.Name -TaskPath $TaskPathPrefix -Confirm:$false
                Write-Output ('解除しました: {0}' -f $definition.Name)
            }
        }
        break
    }

    'Register' {
        if ([string]::IsNullOrWhiteSpace($TaskUser)) {
            Write-Warning '実行アカウントが指定されていないため SYSTEM で登録します。'
            Write-Warning 'リモート収集や共有フォルダへの出力を行う場合、SYSTEM ではネットワーク越しの認証ができません。'
            Write-Warning 'その場合は -TaskUser で専用アカウントを指定し、同じアカウントで Install-Credentials.ps1 を実行してください。'
            $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
        }
        else {
            # パスワードを保存せずに動かすため S4U を使う。
            # ネットワーク越しの認証が必要な場合は、タスクスケジューラの GUI で
            # 「パスワードを保存する」設定に切り替えること（README 参照）。
            $principal = New-ScheduledTaskPrincipal -UserId $TaskUser -LogonType S4U -RunLevel Highest
        }

        $settings = New-ScheduledTaskSettingsSet `
            -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
            -StartWhenAvailable `
            -MultipleInstances IgnoreNew `
            -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

        foreach ($definition in $taskDefinitions) {
            $task = New-ScheduledTask `
                -Action (Get-MonitorTaskAction -Cycle $definition.Cycle -ScriptFile $scriptPath `
                    -Configuration $ConfigPath -WorkingDirectory $PSScriptRoot) `
                -Trigger (Get-MonitorTaskTrigger -Cycle $definition.Cycle `
                    -IntervalMinutes $FastIntervalMinutes -DailyTime $DailyAt) `
                -Principal $principal `
                -Settings $settings `
                -Description $definition.Description

            if (-not $PSCmdlet.ShouldProcess($definition.Name, 'タスクの登録')) { continue }

            $existing = Get-ScheduledTask -TaskName $definition.Name -TaskPath $TaskPathPrefix -ErrorAction SilentlyContinue
            if ($null -ne $existing) {
                Unregister-ScheduledTask -TaskName $definition.Name -TaskPath $TaskPathPrefix -Confirm:$false
            }

            $null = Register-ScheduledTask -TaskName $definition.Name -TaskPath $TaskPathPrefix -InputObject $task
            Write-Output ('登録しました: {0}{1}' -f $TaskPathPrefix, $definition.Name)
        }

        Write-Output ''
        Write-Output '登録が完了しました。次の順で動作を確認してください。'
        Write-Output '  1. .\Invoke-Monitor.ps1 -Cycle All -SkipNotification   … 収集が通るか'
        Write-Output '  2. .\Invoke-Monitor.ps1 -Cycle All -SendSummary        … 日次サマリが届くか'
        Write-Output '  3. .\Register-Tasks.ps1 -Action Show                   … タスクの登録状況'
        break
    }
}
