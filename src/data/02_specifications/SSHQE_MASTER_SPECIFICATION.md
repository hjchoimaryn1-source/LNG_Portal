# PT. LNG Nias Gasifikasi - SSHQE Master Specification

본 규격서는 PT. LNG Nias Gasifikasi의 SSHQE(품질, 보건, 안전, 보안, 환경) 시스템 51개 소스 문서에 명시된 원칙, 절차, 정량적 기준 및 역할 체계를 바탕으로 작성된 **CMMS(컴퓨터 기반 유지보수 관리 시스템) 및 안전작업허가(PTW) 모듈 개발용 마스터 명세서**입니다. 본 명세서의 모든 조항은 수립된 절차서와 양식에 100% 정합하며, 임의의 가공이나 가정이 배제된 원칙만을 기록합니다.

---

## 1. 조직 및 현장 인력 운영 기준 (Workforce & Manning)

### 1.1. 최소 상주 인원 기준 (Minimum Manning)
*   **표준 정원 (Headcount Standard):** 현장, 작업장 및 작업이 수행되는 모든 구역에 상주해야 하는 공식 직원 정원은 **상시 21명**으로 규정되어 있습니다. 이 기준은 매월, 연간 누적(YTD) 및 누적(STD) 기준으로 엄격하게 통제 및 보고되어야 합니다. `[출처: NP07-25 HSSE Monthly Performance Report]`
*   **인력 구성 검증 로직:** CMMS 당직 현황판(Daily Board)에 활성화된 인력의 합이 **21명 미만**으로 하락할 경우, 시스템은 즉각 'Under-manning' 경고 알림을 화면에 표시하고 사이트 매니저(Site Manager)에게 에스컬레이션 알림을 발송해야 합니다. `[출처: NP07-25, Element 9]`

### 1.2. 교대제(Shift Roster) 운영 및 피로 관리 규정
*   **표준 근무 시간 체계:** 현장의 표준 보안 순찰 및 기본 운영 교대조는 주간(Day)과 야간(Night)의 **12시간 교대 근무(12-Hour Shift)** 시스템을 따릅니다.
    *   **Day Shift (주간):** 07:00 ~ 19:00 `[출처: NP07-08 Security Round Patrol Log Form]`
    *   **Night Shift (야간):** 19:00 ~ 07:00 `[출처: NP07-08 Security Round Patrol Log Form]`
    *   *비고:* 일반 오퍼레이션 교대조의 경우 일지상 주/야간 교대 구분이 적용됩니다. `[출처: NP07-02 HSE Daily Checklist]`
*   **연속 근무 제한 (24-Hour Fatigue Block Rule):**
    *   SSHQE Element 2(Personnel and Training)의 피로 관리 및 사고 예방 원칙에 의거하여, 비상 상황 판단 및 현장 대피 통제를 전담하는 핵심 ERT 인원(FC, EVAC 등) 및 일반 작업 인원이 휴식 시간 없이 **24시간 연속으로 온듀티(On-Duty) 당직 및 실무 배정되는 것을 시스템적으로 차단(Hard Block)**해야 합니다. `[출처: Element 2]`
    *   동일 인물이 주간 시프트와 야간 시프트에 동시에 중복 배정될 경우, CMMS 스케줄러는 배정 오류를 발생시키고 승인을 거부해야 합니다. `[출처: Element 2, Element 9]`
*   **교대 인수 인계 (HSE Shift Handover) 규정:**
    *   교대 근무 조 변경 시, 퇴근조(Outgoing)와 출근조(Incoming) HSE 담당자는 교대인계서(`NP07-03 HSE Shift Handover Report`)를 사용하여 **대면(Face-to-face) 및 양방향(Two-way) 질의응답**을 거친 후 상호 서명(Sign-off)해야 합니다. `[출처: NP07-03]`
    *   인수인계서에 포함되어야 하는 핵심 운영 파라미터는 송출 유량(Send-out rate, MMSCFD), 탱크 레벨(LNG, slops, chemicals), 기화기(Vaporizer) 운영 상태, 질소/불활성 가스(Nitrogen/Inert gas) 시스템 상태 및 활성 허가서(Active PTW) 정보입니다. `[출처: NP07-03]`

