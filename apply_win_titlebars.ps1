$utf8NoBom = New-Object System.Text.UTF8Encoding $False

$file = "d:\Dev_PCode\NIAS_LNG_Portal\src\components\locations\nias\NiasOperationalOverviewTab.tsx"
$content = [System.IO.File]::ReadAllText($file, $utf8NoBom)

# Convert all panel header divs in NiasOperationalOverviewTab to win-titlebar
$content = $content -replace 'bg-slate-50 px-3 py-1.5 border-b border-slate-200 font-bold flex justify-between items-center text-slate-950 font-bold', 'win-titlebar'
$content = $content -replace 'bg-slate-50 px-3.5 py-2 border-b border-slate-200 font-bold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 text-slate-950 font-bold', 'win-titlebar'
$content = $content -replace 'bg-slate-50 px-2.5 py-1 border-b border-slate-200 font-bold flex justify-between items-center text-slate-950 font-bold', 'win-titlebar'

# Inside win-titlebar make sure text and icons are white
$content = $content -replace '<Zap className="w-3.5 h-3.5 text-slate-950 font-bold" />', '<Zap className="w-3.5 h-3.5 text-yellow-300" />'
$content = $content -replace '<Flame className="w-3.5 h-3.5 text-slate-950 font-bold" />', '<Flame className="w-3.5 h-3.5 text-orange-300" />'
$content = $content -replace '<Droplets className="w-3.5 h-3.5 text-slate-950 font-bold" />', '<Droplets className="w-3.5 h-3.5 text-cyan-300" />'
$content = $content -replace '<Scale className="w-3.5 h-3.5 text-slate-950 font-bold" />', '<Scale className="w-3.5 h-3.5 text-emerald-300" />'
$content = $content -replace '<Cpu className="w-3.5 h-3.5 text-slate-950 font-bold" />', '<Cpu className="w-3.5 h-3.5 text-cyan-300" />'
$content = $content -replace '<Database className="w-3.5 h-3.5 text-slate-950 font-bold" />', '<Database className="w-3.5 h-3.5 text-yellow-300" />'
$content = $content -replace '<Layers className="w-4 h-4 text-slate-950 font-bold" />', '<Layers className="w-4 h-4 text-white" />'

# Outer containers
$content = $content -replace 'bg-white shadow-none border border-slate-200 rounded-none overflow-hidden', 'win-panel overflow-hidden'

[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
Write-Output "Applied win-titlebar to NiasOperationalOverviewTab.tsx"
