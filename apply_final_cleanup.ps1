$utf8NoBom = New-Object System.Text.UTF8Encoding $False

$files = Get-ChildItem -Path "src/components/locations/nias/*.tsx"
$files += Get-Item "src/components/locations/NiasTerminalView.tsx"

foreach ($f in $files) {
    if (Test-Path $f.FullName) {
        $content = [System.IO.File]::ReadAllText($f.FullName, $utf8NoBom)

        # 1. NiasProcessPIDDiagram & Overall backgrounds
        if ($f.Name -eq "NiasProcessPIDDiagram.tsx") {
            $content = $content -replace 'bg-slate-950', 'bg-white border border-slate-200'
            $content = $content -replace 'bg-slate-900', 'bg-white border border-slate-200'
            $content = $content -replace 'text-slate-400', 'text-slate-800'
            $content = $content -replace 'text-white', 'text-slate-900'
        }

        # 2. NiasTerminalView Domain Tabs
        if ($f.Name -eq "NiasTerminalView.tsx") {
            # Active tabs usually had bg-emerald-600, bg-indigo-600, bg-amber-600, or something similar
            $content = $content -replace 'bg-emerald-600 text-white shadow-md', 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm'
            $content = $content -replace 'bg-indigo-600 text-white shadow-md', 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm'
            $content = $content -replace 'bg-amber-600 text-white shadow-md', 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm'
            $content = $content -replace 'bg-blue-600 text-white shadow-md', 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm'
            
            # Since my previous generic replacement might have altered them, let's also catch text-slate-950
            $content = $content -replace 'bg-emerald-600 text-slate-950 font-bold shadow-md', 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm'
            $content = $content -replace 'bg-indigo-600 text-slate-950 font-bold shadow-md', 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm'
            $content = $content -replace 'bg-amber-600 text-slate-950 font-bold shadow-md', 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm'
            
            # Inactive Tabs
            $content = $content -replace 'text-slate-400 hover:text-white', 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            $content = $content -replace 'text-slate-900 hover:text-slate-950 font-bold', 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
        }

        # 3. Translation
        $content = $content -replace '1. 전력 생산 & 부하율', '1. Power Generation & Load Rate'
        $content = $content -replace '2. 가스 소비 & 열효율', '2. Gas Consumption & Heat Rate'
        $content = $content -replace '3. 유효성 재고 & 버퍼', '3. Safety Stock & Buffer'
        $content = $content -replace '4. 정산 수열일치율', '4. Settlement Match Rate'
        
        $content = $content -replace '금일 발전량', 'Daily Power Output'
        $content = $content -replace '총 발전량', 'Total Generation'
        $content = $content -replace '일일 누적 가스 송출량', 'Daily Cumulative Gas Sendout'
        $content = $content -replace '평균 가동 부하 / 열효율', 'Avg Operating Load / Heat Efficiency'
        $content = $content -replace '가동 기동기 수 & 전체 처리량', 'Running Units & Total Throughput'
        $content = $content -replace '조건 정보 확정 완료', 'Operational Data Confirmed'
        $content = $content -replace '정보 입력 바로가기', 'Data Entry (Tab 3)'
        $content = $content -replace '기간별 조회', 'Date Range Query'
        $content = $content -replace '월별 조회', 'Monthly Query'
        
        $content = $content -replace '상태', 'Status'
        $content = $content -replace '압력', 'Pressure'
        $content = $content -replace '온도', 'Temperature'
        $content = $content -replace '유량', 'Flow Rate'

        # More from previous grep outputs
        $content = $content -replace '일일 누적 가스', 'Daily Cumulative Gas'
        $content = $content -replace '송출량', 'Sendout'
        $content = $content -replace '일일 발전량', 'Daily Generation'
        $content = $content -replace '가동 부하', 'Operating Load'
        $content = $content -replace '일치율', 'Match Rate'
        $content = $content -replace '정산', 'Settlement'
        
        $content = $content -replace '연간/월별 조회', 'Yearly/Monthly Query'
        $content = $content -replace '년/월', 'Year/Month'
        
        $content = $content -replace '1월 \(January\)', 'January'
        $content = $content -replace '2월 \(February\)', 'February'
        $content = $content -replace '3월 \(March\)', 'March'
        $content = $content -replace '4월 \(April\)', 'April'
        $content = $content -replace '5월 \(May\)', 'May'
        $content = $content -replace '6월 \(June\)', 'June'
        $content = $content -replace '7월 \(July\)', 'July'
        $content = $content -replace '8월 \(August\)', 'August'
        $content = $content -replace '9월 \(September\)', 'September'
        $content = $content -replace '10월 \(October\)', 'October'
        $content = $content -replace '11월 \(November\)', 'November'
        $content = $content -replace '12월 \(December\)', 'December'
        
        $content = $content -replace '2026년', '2026'
        $content = $content -replace '2025년', '2025'
        
        $content = $content -replace '누적치', 'Cumulative'
        $content = $content -replace '일일치', 'Daily'
        $content = $content -replace '공통', 'Common'
        $content = $content -replace '물리적 성질', 'Physical Properties'
        $content = $content -replace '확정 완료', 'Confirmed'
        $content = $content -replace '검토 중', 'Under Review'
        
        $content = $content -replace '현재가동', 'Active'
        $content = $content -replace '총가동', 'Total Active'
        
        $content = $content -replace '닫기', 'Close'
        $content = $content -replace '해당 서브 탭 이동', 'Go to Sub-Tab'
        
        $content = $content -replace '플로보스', 'FloBoss'
        $content = $content -replace '발전기', 'Generator'
        $content = $content -replace '열효율', 'Heat Efficiency'
        $content = $content -replace '가스화 공정', 'Regasification Process'
        
        $content = $content -replace '년:', 'Year:'
        $content = $content -replace '월:', 'Month:'

        [System.IO.File]::WriteAllText($f.FullName, $content, $utf8NoBom)
        Write-Output "Processed: $($f.Name)"
    }
}
Write-Output "Done."
