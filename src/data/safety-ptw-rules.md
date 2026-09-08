# NIAS Onshore Regasification Unit & PLTMG 연계 운영 프로그램
## Safety & PTW (Permit to Work) Module Rules 설계 기준 및 규칙 정의서

본 정의서는 **Nias Onshore LNG 재기화 시설(Regasification Facility)**의 안전한 조업과 공정 관리의 고도화를 위하여, 54개의 현장 표준 운영 절차서(SOP), 일일 점검 체크리스트 및 가스 모니터링 로그 대장을 상호 교차 분석하여 추출한 **현장 작업 허가(PTW) 및 안전 관리 시스템 구축용 엔지니어링 설계 규칙**입니다.

모든 규정과 데이터 항목은 **100% 사실(Ground Truth)**에 기반하며, 개별 요구 사항마다 확인된 원문 소스 문서 및 조항을 매핑하여 신뢰성과 추적성을 확보하였습니다.

---

## 1. 작업 허가서(PTW) 분류 체계 및 SOP 매핑

현장에서 발급되는 모든 작업 허가(PTW)는 위험 특성과 영향도에 따라 체계적으로 분류되며, 각 작업별로 지정된 전문 표준운영절차서(SOP) 및 국제 기준과 연동되어 통제됩니다.

### PTW 분류 및 작업 정의

| PTW 작업 분류 | 적용 대상 및 작업 정의 | 연동 필수 전문 SOP / 준수 코드 |
| :--- | :--- | :--- |
| **Hot Work Permit**<br>(화기 작업 허가) | • 점화원, 불꽃, 전기 스파크 또는 열을 발생시키는 모든 정비 및 금속 가공 작업.<br>• 예: 극저온 용기 노즐 접합, 플랜지 가열 보수, 안전 밸브 탈거를 위한 토크 용접 등 [61, 366]. | • `Permit to Work (PTW) System` 내부 규범 [67, 96, 413]<br>• `OSHA 3132` (Process Safety Management) [197]<br>• `NFPA 59A` (Liquefied Natural Gas Standard) [197] |
| **Cold Work Permit**<br>(일반 정비 작업 허가) | • 열이나 불꽃을 발생시키지 않는 배관 정비, 세척 및 기계 구성품 단순 분리/결합 작업.<br>• 예: 기화기 알루미늄 핀 세척 및 배수 밸브 정비, 압력 센서 단순 기계 교체 등 [334, 457]. | • `NP08-06 Flexible Hose & Quick Close Coupler Maintenance and Inspection Procedure` [324]<br>• `HSG 253` (Safe Isolation and Reinstatement of Plant) [197] |
| **Confined Space Entry**<br>(밀폐공간 출입 허가) | • 산소 결핍(Asphyxiation)이나 가스 질식 및 독성 분위기가 존재하여 자연 환기가 불리한 밀폐식 구조 구역에 진입하는 작업.<br>• 예: 극저온 저장조 탱크 내부 청소, 밸브 박스 내부 및 트렌치 진입 등 [113, 388, 447]. | • `NP08-03 General Operational Regasification` [102]<br>• `NP08-08 Environmental and Safety Precautions AAV Procedure` [366] |
| **Electrical / LOTO**<br>(전기 및 에너지 격리 허가) | • 고전압 모터 제어반(MCC), 현장 변압기, 계장 전송 라인의 전원 분리 및 제어 시스템 인터록 격리가 동반되는 전기 작업.<br>• 예: 계량 제어용 Flow Computer 배선 보수, 가스 감지 센서 및 ESD 알람 연동 테스트 등 [123, 195]. | • `HSG 85` (Electricity at Work)<br>• `HSR 25` (The Electricity at Work Regulations 1989) [197] |
| **Lifting Operation**<br>(인양 및 양하 작업 허가) | • 크레인이나 리치 스태커(Reach Stacker) 장비를 사용하여 극저온 LNG ISO 컨테이너 탱크를 하역 skid 및 트레일러로 상하 인양 이송하는 작업.<br>• 예: 만충/공탱크 교체 스위칭(Lifting) 작업 [11, 74, 189]. | • `NP08-02 Lifting LNG ISO Tank Procedure` [74]<br>• `NP08-10 TRANSFER ISOTANK SHIP TO SHIP PROCEDURE` [416]<br>• `PERMENAKER No. 8 TAHUN 2020` [79] |

