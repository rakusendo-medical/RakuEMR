#Requires -Version 5.1
<#
    Check-TimeSync.psm1 — NTP: 時刻同期の監視

    日次。同期ソース・最終同期時刻・オフセット実測値の 3 つを見る。
    「一度も同期に成功しておらず 2 台で 1 分 28 秒ずれていた」事象への対策。

    実装上の注意:
      w32tm /query /status の出力は日本語 Windows では日本語になるため、
      本文のテキスト解析には依存しない設計にしている。
        - 同期ソース  : w32tm /query /source（値そのものを見る）
        - 最終同期時刻: System ログの Time-Service イベント ID 35（ID と時刻のみ使用）
        - オフセット  : w32tm /stripchart の数値部分のみを正規表現で抽出
#>

Import-Module (Join-Path $PSScriptRoot 'Common.psm1') -DisableNameChecking -ErrorAction Stop

function Test-FreeRunningSource {
    <#
        .SYNOPSIS
        同期ソースが「同期していない」状態を指しているかを判定する。純粋関数。

        .DESCRIPTION
        Free-running / Local CMOS Clock は「外部と同期していない」ことを意味する。
        レジストリの Type が NoSync の場合も同様に扱う。
    #>
    [CmdletBinding()]
    [OutputType([bool])]
    param(
        [Parameter()]
        [AllowEmptyString()]
        [AllowNull()]
        [string] $Source,

        [Parameter()]
        [AllowEmptyString()]
        [AllowNull()]
        [string] $ConfiguredType
    )

    if ($ConfiguredType -eq 'NoSync') { return $true }
    if ([string]::IsNullOrWhiteSpace($Source)) { return $true }

    $patterns = @('free-running', 'local cmos', 'ローカル cmos', '同期されていません', 'unspecified')
    $lowered = $Source.ToLowerInvariant()
    foreach ($pattern in $patterns) {
        if ($lowered.Contains($pattern)) { return $true }
    }
    return $false
}

function Get-StripChartOffsetSecond {
    <#
        .SYNOPSIS
        w32tm /stripchart の出力からオフセット（秒）を取り出す。純粋関数。

        .DESCRIPTION
        出力の書式は環境の言語で変わるが、オフセットは "+00.0123456s" の形で
        現れるため、数値部分だけを正規表現で拾う。取れなければ $null を返す。
    #>
    [CmdletBinding()]
    [OutputType([object])]
    param(
        [Parameter()]
        [AllowNull()]
        [AllowEmptyCollection()]
        [string[]] $OutputLine
    )

    $last = $null
    foreach ($line in @($OutputLine)) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $match = [regex]::Match($line, '([+-]\s*\d+(?:\.\d+)?)\s*s(?:\b|$)')
        if ($match.Success) {
            $text = $match.Groups[1].Value -replace '\s', ''
            $parsed = 0.0
            if ([double]::TryParse($text, [ref] $parsed)) { $last = $parsed }
        }
    }
    return $last
}

