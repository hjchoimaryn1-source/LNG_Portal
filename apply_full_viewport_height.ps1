$utf8NoBom = New-Object System.Text.UTF8Encoding $False

# 1. SidebarNav.tsx
$fileNav = "d:\Dev_PCode\NIAS_LNG_Portal\src\components\SidebarNav.tsx"
if (Test-Path $fileNav) {
    $c = [System.IO.File]::ReadAllText($fileNav, $utf8NoBom)
    $c = $c -replace 'h-screen w-72 sm:w-80', 'h-full w-72 sm:w-80 shrink-0'
    [System.IO.File]::WriteAllText($fileNav, $c, $utf8NoBom)
    Write-Output "Updated SidebarNav.tsx"
}

# 2. NiasTerminalView.tsx
$fileNias = "d:\Dev_PCode\NIAS_LNG_Portal\src\components\locations\NiasTerminalView.tsx"
if (Test-Path $fileNias) {
    $c = [System.IO.File]::ReadAllText($fileNias, $utf8NoBom)
    $c = $c -replace '<div className="flex flex-col gap-6 w-full text-slate-950 font-bold font-sans">', '<div className="h-full flex flex-col min-h-0 gap-1.5 w-full text-slate-950 font-bold font-sans overflow-hidden">'
    $c = $c -replace '<section className="bg-white shadow-none border border-slate-200 rounded-none p-4 sm:p-5 shadow-none flex flex-col gap-3.5 transition-colors duration-200">', '<section className="shrink-0 win-panel p-1.5 flex flex-col gap-1 select-none">'
    $c = $c -replace 'div className="flex items-center win-panel p-1 rounded-none border border-slate-200 gap-1 flex-wrap"', 'div className="flex items-center win-panel p-0.5 rounded-none border border-slate-300 gap-1 flex-wrap"'
    $c = $c -replace 'div className={`flex items-center justify-between border-t pt-3 overflow-x-auto', 'div className={`shrink-0 flex items-center justify-between border-t border-[#808080] pt-1 overflow-x-auto'
    [System.IO.File]::WriteAllText($fileNias, $c, $utf8NoBom)
    Write-Output "Updated NiasTerminalView.tsx"
}

# 3. NiasOperationalOverviewTab.tsx
$fileOverview = "d:\Dev_PCode\NIAS_LNG_Portal\src\components\locations\nias\NiasOperationalOverviewTab.tsx"
if (Test-Path $fileOverview) {
    $c = [System.IO.File]::ReadAllText($fileOverview, $utf8NoBom)
    
    # Root container
    $c = $c -replace '<div className="w-full space-y-3.5 font-sans text-xs text-slate-950 font-bold animate-in fade-in duration-150">', '<div className="h-full flex flex-col justify-between min-h-0 gap-1.5 w-full font-sans text-xs text-slate-950 font-bold overflow-hidden select-none">'
    
    # Section 1: Toolbar
    $c = $c -replace '<div className="bg-white shadow-none border border-slate-200 rounded-none p-2.5 px-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">', '<div className="shrink-0 win-panel p-1 px-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-1.5">'
    
    # Section 2: 4 KPI Cards
    $c = $c -replace '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">', '<div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">'
    $c = $c -replace '<div className="p-3 space-y-2">', '<div className="p-1.5 space-y-1">'
    
    # Section 3: 5-Node PFD
    $c = $c -replace '<div className="p-3 grid grid-cols-1 md:grid-cols-5 gap-2.5">', '<div className="p-1.5 grid grid-cols-1 md:grid-cols-5 gap-1.5">'
    $c = $c -replace '<div className="p-2.5 space-y-1.5 font-mono text-xs text-slate-950 font-bold">', '<div className="p-1.5 space-y-0.5 font-mono text-[11px] text-slate-950 font-bold">'
    $c = $c -replace '<div className="px-2.5 py-1.5 border-t border-slate-200 text-\[11px\] font-bold text-slate-950 font-bold bg-white shadow-none flex items-center justify-between">', '<div className="px-1.5 py-0.5 border-t border-slate-200 text-[10px] font-bold text-slate-950 font-bold bg-white shadow-none flex items-center justify-between">'
    
    # Section 4: Bottom 2-Col Data Grid
    $c = $c -replace '<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">', '<div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-1.5 overflow-hidden">'
    $c = $c -replace '<div className="win-panel overflow-hidden flex flex-col justify-between">', '<div className="win-panel overflow-hidden flex flex-col justify-between h-full min-h-0">'
    $c = $c -replace '<div className="overflow-x-auto">', '<div className="flex-1 min-h-0 overflow-y-auto win-sunken">'
    $c = $c -replace '<div className="p-3 space-y-3 font-mono text-xs">', '<div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-1.5 font-mono text-xs">'

    [System.IO.File]::WriteAllText($fileOverview, $c, $utf8NoBom)
    Write-Output "Updated NiasOperationalOverviewTab.tsx"
}

# 4. ArunTerminalView.tsx
$fileArun = "d:\Dev_PCode\NIAS_LNG_Portal\src\components\locations\ArunTerminalView.tsx"
if (Test-Path $fileArun) {
    $c = [System.IO.File]::ReadAllText($fileArun, $utf8NoBom)
    $c = $c -replace '<div className="space-y-6 w-full text-slate-900 font-bold">', '<div className="h-full flex flex-col min-h-0 gap-1.5 w-full text-slate-900 font-bold overflow-hidden">'
    $c = $c -replace '<section className="bg-white shadow-none border border-slate-200 rounded-none p-4 sm:p-5 shadow-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4">', '<section className="shrink-0 win-panel p-1.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 select-none">'
    [System.IO.File]::WriteAllText($fileArun, $c, $utf8NoBom)
    Write-Output "Updated ArunTerminalView.tsx"
}

# 5. MvSaviourView.tsx
$fileMv = "d:\Dev_PCode\NIAS_LNG_Portal\src\components\locations\MvSaviourView.tsx"
if (Test-Path $fileMv) {
    $c = [System.IO.File]::ReadAllText($fileMv, $utf8NoBom)
    $c = $c -replace '<div className="flex flex-col gap-6 w-full text-slate-900 font-bold">', '<div className="h-full flex flex-col min-h-0 gap-1.5 w-full text-slate-900 font-bold overflow-hidden">'
    $c = $c -replace '<section className="win-panel p-2.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">', '<section className="shrink-0 win-panel p-1.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 select-none">'
    [System.IO.File]::WriteAllText($fileMv, $c, $utf8NoBom)
    Write-Output "Updated MvSaviourView.tsx"
}

Write-Output "Done applying 100% full viewport height layout."