### 고위험 등급(Critical High Risk) 분류 기준
* **Critical High Risk**: 아래의 조건 중 하나라도 해당하는 경우 고위험 작업으로 자동 분류되며, **Site Manager의 최종 서면 승인 및 ESDV 차단 밸브의 3단계 완전 고립**이 강제됩니다 [134, 166].
  * 가압 상태(Active Cryogenic Flow)의 LNG 배관 및 호스 분리 작업 [335].
  * 가스 폭발 위험 영역(Zone 1, LEL 상시 검지 구역) 내부에서의 용접/용단 화기 작업 [447].
  * 25톤 이상 중량물(Loaded LNG ISO Tank, 약 30~34톤 상당)의 크레인 선박 인양 및 기인 인양(Lifting) 작업 [79].
  * 밀폐공간(Confined Space) 진입을 요하는 모든 공정 내부 점검 [134].

---

## 2. 단계별 라이프사이클 및 승인/종료 절차 (Workflow & Sign-off)

작업 허가 시스템은 안전 무결성을 유지하기 위해 **5단계의 엄격한 라이프사이클**로 구성되며, 단계마다 정의된 직책의 실제 수필 서명이 기록되어야 상태 전환이 유효합니다.

```
[DRAFT] -> [PREPARED/VERIFIED] -> [APPROVED/AUTHORIZED] -> [ACTIVE/VALID] -> [CLOSED/SURRENDERED]
```

### 단계별 요구 조건 및 필수 서명권자

| 상태 단계 | 실행 조건 및 안전 요구 사항 | 필수 서명권자 (Role & Title) | 관련 출처 조항 / 문서 번호 |
| :--- | :--- | :--- | :--- |
| **DRAFT**<br>(초안 작성) | • 작업 리더가 구체적인 작업 스케줄, 작업 구역, 정비 대상 태그 번호를 입력하고 JSA(작업안전분석)와 도면을 첨부하여 등록하는 단계 [398]. | **Work Leader / Maintenance Team** (신청서 작성자) | `NP08-09 Gas Sales Metering Procedure` Section 5 [396, 398] |
| **PREPARED / VERIFIED**<br>(현장 검증) | • HSE Officer가 작업 대상 영역의 **가스 테스트(< 10% LEL)**를 직접 수행하고, JSA상의 위험 통제 방안이 현장에 수립되었는지 검증 및 서명하는 단계 [11, 291]. | **HSE Officer** (현장 안전 확인 및 가스 테스트 보장) | `NP08-05 ISO Tank Management Procedure` Pre-Unloading [284, 291] |
| **APPROVED / AUTHORIZED**<br>(최종 승인) | • 전체 공정에 미치는 간섭과 기계/전기적 고립 적합성(LOTO)을 승인하는 최종 의사 결정 단계.<br>• Site Manager 부재 시, 공식 위임 Memo가 존재할 경우에만 Senior O&M Leader가 직무 대행(Acting)으로 승인 가능 [126, 133]. | **Site Manager (Plant Manager)**<br>*(※ 부재 시 acting: Sr. O&M Leader)* | `NP08-03 General Operational Regasification` Section 3 [117, 134, 135] |
| **ACTIVE / VALID**<br>(작업 실행 및 점검) | • 작업 현장에 바리케이드와 "Danger Tags"를 게치하고, Operation Team Leader의 조업 상황 교차 대조 후 실질적인 작업을 실행하는 단계 [120, 200]. | **Operation Team Leader** (실시간 현장 감시 통제 책임) | `NP08-04 LNG ISO Tank Unloading Skid Procedure` [191, 200] |
| **CLOSED / SURRENDERED**<br>(완료 및 복구) | • 정비 완료 후 배관 기밀 시험 및 가압 누설 테스트를 통과하고 LOTO 잠금을 완벽 해제하여 공정을 정상 계통으로 복구 및 반납 승인하는 단계 [309, 408]. | **Work Leader, HSE Officer, Site Manager** (3자 공동 서명 마감) | `NP08-09 Gas Sales Metering Procedure` Line Reinstatement [408, 410] |

