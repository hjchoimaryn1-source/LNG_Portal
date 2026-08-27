$utf8NoBom = New-Object System.Text.UTF8Encoding $False

$file = "d:\Dev_PCode\NIAS_LNG_Portal\src\components\locations\NiasTerminalView.tsx"
if (Test-Path $file) {
    $c = [System.IO.File]::ReadAllText($file, $utf8NoBom)
    
    # Emojis in Domain & Subtab labels
    $c = $c -replace '🌐\s*', ''
    $c = $c -replace '📦\s*', ''
    $c = $c -replace '⚡\s*', ''
    $c = $c -replace '📥\s*', ''
    $c = $c -replace '🏷️\s*', ''
    $c = $c -replace '🔄\s*', ''
    $c = $c -replace '⚖️\s*', ''
    $c = $c -replace '📊\s*', ''
    $c = $c -replace '🔬\s*', ''
    $c = $c -replace '📍\s*', ''
    $c = $c -replace '🔥\s*', ''
    $c = $c -replace '⚠️\s*', ''
    $c = $c -replace '✅\s*', ''
    $c = $c -replace '🛡️\s*', ''

    [System.IO.File]::WriteAllText($file, $c, $utf8NoBom)
    Write-Output "Cleaned emojis in NiasTerminalView.tsx"
}
