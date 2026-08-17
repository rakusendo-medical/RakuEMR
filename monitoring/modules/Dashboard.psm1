#Requires -Version 5.1
<#
    Dashboard.psm1 — 単一 HTML のダッシュボード生成

    ダッシュボードは補助である。異常に気づくための主経路はあくまで通知であり、
    この画面が無くても運用が成立するようにしてある。

    制約:
      - 外部 CDN を一切参照しない。CSS は埋め込み、グラフは SVG を自前で描く
      - 単一ファイル。共有フォルダに置いてブラウザで開くだけで見られる
      - 履歴はローカルの JSON（state/history.json）に保存する。DB は使わない
#>

Import-Module (Join-Path $PSScriptRoot 'Common.psm1') -DisableNameChecking -ErrorAction Stop

$script:HistoryStateFile = 'history.json'

# 信号色。緑 / 黄 / 赤に加え、Unknown（収集できていない）と Skipped を区別する。
$script:StatusPalette = @{
    'OK'       = @{ Color = '#1a7f37'; Background = '#dafbe1'; Label = '正常' }
    'Warning'  = @{ Color = '#9a6700'; Background = '#fff8c5'; Label = '警告' }
    'Critical' = @{ Color = '#b42318'; Background = '#ffebe9'; Label = '危険' }
    'Unknown'  = @{ Color = '#6639ba'; Background = '#f3eefc'; Label = '不明' }
    'Skipped'  = @{ Color = '#59636e'; Background = '#f0f2f4'; Label = '対象外' }
}

#region ---------- 履歴 ----------

function Get-MonitorHistory {
    <#
        .SYNOPSIS
        履歴（直近数日分のサンプル）を読み込む。
    #>
    [CmdletBinding()]
    [OutputType([object[]])]
    param()

    $state = Read-MonitorState -Name $script:HistoryStateFile
    if ($null -eq $state) { return @() }
    return @(Get-ConfigValue -InputObject $state -Name 'samples' -Default @())
}

function Add-MonitorHistorySample {
    <#
        .SYNOPSIS
        今回の結果を履歴に 1 サンプル追加し、保持期間を超えた分を捨てる。

        .DESCRIPTION
        折れ線に必要な最小限の数値だけを保存する。全チェック結果をそのまま
        貯めると JSON が肥大するため。
    #>
    [CmdletBinding(SupportsShouldProcess = $true)]
    [OutputType([object[]])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [psobject[]] $CheckResult,

        [Parameter()]
        [int] $HistoryDays = 7,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    $targets = [ordered]@{}
    foreach ($group in (@($CheckResult | Where-Object { $null -ne $_ }) | Group-Object -Property TargetName)) {
        $status = Get-WorstStatus -Status @($group.Group | ForEach-Object { $_.Status })

        $disk = $group.Group | Where-Object { $_.CheckId -eq 'DSK' } | Select-Object -First 1
        $resource = $group.Group | Where-Object { $_.CheckId -eq 'RES' } | Select-Object -First 1
        $hardware = $group.Group | Where-Object { $_.CheckId -eq 'HW' } | Select-Object -First 1

        $targets[$group.Name] = [pscustomobject]@{
            status         = $status
            statusRank     = Get-StatusRank -Status $status
            minFreePercent = if ($null -ne $disk) { Get-ConfigValue -InputObject $disk.Metrics -Name 'MinFreePercent' } else { $null }
            cpuPercent     = if ($null -ne $resource) { Get-ConfigValue -InputObject $resource.Metrics -Name 'CpuPercent' } else { $null }
            memoryPercent  = if ($null -ne $resource) { Get-ConfigValue -InputObject $resource.Metrics -Name 'MemoryPercent' } else { $null }
            maxTemperature = if ($null -ne $hardware) { Get-ConfigValue -InputObject $hardware.Metrics -Name 'MaxTemperature' } else { $null }
        }
    }

    $sample = [pscustomobject]@{
        timestamp = $Now.ToString('o')
        targets   = [pscustomobject] $targets
    }

    $limit = $Now.AddDays(-1 * $HistoryDays)
    $samples = New-Object System.Collections.ArrayList
    foreach ($existing in (Get-MonitorHistory)) {
        $raw = [string] (Get-ConfigValue -InputObject $existing -Name 'timestamp' -Default '')
        if ([string]::IsNullOrWhiteSpace($raw)) { continue }
        $parsed = [datetime]::MinValue
        if (-not [datetime]::TryParse($raw, [ref] $parsed)) { continue }
        if ($parsed -lt $limit) { continue }
        $null = $samples.Add($existing)
    }
    $null = $samples.Add($sample)

    if ($PSCmdlet.ShouldProcess($script:HistoryStateFile, '履歴の保存')) {
        Save-MonitorState -Name $script:HistoryStateFile -InputObject ([pscustomobject]@{
                updatedOn = $Now.ToString('o')
                samples   = $samples.ToArray()
            }) -Confirm:$false
    }

    return $samples.ToArray()
}

#endregion

#region ---------- HTML / SVG 部品 ----------

function ConvertTo-HtmlText {
    <#
        .SYNOPSIS
        HTML に埋め込む文字列をエスケープする。

        .DESCRIPTION
        サーバ名・イベント本文・パスなど、外部から来た文字列をそのまま
        埋め込むと表示が壊れるため、必ず本関数を通す。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter()]
        [AllowNull()]
        [AllowEmptyString()]
        $Text
    )

    if ($null -eq $Text) { return '' }

    return ([string] $Text).
    Replace('&', '&amp;').
    Replace('<', '&lt;').
    Replace('>', '&gt;').
    Replace('"', '&quot;').
    Replace("'", '&#39;')
}

