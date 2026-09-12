# [Planned Maintenance System (PMS) Master Specification]
## Onshore LNG Regasification Facility - Nias Island, Indonesia

본 엔지니어링 설계 정의서(Master Specification)는 Onshore LNG 재기화 시설(Regasification Facility) 및 PLTMG 연계 운영 프로그램의 핵심 설비 유지보수 관리 체계인 **Planned Maintenance System (PMS)**의 구현 표준을 수립합니다 [4, 11]. 본 사양서는 Nias Onshore Regasification Unit 내의 모든 극저온 장비, 배관, 밸브 및 계장 제어 시스템의 기계적 무결성과 예방 정비 기준을 정의합니다 [4, 12, 17, 21].

* **SOP 제정 기준**: Rev.0 (Enforcement Date: 2025.08.08) [3, 4]
* **작성 및 검토**: Juli Surungan Aprianto Simanjuntak (OTL), Shadiq Muhammad (SOML), Susilo (System Management) [2, 3]
* **최종 승인**: Edi Hermawan (Site Manager), Daniel Kweon (System Management Leader) [2, 3]

---

### 1. 설비별 정기 점검 항목 및 주기 매트릭스 (PM Task & Frequency Matrix)

본 설비 유지보수 주기는 일상 일과 점검(Weekly), 주기적 기밀/기능 검사(Monthly), 반기 교정(6 Monthly) 및 법적 정기 인증 시험(Yearly)으로 구분되어 설계되었습니다 [4].