---

## 2. ERT(비상대응팀) 편성 규격 및 비상 대응 프로토콜

### 2.1. ERT 필수 보직 규격
비상 사태 발생 시 공정 정지 통제 및 인명 구조를 위해 상시 가동되어야 하는 비상대응조직(ERT)의 최소 필수 보직 및 구성 요건은 다음과 같습니다. `[출처: Element 9, NP11-02, NP07-11, NP07-14]`

| ERT 보직 공식 명칭 (CMMS Code) | 역할 및 정의 (Official Mandate) | 겸직 제한 및 요건 (Dual-Role Limit) | 필수 자격 기준 (Qualification Required) |
| :--- | :--- | :--- | :--- |
| **Incident Commander (IC)** | 비상 사태 발생 시 비상대응 본부 및 사이트 전체를 총괄 지휘하며, 외부 지원 기관과 소통함. | OP Team Leader 등이 비상 시 겸직 가능. 단, 현장 실무 작업 불가. | Crisis & Emergency Management 이수, On-site Personnel Training 이수 `[출처: Element 9, NP02-01]` |
| **On-scene Commander (OSC)** | 사고 현장 최일선에서 전술적 구조 및 진압 활동을 직접 지휘함. | 소방대(Fire Team) 대원 또는 대피유도원을 지휘해야 하므로 독립적 행동 확보 필요. | On-scene Commander Assessment 통과자 `[출처: Element 9 / Passage 105]` |
| **Fire Chief (FC)** | 소방방재 설비 작동 상태를 통제하고 현장 소방 대원들을 지휘함. | 소방 감시자(Fire Watcher)와 역할 중복 불가. 독립적 포지션. | 소방 전문 교육 수료 및 자격 보유 (Element 2/9) |
| **Fire Watcher / Fire Team** | 화재 발생 시 소화 장비(APAR 등)를 동원하여 초동 진압을 수행하고 대피를 보조함. | 일반 고위험 작업(Hot Work 등)의 작업조원과 절대 겸직 불가. (전담 감시 의무) | 화재 예방 및 진압 훈련 이수, 연간 Drill 참석 자격 보유 `[출처: NP07-14]` |
| **First Aider (FA)** | 부상자 발생 시 현장에서 초동 응급조치 및 심폐소생을 수행하고 의료진에게 인계함. | 비상 시 다른 단순 보직과 겸직이 가능하나, 구역 내 상시 1명 이상 대기해야 함. | 구급함 보관 항목 사용 자격, 응급처치 교육 이수 및 First Aid 자격증 소지 `[출처: NP07-23]` |
| **Evacuation Lead (EVAC)** | 비상 경보 발령 시 구역 내 인원들을 지정된 대피로를 통해 Muster Point로 신속 유도하고 헤드카운트를 수행함. | 대피 동선 이탈 불가. 비상 시 전담 역할 수행. | 대피 경로 숙지, Emergency Preparedness Checklist 통과자 `[출처: NP11-12]` |
| **Trained Standby / Hole Watcher** | 밀폐공간(Confined Space) 작업 시 외부에서 대기하며 내부 작업 인원의 안전 상태를 실시간 무전 모니터링함. | 내부 작업 조원 및 기타 작업과 **절대 겸직 금지**. 전담 대기 및 무전 소지 필수. | Trained Standby with Radio 자격 이수, 전용 무전 콜사인 부여 필수 `[출처: NP07-11]` |

### 2.2. 외부 Liaison 및 에스컬레이션 프로토콜
*   **외부 지원 기관 연계 체계:** 비상상황 시 자체 ERT 역량을 초과하는 위협의 경우 아래 기관과 즉각 연락망을 연계해야 합니다.
    *   **POLRI (인도네시아 국가경찰):** 절도, 기물 파손, 침입 등 모든 형사 범죄 발생 시 primary contact로 가동되며 법적 보고 및 현장 인도(Handover)를 전담함. `[출처: 11 Security Procedure]`
    *   **TNI (인도네시아 군):** 무장 침입, 사보타주, 대규모 민간 소요 사태 등 치명적인 국가적 위협 발생 시 POLRI 또는 지정 정부 기관의 요청에 의해 2차 백업군으로 투입됨. `[출처: 11 Security Procedure]`
    *   **Local Emergency Responders:** 로컬 소방서 및 방재 기관과의 의무 조율을 통해 초저온(Cryogenic) 액체 질식/동상 위험 요소를 최초 대응자들에게 사전 교육하고 협조를 구함. `[출처: 11 Security Procedure]`
