#Requires -Version 5.1
<#
    Check-Hardware.psm1 — HW: iLO Redfish によるハードウェア監視

    OS 標準の WMI からハードウェアセンサーを安定して取得することはできない
    （MSAcpi_ThermalZoneTemperature は多くのサーバ機で値を返さない）ため、
    iLO の Redfish API（REST / HTTPS）を使う。

    設計上の要点:
      - Redfish のスキーマは機種・ファーム世代で差があるため、エンドポイントは
        すべて設定ファイルから与える。ハードコードしない
      - 値が取れない項目は「無い」ものとして扱い、取れた項目だけで判定する
      - iLO に到達できない場合はハードウェア監視のみを打ち切り、他項目の監視は続行する
      - 自己署名証明書を使っている可能性が高いため、証明書検証をスキップする選択肢を
        設定で用意する（既定は検証あり）

    ゲスト VM には適用しない。温度・ファン・電源はホスト側で取得する。
#>

Import-Module (Join-Path $PSScriptRoot 'Common.psm1') -DisableNameChecking -ErrorAction Stop

function Get-RedfishHealthLevel {
    <#
        .SYNOPSIS
        Redfish の Status.Health を本ツールの判定レベルに変換する。純粋関数。

        .DESCRIPTION
        Redfish の Health は OK / Warning / Critical の 3 値だが、
        機種によっては未設定（null）や独自の値が返ることがあるため、
        既知の値以外は Unknown として扱う。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter()]
        [AllowEmptyString()]
        [AllowNull()]
        [string] $Health
    )

    if ([string]::IsNullOrWhiteSpace($Health)) { return 'Unknown' }

    switch ($Health.Trim().ToUpperInvariant()) {
        'OK' { return 'OK' }
        'WARNING' { return 'Warning' }
        'CRITICAL' { return 'Critical' }
        default { return 'Unknown' }
    }
}

function Get-TemperatureLevel {
    <#
        .SYNOPSIS
        温度センサーの判定レベルを返す。純粋関数。

        .DESCRIPTION
        Redfish が返す UpperThresholdCritical / UpperThresholdNonCritical を優先し、
        返らない機種では設定の既定値を使う。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [double] $ReadingCelsius,

        [Parameter()]
        [AllowNull()]
        $UpperThresholdCritical = $null,

        [Parameter()]
        [AllowNull()]
        $UpperThresholdNonCritical = $null,

        [Parameter()]
        [double] $DefaultWarningCelsius = 70,

        [Parameter()]
        [double] $DefaultCriticalCelsius = 85
    )

    $critical = if ($null -ne $UpperThresholdCritical -and [double] $UpperThresholdCritical -gt 0) {
        [double] $UpperThresholdCritical
    }
    else { $DefaultCriticalCelsius }

    $warning = if ($null -ne $UpperThresholdNonCritical -and [double] $UpperThresholdNonCritical -gt 0) {
        [double] $UpperThresholdNonCritical
    }
    else { $DefaultWarningCelsius }

    if ($critical -gt 0 -and $ReadingCelsius -ge $critical) { return 'Critical' }
    if ($warning -gt 0 -and $ReadingCelsius -ge $warning) { return 'Warning' }
    return 'OK'
}