| 설비 분류 (Equipment) | 기기 태그/코드 범위 (Tag/Code) | 정비/점검 작업명 (Task Description) | 점검 주기 (Frequency) | 세부 표준 점검 기준 및 물리 한계치 (Standard & Criteria) | 소스 근거 (Citations) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **극저온 LNG ISO Tank** | T-201, T-202, T-203, T-204 (CIMC T75 40ft) | 외관 정밀 검사 | Monthly | • Tank Frame, 외벽 표면, 페인트 도장, Valve Box 커버, 안전 표식(Sticker) 유무 육안 확인 • corner casting 및 구조 변형, 균열 유무 | [4] (ISOT-009~120), [7], [14] |
| | | Shut-off 밸브 상태 점검 | Monthly | • 차단 밸브의 작동 원활성 및 닫힘 상태 검사 | [4], [7] |
| | | I-BOX 원격 모니터링 수치 검증 | Monthly | • I-BOX 수치 판독 상태 검사 및 배터리 전압 잔량 검증 (배터리 기준 **≥ 40%** 보장) | [4], [6], [7] |
| | | 현장 압력/레벨 게이지 상태 점검 | Monthly | • Pressure Gauge 및 Level Gauge 파손, 커버 상태 육안 점검 | [4], [6], [7] |
| | | 배관 연결부 볼트 조임 관리 | Monthly | • 진동에 의한 이완 방지를 위해 배관 조인트부 재조임 (Retighten pipe joints) | [4] |
| | | PSV 장착 상태 및 외관 점검 | Monthly | • Pressure Safety Valve 외관 상태 점검 (결빙, 이물질 축적 확인) | [4], [6] |
| | | 탱크 진공도 상태 점검 | 6 Monthly | • 이중 진공 자켓형 탱크의 진공 상실 여부 측정 (Check Vacuum condition) | [4] |
| **대기식 기화기 (Ambient Air Vaporizer, AAV)** | VAP-101, VAP-102, VAP-103, VAP-104, VAP-105, VAP-106 | 알루미늄 핀 결빙 상태 점검 (Frost/Icing Level) | Weekly | • Fin 표면 성에 누적 상태 점검 및 Blockage 유무 확인 • 상태 기반(Condition-based) 로테이션 기준: **결빙 면적이 70%를 초과할 경우** 대기(Standby) 유닛으로 로테이션 후 자연 해동(Defrosting) 모드 전환 | [4] (VAP-01~06), [17] |
| | | 비정상 소음 및 진동 점검 | Weekly | • 가동 중 소음 및 진동 유무 점검 (Normal, no abnormal sound) | [4], [34] |
| | | 기화기 핀 구조적 무결성 점검 | Monthly | • Fin의 휨, 손상, 부식 상태 점검 (Fin integrity - bent, corroded, damaged) | [4], [34] |
| | | 기화기 핀 표면 세척 | Monthly | • 핀 표면에 누적된 이물질(먼지, 잔류 얼음, 새둥지 등) 세척 제거 | [4], [34] |
| | | 기화기 공정 상태 상시 모니터링 | Weekly | • 가동 유닛의 압력, 온도, 유량 지시 수치 모니터링 (DCS/SCADA 연동) | [4], [17] |
| | | 자동 디프로스트 차단 연동 검증 | Weekly | • 자동 전환 및 차단 연동 장치 기능 확인 (Verify automatic defrost system) | [4] |
| | | 현장 계기 및 제어실 지시치 교차 대조 | Monthly | • 입구/출구 라인의 현장 지시기(PG)와 제어실(DCS/SCADA PT) 지시치 오차율 검증 | [4] |
| | | 접지 본딩 선 상태 점검 | Weekly | • 정전기 방지용 접지 케이블 연결 상태 점검 (Check earth cable connection) | [4] |
| | (공통 PM Checklist) | 기화기 물리 정비 세척 및 고정 | Monthly | • Fin Cleaning, Floor Cleaning, Drainage Cleaning, Bolt Retightening at Flange | [33] |
| **NG Buffer Tank** | V-101 *(VT-101)* | 버퍼 탱크 본체 외관 점검 | Weekly | • 압력 용기 외벽 및 보온재 피복 상태 육안 점검 | [4] (VT-101) |
| | | 현장 지시기 및 원격 PT 교차 검증 | Monthly | • 현장 PI 07A와 제어실 PT 07A 간의 계측 정합성 대조 검증 | [4] (VT-101), [54] |
| **Gas Sales Metering Skid & 분석기** | M-101A, M-101B (Train A / Train B) | 미터 런 외관 및 상태 점검 | Weekly | • Metering Run 및 Barton 오리피스 차트 기록 장치 기계적 무결성 육안 점검 | [4] (Train A/B) |
| | | 현장/원격 압력 계측기 교차 대조 | Monthly | • Run A/B 전단 압력 지시치 비교 검증 (PT / PG / CCR 대조) | [4] |
| | | 현장/원격 온도 계측기 교차 대조 | Monthly | • Run A/B 전단 온도 지시치 비교 검증 (TT / TG / CCR 대조) | [4] |
| | Gas Chromatograph (EMERSON 470XA) | 가스 분석기 샘플링 라인 점검 | Weekly | • GC 샘플링 가이드 튜빙 및 피팅부 누출/응축수 축적 유무 점검 | [4] (CG) |
| | | 가스 분석용 표준 가스 실린더 잔량 점검 | Weekly | • 교정 및 기준 가스(Sampling Bottle) 잔량 모니터링 | [4] (CG) |
| | | 가스 분석기 정밀 교정 | Monthly | • Emerson 470XA 가스 크로마토그래프 정밀 교정(Calibration) 실시 | [4] (CG) |
| **현장 압력 전송기 (Pressure Transmitter)** | PT-17, PT-4A~F, PT-5A~F, PT-07B, PT-14A/B, PT-14, PT-16 | 압력 센서 전수 교정 | 6 Monthly | • 휴대용 루프 교정기(Portable Calibrator)를 사용하여 각 PT 장치의 오차 정밀 조정 및 캘리브레이션 성적서 작성 | [4] (PT-17~16), [39] |
| **현장 온도 전송기 (Temperature Transmitter)** | TT-5A~F, TT-8A~F, TT-14A/B, TT-20 | 온도 센서 전수 교정 | 6 Monthly | • 표준 온도 보정조를 사용하여 온도 센서의 정밀 캘리브레이션 및 SCADA 지시값 보정 계수 입력 | [4] (TT-5A~20), [39] |
| **초저온 및 공정 밸브 (Valves)** | Cryogenic V/V, Ball V/V, Manual V/V | 밸브 풀-스트로크 구동 검사 | Monthly | • 기계적 고착을 방지하기 위해 밸브의 Open/Close 스트로크 구동 시험 및 시트 패싱 점검 (대상 밸브: L-210, L-220, L-230, L-240, L-200, R-281, R-483, R-485, L-404, L-431, L-441, L-406, L-451, L-461, L-236, L-246, XV-2, XV-3, V-215, V-225, V-235, V-245, V-237, V-238, V-247, V-248, V-291, V-292, R-484, R-486, V-432, V-442, V-452, V-462, V-701, V-702, V-711, V-712, V-721, V-722, V-811, V-812, V-813, R-493, R-439, R-495, R-459, R-496, R-469, R-791, R-792, R-709, V-809 등) | [4] (Valve, Cryogenic V/V, Ball V/V) |
| **열팽창 안전밸브 (Thermal Relief Valve)** | TRV-10, TRV-11, TRV-12, TRV-13 | Pop-up 개방 기능 검사 | Yearly | • 설정 압력 상태에서 정상 작동(Popping Test) 및 시트 기밀 시험 실시 | [4] (TRV-10~13) |
| **과압 차단 안전밸브 (Pressure Safety Valve)** | PSV-1A, PSV-1B, PSV-1C, PSV-1D, PSV-1E, PSV-1F, PSV-3 | Pop-up 개방 기능 검사 | Yearly | • 오프사이트 벤치 테스트 또는 공인 기관 위탁 검정을 통한 성능 보존 및 명판 업데이트 (유효기간: 1년) | [4] (PSV-1A~3), [6] |
| **현장 보조 장비** | Cryogenic Flexible Hose | 호스 무결성 검사 | Weekly | • 초저온 액체 이송 호스의 피복 변형, 메쉬 꼬임, 외관 손상 여부 정밀 점검 (No cracks, wear, or damage on outer layer) | [4], [15], [25] |
| | Quick Close Coupler (QCC) | 퀵 커플러 마모 검사 | Weekly | • QCC 체결부 마모, 이물질 축적, Gasket/O-ring 손상 여부 점검 | [4], [15], [25] |
| | PBU-1, PBU-2 (Pressure Build-Up) | PBU 기화 핀 및 외관 정밀 검사 | Weekly | • Icing Level 점검, 이상 진동/소음 검사, Fin의 구조적 변형/부식 점검, 세척 및 접지선 연결 상태 점검 | [4], [14] |
| | N2 Cylinder Bottle (AAV, ESD, ISO Tank) | 질소 실린더 압력 점검 | Weekly | • 공압 작동식 전환 밸브(Switching V/V) 및 ESD 차단 시스템 구동을 위한 질소 가스 실린더 잔존 압력 및 수량 전수 검사 | [4], [53] |

