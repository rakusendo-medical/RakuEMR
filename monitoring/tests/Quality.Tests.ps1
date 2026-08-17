#Requires -Version 5.1
<#
    成果物そのものの品質を検証する。

      - 全スクリプトが構文エラー無く解析できること
      - PowerShell 5.1 で動かない 7.x 専用構文を使っていないこと
      - 日本語を含むファイルが UTF-8 BOM 付きであること
        （BOM が無いと PowerShell 5.1 は ANSI として読み、文字化けする）
      - 認証情報を平文で埋め込んでいないこと
      - PSScriptAnalyzer の指摘が無いこと（未導入環境ではスキップ）
#>

BeforeAll {
    . (Join-Path $PSScriptRoot 'TestHelper.ps1')

    $script:root = Get-MonitoringRoot
    $script:scriptFiles = @(Get-ChildItem -LiteralPath $script:root -Recurse -File -Include '*.ps1', '*.psm1', '*.psd1' |
            Where-Object { $_.FullName -notmatch '[\\/](state|logs)[\\/]' })
    $script:jsonFiles = @(Get-ChildItem -LiteralPath $script:root -Recurse -File -Filter '*.json' |
            Where-Object { $_.FullName -notmatch '[\\/](state|logs)[\\/]' })
}

Describe '成果物の構成' {

    It '必要なスクリプトがすべて存在する' {
        foreach ($relative in @(
                'README.md'
                'config.sample.json'
                'Install-Credentials.ps1'
                'Register-Tasks.ps1'
                'Invoke-Monitor.ps1'
                'modules/Common.psm1'
                'modules/Check-Service.psm1'
                'modules/Check-Disk.psm1'
                'modules/Check-Backup.psm1'
                'modules/Check-Database.psm1'
                'modules/Check-Defender.psm1'
                'modules/Check-TimeSync.psm1'
                'modules/Check-EventLog.psm1'
                'modules/Check-WindowsUpdate.psm1'
                'modules/Check-RdsLicense.psm1'
                'modules/Check-HyperV.psm1'
                'modules/Check-Hardware.psm1'
                'modules/Notify.psm1'
                'modules/Dashboard.psm1'
            )) {
            $path = Join-Path $script:root ($relative -replace '/', [System.IO.Path]::DirectorySeparatorChar)
            Test-Path -LiteralPath $path | Should -BeTrue -Because ('{0} が必要です' -f $relative)
        }
    }

    It '検出したスクリプトが 1 つ以上ある' {
        $script:scriptFiles.Count | Should -BeGreaterThan 0
    }
}

Describe '構文検証' {

    It 'すべてのスクリプトが構文エラー無く解析できる' {
        $failures = @()
        foreach ($file in $script:scriptFiles) {
            $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
            $errors = $null
            $null = [System.Management.Automation.PSParser]::Tokenize($content, [ref] $errors)
            if ($null -ne $errors -and @($errors).Count -gt 0) {
                $failures += ('{0}: {1}' -f $file.Name, ($errors | ForEach-Object { $_.Message }) -join ' / ')
            }
        }
        $failures -join [Environment]::NewLine | Should -BeNullOrEmpty
    }

    It 'すべての JSON が解析できる' {
        foreach ($file in $script:jsonFiles) {
            { Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8 | ConvertFrom-Json } |
                Should -Not -Throw -Because ('{0} が解析できる必要があります' -f $file.Name)
        }
    }
}

