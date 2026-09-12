# Nias Onshore LNG Regasification Terminal - PTW & Safety Form Specifications
## [Safety & PTW (Permit to Work) Module Rules: Form Requirements Specification]

본 설계 규격 정의서는 Nias Onshore LNG 재기화 시설(Regasification Facility) 및 PLTMG 연계 운영 프로그램의 현장 안전 관리 시스템 구축에 필요한 **각 작업허가서(PTW) 종류별 세부 서식(Form) 구성 요건**을 정의합니다. 

본 문서는 업로드된 55개의 프로젝트 소스 문서(표준조업절차서, 안전지침서, 현장 체크리스트 등)를 전수 교차 분석하여 작성되었습니다. 

---

### ⚠️ [중요 안내] 100% 사실 기반 검증에 따른 소스 문서 식별 한계 (Zero Hallucination)
1. **NP07 계열 허가서 본문의 소스 부재**: 사용자가 질의하신 **Cold Work Permit (NP07-10), Hot Work Permit (NP07-11), Confined Space Entry Permit (NP07-12), Electrical / LOTO Permit (NP07-13), Excavation Permit (NP07-14), Radiography Permit (NP07-15)** 등의 개별 양식 본문은 본 프로젝트의 "NP-08(Onshore Cargo Handling & Operational Procedure)" 및 관련 부록 소스 내에 **물리적 서식 템플릿(Form Template)으로 포함되어 있지 않습니다** (문서 내 확인 불가).
2. **현장 확인된 대체 안전 서식 및 검증 체계 전수 추출**: 본 설계정의서에서는 상기 NP07 계열 허가서 본문 양식을 가상으로 창작하지 않으며, 실제 NP08 소스 내에 인쇄되어 작동 중인 **안전 예방 조치 서식(NP08-21), 가스 계측 로그(NP08-15), 계량 교정 준비 체크리스트(NP08-31), STS 및 리프팅 사전 조업 체크리스트(NP08-32), 하역 스키드 사전 체크리스트(NP08-09), 접지 점검표(NP08-10), 탈압 점검표(NP08-14), 호스/QCC 결속 점검표(NP08-11), ISO 탱크 인수/인도 검사 양식(NP08-01, NP08-02)** 등의 실제 현장 양식 구조와 필수 데이터 기입란, 체크박스 및 서명란 요건을 원문 그대로 전수 추출하여 명시합니다.

---

## 1. 안전 예방 조치 및 승인 서식 (Form NP08-21)
대기식 기화기(Ambient Air Vaporizer) 정비 및 운전 전 안전 예방 조치를 검증하기 위해 실제 현장에서 발급 및 서명하는 양식입니다. 이 서식은 **작업허가서(PTW) 검증과 승인 서식의 역할을 겸하도록** 설계되어 있습니다.

### ① 서식 구조 및 데이터 항목 매핑

