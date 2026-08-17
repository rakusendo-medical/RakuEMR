#Requires -Version 5.1
<#
    テスト共通ヘルパー。各 *.Tests.ps1 の BeforeAll から読み込む。
#>

$script:MonitoringRoot = Split-Path -Parent $PSScriptRoot
$script:ModuleRoot = Join-Path $script:MonitoringRoot 'modules'

function Get-MonitoringRoot {
    <#
        .SYNOPSIS
        monitoring ディレクトリの絶対パスを返す。
    #>
    [CmdletBinding()]
    [OutputType([string])]
    param()
    return $script:MonitoringRoot
}

function Import-MonitorTestModule {
    <#
        .SYNOPSIS
        テスト対象のモジュールを読み込む。Common は常に先に読み込む。
    #>
    [CmdletBinding()]
    param(
        [Parameter()]
        [string[]] $Name = @()
    )

    Import-Module (Join-Path $script:ModuleRoot 'Common.psm1') -Force -DisableNameChecking
    foreach ($item in $Name) {
        Import-Module (Join-Path $script:ModuleRoot $item) -Force -DisableNameChecking
    }
}

function Initialize-MonitorTestContext {
    <#
        .SYNOPSIS
        一時ディレクトリを state / logs にした実行コンテキストを作る。

        .DESCRIPTION
        テストが本番の state ディレクトリを汚さないようにするため、
        設定サンプルを読み込んだうえで state / logs だけ一時領域に差し替える。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param()

    $temporary = Join-Path ([System.IO.Path]::GetTempPath()) ('monitor-test-{0}' -f [guid]::NewGuid().ToString('N'))
    $null = New-Item -ItemType Directory -Path $temporary -Force

    $sample = Join-Path $script:MonitoringRoot 'config.sample.json'
    $context = Initialize-MonitorContext -ConfigPath $sample -CycleName 'Test'
    $context.StateDir = Join-Path $temporary 'state'
    $context.LogDir = Join-Path $temporary 'logs'
    $context.LogFile = Join-Path $context.LogDir 'monitor-test.log'
    $null = New-Item -ItemType Directory -Path $context.StateDir -Force
    $null = New-Item -ItemType Directory -Path $context.LogDir -Force

    return $context
}

function New-TestVolume {
    <#
        .SYNOPSIS
        Win32_LogicalDisk 相当のモックオブジェクトを作る。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [string] $DeviceID,

        [Parameter(Mandatory = $true)]
        [double] $SizeGB,

        [Parameter(Mandatory = $true)]
        [double] $FreeGB,

        [Parameter()]
        [string] $VolumeName = ''
    )

    return [pscustomobject]@{
        DeviceID   = $DeviceID
        VolumeName = $VolumeName
        Size       = [long] ($SizeGB * 1GB)
        FreeSpace  = [long] ($FreeGB * 1GB)
        FileSystem = 'NTFS'
    }
}

function New-TestService {
    <#
        .SYNOPSIS
        Win32_Service 相当のモックオブジェクトを作る。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name,

        [Parameter()]
        [string] $State = 'Running',

        [Parameter()]
        [string] $StartMode = 'Auto',

        [Parameter()]
        [string] $DisplayName = ''
    )

    return [pscustomobject]@{
        Name        = $Name
        DisplayName = if ($DisplayName) { $DisplayName } else { $Name }
        State       = $State
        StartMode   = $StartMode
        StartName   = 'LocalSystem'
    }
}

function New-TestBackupSnapshot {
    <#
        .SYNOPSIS
        Get-BackupSnapshot 相当のモックオブジェクトを作る。
    #>
    [CmdletBinding()]
    [OutputType([psobject])]
    param(
        [Parameter()]
        [string] $Name = '弥生会計バックアップ',

        [Parameter()]
        [string] $Path = 'D:\Backup\弥生',

        [Parameter()]
        [bool] $Exists = $true,

        [Parameter()]
        [int] $FileCount = 3,

        [Parameter()]
        [double] $TotalMB = 500,

        [Parameter()]
        [AllowNull()]
        $LatestWriteTime = $null,

        [Parameter()]
        [double] $LatestMB = 200,

        [Parameter()]
        [string] $ErrorMessage = ''
    )

    return [pscustomobject]@{
        Name            = $Name
        Path            = $Path
        Exists          = $Exists
        FileCount       = $FileCount
        TotalBytes      = [long] ($TotalMB * 1MB)
        LatestWriteTime = $LatestWriteTime
        LatestName      = 'backup_20260817.zip'
        LatestBytes     = [long] ($LatestMB * 1MB)
        Error           = $ErrorMessage
    }
}
