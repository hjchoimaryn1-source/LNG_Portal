# scripts/run-cmms-bootstrap.ps1
#
# NIAS CMMS 부트스트랩 파이프라인 원클릭 실행 스크립트.
# 프로젝트 루트에서 실행: .\scripts\run-cmms-bootstrap.ps1
#
# 환경변수를 매번 손으로 치는 대신, 이 파일 안에서 한 번만 정의해두고
# 앞으로는 이 스크립트만 실행하면 된다. CSV 경로가 바뀌거나
# FIXED_EQUIPMENT_CSV(고정설비 실 데이터)가 준비되면 아래 값만 수정하면 된다.

$env:ISO_TANK_STATUS_LOCATION_CSV = "public/data/NIAS - ISO TANK Status, Location.csv"
$env:ISO_TANK_MASTER_DB_CSV = "public/data/NIAS - ISO Tank Master DB.csv"

# 고정설비 실 데이터가 준비되면 아래 줄의 주석을 해제하세요.
# 준비되기 전까지는 주석 처리된 상태로 두면 MockFixedEquipmentDataSource가 자동 사용됩니다.
# $env:FIXED_EQUIPMENT_CSV = "public/data/NIAS - Fixed Equipment Master.csv"

$env:CMMS_SCHEMA_PATH = "schema/cmms_schema.sqlite.sql"
$env:CMMS_DB_PATH = "nias_cmms.db"
$env:CMMS_SNAPSHOT_OUTPUT = "public/data/cmms_asset_snapshot.json"

Write-Host "=== NIAS CMMS 부트스트랩 파이프라인 실행 ===" -ForegroundColor Cyan
npx tsx src/scripts/runBootstrapPipeline.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n완료! public/data/cmms_asset_snapshot.json 확인하세요." -ForegroundColor Green
} else {
    Write-Host "`n파이프라인 실행 중 오류가 발생했습니다. 위 로그를 확인하세요." -ForegroundColor Red
}
