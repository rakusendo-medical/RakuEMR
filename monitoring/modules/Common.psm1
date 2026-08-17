#Requires -Version 5.1
<#
    Common.psm1 — 監視ツール共通基盤

    役割:
      - 設定ファイル（JSON）の読込と既定値マージ
      - ログ出力（ファイル + ストリーム）
      - チェック結果 / 検知事項のデータ構造
      - 状態ファイル（JSON）の読み書き
      - DPAPI による資格情報の保存・取得
      - 監視対象（ローカル / リモート）へのコマンド実行

    本モジュールは PowerShell 5.1 標準機能のみで動作すること。
#>

$script:MonitorContext = $null
$script:MonitorSessionCache = @{}

# 状態レベルの重み。数値が大きいほど深刻。
# Unknown を Warning より重くしているのは意図的。
# 「収集できていない」＝「異常に気づけない」状態であり、本ツールが最も避けたい事象のため。
$script:StatusRankTable = [ordered]@{
    'OK'       = 0
    'Skipped'  = 1
    'Warning'  = 2
    'Unknown'  = 3
    'Critical' = 4
}

$script:MonitorDefaultConfig = @{
    general      = @{
        stateDirectory   = 'state'
        logDirectory     = 'logs'
        logRetentionDays = 30
        logLevel         = 'Info'
    }
    notification = @{
        channel                = 'smtp'
        enabled                = $true
        minimumLevel           = 'Warning'
        renotifyIntervalHours  = 6
        notifyOnResolve        = $true
        maxFindingsPerMail     = 50
        subjectPrefix          = '[監視]'
    }
    dashboard    = @{
        enabled        = $true
        outputPath     = ''
        refreshSeconds = 300
        historyDays    = 7
    }
}

#region ---------- パスとコンテキスト ----------

function Get-MonitorRoot {
    <#
        .SYNOPSIS
        monitoring ディレクトリの絶対パスを返す。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param()

    return (Split-Path -Parent $PSScriptRoot)
}

function Resolve-MonitorPath {
    <#
        .SYNOPSIS
        相対パスを monitoring ルート基準の絶対パスに解決する。日本語パスを含んでも動作する。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $Path,

        [Parameter()]
        [string] $Root
    )

    if ([string]::IsNullOrWhiteSpace($Path)) { return '' }
    if ([System.IO.Path]::IsPathRooted($Path)) { return $Path }
    if ([string]::IsNullOrWhiteSpace($Root)) { $Root = Get-MonitorRoot }

    return [System.IO.Path]::GetFullPath((Join-Path $Root $Path))
}

function Get-ConfigValue {
    <#
        .SYNOPSIS
        PSCustomObject / Hashtable から安全にプロパティを取得する。存在しなければ既定値を返す。

        .DESCRIPTION
        設定ファイルは項目が欠けていても動作させたいので、直接プロパティ参照はせず必ず本関数を経由する。
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [AllowNull()]
        $InputObject,

        [Parameter(Mandatory = $true)]
        [string] $Name,

        [Parameter()]
        [AllowNull()]
        $Default = $null
    )

    if ($null -eq $InputObject) { return $Default }

    $value = $null
    if ($InputObject -is [System.Collections.IDictionary]) {
        if (-not $InputObject.Contains($Name)) { return $Default }
        $value = $InputObject[$Name]
    }
    else {
        $property = $InputObject.PSObject.Properties[$Name]
        if ($null -eq $property) { return $Default }
        $value = $property.Value
    }

    if ($null -eq $value) { return $Default }
    return $value
}

