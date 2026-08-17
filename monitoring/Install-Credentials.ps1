#Requires -Version 5.1
<#
    .SYNOPSIS
    iLO・SMTP・リモート接続などの資格情報を暗号化して登録する。

    .DESCRIPTION
    パスワードや API キーは DPAPI（ConvertFrom-SecureString）で暗号化し、
    state/credentials 配下に保存する。設定ファイルやスクリプトに平文で書かない。

    重要:
      暗号化文字列は「実行したアカウント」と「実行したマシン」に紐づく。
      別アカウント・別マシンで作成したものは復号できない。
      したがって本スクリプトは、必ず
        「タスクスケジューラで監視を実行するアカウント」で
        「監視を動かすサーバ上で」
      実行すること。

    .PARAMETER Name
    資格情報の名前。設定ファイルの credentialName / apiKeyCredentialName と一致させる。

    .PARAMETER UserName
    ユーザー名。API キーのようにユーザー名が無いものは省略できる。

    .PARAMETER List
    登録済みの資格情報を一覧表示する（値は表示しない）。

    .PARAMETER Remove
    指定した名前の資格情報を削除する。

    .PARAMETER Test
    指定した名前の資格情報が現在のアカウントで復号できるかを確認する。

    .EXAMPLE
    .\Install-Credentials.ps1 -Name ilo-yayoi -UserName Administrator
    iLO の資格情報を登録する。

    .EXAMPLE
    .\Install-Credentials.ps1 -Name backlog
    Backlog の API キーを登録する（ユーザー名は不要）。

    .EXAMPLE
    .\Install-Credentials.ps1 -List

    .EXAMPLE
    .\Install-Credentials.ps1 -Name ilo-yayoi -Test
#>
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSReviewUnusedParameter', '',
    Justification = 'List / Remove / Test はパラメーターセットの判別用スイッチであり、$PSCmdlet.ParameterSetName 経由で使用している。')]
[CmdletBinding(SupportsShouldProcess = $true, DefaultParameterSetName = 'Register')]
param(
    [Parameter(Mandatory = $true, Position = 0, ParameterSetName = 'Register')]
    [Parameter(Mandatory = $true, Position = 0, ParameterSetName = 'Remove')]
    [Parameter(Mandatory = $true, Position = 0, ParameterSetName = 'Test')]
    [string] $Name,

    [Parameter(ParameterSetName = 'Register')]
    [AllowEmptyString()]
    [string] $UserName = '',

    [Parameter(Mandatory = $true, ParameterSetName = 'List')]
    [switch] $List,

    [Parameter(Mandatory = $true, ParameterSetName = 'Remove')]
    [switch] $Remove,

    [Parameter(Mandatory = $true, ParameterSetName = 'Test')]
    [switch] $Test
)

$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'modules\Common.psm1') -Force -DisableNameChecking

# state ディレクトリを確定させるためコンテキストを初期化する。
# 設定ファイルがまだ無い場合はサンプルで代用する（state の位置しか使わないため）。
$configPath = Join-Path $PSScriptRoot 'config.json'
if (-not (Test-Path -LiteralPath $configPath)) {
    $configPath = Join-Path $PSScriptRoot 'config.sample.json'
    Write-Warning 'config.json が見つからないため config.sample.json の設定で state の位置を決定します。'
}
$null = Initialize-MonitorContext -ConfigPath $configPath -CycleName 'InstallCredentials'

$identity = '{0}\{1}' -f $env:USERDOMAIN, $env:USERNAME

switch ($PSCmdlet.ParameterSetName) {

    'List' {
        $directory = Get-MonitorCredentialDirectory
        $files = @(Get-ChildItem -LiteralPath $directory -Filter '*.cred.json' -File -ErrorAction SilentlyContinue)

        if ($files.Count -eq 0) {
            Write-Output '登録済みの資格情報はありません。'
            break
        }

        Write-Output ('登録先: {0}' -f $directory)
        Write-Output ''
        $files | ForEach-Object {
            $record = Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
            [pscustomobject]@{
                名前       = $record.name
                ユーザー名 = $record.userName
                作成者     = $record.createdBy
                作成マシン = $record.machine
                作成日時   = $record.createdOn
                復号可否   = if ($null -ne (Get-MonitorCredential -Name $record.name)) { '可' } else { '不可' }
            }
        } | Format-Table -AutoSize
        break
    }

    'Remove' {
        $path = Join-Path (Get-MonitorCredentialDirectory) ('{0}.cred.json' -f $Name)
        if (-not (Test-Path -LiteralPath $path)) {
            Write-Warning ('資格情報 "{0}" は登録されていません。' -f $Name)
            break
        }
        if ($PSCmdlet.ShouldProcess($Name, '資格情報の削除')) {
            Remove-Item -LiteralPath $path -Force
            Write-Output ('資格情報 "{0}" を削除しました。' -f $Name)
        }
        break
    }

    'Test' {
        $record = Get-MonitorSecretRecord -Name $Name
        if ($null -eq $record) {
            Write-Warning ('資格情報 "{0}" は登録されていません。' -f $Name)
            break
        }

        Write-Output ('名前      : {0}' -f $record.name)
        Write-Output ('ユーザー名: {0}' -f $record.userName)
        Write-Output ('作成者    : {0}' -f $record.createdBy)
        Write-Output ('作成マシン: {0}' -f $record.machine)
        Write-Output ('現在の実行: {0} @ {1}' -f $identity, $env:COMPUTERNAME)
        Write-Output ''

        $credential = Get-MonitorCredential -Name $Name
        if ($null -eq $credential) {
            Write-Warning '復号できません。登録時と同じアカウント・同じマシンで実行しているか確認してください。'
        }
        else {
            Write-Output '復号できました。この実行アカウントで監視タスクを動かせます。'
        }
        break
    }

    default {
        Write-Output ('資格情報 "{0}" を登録します。' -f $Name)
        Write-Output ('  実行アカウント: {0}' -f $identity)
        Write-Output ('  実行マシン    : {0}' -f $env:COMPUTERNAME)
        Write-Output ''
        Write-Output '暗号化文字列は上記のアカウントとマシンに紐づきます。'
        Write-Output 'タスクスケジューラで監視を実行するアカウントと一致していることを確認してください。'
        Write-Output ''

        if ([string]::IsNullOrWhiteSpace($UserName)) {
            Write-Output 'ユーザー名は指定されていません（API キーなど、値のみを保存します）。'
        }

        # Read-Host -AsSecureString は入力を画面に出さず、平文の変数も作らない。
        $secret = Read-Host -Prompt ('  "{0}" のパスワード / API キーを入力してください' -f $Name) -AsSecureString
        if ($null -eq $secret -or $secret.Length -eq 0) {
            throw '値が入力されませんでした。登録を中止します。'
        }

        $confirm = Read-Host -Prompt '  確認のためもう一度入力してください' -AsSecureString

        $first = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
        $second = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirm)
        try {
            $matched = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($first) -ceq
                       [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($second)
        }
        finally {
            [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($first)
            [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($second)
        }

        if (-not $matched) {
            throw '2 回の入力が一致しません。登録を中止します。'
        }

        Save-MonitorSecret -Name $Name -Secret $secret -UserName $UserName -Confirm:$false

        Write-Output ''
        Write-Output ('資格情報 "{0}" を登録しました。' -f $Name)
        Write-Output ('保存先: {0}' -f (Join-Path (Get-MonitorCredentialDirectory) ('{0}.cred.json' -f $Name)))
        Write-Output ''
        Write-Output '設定ファイル側で credentialName / apiKeyCredentialName にこの名前を指定してください。'
        break
    }
}
