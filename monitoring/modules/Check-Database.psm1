#Requires -Version 5.1
<#
    Check-Database.psm1 — LDF / RCV / DBC: SQL Server の状態監視

    日次。以下の 3 点を見る。
      LDF … 各 DB のトランザクションログサイズ、および mdf との比率
      RCV … 復旧モデル（recovery_model_desc）が期待値から変わっていないか
      DBC … 照合順序（collation_name）が期待値と一致しているか

    接続は System.Data.SqlClient を直接使う。
    sqlcmd も SqlServer モジュール（Invoke-Sqlcmd）も導入されていない前提。

    読み取り専用。ログの切り捨て・縮小・復旧モデルの変更は一切行わない。
#>

Import-Module (Join-Path $PSScriptRoot 'Common.psm1') -DisableNameChecking -ErrorAction Stop

# 各 DB のファイルサイズ・復旧モデル・照合順序をまとめて取得する。
# sys.master_files はインスタンス全体を 1 クエリで見られるため、DB ごとの接続切替が不要。
$script:DatabaseQuery = @'
SELECT
    d.name                                        AS DatabaseName,
    d.recovery_model_desc                         AS RecoveryModel,
    d.collation_name                              AS CollationName,
    d.state_desc                                  AS StateDesc,
    SUM(CASE WHEN mf.type = 0 THEN CAST(mf.size AS BIGINT) ELSE 0 END) * 8 * 1024 AS DataBytes,
    SUM(CASE WHEN mf.type = 1 THEN CAST(mf.size AS BIGINT) ELSE 0 END) * 8 * 1024 AS LogBytes
FROM sys.databases AS d
LEFT JOIN sys.master_files AS mf ON mf.database_id = d.database_id
GROUP BY d.name, d.recovery_model_desc, d.collation_name, d.state_desc
ORDER BY d.name;
'@

function Get-LogSizeLevel {
    <#
        .SYNOPSIS
        mdf / ldf のサイズから判定レベルを返す。純粋関数。

        .DESCRIPTION
        ldf が mdf の何倍かで判定する。小規模 DB では比率が跳ねやすいため、
        ldf が IgnoreBelowBytes 未満なら比率判定を行わない。
        比率とは別に、ldf 単体の絶対サイズによる判定も行う。

        .PARAMETER DataBytes
        mdf（データファイル）の合計サイズ。

        .PARAMETER LogBytes
        ldf（トランザクションログ）の合計サイズ。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [double] $DataBytes,

        [Parameter(Mandatory = $true)]
        [double] $LogBytes,

        [Parameter()]
        [double] $WarningRatio = 2.0,

        [Parameter()]
        [double] $CriticalRatio = 3.0,

        [Parameter()]
        [double] $IgnoreBelowBytes = 0,

        [Parameter()]
        [double] $WarningSizeBytes = 0
    )

    if ($LogBytes -le 0) { return 'OK' }

    if ($LogBytes -ge $IgnoreBelowBytes) {
        if ($DataBytes -gt 0) {
            $ratio = $LogBytes / $DataBytes
            if ($CriticalRatio -gt 0 -and $ratio -gt $CriticalRatio) { return 'Critical' }
            if ($WarningRatio -gt 0 -and $ratio -gt $WarningRatio) { return 'Warning' }
        }
    }

    if ($WarningSizeBytes -gt 0 -and $LogBytes -gt $WarningSizeBytes) { return 'Warning' }
    return 'OK'
}