function Get-ThermalFinding {
    <#
        .SYNOPSIS
        Redfish の Thermal リソースから検知事項を組み立てる。純粋関数。

        .PARAMETER Thermal
        Temperatures / Fans を持つオブジェクト（Redfish の応答をそのまま渡す）。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter()]
        [AllowNull()]
        $Thermal = $null,

        [Parameter()]
        [AllowNull()]
        $Threshold = $null
    )

    if ($null -eq $Thermal) { return @() }

    $defaultWarning = [double] (Get-ConfigValue -InputObject $Threshold -Name 'defaultTemperatureWarningCelsius' -Default 70)
    $defaultCritical = [double] (Get-ConfigValue -InputObject $Threshold -Name 'defaultTemperatureCriticalCelsius' -Default 85)

    $findings = New-Object System.Collections.ArrayList

    foreach ($sensor in @(Get-ConfigValue -InputObject $Thermal -Name 'Temperatures' -Default @())) {
        if ($null -eq $sensor) { continue }

        $status = Get-ConfigValue -InputObject $sensor -Name 'Status'
        $state = [string] (Get-ConfigValue -InputObject $status -Name 'State' -Default '')
        # 未実装 / 無効なセンサーは 0 を返すため判定から外す。
        if ($state -ne '' -and $state -ne 'Enabled') { continue }

        $reading = Get-ConfigValue -InputObject $sensor -Name 'ReadingCelsius'
        if ($null -eq $reading) { continue }

        $name = [string] (Get-ConfigValue -InputObject $sensor -Name 'Name' -Default 'Temperature')
        $level = Get-TemperatureLevel -ReadingCelsius ([double] $reading) `
            -UpperThresholdCritical (Get-ConfigValue -InputObject $sensor -Name 'UpperThresholdCritical') `
            -UpperThresholdNonCritical (Get-ConfigValue -InputObject $sensor -Name 'UpperThresholdNonCritical') `
            -DefaultWarningCelsius $defaultWarning -DefaultCriticalCelsius $defaultCritical

        # センサー自身が異常を申告している場合も拾う。
        $healthLevel = Get-RedfishHealthLevel -Health ([string] (Get-ConfigValue -InputObject $status -Name 'Health' -Default ''))
        if ($healthLevel -in @('Warning', 'Critical')) {
            $level = Get-WorstStatus -Status @($level, $healthLevel)
        }

        if ($level -eq 'OK') { continue }

        $finding = New-CheckFinding -Key ('temp/{0}' -f $name) -Level $level `
            -Title ('温度が高すぎます: {0}' -f $name) `
            -Message ('{0} ℃（警告 {1} ℃ / 危険 {2} ℃）' -f $reading, $defaultWarning, $defaultCritical) `
            -Value ([double] $reading)
        $null = $findings.Add($finding)
    }

    foreach ($fan in @(Get-ConfigValue -InputObject $Thermal -Name 'Fans' -Default @())) {
        if ($null -eq $fan) { continue }

        $status = Get-ConfigValue -InputObject $fan -Name 'Status'
        $state = [string] (Get-ConfigValue -InputObject $status -Name 'State' -Default '')
        if ($state -ne '' -and $state -ne 'Enabled') { continue }

        $name = [string] (Get-ConfigValue -InputObject $fan -Name 'Name' -Default (Get-ConfigValue -InputObject $fan -Name 'FanName' -Default 'Fan'))
        $level = Get-RedfishHealthLevel -Health ([string] (Get-ConfigValue -InputObject $status -Name 'Health' -Default ''))

        # Reading は機種により Reading / CurrentReading のいずれか。
        $reading = Get-ConfigValue -InputObject $fan -Name 'Reading'
        if ($null -eq $reading) { $reading = Get-ConfigValue -InputObject $fan -Name 'CurrentReading' }
        $units = [string] (Get-ConfigValue -InputObject $fan -Name 'ReadingUnits' -Default '')

        if ($null -ne $reading -and [double] $reading -le 0) {
            $level = 'Critical'
        }

        if ($level -in @('OK', 'Unknown')) { continue }

        $finding = New-CheckFinding -Key ('fan/{0}' -f $name) -Level $level `
            -Title ('ファンに異常があります: {0}' -f $name) `
            -Message ('回転={0} {1} / Health={2}' -f $reading, $units, (Get-ConfigValue -InputObject $status -Name 'Health' -Default '不明')) `
            -Value $reading
        $null = $findings.Add($finding)
    }

    return $findings.ToArray()
}

function Get-PowerFinding {
    <#
        .SYNOPSIS
        Redfish の Power リソースから検知事項を組み立てる。純粋関数。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter()]
        [AllowNull()]
        $Power = $null
    )

    if ($null -eq $Power) { return @() }

    $findings = New-Object System.Collections.ArrayList

    foreach ($supply in @(Get-ConfigValue -InputObject $Power -Name 'PowerSupplies' -Default @())) {
        if ($null -eq $supply) { continue }

        $status = Get-ConfigValue -InputObject $supply -Name 'Status'
        $state = [string] (Get-ConfigValue -InputObject $status -Name 'State' -Default '')
        # 未搭載スロットは Absent。冗長構成で片方が空でも異常ではないため除外する。
        if ($state -eq 'Absent' -or $state -eq 'UnavailableOffline') { continue }

        $level = Get-RedfishHealthLevel -Health ([string] (Get-ConfigValue -InputObject $status -Name 'Health' -Default ''))
        if ($level -in @('OK', 'Unknown')) { continue }

        $name = [string] (Get-ConfigValue -InputObject $supply -Name 'Name' -Default 'PowerSupply')
        $finding = New-CheckFinding -Key ('power/{0}' -f $name) -Level $level `
            -Title ('電源ユニットに異常があります: {0}' -f $name) `
            -Message ('Health={0} / State={1} / 入力電圧={2}' -f `
                (Get-ConfigValue -InputObject $status -Name 'Health' -Default '不明'), $state, `
                (Get-ConfigValue -InputObject $supply -Name 'LineInputVoltage' -Default '不明'))
        $null = $findings.Add($finding)
    }

    return $findings.ToArray()
}

function Get-SystemHealthFinding {
    <#
        .SYNOPSIS
        Redfish の Systems リソースから全体ヘルスの検知事項を組み立てる。純粋関数。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter()]
        [AllowNull()]
        $System = $null
    )

    if ($null -eq $System) { return @() }

    $findings = New-Object System.Collections.ArrayList

    $status = Get-ConfigValue -InputObject $System -Name 'Status'
    $health = [string] (Get-ConfigValue -InputObject $status -Name 'Health' -Default '')
    $level = Get-RedfishHealthLevel -Health $health

    if ($level -in @('Warning', 'Critical')) {
        $finding = New-CheckFinding -Key 'system/health' -Level $level `
            -Title 'サーバの全体ヘルスが異常です' `
            -Message ('Health={0} / State={1} / 電源={2}' -f `
                $health, (Get-ConfigValue -InputObject $status -Name 'State' -Default '不明'), `
                (Get-ConfigValue -InputObject $System -Name 'PowerState' -Default '不明')) `
            -Value $health
        $null = $findings.Add($finding)
    }

    # HPE 機では Oem.Hpe.AggregateHealthStatus に部位別のヘルスが入る。
    # 機種によりキー構成が異なるため、存在するものだけを走査する。
    $oem = Get-ConfigValue -InputObject $System -Name 'Oem'
    $hpe = Get-ConfigValue -InputObject $oem -Name 'Hpe'
    if ($null -eq $hpe) { $hpe = Get-ConfigValue -InputObject $oem -Name 'Hp' }
    $aggregate = Get-ConfigValue -InputObject $hpe -Name 'AggregateHealthStatus'

    if ($null -ne $aggregate) {
        foreach ($property in $aggregate.PSObject.Properties) {
            if ($property.Name -like '@odata*') { continue }

            $partStatus = Get-ConfigValue -InputObject $property.Value -Name 'Status'
            $partHealth = [string] (Get-ConfigValue -InputObject $partStatus -Name 'Health' -Default '')
            if ([string]::IsNullOrWhiteSpace($partHealth)) { continue }

            $partLevel = Get-RedfishHealthLevel -Health $partHealth
            if ($partLevel -notin @('Warning', 'Critical')) { continue }

            $finding = New-CheckFinding -Key ('system/{0}' -f $property.Name) -Level $partLevel `
                -Title ('ハードウェア部位に異常があります: {0}' -f $property.Name) `
                -Message ('Health={0}' -f $partHealth) -Value $partHealth
            $null = $findings.Add($finding)
        }
    }

    return $findings.ToArray()
}