| 서식 섹션 | 구성 항목명 (원문 명칭) | 데이터 타입 및 입력 형태 | 세부 설명 및 물리 조건 한계치 | 소스 근거 (Citations) |
| :--- | :--- | :--- | :--- | :--- |
| **기본 헤더 정보** | Form No. / Rev / Date | 텍스트 / 날짜 | 서식 관리 번호, 개정 번호, 발급 일자 | `NP08-21` 헤더 블록 |
| | Equipment Name | 텍스트 입력 | 장비명: **Ambient Air Vaporizer (AAV)** | `NP08-21` Item 1 |
| | Tag Number / Location | 텍스트 입력 | 장비 고유 태그 번호 및 물리적 위치 기입 | `NP08-21` Item 1 |
| | Process Medium | 텍스트 고정 | 프로세스 유체: **LNG / NG** | `NP08-21` Item 1 |
| | Operating Pressure | 숫자 입력 | 운전 압력 기입란 (**bar(g)** 단위) | `NP08-21` Item 1 |
| | Operating Temperature | 숫자 입력 | 운전 온도 기입란 (**°C** 단위) | `NP08-21` Item 1 |
| **HSE 및 위험 예방 조치** | Cryogenic Hazard | 체크박스 (Y/N) | • 액화가스 노출 예방 조치 확인<br>• **cryogenic gloves, face shield, insulated PPE** 사용 필수 | `NP08-21` Item 2 |
| (Precaution Checklist) | Cold Surface Contact | 체크박스 (Y/N) | • 저온 배관 및 핀(Fin) 직접 접촉 방지 조치 확인<br>• APD(PPE) 없이 접촉 절대 금지 | `NP08-21` Item 3 |
| | Pressure Hazard | 체크박스 (Y/N) | • 기화기 내부 고압 천연가스 위험 인지<br>• **PSV 및 Vent Valve** 정상 가동 상태 점검 | `NP08-21` Item 4 |
| | Gas Leak | 체크박스 (Y/N) | • LNG 누출 가능성 대비 점검<br>• 작업 전 **Leak Test & Gas Detection** 이행 여부 | `NP08-21` Item 5 |
| | Fire & Ignition Source | 체크박스 (Y/N) | • 가연성 가스 분위기 형성 방지 조치<br>• 해당 구역 내 흡연 및 api open (Open Flame/Spark) 전면 금지 | `NP08-21` Item 6 |
| | Ice Formation | 체크박스 (Y/N) | • 기화기 공기 흐름 방해 얼음(성은) 검사<br>• 필요 시 물리적 제거 조치 확인 | `NP08-21` Item 7 |
| | Working at Height | 체크박스 (Y/N) | • 기화기 상부(Upper Area) 접근 시 추락 방지망/그네식 벨트 체결 확인<br>• **PTW System** 이행 상태 확인 | `NP08-21` Item 8 |
| | Noise | 체크박스 (Y/N) | • 가스 팽창 시 발생하는 소음 위해성 점검<br>• 귀마개(Ear Protection) 착용 또는 안전 거리 유지 | `NP08-21` Item 9 |
| | Condensate Drain | 체크박스 (Y/N) | • 기화기 핀 주위 응축수 고임 확인<br>• 안전 수거 지점(Safe Collection Point)으로 배수 여부 | `NP08-21` Item 10 |
| | Gas Emission | 체크박스 (Y/N) | • 무단 가스 방출 방지 확인<br>• **Proper Venting 또는 Flare Connection** 연결 이행 | `NP08-21` Item 11 |
| | Waste Handling | 체크박스 (Y/N) | • 동결 오물 또는 파손 단열재 폐기 상태 점검<br>• 환경 폐기물 관리 SOP 준수 배출 | `NP08-21` Item 12 |
| **단계별 검증 색션** | Work Permit (Hot/Cold) | Y / N / Remarks | 작업허가서(PTW) 발급 유효성 최종 점검 | `NP08-21` VERIFICATION 1 |
| (Verification Block) | Gas Test Result | Y / N / Remarks | 가스 검지 수행 완료 여부 확인 | `NP08-21` VERIFICATION 2 |
| | PPE Inspection | Y / N / Remarks | 특수 보호구(Cryogenic/Insulated) 상태 검증 | `NP08-21` VERIFICATION 3 |
| | Environmental Check | Y / N / Remarks | 주변 환경 및 오염물질 유출 방벽 상태 점검 | `NP08-21` VERIFICATION 4 |
| **승인 및 권한 부여** | Operator | 성명 / 서명 / 날짜 | 현장 작업자 확인 및 서명란 | `NP08-21` AUTHORIZATION 1 |
| (Authorization Block) | Supervisor | 성명 / 서명 / 날짜 | 현장 감독자(Supervisor/Work Leader) 서명란 | `NP08-21` AUTHORIZATION 2 |
| | HSE Officer | 성명 / 서명 / 날짜 | HSE 담당자 안전 요건 검증 서명란 | `NP08-21` AUTHORIZATION 3 |
| | Site Manager | 성명 / 서명 / 날짜 | **최종 발급 승인권자(Site Manager)** 서명란 | `NP08-21` AUTHORIZATION 4 |

---

## 2. 계량 설비 정비 및 교정 준비 서식 (Form NP08-31)
가스 판매 계량 스키드(Metering Skid M-101A/B)의 분해, 점검 및 마스터 미터 교정 작업을 착수하기 전 **작업 격리와 안전 대책을 최종 검증하는 발급 서식**입니다.

### ① 서식 구조 및 데이터 항목 매핑