### 작업 연장(Extension), 작업 일시 중지(Suspension), 취소 및 완료 반납(Closeout) 규정
* **작업 연장 (Extension)**: 교대 근무(Shift Handover) 시 미완료된 PTW는 인수팀에 공식 인계(Sign-off Handover)되고 재확인 대조를 거침 [127, 138]. 연장 승인은 Site Manager 또는 위임받은 대행자가 수행 [126].
* **작업 일시 중지 (Suspension / Stop Work)**: 기상 악화(풍속 >= 20노트, 파고 >= 1.0m 등), 가스 누출 알람 발생, 불안전한 행위/상태 발견 시 현장 오퍼레이터를 포함한 전 직원이 "작업 중지 권한(Stop Work Authority)"을 즉각 발동하며, 즉시 작업을 중지하고 안전 상태를 확보해야 함 [33, 121, 429, 445].
* **취소 및 완료 반납 (Closeout)**: 모든 도구 회수, LOTO 자물쇠 탈거, 시스템 제로 에너지 상태 해제 후 정상화 확인이 되어야 폐쇄 서명 가능 [127, 307, 408].

---

## 3. 공기질/가스 계측(AGT) 및 환경 기준치 (Gas Testing Limits)

현장 내부 가연성 가스(메탄) 체증 및 산소 결핍으로 인한 폭발과 Asphyxiation 인명 재해를 차단하기 위해 AGT는 기술적으로 정의된 물리 한계치를 철저히 이행해야 합니다.

### 가스 측정 필수 작업 유형 및 측정 주기
* **대상 작업**: 하역 스키드 가동 전 및 ISO Tank 교체 전 [289], 기화기 정비 분리 전 [61], 계량 스키드 Orifice 오리피스 플레이트 정비/교정 전 [401], 밀폐구역 진입 전 [447].
* **정기 측정 주기**: 
  * 하역 조업 중에는 **매 4시간 간격**으로 고정 가스 탐지기와 휴대용 검지기를 사용하여 하역 스키드 T-201~T-204 주변을 순회 및 모니터링함 [453].
  * 밀폐공간 및 고위험 화기 작업 실행 중에는 연속적(Continuous) 가스 감지 센서를 장치하여 실시간 감시 유지 [300].

### 대기 질 및 가스 안전 허용 기준치 (Safety Bands)

| 가스 성분 및 인자 | 허용 안전 기준치 (Safe Threshold) | 즉각 조치 및 작업 중단 기준 (Stop Action Limit) | 측정 단위 및 분석기 형식 | 출처 파일 및 장표 |
| :--- | :--- | :--- | :--- | :--- |
| **가연성 가스 / 메탄 (LEL)** | **< 10% LEL** [289, 401] | **>= 10% LEL 초과 시** 즉시 전 작업 중단 및 대피 [302, 387] | % LEL (Methane LEL = 5% vol) [380] | `NP08-15 Atmospheric Gas Monitoring` [453], `NP08-21 AAV Precautions` [459] |
| **산소 농도 (O₂)** | **19.5% ~ 23.5%** [388] | **19.5% 미만**으로 강하 시 진입 금지 및 즉시 SCBA 착용 [388] | % volume | `NP08-08 Environmental Safety AAV Procedure` [388] |
| **황화수소 ($H_2S$)** | **출처 내 허용 기준 수치값 확인 불가** [453] | 가스 모니터링 로그 대장에 기록 의무화 (단, 허용 한계 수치는 공란) [453] | ppm | `NP08-15 Atmospheric Gas Monitoring` [453] |
| **일산화탄소 ($CO$)** | **출처 내 허용 기준 수치값 확인 불가** [453] | 가스 모니터링 로그 대장에 기록 의무화 (단, 허용 한계 수치는 공란) [453] | ppm | `NP08-15 Atmospheric Gas Monitoring` [453] |

* **대기 안전 판정(Atmosphere Safe) 조건**: 작업 개시 전 HSE Officer가 수행한 다점 가스 계측 결과 LEL이 0%를 나타내고 O₂ 농도가 20.9% 수준의 안정 대기 상태를 유지하는 경우에 한해 수필 서명으로 최종 통과를 인증함 [434, 459].

---

## 4. 필수 안전 조치 및 사전 점검 체크리스트 (Mandatory Safety Controls)

현장의 작업 무결성 유지를 위해 PTW 발행 전 모든 사전 작업 구역에 설치 및 검사되어야 할 전수 안전 대책입니다.

### 전수 안전 조치 항목 통제 요건

1. **소방 감시자 (Fire Watch) 전담 배치**:
   * 화기 작업, 중량 리프팅, LNG 하역 스키드 가동, 바지선 이송 접안 시 반드시 분말 소화기(DCP) 및 이산화탄소 소화기를 휴대 장비한 Fire Watch 인력을 전담 배치해야 함 [91, 443, 470].
