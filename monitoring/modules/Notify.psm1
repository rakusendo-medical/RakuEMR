#Requires -Version 5.1
<#
    Notify.psm1 — 通知

    設計方針:
      - プッシュ通知が主。ダッシュボードは補助。
      - 正常時も日次サマリを 1 通送る。届かなくなったこと自体が異常の合図になる。
      - 同一事象の再通知は一定間隔に抑える（フラッピングによる通知の洪水を防ぐ）。
      - 解消時にも通知する。
      - 判定ロジック（誰に何を送るか）は外部依存から分離した純粋関数にしてある。
        Get-NotificationPlan / Format-* はモックデータだけで検証できる。
#>

# -Force を付けないこと。付けると呼び出し元セッションに読み込み済みの Common が
# アンロードされ、エントリポイント側から Common の関数が見えなくなる。
Import-Module (Join-Path $PSScriptRoot 'Common.psm1') -DisableNameChecking -ErrorAction Stop

$script:NotificationStateFile = 'notifications.json'

#region ---------- 純粋関数: アラートの組み立てと通知判定 ----------

function ConvertTo-MonitorAlert {
    <#
        .SYNOPSIS
        チェック結果の配列から、通知対象となるアラートの配列を作る。

        .DESCRIPTION
        Key は「対象|チェック ID|検知キー」で構成する。時刻や測定値を含めないため、
        同一事象は実行をまたいで同じ Key になり、再通知抑制と解消判定が成立する。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [psobject[]] $CheckResult
    )

    $alerts = New-Object System.Collections.ArrayList
    foreach ($result in $CheckResult) {
        if ($null -eq $result) { continue }
        foreach ($finding in @($result.Findings)) {
            if ($null -eq $finding) { continue }
            if ($finding.Level -in @('OK', 'Skipped')) { continue }

            $alert = [pscustomobject]@{
                Key        = '{0}|{1}|{2}' -f $result.TargetName, $result.CheckId, $finding.Key
                Scope      = '{0}|{1}' -f $result.TargetName, $result.CheckId
                TargetName = $result.TargetName
                CheckId    = $result.CheckId
                CheckName  = $result.CheckName
                Level      = $finding.Level
                Title      = $finding.Title
                Message    = $finding.Message
                Value      = $finding.Value
            }
            $null = $alerts.Add($alert)
        }
    }

    return , $alerts.ToArray()
}

function Get-EvaluatedScope {
    <#
        .SYNOPSIS
        今回の実行で実際に判定できた「対象|チェック ID」の一覧を返す。

        .DESCRIPTION
        解消判定はこの一覧に含まれる範囲でのみ行う。
        収集に失敗した（Unknown）チェックを「解消」と誤認しないための歯止め。
    #>
    [CmdletBinding()]
    [OutputType([string[]], [object[]])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [psobject[]] $CheckResult
    )

    $scopes = New-Object System.Collections.ArrayList
    foreach ($result in $CheckResult) {
        if ($null -eq $result) { continue }
        if ($result.Status -eq 'Unknown') { continue }
        $scope = '{0}|{1}' -f $result.TargetName, $result.CheckId
        if (-not $scopes.Contains($scope)) { $null = $scopes.Add($scope) }
    }

    return , ([string[]] $scopes.ToArray())
}