function Import-MonitorConfig {
    <#
        .SYNOPSIS
        設定 JSON を読み込み、既定値をマージした設定オブジェクトを返す。

        .DESCRIPTION
        "__" で始まるキーは設定ファイル内コメントとして扱い、読込時に除去する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [string] $Path
    )

    $resolved = Resolve-MonitorPath -Path $Path
    if (-not (Test-Path -LiteralPath $resolved)) {
        throw "設定ファイルが見つかりません: $resolved"
    }

    $raw = Get-Content -LiteralPath $resolved -Raw -Encoding UTF8
    try {
        $config = $raw | ConvertFrom-Json
    }
    catch {
        throw "設定ファイルの JSON 解析に失敗しました: $resolved / $($_.Exception.Message)"
    }

    $config = ConvertTo-ConfigObject -InputObject $config

    foreach ($sectionName in $script:MonitorDefaultConfig.Keys) {
        $section = Get-ConfigValue -InputObject $config -Name $sectionName
        if ($null -eq $section) {
            $section = [pscustomobject]@{}
            Add-Member -InputObject $config -MemberType NoteProperty -Name $sectionName -Value $section -Force
        }
        foreach ($key in $script:MonitorDefaultConfig[$sectionName].Keys) {
            if ($null -eq $section.PSObject.Properties[$key]) {
                Add-Member -InputObject $section -MemberType NoteProperty -Name $key `
                    -Value $script:MonitorDefaultConfig[$sectionName][$key] -Force
            }
        }
    }

    if ($null -eq $config.PSObject.Properties['targets']) {
        Add-Member -InputObject $config -MemberType NoteProperty -Name 'targets' -Value @() -Force
    }

    Add-Member -InputObject $config -MemberType NoteProperty -Name 'ConfigPath' -Value $resolved -Force
    return $config
}

function ConvertTo-ConfigObject {
    <#
        .SYNOPSIS
        設定オブジェクトから "__" 始まりのコメントキーを再帰的に取り除く。

        .DESCRIPTION
        JSON にはコメント構文が無いため、"__" 始まりのキーを設定ファイル内の注釈として扱う。
        配列・スカラー・オブジェクトのいずれも受け付けるため、戻り値の型は入力に依存する。
    #>
    [CmdletBinding()]
    [OutputType([psobject], [object[]], [object])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowNull()]
        $InputObject
    )

    if ($null -eq $InputObject) { return $null }

    if ($InputObject -is [System.Management.Automation.PSCustomObject]) {
        $clean = [pscustomobject]@{}
        foreach ($property in $InputObject.PSObject.Properties) {
            if ($property.Name -like '__*') { continue }
            Add-Member -InputObject $clean -MemberType NoteProperty -Name $property.Name `
                -Value (ConvertTo-ConfigObject -InputObject $property.Value) -Force
        }
        return $clean
    }

    if ($InputObject -is [System.Collections.IEnumerable] -and $InputObject -isnot [string]) {
        $list = New-Object System.Collections.ArrayList
        foreach ($item in $InputObject) {
            $null = $list.Add((ConvertTo-ConfigObject -InputObject $item))
        }
        return $list.ToArray()
    }

    return $InputObject
}

function Initialize-MonitorContext {
    <#
        .SYNOPSIS
        設定を読み込み、ログ・状態ディレクトリを準備して実行コンテキストを構築する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [string] $ConfigPath,

        [Parameter()]
        [string] $CycleName = 'Manual',

        [Parameter()]
        [switch] $DryRun
    )

    $config = Import-MonitorConfig -Path $ConfigPath
    $root = Get-MonitorRoot

    $stateDir = Resolve-MonitorPath -Path (Get-ConfigValue -InputObject $config.general -Name 'stateDirectory' -Default 'state') -Root $root
    $logDir = Resolve-MonitorPath -Path (Get-ConfigValue -InputObject $config.general -Name 'logDirectory' -Default 'logs') -Root $root

    foreach ($dir in @($stateDir, $logDir)) {
        if (-not (Test-Path -LiteralPath $dir)) {
            $null = New-Item -ItemType Directory -Path $dir -Force
        }
    }

    $startedOn = Get-Date
    $script:MonitorContext = [pscustomobject]@{
        Config       = $config
        Root         = $root
        StateDir     = $stateDir
        LogDir       = $logDir
        CycleName    = $CycleName
        RunId        = '{0}-{1}' -f $startedOn.ToString('yyyyMMdd-HHmmss'), $CycleName
        StartedOn    = $startedOn
        LogFile      = Join-Path $logDir ('monitor-{0}.log' -f $startedOn.ToString('yyyyMMdd'))
        DryRun       = [bool] $DryRun
        LogLevel     = [string](Get-ConfigValue -InputObject $config.general -Name 'logLevel' -Default 'Info')
    }

    return $script:MonitorContext
}