2. **LOTO (Lockout Tagout) 물리적 차단 및 격리**:
   * 유체 인입원 밸브에 잠금 자물쇠(Padlock) 설치, 제어반 Switch OFF 처리 후 개별 작업자 소유의 "Danger Tags"를 체결하여 오조작으로 인한 불시 전력 수급 및 유체 가압을 물리적으로 원천 차단함 [200, 335, 406].
3. **방호벽 및 안전 바리케이드 (Safety Barricades)**:
   * 하역 작업 시 반경 **최소 25m**, 화재/누출 비상 대피 및 위험물 인양 리프팅 시 반경 **최소 50m ~ 100m**에 안전 원뿔(Traffic Cone), 격리 체인 및 경고 Signage를 설치하여 무단 인입을 철저히 차쇄 차단함 [39, 312, 381, 386].
4. **비상 대피로 (Escape Route) 확보**:
   * 대형 장비 운송 차로(최소 6미터 폭) 및 플랫폼 대피로 상에 걸치거나 방치된 기계 부품 및 장애물을 전수 치우고 비상 조종실로의 대피로를 영구 개방함 [16, 174, 470].
5. **안전 접지 및 정전기 본딩 (Grounding & Bonding)**:
   * 정전기 방전 스파크로 인한 벤팅 가스 발화를 예방하기 위해, 모든 하역용 LNG ISO Tank와 Skid 구조체 간 정전기 접지 루프를 강력 결속하고 접지 저항 측정계를 사용해 저항값이 **5 Ohm 미만**인 것을 가압 이송 전에 확인하고 기록해야 함 [211, 415]. 접지 해제는 다른 모든 배관 및 호스 분리가 완료된 후 **가장 마지막**에 실행함 [277, 449, 452].
6. **강제 환기 (Forced Mechanical Ventilation)**:
   * 가압 천연가스 및 LNG 체류 우려가 깊은 기화 밸브 조작 구역 및 계량 하우징 등은 정비 진입 전 강제 송풍기를 동원해 안전 공기를 계속 순환 배출하여 CH₄ 가스를 완전 비축 비산시켜야 함 [401].
7. **방폭 도구 (Anti-spark / Non-sparking Tools)**:
   * 가스가 잔류할 수 있는 극저온 밸브, 배관 볼트 체결 보수 시 기계적 마찰 스파크를 방지하기 위해 구리 합금 등의 승인된 방폭 도구(Anti-spark Tools)를 전적으로 강제 사용함 [62].

### 작업 유형별 특화 보호구 (Cryo/Special PPE) 요건

* **극저온 액체 노출 위험 작업 (Cryogenic Liquids Handling - 호스 연결/분리, 샘플링, PSV 정비 등)** [214]:
  * 얼굴 전체를 방어하는 투명 고강도 페이스 실드(Face Shield) 의무 장착 [62, 201].
  * −162°C의 냉각 화상(Cryogenic Cold Burns)을 직접 차단하는 극저온용 특수 단열 가죽 방호 자켓(Cryogenic Suit/Coat) [201, 205].
  * 초저온 비산 시 동결 화상을 완전 예방하는 극저온 전용 단열 긴 장갑(Cryogenic Gloves) [62, 201].
  * 저온 액체 침투와 미끄러짐을 완벽 방지하는 탄화수소 저항성 특수 안전화(Cryogenic / Hydrocarbon Resistant Boots) [91, 201].
* **일반 기계 정비 및 리프팅 (Lifting / Rigging) 작업** [91]:
  * 턱끈이 장착되어 흔들림에 이탈되지 않는 안전모(Safety Helmet with Chinstrap) [92, 95].
  * 기계 부품 비산물로부터 눈을 보호하는 비산 전용 보안경 (Rigger/Crane Op은 태양광 눈부심을 막는 흑색 안전 보안경 착용 인정) [92, 95].
  * 낙하 충격과 금속 tusukan 돌발 침투를 막는 강성 스틸 토 캡 안전화 [91, 95].

---

## 5. 작업자 자격 및 적격성 확인 기준 (Competency & Clearance)

극저온 LNG 및 고압 천연가스를 정밀 통제하므로 작업 참여자 전원에 대하여 법적 면허와 적격 조건이 엄격하게 확인 및 로깅되어야 합니다.

### 직책 및 작업 유형별 필수 교육/자격 요건 (Training Matrix)