---

### 2. 정비 착수 전 에너지 격리 및 LOTO 기준 (Pre-requisite Isolation Procedures)

정비 전 완벽한 제로 에너지 상태를 확보하기 위한 격리 및 LOTO 표준 가이드는 다음과 같습니다 [12, 21].

#### ① ISO Tank Unloading Skid 격리 (NP08-04)
정비 대상 Unloading Skid 라인을 격리하기 위해, ISO Tank 측의 모든 출구 수동/자동 차단 밸브를 먼저 폐쇄하고 Skid 고립 밸브를 잠가 물리적으로 분리합니다 [12, 221].
1. **ISO Tank 밸브 격리 목록**:
   * **A-3**: Liquid shut-off valve (ESV 차단 밸브) -> **Full Close** [12, 221]
   * **A-17**: Gas shut-off valve (ESV 차단 밸브) -> **Full Close** [12, 221]
   * **A-5**: PBU inlet shut-off valve -> **Full Close** [12, 221]
   * **A-6**: PBU inlet valve -> **Full Close** [12, 221]
   * **A-7**: Vapor valve -> **Full Close** [12, 221]
   * **A-2**: Bottom liquid inlet valve -> **Full Close** [12, 221]
2. **Unloading Skid 밸브 격리 목록**:
   * **BV-042 / BV-044 / BV-046 / BV-048**: LNG 이송 라인 격리 밸브 -> **Full Close** [12, 414]
   * **BV-038 / BV-039 / BV-040 / BV-041**: BOG 이송 라인 격리 밸브 -> **Full Close** [12, 414]
   * **(BV-107 & BV-065) / (BV-108 & BV-066)**: PBU 계통 가압 차단 밸브 -> **Full Close** [12, 414]