function Get-MonitorContext {
    <#
        .SYNOPSIS
        現在の実行コンテキストを返す。未初期化なら $null。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param()

    return $script:MonitorContext
}

#endregion

#region ---------- ログ ----------

function Write-MonitorFile {
    <#
        .SYNOPSIS
        UTF-8（BOM 付き）でテキストファイルを書き出す。

        .DESCRIPTION
        PowerShell 5.1 の Out-File -Encoding utf8 は BOM 付きだが改行コードの扱いが環境依存のため、
        .NET の WriteAllText を直接使って出力を安定させる。
    #>
    [CmdletBinding(SupportsShouldProcess = $true)]
    param(
        [Parameter(Mandatory = $true)]
        [string] $Path,

        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $Content
    )

    if (-not $PSCmdlet.ShouldProcess($Path, 'ファイル書き出し')) { return }

    $directory = Split-Path -Parent $Path
    if ($directory -and -not (Test-Path -LiteralPath $directory)) {
        $null = New-Item -ItemType Directory -Path $directory -Force
    }

    $encoding = New-Object System.Text.UTF8Encoding($true)
    [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Write-MonitorLog {
    <#
        .SYNOPSIS
        ログを 1 行出力する。ファイルと PowerShell ストリームの両方へ。
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true, Position = 0)]
        [AllowEmptyString()]
        [string] $Message,

        [Parameter()]
        [ValidateSet('Debug', 'Info', 'Warn', 'Error')]
        [string] $Level = 'Info',

        [Parameter()]
        [string] $Category = 'general'
    )

    $timestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    $line = '{0} [{1,-5}] [{2}] {3}' -f $timestamp, $Level.ToUpperInvariant(), $Category, $Message

    $context = Get-MonitorContext
    if ($null -ne $context -and $context.LogFile) {
        try {
            $directory = Split-Path -Parent $context.LogFile
            if (-not (Test-Path -LiteralPath $directory)) {
                $null = New-Item -ItemType Directory -Path $directory -Force
            }
            # 追記は Encoding UTF8（5.1 では BOM 付き）で行う。
            Add-Content -LiteralPath $context.LogFile -Value $line -Encoding UTF8
        }
        catch {
            Write-Warning ('ログファイルへの書き込みに失敗しました: {0}' -f $_.Exception.Message)
        }
    }

    switch ($Level) {
        'Error' { Write-Error -Message $line -ErrorAction Continue }
        'Warn' { Write-Warning -Message $line }
        'Debug' { Write-Verbose -Message $line }
        default { Write-Information -MessageData $line -InformationAction Continue }
    }
}

function Remove-MonitorOldLog {
    <#
        .SYNOPSIS
        保持日数を超えたログファイルを削除する。
    #>
    [CmdletBinding(SupportsShouldProcess = $true)]
    param(
        [Parameter()]
        [int] $RetentionDays = 30
    )

    $context = Get-MonitorContext
    if ($null -eq $context) { return }
    if ($RetentionDays -le 0) { return }

    $limit = (Get-Date).AddDays(-1 * $RetentionDays)
    $files = @(Get-ChildItem -LiteralPath $context.LogDir -Filter 'monitor-*.log' -File -ErrorAction SilentlyContinue |
            Where-Object { $_.LastWriteTime -lt $limit })

    foreach ($file in $files) {
        if ($PSCmdlet.ShouldProcess($file.FullName, '古いログの削除')) {
            Remove-Item -LiteralPath $file.FullName -Force -ErrorAction SilentlyContinue
        }
    }
}