*   **보안 등급 에스컬레이션 3단계 매트릭스:** `[출처: 11 Security Procedure]`
    *   **Level 1 (Warning - Low):** 이례적 움직임 포착, 외곽 울타리 센서 작동, 미확인 의심 차량 loitering. (조치: CCTV 정밀 확인, 보안 수퍼바이저 전파, 로컬 순찰 빈도 증가)
    *   **Level 2 (Intrusion - Medium):** 보안 경계망 내부 무단 침입자 확인, 비핵심 구역 내 도난/반달리즘 확인. (조치: 내부 보안 대응팀 가동, 해당 구역 차단/격리, POLRI 의무 신고)
    *   **Level 3 (Threat to Life/Sabotage - Critical):** 무장 침입자 확인, 인질 상황, 핵심 공정 시스템(DCS 등) 고의 훼손, 경계 펜스를 위협하는 폭동 사태. (조치: 공정 비상 정지(First Cut-Out), 전 단지 봉쇄(Lockdown), 국가 중요시설(Obvitnas) 프로토콜에 의거 POLRI/TNI 소집)

---

## 3. 자격 및 적격성 관리 규정 (Competency & Induction)

### 3.1. 안전 유도 교육 (Site SSHQE Induction) 분류 체계
모든 방문객과 신규 작업자는 현장 출입 전 자격 요건에 맞는 유도 교육을 이수해야 하며, 무단 출입은 일절 금지됩니다. `[출처: 10 SSHQE Induction Procedure]`

| 교육 유형 (Type of Induction) | 교육 대상 (Target Audience) | 최대 유효기간 및 재교육 기준 (Validity) | 필수 증빙 요건 및 ID 매칭 |
| :--- | :--- | :--- | :--- |
| **Site SSHQE Induction Video** | 단순 방문객, 벤더, 컨설턴트 등 물리적 실무 작업을 수행하지 않는 자. (최대 1~2일 체류) | 12개월 내 최대 2회 방문으로 제한. 이탈 후 **1년 초과 시 재교육 의무**. | MCU 면제. watched 후 서명 완료 시 Visitor ID Card 발급. `[출처: 10 SSHQE Induction]` |
| **Brief SSHQE Induction Presentation** | 2주일 이상 체류하며 현장에서 도구/장비를 다루거나 물리적 작업을 수행하는 계약자 및 단기 인력. | 최대 유효기간 1년. 사이트 이탈 후 **1년 초과 시 재교육 의무**. | 2일 전 공식 병원 발급 **Medical Fit Certificate (MCU)** 제출 필수. 통과 시 Temporary ID Card 발급. |
| **Full SSHQE Induction Training** | HR 소속 신규 입사 직원 (New Hired) 및 장기 상주 계약사 소속 신규 배치 노동자. | 상시 유효 자격으로 관리되나, 사이트 이탈 후 **1년 초과 시 재교육 의무**. | Handover 전 특정 평가(Assessment Sheet) 합격점 득점 필수. 통과 시 Permanent ID Card 발급. |

