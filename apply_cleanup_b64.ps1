$utf8NoBom = New-Object System.Text.UTF8Encoding $False

$files = @(
    (Get-ChildItem -Path "src/components/locations/nias/*.tsx").FullName
)
$files += (Get-Item "src/components/locations/NiasTerminalView.tsx").FullName

function B64($b64str) {
    return [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($b64str))
}

$dict = @{
    # 1. NiasProcessPIDDiagram & Overall backgrounds
    "bg-slate-950" = "bg-white border border-slate-200"
    "bg-slate-900" = "bg-white border border-slate-200"
    "text-slate-400" = "text-slate-800"
    "text-white" = "text-slate-900"
    
    # 2. NiasTerminalView Domain Tabs
    "bg-emerald-600 text-white shadow-md" = "bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm"
    "bg-indigo-600 text-white shadow-md" = "bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm"
    "bg-amber-600 text-white shadow-md" = "bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm"
    "bg-blue-600 text-white shadow-md" = "bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm"
    
    "bg-emerald-600 text-slate-950 font-bold shadow-md" = "bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm"
    "bg-indigo-600 text-slate-950 font-bold shadow-md" = "bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm"
    "bg-amber-600 text-slate-950 font-bold shadow-md" = "bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm"
    
    "text-slate-400 hover:text-white" = "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
    "text-slate-900 hover:text-slate-950 font-bold" = "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
    
    # Translations (using Base64 for Korean to avoid PS ANSI parsing errors)
    # "1. 전력 생산 & 부하율"
    (B64 "MS4g7KCE66ClIOyDneyCsCAmIOu2gO2VmOycoA==") = "1. Power Generation & Load Rate"
    # "2. 가스 소비 & 열효율"
    (B64 "Mi4g6rCA7IqkIOyGjOu5hCAmIOyXtO2aqOycoA==") = "2. Gas Consumption & Heat Rate"
    # "3. 유효성 재고 & 버퍼"
    (B64 "My4g7Jyg7Zqo7ISxIOyemOqzoCAmIOuyhO2NgA==") = "3. Safety Stock & Buffer"
    # "4. 정산 수열일치율"
    (B64 "NC4g7KCV7IKwIOyImOyXtOydvOy5mOycoA==") = "4. Settlement Match Rate"
    # "금일 발전량"
    (B64 "6riI7J28IOuwnOyghOufiQ==") = "Daily Power Output"
    # "총 발전량"
    (B64 "7ChQIOuwnOyghOufiQ==") = "Total Generation"
    # "일일 누적 가스 송출량"
    (B64 "7J287J28IOuIhOyggSDqsIA7IqkIOyGo+y2nOufiQ==") = "Daily Cumulative Gas Sendout"
    # "평균 가동 부하 / 열효율"
    (B64 "7Y+J6regIOqwgOuPOSDrtoDtlZggLyDsF7TtmqjsnKA=") = "Avg Operating Load / Heat Efficiency"
    # "가동 기동기 수 & 전체 처리량"
    (B64 "6rCA64+ZIOq4sOuPmeq4sCDsiJggJiDsoITssrQg7LKY66as65+J") = "Running Units & Total Throughput"
    # "조건 정보 확정 완료"
    (B64 "7KGw6rG0IOygleq0tCDtmZXsoJUg7JmE66OM") = "Operational Data Confirmed"
    # "정보 입력 바로가기"
    (B64 "7KCV67O0IOyeheugpSDrsJTroZzqsIDquLg=") = "Data Entry (Tab 3)"
    # "기간별 조회"
    (B64 "6riw6rCE67OEIOyhsO2ajA==") = "Date Range Query"
    # "월별 조회"
    (B64 "7JuU67OEIOyhsO2ajA==") = "Monthly Query"
    # "상태"
    (B64 "7IOB7YOc") = "Status"
    # "압력"
    (B64 "7JWV66Cl") = "Pressure"
    # "온도"
    (B64 "7Jio64+E") = "Temperature"
    # "유량"
    (B64 "7Jyg65+J") = "Flow Rate"
    # "일일 누적 가스"
    (B64 "7J287J28IOuIhOyggSDqsIA7Iqk") = "Daily Cumulative Gas"
    # "송출량"
    (B64 "7Iaj7LaccufiQ==") = "Sendout"
    # "일일 발전량"
    (B64 "7J287J28IOuwnOyghOufiQ==") = "Daily Generation"
    # "가동 부하"
    (B64 "6rCA64+ZIOu2gO2VmA==") = "Operating Load"
    # "일치율"
    (B64 "7J287LmY7Jyg") = "Match Rate"
    # "정산"
    (B64 "7KCV7IKw") = "Settlement"
    # "연간/월별 조회"
    (B64 "7Jew6rCEL+y+lOuzhCDsobDtmow=") = "Yearly/Monthly Query"
    # "년/월"
    (B64 "64WEL+y+lA==") = "Year/Month"
    # "1월 (January)"
    (B64 "Mey+lCAoSmFudWFyeSk=") = "January"
    # "2월 (February)"
    (B64 "Miy+lCAoRmVicnVhcnkp") = "February"
    # "3월 (March)"
    (B64 "M+y+lCAoTWFyY2gp") = "March"
    # "4월 (April)"
    (B64 "NOy+lCAoQXByaWwp") = "April"
    # "5월 (May)"
    (B64 "NOy+lCAoTWF5KQ==") = "May"
    # "6월 (June)"
    (B64 "Nuy+lCAoSnVuZSk=") = "June"
    # "7월 (July)"
    (B64 "N+y+lCAoSnVseSk=") = "July"
    # "8월 (August)"
    (B64 "OOy+lCAoQXVndXN0KQ==") = "August"
    # "9월 (September)"
    (B64 "Oey+lCAoU2VwdGVtYmVyKQ==") = "September"
    # "10월 (October)"
    (B64 "MTDsvpQgKE9jdG9iZXIp") = "October"
    # "11월 (November)"
    (B64 "MTHsvpQgKE5vdmVtYmVyKQ==") = "November"
    # "12월 (December)"
    (B64 "MTLsvpQgKERlY2VtYmVyKQ==") = "December"
    # "2026년"
    (B64 "MjAyNuuFhA==") = "2026"
    # "2025년"
    (B64 "MjAyNeuFhA==") = "2025"
    # "누적치"
    (B64 "64iE7KCB7LmY") = "Cumulative"
    # "일일치"
    (B64 "7J287J287LmY") = "Daily"
    # "공통"
    (B64 "6rO17Ya1") = "Common"
    # "물리적 성질"
    (B64 "66y866as7KCBIOyEseyniA==") = "Physical Properties"
    # "확정 완료"
    (B64 "7ZmV7KCVIOyZhOujjA==") = "Confirmed"
    # "검토 중"
    (B64 "6rKA7YagIOyKkQ==") = "Under Review"
    # "현재가동"
    (B64 "7ZiE7J6s6rCA64+Z") = "Active"
    # "총가동"
    (B64 "7ChQ6rCA64+Z") = "Total Active"
    # "닫기"
    (B64 "64u66riw") = "Close"
    # "해당 서브 탭 이동"
    (B64 "7ZW064u5IOyEnOu4jCDtgK0g7J2064+Z") = "Go to Sub-Tab"
    # "플로보스"
    (B64 "7ZSM66Gc67O07Iqk") = "FloBoss"
    # "발전기"
    (B64 "67Cc7KCE6riw") = "Generator"
    # "열효율"
    (B64 "7Je07Zqo7Jyg") = "Heat Efficiency"
    # "가스화 공정"
    (B64 "6rCA7Iqk7ZmUIEdyb2Nlc3M=") = "Regasification Process"
    # "가스화 공정" (correct spelling if without process)
    (B64 "6rCA7Iqk7ZmUIOqzteCghA==") = "Regasification Process"
    # "년:"
    (B64 "64WEOg==") = "Year:"
    # "월:"
    (B64 "7JuUOg==") = "Month:"
}

foreach ($f in $files) {
    if (Test-Path $f) {
        $content = [System.IO.File]::ReadAllText($f, $utf8NoBom)
        
        foreach ($key in $dict.Keys) {
            # simple string replacement
            $content = $content.Replace($key, $dict[$key])
        }

        # Specific component logic
        if ($f -match "NiasProcessPIDDiagram.tsx") {
            # Let's fix the header of the main box
            # original: <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
            # replace text-slate-950 to text-slate-900 if necessary. Actually the dictionary already did some of it.
        }

        [System.IO.File]::WriteAllText($f, $content, $utf8NoBom)
        Write-Output "Processed: $(Split-Path $f -Leaf)"
    }
}
Write-Output "Done."