function Get-NotificationPlan {
    <#
        .SYNOPSIS
        アラートと前回状態から「今回何を通知するか」を決める。純粋関数。

        .PARAMETER Alert
        今回検知したアラート（ConvertTo-MonitorAlert の出力）。

        .PARAMETER PreviousState
        前回の通知状態。キー = アラート Key、値 = 状態オブジェクト。

        .PARAMETER EvaluatedScope
        今回判定できた「対象|チェック ID」の一覧。解消判定をこの範囲に限定する。

        .OUTPUTS
        New / Renotify / Suppressed / Resolved / NextState を持つオブジェクト。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [AllowNull()]
        [psobject[]] $Alert,

        [Parameter()]
        [AllowNull()]
        [hashtable] $PreviousState,

        [Parameter()]
        [datetime] $Now = (Get-Date),

        [Parameter()]
        [double] $RenotifyIntervalHours = 6,

        [Parameter()]
        [bool] $NotifyOnResolve = $true,

        [Parameter()]
        [ValidateSet('Warning', 'Unknown', 'Critical')]
        [string] $MinimumLevel = 'Warning',

        [Parameter()]
        [AllowNull()]
        [string[]] $EvaluatedScope
    )

    if ($null -eq $PreviousState) { $PreviousState = @{} }
    if ($null -eq $Alert) { $Alert = @() }
    if ($null -eq $EvaluatedScope) { $EvaluatedScope = @() }

    $minimumRank = Get-StatusRank -Status $MinimumLevel

    $newAlerts = New-Object System.Collections.ArrayList
    $renotifyAlerts = New-Object System.Collections.ArrayList
    $suppressedAlerts = New-Object System.Collections.ArrayList
    $resolvedAlerts = New-Object System.Collections.ArrayList
    $nextState = @{}

    $activeKeys = @{}

    foreach ($item in $Alert) {
        if ($null -eq $item) { continue }
        if ((Get-StatusRank -Status $item.Level) -lt $minimumRank) { continue }
        $activeKeys[$item.Key] = $true

        $previous = $null
        if ($PreviousState.ContainsKey($item.Key)) { $previous = $PreviousState[$item.Key] }

        $entry = [pscustomobject]@{
            key             = $item.Key
            scope           = $item.Scope
            target          = $item.TargetName
            checkId         = $item.CheckId
            checkName       = $item.CheckName
            level           = $item.Level
            title           = $item.Title
            message         = $item.Message
            firstDetectedOn = $Now.ToString('o')
            lastDetectedOn  = $Now.ToString('o')
            lastNotifiedOn  = $null
            notifyCount     = 0
            externalRef     = $null
        }

        if ($null -eq $previous) {
            # 初回検知 → 即時通知
            $entry.lastNotifiedOn = $Now.ToString('o')
            $entry.notifyCount = 1
            $null = $newAlerts.Add($item)
            $nextState[$item.Key] = $entry
            continue
        }

        $entry.firstDetectedOn = [string] (Get-ConfigValue -InputObject $previous -Name 'firstDetectedOn' -Default $entry.firstDetectedOn)
        $entry.notifyCount = [int] (Get-ConfigValue -InputObject $previous -Name 'notifyCount' -Default 0)
        $entry.externalRef = Get-ConfigValue -InputObject $previous -Name 'externalRef'
        $previousLevel = [string] (Get-ConfigValue -InputObject $previous -Name 'level' -Default 'Warning')
        $previousNotifiedRaw = Get-ConfigValue -InputObject $previous -Name 'lastNotifiedOn'
        $entry.lastNotifiedOn = $previousNotifiedRaw

        $escalated = (Get-StatusRank -Status $item.Level) -gt (Get-StatusRank -Status $previousLevel)

        $intervalElapsed = $true
        if (-not [string]::IsNullOrWhiteSpace([string] $previousNotifiedRaw)) {
            $lastNotified = [datetime]::Parse([string] $previousNotifiedRaw, [System.Globalization.CultureInfo]::InvariantCulture)
            $intervalElapsed = ($Now - $lastNotified).TotalHours -ge $RenotifyIntervalHours
        }

        if ($escalated -or $intervalElapsed) {
            # 深刻度が上がった場合は抑制間隔を待たずに通知する。
            $entry.lastNotifiedOn = $Now.ToString('o')
            $entry.notifyCount = $entry.notifyCount + 1
            $null = $renotifyAlerts.Add($item)
        }
        else {
            $null = $suppressedAlerts.Add($item)
        }

        $nextState[$item.Key] = $entry
    }

    # 解消判定。今回判定できたスコープに限る。
    foreach ($key in $PreviousState.Keys) {
        if ($activeKeys.ContainsKey($key)) { continue }

        $previous = $PreviousState[$key]
        $scope = [string] (Get-ConfigValue -InputObject $previous -Name 'scope' -Default '')

        if ($EvaluatedScope -notcontains $scope) {
            # 収集できていない範囲のアラートは解消扱いにせず、状態をそのまま持ち越す。
            $nextState[$key] = $previous
            continue
        }

        if ($NotifyOnResolve) {
            $resolved = [pscustomobject]@{
                Key             = $key
                Scope           = $scope
                TargetName      = [string] (Get-ConfigValue -InputObject $previous -Name 'target' -Default '')
                CheckId         = [string] (Get-ConfigValue -InputObject $previous -Name 'checkId' -Default '')
                CheckName       = [string] (Get-ConfigValue -InputObject $previous -Name 'checkName' -Default '')
                Level           = 'OK'
                Title           = [string] (Get-ConfigValue -InputObject $previous -Name 'title' -Default '')
                Message         = [string] (Get-ConfigValue -InputObject $previous -Name 'message' -Default '')
                FirstDetectedOn = [string] (Get-ConfigValue -InputObject $previous -Name 'firstDetectedOn' -Default '')
                ExternalRef     = Get-ConfigValue -InputObject $previous -Name 'externalRef'
            }
            $null = $resolvedAlerts.Add($resolved)
        }
        # 解消したものは次回状態から落とす。
    }

    # ハッシュテーブルのメンバー代入ではパイプラインの展開が起きないため、
    # 単項カンマ（配列化）を付けてはならない。付けると配列が二重にネストする。
    return [pscustomobject]@{
        New        = $newAlerts.ToArray()
        Renotify   = $renotifyAlerts.ToArray()
        Suppressed = $suppressedAlerts.ToArray()
        Resolved   = $resolvedAlerts.ToArray()
        NextState  = $nextState
    }
}