### 3.2. 자격 만료 인원(REFRESH DUE / EXPIRED) 당직 제한 로직
*   **자격 검증 자동화:** 모든 현장 근무자는 법정 의무 자격(K3 Migas 등) 및 핵심 직무 교육 이력 데이터가 CMMS DB의 `NP02-01 (Employee Training & Competency)` 테이블 및 `NP02-06 (Management List of Onsite Worker's Document)`과 상시 연동되어야 합니다. `[출처: App 02]`
*   **갱신 임박(Refresh Due) 알림 로직:** 유효 만료일 기준 **30일 전 / 60일 전 / 90일 전** 스케줄러를 통해 메일 및 푸시 경고를 해당 임직원 및 사이트 매니저에게 발송합니다.
*   **만료자 온듀티 제한 (Hard Block Rule):**
    *   법정 자격이 만료(Expired)되거나 리프레시 평가 미통과 상태(`REFRESH DUE`)인 인원은 **가스 측정(Gas Tester), 밀폐공간 감시자(Hole Watcher), 화재 감시자(Fire Watcher), 전기 잠금 작업(LOTO) 리더 등의 핵심 안전 직무 배정 목록에서 실시간으로 제외(Gray-out)**되어야 합니다. `[출처: Element 2]`
    *   특히, 미자격 가스 측정원이 안전작업허가서(PTW) 상의 측정 서명을 행하는 경우 해당 작업 허가 전체가 무효화되므로 시스템에서 서명 API 호출 시 자격 유효 여부를 검증(Validation Query)하는 필터를 내장해야 합니다. `[출처: Element 2, Element 10]`

---

## 4. 안전작업허가제도 (Permit to Work - PTW) 및 현장 안전 기준

### 4.1. 6대 고위험 작업 구분 및 양식 관리
모든 고위험 작업은 각각 지정된 전용 Form 양식을 사용하여 신청, 검토, 승인되어야 합니다. `[출처: App 02]`
1.  **Cold Work (일반 냉간 작업):** `Form-NP-07-10`
2.  **Confined Space Entry (밀폐공간 출입 작업):** `Form-NP-07-11` (Standby 인원 및 가스 측정 기록 연동 필수)
3.  **Electrical (전기 작업):** `Form-NP-07-12` (에너지 차단 및 LOTO 확인서 연동 필수)
4.  **Excavation (굴착 작업):** `Form-NP-07-13` (토양 상태 및 shoring 체크 연동 필수)
5.  **Hot Work (온간/화기 작업):** `Form-NP-07-14` (소방 감시인 배치 및 LEL 가스 측정 연동 필수)
6.  **Radiography (방사선 투과 시험 작업):** `Form-NP-07-15` (경계 구역 바리케이드 및 경고 표지 연동 필수)

### 4.2. PTW 5단계 라이프사이클 및 승인 체계 (Workflow Matrix)
모든 안전작업허가서는 아래 정의된 공통 5단계 데이터 상태 흐름과 서명 유효성 검증을 준수하여 CMMS 내에서 처리되어야 합니다. `[출처: NP07-10 to NP07-15]`

```
[PART A: Description] -> [PART B: Preparation] -> [PART C: Approval] -> [PART D: Issue & Activation] -> [PART E: Return & Close]
```

1.  **PART A: Description of Work (작업 기술 및 계획 신청)**
    *   **입력 내용:** 작업 상세 사항, 설비 코드(Functional Location Tag), 오더 번호 및 설명, 수행 계약사 정보.
    *   **연동 필수 서류:** 작업팀이 승인 검토 완료한 **JSA(Job Safety Analysis, 양식 NP07-09)** 서류 업로드 및 최악의 시나리오(Worst Case Event), 가스누출/유출 관리 대책 수립 여부 체크박스 필수 연동. `[출처: NP07-09]`
2.  **PART B: Preparation (안전 예방 조치 등록 및 검증)**
    *   **입력 내용:** 맹판(Blinding) 삽입 여부, 물리적 차단 및 Irreversible Action 항목 체크, 연속 가스 모니터링 요구사항 체크.
    *   **LOTO 연동:** 기계, 프로세스 및 에너지 격리가 수반되는 경우 발급된 **LOTO 격리서 번호(Isolation Certificate No.) 및 Lock Box ID**를 필수적으로 입력 매핑해야 함. `[출처: NP07-10]`
3.  **PART C: Approval (허가 검토 및 승인)**
    *   **서명 주체 1 (Permit Authorizer / 승인권자):** 설비 및 공정의 전반적인 안전 상태를 검토하고 승인 서명함.
    *   **서명 주체 2 (Responsible Person / 현장 책임자):** 작업 영역의 물리적 조치를 최종 확인하고 서명함.