function Get-DatabaseCheckFinding {
    <#
        .SYNOPSIS
        取得した DB 一覧から検知事項を組み立てる。純粋関数。

        .PARAMETER Database
        DatabaseName / RecoveryModel / CollationName / StateDesc / DataBytes / LogBytes を持つ配列。

        .PARAMETER Setting
        checks.database の設定。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter()]
        [AllowNull()]
        [psobject[]] $Database = @(),

        [Parameter()]
        [AllowNull()]
        $Setting = $null
    )

    $excluded = @(Get-ConfigValue -InputObject $Setting -Name 'excludeDatabases' -Default @('master', 'model', 'msdb', 'tempdb'))
    $warningRatio = [double] (Get-ConfigValue -InputObject $Setting -Name 'ldfWarningRatio' -Default 2.0)
    $criticalRatio = [double] (Get-ConfigValue -InputObject $Setting -Name 'ldfCriticalRatio' -Default 3.0)
    $ignoreBelowMB = [double] (Get-ConfigValue -InputObject $Setting -Name 'ldfIgnoreBelowMB' -Default 512)
    $warningSizeGB = [double] (Get-ConfigValue -InputObject $Setting -Name 'ldfWarningSizeGB' -Default 0)
    $expectedRecovery = [string] (Get-ConfigValue -InputObject $Setting -Name 'expectedRecoveryModel' -Default 'SIMPLE')
    $expectedCollation = [string] (Get-ConfigValue -InputObject $Setting -Name 'expectedCollation' -Default 'Japanese_CI_AS')

    $findings = New-Object System.Collections.ArrayList

    foreach ($item in @($Database)) {
        if ($null -eq $item) { continue }

        $name = [string] $item.DatabaseName
        if ([string]::IsNullOrWhiteSpace($name)) { continue }
        if ($excluded -contains $name) { continue }

        # ONLINE 以外の DB は個別に通知する。サイズや照合順序の判定は意味を成さないので行わない。
        $state = [string] $item.StateDesc
        if (-not [string]::IsNullOrWhiteSpace($state) -and $state -ne 'ONLINE') {
            $finding = New-CheckFinding -Key ('{0}/state' -f $name) -Level 'Critical' `
                -Title ('データベースがオンラインではありません: {0}' -f $name) `
                -Message ('状態={0}' -f $state) -Value $state
            $null = $findings.Add($finding)
            continue
        }

        $dataBytes = [double] $item.DataBytes
        $logBytes = [double] $item.LogBytes

        # LDF: トランザクションログサイズ
        $logLevel = Get-LogSizeLevel -DataBytes $dataBytes -LogBytes $logBytes `
            -WarningRatio $warningRatio -CriticalRatio $criticalRatio `
            -IgnoreBelowBytes ($ignoreBelowMB * 1MB) -WarningSizeBytes ($warningSizeGB * 1GB)

        if ($logLevel -ne 'OK') {
            $ratioText = if ($dataBytes -gt 0) { '{0:N1} 倍' -f ($logBytes / $dataBytes) } else { '(mdf サイズ不明)' }
            $finding = New-CheckFinding -Key ('{0}/ldf' -f $name) -Level $logLevel `
                -Title ('トランザクションログが肥大しています: {0}' -f $name) `
                -Message ('ldf={0} / mdf={1}（比率 {2}）。ログのバックアップ運用または復旧モデルを確認してください。' -f `
                    (Format-MonitorByte -Bytes $logBytes), (Format-MonitorByte -Bytes $dataBytes), $ratioText) `
                -Value ([Math]::Round($logBytes / 1GB, 2))
            $null = $findings.Add($finding)
        }

        # RCV: 復旧モデル
        $recovery = [string] $item.RecoveryModel
        if (-not [string]::IsNullOrWhiteSpace($expectedRecovery) -and $recovery -ne $expectedRecovery) {
            $finding = New-CheckFinding -Key ('{0}/recovery' -f $name) -Level 'Warning' `
                -Title ('復旧モデルが想定と異なります: {0}' -f $name) `
                -Message ('現在={0} / 期待={1}。{1} 以外ではログのバックアップを取らない限り ldf が肥大し続けます。' -f $recovery, $expectedRecovery) `
                -Value $recovery
            $null = $findings.Add($finding)
        }

        # DBC: 照合順序
        $collation = [string] $item.CollationName
        if (-not [string]::IsNullOrWhiteSpace($expectedCollation) -and $collation -ne $expectedCollation) {
            $finding = New-CheckFinding -Key ('{0}/collation' -f $name) -Level 'Warning' `
                -Title ('照合順序が想定と異なります: {0}' -f $name) `
                -Message ('現在={0} / 期待={1}' -f $collation, $expectedCollation) `
                -Value $collation
            $null = $findings.Add($finding)
        }
    }

    return $findings.ToArray()
}