#### ② Ambient Air Vaporizer (AAV) 정비 격리 (NP08-07)
AAV 유닛 정비 또는 전환 작업 시, 상류 및 하류를 확실히 차단하여 공정 유체 유입을 완전히 봉쇄합니다 [17, 335].
1. **DCS/SCADA 제어반 격리**:
   * Operation Leader는 DCS에서 제어 대상 유닛 트레인의 원격 차단 밸브인 **XV 01** (VAP-101, 102 계통 입구) 또는 **XV 02** (VAP-103, 104 계통 입구)를 **Full Close** 조작하여 자동 연동을 비활성화합니다 [17, 356].
2. **Bypass 밸브 닫힘 확인**:
   * **BV-051** (Bypass XV 01) 및 **BV-063** (Bypass XV 02)이 물리적으로 완전히 닫혀(**Full Close**) 우회 유입이 없는지 확인합니다 [17, 355].
3. **상류(Upstream) 안전 장치 격리 차단**:
   * **BV-098** (upstream TRV 11) 및 **BV-099** (upstream TRV 12) 상태 확인 후 차단합니다 [17, 354].

#### ③ Gas Sales Metering Skid 격리 (NP08-09)
Custody Meter Run A 정비 및 교정을 진행할 때 Standby Run B로 유량을 우회시키고 대상 라인을 완전 격리 차단합니다 [21, 402].
1. **STANDBY (Run B) 가동**: MV-1B-IN(입구 수동 밸브) 및 MV-1B-OUT(출구 수동 밸브)을 100% 개방합니다 [21, 402].
2. **DUTY (Run A) 격리**: MV-1A-IN(입구 수동 밸브)과 MV-1A-OUT(출구 수동 밸브)을 완전히 닫아(**Full Close**) 유량을 원격 SCADA 상에서 0으로 확인합니다 [21, 403, 404].
3. **LOTO 태그 체결**: MV-1A-IN 및 MV-1A-OUT 밸브 핸들에 자물쇠(Padlock)와 물리적인 "Danger Tag"를 부착하여 정비 도중 타 오퍼레이터가 오조작하여 개방하지 못하도록 통제합니다 [21, 406].

#### ④ 전기, 계장 및 동력 에너지 격리
* 전기식 전송기(PT, TT) 교정 및 교체 작업 시, junction box 및 로컬 배전 제어반(Panel) 내에 해당하는 차단기(MCB)를 내린 후 LOTO를 잠금 처리하여 전기 스파크 및 감전을 완전 예방합니다 [39].
* HSE 담당자 및 오퍼레이션 팀 리더는 기계적/전기적 격리가 완벽히 구현된 것을 현장에서 정밀 계측하여 **'Zero Energy'** 임을 최종 검증하고 서명해야 합니다 [21, 406].

---

### 3. 안전 감압(Depressurization) 및 환경 안전 기준 (Safety Thresholds)

정비 작업자가 안전하게 배관을 분리하거나 정비를 시작할 수 있도록 공정 내부 압력을 완전히 대기압 상태로 강하시키고 독성/가연성 가스를 비워야 하는 기술 한계치 규격입니다 [12, 15, 20].

```
[안전 감압 및 분위기 가량 관리 표준]
- LNG 이송 호스 탈거 직전 압력: 0.0 MPa (Icing 결빙 제로 상태)
- 빈 ISO Tank 야드 이송 전 감압: < 0.05 MPa (체크리스트 합격선)
- 미터 런(Meter Run) 완전 격리 탈압: 0 barg (완전 제로 압력)
- 인입 영역 가스 분위기 안전 한계: < 10% LFL (LEL)
- 밀폐공간 정비 진입 허용 산소농도: 19.5% ~ 23.5% O2
```