function Get-StatusPalette {
    <#
        .SYNOPSIS
        状態レベルに対応する配色とラベルを返す。
    #>
    [CmdletBinding()]
    [OutputType([hashtable])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $Status
    )

    if ($script:StatusPalette.ContainsKey($Status)) { return $script:StatusPalette[$Status] }
    return $script:StatusPalette['Unknown']
}

function New-StatusPillHtml {
    <#
        .SYNOPSIS
        状態を表す小さなバッジ（信号色）の HTML を返す。
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'HTML 文字列を組み立てて返すだけの関数であり、システム状態を変更しない。')]
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string] $Status
    )

    $palette = Get-StatusPalette -Status $Status
    return ('<span class="pill" style="color:{0};background:{1};border-color:{0}">{2}</span>' -f `
            $palette.Color, $palette.Background, (ConvertTo-HtmlText -Text $palette.Label))
}

function New-GaugeHtml {
    <#
        .SYNOPSIS
        0〜100% の横棒ゲージを描く。外部ライブラリは使わず div と CSS のみ。
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'HTML 文字列を組み立てて返すだけの関数であり、システム状態を変更しない。')]
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowNull()]
        $Percent,

        [Parameter()]
        [string] $Status = 'OK',

        [Parameter()]
        [AllowEmptyString()]
        [string] $Caption = ''
    )

    # 割合に換算できない測定値（W など）はバーを描かず値だけを出す。
    # 空のバーは「0%」に見えてしまい誤読を招くため。
    if ($null -eq $Percent) {
        $text = if ([string]::IsNullOrWhiteSpace($Caption)) { '-' } else { $Caption }
        return ('<div class="gauge"><span class="gauge-text">{0}</span></div>' -f (ConvertTo-HtmlText -Text $text))
    }

    # 0 / 100 を整数リテラルで渡すと Math::Max/Min の int オーバーロードが選ばれ、
    # 小数が丸められてしまう。必ず double リテラルを使う。
    $value = [Math]::Max(0.0, [Math]::Min(100.0, [double] $Percent))
    $palette = Get-StatusPalette -Status $Status

    return ('<div class="gauge"><div class="gauge-bar"><div class="gauge-fill" style="width:{0:N1}%;background:{1}"></div></div><span class="gauge-text">{2}</span></div>' -f `
            $value, $palette.Color, (ConvertTo-HtmlText -Text $Caption))
}

function New-LineChartSvg {
    <#
        .SYNOPSIS
        折れ線グラフを SVG で描く。外部ライブラリを使わない自前描画。

        .PARAMETER Point
        @{ Label = '...'; Value = <double または $null> } の配列。値が $null の点は線を切る。
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'SVG 文字列を組み立てて返すだけの関数であり、システム状態を変更しない。')]
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter()]
        [AllowNull()]
        [psobject[]] $Point = @(),

        [Parameter()]
        [int] $Width = 520,

        [Parameter()]
        [int] $Height = 90,

        [Parameter()]
        [string] $Color = '#0969da',

        [Parameter()]
        [AllowNull()]
        $MinValue = $null,

        [Parameter()]
        [AllowNull()]
        $MaxValue = $null,

        [Parameter()]
        [string] $Unit = ''
    )

    $points = @($Point | Where-Object { $null -ne $_ })
    $values = @($points | Where-Object { $null -ne $_.Value } | ForEach-Object { [double] $_.Value })

    if ($values.Count -eq 0) {
        return ('<svg class="chart" viewBox="0 0 {0} {1}" role="img" aria-label="データなし"><text x="8" y="{2}" class="chart-empty">データがありません</text></svg>' -f `
                $Width, $Height, [int] ($Height / 2))
    }

    $minimum = if ($null -ne $MinValue) { [double] $MinValue } else { [Math]::Min(0, ($values | Measure-Object -Minimum).Minimum) }
    $maximum = if ($null -ne $MaxValue) { [double] $MaxValue } else { ($values | Measure-Object -Maximum).Maximum }
    if ($maximum -le $minimum) { $maximum = $minimum + 1 }

    $padLeft = 4
    $padTop = 8
    $padBottom = 14
    $plotWidth = $Width - ($padLeft * 2)
    $plotHeight = $Height - $padTop - $padBottom

    $builder = New-Object System.Text.StringBuilder
    $null = $builder.AppendFormat('<svg class="chart" viewBox="0 0 {0} {1}" preserveAspectRatio="none" role="img">', $Width, $Height)

    # 目盛（上下 2 本のみ。線を増やすと小さい図では読みにくくなる）
    foreach ($ratio in @(0.0, 0.5, 1.0)) {
        $y = $padTop + ($plotHeight * $ratio)
        $null = $builder.AppendFormat('<line x1="{0}" y1="{1:N1}" x2="{2}" y2="{1:N1}" class="chart-grid" />', `
                $padLeft, $y, $Width - $padLeft)
    }

    $step = if ($points.Count -gt 1) { $plotWidth / ($points.Count - 1) } else { 0 }

    $segments = New-Object System.Collections.ArrayList
    $current = New-Object System.Collections.ArrayList
    for ($index = 0; $index -lt $points.Count; $index++) {
        $value = $points[$index].Value
        if ($null -eq $value) {
            if ($current.Count -gt 0) { $null = $segments.Add($current.ToArray()); $current = New-Object System.Collections.ArrayList }
            continue
        }
        $x = $padLeft + ($step * $index)
        $y = $padTop + $plotHeight - ((([double] $value - $minimum) / ($maximum - $minimum)) * $plotHeight)
        $null = $current.Add(('{0:N1},{1:N1}' -f $x, $y))
    }
    if ($current.Count -gt 0) { $null = $segments.Add($current.ToArray()) }

    foreach ($segment in $segments) {
        if (@($segment).Count -eq 1) {
            $parts = ([string] $segment[0]) -split ','
            $null = $builder.AppendFormat('<circle cx="{0}" cy="{1}" r="2" fill="{2}" />', $parts[0], $parts[1], $Color)
            continue
        }
        $null = $builder.AppendFormat('<polyline points="{0}" fill="none" stroke="{1}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />', `
            ($segment -join ' '), $Color)
    }

    $latest = $points | Where-Object { $null -ne $_.Value } | Select-Object -Last 1
    $null = $builder.AppendFormat('<text x="{0}" y="{1}" class="chart-label">{2}</text>', `
            $padLeft, $Height - 3, (ConvertTo-HtmlText -Text ('最小 {0:N1}{2} / 最大 {1:N1}{2}' -f $minimum, $maximum, $Unit)))
    if ($null -ne $latest) {
        $null = $builder.AppendFormat('<text x="{0}" y="{1}" text-anchor="end" class="chart-label">{2}</text>', `
                $Width - $padLeft, $Height - 3, (ConvertTo-HtmlText -Text ('最新 {0:N1}{1}' -f [double] $latest.Value, $Unit)))
    }

    $null = $builder.Append('</svg>')
    return $builder.ToString()
}

function New-StatusTimelineSvg {
    <#
        .SYNOPSIS
        状態の推移を色帯で描く。折れ線より状態遷移が読み取りやすい。
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'SVG 文字列を組み立てて返すだけの関数であり、システム状態を変更しない。')]
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter()]
        [AllowNull()]
        [string[]] $Status = @(),

        [Parameter()]
        [int] $Width = 520,

        [Parameter()]
        [int] $Height = 18
    )

    $list = @($Status)
    if ($list.Count -eq 0) {
        return '<svg class="timeline" viewBox="0 0 520 18" role="img"><text x="4" y="13" class="chart-empty">履歴なし</text></svg>'
    }

    $barWidth = [double] $Width / $list.Count
    $builder = New-Object System.Text.StringBuilder
    $null = $builder.AppendFormat('<svg class="timeline" viewBox="0 0 {0} {1}" preserveAspectRatio="none" role="img">', $Width, $Height)

    for ($index = 0; $index -lt $list.Count; $index++) {
        $palette = Get-StatusPalette -Status $list[$index]
        $null = $builder.AppendFormat('<rect x="{0:N2}" y="0" width="{1:N2}" height="{2}" fill="{3}" />', `
            ($barWidth * $index), [Math]::Max($barWidth, 1.0), $Height, $palette.Color)
    }

    $null = $builder.Append('</svg>')
    return $builder.ToString()
}