function Get-SqlConnectionString {
    <#
        .SYNOPSIS
        接続文字列を組み立てる。純粋関数。

        .DESCRIPTION
        SQL 認証を使う場合の資格情報は PSCredential で受け取る。設定ファイルには保存しない。
        接続文字列を組み立てる都合上、内部で一度だけ平文に展開する。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [string] $ServerInstance,

        [Parameter()]
        [bool] $UseIntegratedSecurity = $true,

        [Parameter()]
        [AllowNull()]
        [pscredential] $Credential = $null,

        [Parameter()]
        [int] $ConnectTimeoutSeconds = 10
    )

    $builder = New-Object System.Data.SqlClient.SqlConnectionStringBuilder
    $builder['Server'] = $ServerInstance
    $builder['Database'] = 'master'
    $builder['Connect Timeout'] = $ConnectTimeoutSeconds
    $builder['Application Name'] = 'RakuEMR-Monitor'

    if ($UseIntegratedSecurity) {
        $builder['Integrated Security'] = $true
    }
    else {
        if ($null -eq $Credential) {
            throw 'SQL 認証を指定した場合は資格情報が必要です。'
        }
        $builder['User ID'] = $Credential.UserName
        $builder['Password'] = $Credential.GetNetworkCredential().Password
    }

    return $builder.ConnectionString
}

function Invoke-SqlReadQuery {
    <#
        .SYNOPSIS
        System.Data.SqlClient で読み取りクエリを実行し、結果を PSCustomObject の配列で返す。

        .DESCRIPTION
        sqlcmd / SqlServer モジュール（Invoke-Sqlcmd）には依存しない。
        読み取り専用の SELECT にのみ使用すること。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter(Mandatory = $true)]
        [string] $ConnectionString,

        [Parameter(Mandatory = $true)]
        [string] $Query,

        [Parameter()]
        [int] $QueryTimeoutSeconds = 30
    )

    $connection = New-Object System.Data.SqlClient.SqlConnection $ConnectionString
    $command = $null
    $reader = $null
    $rows = New-Object System.Collections.ArrayList

    try {
        $connection.Open()
        $command = $connection.CreateCommand()
        $command.CommandText = $Query
        $command.CommandTimeout = $QueryTimeoutSeconds
        $reader = $command.ExecuteReader()

        while ($reader.Read()) {
            $row = [ordered]@{}
            for ($index = 0; $index -lt $reader.FieldCount; $index++) {
                $name = $reader.GetName($index)
                $value = $reader.GetValue($index)
                if ($value -is [System.DBNull]) { $value = $null }
                $row[$name] = $value
            }
            $null = $rows.Add([pscustomobject] $row)
        }
    }
    finally {
        if ($null -ne $reader) { $reader.Dispose() }
        if ($null -ne $command) { $command.Dispose() }
        $connection.Dispose()
    }

    return $rows.ToArray()
}