#endregion

#region ---------- チェック結果のデータ構造 ----------

function Get-StatusRank {
    <#
        .SYNOPSIS
        状態レベルを数値化する。大きいほど深刻。
    #>
    [CmdletBinding()]
    [OutputType([int])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $Status
    )

    if ($script:StatusRankTable.Contains($Status)) { return [int] $script:StatusRankTable[$Status] }
    return [int] $script:StatusRankTable['Unknown']
}

function Get-WorstStatus {
    <#
        .SYNOPSIS
        複数の状態レベルのうち最も深刻なものを返す。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $false, ValueFromPipeline = $true)]
        [AllowNull()]
        [string[]] $Status
    )

    begin { $all = New-Object System.Collections.ArrayList }
    process {
        if ($null -ne $Status) {
            foreach ($item in $Status) {
                if (-not [string]::IsNullOrWhiteSpace($item)) { $null = $all.Add($item) }
            }
        }
    }
    end {
        if ($all.Count -eq 0) { return 'Unknown' }
        $worst = 'OK'
        foreach ($item in $all) {
            if ((Get-StatusRank -Status $item) -gt (Get-StatusRank -Status $worst)) { $worst = $item }
        }
        return $worst
    }
}

function New-CheckFinding {
    <#
        .SYNOPSIS
        個別の検知事項（アラート単位）を生成する。

        .DESCRIPTION
        Key は同一事象を識別するための安定した文字列。再通知抑制と復旧判定はこの Key を軸に行うため、
        時刻や測定値など実行のたびに変わる値を Key に含めてはならない。
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'オブジェクトを生成して返すだけのファクトリ関数であり、システム状態を変更しない。')]
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [string] $Key,

        [Parameter(Mandatory = $true)]
        [ValidateSet('OK', 'Warning', 'Critical', 'Unknown', 'Skipped')]
        [string] $Level,

        [Parameter(Mandatory = $true)]
        [string] $Title,

        [Parameter()]
        [AllowEmptyString()]
        [string] $Message = '',

        [Parameter()]
        [AllowNull()]
        $Value = $null
    )

    return [pscustomobject]@{
        Key     = $Key
        Level   = $Level
        Title   = $Title
        Message = $Message
        Value   = $Value
    }
}

function New-CheckResult {
    <#
        .SYNOPSIS
        1 チェック × 1 監視対象の結果オブジェクトを生成する。
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'オブジェクトを生成して返すだけのファクトリ関数であり、システム状態を変更しない。')]
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [string] $CheckId,

        [Parameter(Mandatory = $true)]
        [string] $CheckName,

        [Parameter(Mandatory = $true)]
        [string] $TargetName,

        [Parameter()]
        [ValidateSet('OK', 'Warning', 'Critical', 'Unknown', 'Skipped')]
        [string] $Status = 'OK',

        [Parameter()]
        [AllowEmptyString()]
        [string] $Summary = '',

        [Parameter()]
        [AllowNull()]
        [psobject[]] $Findings = @(),

        [Parameter()]
        [AllowNull()]
        $Metrics = $null,

        [Parameter()]
        [AllowNull()]
        $Items = $null
    )

    $findingList = @()
    if ($null -ne $Findings) { $findingList = @($Findings | Where-Object { $null -ne $_ }) }

    $effectiveStatus = $Status
    if ($findingList.Count -gt 0) {
        $levels = @($findingList | ForEach-Object { $_.Level })
        $levels += $Status
        $effectiveStatus = Get-WorstStatus -Status $levels
    }

    $itemList = @()
    if ($null -ne $Items) { $itemList = @($Items) }

    $metricObject = $Metrics
    if ($null -eq $metricObject) { $metricObject = [pscustomobject]@{} }

    return [pscustomobject]@{
        CheckId     = $CheckId
        CheckName   = $CheckName
        TargetName  = $TargetName
        Status      = $effectiveStatus
        Summary     = $Summary
        Findings    = $findingList
        Metrics     = $metricObject
        Items       = $itemList
        CollectedOn = (Get-Date).ToString('o')
    }
}

