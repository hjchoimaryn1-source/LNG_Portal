const fs = require('fs');
const path = require('path');

const niasDir = path.join(__dirname, 'src', 'components', 'locations', 'nias');
const niasTerminalViewPath = path.join(__dirname, 'src', 'components', 'locations', 'NiasTerminalView.tsx');

let files = fs.readdirSync(niasDir)
    .filter(f => f.endsWith('.tsx'))
    .map(f => path.join(niasDir, f));

files.push(niasTerminalViewPath);

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        // 1. Process Diagram backgrounds
        if (file.includes('NiasProcessPIDDiagram.tsx')) {
            content = content.replace(/bg-slate-950/g, 'bg-white border border-slate-200');
            content = content.replace(/bg-slate-900/g, 'bg-white border border-slate-200');
            content = content.replace(/text-slate-400/g, 'text-slate-800');
            content = content.replace(/text-white/g, 'text-slate-900');
        }

        // 2. Domain tabs in NiasTerminalView
        if (file.includes('NiasTerminalView.tsx')) {
            // Active tabs
            content = content.replace(/bg-emerald-600 text-white shadow-md/g, 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm');
            content = content.replace(/bg-indigo-600 text-white shadow-md/g, 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm');
            content = content.replace(/bg-amber-600 text-white shadow-md/g, 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm');
            content = content.replace(/bg-blue-600 text-white shadow-md/g, 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm');
            
            content = content.replace(/bg-emerald-600 text-slate-950 font-bold shadow-md/g, 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm');
            content = content.replace(/bg-indigo-600 text-slate-950 font-bold shadow-md/g, 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm');
            content = content.replace(/bg-amber-600 text-slate-950 font-bold shadow-md/g, 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-sm');
            
            // Inactive tabs
            content = content.replace(/text-slate-400 hover:text-white/g, 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900');
            content = content.replace(/text-slate-900 hover:text-slate-950 font-bold/g, 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900');
        }

        // 3. Translation
        const dict = {
            '1. 전력 생산 & 부하율': '1. Power Generation & Load Rate',
            '2. 가스 소비 & 열효율': '2. Gas Consumption & Heat Rate',
            '3. 유효성 재고 & 버퍼': '3. Safety Stock & Buffer',
            '4. 정산 수열일치율': '4. Settlement Match Rate',
            '금일 발전량': 'Daily Power Output',
            '총 발전량': 'Total Generation',
            '일일 누적 가스 송출량': 'Daily Cumulative Gas Sendout',
            '평균 가동 부하 / 열효율': 'Avg Operating Load / Heat Efficiency',
            '가동 기동기 수 & 전체 처리량': 'Running Units & Total Throughput',
            '조건 정보 확정 완료': 'Operational Data Confirmed',
            '정보 입력 바로가기': 'Data Entry (Tab 3)',
            '기간별 조회': 'Date Range Query',
            '월별 조회': 'Monthly Query',
            '상태': 'Status',
            '압력': 'Pressure',
            '온도': 'Temperature',
            '유량': 'Flow Rate',
            '일일 누적 가스': 'Daily Cumulative Gas',
            '송출량': 'Sendout',
            '일일 발전량': 'Daily Generation',
            '가동 부하': 'Operating Load',
            '일치율': 'Match Rate',
            '정산': 'Settlement',
            '연간/월별 조회': 'Yearly/Monthly Query',
            '년/월': 'Year/Month',
            '1월 \\(January\\)': 'January',
            '2월 \\(February\\)': 'February',
            '3월 \\(March\\)': 'March',
            '4월 \\(April\\)': 'April',
            '5월 \\(May\\)': 'May',
            '6월 \\(June\\)': 'June',
            '7월 \\(July\\)': 'July',
            '8월 \\(August\\)': 'August',
            '9월 \\(September\\)': 'September',
            '10월 \\(October\\)': 'October',
            '11월 \\(November\\)': 'November',
            '12월 \\(December\\)': 'December',
            '2026년': '2026',
            '2025년': '2025',
            '누적치': 'Cumulative',
            '일일치': 'Daily',
            '공통': 'Common',
            '물리적 성질': 'Physical Properties',
            '확정 완료': 'Confirmed',
            '검토 중': 'Under Review',
            '현재가동': 'Active',
            '총가동': 'Total Active',
            '닫기': 'Close',
            '해당 서브 탭 이동': 'Go to Sub-Tab',
            '플로보스': 'FloBoss',
            '발전기': 'Generator',
            '열효율': 'Heat Efficiency',
            '가스화 공정': 'Regasification Process',
            '년:': 'Year:',
            '월:': 'Month:'
        };

        for (const [kr, en] of Object.entries(dict)) {
            // Using regex to replace all occurrences if needed, or simple replace
            const regex = new RegExp(kr, 'g');
            content = content.replace(regex, en);
        }

        fs.writeFileSync(file, content, 'utf8');
        console.log(`Processed: ${path.basename(file)}`);
    }
}
console.log('Done.');