function Get-DatabaseData {
    <#
        .SYNOPSIS
        監視対象の SQL Server から DB 一覧を収集する。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target,

        [Parameter(Mandatory = $true)]
        [psobject] $Setting
    )

    $serverInstance = [string] (Get-ConfigValue -InputObject $Setting -Name 'serverInstance' -Default '.')
    $useIntegrated = [bool] (Get-ConfigValue -InputObject $Setting -Name 'useIntegratedSecurity' -Default $true)
    $connectTimeout = [int] (Get-ConfigValue -InputObject $Setting -Name 'connectTimeoutSeconds' -Default 10)
    $queryTimeout = [int] (Get-ConfigValue -InputObject $Setting -Name 'queryTimeoutSeconds' -Default 30)

    $credential = $null
    if (-not $useIntegrated) {
        $credentialName = [string] (Get-ConfigValue -InputObject $Setting -Name 'credentialName' -Default '')
        $credential = Get-MonitorCredential -Name $credentialName
        if ($null -eq $credential) {
            throw ('SQL 認証の資格情報 "{0}" を取得できません。Install-Credentials.ps1 で登録してください。' -f $credentialName)
        }
    }

    $connectionString = Get-SqlConnectionString -ServerInstance $serverInstance `
        -UseIntegratedSecurity $useIntegrated -Credential $credential `
        -ConnectTimeoutSeconds $connectTimeout

    # ローカル対象なら収集サーバ自身から接続する。リモート対象は対象サーバ上で実行し、
    # そのサーバの Windows 認証で接続させる（ワークグループのため収集側の資格情報は通らない）。
    if (Test-TargetLocal -Target $Target) {
        return @(Invoke-SqlReadQuery -ConnectionString $connectionString -Query $script:DatabaseQuery -QueryTimeoutSeconds $queryTimeout)
    }

    $scriptBlock = {
        param($ConnectionString, $Query, $QueryTimeoutSeconds)

        $connection = New-Object System.Data.SqlClient.SqlConnection $ConnectionString
        $command = $null
        $reader = $null
        $rows = @()
        try {
            $connection.Open()
            $command = $connection.CreateCommand()
            $command.CommandText = $Query
            $command.CommandTimeout = $QueryTimeoutSeconds
            $reader = $command.ExecuteReader()
            while ($reader.Read()) {
                $row = [ordered]@{}
                for ($index = 0; $index -lt $reader.FieldCount; $index++) {
                    $value = $reader.GetValue($index)
                    if ($value -is [System.DBNull]) { $value = $null }
                    $row[$reader.GetName($index)] = $value
                }
                $rows += [pscustomobject] $row
            }
        }
        finally {
            if ($null -ne $reader) { $reader.Dispose() }
            if ($null -ne $command) { $command.Dispose() }
            $connection.Dispose()
        }
        return $rows
    }

    return @(Invoke-MonitorScriptBlock -Target $Target -ScriptBlock $scriptBlock `
            -ArgumentList @($connectionString, $script:DatabaseQuery, $queryTimeout))
}

function Invoke-DatabaseCheck {
    <#
        .SYNOPSIS
        LDF / RCV / DBC チェックを 1 監視対象について実行する。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Target
    )

    $checkId = 'DB'
    $checkName = 'データベース（ログ / 復旧モデル / 照合順序）'
    $targetName = [string] $Target.name

    if (-not (Test-CheckEnabled -Target $Target -CheckKey 'database')) {
        return (New-SkippedCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName)
    }

    $config = Get-TargetCheckConfig -Target $Target -CheckKey 'database'

    try {
        $databases = Get-DatabaseData -Target $Target -Setting $config
    }
    catch {
        return (New-UnknownCheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName -Reason $_.Exception.Message)
    }

    $findings = Get-DatabaseCheckFinding -Database $databases -Setting $config

    $excluded = @(Get-ConfigValue -InputObject $config -Name 'excludeDatabases' -Default @())
    $userDatabases = @($databases | Where-Object { $excluded -notcontains [string] $_.DatabaseName })

    $items = @()
    foreach ($item in $userDatabases) {
        $dataBytes = [double] $item.DataBytes
        $logBytes = [double] $item.LogBytes
        $items += [pscustomobject]@{
            DatabaseName  = [string] $item.DatabaseName
            StateDesc     = [string] $item.StateDesc
            RecoveryModel = [string] $item.RecoveryModel
            CollationName = [string] $item.CollationName
            DataBytes     = $dataBytes
            LogBytes      = $logBytes
            DataText      = Format-MonitorByte -Bytes $dataBytes
            LogText       = Format-MonitorByte -Bytes $logBytes
            LogRatio      = if ($dataBytes -gt 0) { [Math]::Round($logBytes / $dataBytes, 2) } else { $null }
        }
    }

    $summary = 'ユーザー DB {0} 件中 {1} 件に問題があります。' -f $userDatabases.Count, @($findings).Count
    if (@($findings).Count -eq 0) {
        $summary = 'ユーザー DB {0} 件はすべて正常です（ログサイズ / 復旧モデル / 照合順序）。' -f $userDatabases.Count
    }

    $worstRatio = $items | Where-Object { $null -ne $_.LogRatio } | Sort-Object LogRatio -Descending | Select-Object -First 1
    $metrics = [pscustomobject]@{
        DatabaseCount = $userDatabases.Count
        ProblemCount  = @($findings).Count
        MaxLogRatio   = if ($null -ne $worstRatio) { $worstRatio.LogRatio } else { $null }
        TotalLogBytes = ($items | Measure-Object -Property LogBytes -Sum).Sum
    }

    return (New-CheckResult -CheckId $checkId -CheckName $checkName -TargetName $targetName `
            -Summary $summary -Findings $findings -Metrics $metrics -Items $items)
}

Export-ModuleMember -Function @(
    'Get-LogSizeLevel'
    'Get-DatabaseCheckFinding'
    'Get-SqlConnectionString'
    'Invoke-SqlReadQuery'
    'Get-DatabaseData'
    'Invoke-DatabaseCheck'
)