| 서식 섹션 | 구성 항목명 (원문 명칭) | 데이터 타입 및 입력 형태 | 세부 설명 및 물리 조건 한계치 | 소스 근거 (Citations) |
| :--- | :--- | :--- | :--- | :--- |
| **기본 헤더 정보** | Form No. / Rev / Date | 텍스트 / 날짜 | 서식 식별 번호 및 개정일자 | `NP08-31` 헤더 블록 |
| **안전 준비 점검 요건** | Documentation | 체크박스 (Y/N) | • P&ID 계량 계통도 최신본 확인<br>• Duty/Standby Dual Line(Run A/B) 선회 가능 여부 | `NP08-31` Item 1 |
| (Preparation Checklist) | PTW & JSA | 체크박스 (Y/N) | • 본 정비/교정 작업 전용 **PTW, JSA, Risk Assessment** 승인 상태 점검 (Site Manager 최종 승인 확인) | `NP08-31` Item 2 |
| | HSE Approval | 체크박스 (Y/N) | • 작업 착수 전 HSE Officer의 서명 승인 획득 여부 | `NP08-31` Item 3 |
| | Communication | 체크박스 (Y/N) | • Control Room 및 Offtaker(PLN Nias) 교정 일정 통보 여부<br>• 오퍼레이터-DCS 간 무전기 전용 채널 확보 | `NP08-31` Item 4 |
| | Tools & Equipment | 체크박스 (Y/N) | • 교정 장비(Master Meter/Prover), 연결 케이블, 피팅 장치 완비 확인 • 교정 장비의 교정 필 검교정 라벨 유효성 검증 | `NP08-31` Item 5 |
| | Isolation Tools | 체크박스 (Y/N) | • 물리 격리를 위한 **LOTO Lockout Kit, Tag, 전용 스패너** 구비 완료 여부 | `NP08-31` Item 6 |
| | Gas Test | 체크박스 (Y/N) | • 계량 스키드 주변 가스 농도 측정 여부 (**LEL < 10% 미만 분위기 보장**) | `NP08-31` Item 7 |
| | Work Area | 체크박스 (Y/N) | • 작업 구역 주위 안전 바리케이드 설치 및 경고 표지판 거치 상태 | `NP08-31` Item 8 |
| | PPE | 체크박스 (Y/N) | • 작업자 전원 개인 보호구(안전모, 보안경, 장갑, 정전기 방지 Coverall, 안전화) 정상 착용 상태 | `NP08-31` Item 9 |
| **격리 및 검증 섹션** | Work Permit (Hot/Cold) | Status / Checked By | PTW 유효 기간 및 작업 일치 상태 교차 검증 | `NP08-31` VERIFICATION 1 |
| (Verification Block) | Gas Test Result | Status / Checked By | AGT 가스 테스트 측정 기록부 대조 확인 | `NP08-31` VERIFICATION 2 |
| | PPE Inspection | Status / Checked By | 방폭 및 화학 보호 용구 최종 점검 상태 기록 | `NP08-31` VERIFICATION 3 |
| | Environmental Check | Status / Checked By | 응축수 배출 라인 밀폐 및 가스 가압 방지 확인 | `NP08-31` VERIFICATION 4 |
| **승인 및 발행 권한** | Operator | 성명 / 서명 / 날짜 | 현장 가동 및 준비 조치 이행자 서명 | `NP08-31` AUTHORIZATION 1 |
| (Authorization Block) | Supervisor | 성명 / 서명 / 날짜 | 현장 운영 검토자 서명 (Operation Team Lead) | `NP08-31` AUTHORIZATION 2 |
| | HSE Officer | 성명 / 서명 / 날짜 | 안전 격리 상태 현장 실사 및 승인 서명 | `NP08-31` AUTHORIZATION 3 |
| | Site Manager | 성명 / 서명 / 날짜 | **교정 및 정비 착수 최종 허가 승인(Site Manager)** | `NP08-31` AUTHORIZATION 4 |

---

## 3. STS 및 크레인 리프팅 작업허가 전 체크리스트 (Form NP08-32)
Ship-to-Ship (STS) LNG ISO 탱크 해상 이송 및 크레인 중량물 인양 작업을 착수하기 전, 해상 선박과 육상 설비 간의 안전 결합성과 PTW 발행 여부를 종합적으로 점검하는 **STS 전용 작업허가 사전 체크리스트**입니다.

### ① 서식 구조 및 데이터 항목 매핑