function Get-StorageFinding {
    <#
        .SYNOPSIS
        ストレージコントローラ配下のリソースから検知事項を組み立てる。純粋関数。

        .PARAMETER StorageResource
        Status.Health を持つリソースの配列（コントローラ / 論理ドライブ / 物理ドライブ）。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter()]
        [AllowNull()]
        [psobject[]] $StorageResource = @()
    )

    $findings = New-Object System.Collections.ArrayList

    foreach ($resource in @($StorageResource)) {
        if ($null -eq $resource) { continue }

        $status = Get-ConfigValue -InputObject $resource -Name 'Status'
        $level = Get-RedfishHealthLevel -Health ([string] (Get-ConfigValue -InputObject $status -Name 'Health' -Default ''))
        if ($level -in @('OK', 'Unknown')) { continue }

        $name = [string] (Get-ConfigValue -InputObject $resource -Name 'Name' -Default '')
        if ([string]::IsNullOrWhiteSpace($name)) {
            $name = [string] (Get-ConfigValue -InputObject $resource -Name 'Id' -Default 'Storage')
        }
        $model = [string] (Get-ConfigValue -InputObject $resource -Name 'Model' -Default '')
        $location = [string] (Get-ConfigValue -InputObject $resource -Name 'Location' -Default '')

        $finding = New-CheckFinding -Key ('storage/{0}' -f $name) -Level $level `
            -Title ('ストレージに異常があります: {0}' -f $name) `
            -Message ('Health={0} / モデル={1} / 位置={2}' -f `
                (Get-ConfigValue -InputObject $status -Name 'Health' -Default '不明'), $model, $location)
        $null = $findings.Add($finding)
    }

    return $findings.ToArray()
}

function Get-HardwareLogFinding {
    <#
        .SYNOPSIS
        ハードウェアログ（IML）のエントリから検知事項を組み立てる。純粋関数。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter()]
        [AllowNull()]
        [psobject[]] $LogEntry = @(),

        [Parameter()]
        [datetime] $Now = (Get-Date),

        [Parameter()]
        [double] $LookbackHours = 24
    )

    $findings = New-Object System.Collections.ArrayList
    $since = $Now.AddHours(-1 * $LookbackHours)

    foreach ($entry in @($LogEntry)) {
        if ($null -eq $entry) { continue }

        $severity = [string] (Get-ConfigValue -InputObject $entry -Name 'Severity' -Default '')
        $level = Get-RedfishHealthLevel -Health $severity
        if ($level -notin @('Warning', 'Critical')) { continue }

        $createdRaw = Get-ConfigValue -InputObject $entry -Name 'Created'
        $created = $null
        if (-not [string]::IsNullOrWhiteSpace([string] $createdRaw)) {
            $parsed = [datetime]::MinValue
            if ([datetime]::TryParse([string] $createdRaw, [ref] $parsed)) { $created = $parsed }
        }
        if ($null -ne $created -and $created -lt $since) { continue }

        $id = [string] (Get-ConfigValue -InputObject $entry -Name 'Id' -Default '')
        $message = [string] (Get-ConfigValue -InputObject $entry -Name 'Message' -Default '')

        $finding = New-CheckFinding -Key ('iml/{0}' -f $id) -Level $level `
            -Title ('ハードウェアログに記録があります (IML {0})' -f $id) `
            -Message ('{0} / 発生={1}' -f $message, `
                (@{ $true = '不明'; $false = (@{ $true = ''; $false = $created }[$null -eq $created]) }[$null -eq $created]))
        $null = $findings.Add($finding)
    }

    return $findings.ToArray()
}