1. **Unloading Skid 호스 탈거 잔류 압력**:
   * LNG 이송 및 분리가 모두 종료된 후 호스 내부의 가연성 천연 가스를 제거하기 위해 드레인/퍼징 밸브(A-4, A-11, A-12)를 개방하여 잔류 NG를 벤트 스택(VT-101) 측으로 완전히 방출합니다 [12, 270, 274].
   * 호스 압력계 지시 수치가 반드시 **0.0 Mpa**에 완전히 수렴하고, 배관 표면의 결빙(Icing)이 완전 제거된 것을 미지근한 물 분사 작업(Water spray nozzle)을 통해 전수 확인한 뒤 커플러 분리 작업을 인가합니다 [12, 271, 275].
2. **ISO Tank 야드 이송 전 안전 감압 설정치**:
   * 하역이 완료되어 Yard Empty Zone으로 복귀 이송되는 빈 탱크는 배송 진동 등으로 인한 압력 상승 폭발을 막기 위해 벤트 라인 밸브(A-13)를 열어 벤트스택으로 감압 배기합니다 [12, 268].
   * 감압 최종 완료 압력: **< 0.05 MPa** (또는 운전 상황에 따라 최종 호스 완전 분리 후 잔류 가스가 거의 없는 안정 상태)가 확보되었는지 확인해야 합니다 [12, 452].
3. **Gas Sales Metering Run 정비 전 압력**:
   * 계량 미터 런 Run A 정밀 분해 세척이나 스트레이너 필터 교체 전, drain valve(BV-1A-DRN) 및 vent valve(BV-1A-VENT)를 순차적으로 조작하여 대기로 유해 가스 가습 배출 없이 안전 Vent 처리합니다 [21, 405].
   * 정비 허용 목표 압력: **0 barg** [21, 405].
4. **질소 플러싱 및 분위기 불활성화(Nitrogen Purging)**:
   * 가연성 탄화수소 가스가 내부에 잔존하는 상태에서 분해 정비 시 화재 우려가 있으므로, 격리 완료된 호스, 기화기 튜브, Meter 배관 내부로 **Dry Nitrogen 가스**를 연속 주입하여 배관 속 잔여 가스를 완전히 불어내는 Purging 단계를 거칩니다 [12, 220, 235, 335].
5. **가스 감지 테스트(AGT) 허용 판정 기준**:
   * HSE 담당자는 정비 시작 전 및 작업 중에 정밀 다점 가스 디텍터를 현장에 휴대하여 모니터링합니다 [12, 290, 401].
   * **가연성 가스 허용 분위기**: **< 10% LEL** (BBM) 이하인 조건에서만 작업 지속 가능 [21, 401].
   * **질식 예방 산소 안전 농도(Oxygen Band)**: 산소 농도가 **< 19.5% 미만**인 구역(Asphyxiation Zone)이 감지되거나 질식 기절자 구조 작업을 할 때는 절대 무단 진입을 엄금하며, 오직 **공기호흡기(SCBA, Self-Contained Breathing Apparatus)**를 완전 착용한 인증 구조원만 진입하여 구조하도록 설계되었습니다 [20, 388].
   * **메탄 폭발 위험 즉시 대피**: 메탄 가스 외기 누적 농도가 **5% vol.** (대기 중 폭발 하한계)에 육박하면 전체 조업을 즉시 비상 중지(ESD)시키고 인원을 대피 반경 외부 소집점(Muster Station)으로 대피시켜야 합니다 [20, 380].

---

### 4. 표준 정비 절차 및 세부 체크리스트 (Maintenance Procedures & Tools)

각 설비의 표준 유지보수 절차는 제정된 규정 및 특수 공정 요구 조건에 입각하여 실행됩니다 [12, 15, 21].