function Format-AlertBody {
    <#
        .SYNOPSIS
        異常通知の本文（プレーンテキスト）を組み立てる。純粋関数。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter()]
        [AllowNull()]
        [psobject[]] $Alert = @(),

        [Parameter()]
        [AllowNull()]
        [psobject[]] $Resolved = @(),

        [Parameter()]
        [int] $MaxItems = 50,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    $builder = New-Object System.Text.StringBuilder
    $null = $builder.AppendLine(('検知時刻: {0}' -f $Now.ToString('yyyy-MM-dd HH:mm:ss')))
    $null = $builder.AppendLine(('実行ホスト: {0}' -f $env:COMPUTERNAME))
    $null = $builder.AppendLine()

    $alertList = @($Alert | Where-Object { $null -ne $_ })
    if ($alertList.Count -gt 0) {
        $null = $builder.AppendLine(('■ 異常 ({0} 件)' -f $alertList.Count))
        $null = $builder.AppendLine(('-' * 60))

        $shown = 0
        foreach ($item in ($alertList | Sort-Object @{ Expression = { Get-StatusRank -Status $_.Level } } -Descending)) {
            if ($shown -ge $MaxItems) { break }
            $null = $builder.AppendLine(('[{0}] {1} / {2}' -f $item.Level, $item.TargetName, $item.CheckName))
            $null = $builder.AppendLine(('  {0}' -f $item.Title))
            if (-not [string]::IsNullOrWhiteSpace([string] $item.Message)) {
                $null = $builder.AppendLine(('  {0}' -f $item.Message))
            }
            $null = $builder.AppendLine()
            $shown++
        }
        if ($alertList.Count -gt $MaxItems) {
            $null = $builder.AppendLine(('... 他 {0} 件（本文の掲載上限を超えたため省略）' -f ($alertList.Count - $MaxItems)))
            $null = $builder.AppendLine()
        }
    }

    $resolvedList = @($Resolved | Where-Object { $null -ne $_ })
    if ($resolvedList.Count -gt 0) {
        $null = $builder.AppendLine(('■ 解消 ({0} 件)' -f $resolvedList.Count))
        $null = $builder.AppendLine(('-' * 60))
        foreach ($item in $resolvedList) {
            $null = $builder.AppendLine(('[解消] {0} / {1}' -f $item.TargetName, $item.CheckName))
            $null = $builder.AppendLine(('  {0}' -f $item.Title))
            if (-not [string]::IsNullOrWhiteSpace([string] $item.FirstDetectedOn)) {
                $null = $builder.AppendLine(('  初回検知: {0}' -f $item.FirstDetectedOn))
            }
            $null = $builder.AppendLine()
        }
    }

    return $builder.ToString()
}

function Format-AlertSubject {
    <#
        .SYNOPSIS
        異常通知の件名を組み立てる。純粋関数。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter()]
        [AllowNull()]
        [psobject[]] $Alert = @(),

        [Parameter()]
        [AllowNull()]
        [psobject[]] $Resolved = @(),

        [Parameter()]
        [string] $Prefix = '[監視]'
    )

    $alertList = @($Alert | Where-Object { $null -ne $_ })
    $resolvedList = @($Resolved | Where-Object { $null -ne $_ })

    if ($alertList.Count -eq 0 -and $resolvedList.Count -gt 0) {
        return ('{0} 解消 {1} 件' -f $Prefix, $resolvedList.Count)
    }

    $worst = Get-WorstStatus -Status @($alertList | ForEach-Object { $_.Level })
    $targets = @($alertList | ForEach-Object { $_.TargetName } | Select-Object -Unique)
    $targetText = if ($targets.Count -eq 1) { $targets[0] } else { ('{0} 台' -f $targets.Count) }

    $subject = '{0} {1} {2} 異常 {3} 件' -f $Prefix, $worst, $targetText, $alertList.Count
    if ($resolvedList.Count -gt 0) {
        $subject = '{0} / 解消 {1} 件' -f $subject, $resolvedList.Count
    }
    return $subject
}