| 서식 섹션 | 구성 항목명 (원문 명칭) | 데이터 타입 및 입력 형태 | 세부 설명 및 물리 조건 한계치 | 소스 근거 (Citations) |
| :--- | :--- | :--- | :--- | :--- |
| **기본 헤더 정보** | Vessel (Mother Vessel) | 텍스트 입력 | 모선명 기입: **MV. SAVIOR** 고정 | `NP08-32` 헤더 블록 |
| | Barge Name / Tugboat Assigned | 텍스트 입력 | 입항 Barge 이름 및 예인 Tugboat 명칭 기입 | `NP08-32` 헤더 블록 |
| | Date / Time | 날짜 / 시간 | 조업 일자 및 정확한 착수 시각 | `NP08-32` 헤더 블록 |
| | STS Position (GPS) / Location | 텍스트 / 좌표 | STS 해상 좌표 위치 및 지정 Lightering Area 기입 | `NP08-32` 헤더 블록 |
| | Weather Condition | 텍스트 입력 | 현장 실시간 기상 상태 (풍속, 파고, 조석 등) | `NP08-32` 헤더 블록 |
| **문서 및 인허가 준수** | STS Operation Permit (Syahbandar) | Verification / Remarks | Syahbandar(Syahbandar Syahbandar Port Authority) 정식 해상 작업 승인서 유효성 확인 | `NP08-32` Section 1.1 |
| (Documentation & Permit) | PTW STS + Lifting | Verification / Remarks | **해상 STS 조업 및 Lifting 전용 고위험 PTW 발급 상태** | `NP08-32` Section 1.2 |
| | Cargo Manifest (Packing List) | Verification / Remarks | LNG ISO 탱크 일련번호, 만충 중량 명세 대조 수령 | `NP08-32` Section 1.3 |
| | Crew list exchanged / Risk Assessment | Verification / Remarks | 모선-바지선 간 선원 명단 교환 및 위험성평가 완료 | `NP08-32` Section 1.4, 1.5 |
| | JSA Signed / ERP Reviewed / TBT | Verification / Remarks | JSA 최종 서명, 비상계획 검토, 작업 전 TBT 서명 | `NP08-32` Section 1.6~1.8 |
| **통신 시스템 검증** | VHF primary channel confirmed | Status / Remarks | 선박 무전기 메인 채널 주파수 수신 성능 검증 | `NP08-32` Section 2.1 |
| (Communication Check) | UHF handheld test completed | Status / Remarks | 휴대용 무전기 감도 및 통신 음량 현장 검사 | `NP08-32` Section 2.2 |
| | Emergency communication line | Status / Remarks | 비상 셧다운용 비상 연락망 테스트 | `NP08-32` Section 2.3 |
| | Crane-Rigging hand signal Verified | Status / Remarks | 크레인 기사와 Rigging 신호수 간 수신호 일치 확인 | `NP08-32` Section 2.4 |
| | STOP WORK Command Protocol | Status / Remarks | **불안전 상태 발생 시 누구나 '작업 중지' 발동 프로토콜 숙지** | `NP08-32` Section 2.5 |
| **선박 및 바지선 상태** | MV Savior mooring stable | Status / Remarks | 모선 홋줄(Mooring line) 긴장도 및 계류 안정성 확인 | `NP08-32` Section 3.1 |
| (Vessel & Barge Condition) | Barge positioned & secured by tug | Status / Remarks | 예인선에 의해 바지선이 안전하게 위치 및 밀착 정위치 | `NP08-32` Section 3.2 |
| | Fender arrangements correct | Status / Remarks | 모선-바지선 간 완충용 대형 펜더 배치 적정성 | `NP08-32` Section 3.3 |
| | Deck free of obstruction / Escape Route | Status / Remarks | 작업용 갑판 통로 내 장애물 전면 치우기, 비상 대피로 확보 | `NP08-32` Section 3.4, 3.5 |
| **안전 방재 장비 검증** | Fire extinguishers (DCP & CO2) | Verification / Remarks | 현장 분말/이산화탄소 소화기 압력계 정상 상태 확인 | `NP08-32` Section 4.1 |
| (Safety Equipment Check) | Gas Detector calibrated (CH4) | Verification / Remarks | 휴대 가스 검지기의 메탄 교정 성적 확인 및 가동 상태 | `NP08-32` Section 4.2 |
| **인양 도구 및 하드웨어** | Sling Condition / Shackles pinned | Verification / Remarks | 와이어 로프 슬링 파손 검사, 샤클 핀 고정상태 점검 | `NP08-32` Section 5.1, 5.2 |
| (Lifting Gear Inspection) | Spreader bar certified | Verification / Remarks | **ISO 탱크 전용 Spreader Bar의 12개월 내 검정 여부** | `NP08-32` Section 5.3 |
| | Crane SWL | 숫자 입력 (tons) | 사용 크레인의 안전하중 한계 정량 기입란 | `NP08-32` Section 5.4 |
| | Pre-lift test completed | Verification / Remarks | **ISO 탱크를 지면에서 20~30cm 살짝 들어 올려 수평과 브레이크 및 중량 밸런스를 검증하는 테스트 이행** | `NP08-32` Section 5.5 |
| **작업자 준비 상태 검증** | Pre-job briefing completed | Status / Remarks | 인양 작업자 전용 사전 브리핑 완료 상태 확인 | `NP08-32` Section 6.1 |
| (Personnel Readiness) | All personnel wearing PPE | Status / Remarks | 작업자 면장갑 금지(안전 가이드 준수), 면 Coverall, 차단 턱끈 안전모, 보안경, 정전기 방지 안전화 착용 | `NP08-32` Section 6.2 |
| | Fire watch stationed | Status / Remarks | **화재 예방 감시자(Fire Watch) 전담 요원 실시간 배치 확인** | `NP08-32` Section 6.4 |
| **최종 서명 및 승인** | Super Cargo Leader | 성명 / 서명 / 날짜 | **슈퍼카고 리더(Super Cargo Leader) 최종 승인 및 시간 기록** | `NP08-32` 승인 블록 |