function New-SkippedCheckResult {
    <#
        .SYNOPSIS
        設定で無効化されている / 対象外のチェック結果を生成する。
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'オブジェクトを生成して返すだけのファクトリ関数であり、システム状態を変更しない。')]
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [string] $CheckId,

        [Parameter(Mandatory = $true)]
        [string] $CheckName,

        [Parameter(Mandatory = $true)]
        [string] $TargetName,

        [Parameter()]
        [string] $Reason = '設定で無効化されています。'
    )

    return New-CheckResult -CheckId $CheckId -CheckName $CheckName -TargetName $TargetName `
        -Status 'Skipped' -Summary $Reason
}

function New-UnknownCheckResult {
    <#
        .SYNOPSIS
        収集に失敗したチェックの結果を生成する。

        .DESCRIPTION
        収集失敗は「気づけない状態」なので Unknown（Warning より重い）として通知対象に含める。
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'オブジェクトを生成して返すだけのファクトリ関数であり、システム状態を変更しない。')]
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [string] $CheckId,

        [Parameter(Mandatory = $true)]
        [string] $CheckName,

        [Parameter(Mandatory = $true)]
        [string] $TargetName,

        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $Reason
    )

    $finding = New-CheckFinding -Key 'collect-failed' -Level 'Unknown' `
        -Title ('{0} の収集に失敗' -f $CheckName) -Message $Reason

    return New-CheckResult -CheckId $CheckId -CheckName $CheckName -TargetName $TargetName `
        -Status 'Unknown' -Summary ('収集失敗: {0}' -f $Reason) -Findings @($finding)
}

#endregion

#region ---------- 状態ファイル ----------

function Get-MonitorStatePath {
    <#
        .SYNOPSIS
        state ディレクトリ配下のファイルパスを返す。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name
    )

    $context = Get-MonitorContext
    $stateDir = if ($null -ne $context) { $context.StateDir } else { Resolve-MonitorPath -Path 'state' }
    if (-not (Test-Path -LiteralPath $stateDir)) {
        $null = New-Item -ItemType Directory -Path $stateDir -Force
    }
    return (Join-Path $stateDir $Name)
}

function Read-MonitorState {
    <#
        .SYNOPSIS
        state 配下の JSON を読み込む。存在しなければ $null。
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name
    )

    $path = Get-MonitorStatePath -Name $Name
    if (-not (Test-Path -LiteralPath $path)) { return $null }

    try {
        $raw = Get-Content -LiteralPath $path -Raw -Encoding UTF8
        if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
        return ($raw | ConvertFrom-Json)
    }
    catch {
        Write-MonitorLog -Level 'Warn' -Category 'state' -Message ('状態ファイルの読込に失敗しました ({0}): {1}' -f $Name, $_.Exception.Message)
        return $null
    }
}

function Save-MonitorState {
    <#
        .SYNOPSIS
        state 配下へ JSON を書き出す（UTF-8 BOM 付き）。
    #>
    [CmdletBinding(SupportsShouldProcess = $true)]
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name,

        [Parameter(Mandatory = $true)]
        [AllowNull()]
        $InputObject,

        [Parameter()]
        [int] $Depth = 12
    )

    $path = Get-MonitorStatePath -Name $Name
    if (-not $PSCmdlet.ShouldProcess($path, '状態ファイルの保存')) { return }

    $json = $InputObject | ConvertTo-Json -Depth $Depth
    Write-MonitorFile -Path $path -Content $json -Confirm:$false
}

function ConvertTo-MonitorHashtable {
    <#
        .SYNOPSIS
        PSCustomObject を Hashtable に変換する（PowerShell 5.1 には ConvertFrom-Json -AsHashtable が無いため）。
    #>
    [CmdletBinding()]
    [OutputType([hashtable])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowNull()]
        $InputObject
    )

    $result = @{}
    if ($null -eq $InputObject) { return $result }

    if ($InputObject -is [System.Collections.IDictionary]) {
        foreach ($key in $InputObject.Keys) { $result[[string] $key] = $InputObject[$key] }
        return $result
    }

    foreach ($property in $InputObject.PSObject.Properties) {
        $result[$property.Name] = $property.Value
    }
    return $result
}

#endregion

#region ---------- 資格情報（DPAPI） ----------

function Get-MonitorCredentialDirectory {
    <#
        .SYNOPSIS
        暗号化資格情報の保存先ディレクトリを返す。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param()

    $dir = Get-MonitorStatePath -Name 'credentials'
    if (-not (Test-Path -LiteralPath $dir)) {
        $null = New-Item -ItemType Directory -Path $dir -Force
    }
    return $dir
}

function Save-MonitorSecret {
    <#
        .SYNOPSIS
        資格情報を DPAPI で暗号化して state/credentials 配下に保存する。

        .DESCRIPTION
        ConvertFrom-SecureString は実行アカウントとマシンに紐づく。
        別アカウント・別マシンで作成した文字列は復号できない点に注意すること。
    #>
    [CmdletBinding(SupportsShouldProcess = $true)]
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name,

        [Parameter(Mandatory = $true)]
        [securestring] $Secret,

        [Parameter()]
        [AllowEmptyString()]
        [string] $UserName = ''
    )

    $path = Join-Path (Get-MonitorCredentialDirectory) ('{0}.cred.json' -f $Name)
    if (-not $PSCmdlet.ShouldProcess($path, '資格情報の保存')) { return }

    $payload = [pscustomobject]@{
        name       = $Name
        userName   = $UserName
        secret     = (ConvertFrom-SecureString -SecureString $Secret)
        createdBy  = ('{0}\{1}' -f $env:USERDOMAIN, $env:USERNAME)
        createdOn  = (Get-Date).ToString('o')
        machine    = $env:COMPUTERNAME
    }

    Write-MonitorFile -Path $path -Content ($payload | ConvertTo-Json -Depth 4) -Confirm:$false
}

function Get-MonitorSecretRecord {
    <#
        .SYNOPSIS
        保存済み資格情報のレコードを取得する。存在しなければ $null。
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name
    )

    $path = Join-Path (Get-MonitorCredentialDirectory) ('{0}.cred.json' -f $Name)
    if (-not (Test-Path -LiteralPath $path)) { return $null }

    try {
        return (Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json)
    }
    catch {
        Write-MonitorLog -Level 'Warn' -Category 'credential' -Message ('資格情報の読込に失敗しました ({0}): {1}' -f $Name, $_.Exception.Message)
        return $null
    }
}

function Get-MonitorCredential {
    <#
        .SYNOPSIS
        保存済み資格情報を PSCredential として取得する。
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $Name
    )

    if ([string]::IsNullOrWhiteSpace($Name)) { return $null }

    $record = Get-MonitorSecretRecord -Name $Name
    if ($null -eq $record) {
        Write-MonitorLog -Level 'Warn' -Category 'credential' -Message ('資格情報 "{0}" が登録されていません。Install-Credentials.ps1 を実行してください。' -f $Name)
        return $null
    }

    try {
        $secure = ConvertTo-SecureString -String $record.secret
    }
    catch {
        Write-MonitorLog -Level 'Error' -Category 'credential' -Message (
            '資格情報 "{0}" を復号できません。作成時のアカウント（{1}）/ マシン（{2}）と実行環境が一致しているか確認してください。' -f `
                $Name, $record.createdBy, $record.machine)
        return $null
    }

    $userName = [string] $record.userName
    if ([string]::IsNullOrWhiteSpace($userName)) { $userName = $Name }

    return (New-Object System.Management.Automation.PSCredential($userName, $secure))
}

