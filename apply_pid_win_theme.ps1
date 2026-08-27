$utf8NoBom = New-Object System.Text.UTF8Encoding $False

$file = "d:\Dev_PCode\NIAS_LNG_Portal\src\components\locations\nias\NiasProcessPIDDiagram.tsx"
if (Test-Path $file) {
    $c = [System.IO.File]::ReadAllText($file, $utf8NoBom)
    
    # Update Header
    $c = $c -replace 'w-full bg-white shadow-none/95 border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap justify-between items-center gap-3', 'win-titlebar px-3 py-1.5'
    $c = $c -replace 'text-sm sm:text-base font-bold text-slate-950 font-bold flex items-center gap-2', 'text-xs font-bold text-white flex items-center gap-2'
    $c = $c -replace '<Activity className="w-4 h-4 text-slate-950 font-bold" />', '<Activity className="w-4 h-4 text-white" />'
    $c = $c -replace 'text-slate-950 font-bold hidden sm:inline', 'text-slate-300 hidden sm:inline'
    $c = $c -replace 'text-xs text-slate-950 font-bold hidden md:inline', 'text-xs text-slate-200 hidden md:inline'

    # Legend strip
    $c = $c -replace 'w-full bg-white shadow-none/60 border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex flex-wrap justify-between items-center gap-3 text-xs font-mono', 'w-full bg-[#ece9d8] border-b border-[#808080] px-3 py-1.5 flex flex-wrap justify-between items-center gap-3 text-[11px] font-mono'

    # Action button
    $c = $c -replace 'flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold border transition-all cursor-pointer bg-emerald-50 text-emerald-700 text-slate-950 font-bold border-emerald-600/40', 'win-btn text-xs'
    $c = $c -replace 'px-2.5 py-1 rounded-none text-\[11px\] font-mono font-bold bg-slate-100 text-slate-950 font-bold border border-slate-200', 'win-sunken px-2 py-0.5 text-[10px] font-mono text-black font-bold'

    [System.IO.File]::WriteAllText($file, $c, $utf8NoBom)
    Write-Output "Updated NiasProcessPIDDiagram.tsx to Win32 theme"
}
