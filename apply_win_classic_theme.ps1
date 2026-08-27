$utf8NoBom = New-Object System.Text.UTF8Encoding $False

$files = @()
$files += Get-ChildItem -Path "src/components/*.tsx"
$files += Get-ChildItem -Path "src/components/locations/*.tsx"
$files += Get-ChildItem -Path "src/components/locations/nias/*.tsx"

foreach ($fileItem in $files) {
    $filePath = $fileItem.FullName
    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllText($filePath, $utf8NoBom)

        # 1. Convert all roundings and modern shadows
        $content = $content.Replace('rounded-2xl', 'rounded-none')
        $content = $content.Replace('rounded-xl', 'rounded-none')
        $content = $content.Replace('rounded-lg', 'rounded-none')
        $content = $content.Replace('rounded-md', 'rounded-none')
        $content = $content.Replace('rounded-full', 'rounded-none')
        $content = $content.Replace('shadow-2xl', 'shadow-none')
        $content = $content.Replace('shadow-xl', 'shadow-none')
        $content = $content.Replace('shadow-lg', 'shadow-none')
        $content = $content.Replace('shadow-md', 'shadow-none')
        $content = $content.Replace('shadow-sm', 'shadow-none')

        # 2. Convert standard card containers to win-panel or win-sunken
        $content = $content.Replace('bg-white shadow-sm/80 border border-slate-200 p-5 sm:p-6', 'win-panel p-2.5')
        $content = $content.Replace('bg-white shadow-sm border border-slate-200 p-4 sm:p-5', 'win-panel p-2.5')
        $content = $content.Replace('bg-white shadow-sm border border-slate-200 p-5', 'win-panel p-2.5')
        $content = $content.Replace('bg-white border border-slate-200 p-4', 'win-panel p-2')
        $content = $content.Replace('bg-white border border-slate-200', 'win-panel')
        $content = $content.Replace('bg-slate-50 border border-slate-200', 'win-panel')
        $content = $content.Replace('bg-slate-50 border border-slate-300', 'win-panel')

        # 3. Convert Tabs to Windows 2000/XP Property Sheet Tabs
        $content = $content.Replace('bg-blue-50 text-blue-700 border border-blue-200 font-bold', 'win-tab-active')
        $content = $content.Replace('bg-blue-50 text-blue-700 border border-blue-300 font-bold', 'win-tab-active')
        $content = $content.Replace('bg-emerald-600 text-white border border-emerald-400', 'win-tab-active')
        $content = $content.Replace('bg-blue-600 text-white border border-blue-400', 'win-tab-active')
        $content = $content.Replace('bg-amber-600 text-white border border-amber-400', 'win-tab-active')
        $content = $content.Replace('bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900', 'win-tab-inactive')
        $content = $content.Replace('bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-slate-900', 'win-tab-inactive')

        # 4. Table cell compression for High-Density Grid
        $content = $content.Replace('px-3 py-2.5', 'px-1.5 py-0.5')
        $content = $content.Replace('px-4 py-3', 'px-1.5 py-0.5')
        $content = $content.Replace('px-3 py-2', 'px-1.5 py-0.5')
        $content = $content.Replace('px-2 py-2', 'px-1.5 py-0.5')

        # 5. Buttons to Win32 bevel buttons
        $content = $content.Replace('px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-700 text-xs font-bold', 'win-btn text-xs')
        $content = $content.Replace('px-3.5 py-2 bg-white shadow-sm hover:bg-slate-100 border border-slate-200 text-slate-900 font-bold text-xs', 'win-btn text-xs')
        $content = $content.Replace('bg-blue-600 hover:bg-blue-700 text-white', 'win-btn text-blue-900 font-bold')
        $content = $content.Replace('bg-emerald-600 hover:bg-emerald-700 text-white', 'win-btn text-emerald-900 font-bold')

        # 6. Inputs & Selects to Win32 sunken inputs
        $content = $content.Replace('bg-white border border-slate-300 text-slate-900 text-xs', 'win-input text-xs')
        $content = $content.Replace('bg-white border border-slate-200 text-slate-900 text-xs', 'win-input text-xs')

        [System.IO.File]::WriteAllText($filePath, $content, $utf8NoBom)
        Write-Output "Processed Classic Win32 Theme: $(Split-Path $filePath -Leaf)"
    }
}
Write-Output "All files converted to Windows Classic Enterprise ERP theme."