| 현장 필수 직책 | 법적/제도적 필수 자격 요건 및 교육 이수 규정 | 입증 필요 증명서 / 면허 명칭 | 관련 소스 조항 |
| :--- | :--- | :--- | :--- |
| **Field Operator**<br>(현장 운전원) | • 극저온 액화가화 취급 기술 교육 정식 이수.<br>• 설비 비상 정지(ESD) 및 계통 밸브 차단 조종 모의 훈련 6개월 주기 필수 이수 [179, 187]. | • LNG Handling & Cryogenic Safety Certificate [188, 199] | `NP08-03 Regasification SOP` Section 11 [178, 179] |
| **HSE Officer / AGT**<br>(안전 책임 및 가스 측정관) | • 폭발 분위기(LEL) 및 산소 계측 정밀 기기 작동법 마스터.<br>• JSA 작성, 비상대응 계획(ERP) 가동 및 사건 조사 기법 전문 자격 [11, 196, 396]. | • **Authorized Gas Tester (AGT) Certification** [199]<br>• NEBOSH 또는 인도네시아 K3 AK3 Umum 면허 | `NP08-04 Unloading Skid Operation SOP` [199] |
| **Crane Operator**<br>(크레인 기인 조종사) | • 선박 Crane 및 대형 리치 스태커(Reach Stacker) 장비의 중량물(Loaded ISO Tank, 약 34톤) 인양 안전 면허 보유자 [74, 78]. | • **SIO (Surat Izin Operasi) Class II 이상** [79]<br>• `PERMENAKER No. 8 TAHUN 2020` 부합 면허 [79] | `NP08-02 Lifting LNG ISO Tank Procedure` Section 5 [78, 79] |
| **Rigger**<br>(신호수 및 줄걸이 공) | • 인양 작업용 Sling, Shackle, Spreader Beam 결속 기하 계산법 이수.<br>• 표준 수신호 및 무전 UHF 통신 프로토콜 정식 인증 [74, 78]. | • **Rigger Certificate** [79]<br>• `PERMENAKER No. 8 TAHUN 2020` 부합 면허 [79] | `NP08-02 Lifting LNG ISO Tank Procedure` Section 5 [78, 79] |
| **Maintenance Technician**<br>(전기/계장 기술자) | • 방폭 제어기 교정, SCADA 제어 연동, LOTO 에너지 전원 분리 전문 보수 자격 소지 [123, 195]. | • **Technician Certificate** [79]<br>• `PERMENAKER No. 8 TAHUN 2020` 부합 면허 [79] | `NP08-02 Lifting LNG ISO Tank Procedure` Section 5 [78, 79] |
| **Transporter / Driver**<br>(트레일러 운전사) | • 액화 가스 운송 트레일러 제동 제제 기술 보유.<br>• 안전 JMP(여정 관리) 속도 제한 규정 준수 [20, 21]. | • **B3 (Hazardous Material) Transporter Licence** [20] | `NP08-01 ISO Tank Yard Management SOP` [20] |

### 건강 적합성 (Fit-to-Work / Medical Clearance) 검증 조건
* "건강 적합성(Fit-to-Work / Medical Clearance)의 세부 혈압, 연령, 정기 검진 수치 및 검증 세부 가이드라인 수치는 **문서 내 확인 불가**".
* 단, 모든 고위험 작업 리더(Work Leader)와 크레인/Reach Stacker 운전원 및 rigger는 알코올/약물 중독 상태가 아니어야 하며 교대 조별 상시 피로도 감시 체계가 현장 Operation Team Leader에 의해 관리됩니다 [120, 284].

### 비상대응팀 (ERT) 상주 및 인원 확인 기준
* **상주 요건**: 모든 LNG 하역 이송 및 크레인 중량 리프팅 작업 시, 비상대응팀(ERT)은 개인 SCBA 호흡기와 방재 장비를 착용 및 완비한 상태에서 현장에 상시 대기(Standby)해야 하며, 즉각 연락이 가능한 전용 무전 채널이 확보되어야 합니다 [11, 284, 290].
* **인원 확인 기준**: 매일 생성되는 Onshore Regasification Daily Report(`NP08-33`) 및 Weekly Summary Report(`NP08-37`) 상의 설비 상주 임직원 전원(Personnel On Board) 명단을 매 교대 시프트마다 전수 전산 입력 대조하여 누락 인원 발생 시 조업이 정지될 수 있습니다 [471, 475].

---

## 6. 설비 격리 및 시스템 인터록 규격 (Isolation & Interlock Rules)

현장 배관에 잔류하는 극저온 액체 압축과 가스 고압 에너지 방출로 인한 파열 및 인화 사고를 예방하기 위해, 기계적 분리 정비 전 "안전 에너지 상태"를 규격대로 구현해야 합니다.

