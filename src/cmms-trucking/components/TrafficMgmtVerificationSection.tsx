// src/cmms-trucking/components/TrafficMgmtVerificationSection.tsx
//
// NP03-08 Traffic Management Plan for LNG Trucking Operation — "Verification
// Section" ONLY (public/docs/sop/NP-03.md §7.08). 4개 항목명(Work Permit
// (Hot/Cold), Gas Test Result, PPE Inspection, Environmental Check)은 원문
// 표 그대로다.
//
// 하드 바운더리 준수: 이 컴포넌트는 gasSafetyAdapter.ts/ptwStatusMapper.ts/
// ptwPermitDao.ts 등 PTW·가스테스트 어댑터를 직접 호출하지 않는다.
// truck_inspections 테이블에는 특정 PTW 허가서(permit_ref_no)와의 연결
// 컬럼이 없고, "이 트럭킹 작업이 어떤 허가서에 종속되는가"를 정하는 것은
// Phase 11a Stage 1 지시사항이 명시적으로 새로운 통합 지점으로 분류해
// STOP을 요구한 영역이다. 따라서 실제 값은 상위 컴포넌트가 이미 조회해
// 둔 경우에만 `values` prop으로 주입하고, 그 전까지는 PENDING으로만
// 표시하는 순수 읽기 전용 디스플레이로 구현한다. 실제 연동 여부/방식은
// phase11a-signoff-summary.md에 HJ 결정 필요 항목으로 플래그되어 있다.

import { SUNKEN_PANEL, TITLE_BAR } from '../../components/cmms/scadaStyles';
import { SopQuickLinkBar } from '../../components/sop';
import { encodeSopQuickLinkTarget } from '../../components/sop/utils/sopQuickLinkTarget';

export type VerificationResult = 'Pass' | 'Fail' | 'PENDING';

export interface TrafficMgmtVerificationValues {
  workPermitHotCold: VerificationResult;
  gasTestResult: VerificationResult;
  ppeInspection: VerificationResult;
  environmentalCheck: VerificationResult;
}

const DEFAULT_VALUES: TrafficMgmtVerificationValues = {
  workPermitHotCold: 'PENDING',
  gasTestResult: 'PENDING',
  ppeInspection: 'PENDING',
  environmentalCheck: 'PENDING',
};

const RESULT_STYLE: Record<VerificationResult, string> = {
  Pass: 'text-emerald-700 bg-emerald-50 border-emerald-700',
  Fail: 'text-red-700 bg-red-50 border-red-700',
  PENDING: 'text-slate-500 bg-slate-50 border-slate-400',
};

const FIELDS: { key: keyof TrafficMgmtVerificationValues; label: string }[] = [
  { key: 'workPermitHotCold', label: 'Work Permit (Hot/Cold)' },
  { key: 'gasTestResult', label: 'Gas Test Result' },
  { key: 'ppeInspection', label: 'PPE Inspection' },
  { key: 'environmentalCheck', label: 'Environmental Check' },
];

interface TrafficMgmtVerificationSectionProps {
  /** 실제 PTW/가스 테스트 상태를 상위에서 이미 조회한 경우에만 채운다. 미전달 시 전부 PENDING. */
  values?: Partial<TrafficMgmtVerificationValues>;
  onOpenSopReference?: (target: string) => void;
}

export function TrafficMgmtVerificationSection({ values, onOpenSopReference }: TrafficMgmtVerificationSectionProps) {
  const resolved = { ...DEFAULT_VALUES, ...values };

  return (
    <div className={`${SUNKEN_PANEL} p-3`}>
      <div className={TITLE_BAR}>NP03-08 VERIFICATION SECTION (READ-ONLY)</div>
      <div className="bg-slate-100 px-2 py-1 border-b border-slate-300 mt-1">
        <SopQuickLinkBar
          context="TRUCKING_TRAFFIC_VERIFICATION"
          onSelect={(link) => onOpenSopReference?.(encodeSopQuickLinkTarget(link))}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="flex items-center justify-between text-[12px] border border-slate-300 px-2 py-1">
            <span>{f.label}</span>
            <span className={`px-2 py-0.5 border rounded text-[11px] font-semibold ${RESULT_STYLE[resolved[f.key]]}`}>
              {resolved[f.key]}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 mt-2">
        * PTW/가스 테스트 실시간 연동 미배선 — permit_ref_no 매핑 결정 후 상위 컴포넌트가 실제 값을 values prop으로 주입해야 함.
      </p>
    </div>
  );
}
