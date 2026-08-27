$utf8NoBom = New-Object System.Text.UTF8Encoding $False

$file = "d:\Dev_PCode\NIAS_LNG_Portal\src\components\locations\NiasTerminalView.tsx"
if (Test-Path $file) {
    $c = [System.IO.File]::ReadAllText($file, $utf8NoBom)
    
    $c = $c.Replace("🌐 Terminal Integrated Overview", "Terminal Integrated Overview")
    $c = $c.Replace("📦 Domain 1: ISO Tank Management", "Domain 1: ISO Tank Management")
    $c = $c.Replace("⚡ Domain 2: Regas System & Power", "Domain 2: Regas System & Power")
    $c = $c.Replace("🌐 1. Overview & Visual Yard Map", "1. Overview & Visual Yard Map")
    $c = $c.Replace("📥 2. Laydown 1 Condition & BOG Log", "2. Laydown 1 Condition & BOG Log")
    $c = $c.Replace("🏷️ 3. Active Bay Mounted Tanks", "3. Active Bay Mounted Tanks")
    $c = $c.Replace("🔄 4. Laydown 2 (Heel 4% Staging)", "4. Laydown 2 (Heel 4% Staging)")
    $c = $c.Replace("⚖️ 5. ISO Tank Mass Balance & Depressurization Log", "5. ISO Tank Mass Balance & Depressurization Log")
    $c = $c.Replace("📊 1. Gas Process & State Telemetry", "1. Gas Process & State Telemetry")
    $c = $c.Replace("🔬 2. GC & Gas Quality Stream", "2. GC & Gas Quality Stream")
    $c = $c.Replace("⚡ 3. PLTMG Power & Thermal Output", "3. PLTMG Power & Thermal Output")
    $c = $c.Replace("⚖️ 4. Custody Heat Settlement", "4. Custody Heat Settlement")
    $c = $c.Replace("📍 Laydown Yard 1", "Laydown Yard 1")
    $c = $c.Replace("🔥 4-Bay Vaporizer Station", "4-Bay Vaporizer Station")
    $c = $c.Replace("🔄 Laydown Yard 2", "Laydown Yard 2")

    [System.IO.File]::WriteAllText($file, $c, $utf8NoBom)
    Write-Output "Cleaned tab strings in NiasTerminalView.tsx"
}