function Get-TimeSyncFinding {
    <#
        .SYNOPSIS
        時刻同期の収集結果から検知事項を組み立てる。純粋関数。

        .PARAMETER Data
        Source / ConfiguredType / NtpServer / LastSyncTime / OffsetSeconds / OffsetError を持つオブジェクト。
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

    $forbidFreeRunning = [bool] (Get-ConfigValue -InputObject $Setting -Name 'forbidFreeRunning' -Default $true)
    $warningOffset = [double] (Get-ConfigValue -InputObject $Setting -Name 'warningOffsetSeconds' -Default 5)
    $criticalOffset = [double] (Get-ConfigValue -InputObject $Setting -Name 'criticalOffsetSeconds' -Default 30)
    $maxSyncAgeHours = [double] (Get-ConfigValue -InputObject $Setting -Name 'maxSyncAgeHours' -Default 48)

    $findings = New-Object System.Collections.ArrayList

    if ($forbidFreeRunning -and (Test-FreeRunningSource -Source $Data.Source -ConfiguredType $Data.ConfiguredType)) {
        $finding = New-CheckFinding -Key 'source' -Level 'Critical' `
            -Title '時刻同期が行われていません' `
            -Message ('同期ソース={0} / 設定={1}。外部の時刻源と同期していないため、時刻は際限なくずれ続けます。' -f `
            (@{ $true = '(取得できません)'; $false = $Data.Source }[[string]::IsNullOrWhiteSpace([string] $Data.Source)]), `
                $Data.ConfiguredType) `
            -Value ([string] $Data.Source)
        $null = $findings.Add($finding)
    }

    if ($null -eq $Data.LastSyncTime) {
        $finding = New-CheckFinding -Key 'lastsync' -Level 'Warning' `
            -Title '時刻同期の成功記録が見つかりません' `
            -Message 'System ログに Time-Service の同期成功イベント（ID 35）がありません。一度も同期に成功していない可能性があります。'
        $null = $findings.Add($finding)
    }
    elseif ($maxSyncAgeHours -gt 0) {
        $age = $Now - [datetime] $Data.LastSyncTime
        if ($age.TotalHours -ge $maxSyncAgeHours) {
            $finding = New-CheckFinding -Key 'lastsync' -Level 'Warning' `
                -Title '時刻同期がしばらく成功していません' `
                -Message ('最終同期={0}（{1} 前 / 閾値 {2} 時間）' -f `
                    ([datetime] $Data.LastSyncTime).ToString('yyyy-MM-dd HH:mm:ss'), `
                    (Format-MonitorTimeSpan -TimeSpan $age), $maxSyncAgeHours) `
                -Value ([Math]::Round($age.TotalHours, 1))
            $null = $findings.Add($finding)
        }
    }

    if ($null -eq $Data.OffsetSeconds) {
        $reason = [string] $Data.OffsetError
        if ([string]::IsNullOrWhiteSpace($reason)) { $reason = '測定結果を解釈できませんでした。' }
        $finding = New-CheckFinding -Key 'offset' -Level 'Unknown' `
            -Title '時刻のずれを実測できません' `
            -Message ('参照先={0} / {1}' -f $Data.OffsetReference, $reason)
        $null = $findings.Add($finding)
    }
    else {
        $absolute = [Math]::Abs([double] $Data.OffsetSeconds)
        $level = 'OK'
        if ($criticalOffset -gt 0 -and $absolute -ge $criticalOffset) { $level = 'Critical' }
        elseif ($warningOffset -gt 0 -and $absolute -ge $warningOffset) { $level = 'Warning' }

        if ($level -ne 'OK') {
            $finding = New-CheckFinding -Key 'offset' -Level $level `
                -Title '時刻がずれています' `
                -Message ('参照先={0} とのずれ {1:N3} 秒（閾値 警告 {2} 秒 / 危険 {3} 秒）' -f `
                    $Data.OffsetReference, [double] $Data.OffsetSeconds, $warningOffset, $criticalOffset) `
                -Value ([Math]::Round([double] $Data.OffsetSeconds, 3))
            $null = $findings.Add($finding)
        }
    }

    return $findings.ToArray()
}