4.  **PART D: ISSUE & ACTIVATION (허가서 발행 및 작업 활성화)**
    *   **Permit Issuer (발행권자):** 해당 시프트의 최종 가동 및 활성화를 허가하며 서명 및 유효 시간대(Start/End Time)를 지정 입력함.
    *   **Work Leader (작업 리더):** 현장 안전 요건을 수용하고 작업을 개시함을 나타내는 인수 서명을 함.
    *   **Site Checker / FSO (현장 안전 확인원):** 작업 직전 현장 검증(Site Check)을 행하고 안전이 입증되면 무전(Radio)으로 허가 본부에 보고한 뒤 최종 활성화(Activation) 서명을 진행함.
    *   **가스 측정 (Gas Testing - Confined Space / Hot Work 필수):** 활성화 서명 전, 지정된 측정 포인트를 통해 가스 검출 수치(LEL, O2, H2S, CO, HG)를 입력 검증해야만 가동 상태로 전환됨.
5.  **PART E: RETURN & CLOSE-OUT (작업 완료/반납 및 폐쇄)**
    *   **작업 완료 상태 기재:** Work Complete 여부 체크 및 코멘트 입력.
    *   **반납 서명:** Work Leader가 작업 구역의 청소 상태 및 설비 복구를 완료했음을 서명하여 반납함.
    *   **검증 서명:** Site Checker(현장 검증원)가 현장의 안전 복구 상태를 최종 점검하고 확인 서명함.
    *   **인수 및 폐쇄 서명:** Permit Issuer가 반납을 수락 서명하고, Permit Authorizer가 최종 폐쇄(Closed) 승인 서명을 인가함 함으로써 라이프사이클이 종료됨.

### 4.3. 가스 측정 기준치 명세 (Gas Testing Set-points)
가스 유독성 및 폭발 위험으로부터 현장 인원을 완벽하게 보호하기 위해, PTW 모듈 가스 입력 필드에 내장해야 하는 법정 안전 허용 기준치는 다음과 같습니다. `[출처: NP07-11, NP07-14, NP07-23]`

*   **산소 (O2):** **19.5% ~ 23.5%** 범위 내 유지 필수 (19.5% 미만 시 질식 위험, 23.5% 초과 시 연소 가속 위험으로 작업 진입 절대 차단)
*   **가연성 가스 / 탄화수소 (HC / LEL):** **5% LEL 미만** (밀폐공간 진입 및 일반 작업은 5% LEL 미만이어야 하며, 화기 작업의 경우 가스 원천 차단 및 LEL 0% 유지 조치 후 진행)
*   **황화수소 (H2S):** **10 ppm 미만** (허용 한계치 초과 시 호흡기 보장 장비 배정 전까지 작업 전면 보류)
*   **일산화탄소 (CO):** **25 ppm 미만** (불완전 연소 가스 위험 한계 수치)
*   **수은 (HG):** 가스상 노출 수치 제한 요건 준수.

---

## 5. 점검, 방재 설비 관리 및 안전 감사 (Inspection & CAPA)

### 5.1. 정기 안전 점검 주기 매트릭스 (Inspection Schedule)
설비 자산의 결함으로 인한 재해를 예방하기 위해 CMMS 예방보전(PM) 모듈은 다음 주기 매트릭스에 따라 검사 오더를 자동 생성해야 합니다. `[출처: App 02]`

*   **Weekly (주간 점검):**
    *   안전 및 비상 차단 시스템 (`WEEKLY MAINTENANCE SAFETY & ESD SYSTEM` - Form `NP05-29`)
    *   대기식 기화기 (`WEEKLY MAINTENANCE AAV` - Form `NP05-30`)
    *   LNG 저장 탱크 설비 (`WEEKLY MAINTENANCE ISO TANK` - Form `NP05-31`)
