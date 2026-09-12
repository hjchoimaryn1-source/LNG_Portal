// src/components/cmms/scadaStyles.ts
//
// PURPOSE
//   CMMS 화면 전체(목록/모달/트리/버튼)가 LNGPortalApp.tsx의 WIN_TAB_INACTIVE와
//   시각적으로 통일되도록, 반복되는 Win98 베벨 스타일 클래스를 한 곳에 모아둔다.
//   스타일을 바꿀 일이 생기면 이 파일만 고치면 CMMS 화면 전체에 반영된다.
//
//   베벨 원리:
//     - "튀어나온"(raised) 요소(버튼, 바깥 패널): 위/왼쪽 밝게, 오른쪽/아래 어둡게
//     - "들어간"(sunken) 요소(입력창, 데이터 표시 영역): 반대로 위/왼쪽 어둡게

import type { CmmsAssetRow } from '../../context/CmmsAwarePortalProvider';

/** 기본 버튼 (튀어나온 베벨) — LNGPortalApp.tsx WIN_TAB_INACTIVE와 동일 톤 */
export const BEVEL_BUTTON =
  'bg-[#d4d0c8] text-slate-800 font-semibold text-[11px] px-3 py-1 border-t-2 border-l-2 border-r-2 border-b-2 ' +
  'border-t-white border-l-white border-r-[#707070] border-b-[#707070] hover:bg-[#dfe5ea] ' +
  'active:border-t-[#707070] active:border-l-[#707070] active:border-r-white active:border-b-white ' +
  'cursor-pointer transition-none select-none disabled:opacity-50 disabled:cursor-not-allowed';

/** 눌린(active/selected) 상태의 버튼 — 베벨이 반대로 뒤집혀 "눌려있다"는 느낌 */
export const BEVEL_BUTTON_PRESSED =
  'bg-[#c0bcb2] text-slate-900 font-semibold text-[11px] px-3 py-1 border-t-2 border-l-2 border-r-2 border-b-2 ' +
  'border-t-[#707070] border-l-[#707070] border-r-white border-b-white cursor-pointer transition-none select-none';

/** 작은 아이콘 버튼(닫기 X, 트리 +/- 등) */
export const BEVEL_ICON_BUTTON =
  'bg-[#d4d0c8] text-slate-800 text-[10px] font-bold border border-t-white border-l-white border-r-[#707070] border-b-[#707070] ' +
  'hover:bg-[#dfe5ea] active:border-t-[#707070] active:border-l-[#707070] active:border-r-white active:border-b-white ' +
  'cursor-pointer transition-none select-none flex items-center justify-center leading-none';

/** 바깥 패널(창/모달 프레임) — 튀어나온 느낌 */
export const RAISED_PANEL = 'bg-[#ece9e2] border-2 border-t-white border-l-white border-r-[#505050] border-b-[#505050]';

/** 안쪽 데이터 영역(테이블, 입력창, 트리) — 들어간 느낌 */
export const SUNKEN_PANEL = 'bg-white border-2 border-t-[#707070] border-l-[#707070] border-r-white border-b-white';

/** 타이틀 바 (모달 헤더, 패널 헤더) */
export const TITLE_BAR = 'bg-slate-800 text-white px-3 py-1.5 font-mono text-[11px] font-bold tracking-wide';

/** 입력창 (검색창, select) — 들어간 느낌 + 모노스페이스 */
export const SUNKEN_INPUT =
  'bg-white border-2 border-t-[#707070] border-l-[#707070] border-r-white border-b-white px-2 py-1 text-[12px] ' +
  'font-mono focus:outline-none focus:bg-yellow-50';

export const CRITICALITY_LABEL: Record<CmmsAssetRow['criticality'], string> = {
  CRITICAL: 'CLASS A (CRITICAL)',
  HIGH: 'CLASS A (HIGH)',
  MEDIUM: 'CLASS B (MEDIUM)',
  LOW: 'CLASS C (LOW)',
};

export const CRITICALITY_BADGE: Record<CmmsAssetRow['criticality'], string> = {
  CRITICAL: 'text-red-700 bg-red-50 border-red-700',
  HIGH: 'text-orange-700 bg-orange-50 border-orange-700',
  MEDIUM: 'text-amber-700 bg-amber-50 border-amber-700',
  LOW: 'text-slate-600 bg-slate-50 border-slate-500',
};

export const CRITICALITY_DOT: Record<CmmsAssetRow['criticality'], string> = {
  CRITICAL: 'bg-red-600',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-slate-400',
};

export const STATUS_BADGE: Record<CmmsAssetRow['status'], string> = {
  OPERATIONAL: 'text-emerald-800 bg-emerald-50 border-emerald-700',
  MAINTENANCE: 'text-blue-800 bg-blue-50 border-blue-700',
  STANDBY: 'text-slate-700 bg-slate-100 border-slate-500',
  OUT_OF_SERVICE: 'text-red-800 bg-red-50 border-red-700',
};

export const STATUS_LABEL_KO: Record<CmmsAssetRow['status'], string> = {
  OPERATIONAL: '운영중',
  MAINTENANCE: '정비중',
  STANDBY: '대기',
  OUT_OF_SERVICE: '가동중지',
};

/**
 * ISA-101 알람 4단계 색상 (CMMS_Architecture.md §3.6.3)
 * PRIORITY_4_LOW: §3.6.3 설계 충돌 해소 — 신규 #3B82F6 대신 기존 Status Badge Blue(#0284c7) 재사용.
 */
export const ALARM_COLORS = {
  PRIORITY_1_CRITICAL: '#EF4444',
  PRIORITY_2_HIGH: '#F97316',
  PRIORITY_3_MEDIUM: '#EAB308',
  PRIORITY_4_LOW: '#0284c7',
} as const;