function Get-TimeSyncData {
    <#
        .SYNOPSIS
        監視対象から時刻同期の状態を収集する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target,

        [Parameter()]
        [AllowEmptyString()]
        [string] $OffsetReference = ''
    )

    $scriptBlock = {
        param($Reference)

        $result = [pscustomobject]@{
            Source          = ''
            ConfiguredType  = ''
            NtpServer       = ''
            LastSyncTime    = $null
            OffsetSeconds   = $null
            OffsetReference = ''
            OffsetError     = ''
            RawStripChart   = @()
        }

        try {
            $result.Source = (& w32tm.exe /query /source 2>&1 | Out-String).Trim()
        }
        catch {
            $result.Source = ''
        }

        $parametersKey = 'HKLM:\SYSTEM\CurrentControlSet\Services\W32Time\Parameters'
        try {
            $parameters = Get-ItemProperty -Path $parametersKey -ErrorAction Stop
            $result.ConfiguredType = [string] $parameters.Type
            $result.NtpServer = [string] $parameters.NtpServer
        }
        catch {
            $result.ConfiguredType = ''
        }

        # 同期成功イベント（Time-Service / ID 35）。本文は言語依存なので時刻のみ使う。
        try {
            $syncEvent = Get-WinEvent -FilterHashtable @{
                LogName      = 'System'
                ProviderName = 'Microsoft-Windows-Time-Service'
                Id           = 35
            } -MaxEvents 1 -ErrorAction Stop
            if ($null -ne $syncEvent) { $result.LastSyncTime = $syncEvent.TimeCreated }
        }
        catch {
            $result.LastSyncTime = $null
        }

        # オフセットの実測。参照先は引数優先、無ければ設定済み NTP サーバの先頭を使う。
        $peer = $Reference
        if ([string]::IsNullOrWhiteSpace($peer)) {
            $peer = ($result.NtpServer -split '[ ,]')[0] -replace ',.*$', ''
        }
        $result.OffsetReference = $peer

        if ([string]::IsNullOrWhiteSpace($peer)) {
            $result.OffsetError = '参照先の NTP サーバが設定されていません。'
        }
        else {
            try {
                $output = @(& w32tm.exe /stripchart /computer:$peer /samples:1 /dataonly 2>&1 | ForEach-Object { [string] $_ })
                $result.RawStripChart = $output
                if ($LASTEXITCODE -ne 0) {
                    $result.OffsetError = ($output -join ' ').Trim()
                }
            }
            catch {
                $result.OffsetError = $_.Exception.Message
            }
        }

        return $result
    }

    return (Invoke-MonitorScriptBlock -Target $Target -ScriptBlock $scriptBlock -ArgumentList @($OffsetReference))
}

function Invoke-TimeSyncCheck {
    <#
        .SYNOPSIS
        NTP チェックを 1 監視対象について実行する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    $checkId = 'NTP'
    $checkName = '時刻同期'
    $targetName = [string] $Target.name

    if (-not (Test-CheckEnabled -Target $Target -CheckKey 'timeSync')) {
        return (New-SkippedCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName)
    }

    $config = Get-TargetCheckConfig -Target $Target -CheckKey 'timeSync'
    $reference = [string] (Get-ConfigValue -InputObject $config -Name 'offsetReferenceServer' -Default '')

    try {
        $data = Get-TimeSyncData -Target $Target -OffsetReference $reference
    }
    catch {
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName -Reason $_.Exception.Message)
    }

    if ($null -eq $data) {
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
                -Reason '時刻同期の状態を取得できませんでした。')
    }

    # 数値の抽出は純粋関数側で行う（テスト可能にするため）。
    if ($null -eq $data.OffsetSeconds) {
        $data.OffsetSeconds = Get-StripChartOffsetSecond -OutputLine @($data.RawStripChart)
    }

    $findings = Get-TimeSyncFinding -Data $data -Setting $config -Now $Now

    $items = @([pscustomobject]@{
            Source          = [string] $data.Source
            ConfiguredType  = [string] $data.ConfiguredType
            NtpServer       = [string] $data.NtpServer
            LastSyncTime    = if ($null -ne $data.LastSyncTime) { ([datetime] $data.LastSyncTime).ToString('yyyy-MM-dd HH:mm:ss') } else { '-' }
            OffsetSeconds   = if ($null -ne $data.OffsetSeconds) { [Math]::Round([double] $data.OffsetSeconds, 3) } else { $null }
            OffsetReference = [string] $data.OffsetReference
        })

    $offsetText = if ($null -ne $data.OffsetSeconds) { '{0:N3} 秒' -f [double] $data.OffsetSeconds } else { '測定不可' }
    $summary = '同期ソース={0} / ずれ={1}' -f $data.Source, $offsetText

    $metrics = [pscustomobject]@{
        OffsetSeconds = if ($null -ne $data.OffsetSeconds) { [Math]::Round([double] $data.OffsetSeconds, 3) } else { $null }
        IsFreeRunning = Test-FreeRunningSource -Source $data.Source -ConfiguredType $data.ConfiguredType
    }

    return (New-CheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
            -Summary $summary -Findings $findings -Metrics $metrics -Items $items)
}

Export-ModuleMember -Function @(
    'Test-FreeRunningSource'
    'Get-StripChartOffsetSecond'
    'Get-TimeSyncFinding'
    'Get-TimeSyncData'
    'Invoke-TimeSyncCheck'
)