### 정비 전 안전 감압 (Depressurization) 타겟 압력 기준치

1. **하역 완료 후 빈 ISO Tank 분리 전 감압 기준**:
   * 하역 스키드 밸브 절차에 의거하여, 가스 벤팅 밸브를 Vent Stack(VT-101) 계통으로 점진적 개방하여 내부 가스 압력을 최종 **0.4 MPa** (T-203의 가압 Venting의 경우에는 최종 **0.1 MPa**)까지 서서히 감압해야 안전 분리가 승인됩니다 [243, 267, 268].
2. **극저온 호스 (Flexible Hose) 탈거 전 기밀 압력 기준**:
   * 유체 이송 완료 후 질소 플러싱 및 호스 배수 포트 완전 개방을 통해, 배관 내부 압력 지시가 최종 **0.0 MPa** (완전 압력 배제 상태)에 수렴되고 배관에 결빙 상(Icing)이 완전 제로인 것을 확인한 후에만 QCC 커플러 분리 작업을 집행할 수 있습니다 [270, 274].
3. **가스 계량 스키드 (Gas Sales Metering Skid) Calibration 전 격리 압력 기준**:
   * 교정 및 기계적 오리피스 탈거 작업을 위해 Meter Run 배관 잔압을 드레인(BV-1A-DRN) 및 safe vent(BV-1A-VENT) 포트로 점진 방출하여 최종 **0 barg**의 완전한 대기압 비가압 상태를 실증 도출한 후 기밀 LOTO 차단 자물쇠를 설치해야 합니다 [405].

### 특정 설비 작업 시 필수 선행 격리 (LOTO) 요건

* **대기식 기화기 (Ambient Air Vaporizer, AAV) 정비 격리**:
  * 대상 기화기(예: VAP-101/102)의 LNG 유입 자동 차단 밸브(XV 01 / XV 02)를 원격 SCADA 상에서 100% Closed 지시 내리고, 수지 밸브를 Locked Close 상태로 고정 [358, 360].
  * Upstream TRV 11 및 TRV 12 방향 수지 차단 밸브(BV-098, BV-099)를 수동 폐쇄 [354].
  * 안전 밸브 전단 차단 밸브(BV-007, BV-009, BV-011, BV-013) 폐쇄 [354].
  * 배관 내부 극저온 액 및 가스를 제거하기 위해 vent valve를 점진 개방하여 압력을 0 barg로 감압하고 무수 드라이 질소 가스로 가압 플러싱 세척을 완료할 것 [335, 360].
* **가스 판매 계량 스키드 (NG Metering M-101A/B) 격리**:
  * 듀얼 라인 교차 전환: Run A 정비 시 Standby인 Run B의 입/출구 밸브(MV-1B-IN / MV-1B-OUT)를 Full Open하고, Run A의 인입 제어 밸브(MV-1A-IN)를 SCADA 상에서 서서히 닫아 유량 이송 균형을 이행시킴 [402, 403].
  * Run A의 유량이 Flow Computer상 완전 "0"인 것을 최종 파악하고, 후단 토출 밸브(MV-1A-OUT)를 완전 폐쇄 [404].
  * 드레인 및 벤트 밸브(BV-1A-DRN, BV-1A-VENT)를 점진 개방하여 배관의 압력을 대기압인 0 barg 상태로 방출 [405].
  * 밸브 손잡이에 LOTO 잠금 자물쇠(Padlocks)를 물리적으로 체결하고 고유 번호가 각인된 차단 Tag를 걸어 조종실에 차단 이력을 보고 검증 완료함 [406].
* **ISO Tank 안전 밸브 (PSV) 교환 정비 격리**:
  * 반드시 PSV 안전밸브 교체 및 보수 전단 계통 차단 수지 밸브인 **A-14 밸브**를 완전 Closed 포지션으로 고정하여 내부 Cryogenic Liquid 고압 유입을 원천 제어한 후, 동 마찰 스파크를 방지하는 Anti-spark 공구를 동원해 손상된 기기를 탈거해야 함 [62, 63].

---
* 본 Safety & PTW Module Rules 설계 가이드라인은 **2025년 8월 8일 승인 제정된 Rev.0** 기준 규정집에 부합하도록 엄격 검증되었습니다 [4].
* 현장 공정 안전 엔지니어링 기록은 Juli Surungan(Operation Team Leader)의 검토와 Edi Hermawan(Site Manager) 및 Daniel Kweon(System Management Leader)의 최종 내부 서명 승인을 득하여 보존·적용 중입니다 [3].