---

## 4. 하역 스키드 가동 전 안전 점검 서식 (Form NP08-09)
LNG 하역을 개시하기 전, 하역 현장에 설치된 모든 안전 장벽과 밸브 격리 상태가 준비되었는지 현장 작업자와 리더가 직접 서명 검증하는 **하역 가동전 안전 점검표**입니다.

### ① 서식 구조 및 데이터 항목 매핑

* **헤더 정보**: 하역 스키드 번호 (Unloading Skid Number), 점검 일자 (Date)
* **세부 점검 리스트 (18개 필수 질문 항목 - Yes / No / Remarks 선택형 구조)**:
  1. Area around skid free from ignition sources? (하역 스키드 주변 반경에 오픈 플레임, 비인가 작업 등 점화원 유무 점검)
  2. Skid area clear of tools and other objects? (하역 구역에 흩어져 있는 자재, 이물질 전면 청소 여부)
  3. Are there any leaks on the skid? (배관, 밸브 플랜지 가스 누출 징후 유무 육안/가스 검지 확인)
  4. Has the crew used appropriate PPE? (작업 요원 전원 극저온 자켓, 내한 보호 장갑, 보안경 등 표준 APD 착용 상태)
  5. Is the PSV skid operating normally? (스키드 상 PSV 안전 밸브의 기계적 파손이나 패싱 징후 없음 확인)
  6. Is the gas detector on the skid operating normally? (가스 누출 검지기의 무경보(No Alarm) 및 작동 상태 점검)
  7. Is the flame detector on the skid operating normally? (불꽃 감지기의 정상 가동 상태 점검)
  8. Is the ambient temperature transmitter operating normally? (스키드 반경 내 온도 지시기 가동 상태 점검)
  9. Are the emergency shower and eyewash working? (비상 안구 세척기 수압 및 정상 물 흐름 현장 토출 검사)
  10. Are the fire extinguishers working properly? (휴대용 분말 소화기 지시 압력계 정상 범위 위치 확인)
  11. Are the fire hydrants working properly? (소방 주배관 압력 확보 및 가동 준비 상태 확인)
  12. Are cryogenic suits, face shields, and safety boots available in the skid? (극저온 비상 유출 방재를 위한 Cryo Suit 세트 비치 상태)
  13. Are the flexible hoses and safety valves (QCC) working properly? (초저온 호스 균열 없음 및 QCC 기계적 결속 상태 확인)
  14. Has the QCC been cleaned? (QCC 커플러 씰링 립 내부 수분 및 이물질 전면 청소 이행 완료)
  15. Is the pressure in the LNG line on the skid operating normally? (DCS와 현장 지시기 상의 LNG 공급 헤더 라인 압력 정상 확인)
  16. Is the pressure in the BOG line on the skid operating normally? (BOG 회수 라인 잔류 압력 상태 정상 검사)
  17. Is the pressure in the PBU line on the skid operating normally? (가압용 PBU 배관의 압력 안정성 점검)
  18. Are the following valves closed? (가동 전 다음 밸브가 폐쇄 상태인지 직접 핸들 휠 회전 검증):
      - LNG 토출 라인 차단 밸브: **BV-042 / BV-044 / BV-046 / BV-048**
      - BOG 라인 차단 밸브: **BV-038 / BV-039 / BV-040 / BV-041**
      - PBU 라인 차단 밸브: **(BV-107 & BV-065) / (BV-108 & BV-066)**