function Get-MonitorSecretText {
    <#
        .SYNOPSIS
        保存済みシークレットを平文文字列として取得する（Backlog API キーなど、平文が必須の用途のみ）。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $Name
    )

    $credential = Get-MonitorCredential -Name $Name
    if ($null -eq $credential) { return '' }

    $pointer = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($credential.Password)
    try {
        return [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    }
    finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
}

#endregion

#region ---------- 監視対象への実行 ----------

function Get-TargetProperty {
    <#
        .SYNOPSIS
        監視対象の設定値を取得する。
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target,

        [Parameter(Mandatory = $true)]
        [string] $Name,

        [Parameter()]
        [AllowNull()]
        $Default = $null
    )

    return (Get-ConfigValue -InputObject $Target -Name $Name -Default $Default)
}

function Get-TargetCheckConfig {
    <#
        .SYNOPSIS
        監視対象の checks セクションから、指定チェックの設定を取得する。
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target,

        [Parameter(Mandatory = $true)]
        [string] $CheckKey
    )

    $checks = Get-ConfigValue -InputObject $Target -Name 'checks'
    return (Get-ConfigValue -InputObject $checks -Name $CheckKey)
}

function Test-CheckEnabled {
    <#
        .SYNOPSIS
        指定チェックが当該監視対象で有効かどうかを返す。
    #>
    [CmdletBinding()]
    [OutputType([bool])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target,

        [Parameter(Mandatory = $true)]
        [string] $CheckKey
    )

    $checkConfig = Get-TargetCheckConfig -Target $Target -CheckKey $CheckKey
    if ($null -eq $checkConfig) { return $false }
    return [bool] (Get-ConfigValue -InputObject $checkConfig -Name 'enabled' -Default $false)
}

