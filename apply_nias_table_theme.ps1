$utf8NoBom = New-Object System.Text.UTF8Encoding $False

$files = Get-ChildItem -Path "src/components/locations/nias/*.tsx"
$files += Get-Item "src/components/locations/NiasTerminalView.tsx"

foreach ($f in $files) {
    $file = $f.FullName
    if (Test-Path $file) {
        $content = [System.IO.File]::ReadAllText($file, $utf8NoBom)

        # 1. Main Backgrounds
        $content = $content -replace 'bg-slate-900/90', 'bg-white shadow-sm'
        $content = $content -replace 'bg-slate-900', 'bg-white shadow-sm'
        # Headers
        $content = $content -replace 'bg-slate-800/90', 'bg-slate-50'
        $content = $content -replace 'bg-slate-800/80', 'bg-slate-50'
        
        # 2. Mini boxes (bg-slate-950) -> bg-white border border-slate-200
        $content = $content -replace 'bg-slate-950', 'bg-white border border-slate-200'
        
        # 3. Table Headers
        # Find exactly the standard thead string and replace it
        $theadDark = 'bg-slate-800 border-b border-slate-700 text-left text-xs font-semibold text-slate-400 tracking-wider'
        $theadLight = 'bg-slate-100 border-b-2 border-slate-300 text-left text-xs font-bold text-slate-800 tracking-wider'
        $content = $content -replace $theadDark, $theadLight
        
        # Also replace generic bg-slate-800 for any other panels
        $content = $content -replace 'bg-slate-800', 'bg-slate-100'
        $content = $content -replace 'bg-slate-700', 'bg-slate-100'

        # Table rows (stripe effect)
        $content = $content -replace 'hover:bg-slate-800/80', 'bg-white even:bg-slate-50 hover:bg-slate-100'
        $content = $content -replace 'hover:bg-slate-800', 'bg-white even:bg-slate-50 hover:bg-slate-100'
        $content = $content -replace 'hover:bg-slate-700', 'bg-white even:bg-slate-50 hover:bg-slate-100'
        $content = $content -replace 'hover:bg-slate-900', 'bg-white even:bg-slate-50 hover:bg-slate-100'

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
        $content = $content -replace 'text-white font-bold', 'text-slate-950 font-bold'
        $content = $content -replace 'text-white', 'text-slate-950'
        $content = $content -replace 'text-slate-400', 'text-slate-600'
        $content = $content -replace 'text-slate-300', 'text-slate-600'
        $content = $content -replace 'text-slate-200', 'text-slate-700'

        # Placeholders
        $content = $content -replace 'placeholder-slate-[45]00', 'placeholder-slate-400'

        # Badges
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

        # Restore white text for colored buttons and tags
        $content = $content -replace '(bg-blue-[56]00[^''"]*?)text-slate-[0-9]+', '$1text-white'
        $content = $content -replace '(bg-emerald-[56]00[^''"]*?)text-slate-[0-9]+', '$1text-white'
        $content = $content -replace '(bg-amber-[56]00[^''"]*?)text-slate-[0-9]+', '$1text-white'
        $content = $content -replace '(bg-red-[56]00[^''"]*?)text-slate-[0-9]+', '$1text-white'
        
        $content = $content -replace '(bg-blue-[56]00[^''"]*?)text-slate-[0-9]+ font-bold', '$1text-white font-bold'
        $content = $content -replace '(bg-emerald-[56]00[^''"]*?)text-slate-[0-9]+ font-bold', '$1text-white font-bold'
        $content = $content -replace '(bg-amber-[56]00[^''"]*?)text-slate-[0-9]+ font-bold', '$1text-white font-bold'
        $content = $content -replace '(bg-red-[56]00[^''"]*?)text-slate-[0-9]+ font-bold', '$1text-white font-bold'

        [System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
        Write-Output "Processed: $file"
    }
}
Write-Output "Done."
