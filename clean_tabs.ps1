$utf8NoBom = New-Object System.Text.UTF8Encoding $False

# 1. NiasTerminalView.tsx
$file1 = "d:\Dev_PCode\NIAS_LNG_Portal\src\components\locations\NiasTerminalView.tsx"
if (Test-Path $file1) {
    $c = [System.IO.File]::ReadAllText($file1, $utf8NoBom)
    
    # Clean sub-tab button styles
    $c = $c -replace "\? isDark\s*\?\s*'bg-blue-600/25[^']*'\s*:\s*'bg-white[^']*'\s*:\s*isDark\s*\?\s*'win-tab-inactive'\s*:\s*'win-tab-inactive'", "? 'win-tab-active' : 'win-tab-inactive'"
    $c = $c -replace "\? isDark\s*\?\s*'bg-purple-600/25[^']*'\s*:\s*'bg-white[^']*'\s*:\s*isDark\s*\?\s*'win-tab-inactive'\s*:\s*'win-tab-inactive'", "? 'win-tab-active' : 'win-tab-inactive'"
    $c = $c -replace "\? isDark\s*\?\s*'bg-amber-600/25[^']*'\s*:\s*'bg-white[^']*'\s*:\s*isDark\s*\?\s*'win-tab-inactive'\s*:\s*'win-tab-inactive'", "? 'win-tab-active' : 'win-tab-inactive'"

    # Clean domain switcher
    $c = $c -replace "activeDomain === 'TERMINAL_OVERVIEW'\s*\?\s*'win-tab-active shadow-none'\s*:\s*'[^']*'", "activeDomain === 'TERMINAL_OVERVIEW' ? 'win-tab-active' : 'win-tab-inactive'"
    $c = $c -replace "activeDomain === 'ISO_TANK_MGMT'\s*\?\s*'win-tab-active shadow-none'\s*:\s*'[^']*'", "activeDomain === 'ISO_TANK_MGMT' ? 'win-tab-active' : 'win-tab-inactive'"
    $c = $c -replace "activeDomain === 'REGAS_SYSTEM'\s*\?\s*'win-tab-active shadow-none'\s*:\s*'[^']*'", "activeDomain === 'REGAS_SYSTEM' ? 'win-tab-active' : 'win-tab-inactive'"

    [System.IO.File]::WriteAllText($file1, $c, $utf8NoBom)
    Write-Output "Cleaned tabs in NiasTerminalView.tsx"
}

# 2. ArunTerminalView.tsx
$file2 = "d:\Dev_PCode\NIAS_LNG_Portal\src\components\locations\ArunTerminalView.tsx"
if (Test-Path $file2) {
    $c2 = [System.IO.File]::ReadAllText($file2, $utf8NoBom)
    $c2 = $c2 -replace "win-tab-active shadow-none", "win-tab-active"
    [System.IO.File]::WriteAllText($file2, $c2, $utf8NoBom)
    Write-Output "Cleaned tabs in ArunTerminalView.tsx"
}

# 3. MvSaviourView.tsx
$file3 = "d:\Dev_PCode\NIAS_LNG_Portal\src\components\locations\MvSaviourView.tsx"
if (Test-Path $file3) {
    $c3 = [System.IO.File]::ReadAllText($file3, $utf8NoBom)
    $c3 = $c3 -replace "subTab === 'VOYAGE_MONITORING'\s*\?\s*'bg-cyan-600/20 text-slate-900 font-bold border border-cyan-500/40 shadow-none'\s*:\s*'[^']*'", "subTab === 'VOYAGE_MONITORING' ? 'win-tab-active' : 'win-tab-inactive'"
    $c3 = $c3 -replace "subTab === 'MARINE_PRESSURE'\s*\?\s*'bg-cyan-600/20 text-slate-900 font-bold border border-cyan-500/40 shadow-none'\s*:\s*'[^']*'", "subTab === 'MARINE_PRESSURE' ? 'win-tab-active' : 'win-tab-inactive'"
    [System.IO.File]::WriteAllText($file3, $c3, $utf8NoBom)
    Write-Output "Cleaned tabs in MvSaviourView.tsx"
}

Write-Output "Done cleaning tabs."
