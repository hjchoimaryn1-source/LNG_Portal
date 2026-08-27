$utf8NoBom = New-Object System.Text.UTF8Encoding $False
$file = "d:\Dev_PCode\NIAS_LNG_Portal\src\components\LNGPortalApp.tsx"

$content = [System.IO.File]::ReadAllText($file, $utf8NoBom)

# 1. Breadcrumbs
$content = $content.Replace(
    '<span className="text-white font-bold hidden sm:inline">{currentNav.location}</span>',
    '<span className="text-slate-800 font-semibold hidden sm:inline">{currentNav.location}</span>'
)
$content = $content.Replace(
    '<span className="text-white font-bold hidden sm:inline">/</span>',
    '<span className="text-slate-400 hidden sm:inline">/</span>'
)
$content = $content.Replace(
    '<div className="flex items-center gap-1.5 font-bold text-white font-bold">',
    '<div className="flex items-center gap-1.5 text-slate-800 font-semibold">'
)

# Replace all text-white font-bold with text-slate-800 font-bold inside SUBPROCESS_TITLES
# A bit tricky to scope with pure string replace, so we just replace text-white with text-slate-800 everywhere inside that block
$startIdx = $content.IndexOf("const SUBPROCESS_TITLES")
$endIdx = $content.IndexOf("};", $startIdx)
if ($startIdx -ge 0 -and $endIdx -gt $startIdx) {
    $block = $content.Substring($startIdx, $endIdx - $startIdx)
    $newBlock = $block.Replace("text-white font-bold", "text-slate-800 font-bold")
    $content = $content.Remove($startIdx, $endIdx - $startIdx).Insert($startIdx, $newBlock)
}

# 2. Theme Switcher
$content = $content.Replace(
    "theme === 'PURE_WHITE'`n                      ? 'bg-white text-white font-bold font-bold shadow-sm ring-1 ring-slate-300'`n                      : 'text-white font-bold hover:text-white font-bold'",
    "theme === 'PURE_WHITE'`n                      ? 'bg-white text-blue-700 border border-slate-300 font-bold shadow-xs'`n                      : 'text-slate-600 hover:text-slate-900'"
)
$content = $content.Replace(
    "theme === 'INDUSTRIAL_LIGHT'`n                      ? 'bg-white text-white font-bold font-bold shadow-sm ring-1 ring-slate-300'`n                      : 'text-white font-bold hover:text-white font-bold'",
    "theme === 'INDUSTRIAL_LIGHT'`n                      ? 'bg-white text-blue-700 border border-slate-300 font-bold shadow-xs'`n                      : 'text-slate-600 hover:text-slate-900'"
)
$content = $content.Replace(
    "theme === 'CYBER_DARK'`n                      ? 'bg-slate-800 text-white font-bold font-bold shadow-sm ring-1 ring-slate-700'`n                      : 'text-white font-bold hover:text-white font-bold'",
    "theme === 'CYBER_DARK'`n                      ? 'bg-white text-blue-700 border border-slate-300 font-bold shadow-xs'`n                      : 'text-slate-600 hover:text-slate-900'"
)

$content = $content.Replace(
    '<Sun className="w-3.5 h-3.5 text-white font-bold" />',
    '<Sun className="w-3.5 h-3.5" />'
)
$content = $content.Replace(
    '<CloudSun className="w-3.5 h-3.5 text-white font-bold" />',
    '<CloudSun className="w-3.5 h-3.5" />'
)
$content = $content.Replace(
    '<Moon className="w-3.5 h-3.5 text-white font-bold" />',
    '<Moon className="w-3.5 h-3.5" />'
)

# Theme Switcher Container - update text colors
$content = $content.Replace(
    "'bg-slate-100 border-slate-200 text-white font-bold'",
    "'bg-slate-100 border-slate-200 text-slate-900 font-bold'"
)
$content = $content.Replace(
    "'bg-slate-200/80 border-slate-300 text-white font-bold'",
    "'bg-slate-200/80 border-slate-300 text-slate-900 font-bold'"
)
$content = $content.Replace(
    "'bg-slate-900/90 border-slate-800 text-white font-bold'",
    "'bg-slate-900/90 border-slate-800 text-slate-900 font-bold'"
)

# Total Fleet
$content = $content.Replace(
    '<Radio className="w-3.5 h-3.5 text-white font-bold animate-pulse" />',
    '<Radio className="w-3.5 h-3.5 text-slate-800 animate-pulse" />'
)
$content = $content.Replace(
    '<span className={theme === ''CYBER_DARK'' ? ''text-white font-bold'' : ''text-white font-bold''}>Total Fleet:</span>',
    '<span className="text-slate-800 font-semibold">Total Fleet:</span>'
)
$content = $content.Replace(
    '<span className={`font-mono font-bold ${theme === ''CYBER_DARK'' ? ''text-white font-bold'' : ''text-white font-bold''}`}>',
    '<span className="font-mono font-bold text-slate-900">'
)

# 3. Status Badges
$content = $content.Replace(
    'className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-white font-bold text-xs font-bold hover:bg-amber-500/25 transition-colors"',
    'className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs hover:bg-amber-100 transition-colors"'
)
$content = $content.Replace(
    'className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-white font-bold font-bold text-xs"',
    'className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs"'
)
$content = $content.Replace(
    'className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-white font-bold text-xs font-bold"',
    'className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs"'
)

# Mobile Menu Icon
$content = $content.Replace(
    'className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-bold hover:text-white"',
    'className="lg:hidden p-2 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold hover:bg-slate-50"'
)

[System.IO.File]::WriteAllText($file, $content, $utf8NoBom)
Write-Output "Done updating header."