* **단계별 서명란 구성**:
  - Field Operator (Day Shift / Night Shift 전용 수필 서명 및 이름 기재란)
  - Lead Operator (Day Shift / Night Shift 전용 검증 서명 및 이름 기재란)
* **출처 및 규격**: `NP08-09 Pre-Startup Checks for LNG Unloading Skid Checklist.csv` / `NP08-04` 7.1조

---

## 5. 정전기 접지 루프 및 안전 감압 점검 서식 (Form NP08-10, NP08-14)
고위험 극저온 유체를 이송 및 탈거하기 전, 물리적 정전기 스파크 전면 예방과 배관 내 가스 축적 에너지를 제로화하는 단계에서 사용하는 **접지 및 감압 정밀 점검 서식**입니다.

### ① Grounding Checklist (Form NP08-10) 서식 구조
* **헤더 정보**: Unloading Skid Number (스키드 번호), Date (검증 일자)
* **필수 점검 항목 (7개 체크박스 요건 - Yes / No / Remarks)**:
  1. Work area free from open flame sources? (현장 점화원 차단 안전 상태 확인)
  2. Grounding cable & clamp in good condition, no damage? (접지 구리 케이블 손상 및 고정 클램프 파손 여부)
  3. Permanent grounding point available on skid? (스키드 프레임 상 정식 영구 접지 포인트 확보 여부)
  4. Isotank grounding cable properly connected? (ISO 탱크 바디와 접지 단자 간의 물리 결속 이행 완료)
  5. Grounding clamp securely attached, not loose? (바람이나 진동에 풀리지 않도록 접지 클램프 밀착 조임)
  6. Bonding cable from hose/loading arm connected? (초저온 호스 플랜지와 파이프라인 매니폴드 간 정전기 본딩 본딩선 결속)
  7. **Grounding resistance measured (< 5 Ohm)**? (**가장 핵심 항목: 접지 저항 측정기를 이용하여 물리 저항값이 5 Ohm 미만으로 원활히 흐르는지 계측기 수치 입력**)
* **서명 권한**: Field Operator 서명란, Lead Operator 서명란 (Day/Night Shift 구분)
* **출처 및 규격**: `NP08-10 Grounding Checklist.csv` / `NP08-04` 7.2조

### ② Depressurize Checklist (Form NP08-14) 서식 구조
* **헤더 정보**: Unloading Skid (스키드 명칭), Shift (Day/Night Shift), Date (작업 일자)
* **실시간 물리 파라미터 로깅란**:
  - Start Time / Finish Time (감압 개시 시각 및 완전 도달 시각)
  - Before Pressure / After Pressure (감압 전 압력 및 감압 후 게이지 압력)
* **감압 전 필수 안전 확인 (Before Connect/Disconnect Hoses - Y/N/Remarks)**:
  1. Ensure LNG transfer completed (DCS 및 오퍼레이션 리더의 이송 작업 완료 명령 대조 확인)
  2. Liquid line valves closed (액체 액체 공급 메인 밸브 완전 잠금 확인)
  3. Vent line valves ready (감압용 벤트 밸브 계통 상태 양호 점검)
  4. Grounding still connected (호스 탈거 전 접지 케이블은 반드시 유지되고 있어야 함)
* **감압 후 잔류 위험 검증 (After Depressurize ISO Tank - Y/N/Remarks)**:
  5. **ISO Tank safe pressure (<0.05 MPa)**? (컨테이너 내 잔류 가스 압력이 **0.05 MPa 또는 0.4 barg 이하** 안전치 강하 검증)
  6. No gas leakage detected? (벤트 밸브 주위 가연성 가스 분위기 형성 제로 가스 계측 검증)
  7. Hose ready for disconnection? (배관 결빙이 풀리고 얼음 성에가 녹아 호스 연결부 분리 상태 완료)
  8. **The grounding was removed last** (접지 해제는 다른 모든 배기관 호스 분리가 끝난 뒤 **가장 마지막에 수행**해야 함)
* **서명 권한**: Field Operator 서명란, Operation Leader 서명란
* **출처 및 규격**: `NP08-14 Depressurize Checklist.csv` / `NP08-04` 7.5조

---