#### ① 대기식 기화기(AAV) PM 정비 절차 (SOP: NP08-07, Checklist: NP08-19)
1. **Fin Cleaning 및 이물질 배출**: 기화기 전력 공급 및 LNG 유입 밸브를 차단(LOTO)하고, 알루미늄 열교환 핀 표면에 누적된 새둥지, 낙엽, 잔 얼음 조각을 전용 세척 도구로 깔끔히 비워냅니다 [15, 33, 457].
2. **Floor & Drainage Cleaning**: 기화기 하부 콘크리트 패드 지면에 응축된 물이 고여 동결되거나 지반을 약화시키지 않도록 하부 배수로(Drainage) 내부의 슬러지와 먼지를 청소합니다 [33, 35].
3. **Flange Bolt Retightening**: 열수 수축과 팽창에 의한 극저온 배관 플랜지 부위 볼트의 풀림 상태를 방지하기 위해 규격 토크 렌치를 사용하여 볼트 체결 토크(Bolt Retightening at Flange)를 균일하게 조입니다 [33].
4. **외관 변형 및 손상 정기 확인**: 알루미늄 헤더 튜브의 크랙, 휨, 누설 징후 및 뒤틀림이 없는지 육안 정밀 점검합니다 [34].

#### ② 극저온 Flexible Hose & Quick Close Coupler (QCC) 정비 절차 (SOP: NP08-06)
1. **Hose & Coupler 세척**: 무수(lint-free) 와이퍼 천과 건조 질소(Dry Nitrogen) 가스를 분사하여 초저온 호스 단부와 커플러 결속면 내부의 미세 금속 가루나 오염을 제거합니다 [15, 337].
2. **Consumable Parts 교체**: 결속면 내측 Cryogenic 테플론 가스켓(Gasket/O-ring)이 마모되거나 냉온 가압에 의해 굳고 미세 크랙이 발생했는지 점검하고, 탄성을 유실한 씰은 무조건 신품으로 1대 1 대체 교체합니다 [15, 338].
3. **초저온 전용 윤활제 도포**: Coupler의 클램프 캠 레버 기계식 잠금 메커니즘 구동부에 제조사가 정식 보증하는 초저온 전용 불활성 윤활제(Cryogenic-approved lubricant)를 얇게 도포하여 원활히 결착 및 self-locking 작동하도록 처리합니다 [15, 338].
4. **허용 곡률 반경 준수**: 보존 적치대 거치 시, 호스의 내부 응력 손상을 유발하지 않도록 곡률 반경(Bending Radius)을 배관 사양 이상인 **외경(OD)의 최소 10배 이상(≥ 10 x hose OD)** 느슨하게 꼬아 거치 보존합니다 [15, 341].

#### ③ PSV(안전밸브) 분해/대체 절차 (SOP: NP08-05, Form: NP08-07)
1. **차단 밸브 폐쇄**: 교체 타겟 PSV 전단에 설계된 수동 격리 볼 밸브 **A-14**를 완전 수동 차단(Full Close)하여 공정 고압 가스가 작업자 측으로 방출되는 경로를 영구 차단합니다 [14, 63].
2. **Anti-Spark 특수 공구 의무 적용**: 가연성 천연 가스가 잔류할 수 있는 안전구역 내에서의 불꽃 폭발 스파크를 영구 방지하기 위해, 기계 요원은 연강 및 합금 합성에 입각하여 설계된 **방폭 특수 공구(Non-sparking / Anti-spark tools)**만을 밀착 체결하여 기존 PSV 볼트를 조심스럽게 탈거합니다 [14, 63].
3. **Nozzle 세척 및 수압 교정**: PSV 오리피스 인입부 노즐 표면의 오염물질을 세척하고, 새로 대체되어 삽입될 PSV 시리얼 번호와 유효 기간이 보증된 Calibration 성적서 사본을 준비합니다 [14, 63, 64].
4. **신규 밸브 토크 조임 설치**: 제조사 권장 조임 하중을 정량 토크 렌치로 균일하게 분배 조임하고 밸브 A-14를 다시 아주 천천히 전면 개방(Slow Open)합니다 [14, 64].

#### ④ Gas Sales Metering Skid PM 절차 (SOP: NP08-09)
1. **Strainer Filter 분해 세척**: Orifice 미터 전단에 부착된 Strainer의 덮개를 분착하여 내부에 적치된 용접 슬래그, 녹, 먼지 입자 등의 막힘 현상을 청소 배출하고 하우징 기밀을 보존합니다 [21, 464].
2. **전송 계측 센서 표면 먼지 세척**: PT, TT 및 GC 샘플링 가이드 라인의 표면 습기 및 오염 부위를 유기 용제(Solvent) 성분 없이 깨끗한 건조 면포만 사용하여 닦아내 계측 전도성을 회복시킵니다 [21, 463].