*   **Monthly (월간 점검):**
    *   안전 및 비상 차단 시스템 (`MONTHLY MAINTENANCE SAFETY & ESD SYSTEM` - Form `NP05-22`)
    *   대기식 기화기 (`MONTHLY MAINTENANCE AAV` - Form `NP05-23`)
    *   가스 계량 설비 (`MONTHLY MAINTENANCE GAS METERING SKID` - Form `NP05-24`)
    *   인스트루멘테이션 및 플로우 컴퓨터 (`MONTHLY MAINTENANCE INSTRUMENTATION` - Form `NP05-25`)
    *   LNG 저장 탱크 설비 (`MONTHLY MAINTENANCE ISO TANK` - Form `NP05-26`)
    *   NG 완충 탱크 (`MONTHLY MAINTENANCE NG BUFFER TANK` - Form `NP05-27`)
    *   소화기 일제 점검 (`Checklist APAR` - Form `NP07-28`)
*   **Quarterly (분기 점검 - 3개월 주기):**
    *   안전 및 비상 차단 시스템 PM (`3 MONTHLY MAINTENANCE SAFETY & ESD SYSTEM` - Form `NP05-11`)
    *   기화기 PM (`3 MONTHLY MAINTENANCE AAV` - Form `NP05-12`)
    *   가스 계량 설비 PM (`3 MONTHLY MAINTENANCE GAS METERING SKID` - Form `NP05-13`)
    *   플로우 컴퓨터 PM (`3 MONTHLY MAINTENANCE INSTRUMENTATION` - Form `NP05-14`)
    *   LNG 저장 탱크 PM (`3 MONTHLY MAINTENANCE ISO TANK` - Form `NP05-15`)
    *   NG 완충 탱크 PM (`3 MONTHLY MAINTENANCE NG BUFFER TANK` - Form `NP05-16`)
*   **6-Monthly (반기 점검 - 6개월 주기):**
    *   안전 및 비상 차단 시스템 정밀 보전 (`6 MONTHLY MAINTENANCE SAFETY & ESD SYSTEM` - Form `NP05-17`)
    *   가스 계량 설비 정밀 보전 (`6 MONTHLY MAINTENANCE GAS METERING SKID` - Form `NP05-18`)
    *   계측 장비 정밀 보전 (`6 MONTHLY MAINTENANCE INSTRUMENTATION` - Form `NP05-19`)
    *   LNG 저장 탱크 정밀 보전 (`6 MONTHLY MAINTENANCE ISO TANK` - Form `NP05-20`)
    *   NG 완충 탱크 정밀 보전 (`6 MONTHLY MAINTENANCE NG BUFFER TANK` - Form `NP05-21`)
*   **Yearly (연간 점검):**
    *   안전 및 비상 차단 시스템 오버홀 PM (`YEARLY MAINTENANCE SAFETY & ESD SYSTEM` - Form `NP05-32`)
    *   기화기 분해 소제 및 PM (`YEARLY MAINTENANCE AAV` - Form `NP05-33`)
    *   가스 계량 설비 PM (`YEARLY MAINTENANCE GAS METERING SKID` - Form `NP05-34`)
    *   계측 장비 PM (`YEARLY MAINTENANCE INSTRUMENTATION` - Form `NP05-35`)
    *   LNG 저장 탱크 내부 검사 (`YEARLY MAINTENANCE ISO TANK` - Form `NP05-36`)
    *   NG 완충 탱크 정밀 검사 (`YEARLY MAINTENANCE NG BUFFER TANK` - Form `NP05-37`)
    *   소방방재 장비 종합 기능 점검 및 시험 (`Fire & Safety System Inspection, Test & Maintenance Log` - Form `NP05-38`)
    *   전기 설비 안전 검사 (`Electrical System Inspection Checklist` - Form `NP05-39`)

### 5.2. APAR(소방 설비) 점검 필드 명세 (Database Mapping Schema)
소화기 정기 점검 모듈 개발을 위해 데이터베이스 테이블에 반드시 포함해야 하는 필수 데이터 필드 리스트와 세부 검증 규칙입니다. `[출처: NP07-28 Checklist APAR]`

