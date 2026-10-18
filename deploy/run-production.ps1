param(
    [ValidateRange(1024, 65535)][int]$Port = 3000,
    [string]$EnvFile = '.env.production'
)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path -LiteralPath $EnvFile -PathType Leaf)) {
    throw "Missing secured runtime environment file: $EnvFile"
}
if (-not (Test-Path -LiteralPath '.next/BUILD_ID' -PathType Leaf)) {
    throw 'No production build. Run npm run build with the intended runtime environment first.'
}
$node = (Get-Command node.exe -ErrorAction Stop).Source
$env:NODE_ENV = 'production'
# Deliberately loopback-only. Publish ONLY through an approved HTTPS reverse proxy.
& $node "--env-file=$EnvFile" 'node_modules/next/dist/bin/next' start --hostname 127.0.0.1 --port $Port
exit $LASTEXITCODE
