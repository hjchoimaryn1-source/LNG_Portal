// src/hmi/faceplate/FaceplateSparkline.tsx
//
// PURPOSE
//   HMI-2d-3b — FaceplateReadoutRow.tsx 행마다 붙는 24시간 미니 트렌드.
//   recharts(기존 설치, ^3.10.1)로 라인 + L/LL/H/HH 임계값 tick(정의된 것만,
//   getAlarmThresholds() undefined 반환분은 렌더하지 않음)을 그린다.
//   connectNulls={false} — reading_status='no_reading' 슬롯(HMI-2d-3a에서
//   value:null로 강제)이 선을 이어붙이지 않고 실제 갭으로 보이게 한다.

'use client';

import { LineChart, Line, ReferenceLine, ResponsiveContainer } from 'recharts';
import { useFaceplateTrend } from '../hooks/useFaceplateTrend';
import { getAlarmThresholds } from '../config/alarmPriorityRules';
import type { PatrolDomain } from '../types/hmiCore';
import type { FaceplateTrendPoint } from '../hooks/useFaceplateTrend';

export interface FaceplateSparklineProps {
  domain: PatrolDomain;
  equipmentTag: string;
  columnName: string;
}

function trendArrow(points: FaceplateTrendPoint[]): string {
  if (points.length < 2) return '—';
  const latest = points[points.length - 1].value;
  const previous = points[points.length - 2].value;
  if (latest === null || previous === null) return '—';
  if (latest > previous) return '▲';
  if (latest < previous) return '▼';
  return '—';
}

export function FaceplateSparkline({ domain, equipmentTag, columnName }: FaceplateSparklineProps) {
  const points = useFaceplateTrend(domain, equipmentTag, columnName);
  const thresholds = getAlarmThresholds(domain, columnName);

  if (points.length === 0) {
    return <span className="text-[9px] text-slate-400 italic">추세 없음</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <div className="w-16 h-6 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#1976D2"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
            {thresholds?.LL !== undefined && <ReferenceLine y={thresholds.LL} stroke="#D32F2F" strokeDasharray="2 2" />}
            {thresholds?.L !== undefined && <ReferenceLine y={thresholds.L} stroke="#F57C00" strokeDasharray="2 2" />}
            {thresholds?.H !== undefined && <ReferenceLine y={thresholds.H} stroke="#F57C00" strokeDasharray="2 2" />}
            {thresholds?.HH !== undefined && <ReferenceLine y={thresholds.HH} stroke="#D32F2F" strokeDasharray="2 2" />}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <span className="text-[10px] font-mono text-slate-500 w-2.5 text-center">{trendArrow(points)}</span>
    </div>
  );
}