---

### 5. 필수 작업 자격 및 보호구 요건 (Competency & PPE)

고압 극저온 가스 취급에 입각하여 완벽한 인적 정합성을 규명하는 역량 매트릭스 및 방벽 수단입니다 [12, 14, 15, 21].

#### ① 정비 엔지니어 필수 법적/사내 자격 요건 (Competency Matrix)
* **Maintenance Mechanical Engineer & Technician**:
  * 극저온 가스 안전 취급 전문 교육 수료 및 사내 PTW/LOTO 오퍼레이터 이수증 필수 보유 [12, 188].
  * 인도네시아 정력 기술 법령 기준에 입각한 공인 **기술자 면허 증명서(Technician Certificate)** 확보 [12, 196].
* **Lifting / Reach Stacker Operator (LEO)**:
  * 인도네시아 노동부 발급 정식 면허인 **SIO(Surat Izin Operasi)**를 필수로 지참해야 하며, 25~100톤 중량 인양을 전담하기 위해 최소 **CLASS II 이상의 기동 라이센스**를 필수로 소지해야 합니다 [12, 80, 97].
* **HSE Officer / Authorized Gas Tester (AGT)**:
  * 가스 테스트를 통한 구역 기밀 및 가스 농도를 측정 및 공인 보증하기 위해 공인 기관에서 정식 발급한 **AGT(Authorized Gas Tester) 인증서**가 필수적입니다 [12, 200].
* **Transporter / Truck Driver**:
  * 빈 컨테이너 차량일지라도 ex-hazardous 물성 규정이 적용되므로 인도네시아 교통부 지정 유독물질 운송 라이센스인 **B3 운송 면허 자격증**을 상시 지참하고 운전대를 소지해야 합니다 [7, 21, 48].

#### ② 작업 상황별 안전 보호구 (PPE Matrix) 정의
설비 가동 및 PM 상황별로 착용해야 할 APD(개인보호구)는 아래 매트릭스에 입각해 밀착 관리됩니다 [12, 202].

| 작업 성격 / 구분 | 필수 PPE 장구 상세 사양 및 적용 목적 | 소스 근거 |
| :--- | :--- | :--- |
| **일반 기계/전기 정비 및 현장 점검** | • **면 카바롤 (Cotton Coverall)**: 화재 노출 시 녹아내리지 않는 100% Cotton 방염 재질<br>• **안전화 (Safety Shoes)**: 유화수소 저항력 및 금속 뚫림 방지(hydrocarbon and metal penetration resistant, non-slip) 바닥 설계 사양 (ANSI Z41 또는 EN 345 표준 준수)<br>• **턱끈식 안전모 (Safety Helmet with chinstrap)** (ANSI Z89.1 준수)<br>• **안전안경 (Safety Glasses / Goggles)**: 현장 기계 파편 방지 (EN 166 또는 ANSI Z87.1 준수) | [12] (92, 93, 96, 202) |
| **초저온 배관 이슬점 체크, 호스 체결 및 해제, 액체 누출 트러블슈팅** | • **극저온 차단 전용 장갑 (Cryogenic Gloves)**: 냉동 번(Burns) 방지 사양<br>• **얼굴 전면 보호 실드 (Face Shield)**: 비산 액체 튐에 의한 안구 및 안면 괴사 예방<br>• **저온 전용 자켓/에이프런 (Cryogenic Coat / Apron)**: 액체 차가움의 신체 침투 방지 및 방온막 형성 | [12] (202, 215), [15] (335) |
| **화학 유제 취급 및 가스킷 접착 세척** | • **화학물질 차단 코트 및 화학 고무 장갑** (Chemical Coat, Rubber Gloves) | [12] (202) |
| **산소 결핍 의심 밀폐 공간 및 메탄 가스 퍼지 배기 구역 진입 시** | • **양압식 공기 호흡기 세트 (SCBA, Self-Contained Breathing Apparatus)**: 산소 농도 19.5% 미만 구역 구호 및 밀실 정비 시 100% 필수 장착 적용 | [20] (388) |

---