| 칼럼 영문명 (DB Column Tag) | 데이터 타입 (Data Type) | 검증 기준 및 규칙 (Validation Rule / Values) |
| :--- | :--- | :--- |
| **appar_id** | VARCHAR(50) [PK] | 소화기 고유 관리 번호. `[출처: NP07-28]` |
| **location_id** | VARCHAR(100) | 소화기 배치 구역 및 상세 물리적 위치. |
| **appar_type** | VARCHAR(50) | 소화기 종류 (Dry Chemical / CO2 / Foam 등). |
| **appar_size** | VARCHAR(20) | 소화기 용량 수치 (예: 6kg, 9kg, 68kg 등). |
| **appar_model** | VARCHAR(100) | 소화기 제조 모델명 및 제조사 정보. |
| **check_month** | DATE [PK] | 점검이 수행된 해당 연월 정보. |
| **check_pressure** | VARCHAR(10) | 압력 지침 침 상태. 'OK' (녹색 영역 내 위치) 또는 'Not OK' (적색/황색 영역 등 불량 상태). |
| **check_pin** | VARCHAR(10) | 안전핀 체결 상태 및 봉인 씰 파손 여부. 'OK' 또는 'Not OK'. |
| **check_hose** | VARCHAR(10) | 소화기 호스 균열, 막힘, 경화 상태 검사. 'OK' 또는 'Not OK'. |
| **check_clamp** | VARCHAR(10) | 호스 결속 클램프 체결 상태 및 파손 여부. 'OK' 또는 'Not OK'. |
| **check_handle** | VARCHAR(10) | 기동 레버 핸들의 변형, 부식 및 작동 저해 상태 검사. 'OK' 또는 'Not OK'. |
| **check_physical** | VARCHAR(10) | 소화기 본체 용기 부식, 찌그러짐 등 전체 외관 상태. 'OK' 또는 'Not OK'. |
| **check_paraf** | VARCHAR(100) | 점검 수행자의 실명 및 전자 서명 이미지 데이터 연동. |

### 5.3. 부적합 사항 시정 및 예방 조치(CAPA) 연동 워크플로우
현장 일일 안전 순찰(`NP07-02`) 및 예방 점검 과정에서 발견된 모든 부적합 사항(Non-conformance)은 다음의 자동화 흐름에 따라 **Action Tracking System (ATS)**에 등록되어 추적되어야 합니다. `[출처: 08 Nonconformity, Correction and Corrective Action]`

1.  **부적합 보고서(CAR - Corrective Action Request) 발행:** 현장 작업자 또는 HSE 감시원은 비적합 사항 발견 시 CAR 보고서 양식을 작성하여 시스템에 업로드합니다. `[출처: 08 Nonconformity]`
2.  **HSE Officer 검토 및 ATS 자동 등록:** HSE Officer가 비적합 사항의 내용과 root cause(장비 고장, 절차 미비, 교육 부재, 디자인 결함 등)를 분석 및 평가한 뒤, 시스템상 Action Tracking System(ATS)에 공식 안건(Action Item)으로 등록합니다. 각 안건은 **목표 조치 기한(Target Date), 담당 실무 조치자(Responsible Person), 예상 도출 성과(Desired Outcome)**가 명확하게 입력되어야 합니다. `[출처: 08 Nonconformity / Passage 64]`
3.  **조치 및 결과 검증 (Field Verification):** 담당 조치자가 현장 개선 및 예방 조치 완료 후 관련 물리적 증빙(사진, 성과 보고서 등)을 등록하면, 지정된 수퍼바이저/검증인이 현장 실사를 거쳐 현장 조치 상태를 서명 승인합니다. `[출처: 08 Nonconformity / Passage 62]`
4.  **최종 승인 및 Closed 완료:** 최종 조치 결과 보고서는 **Site Manager(사이트 매니저)의 최종 검토 및 종결 서명**을 득해야만 시스템 상에서 'Closed/Completed' 상태로 전환 및 기록 보관됩니다. `[출처: 08 Nonconformity / Passage 63-64]`

---

본 규격서의 모든 지침과 데이터 사양은 PT. LNG Nias Gasifikasi의 SSHQE 경영대리인(Daniel Kweon, System Management Leader) 및 최종 승인권자(Edi Hermawan, Site Manager)가 서명한 공식 기준을 준수합니다. `[출처: I Content and Approval]`