#endregion

#region ---------- 各ブロックの描画 ----------

function Get-DashboardStyle {
    <#
        .SYNOPSIS
        埋め込む CSS を返す。外部スタイルシートは参照しない。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param()

    return @'
:root {
  --bg: #f6f8fa; --panel: #ffffff; --text: #1f2328; --muted: #59636e; --border: #d1d9e0;
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #0d1117; --panel: #151b23; --text: #f0f6fc; --muted: #9198a1; --border: #3d444d; }
}
* { box-sizing: border-box; }
body {
  margin: 0; padding: 16px; background: var(--bg); color: var(--text);
  font-family: "Segoe UI", "Yu Gothic UI", "Meiryo", system-ui, sans-serif;
  font-size: 14px; line-height: 1.6;
}
h1 { font-size: 20px; margin: 0 0 4px; }
h2 { font-size: 15px; margin: 0 0 10px; padding-bottom: 6px; border-bottom: 1px solid var(--border); }
.meta { color: var(--muted); font-size: 12px; margin-bottom: 16px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px; }
.panel { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
.panel.wide { grid-column: 1 / -1; }
.pill {
  display: inline-block; padding: 1px 9px; border-radius: 999px; border: 1px solid;
  font-size: 12px; font-weight: 600; white-space: nowrap;
}
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { text-align: left; padding: 5px 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
th { color: var(--muted); font-weight: 600; white-space: nowrap; }
td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.table-scroll { overflow-x: auto; }
.summary-card { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
.summary-name { font-weight: 600; font-size: 15px; }
.summary-sub { color: var(--muted); font-size: 12px; }
.gauge { display: flex; align-items: center; gap: 8px; }
.gauge-bar { flex: 1; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; min-width: 60px; }
.gauge-fill { height: 100%; border-radius: 4px; }
.gauge-text { font-size: 12px; color: var(--muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.chart, .timeline { width: 100%; height: auto; display: block; margin-top: 6px; }
.chart-grid { stroke: var(--border); stroke-width: 1; }
.chart-label, .chart-empty { fill: var(--muted); font-size: 10px; font-family: inherit; }
.empty { color: var(--muted); font-size: 13px; padding: 6px 0; }
.note { color: var(--muted); font-size: 12px; margin-top: 16px; border-top: 1px solid var(--border); padding-top: 10px; }
'@
}

function Get-ResultFor {
    <#
        .SYNOPSIS
        指定した対象・チェック ID の結果を取り出す。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [psobject[]] $CheckResult,

        [Parameter(Mandatory = $true)]
        [string] $TargetName,

        [Parameter(Mandatory = $true)]
        [string] $CheckId
    )

    return (@($CheckResult) | Where-Object {
            $null -ne $_ -and [string] $_.TargetName -eq $TargetName -and [string] $_.CheckId -eq $CheckId
        } | Select-Object -First 1)
}

function New-SummaryBlockHtml {
    <#
        .SYNOPSIS
        サマリブロック（各サーバの総合ステータスと状態推移）を描く。
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'HTML 文字列を組み立てて返すだけの関数であり、システム状態を変更しない。')]
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [psobject[]] $CheckResult,

        [Parameter()]
        [AllowNull()]
        [psobject[]] $History = @(),

        [Parameter()]
        [AllowNull()]
        [string[]] $TargetOrder = @()
    )

    $builder = New-Object System.Text.StringBuilder
    $null = $builder.Append('<section class="panel wide"><h2>サマリ</h2><div class="grid">')

    foreach ($name in $TargetOrder) {
        $results = @(@($CheckResult) | Where-Object { [string] $_.TargetName -eq $name })
        $status = Get-WorstStatus -Status @($results | ForEach-Object { $_.Status })

        $latest = @($results | ForEach-Object { $_.CollectedOn } | Sort-Object -Descending | Select-Object -First 1)
        $latestText = '-'
        if ($latest.Count -gt 0 -and -not [string]::IsNullOrWhiteSpace([string] $latest[0])) {
            $parsed = [datetime]::MinValue
            if ([datetime]::TryParse([string] $latest[0], [ref] $parsed)) { $latestText = $parsed.ToString('yyyy-MM-dd HH:mm:ss') }
        }

        $problems = @($results | Where-Object { (Get-StatusRank -Status $_.Status) -ge (Get-StatusRank -Status 'Warning') })

        $timeline = @()
        foreach ($sample in @($History)) {
            $targets = Get-ConfigValue -InputObject $sample -Name 'targets'
            $entry = Get-ConfigValue -InputObject $targets -Name $name
            if ($null -eq $entry) { continue }
            $timeline += [string] (Get-ConfigValue -InputObject $entry -Name 'status' -Default 'Unknown')
        }

        $null = $builder.Append('<div class="panel">')
        $null = $builder.AppendFormat('<div class="summary-card"><span class="summary-name">{0}</span>{1}</div>', `
            (ConvertTo-HtmlText -Text $name), (New-StatusPillHtml -Status $status))
        $null = $builder.AppendFormat('<div class="summary-sub">最終更新 {0} / 判定 {1} 件中 要確認 {2} 件</div>', `
            (ConvertTo-HtmlText -Text $latestText), $results.Count, $problems.Count)
        $null = $builder.Append((New-StatusTimelineSvg -Status $timeline))
        $null = $builder.AppendFormat('<div class="summary-sub">直近 {0} サンプルの状態推移</div>', @($timeline).Count)
        $null = $builder.Append('</div>')
    }

    $null = $builder.Append('</div></section>')
    return $builder.ToString()
}

function New-TableBlockHtml {
    <#
        .SYNOPSIS
        見出しと行データから表のブロックを描く。

        .PARAMETER Row
        セルの文字列配列（既にエスケープ済みまたは HTML 断片）の配列。
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'HTML 文字列を組み立てて返すだけの関数であり、システム状態を変更しない。')]
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [string] $Title,

        [Parameter(Mandatory = $true)]
        [string[]] $Header,

        [Parameter()]
        [AllowNull()]
        [object[]] $Row = @(),

        [Parameter()]
        [string] $EmptyText = '表示できるデータがありません。',

        [Parameter()]
        [switch] $Wide
    )

    $builder = New-Object System.Text.StringBuilder
    $null = $builder.AppendFormat('<section class="panel{0}"><h2>{1}</h2>', `
        (@{ $true = ' wide'; $false = '' }[[bool] $Wide]), (ConvertTo-HtmlText -Text $Title))

    $rows = @($Row | Where-Object { $null -ne $_ })
    if ($rows.Count -eq 0) {
        $null = $builder.AppendFormat('<div class="empty">{0}</div></section>', (ConvertTo-HtmlText -Text $EmptyText))
        return $builder.ToString()
    }

    $null = $builder.Append('<div class="table-scroll"><table><thead><tr>')
    foreach ($column in $Header) {
        $null = $builder.AppendFormat('<th>{0}</th>', (ConvertTo-HtmlText -Text $column))
    }
    $null = $builder.Append('</tr></thead><tbody>')

    foreach ($cells in $rows) {
        $null = $builder.Append('<tr>')
        foreach ($cell in @($cells)) {
            $null = $builder.AppendFormat('<td>{0}</td>', [string] $cell)
        }
        $null = $builder.Append('</tr>')
    }

    $null = $builder.Append('</tbody></table></div></section>')
    return $builder.ToString()
}

#endregion

function New-MonitorDashboardHtml {
    <#
        .SYNOPSIS
        ダッシュボードの HTML を組み立てて文字列で返す。純粋関数（I/O を持たない）。

        .PARAMETER CheckResult
        全チェックの最新結果。

        .PARAMETER History
        履歴サンプルの配列。
    #>
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '',
        Justification = 'HTML 文字列を組み立てて返すだけの関数であり、システム状態を変更しない。')]
    [CmdletBinding()]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [psobject[]] $CheckResult,

        [Parameter()]
        [AllowNull()]
        [psobject[]] $History = @(),

        [Parameter()]
        [AllowNull()]
        [psobject[]] $OpenAlert = @(),

        [Parameter()]
        [string] $Title = 'サーバ監視ダッシュボード',

        [Parameter()]
        [int] $RefreshSeconds = 300,

        [Parameter()]
        [datetime] $Now = (Get-Date),

        [Parameter()]
        [AllowNull()]
        [string[]] $TargetOrder = $null
    )

    $results = @($CheckResult | Where-Object { $null -ne $_ })
    if ($null -eq $TargetOrder -or $TargetOrder.Count -eq 0) {
        $TargetOrder = @($results | ForEach-Object { [string] $_.TargetName } | Select-Object -Unique | Sort-Object)
    }

    $overall = Get-WorstStatus -Status @($results | ForEach-Object { $_.Status })

    $builder = New-Object System.Text.StringBuilder
    $null = $builder.Append('<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">')
    $null = $builder.Append('<meta name="viewport" content="width=device-width, initial-scale=1">')
    if ($RefreshSeconds -gt 0) {
        $null = $builder.AppendFormat('<meta http-equiv="refresh" content="{0}">', $RefreshSeconds)
    }
    $null = $builder.AppendFormat('<title>{0}</title>', (ConvertTo-HtmlText -Text $Title))
    $null = $builder.AppendFormat('<style>{0}</style></head><body>', (Get-DashboardStyle))

    $null = $builder.AppendFormat('<h1>{0} {1}</h1>', (ConvertTo-HtmlText -Text $Title), (New-StatusPillHtml -Status $overall))
    $null = $builder.AppendFormat('<div class="meta">生成 {0} / 生成ホスト {1}{2}</div>', `
            $Now.ToString('yyyy-MM-dd HH:mm:ss'), (ConvertTo-HtmlText -Text $env:COMPUTERNAME), `
        (@{ $true = ''; $false = (' / 自動更新 {0} 秒ごと' -f $RefreshSeconds) }[$RefreshSeconds -le 0]))

    $null = $builder.Append('<div class="grid">')

    # --- サマリ ---
    $null = $builder.Append((New-SummaryBlockHtml -CheckResult $results -History $History -TargetOrder $TargetOrder))

    # --- ハードウェア ---
    $hardwareRows = @()
    foreach ($name in $TargetOrder) {
        $result = Get-ResultFor -CheckResult $results -TargetName $name -CheckId 'HW'
        if ($null -eq $result) { continue }
        if ($result.Status -eq 'Skipped') { continue }

        foreach ($item in @($result.Items)) {
            $reading = Get-ConfigValue -InputObject $item -Name 'Reading'
            $units = [string] (Get-ConfigValue -InputObject $item -Name 'Units' -Default '')
            $health = [string] (Get-ConfigValue -InputObject $item -Name 'Health' -Default '')
            $level = if ($health -eq 'OK') { 'OK' } elseif ($health -eq 'Warning') { 'Warning' } elseif ($health -eq 'Critical') { 'Critical' } else { 'Unknown' }

            $percent = $null
            $critical = Get-ConfigValue -InputObject $item -Name 'Critical'
            if ($null -ne $reading -and $null -ne $critical -and [double] $critical -gt 0) {
                $percent = ([double] $reading / [double] $critical) * 100
            }
            elseif ($null -ne $reading -and $units -in @('%', 'Percent', 'percent')) {
                $percent = [double] $reading
            }

            $unitText = if ($units -in @('Percent', 'percent')) { '%' } else { $units }
            $caption = if ($null -ne $reading) { ('{0} {1}' -f $reading, $unitText).Trim() } else { '-' }
            $hardwareRows += , @(
                (ConvertTo-HtmlText -Text $name),
                (ConvertTo-HtmlText -Text ([string] (Get-ConfigValue -InputObject $item -Name 'Kind' -Default ''))),
                (ConvertTo-HtmlText -Text ([string] (Get-ConfigValue -InputObject $item -Name 'Name' -Default ''))),
                (New-GaugeHtml -Percent $percent -Status $level -Caption $caption),
                (New-StatusPillHtml -Status $level)
            )
        }
    }
    $null = $builder.Append((New-TableBlockHtml -Title 'ハードウェア（温度 / ファン / 電源）' -Wide `
                -Header @('サーバ', '種別', 'センサー', '測定値', '判定') -Row $hardwareRows `
                -EmptyText 'ハードウェア監視は無効か、iLO から取得できていません。'))

    # --- リソース ---
    $resourceRows = @()
    foreach ($name in $TargetOrder) {
        $resource = Get-ResultFor -CheckResult $results -TargetName $name -CheckId 'RES'
        $disk = Get-ResultFor -CheckResult $results -TargetName $name -CheckId 'DSK'

        $cpu = $null
        $memory = $null
        if ($null -ne $resource) {
            $cpu = Get-ConfigValue -InputObject $resource.Metrics -Name 'CpuPercent'
            $memory = Get-ConfigValue -InputObject $resource.Metrics -Name 'MemoryPercent'
        }

        if ($null -eq $disk -or @($disk.Items).Count -eq 0) {
            $resourceRows += , @(
                (ConvertTo-HtmlText -Text $name), '-',
                (New-GaugeHtml -Percent $cpu -Status 'OK' -Caption (@{ $true = '-'; $false = ('{0}%' -f $cpu) }[$null -eq $cpu])),
                (New-GaugeHtml -Percent $memory -Status 'OK' -Caption (@{ $true = '-'; $false = ('{0}%' -f $memory) }[$null -eq $memory])),
                (New-GaugeHtml -Percent $null -Caption '-')
            )
            continue
        }

        foreach ($volume in @($disk.Items)) {
            $usedPercent = Get-ConfigValue -InputObject $volume -Name 'UsedPercent'
            $freePercent = [double] (Get-ConfigValue -InputObject $volume -Name 'FreePercent' -Default 100)
            $level = if ($freePercent -lt 10) { 'Critical' } elseif ($freePercent -lt 20) { 'Warning' } else { 'OK' }

            $resourceRows += , @(
                (ConvertTo-HtmlText -Text $name),
                (ConvertTo-HtmlText -Text ('{0} {1}' -f (Get-ConfigValue -InputObject $volume -Name 'DeviceID' -Default ''), (Get-ConfigValue -InputObject $volume -Name 'VolumeName' -Default ''))),
                (New-GaugeHtml -Percent $cpu -Status 'OK' -Caption (@{ $true = '-'; $false = ('{0}%' -f $cpu) }[$null -eq $cpu])),
                (New-GaugeHtml -Percent $memory -Status 'OK' -Caption (@{ $true = '-'; $false = ('{0}%' -f $memory) }[$null -eq $memory])),
                (New-GaugeHtml -Percent $usedPercent -Status $level -Caption ('使用 {0}% / 空き {1}' -f $usedPercent, (Get-ConfigValue -InputObject $volume -Name 'FreeText' -Default '-')))
            )
        }
    }
    $null = $builder.Append((New-TableBlockHtml -Title 'リソース（CPU / メモリ / ディスク）' -Wide `
                -Header @('サーバ', 'ボリューム', 'CPU 使用率', 'メモリ使用率', 'ディスク使用率') -Row $resourceRows))

    # --- データベース ---
    $databaseRows = @()
    foreach ($name in $TargetOrder) {
        $result = Get-ResultFor -CheckResult $results -TargetName $name -CheckId 'DB'
        if ($null -eq $result -or $result.Status -eq 'Skipped') { continue }

        foreach ($database in @($result.Items)) {
            $ratio = Get-ConfigValue -InputObject $database -Name 'LogRatio'
            $ratioLevel = if ($null -ne $ratio -and [double] $ratio -gt 3) { 'Critical' } elseif ($null -ne $ratio -and [double] $ratio -gt 2) { 'Warning' } else { 'OK' }
            $recovery = [string] (Get-ConfigValue -InputObject $database -Name 'RecoveryModel' -Default '')
            $collation = [string] (Get-ConfigValue -InputObject $database -Name 'CollationName' -Default '')

            $databaseRows += , @(
                (ConvertTo-HtmlText -Text $name),
                (ConvertTo-HtmlText -Text ([string] (Get-ConfigValue -InputObject $database -Name 'DatabaseName' -Default ''))),
                ('<span class="num">{0}</span>' -f (ConvertTo-HtmlText -Text ([string] (Get-ConfigValue -InputObject $database -Name 'DataText' -Default '-')))),
                ('<span class="num">{0}</span>' -f (ConvertTo-HtmlText -Text ([string] (Get-ConfigValue -InputObject $database -Name 'LogText' -Default '-')))),
                ('{0} {1}' -f (@{ $true = '-'; $false = ('{0} 倍' -f $ratio) }[$null -eq $ratio]), (New-StatusPillHtml -Status $ratioLevel)),
                (ConvertTo-HtmlText -Text $recovery),
                (ConvertTo-HtmlText -Text $collation)
            )
        }
    }
    $null = $builder.Append((New-TableBlockHtml -Title 'データベース' -Wide `
                -Header @('サーバ', 'DB 名', 'mdf', 'ldf', 'ldf/mdf', '復旧モデル', '照合順序') -Row $databaseRows `
                -EmptyText 'データベース監視は無効か、まだ実行されていません。'))

    # --- バックアップ ---
    $backupRows = @()
    foreach ($name in $TargetOrder) {
        $result = Get-ResultFor -CheckResult $results -TargetName $name -CheckId 'BKP'
        if ($null -eq $result -or $result.Status -eq 'Skipped') { continue }

        foreach ($item in @($result.Items)) {
            $ageHours = Get-ConfigValue -InputObject $item -Name 'AgeHours'
            $level = if ($null -eq $ageHours) { 'Unknown' } elseif ([double] $ageHours -ge 48) { 'Critical' } elseif ([double] $ageHours -ge 24) { 'Warning' } else { 'OK' }

            $backupRows += , @(
                (ConvertTo-HtmlText -Text $name),
                (ConvertTo-HtmlText -Text ([string] (Get-ConfigValue -InputObject $item -Name 'Name' -Default ''))),
                (ConvertTo-HtmlText -Text ([string] (Get-ConfigValue -InputObject $item -Name 'LatestWriteTime' -Default '-'))),
                (ConvertTo-HtmlText -Text ([string] (Get-ConfigValue -InputObject $item -Name 'AgeText' -Default '-'))),
                ('<span class="num">{0}</span>' -f (Get-ConfigValue -InputObject $item -Name 'FileCount' -Default 0)),
                ('<span class="num">{0}</span>' -f (ConvertTo-HtmlText -Text ([string] (Get-ConfigValue -InputObject $item -Name 'TotalText' -Default '-')))),
                (New-StatusPillHtml -Status $level)
            )
        }
    }
    $null = $builder.Append((New-TableBlockHtml -Title 'バックアップ' -Wide `
                -Header @('サーバ', '出力先', '最終取得日時', '経過時間', 'ファイル数', '合計サイズ', '判定') -Row $backupRows `
                -EmptyText 'バックアップ監視は無効か、まだ実行されていません。'))

    # --- ライセンス ---
    $licenseRows = @()
    foreach ($name in $TargetOrder) {
        $result = Get-ResultFor -CheckResult $results -TargetName $name -CheckId 'CAL'
        if ($null -eq $result -or $result.Status -eq 'Skipped') { continue }

        $metrics = $result.Metrics
        $total = [int] (Get-ConfigValue -InputObject $metrics -Name 'Total' -Default 0)
        $issued = [int] (Get-ConfigValue -InputObject $metrics -Name 'Issued' -Default 0)
        $available = [int] (Get-ConfigValue -InputObject $metrics -Name 'Available' -Default 0)
        $usedPercent = if ($total -gt 0) { ($issued / [double] $total) * 100 } else { $null }

        $licenseRows += , @(
            (ConvertTo-HtmlText -Text $name),
            ('<span class="num">{0}</span>' -f $total),
            ('<span class="num">{0}</span>' -f $issued),
            ('<span class="num">{0}</span>' -f $available),
            (New-GaugeHtml -Percent $usedPercent -Status $result.Status -Caption (@{ $true = '-'; $false = ('発行 {0:N0}%' -f $usedPercent) }[$null -eq $usedPercent])),
            (New-StatusPillHtml -Status $result.Status)
        )
    }
    $null = $builder.Append((New-TableBlockHtml -Title 'ライセンス（RDS デバイス CAL）' -Wide `
                -Header @('サーバ', '総数', '発行済', '残数', '使用状況', '判定') -Row $licenseRows `
                -EmptyText 'RDS ライセンス監視は無効です（RD ライセンスサーバ上でのみ有効にします）。'))

    # --- 保守状態 ---
    $maintenanceRows = @()
    foreach ($name in $TargetOrder) {
        $defender = Get-ResultFor -CheckResult $results -TargetName $name -CheckId 'DEF'
        $update = Get-ResultFor -CheckResult $results -TargetName $name -CheckId 'WU'
        $time = Get-ResultFor -CheckResult $results -TargetName $name -CheckId 'NTP'
        if ($null -eq $defender -and $null -eq $update -and $null -eq $time) { continue }

        $defenderItem = if ($null -ne $defender) { @($defender.Items) | Select-Object -First 1 } else { $null }
        $updateItem = if ($null -ne $update) { @($update.Items) | Select-Object -First 1 } else { $null }
        $timeItem = if ($null -ne $time) { @($time.Items) | Select-Object -First 1 } else { $null }

        $offset = if ($null -ne $timeItem) { Get-ConfigValue -InputObject $timeItem -Name 'OffsetSeconds' } else { $null }

        # 数値だけでは異常が目に入りにくいため、項目ごとに判定バッジを添える。
        $defenderPill = if ($null -eq $defender) { '-' } else { New-StatusPillHtml -Status $defender.Status }
        $updatePill = if ($null -eq $update) { '-' } else { New-StatusPillHtml -Status $update.Status }
        $timePill = if ($null -eq $time) { '-' } else { New-StatusPillHtml -Status $time.Status }
        $realTime = if ($null -eq $defenderItem) { '-' } else {
            @{ $true = '有効'; $false = '無効' }[[bool] (Get-ConfigValue -InputObject $defenderItem -Name 'RealTimeProtection' -Default $false)]
        }

        $maintenanceRows += , @(
            (ConvertTo-HtmlText -Text $name),
            ('{0} {1}' -f (ConvertTo-HtmlText -Text ([string] (Get-ConfigValue -InputObject $defenderItem -Name 'SignatureUpdated' -Default '-'))), $defenderPill),
            (ConvertTo-HtmlText -Text $realTime),
            ('{0} {1}' -f (ConvertTo-HtmlText -Text ([string] (Get-ConfigValue -InputObject $updateItem -Name 'LastInstalledOn' -Default '-'))), $updatePill),
            ('<span class="num">{0}</span>' -f (ConvertTo-HtmlText -Text ([string] (Get-ConfigValue -InputObject $updateItem -Name 'AgeDays' -Default '-')))),
            (ConvertTo-HtmlText -Text ([string] (Get-ConfigValue -InputObject $timeItem -Name 'Source' -Default '-'))),
            ('{0} {1}' -f (@{ $true = '-'; $false = ('{0} 秒' -f $offset) }[$null -eq $offset]), $timePill)
        )
    }
    $null = $builder.Append((New-TableBlockHtml -Title '保守状態' -Wide `
                -Header @('サーバ', 'Defender 定義日', 'リアルタイム保護', 'Update 最終適用', '経過日数', '時刻同期ソース', '時刻ずれ') `
                -Row $maintenanceRows))

    # --- 履歴グラフ ---
    $null = $builder.Append('<section class="panel wide"><h2>直近の推移</h2><div class="grid">')
    foreach ($name in $TargetOrder) {
        $diskPoints = @()
        $cpuPoints = @()
        foreach ($sample in @($History)) {
            $targets = Get-ConfigValue -InputObject $sample -Name 'targets'
            $entry = Get-ConfigValue -InputObject $targets -Name $name
            $diskPoints += [pscustomobject]@{ Value = (Get-ConfigValue -InputObject $entry -Name 'minFreePercent') }
            $cpuPoints += [pscustomobject]@{ Value = (Get-ConfigValue -InputObject $entry -Name 'cpuPercent') }
        }

        $null = $builder.Append('<div class="panel">')
        $null = $builder.AppendFormat('<div class="summary-name">{0}</div>', (ConvertTo-HtmlText -Text $name))
        $null = $builder.Append('<div class="summary-sub">ディスク空き率（最小・%）</div>')
        $null = $builder.Append((New-LineChartSvg -Point $diskPoints -Color '#0969da' -MinValue 0 -MaxValue 100 -Unit '%'))
        $null = $builder.Append('<div class="summary-sub">CPU 使用率（%）</div>')
        $null = $builder.Append((New-LineChartSvg -Point $cpuPoints -Color '#bc4c00' -MinValue 0 -MaxValue 100 -Unit '%'))
        $null = $builder.Append('</div>')
    }
    $null = $builder.Append('</div></section>')

    # --- 直近アラート ---
    $alertRows = @()
    foreach ($alert in @($OpenAlert | Where-Object { $null -ne $_ })) {
        $level = [string] (Get-ConfigValue -InputObject $alert -Name 'level' -Default 'Warning')
        $firstDetected = [string] (Get-ConfigValue -InputObject $alert -Name 'firstDetectedOn' -Default '')
        $parsed = [datetime]::MinValue
        $firstText = if ([datetime]::TryParse($firstDetected, [ref] $parsed)) { $parsed.ToString('yyyy-MM-dd HH:mm') } else { $firstDetected }

        $alertRows += , @(
            (New-StatusPillHtml -Status $level),
            (ConvertTo-HtmlText -Text ([string] (Get-ConfigValue -InputObject $alert -Name 'target' -Default ''))),
            (ConvertTo-HtmlText -Text ([string] (Get-ConfigValue -InputObject $alert -Name 'checkName' -Default ''))),
            (ConvertTo-HtmlText -Text ([string] (Get-ConfigValue -InputObject $alert -Name 'title' -Default ''))),
            (ConvertTo-HtmlText -Text $firstText),
            ('<span class="num">{0}</span>' -f (Get-ConfigValue -InputObject $alert -Name 'notifyCount' -Default 0))
        )
    }
    $null = $builder.Append((New-TableBlockHtml -Title '直近アラート（未解消）' -Wide `
                -Header @('レベル', 'サーバ', 'チェック', '内容', '初回検知', '通知回数') -Row $alertRows `
                -EmptyText '未解消の異常はありません。'))

    $null = $builder.Append('</div>')
    $null = $builder.Append('<p class="note">この画面は補助です。異常の把握は通知（メール / Backlog）で行ってください。画面が更新されていない場合、監視ツール自体が停止している可能性があります。</p>')
    $null = $builder.Append('</body></html>')

    return $builder.ToString()
}