function Format-DailySummaryBody {
    <#
        .SYNOPSIS
        日次サマリの本文（プレーンテキスト）を組み立てる。純粋関数。

        .DESCRIPTION
        異常がゼロでも送る。届かないこと自体が「監視が止まっている」合図になる。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter()]
        [AllowNull()]
        [psobject[]] $CheckResult = @(),

        [Parameter()]
        [AllowNull()]
        [psobject[]] $OpenAlert = @(),

        [Parameter()]
        [datetime] $Now = (Get-Date),

        [Parameter()]
        [bool] $IncludeAllChecks = $true
    )

    $results = @($CheckResult | Where-Object { $null -ne $_ })
    $openList = @($OpenAlert | Where-Object { $null -ne $_ })

    $overall = Get-WorstStatus -Status @($results | ForEach-Object { $_.Status })

    $builder = New-Object System.Text.StringBuilder
    $null = $builder.AppendLine(('日次サマリ  {0}' -f $Now.ToString('yyyy-MM-dd HH:mm:ss')))
    $null = $builder.AppendLine(('実行ホスト: {0}' -f $env:COMPUTERNAME))
    $null = $builder.AppendLine(('総合判定  : {0}' -f $overall))
    $null = $builder.AppendLine()

    $null = $builder.AppendLine('■ サーバ別サマリ')
    $null = $builder.AppendLine(('-' * 60))
    foreach ($group in ($results | Group-Object -Property TargetName | Sort-Object Name)) {
        $status = Get-WorstStatus -Status @($group.Group | ForEach-Object { $_.Status })
        $counts = @{}
        foreach ($item in $group.Group) {
            if (-not $counts.ContainsKey($item.Status)) { $counts[$item.Status] = 0 }
            $counts[$item.Status] = $counts[$item.Status] + 1
        }
        $countText = (@('Critical', 'Unknown', 'Warning', 'Skipped', 'OK') |
                Where-Object { $counts.ContainsKey($_) } |
                ForEach-Object { '{0}={1}' -f $_, $counts[$_] }) -join ' '
        $null = $builder.AppendLine(('{0,-14} {1,-9} {2}' -f $group.Name, $status, $countText))
    }
    $null = $builder.AppendLine()

    if ($IncludeAllChecks) {
        $null = $builder.AppendLine('■ 全チェックの判定結果')
        $null = $builder.AppendLine(('-' * 60))
        foreach ($item in ($results | Sort-Object TargetName, CheckId)) {
            $null = $builder.AppendLine(('{0,-14} {1,-4} {2,-9} {3}' -f `
                        $item.TargetName, $item.CheckId, $item.Status, $item.Summary))
        }
        $null = $builder.AppendLine()
    }

    $null = $builder.AppendLine(('■ 未解消の異常 ({0} 件)' -f $openList.Count))
    $null = $builder.AppendLine(('-' * 60))
    if ($openList.Count -eq 0) {
        $null = $builder.AppendLine('なし')
    }
    else {
        foreach ($item in ($openList | Sort-Object @{ Expression = { Get-StatusRank -Status $_.level } } -Descending)) {
            $null = $builder.AppendLine(('[{0}] {1} / {2} : {3}' -f `
                        $item.level, $item.target, $item.checkName, $item.title))
            $null = $builder.AppendLine(('  初回検知: {0}  通知回数: {1}' -f $item.firstDetectedOn, $item.notifyCount))
        }
    }
    $null = $builder.AppendLine()
    $null = $builder.AppendLine('※ このメールは異常の有無にかかわらず毎日送信されます。')
    $null = $builder.AppendLine('　 届かない日があれば、監視ツール自体が停止している可能性があります。')

    return $builder.ToString()
}

#endregion

#region ---------- 送信経路 ----------

function Send-SmtpMessage {
    <#
        .SYNOPSIS
        SMTP でメールを送信する。

        .DESCRIPTION
        Send-MailMessage は非推奨のため System.Net.Mail.SmtpClient を直接使う。
        本文・件名は UTF-8 で送る。
    #>
    [CmdletBinding(SupportsShouldProcess = $true)]
    [OutputType([bool])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $SmtpConfig,

        [Parameter(Mandatory = $true)]
        [string] $Subject,

        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $Body
    )

    $server = [string] (Get-ConfigValue -InputObject $SmtpConfig -Name 'server' -Default '')
    $from = [string] (Get-ConfigValue -InputObject $SmtpConfig -Name 'from' -Default '')
    $recipients = @(Get-ConfigValue -InputObject $SmtpConfig -Name 'to' -Default @())

    if ([string]::IsNullOrWhiteSpace($server) -or [string]::IsNullOrWhiteSpace($from) -or $recipients.Count -eq 0) {
        Write-MonitorLog -Level 'Error' -Category 'notify' -Message 'SMTP 設定が不足しています（server / from / to）。通知を送信できません。'
        return $false
    }

    if (-not $PSCmdlet.ShouldProcess(($recipients -join ', '), ('メール送信: {0}' -f $Subject))) { return $true }

    $client = $null
    $message = $null
    try {
        $client = New-Object System.Net.Mail.SmtpClient($server, [int] (Get-ConfigValue -InputObject $SmtpConfig -Name 'port' -Default 25))
        $client.EnableSsl = [bool] (Get-ConfigValue -InputObject $SmtpConfig -Name 'useSsl' -Default $false)
        $client.Timeout = 1000 * [int] (Get-ConfigValue -InputObject $SmtpConfig -Name 'timeoutSeconds' -Default 30)

        if ([bool] (Get-ConfigValue -InputObject $SmtpConfig -Name 'useCredential' -Default $false)) {
            $credentialName = [string] (Get-ConfigValue -InputObject $SmtpConfig -Name 'credentialName' -Default '')
            $credential = Get-MonitorCredential -Name $credentialName
            if ($null -eq $credential) {
                Write-MonitorLog -Level 'Error' -Category 'notify' -Message ('SMTP 資格情報 "{0}" を取得できません。' -f $credentialName)
                return $false
            }
            $client.Credentials = $credential.GetNetworkCredential()
        }

        $encoding = New-Object System.Text.UTF8Encoding($false)
        $message = New-Object System.Net.Mail.MailMessage
        $message.From = New-Object System.Net.Mail.MailAddress($from)
        foreach ($recipient in $recipients) {
            if (-not [string]::IsNullOrWhiteSpace([string] $recipient)) { $message.To.Add([string] $recipient) }
        }
        $message.Subject = $Subject
        $message.SubjectEncoding = $encoding
        $message.Body = $Body
        $message.BodyEncoding = $encoding
        $message.IsBodyHtml = $false

        $client.Send($message)
        Write-MonitorLog -Category 'notify' -Message ('メールを送信しました: {0}' -f $Subject)
        return $true
    }
    catch {
        Write-MonitorLog -Level 'Error' -Category 'notify' -Message ('メール送信に失敗しました: {0}' -f $_.Exception.Message)
        return $false
    }
    finally {
        if ($null -ne $message) { $message.Dispose() }
        if ($null -ne $client) { $client.Dispose() }
    }
}

