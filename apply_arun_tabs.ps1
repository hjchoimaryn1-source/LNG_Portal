$utf8NoBom = New-Object System.Text.UTF8Encoding $False

$files = Get-ChildItem -Path "src/components/locations/nias/*.tsx"
$files += Get-Item "src/components/locations/ArunTerminalView.tsx"
$files += Get-Item "src/components/locations/NiasTerminalView.tsx"

foreach ($f in $files) {
    if (Test-Path $f.FullName) {
        $content = [System.IO.File]::ReadAllText($f.FullName, $utf8NoBom)

        # 1. TABS / ACTIVE SELECTIONS
        $content = $content -replace 'bg-blue-600/20 text-white font-bold border border-blue-500/40 shadow-sm', 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
        $content = $content -replace 'bg-blue-600 text-white shadow-sm', 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-sm'
        
        # Wait, there's another tab format in NiasTerminalView
        # If it was text-white before, it might have been changed.
        # Let's fix inactive tabs:
        $content = $content -replace 'text-slate-900 font-bold hover:text-slate-900 font-bold', 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
        $content = $content -replace 'text-slate-950 font-bold hover:text-slate-950 font-bold', 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'

        # 2. Text contrast
        # Increase darkness of very light texts
        $content = $content -replace 'text-slate-400', 'text-slate-900'
        $content = $content -replace 'text-slate-500', 'text-slate-900'

        # 3. Inputs
        $content = $content -replace 'border-slate-200/80 rounded-lg text-slate-900 font-bold text-xs focus:outline-none focus:border-blue-500', 'border-slate-300 rounded-lg text-slate-900 font-semibold text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        
        # Arun inputs (Lab COQ etc might be bg-slate-950 or something)
        # We will change any remaining bg-slate-50 or bg-white border border-slate-200 in inputs if needed, but since they are already bg-white from previous script, it's mostly ok.
        $content = $content -replace 'bg-white shadow-sm border border-slate-200/80', 'bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'

        # 4. Selected tank card
        $content = $content -replace 'bg-blue-600/20 border-blue-500 text-white font-bold font-bold', 'bg-blue-50/60 border-blue-300 text-blue-900 font-bold'

        # 5. Fancy badges
        $content = $content -replace 'bg-emerald-500/20 text-white font-bold border border-emerald-200', 'bg-slate-100 text-slate-700 border border-slate-200'
        $content = $content -replace 'bg-cyan-500/20 text-slate-900 font-bold border border-cyan-500/30', 'bg-slate-100 text-slate-700 border border-slate-200'

        # Other badges (emerald-50, amber-50, etc) to gray
        # $content = $content -replace 'bg-emerald-50 text-emerald-700', 'bg-slate-100 text-slate-700'
        # $content = $content -replace 'bg-amber-50 text-amber-700', 'bg-slate-100 text-slate-700'
        # $content = $content -replace 'bg-indigo-50 text-indigo-700', 'bg-slate-100 text-slate-700'

        [System.IO.File]::WriteAllText($f.FullName, $content, $utf8NoBom)
        Write-Output "Processed: $($f.Name)"
    }
}
Write-Output "Done."