function Write-MonitorDashboard {
    <#
        .SYNOPSIS
        ダッシュボード HTML を生成し、設定された出力先へ書き出す。
    #>
    [CmdletBinding(SupportsShouldProcess = $true)]
    [OutputType([string])]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [psobject[]] $CheckResult,

        [Parameter(Mandatory = $true)]
        [psobject] $DashboardConfig,

        [Parameter()]
        [AllowNull()]
        [psobject[]] $OpenAlert = @(),

        [Parameter()]
        [AllowNull()]
        [string[]] $TargetOrder = $null,

        [Parameter()]
        [datetime] $Now = (Get-Date)
    )

    if (-not [bool] (Get-ConfigValue -InputObject $DashboardConfig -Name 'enabled' -Default $true)) {
        Write-MonitorLog -Category 'dashboard' -Message 'ダッシュボードは無効化されています。'
        return ''
    }

    $outputPath = [string] (Get-ConfigValue -InputObject $DashboardConfig -Name 'outputPath' -Default '')
    if ([string]::IsNullOrWhiteSpace($outputPath)) {
        Write-MonitorLog -Level 'Warn' -Category 'dashboard' -Message 'ダッシュボードの出力先が設定されていないため生成しません。'
        return ''
    }

    $historyDays = [int] (Get-ConfigValue -InputObject $DashboardConfig -Name 'historyDays' -Default 7)
    $history = Add-MonitorHistorySample -CheckResult $CheckResult -HistoryDays $historyDays -Now $Now -Confirm:$false

    $html = New-MonitorDashboardHtml -CheckResult $CheckResult -History $history -OpenAlert $OpenAlert `
        -Title ([string] (Get-ConfigValue -InputObject $DashboardConfig -Name 'title' -Default 'サーバ監視ダッシュボード')) `
        -RefreshSeconds ([int] (Get-ConfigValue -InputObject $DashboardConfig -Name 'refreshSeconds' -Default 300)) `
        -Now $Now -TargetOrder $TargetOrder

    if (-not $PSCmdlet.ShouldProcess($outputPath, 'ダッシュボードの書き出し')) { return $html }

    try {
        Write-MonitorFile -Path $outputPath -Content $html -Confirm:$false
        Write-MonitorLog -Category 'dashboard' -Message ('ダッシュボードを出力しました: {0}' -f $outputPath)
    }
    catch {
        Write-MonitorLog -Level 'Error' -Category 'dashboard' -Message (
            'ダッシュボードの出力に失敗しました ({0}): {1}' -f $outputPath, $_.Exception.Message)
    }

    return $html
}

Export-ModuleMember -Function @(
    'Get-MonitorHistory'
    'Add-MonitorHistorySample'
    'ConvertTo-HtmlText'
    'Get-StatusPalette'
    'New-StatusPillHtml'
    'New-GaugeHtml'
    'New-LineChartSvg'
    'New-StatusTimelineSvg'
    'Get-DashboardStyle'
    'Get-ResultFor'
    'New-SummaryBlockHtml'
    'New-TableBlockHtml'
    'New-MonitorDashboardHtml'
    'Write-MonitorDashboard'
)
