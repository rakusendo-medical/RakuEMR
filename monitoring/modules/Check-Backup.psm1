#Requires -Version 5.1
<#
    Check-Backup.psm1 — BKP: バックアップ鮮度監視

    日次。「バックアップが成功しているかどうか不明」という状態を潰すための項目。
    見るのは 4 点。
      1. 出力先フォルダが存在するか
      2. 最新ファイルの更新日時（既定 24 時間以上更新なしで通知）
      3. ファイル数
      4. 合計サイズ・最新ファイルサイズ（中身が空のバックアップの検知）

    バックアップの「中身」までは検証しない。フォルダの状態からわかる範囲で
    「昨日のバックアップが作られていない」ことに気づけるようにする。
#>

Import-Module (Join-Path $PSScriptRoot 'Common.psm1') -DisableNameChecking -ErrorAction Stop

function Get-BackupFreshnessFinding {
    <#
        .SYNOPSIS
        1 つのバックアップ出力先の収集結果から検知事項を組み立てる。純粋関数。

        .PARAMETER Snapshot
        Name / Path / Exists / FileCount / TotalBytes / LatestWriteTime / LatestName / LatestBytes /
        Error を持つオブジェクト。

        .PARAMETER Setting
        maxAgeHours / criticalAgeHours / minFileCount / minTotalSizeMB / minLatestSizeMB を持つ設定。

        .PARAMETER Now
        判定基準時刻。テストのため引数で受け取る。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Snapshot,

        [Parameter()]
        [AllowNull()]
        $Setting = $null,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    $name = [string] $Snapshot.Name
    if ([string]::IsNullOrWhiteSpace($name)) { $name = [string] $Snapshot.Path }

    $findings = New-Object System.Collections.ArrayList

    if (-not [string]::IsNullOrWhiteSpace([string] $Snapshot.Error)) {
        $finding = New-CheckFinding -Key ('{0}/error' -f $name) -Level 'Unknown' `
            -Title ('バックアップ出力先を確認できません: {0}' -f $name) `
            -Message ('パス={0} / {1}' -f $Snapshot.Path, $Snapshot.Error)
        $null = $findings.Add($finding)
        return $findings.ToArray()
    }

    if (-not [bool] $Snapshot.Exists) {
        $finding = New-CheckFinding -Key ('{0}/missing' -f $name) -Level 'Critical' `
            -Title ('バックアップ出力先が存在しません: {0}' -f $name) `
            -Message ('パス={0}。出力先の消失、共有の切断、パス設定の誤りが考えられます。' -f $Snapshot.Path)
        $null = $findings.Add($finding)
        return $findings.ToArray()
    }

    $maxAgeHours = [double] (Get-ConfigValue -InputObject $Setting -Name 'maxAgeHours' -Default 24)
    $criticalAgeHours = [double] (Get-ConfigValue -InputObject $Setting -Name 'criticalAgeHours' -Default 48)
    $minFileCount = [int] (Get-ConfigValue -InputObject $Setting -Name 'minFileCount' -Default 1)
    $minTotalSizeMB = [double] (Get-ConfigValue -InputObject $Setting -Name 'minTotalSizeMB' -Default 0)
    $minLatestSizeMB = [double] (Get-ConfigValue -InputObject $Setting -Name 'minLatestSizeMB' -Default 0)

    $fileCount = [int] $Snapshot.FileCount

    if ($fileCount -eq 0) {
        $finding = New-CheckFinding -Key ('{0}/empty' -f $name) -Level 'Critical' `
            -Title ('バックアップファイルが 1 つもありません: {0}' -f $name) `
            -Message ('パス={0}' -f $Snapshot.Path)
        $null = $findings.Add($finding)
        return $findings.ToArray()
    }

    # 鮮度
    if ($null -ne $Snapshot.LatestWriteTime) {
        $latest = [datetime] $Snapshot.LatestWriteTime
        $age = $Now - $latest
        $ageHours = $age.TotalHours

        $level = 'OK'
        if ($criticalAgeHours -gt 0 -and $ageHours -ge $criticalAgeHours) { $level = 'Critical' }
        elseif ($maxAgeHours -gt 0 -and $ageHours -ge $maxAgeHours) { $level = 'Warning' }

        if ($level -ne 'OK') {
            $finding = New-CheckFinding -Key ('{0}/stale' -f $name) -Level $level `
                -Title ('バックアップが更新されていません: {0}' -f $name) `
                -Message ('最新ファイル={0} / 更新日時={1} / 経過={2}（閾値 {3} 時間）' -f `
                    $Snapshot.LatestName, $latest.ToString('yyyy-MM-dd HH:mm:ss'), `
                (Format-MonitorTimeSpan -TimeSpan $age), $maxAgeHours) `
                -Value ([Math]::Round($ageHours, 1))
            $null = $findings.Add($finding)
        }
    }

    # ファイル数
    if ($minFileCount -gt 0 -and $fileCount -lt $minFileCount) {
        $finding = New-CheckFinding -Key ('{0}/count' -f $name) -Level 'Warning' `
            -Title ('バックアップファイル数が不足しています: {0}' -f $name) `
            -Message ('{0} 件（下限 {1} 件）' -f $fileCount, $minFileCount) -Value $fileCount
        $null = $findings.Add($finding)
    }

    # 合計サイズ
    $totalMB = [double] $Snapshot.TotalBytes / 1MB
    if ($minTotalSizeMB -gt 0 -and $totalMB -lt $minTotalSizeMB) {
        $finding = New-CheckFinding -Key ('{0}/size' -f $name) -Level 'Warning' `
            -Title ('バックアップの合計サイズが小さすぎます: {0}' -f $name) `
            -Message ('合計 {0}（下限 {1:N0} MB）。中身が空のバックアップが作られている可能性があります。' -f `
                (Format-MonitorByte -Bytes $Snapshot.TotalBytes), $minTotalSizeMB) `
            -Value ([Math]::Round($totalMB, 1))
        $null = $findings.Add($finding)
    }

    # 最新ファイルのサイズ
    $latestMB = [double] $Snapshot.LatestBytes / 1MB
    if ($minLatestSizeMB -gt 0 -and $latestMB -lt $minLatestSizeMB) {
        $finding = New-CheckFinding -Key ('{0}/latestsize' -f $name) -Level 'Warning' `
            -Title ('最新のバックアップファイルが小さすぎます: {0}' -f $name) `
            -Message ('{0} = {1}（下限 {2:N0} MB）' -f `
                $Snapshot.LatestName, (Format-MonitorByte -Bytes $Snapshot.LatestBytes), $minLatestSizeMB) `
            -Value ([Math]::Round($latestMB, 1))
        $null = $findings.Add($finding)
    }

    return $findings.ToArray()
}

function Get-BackupSnapshot {
    <#
        .SYNOPSIS
        監視対象からバックアップ出力先の状態を収集する。

        .DESCRIPTION
        日本語のパス・共有名を含みうるため、パス指定は必ず -LiteralPath を使う。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target,

        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [psobject[]] $PathSetting
    )

    $descriptors = @()
    foreach ($item in @($PathSetting)) {
        if ($null -eq $item) { continue }
        $descriptors += , @(
            [string] (Get-ConfigValue -InputObject $item -Name 'name' -Default ''),
            [string] (Get-ConfigValue -InputObject $item -Name 'path' -Default ''),
            [string] (Get-ConfigValue -InputObject $item -Name 'filePattern' -Default '*.*'),
            [bool] (Get-ConfigValue -InputObject $item -Name 'recurse' -Default $true)
        )
    }
    if ($descriptors.Count -eq 0) { return @() }

    $scriptBlock = {
        param($Descriptors)

        $results = @()
        foreach ($descriptor in $Descriptors) {
            $name = [string] $descriptor[0]
            $path = [string] $descriptor[1]
            $pattern = [string] $descriptor[2]
            $recurse = [bool] $descriptor[3]
            if ([string]::IsNullOrWhiteSpace($name)) { $name = $path }

            $snapshot = [pscustomobject]@{
                Name            = $name
                Path            = $path
                Exists          = $false
                FileCount       = 0
                TotalBytes      = [long] 0
                LatestWriteTime = $null
                LatestName      = ''
                LatestBytes     = [long] 0
                Error           = ''
            }

            try {
                if ([string]::IsNullOrWhiteSpace($path)) {
                    $snapshot.Error = 'パスが設定されていません。'
                    $results += $snapshot
                    continue
                }
                if (-not (Test-Path -LiteralPath $path)) {
                    $results += $snapshot
                    continue
                }
                $snapshot.Exists = $true

                $parameters = @{
                    LiteralPath = $path
                    File        = $true
                    Filter      = $pattern
                    ErrorAction = 'Stop'
                }
                if ($recurse) { $parameters['Recurse'] = $true }

                $files = @(Get-ChildItem @parameters)
                $snapshot.FileCount = $files.Count
                if ($files.Count -gt 0) {
                    $total = [long] 0
                    foreach ($file in $files) { $total += [long] $file.Length }
                    $snapshot.TotalBytes = $total

                    $newest = $files | Sort-Object LastWriteTime -Descending | Select-Object -First 1
                    $snapshot.LatestWriteTime = $newest.LastWriteTime
                    $snapshot.LatestName = $newest.Name
                    $snapshot.LatestBytes = [long] $newest.Length
                }
            }
            catch {
                $snapshot.Error = $_.Exception.Message
            }

            $results += $snapshot
        }
        return $results
    }

    return @(Invoke-MonitorScriptBlock -Target $Target -ScriptBlock $scriptBlock -ArgumentList @(, $descriptors))
}

function Invoke-BackupCheck {
    <#
        .SYNOPSIS
        BKP チェックを 1 監視対象について実行する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    $checkId = 'BKP'
    $checkName = 'バックアップ鮮度'
    $targetName = [string] $Target.name

    if (-not (Test-CheckEnabled -Target $Target -CheckKey 'backup')) {
        return (New-SkippedCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName)
    }

    $config = Get-TargetCheckConfig -Target $Target -CheckKey 'backup'
    $pathSettings = @(Get-ConfigValue -InputObject $config -Name 'paths' -Default @())

    if ($pathSettings.Count -eq 0) {
        return (New-SkippedCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
                -Reason 'バックアップ出力先が設定されていません。')
    }

    try {
        $snapshots = Get-BackupSnapshot -Target $Target -PathSetting $pathSettings
    }
    catch {
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName -Reason $_.Exception.Message)
    }

    $findings = @()
    $items = @()
    foreach ($snapshot in @($snapshots)) {
        if ($null -eq $snapshot) { continue }

        $setting = $pathSettings | Where-Object {
            [string] (Get-ConfigValue -InputObject $_ -Name 'path' -Default '') -eq [string] $snapshot.Path
        } | Select-Object -First 1

        $findings += @(Get-BackupFreshnessFinding -Snapshot $snapshot -Setting $setting -Now $Now)

        $age = $null
        if ($null -ne $snapshot.LatestWriteTime) { $age = $Now - [datetime] $snapshot.LatestWriteTime }
        $items += [pscustomobject]@{
            Name            = [string] $snapshot.Name
            Path            = [string] $snapshot.Path
            Exists          = [bool] $snapshot.Exists
            FileCount       = [int] $snapshot.FileCount
            TotalBytes      = [long] $snapshot.TotalBytes
            TotalText       = Format-MonitorByte -Bytes $snapshot.TotalBytes
            LatestWriteTime = if ($null -ne $snapshot.LatestWriteTime) { ([datetime] $snapshot.LatestWriteTime).ToString('yyyy-MM-dd HH:mm:ss') } else { '-' }
            LatestName      = [string] $snapshot.LatestName
            AgeHours        = if ($null -ne $age) { [Math]::Round($age.TotalHours, 1) } else { $null }
            AgeText         = Format-MonitorTimeSpan -TimeSpan $age
        }
    }

    $summary = 'バックアップ出力先 {0} 件中 {1} 件に問題があります。' -f @($snapshots).Count, $findings.Count
    if ($findings.Count -eq 0) {
        $newest = $items | Where-Object { $null -ne $_.AgeHours } | Sort-Object AgeHours | Select-Object -First 1
        $summary = if ($null -ne $newest) {
            'バックアップ出力先 {0} 件は最新。直近取得 {1}（{2} 前）' -f @($snapshots).Count, $newest.LatestWriteTime, $newest.AgeText
        }
        else {
            'バックアップ出力先 {0} 件は閾値内です。' -f @($snapshots).Count
        }
    }

    $oldest = $items | Where-Object { $null -ne $_.AgeHours } | Sort-Object AgeHours -Descending | Select-Object -First 1
    $metrics = [pscustomobject]@{
        PathCount    = @($snapshots).Count
        ProblemCount = $findings.Count
        MaxAgeHours  = if ($null -ne $oldest) { $oldest.AgeHours } else { $null }
    }

    return (New-CheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
            -Summary $summary -Findings $findings -Metrics $metrics -Items $items)
}

Export-ModuleMember -Function @(
    'Get-BackupFreshnessFinding'
    'Get-BackupSnapshot'
    'Invoke-BackupCheck'
)