function Get-BacklogProjectId {
    <#
        .SYNOPSIS
        Backlog のプロジェクトキーから数値のプロジェクト ID を取得する。
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $BacklogConfig,

        [Parameter(Mandatory = $true)]
        [string] $ApiKey
    )

    $spaceUrl = ([string] (Get-ConfigValue -InputObject $BacklogConfig -Name 'spaceUrl' -Default '')).TrimEnd('/')
    $projectKey = [string] (Get-ConfigValue -InputObject $BacklogConfig -Name 'projectKey' -Default '')
    $timeout = [int] (Get-ConfigValue -InputObject $BacklogConfig -Name 'timeoutSeconds' -Default 30)

    $uri = '{0}/api/v2/projects/{1}?apiKey={2}' -f $spaceUrl, [uri]::EscapeDataString($projectKey), [uri]::EscapeDataString($ApiKey)
    $response = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec $timeout -ErrorAction Stop
    return $response.id
}

function Send-BacklogIssue {
    <#
        .SYNOPSIS
        Backlog に課題を起票する。課題キーを返す。失敗時は $null。
    #>
    [CmdletBinding(SupportsShouldProcess = $true)]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $BacklogConfig,

        [Parameter(Mandatory = $true)]
        [string] $Summary,

        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $Description,

        [Parameter()]
        [string] $Level = 'Warning'
    )

    $spaceUrl = ([string] (Get-ConfigValue -InputObject $BacklogConfig -Name 'spaceUrl' -Default '')).TrimEnd('/')
    $apiKeyName = [string] (Get-ConfigValue -InputObject $BacklogConfig -Name 'apiKeyCredentialName' -Default 'backlog')
    $issueTypeId = [int] (Get-ConfigValue -InputObject $BacklogConfig -Name 'issueTypeId' -Default 0)
    $timeout = [int] (Get-ConfigValue -InputObject $BacklogConfig -Name 'timeoutSeconds' -Default 30)

    $priorityId = [int] (Get-ConfigValue -InputObject $BacklogConfig -Name 'priorityId' -Default 3)
    if ($Level -in @('Critical', 'Unknown')) {
        $priorityId = [int] (Get-ConfigValue -InputObject $BacklogConfig -Name 'criticalPriorityId' -Default $priorityId)
    }

    if ([string]::IsNullOrWhiteSpace($spaceUrl) -or $issueTypeId -le 0) {
        Write-MonitorLog -Level 'Error' -Category 'notify' -Message 'Backlog 設定が不足しています（spaceUrl / issueTypeId）。'
        return $null
    }

    $apiKey = Get-MonitorSecretText -Name $apiKeyName
    if ([string]::IsNullOrWhiteSpace($apiKey)) {
        Write-MonitorLog -Level 'Error' -Category 'notify' -Message ('Backlog API キー "{0}" を取得できません。' -f $apiKeyName)
        return $null
    }

    if (-not $PSCmdlet.ShouldProcess($spaceUrl, ('Backlog 課題の起票: {0}' -f $Summary))) { return $null }

    try {
        $projectId = Get-BacklogProjectId -BacklogConfig $BacklogConfig -ApiKey $apiKey

        $body = @{
            projectId   = $projectId
            summary     = $Summary
            issueTypeId = $issueTypeId
            priorityId  = $priorityId
            description = $Description
        }
        $assigneeId = Get-ConfigValue -InputObject $BacklogConfig -Name 'assigneeId'
        if ($null -ne $assigneeId) { $body['assigneeId'] = [int] $assigneeId }

        $uri = '{0}/api/v2/issues?apiKey={1}' -f $spaceUrl, [uri]::EscapeDataString($apiKey)
        $response = Invoke-RestMethod -Uri $uri -Method Post -Body $body -TimeoutSec $timeout `
            -ContentType 'application/x-www-form-urlencoded' -ErrorAction Stop

        Write-MonitorLog -Category 'notify' -Message ('Backlog に起票しました: {0} ({1})' -f $response.issueKey, $Summary)
        return [string] $response.issueKey
    }
    catch {
        Write-MonitorLog -Level 'Error' -Category 'notify' -Message ('Backlog への起票に失敗しました: {0}' -f $_.Exception.Message)
        return $null
    }
}

function Add-BacklogComment {
    <#
        .SYNOPSIS
        既存の Backlog 課題にコメントを追加する。
    #>
    [CmdletBinding(SupportsShouldProcess = $true)]
    [OutputType([bool])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $BacklogConfig,

        [Parameter(Mandatory = $true)]
        [string] $IssueKey,

        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $Content
    )

    $spaceUrl = ([string] (Get-ConfigValue -InputObject $BacklogConfig -Name 'spaceUrl' -Default '')).TrimEnd('/')
    $apiKeyName = [string] (Get-ConfigValue -InputObject $BacklogConfig -Name 'apiKeyCredentialName' -Default 'backlog')
    $timeout = [int] (Get-ConfigValue -InputObject $BacklogConfig -Name 'timeoutSeconds' -Default 30)

    $apiKey = Get-MonitorSecretText -Name $apiKeyName
    if ([string]::IsNullOrWhiteSpace($apiKey)) { return $false }

    if (-not $PSCmdlet.ShouldProcess($IssueKey, 'Backlog コメントの追加')) { return $true }

    try {
        $uri = '{0}/api/v2/issues/{1}/comments?apiKey={2}' -f `
            $spaceUrl, [uri]::EscapeDataString($IssueKey), [uri]::EscapeDataString($apiKey)
        $null = Invoke-RestMethod -Uri $uri -Method Post -Body @{ content = $Content } -TimeoutSec $timeout `
            -ContentType 'application/x-www-form-urlencoded' -ErrorAction Stop
        Write-MonitorLog -Category 'notify' -Message ('Backlog 課題 {0} にコメントを追加しました。' -f $IssueKey)
        return $true
    }
    catch {
        Write-MonitorLog -Level 'Error' -Category 'notify' -Message (
            'Backlog 課題 {0} へのコメント追加に失敗しました: {1}' -f $IssueKey, $_.Exception.Message)
        return $false
    }
}

function Send-MonitorMessage {
    <#
        .SYNOPSIS
        設定された経路（SMTP / Backlog / none）で 1 通のメッセージを送る。

        .DESCRIPTION
        日次サマリのように「1 件のまとまった通知」を送る用途で使う。
    #>
    [CmdletBinding(SupportsShouldProcess = $true)]
    [OutputType([bool])]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $NotificationConfig,

        [Parameter(Mandatory = $true)]
        [string] $Subject,

        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $Body,

        [Parameter()]
        [string] $Level = 'Warning'
    )

    if (-not [bool] (Get-ConfigValue -InputObject $NotificationConfig -Name 'enabled' -Default $true)) {
        Write-MonitorLog -Level 'Warn' -Category 'notify' -Message ('通知が無効化されているため送信しません: {0}' -f $Subject)
        return $false
    }

    $channel = [string] (Get-ConfigValue -InputObject $NotificationConfig -Name 'channel' -Default 'smtp')
    if (-not $PSCmdlet.ShouldProcess($channel, ('通知送信: {0}' -f $Subject))) { return $true }

    switch ($channel) {
        'smtp' {
            $smtp = Get-ConfigValue -InputObject $NotificationConfig -Name 'smtp'
            return (Send-SmtpMessage -SmtpConfig $smtp -Subject $Subject -Body $Body -Confirm:$false)
        }
        'backlog' {
            $backlog = Get-ConfigValue -InputObject $NotificationConfig -Name 'backlog'
            $issueKey = Send-BacklogIssue -BacklogConfig $backlog -Summary $Subject -Description $Body -Level $Level -Confirm:$false
            return ($null -ne $issueKey)
        }
        'none' {
            Write-MonitorLog -Category 'notify' -Message ('通知経路が none のため送信しません: {0}' -f $Subject)
            return $true
        }
        default {
            Write-MonitorLog -Level 'Error' -Category 'notify' -Message ('未知の通知経路です: {0}' -f $channel)
            return $false
        }
    }
}

#endregion

#region ---------- 状態管理と実行 ----------

function Get-NotificationState {
    <#
        .SYNOPSIS
        通知状態（アラートごとの初回検知・最終通知時刻）を読み込む。
    #>
    [CmdletBinding()]
    [OutputType([hashtable])]
    param()

    $state = Read-MonitorState -Name $script:NotificationStateFile
    if ($null -eq $state) { return @{} }

    $alerts = Get-ConfigValue -InputObject $state -Name 'alerts'
    if ($null -eq $alerts) { return @{} }

    return (ConvertTo-MonitorHashtable -InputObject $alerts)
}

function Save-NotificationState {
    <#
        .SYNOPSIS
        通知状態を保存する。
    #>
    [CmdletBinding(SupportsShouldProcess = $true)]
    param(
        [Parameter(Mandatory = $true)]
        [AllowNull()]
        [hashtable] $State
    )

    if (-not $PSCmdlet.ShouldProcess($script:NotificationStateFile, '通知状態の保存')) { return }

    $payload = [pscustomobject]@{
        updatedOn = (Get-Date).ToString('o')
        alerts    = [pscustomobject] ($State)
    }
    Save-MonitorState -Name $script:NotificationStateFile -InputObject $payload -Confirm:$false
}

function Publish-MonitorAlert {
    <#
        .SYNOPSIS
        チェック結果を受け取り、通知判定 → 送信 → 状態保存までを行う。

        .DESCRIPTION
        SMTP の場合はまとめて 1 通。Backlog の場合はアラートごとに課題を起票し、
        継続・解消は同じ課題へのコメントとして残す（対応履歴が 1 か所にまとまる）。

        .OUTPUTS
        通知計画（Get-NotificationPlan の結果）。
    #>
    [CmdletBinding(SupportsShouldProcess = $true)]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [psobject[]] $CheckResult,

        [Parameter(Mandatory = $true)]
        [psobject] $NotificationConfig,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    $alerts = ConvertTo-MonitorAlert -CheckResult $CheckResult
    $scopes = Get-EvaluatedScope -CheckResult $CheckResult
    $previousState = Get-NotificationState

    $plan = Get-NotificationPlan -Alert $alerts -PreviousState $previousState -Now $Now `
        -RenotifyIntervalHours ([double] (Get-ConfigValue -InputObject $NotificationConfig -Name 'renotifyIntervalHours' -Default 6)) `
        -NotifyOnResolve ([bool] (Get-ConfigValue -InputObject $NotificationConfig -Name 'notifyOnResolve' -Default $true)) `
        -MinimumLevel ([string] (Get-ConfigValue -InputObject $NotificationConfig -Name 'minimumLevel' -Default 'Warning')) `
        -EvaluatedScope $scopes

    Write-MonitorLog -Category 'notify' -Message (
        '通知判定: 新規 {0} / 再通知 {1} / 抑制 {2} / 解消 {3}' -f `
            $plan.New.Count, $plan.Renotify.Count, $plan.Suppressed.Count, $plan.Resolved.Count)

    if (-not $PSCmdlet.ShouldProcess('通知', '送信')) { return $plan }

    $toNotify = @($plan.New) + @($plan.Renotify)
    $channel = [string] (Get-ConfigValue -InputObject $NotificationConfig -Name 'channel' -Default 'smtp')

    if ($channel -eq 'backlog') {
        Publish-BacklogAlert -Plan $plan -NotificationConfig $NotificationConfig -Now $Now -Confirm:$false
    }
    elseif ($toNotify.Count -gt 0 -or $plan.Resolved.Count -gt 0) {
        $prefix = [string] (Get-ConfigValue -InputObject $NotificationConfig -Name 'subjectPrefix' -Default '[監視]')
        $maxItems = [int] (Get-ConfigValue -InputObject $NotificationConfig -Name 'maxFindingsPerMail' -Default 50)

        $subject = Format-AlertSubject -Alert $toNotify -Resolved $plan.Resolved -Prefix $prefix
        $body = Format-AlertBody -Alert $toNotify -Resolved $plan.Resolved -MaxItems $maxItems -Now $Now
        $level = Get-WorstStatus -Status @($toNotify | ForEach-Object { $_.Level })

        $null = Send-MonitorMessage -NotificationConfig $NotificationConfig -Subject $subject -Body $body -Level $level -Confirm:$false
    }

    Save-NotificationState -State $plan.NextState -Confirm:$false
    return $plan
}

