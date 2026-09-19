// src/cmms-hmi-control-maps/BufferingHmiPlaceholderView.tsx
//
// PURPOSE
//   HMI CONTROL MAPS 섹터의 향후 "Buffering" 화면 자리표시자. 순수 프레젠테이션
//   전용 — DB/context 의존 없음. IsoTankLogisticsPlaceholderView.tsx(Stage C4)와
//   동일한 자리표시자 패턴을 그대로 따른다.

export function BufferingHmiPlaceholderView() {
  return (
    <div className="p-8 text-center text-slate-500">
      <div className="text-sm font-bold uppercase mb-2">Buffering HMI Map</div>
      <div className="text-xs">Coming in a later phase.</div>
    </div>
  );
}