Describe 'PowerShell 5.1 互換' {

    It '7.x 専用の演算子・構文を使っていない' {
        # 7.x でのみ動く書き方を混入させると、実機（5.1）で初めて落ちる。
        $patterns = @(
            @{ Name = 'null 合体演算子 (??)'; Pattern = '\?\?[^\)]' }
            @{ Name = 'null 条件代入 (??=)'; Pattern = '\?\?=' }
            @{ Name = 'null 条件アクセス (?.)'; Pattern = '\$\w+\?\.' }
            @{ Name = 'パイプライン連鎖 (&& / ||)'; Pattern = '(?<!\|)\|\|(?!\|)|&&' }
            @{ Name = '三項演算子'; Pattern = '\)\s*\?\s*[^\s].*\s:\s' }
        )

        $failures = @()
        foreach ($file in $script:scriptFiles) {
            # 検査パターンそのものを書いてあるこのファイルは対象外。
            if ($file.Name -eq 'Quality.Tests.ps1') { continue }

            $lines = Get-Content -LiteralPath $file.FullName -Encoding UTF8
            for ($index = 0; $index -lt $lines.Count; $index++) {
                $line = $lines[$index]
                # コメント行は対象外にする。
                if ($line -match '^\s*#') { continue }
                foreach ($check in $patterns) {
                    if ($line -match $check.Pattern) {
                        $failures += ('{0}:{1} {2} … {3}' -f $file.Name, ($index + 1), $check.Name, $line.Trim())
                    }
                }
            }
        }
        $failures -join [Environment]::NewLine | Should -BeNullOrEmpty
    }

    It '7.x 専用のコマンドレット引数を使っていない' {
        # 文字列一致ではなくトークン解析で判定する。コメントや文字列内の記述を
        # 誤検知すると、テストが「オオカミ少年」になって信用されなくなるため。
        $forbidden = @{
            'Test-Connection'    = @('TimeoutSeconds')
            'Invoke-RestMethod'  = @('SkipCertificateCheck', 'SkipHttpErrorCheck', 'Form')
            'Invoke-WebRequest'  = @('SkipCertificateCheck', 'SkipHttpErrorCheck', 'Form')
            'ConvertFrom-Json'   = @('AsHashtable', 'NoEnumerate', 'Depth')
            'Get-Content'        = @('AsByteStream')
            'Set-Content'        = @('AsByteStream')
            'Start-Process'      = @('WhatIf')
        }

        $failures = @()
        foreach ($file in $script:scriptFiles) {
            if ($file.Name -eq 'Quality.Tests.ps1') { continue }

            $tokens = Get-MonitorScriptToken -Path $file.FullName
            $currentCommand = ''
            foreach ($token in $tokens) {
                if ($token.Type -eq 'Command') {
                    $currentCommand = [string] $token.Content
                    continue
                }
                if ($token.Type -ne 'CommandParameter') { continue }
                if (-not $forbidden.ContainsKey($currentCommand)) { continue }

                $parameter = ([string] $token.Content).TrimStart('-')
                foreach ($name in $forbidden[$currentCommand]) {
                    # 前方一致で見る（PowerShell は引数名の省略を許すため）。
                    if ($name -like ('{0}*' -f $parameter) -and $parameter.Length -ge 4) {
                        $failures += ('{0}:{1} {2} -{3}' -f $file.Name, $token.StartLine, $currentCommand, $parameter)
                    }
                }
            }
        }
        $failures -join [Environment]::NewLine | Should -BeNullOrEmpty
    }

    It '外部モジュールのコマンドレットを呼んでいない' {
        # PSWindowsUpdate / SqlServer モジュール / sqlcmd に依存しないこと。
        $forbidden = @('Invoke-Sqlcmd', 'Get-WindowsUpdate', 'Install-WindowsUpdate', 'Get-WUList', 'sqlcmd', 'sqlcmd.exe')

        $failures = @()
        foreach ($file in $script:scriptFiles) {
            if ($file.Name -eq 'Quality.Tests.ps1') { continue }

            foreach ($token in (Get-MonitorScriptToken -Path $file.FullName)) {
                if ($token.Type -ne 'Command') { continue }
                if ($forbidden -contains [string] $token.Content) {
                    $failures += ('{0}:{1} {2}' -f $file.Name, $token.StartLine, $token.Content)
                }
            }
        }
        $failures -join [Environment]::NewLine | Should -BeNullOrEmpty
    }

    It 'ConvertTo-SecureString を平文から使っていない' {
        $failures = @()
        foreach ($file in $script:scriptFiles) {
            if ($file.Name -eq 'Quality.Tests.ps1') { continue }

            $tokens = Get-MonitorScriptToken -Path $file.FullName
            $currentCommand = ''
            foreach ($token in $tokens) {
                if ($token.Type -eq 'Command') { $currentCommand = [string] $token.Content; continue }
                if ($token.Type -ne 'CommandParameter') { continue }
                if ($currentCommand -ne 'ConvertTo-SecureString') { continue }
                if (([string] $token.Content).TrimStart('-') -like 'AsPlainText*') {
                    $failures += ('{0}:{1}' -f $file.Name, $token.StartLine)
                }
            }
        }
        $failures -join [Environment]::NewLine | Should -BeNullOrEmpty
    }
}