function Test-TargetLocal {
    <#
        .SYNOPSIS
        監視対象がローカル実行かどうかを返す。
    #>
    [CmdletBinding()]
    [OutputType([bool])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target
    )

    $connection = Get-ConfigValue -InputObject $Target -Name 'connection'
    $mode = [string] (Get-ConfigValue -InputObject $connection -Name 'mode' -Default 'local')
    return ($mode -eq 'local')
}

function Get-MonitorTargetSession {
    <#
        .SYNOPSIS
        リモート監視対象への PSSession を取得する（対象ごとにキャッシュ）。

        .DESCRIPTION
        ワークグループ環境のため、接続先はホスト名ではなく設定の address（IP 可）を用いる。
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target
    )

    $name = [string] $Target.name
    if ($script:MonitorSessionCache.ContainsKey($name)) {
        $cached = $script:MonitorSessionCache[$name]
        if ($null -ne $cached -and $cached.State -eq 'Opened') { return $cached }
        $script:MonitorSessionCache.Remove($name)
    }

    $connection = Get-ConfigValue -InputObject $Target -Name 'connection'
    $address = [string] (Get-ConfigValue -InputObject $Target -Name 'address' -Default $name)
    $credentialName = [string] (Get-ConfigValue -InputObject $connection -Name 'credentialName' -Default '')
    $useSsl = [bool] (Get-ConfigValue -InputObject $connection -Name 'useSsl' -Default $false)
    $port = Get-ConfigValue -InputObject $connection -Name 'port'

    $parameters = @{
        ComputerName = $address
        ErrorAction  = 'Stop'
    }
    if ($useSsl) { $parameters['UseSSL'] = $true }
    if ($null -ne $port -and [int] $port -gt 0) { $parameters['Port'] = [int] $port }

    $credential = Get-MonitorCredential -Name $credentialName
    if ($null -ne $credential) { $parameters['Credential'] = $credential }

    $session = New-PSSession @parameters
    $script:MonitorSessionCache[$name] = $session
    return $session
}

