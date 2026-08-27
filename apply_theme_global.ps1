$utf8NoBom = New-Object System.Text.UTF8Encoding $False

$files = @(
  'src/components/locations/MvSaviourView.tsx',
  'src/components/locations/nias/NiasActiveBayWorkspace.tsx',
  'src/components/locations/nias/NiasCustodySettlementTab.tsx',
  'src/components/locations/nias/NiasGasQualityTab.tsx',
  'src/components/locations/nias/NiasOperationalOverviewTab.tsx',
  'src/components/locations/nias/NiasPowerThermalTab.tsx',
  'src/components/locations/nias/NiasProcessPIDDiagram.tsx',
  'src/components/locations/nias/NiasTankMassBalanceTab.tsx',
  'src/components/GlobalFleetHubView.tsx',
  'src/components/FleetTrackerView.tsx',
  'src/components/DataIngestionHub.tsx',
  'src/components/locations/ArunTerminalView.tsx',
  'src/components/locations/NiasTerminalView.tsx'
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = [System.IO.File]::ReadAllText((Resolve-Path $file).Path, $utf8NoBom)

        # Backgrounds
        $content = $content -replace 'bg-slate-900/90', 'bg-white shadow-sm'
        $content = $content -replace 'bg-slate-900', 'bg-white shadow-sm'
        $content = $content -replace 'bg-slate-950', 'bg-slate-50'
        $content = $content -replace 'bg-slate-800/90', 'bg-slate-50'
        $content = $content -replace 'bg-slate-800/80', 'bg-slate-50'
        $content = $content -replace 'bg-slate-800', 'bg-slate-100'
        $content = $content -replace 'bg-slate-700', 'bg-slate-100'

        # Borders
        $content = $content -replace 'border-slate-600', 'border-slate-200'
        $content = $content -replace 'border-slate-700', 'border-slate-200'
        $content = $content -replace 'border-slate-800', 'border-slate-200'
        $content = $content -replace 'border-slate-500', 'border-slate-300'

        # Hover borders
        $content = $content -replace 'hover:border-amber-400', 'hover:border-blue-400'
        $content = $content -replace 'hover:border-cyan-400', 'hover:border-blue-400'
        $content = $content -replace 'hover:border-emerald-400', 'hover:border-blue-400'
        $content = $content -replace 'hover:border-slate-500', 'hover:border-slate-300'
        $content = $content -replace 'hover:border-slate-600', 'hover:border-slate-300'

        # Text colors
        $content = $content -replace 'text-white font-bold', 'text-slate-900 font-bold'
        $content = $content -replace 'text-white', 'text-slate-700'
        $content = $content -replace 'text-slate-400', 'text-slate-500'
        $content = $content -replace 'text-slate-300', 'text-slate-600'
        $content = $content -replace 'text-slate-200', 'text-slate-700'

        # Placeholders
        $content = $content -replace 'placeholder-slate-[45]00', 'placeholder-slate-400'

        # Tags/Badges
        $content = $content -replace 'bg-emerald-950/[0-9]+', 'bg-emerald-50 text-emerald-700'
        $content = $content -replace 'border-emerald-500/[0-9]+', 'border-emerald-200'
        $content = $content -replace 'bg-amber-950/[0-9]+', 'bg-amber-50 text-amber-700'
        $content = $content -replace 'border-amber-500/[0-9]+', 'border-amber-200'
        $content = $content -replace 'bg-indigo-950/[0-9]+', 'bg-indigo-50 text-indigo-700'
        $content = $content -replace 'border-indigo-500/[0-9]+', 'border-indigo-200'
        $content = $content -replace 'bg-blue-500/10', 'bg-blue-50'
        $content = $content -replace 'border-blue-500/30', 'border-blue-200'
        $content = $content -replace 'bg-red-950/[0-9]+', 'bg-red-50 text-red-700'
        $content = $content -replace 'border-red-500/[0-9]+', 'border-red-200'

        # Table row hovers & backgrounds
        $content = $content -replace 'hover:bg-slate-800/80', 'hover:bg-slate-50'
        $content = $content -replace 'hover:bg-slate-800', 'hover:bg-slate-50'
        $content = $content -replace 'hover:bg-slate-700', 'hover:bg-slate-50'
        $content = $content -replace 'hover:bg-slate-900', 'hover:bg-slate-50'

        # Fix button text that got overwritten (we want primary buttons to keep white text)
        $content = $content -replace '(bg-blue-[56]00[^''"]*?)text-slate-[0-9]+', '$1text-white'
        $content = $content -replace '(bg-emerald-[56]00[^''"]*?)text-slate-[0-9]+', '$1text-white'
        $content = $content -replace '(bg-amber-[56]00[^''"]*?)text-slate-[0-9]+', '$1text-white'
        $content = $content -replace '(bg-red-[56]00[^''"]*?)text-slate-[0-9]+', '$1text-white'
        
        $content = $content -replace '(bg-blue-[56]00[^''"]*?)text-slate-[0-9]+ font-bold', '$1text-white font-bold'
        $content = $content -replace '(bg-emerald-[56]00[^''"]*?)text-slate-[0-9]+ font-bold', '$1text-white font-bold'
        $content = $content -replace '(bg-amber-[56]00[^''"]*?)text-slate-[0-9]+ font-bold', '$1text-white font-bold'
        $content = $content -replace '(bg-red-[56]00[^''"]*?)text-slate-[0-9]+ font-bold', '$1text-white font-bold'

        [System.IO.File]::WriteAllText((Resolve-Path $file).Path, $content, $utf8NoBom)
        Write-Output "Processed: $file"
    } else {
        Write-Output "Not found: $file"
    }
}
Write-Output "Done."