## 6. 초저온 호스 및 QCC 결속 검증 서식 (Form NP08-11)
LNG 하역을 위한 플렉시블 호스와 퀵 클로저 커플러(QCC)를 연결하고 운전 중 안전 정합성을 모니터링하기 위한 **연결 및 조업 상시 점검표**입니다.

### ① 서식 구조 및 데이터 항목 매핑

* **헤더 정보**: Unloading Skid (하역 스키드 ID), Date (점검 일자)
* **단계별 점검 항목 (15개 필수 항목 - OK / Not OK / Remarks)**:
  - **Hose 연결 전 검증 (Before Connect Flexible Hose)**:
    1. Hose condition (no cracks/tears): 호스 표면에 마모, 미세 균열, 크랙이 없는지 육안 실사 이행.
    2. Quick Close Coupler condition: QCC 수형 플랜지의 턱 손상, 마모, 변형 유무 정밀 점검.
    3. Gasket/seal (Intact, elastic): 초저온용 테프론/금속 씰 가스켓이 닳거나 찢김이 없는지 확인하고 탄성 검사.
    4. Line valve (Tightly sealed): 연결 대상 스키드 인입 수동/자동 차단 밸브의 밀폐 차단 상태 확인.
    5. Grounding & bonding (Installed): 정전기 영구 접지 장치와 본딩 케이블이 완벽히 장착되었는지 선행 점검.
    6. Work permit/Permit to operate (Available & valid): **해당 정비 또는 하역 이송 허가서(PTW)가 적법하게 활성화되어 있는지 유효 기간 대조**.
    7. Work area (Free from ignition sources, safe): 하역 반경 내 위험 점화원이 격리되었는지 최종 실사.
    8. Cryogenic PPE (Complete for use): 작업 요원 전원 전면 보호면(Face Shield), 내한 보호 재킷, 극저온 장갑 완비 상태 착용 확인.
  - **이송 조업 중 상시 검증 (During Operation)**:
    9. No LNG leaks (Visual / gas detector): 초저온 호스 씰 부위 미세 분출 유무 및 가스 감지기 지시 모니터링.
    10. No excessive icing (Hose surface): 호스 외벽 표면에 급격한 결빙 막힘이나 크랙을 유발하는 이상 두꺼운 얼음 형성 유무.
    11. Pressures within normal limits: 이송 중 라인 가압 압력이 설계 평형 범위(**0.75 MPa**) 내에서 흔들림 없이 가동되는지 확인.
  - **조업 마감 및 호스 탈거 검증 (After Disconnect Flexible Hose)**:
    12. Hose has been drained and depressurized (Hose 내부 LNG 액 드레인 및 잔류 압력 0.0 MPa 도달 확인).
    13. No LNG remains (Hose 내부에 어떠한 액체 상태 kargo도 잔류하지 않고 완벽하게 가스 팽창 배출 완료 확인).
    14. Hose not damaged after use: 고온 회복 시 호스의 기계적 꺾임(Kinking)이나 변형이 없는지 탈거 후 재검사.
    15. **The grounding was removed last**: 접지 휨 방지를 위해 클램프 해제는 가장 마지막 이행 준수.
* **서명 권한**: Field Operator 서명 및 날짜, Lead Operator 서명 및 날짜 (Day/Night Shift 전용 필드)
* **출처 및 규격**: `NP08-11 Flexible Hose and Quick Close Coupler Connection Checklist.csv` / `NP08-06` 5조

---

## 7. 가연성 및 유독 대기 가스 모니터링 서식 (Form NP08-15)
고위험 LNG 하역 스키드(Unloading Skid T-201~T-204) 주변 작업 분위기의 생명 안전 정합성을 유지하기 위해 교대 안전 요원 및 AGT가 직접 가스를 포집하여 로깅하는 **대기 가스 모니터링 로그북**입니다.

### ① 서식 구조 및 데이터 항목 매핑

* **헤더 정보**: Unit (점검 대상 Unloading Skid), Date (일자), Shift (Day Shift / Night Shift)
* **실시간 대기 계측 데이터 로깅 매트릭스**:
  - 측정 시간 축: **04:00:00, 08:00:00, 12:00:00, 16:00:00, 20:00:00 등 매 4시간 주기 계측**
  - 측정 기기 위치: **Unloading Skid T-201, T-202, T-203, T-204**
  - 계측 가스 화학적 항목 및 가동 허용 기준치:

| 계측 가스 성분 | 서식 표기 단위 | 안전 운전 허용 범위 (Safe Operating Band) | 이상 초과 시 긴급 비상 대처 수칙 | 소스 근거 (Citations) |
| :--- | :--- | :--- | :--- | :--- |
| **황화수소 (\(H_2S\))** | **ppm** | **0 ppm (Safe atmosphere)** *(※ 가스 감지 지시치 無 검출 전제)* | • 누출 부위 긴급 LOTO 격리<br>• ERT 가동 및 호흡 보호구 탈착 금지 | `NP08-15` 헤더, `NP08-08` 8.4조 |
| **일산화탄소 (\(CO\))** | **ppm** | **0 ppm (Safe atmosphere)** *(※ 화재 징후 유출 제로 보장)* | • 소방전 즉시 가압 대비<br>• 비필수 오퍼레이터 대피 | `NP08-15` 헤더, `NP08-08` 8.3조 |
| **산소 농도 (\(O_2\))** | **%** | **≥ 19.5% ~ 23.5%** *(※ 산소 부족 분위기 19.5% 미만 질식 한계)* | • **O₂ < 19.5% 미만 구역은 공기호흡기(SCBA) 미착용자 진입 절대 금지** | `NP08-15` 헤더, `NP08-08` 8.4조 |
| **가연성 가스 (LEL)** | **%** | **< 10% LEL** *(※ 경보 울림 폭발 상한 분위기 형성 원천 격리)* | • **LEL ≥ 10% 도달 시 하역 밸브 긴급 수동 ESD 폐쇄, 50m Muster Station 전원 대피** | `NP08-15` 헤더, `NP08-08` 8.2조 |

* **서명 권한 및 검인**: Field Operator 자필 서명, Operation Leader 자필 서명 검토
* **출처 및 규격**: `NP08-15 Atmospheric Gas Monitoring Log Sheet.csv` / `NP08-05` Pre-Unloading 7조

---

### 📋 프로젝트 실제 서식 요약 일람표
Onshore LNG 재기화 설비 내 안전 점검 및 허가 활동 이행 시 100% 실증 사용되는 서식과 양식 코드 목록입니다.

| 서식 번호 (Form No.) | 서식명 (Form Name) | 점검/작성 주기 | 승인 및 서명 필수 직책 | 주요 통제 물리 파라미터 |
| :--- | :--- | :--- | :--- | :--- |
| **NP08-01** | T75 ISO Tank Check List | Incoming/Outgoing | Inspector, Driver | I-BOX 배터리 (**≥ 40%**), 외관 상태 |
| **NP08-02** | LNG ISO Tank Checklist Sebelum Moving | Before Transport | Inspector | 압력(MPa), Level(mmH2O), GPS Antenna |
| **NP08-03** | Daily Yard ISO Tank Checklist | Daily | Yard Supervisor | Loaded/Empty 상태, Gauge vs IBOX 대조 |
| **NP08-09** | Pre-Startup Checks Unloading Skid Checklist | Before Unloading | Field Operator, Lead Operator | ESDV 연동, 유틸리티 밸브 폐쇄 상태 |
| **NP08-10** | Grounding Checklist | Before Unloading | Field Operator, Lead Operator | 정전기 접지 저항 (**< 5 Ohm**) |
| **NP08-11** | Flexible Hose & QCC Connection Checklist | Before/During/After | Field Operator, Lead Operator | 호스 균열, QCC 씰링, 운전 가압 압력 |
| **NP08-14** | Depressurize Checklist | After Unloading | Field Operator, Operation Leader | 잔류 가스 해제 압력 (**<0.05 MPa**) |
| **NP08-15** | Atmospheric Gas Monitoring Log Sheet | Every 4 Hours | Field Operator, Operation Leader | \(H_2S\)/\(CO\) (ppm), \(O_2\) (%), LEL (%) |
| **NP08-21** | Environmental and Safety Precautions (AAV) | Before AAV PM/Ops | Operator, Supervisor, HSE, Site Manager | 극저온, 가스 누출, 추락 방지, LEL |
| **NP08-31** | Preparation Checklist Gas Sales Calibration | Before Calibration | Operator, Supervisor, HSE, Site Manager | 마스터 미터 정합, LOTO, LEL 계측 |
| **NP08-32** | STS Pre-Operation Checklist | Before Marine Lift | Super Cargo Leader | 해상 기상 한계치, Crane SWL, Pre-lift |
| **NP08-38** | Delegation of Authority Form (DOA) | Upon Vacation/Off | Plant Manager, Delegated Personnel | Operational, HSSE, OPEX Site Level |