function Invoke-RedfishRequest {
    <#
        .SYNOPSIS
        Redfish のエンドポイントへ GET リクエストを送る。

        .DESCRIPTION
        PowerShell 5.1 の Invoke-RestMethod には -SkipCertificateCheck が無いため、
        証明書検証のスキップは ServicePointManager のコールバックで行い、
        呼び出し後に必ず元へ戻す。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [string] $BaseUri,

        [Parameter(Mandatory = $true)]
        [string] $Path,

        [Parameter(Mandatory = $true)]
        [pscredential] $Credential,

        [Parameter()]
        [int] $TimeoutSeconds = 30,

        [Parameter()]
        [switch] $SkipCertificateCheck
    )

    $uri = '{0}{1}' -f $BaseUri.TrimEnd('/'), $Path
    $plain = '{0}:{1}' -f $Credential.UserName, $Credential.GetNetworkCredential().Password
    $token = [Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes($plain))
    $headers = @{
        Authorization = 'Basic {0}' -f $token
        Accept        = 'application/json'
        'OData-Version' = '4.0'
    }

    $originalCallback = [System.Net.ServicePointManager]::ServerCertificateValidationCallback
    $originalProtocol = [System.Net.ServicePointManager]::SecurityProtocol
    try {
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
        if ($SkipCertificateCheck) {
            [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
        }
        return (Invoke-RestMethod -Uri $uri -Method Get -Headers $headers -TimeoutSec $TimeoutSeconds -ErrorAction Stop)
    }
    finally {
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = $originalCallback
        [System.Net.ServicePointManager]::SecurityProtocol = $originalProtocol
    }
}