function Close-MonitorTargetSession {
    <#
        .SYNOPSIS
        キャッシュしている PSSession をすべて閉じる。
    #>
    [CmdletBinding(SupportsShouldProcess = $true)]
    param()

    foreach ($key in @($script:MonitorSessionCache.Keys)) {
        $session = $script:MonitorSessionCache[$key]
        if ($null -ne $session -and $PSCmdlet.ShouldProcess($key, 'セッションの切断')) {
            Remove-PSSession -Session $session -ErrorAction SilentlyContinue
        }
    }
    $script:MonitorSessionCache.Clear()
}

function Invoke-MonitorScriptBlock {
    <#
        .SYNOPSIS
        監視対象上でスクリプトブロックを実行する。ローカル / リモートを吸収する。

        .DESCRIPTION
        読み取り専用の収集にのみ使用すること。状態を変更する処理を渡してはならない。
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target,

        [Parameter(Mandatory = $true)]
        [scriptblock] $ScriptBlock,

        [Parameter()]
        [object[]] $ArgumentList = @()
    )

    if (Test-TargetLocal -Target $Target) {
        return (& $ScriptBlock @ArgumentList)
    }

    $session = Get-MonitorTargetSession -Target $Target
    return (Invoke-Command -Session $session -ScriptBlock $ScriptBlock -ArgumentList $ArgumentList -ErrorAction Stop)
}

#endregion

#region ---------- 表示ユーティリティ ----------

function Format-MonitorByte {
    <#
        .SYNOPSIS
        バイト数を人間が読める単位に整形する。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowNull()]
        $Bytes
    )

    if ($null -eq $Bytes) { return '-' }

    $value = [double] $Bytes
    $units = @('B', 'KB', 'MB', 'GB', 'TB', 'PB')
    $index = 0
    while ([Math]::Abs($value) -ge 1024 -and $index -lt ($units.Count - 1)) {
        $value = $value / 1024
        $index++
    }
    return ('{0:N2} {1}' -f $value, $units[$index])
}

function Format-MonitorTimeSpan {
    <#
        .SYNOPSIS
        経過時間を「x日y時間z分」形式に整形する。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowNull()]
        $TimeSpan
    )

    if ($null -eq $TimeSpan) { return '-' }
    $span = [TimeSpan] $TimeSpan

    # [int] へのキャストは銀行家丸めになり 1.5 → 2 となるため、必ず Floor で切り捨てる。
    if ($span.TotalDays -ge 1) {
        return ('{0}日{1}時間' -f [Math]::Floor($span.TotalDays), $span.Hours)
    }
    if ($span.TotalHours -ge 1) {
        return ('{0}時間{1}分' -f [Math]::Floor($span.TotalHours), $span.Minutes)
    }
    return ('{0}分' -f [Math]::Floor($span.TotalMinutes))
}

#endregion

Export-ModuleMember -Function @(
    'Get-MonitorRoot'
    'Resolve-MonitorPath'
    'Get-ConfigValue'
    'Import-MonitorConfig'
    'ConvertTo-ConfigObject'
    'Initialize-MonitorContext'
    'Get-MonitorContext'
    'Write-MonitorFile'
    'Write-MonitorLog'
    'Remove-MonitorOldLog'
    'Get-StatusRank'
    'Get-WorstStatus'
    'New-CheckFinding'
    'New-CheckResult'
    'New-SkippedCheckResult'
    'New-UnknownCheckResult'
    'Get-MonitorStatePath'
    'Read-MonitorState'
    'Save-MonitorState'
    'ConvertTo-MonitorHashtable'
    'Get-MonitorCredentialDirectory'
    'Save-MonitorSecret'
    'Get-MonitorSecretRecord'
    'Get-MonitorCredential'
    'Get-MonitorSecretText'
    'Get-TargetProperty'
    'Get-TargetCheckConfig'
    'Test-CheckEnabled'
    'Test-TargetLocal'
    'Get-MonitorTargetSession'
    'Close-MonitorTargetSession'
    'Invoke-MonitorScriptBlock'
    'Format-MonitorByte'
    'Format-MonitorTimeSpan'
)