function Publish-BacklogAlert {
    <#
        .SYNOPSIS
        Backlog 経路でアラートを起票 / コメントする。
    #>
    [CmdletBinding(SupportsShouldProcess = $true)]
    param(
        [Parameter(Mandatory = $true)]
        [psobject] $Plan,

        [Parameter(Mandatory = $true)]
        [psobject] $NotificationConfig,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    if (-not $PSCmdlet.ShouldProcess('Backlog', 'アラートの起票 / コメント')) { return }

    $backlog = Get-ConfigValue -InputObject $NotificationConfig -Name 'backlog'
    $prefix = [string] (Get-ConfigValue -InputObject $NotificationConfig -Name 'subjectPrefix' -Default '[監視]')

    foreach ($item in @($Plan.New)) {
        $summary = '{0} {1} {2} / {3}: {4}' -f $prefix, $item.Level, $item.TargetName, $item.CheckName, $item.Title
        $description = Format-AlertBody -Alert @($item) -Now $Now
        $issueKey = Send-BacklogIssue -BacklogConfig $backlog -Summary $summary -Description $description -Level $item.Level -Confirm:$false
        if ($null -ne $issueKey -and $Plan.NextState.ContainsKey($item.Key)) {
            $Plan.NextState[$item.Key].externalRef = $issueKey
        }
    }

    foreach ($item in @($Plan.Renotify)) {
        $entry = $null
        if ($Plan.NextState.ContainsKey($item.Key)) { $entry = $Plan.NextState[$item.Key] }
        $issueKey = [string] (Get-ConfigValue -InputObject $entry -Name 'externalRef' -Default '')

        if ([string]::IsNullOrWhiteSpace($issueKey)) {
            # 起票済みの課題が見つからない場合は改めて起票する。
            $summary = '{0} {1} {2} / {3}: {4}' -f $prefix, $item.Level, $item.TargetName, $item.CheckName, $item.Title
            $newKey = Send-BacklogIssue -BacklogConfig $backlog -Summary $summary `
                -Description (Format-AlertBody -Alert @($item) -Now $Now) -Level $item.Level -Confirm:$false
            if ($null -ne $newKey -and $null -ne $entry) { $entry.externalRef = $newKey }
            continue
        }

        $content = '継続中 ({0}){1}{1}{2}' -f `
            $Now.ToString('yyyy-MM-dd HH:mm:ss'), [Environment]::NewLine, (Format-AlertBody -Alert @($item) -Now $Now)
        $null = Add-BacklogComment -BacklogConfig $backlog -IssueKey $issueKey -Content $content -Confirm:$false
    }

    foreach ($item in @($Plan.Resolved)) {
        $issueKey = [string] $item.ExternalRef
        if ([string]::IsNullOrWhiteSpace($issueKey)) { continue }
        $content = '解消しました ({0}){1}{2}' -f $Now.ToString('yyyy-MM-dd HH:mm:ss'), [Environment]::NewLine, $item.Title
        $null = Add-BacklogComment -BacklogConfig $backlog -IssueKey $issueKey -Content $content -Confirm:$false
    }
}

function Publish-MonitorDailySummary {
    <#
        .SYNOPSIS
        日次サマリを 1 通送る。異常がゼロでも送る。
    #>
    [CmdletBinding(SupportsShouldProcess = $true)]
    [OutputType([bool])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [psobject[]] $CheckResult,

        [Parameter(Mandatory = $true)]
        [psobject] $NotificationConfig,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    $summaryConfig = Get-ConfigValue -InputObject $NotificationConfig -Name 'dailySummary'
    if (-not [bool] (Get-ConfigValue -InputObject $summaryConfig -Name 'enabled' -Default $true)) {
        Write-MonitorLog -Level 'Warn' -Category 'notify' -Message '日次サマリが無効化されています。監視ツール自体の停止に気づけなくなるため、無効化は推奨しません。'
        return $false
    }

    if (-not $PSCmdlet.ShouldProcess('日次サマリ', '送信')) { return $true }

    $openAlerts = @()
    $state = Get-NotificationState
    foreach ($key in $state.Keys) { $openAlerts += $state[$key] }

    $results = @($CheckResult | Where-Object { $null -ne $_ })
    $overall = Get-WorstStatus -Status @($results | ForEach-Object { $_.Status })
    $prefix = [string] (Get-ConfigValue -InputObject $NotificationConfig -Name 'subjectPrefix' -Default '[監視]')

    $subject = '{0} 日次サマリ {1} 総合={2} 未解消={3}件' -f `
        $prefix, $Now.ToString('yyyy-MM-dd'), $overall, $openAlerts.Count
    $body = Format-DailySummaryBody -CheckResult $results -OpenAlert $openAlerts -Now $Now `
        -IncludeAllChecks ([bool] (Get-ConfigValue -InputObject $summaryConfig -Name 'includeAllChecks' -Default $true))

    return (Send-MonitorMessage -NotificationConfig $NotificationConfig -Subject $subject -Body $body -Level $overall -Confirm:$false)
}

#endregion

Export-ModuleMember -Function @(
    'ConvertTo-MonitorAlert'
    'Get-EvaluatedScope'
    'Get-NotificationPlan'
    'Format-AlertBody'
    'Format-AlertSubject'
    'Format-DailySummaryBody'
    'Send-SmtpMessage'
    'Get-BacklogProjectId'
    'Send-BacklogIssue'
    'Add-BacklogComment'
    'Send-MonitorMessage'
    'Get-NotificationState'
    'Save-NotificationState'
    'Publish-MonitorAlert'
    'Publish-BacklogAlert'
    'Publish-MonitorDailySummary'
)
