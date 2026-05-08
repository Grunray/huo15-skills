param(
    [Parameter(Mandatory = $true)]
    [string] $InputPath,
    [Parameter(Mandatory = $true)]
    [string] $OutputPath
)
$ErrorActionPreference = "Stop"
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Error "ffmpeg not found in PATH"
}
& ffmpeg -y -i $InputPath -vn -acodec libmp3lame -q:a 2 $OutputPath
