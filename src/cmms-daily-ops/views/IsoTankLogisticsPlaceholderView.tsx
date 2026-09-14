// src/cmms-daily-ops/views/IsoTankLogisticsPlaceholderView.tsx
//
// PURPOSE
//   Stage C4 "ISO Tank Logistics" 탭 — 타임라인/dwell/history 뷰는 명시적으로
//   후속 단계로 연기됐다(data map §4 권고에 따라 GlobalFleetHubView.tsx로도
//   라우팅하지 않음). 이 자리표시자만 둔다.

export function IsoTankLogisticsPlaceholderView() {
  return (
    <div className="p-8 text-center text-slate-500">
      <div className="text-sm font-bold uppercase mb-2">ISO Tank Logistics</div>
      <div className="text-xs">Coming in a later phase.</div>
    </div>
  );
}