Describe '文字コード' {

    It '日本語を含むスクリプトは UTF-8 BOM 付きである' {
        # BOM が無いと PowerShell 5.1 は ANSI として読み、日本語が文字化けする。
        $failures = @()
        foreach ($file in ($script:scriptFiles + $script:jsonFiles)) {
            $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
            if ($bytes.Length -lt 3) { continue }

            $hasBom = ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
            $body = if ($hasBom) { $bytes[3..($bytes.Length - 1)] } else { $bytes }
            $hasNonAscii = @($body | Where-Object { $_ -gt 0x7F }).Count -gt 0

            if ($hasNonAscii -and -not $hasBom) {
                $failures += ('{0} に BOM がありません' -f $file.Name)
            }
        }
        $failures -join [Environment]::NewLine | Should -BeNullOrEmpty
    }
}

Describe '認証情報の平文埋め込み' {

    It 'スクリプトと設定に平文の資格情報が無い' {
        $patterns = @(
            '(?i)password\s*=\s*[''"][^''"$)][^''"]*[''"]'
            '(?i)apikey\s*=\s*[''"][^''"$)][^''"]*[''"]'
            '(?i)"password"\s*:\s*"[^"]+"'
            '(?i)"apiKey"\s*:\s*"[^"]+"'
        )

        $failures = @()
        foreach ($file in ($script:scriptFiles + $script:jsonFiles)) {
            if ($file.Name -eq 'Quality.Tests.ps1') { continue }
            $lines = Get-Content -LiteralPath $file.FullName -Encoding UTF8
            for ($index = 0; $index -lt $lines.Count; $index++) {
                if ($lines[$index] -match '^\s*(#|//)') { continue }
                foreach ($pattern in $patterns) {
                    if ($lines[$index] -match $pattern) {
                        $failures += ('{0}:{1} {2}' -f $file.Name, ($index + 1), $lines[$index].Trim())
                    }
                }
            }
        }
        $failures -join [Environment]::NewLine | Should -BeNullOrEmpty
    }
}

Describe 'PSScriptAnalyzer' {

    BeforeAll {
        $script:analyzerAvailable = $null -ne (Get-Module -ListAvailable -Name PSScriptAnalyzer)
    }

    It '静的解析の指摘が無い' -Skip:(-not (Get-Module -ListAvailable -Name PSScriptAnalyzer)) {
        Import-Module PSScriptAnalyzer -ErrorAction Stop

        $settings = Join-Path $script:root 'PSScriptAnalyzerSettings.psd1'
        $findings = @(Invoke-ScriptAnalyzer -Path $script:root -Recurse -Settings $settings)

        ($findings | ForEach-Object {
            '{0} {1}:{2} {3} — {4}' -f $_.Severity, (Split-Path -Leaf $_.ScriptName), $_.Line, $_.RuleName, $_.Message
        }) -join [Environment]::NewLine | Should -BeNullOrEmpty
    }
}