### 6. 정비 완료 후 복구 및 시운전 검증 기준 (Reinstatement & Sign-off)

유지보수 조작이 완료된 설비의 정합성을 입증하고 안전하게 가스를 재공급하기 위한 최종 승인 및 Reinstatement 가이드라인입니다 [12, 15, 21].

#### ① 기밀 및 압력 누설 정밀 시험 (Tightness & Leak Test)
1. **공정 재연계 가압 기밀 시험**:
   * 정비가 끝난 미터 런 M-101A에 가스를 서서히 흘려보내기 전, 상류 밸브 MV-1A-IN을 아주 조금만 열어(open crack) 압력을 서서히 채워 배관 수축 응력을 고르게 관리합니다 [21, 408].
   * 연결 플랜지, 볼트 조인트부, PSV 마운팅 노즐 부위에 기품 비누 거품액 용제인 **Snoopy 검사액**을 고르게 뿌린 뒤 기포 분출 누출이 발생하지 않는지 육안 정밀 검출 테스트를 수행합니다 [14, 64, 21, 409].
2. **초저온 호스 및 QCC 내압 시험 (`NP08-06`)**:
   * 퀵 커플러 체결이 완료된 후 기체 질소를 사용한 기밀 누설 시험을 반드시 시행합니다 [12, 215].
   * 정기적 호스 안전 인장 성능 검사는 working pressure의 **1.5배** 압력으로 수압/공압 검증을 집행합니다 [15, 339].
   * 현장 질소 가스 기밀 시험의 가압 기준은 **MAWP의 ±1.1배** 설계 한도 압력으로 질소 라인을 체결하여 최소 **10 ~ 15분 이상** 압력을 정지 유지시켜 압력 지시침의 강하 하강 추세가 단 **0.01 MPa**도 없이 평형을 이루는지 최종 검증하고 기록합니다 [15, 339, 340].
   * 합격 기준치: 압력 저하 제로, soap 버블 발생 개수 0개 실현 [15, 340].

#### ② 정전기 차단 접지 및 저항 허용 수치 검증
* Unloading Skid 위에 안치되어 배관을 연결하는 ISO Tank 바디와 대지 접지극 간에 장착된 정전기 방지용 접지 클램프(Grounding cable & clamp)의 전류 흐름을 확인합니다 [12, 211, 212].
* E/I 담당자는 오프라인 접지 저항 시험기(Earth Resistance Tester)를 연결 지점에 연계하여 정밀 계측합니다 [12, 212].
* **안전 저항 허용 규격 수치**: **5 Ohm 미만 (< 5 Ohm)**을 필수로 달성하여 기록 대장에 로깅해야 안전 전환 조업이 정식 허가됩니다 [12, 212, 415].

#### ③ LOTO 해제 순서 및 복구 워크플로우
1. 정밀 조립 및 Reinstatement가 완료되면 역순으로 LOTO 패드락과 안전 "Danger Tag"를 회수 제거합니다 [21, 466].
2. **접지 케이블 및 클램프의 이탈 시점은 매우 엄격합니다**: 호스 내부의 가스 벤트 배출이 전밀 완료되어 분해된 뒤, 대기 가스 측정이 완전 종료된 최종 시점인 **가장 마지막 단계(Removed Last)에 접지 장치를 최종 철거해야 합니다** [12, 278, 25, 449].
3. **정비 시운전 복구 및 마감 서명 라인**:
   * 정비 성적서 및 Reinstatement 체크리스트 폼은 실제 수리를 진행한 **정비 기술 요원(E/I Technician 또는 Mechanical Engineer)**이 1차 작성 서명합니다 [14, 61, 21, 396].
   * 이후 현장 공정 변수의 제안적 합격성을 감시하고 검토 서명하는 **Operation Team Leader(OTL)**의 중간 승인을 득합니다 [21, 396, 410].
   * 마지막으로, 모든 법적 및 안전 기준 부합 여부를 최종 검인하여 플랜트 재가동 명령을 원격 DCS실에 발동하는 **Site Manager(Plant Manager)**의 종합 최종 수필 서명을 획득해 문서고에 영구 보존합니다 [21, 396, 411].
