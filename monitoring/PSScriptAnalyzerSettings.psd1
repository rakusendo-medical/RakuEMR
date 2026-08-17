@{
    # PSScriptAnalyzer 設定
    # 目的は 2 つ。
    #   1. 一般的な PowerShell の書き方の逸脱を防ぐ
    #   2. PowerShell 5.1（Windows Server 標準）で動かない構文・コマンドを検出する
    IncludeDefaultRules = $true

    Rules               = @{
        # 5.1 専用の構文チェック。7.x 専用構文（?? 演算子、三項演算子など）を弾く。
        PSUseCompatibleSyntax   = @{
            Enable         = $true
            TargetVersions = @('5.1')
        }

        # Windows Server 2019 / PowerShell 5.1 に存在しないコマンドレットを弾く。
        PSUseCompatibleCommands = @{
            Enable         = $true
            TargetProfiles = @(
                'win-8_x64_10.0.17763.0_5.1.17763.316_x64_4.0.30319.42000_framework'
            )
            # 監視対象サーバ上でのみ利用可能なコマンドは、プロファイルに含まれないため除外する。
            IgnoreCommands = @(
                'Get-VM'
                'Get-VMSnapshot'
                'Get-VMMemory'
                'Get-MpComputerStatus'
                'Get-MpPreference'
                'Register-ScheduledTask'
                'Unregister-ScheduledTask'
                'Get-ScheduledTask'
                'New-ScheduledTask'
                'New-ScheduledTaskAction'
                'New-ScheduledTaskTrigger'
                'New-ScheduledTaskPrincipal'
                'New-ScheduledTaskSettingsSet'
                'Get-Volume'
                'Get-WindowsUpdateLog'
                'Describe'
                'Context'
                'It'
                'Should'
                'BeforeAll'
                'AfterAll'
                'BeforeEach'
                'AfterEach'
                'Mock'
                'InModuleScope'
                'Invoke-Pester'
                'Invoke-ScriptAnalyzer'
                'New-PesterConfiguration'
            )
        }

        PSUseCompatibleTypes    = @{
            Enable         = $true
            TargetProfiles = @(
                'win-8_x64_10.0.17763.0_5.1.17763.316_x64_4.0.30319.42000_framework'
            )
        }
    }

    ExcludeRules        = @(
        # 本ツールは PSGallery へ公開しないため、モジュールマニフェスト前提のルールは対象外。
        'PSUseToExportFieldsInManifest'
    )
}