function Get-RedfishMemberResource {
    <#
        .SYNOPSIS
        Members リンクを 1 階層たどってリソースを集める。

        .DESCRIPTION
        ストレージ関連のスキーマは機種差が大きいため、コレクション（Members を持つ応答）
        なら子をたどり、単体リソースならそのまま返す、という緩い扱いにしている。
        際限なくたどらないよう件数に上限を設ける。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter(Mandatory = $true)]
        [string] $BaseUri,

        [Parameter(Mandatory = $true)]
        [AllowNull()]
        $Resource,

        [Parameter(Mandatory = $true)]
        [pscredential] $Credential,

        [Parameter()]
        [int] $TimeoutSeconds = 30,

        [Parameter()]
        [switch] $SkipCertificateCheck,

        [Parameter()]
        [int] $MaxMembers = 32
    )

    if ($null -eq $Resource) { return @() }

    $members = Get-ConfigValue -InputObject $Resource -Name 'Members'
    if ($null -eq $members) { return @($Resource) }

    $collected = New-Object System.Collections.ArrayList
    $count = 0
    foreach ($member in @($members)) {
        if ($count -ge $MaxMembers) { break }
        $link = [string] (Get-ConfigValue -InputObject $member -Name '@odata.id' -Default '')
        if ([string]::IsNullOrWhiteSpace($link)) { continue }

        try {
            $child = Invoke-RedfishRequest -BaseUri $BaseUri -Path $link -Credential $Credential `
                -TimeoutSeconds $TimeoutSeconds -SkipCertificateCheck:$SkipCertificateCheck
            $null = $collected.Add($child)
            $count++
        }
        catch {
            Write-MonitorLog -Level 'Debug' -Category 'hardware' -Message (
                'Redfish リソースを取得できませんでした ({0}): {1}' -f $link, $_.Exception.Message)
        }
    }

    return $collected.ToArray()
}

function Get-HardwareData {
    <#
        .SYNOPSIS
        iLO から Redfish のリソースを収集する。

        .DESCRIPTION
        エンドポイントごとに個別に例外を捕まえる。1 つ取れなくても他は続行する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $HardwareConfig
    )

    $address = [string] (Get-ConfigValue -InputObject $HardwareConfig -Name 'address' -Default '')
    if ([string]::IsNullOrWhiteSpace($address)) {
        throw 'iLO のアドレスが設定されていません。'
    }

    $credentialName = [string] (Get-ConfigValue -InputObject $HardwareConfig -Name 'credentialName' -Default '')
    $credential = Get-MonitorCredential -Name $credentialName
    if ($null -eq $credential) {
        throw ('iLO の資格情報 "{0}" を取得できません。Install-Credentials.ps1 で登録してください。' -f $credentialName)
    }

    $timeout = [int] (Get-ConfigValue -InputObject $HardwareConfig -Name 'timeoutSeconds' -Default 30)
    $skipCert = [bool] (Get-ConfigValue -InputObject $HardwareConfig -Name 'skipCertificateCheck' -Default $false)
    $endpoints = Get-ConfigValue -InputObject $HardwareConfig -Name 'endpoints'

    $baseUri = if ($address -match '^https?://') { $address } else { 'https://{0}' -f $address }

    $result = [pscustomobject]@{
        BaseUri   = $baseUri
        System    = $null
        Thermal   = $null
        Power     = $null
        Storage   = @()
        EventLog  = @()
        Reachable = $false
        Errors    = @()
    }

    # 到達性は System エンドポイントで判断する。ここで失敗したらハードウェア監視は打ち切る。
    $systemPath = [string] (Get-ConfigValue -InputObject $endpoints -Name 'system' -Default '/redfish/v1/Systems/1')
    if ([string]::IsNullOrWhiteSpace($systemPath)) { $systemPath = '/redfish/v1/Systems/1' }

    $result.System = Invoke-RedfishRequest -BaseUri $baseUri -Path $systemPath -Credential $credential `
        -TimeoutSeconds $timeout -SkipCertificateCheck:$skipCert
    $result.Reachable = $true

    foreach ($name in @('thermal', 'power')) {
        $path = [string] (Get-ConfigValue -InputObject $endpoints -Name $name -Default '')
        if ([string]::IsNullOrWhiteSpace($path)) { continue }
        try {
            $value = Invoke-RedfishRequest -BaseUri $baseUri -Path $path -Credential $credential `
                -TimeoutSeconds $timeout -SkipCertificateCheck:$skipCert
            if ($name -eq 'thermal') { $result.Thermal = $value } else { $result.Power = $value }
        }
        catch {
            $result.Errors += ('{0}: {1}' -f $name, $_.Exception.Message)
        }
    }

    $storagePath = [string] (Get-ConfigValue -InputObject $endpoints -Name 'storage' -Default '')
    if (-not [string]::IsNullOrWhiteSpace($storagePath)) {
        try {
            $root = Invoke-RedfishRequest -BaseUri $baseUri -Path $storagePath -Credential $credential `
                -TimeoutSeconds $timeout -SkipCertificateCheck:$skipCert
            $result.Storage = @(Get-RedfishMemberResource -BaseUri $baseUri -Resource $root -Credential $credential `
                    -TimeoutSeconds $timeout -SkipCertificateCheck:$skipCert)
        }
        catch {
            $result.Errors += ('storage: {0}' -f $_.Exception.Message)
        }
    }

    $logPath = [string] (Get-ConfigValue -InputObject $endpoints -Name 'eventLog' -Default '')
    if (-not [string]::IsNullOrWhiteSpace($logPath)) {
        $thresholds = Get-ConfigValue -InputObject $HardwareConfig -Name 'thresholds'
        $maxEntries = [int] (Get-ConfigValue -InputObject $thresholds -Name 'eventLogMaxEntries' -Default 100)
        try {
            $log = Invoke-RedfishRequest -BaseUri $baseUri -Path $logPath -Credential $credential `
                -TimeoutSeconds $timeout -SkipCertificateCheck:$skipCert
            $entries = @(Get-ConfigValue -InputObject $log -Name 'Members' -Default @())
            if ($entries.Count -gt $maxEntries) { $entries = @($entries | Select-Object -Last $maxEntries) }
            $result.EventLog = $entries
        }
        catch {
            $result.Errors += ('eventLog: {0}' -f $_.Exception.Message)
        }
    }

    return $result
}

function Invoke-HardwareCheck {
    <#
        .SYNOPSIS
        HW チェックを 1 監視対象について実行する。

        .DESCRIPTION
        iLO に到達できない場合もここで例外を外へ出さない。
        呼び出し側（Invoke-Monitor.ps1）が他の監視項目を継続できるようにするため。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    $checkId = 'HW'
    $checkName = 'ハードウェア (iLO)'
    $targetName = [string] $Target.name

    $hardware = Get-ConfigValue -InputObject $Target -Name 'hardware'
    if ($null -eq $hardware -or -not [bool] (Get-ConfigValue -InputObject $hardware -Name 'enabled' -Default $false)) {
        return (New-SkippedCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
                -Reason 'ハードウェア監視は無効です（ゲスト VM ではホスト側で取得します）。')
    }

    try {
        $data = Get-HardwareData -HardwareConfig $hardware
    }
    catch {
        # iLO に到達できない場合はハードウェア監視のみを打ち切る。他項目の監視は継続する。
        $reason = 'iLO に接続できません: {0}' -f $_.Exception.Message
        Write-MonitorLog -Level 'Warn' -Category 'hardware' -Message ('{0} / {1}' -f $targetName, $reason)

        $treatAsUnknown = [bool] (Get-ConfigValue -InputObject $hardware -Name 'treatUnreachableAsUnknown' -Default $true)
        if (-not $treatAsUnknown) {
            return (New-SkippedCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName -Reason $reason)
        }
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName -Reason $reason)
    }

    $thresholds = Get-ConfigValue -InputObject $hardware -Name 'thresholds'
    $lookbackHours = [double] (Get-ConfigValue -InputObject $thresholds -Name 'eventLogLookbackHours' -Default 24)

    $findings = @()
    $findings += @(Get-SystemHealthFinding -System $data.System)
    $findings += @(Get-ThermalFinding -Thermal $data.Thermal -Threshold $thresholds)
    $findings += @(Get-PowerFinding -Power $data.Power)
    $findings += @(Get-StorageFinding -StorageResource $data.Storage)
    $findings += @(Get-HardwareLogFinding -LogEntry $data.EventLog -Now $Now -LookbackHours $lookbackHours)

    foreach ($errorText in @($data.Errors)) {
        $findings += New-CheckFinding -Key ('endpoint/{0}' -f ($errorText -split ':')[0]) -Level 'Unknown' `
            -Title 'Redfish のエンドポイントを取得できません' `
            -Message ('{0}。機種・ファーム世代でスキーマが異なる場合は設定の endpoints を見直してください。' -f $errorText)
    }

    $items = @()
    foreach ($sensor in @(Get-ConfigValue -InputObject $data.Thermal -Name 'Temperatures' -Default @())) {
        $status = Get-ConfigValue -InputObject $sensor -Name 'Status'
        if ([string] (Get-ConfigValue -InputObject $status -Name 'State' -Default 'Enabled') -ne 'Enabled') { continue }
        $reading = Get-ConfigValue -InputObject $sensor -Name 'ReadingCelsius'
        if ($null -eq $reading) { continue }
        $items += [pscustomobject]@{
            Kind     = 'Temperature'
            Name     = [string] (Get-ConfigValue -InputObject $sensor -Name 'Name' -Default '')
            Reading  = [double] $reading
            Units    = '℃'
            Warning  = Get-ConfigValue -InputObject $sensor -Name 'UpperThresholdNonCritical'
            Critical = Get-ConfigValue -InputObject $sensor -Name 'UpperThresholdCritical'
            Health   = [string] (Get-ConfigValue -InputObject $status -Name 'Health' -Default '')
        }
    }
    foreach ($fan in @(Get-ConfigValue -InputObject $data.Thermal -Name 'Fans' -Default @())) {
        $status = Get-ConfigValue -InputObject $fan -Name 'Status'
        if ([string] (Get-ConfigValue -InputObject $status -Name 'State' -Default 'Enabled') -ne 'Enabled') { continue }
        $reading = Get-ConfigValue -InputObject $fan -Name 'Reading'
        if ($null -eq $reading) { $reading = Get-ConfigValue -InputObject $fan -Name 'CurrentReading' }
        $items += [pscustomobject]@{
            Kind     = 'Fan'
            Name     = [string] (Get-ConfigValue -InputObject $fan -Name 'Name' -Default '')
            Reading  = if ($null -ne $reading) { [double] $reading } else { $null }
            Units    = [string] (Get-ConfigValue -InputObject $fan -Name 'ReadingUnits' -Default '%')
            Warning  = $null
            Critical = $null
            Health   = [string] (Get-ConfigValue -InputObject $status -Name 'Health' -Default '')
        }
    }
    foreach ($supply in @(Get-ConfigValue -InputObject $data.Power -Name 'PowerSupplies' -Default @())) {
        $status = Get-ConfigValue -InputObject $supply -Name 'Status'
        $state = [string] (Get-ConfigValue -InputObject $status -Name 'State' -Default '')
        if ($state -eq 'Absent') { continue }
        $items += [pscustomobject]@{
            Kind     = 'PowerSupply'
            Name     = [string] (Get-ConfigValue -InputObject $supply -Name 'Name' -Default '')
            Reading  = Get-ConfigValue -InputObject $supply -Name 'LastPowerOutputWatts'
            Units    = 'W'
            Warning  = $null
            Critical = $null
            Health   = [string] (Get-ConfigValue -InputObject $status -Name 'Health' -Default '')
        }
    }

    $systemStatus = Get-ConfigValue -InputObject $data.System -Name 'Status'
    $systemHealth = [string] (Get-ConfigValue -InputObject $systemStatus -Name 'Health' -Default '不明')
    $temperatures = @($items | Where-Object { $_.Kind -eq 'Temperature' })
    $hottest = $temperatures | Sort-Object Reading -Descending | Select-Object -First 1

    $summary = '全体ヘルス={0} / センサー {1} 点' -f $systemHealth, $items.Count
    if ($null -ne $hottest) {
        $summary = '{0} / 最高温度 {1} ℃ ({2})' -f $summary, $hottest.Reading, $hottest.Name
    }

    $metrics = [pscustomobject]@{
        SystemHealth   = $systemHealth
        SensorCount    = $items.Count
        MaxTemperature = if ($null -ne $hottest) { $hottest.Reading } else { $null }
        StorageCount   = @($data.Storage).Count
    }

    return (New-CheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
            -Summary $summary -Findings $findings -Metrics $metrics -Items $items)
}

Export-ModuleMember -Function @(
    'Get-RedfishHealthLevel'
    'Get-TemperatureLevel'
    'Get-ThermalFinding'
    'Get-PowerFinding'
    'Get-SystemHealthFinding'
    'Get-StorageFinding'
    'Get-HardwareLogFinding'
    'Invoke-RedfishRequest'
    'Get-RedfishMemberResource'
    'Get-HardwareData'
    'Invoke-HardwareCheck'
)
