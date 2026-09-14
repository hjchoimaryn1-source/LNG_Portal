// src/cmms-daily-ops/pid/PIDOverlayView.tsx
//
// PURPOSE
//   Live P&ID 오버레이(B4) + 2D pan/scroll 컨테이너(B5). JSK concept
//   diagram을 고정 네이티브 픽셀(1316x924)로 렌더링하고, 이미 calibrated=true인
//   태그만 배지로 표시한다. Stage A에서 좌표 시딩이 보류돼 좌표 테이블이
//   비어 있으므로(pidReconciliationSchema.ts 헤더 참고), "Calibrate Tags"
//   토글로 클릭 위치 → 태그 매핑을 직접 저장할 수 있게 했다.
//
//   BACKGROUND_IMAGE_URL: JSK 원본 다이어그램 파일이 저장소에 없어(Stage A
//   deviation) 자리표시자를 그린다 — HJ가 자산을 제공하면 이 상수만 채우면 된다.
//
//   모니터링/입력 전용 뷰 — DailyReportPrintView는 이 폴더(src/cmms-daily-ops/pid/*)를
//   임포트하지 않는다(구조적으로 Stage C 인쇄 산출물과 분리, 이 컴포넌트 자체가
//   그 보장을 강제하지는 않지만 임포트 그래프상 단방향임을 명시해 둔다).

'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { RAISED_PANEL, BEVEL_BUTTON, BEVEL_BUTTON_PRESSED } from '../../components/cmms/scadaStyles';
import { AAV_EQUIPMENT_TAGS } from '../components/patrol/AavPatrolForm';
import type { PatrolDomain } from '../types/patrolLog';
import { PidTagBadge } from './PidTagBadge';
import { CalibrationTagPicker } from './CalibrationTagPicker';

const NATIVE_WIDTH = 1316;
const NATIVE_HEIGHT = 924;
const PID_COORDINATES_API = '/api/v1/cmms/pid-tag-coordinates';
const BACKGROUND_IMAGE_URL: string | null = null;
const ZOOM_LEVELS = [1, 1.5] as const;

const CANDIDATE_TAG_DOMAIN: Record<string, PatrolDomain> = Object.fromEntries(
  AAV_EQUIPMENT_TAGS.map((tag) => [tag, 'aav' as PatrolDomain])
);
const PRIMARY_COLUMN_BY_DOMAIN: Partial<Record<PatrolDomain, string>> = {
  aav: 'pressure_gauge_us_bar',
};

interface CoordinateDto {
  tagId: string;
  x: number;
  y: number;
  calibrated: boolean;
}

interface PendingPick {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
}

export function PIDOverlayView() {
  const [coordinates, setCoordinates] = useState<CoordinateDto[]>([]);
  const [calibrateMode, setCalibrateMode] = useState(false);
  const [zoom, setZoom] = useState<(typeof ZOOM_LEVELS)[number]>(1);
  const [pendingPick, setPendingPick] = useState<PendingPick | null>(null);

  useEffect(() => {
    fetch(PID_COORDINATES_API, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { success: boolean; records: CoordinateDto[] }) => {
        if (json.success) setCoordinates(json.records);
      })
      .catch(() => {});
  }, []);

  const candidateTagIds = Object.keys(CANDIDATE_TAG_DOMAIN);
  const calibratedTagIds = new Set(coordinates.filter((c) => c.calibrated).map((c) => c.tagId));
  const uncalibratedTagIds = candidateTagIds.filter((tag) => !calibratedTagIds.has(tag));
  const visibleBadges = coordinates.filter((c) => c.calibrated);

  function handleCanvasClick(e: MouseEvent<SVGSVGElement>) {
    if (!calibrateMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPendingPick({
      x: ((e.clientX - rect.left) / rect.width) * NATIVE_WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * NATIVE_HEIGHT,
      screenX: e.clientX - rect.left,
      screenY: e.clientY - rect.top,
    });
  }

  async function handlePickTag(tagId: string) {
    if (!pendingPick) return;
    const { x, y } = pendingPick;
    await fetch(PID_COORDINATES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId, x, y, calibrated: true }),
    });
    setCoordinates((prev) => [...prev.filter((c) => c.tagId !== tagId), { tagId, x, y, calibrated: true }]);
    setPendingPick(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-700 uppercase">P&ID LIVE OVERLAY</span>
          <button
            type="button"
            onClick={() => setCalibrateMode((v) => !v)}
            className={calibrateMode ? BEVEL_BUTTON_PRESSED : BEVEL_BUTTON}
          >
            Calibrate Tags
          </button>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-600">ZOOM</span>
          {ZOOM_LEVELS.map((z) => (
            <button key={z} type="button" onClick={() => setZoom(z)} className={zoom === z ? BEVEL_BUTTON_PRESSED : BEVEL_BUTTON}>
              {z * 100}%
            </button>
          ))}
        </div>
      </div>

      <div className={`${RAISED_PANEL} relative overflow-scroll`} style={{ maxWidth: '100%', maxHeight: 640 }}>
        <div style={{ position: 'relative', width: NATIVE_WIDTH * zoom, height: NATIVE_HEIGHT * zoom }}>
          <svg
            width={NATIVE_WIDTH * zoom}
            height={NATIVE_HEIGHT * zoom}
            viewBox={`0 0 ${NATIVE_WIDTH} ${NATIVE_HEIGHT}`}
            style={{ display: 'block', cursor: calibrateMode ? 'crosshair' : 'default' }}
            onClick={handleCanvasClick}
          >
            {BACKGROUND_IMAGE_URL ? (
              <image href={BACKGROUND_IMAGE_URL} width={NATIVE_WIDTH} height={NATIVE_HEIGHT} />
            ) : (
              <>
                <rect width={NATIVE_WIDTH} height={NATIVE_HEIGHT} fill="#e8e4dc" stroke="#b0aaa0" />
                <text x={NATIVE_WIDTH / 2} y={NATIVE_HEIGHT / 2} textAnchor="middle" fontSize={16} fill="#8b8478" fontFamily="monospace">
                  JSK CONCEPT DIAGRAM — background image not yet provided
                </text>
              </>
            )}
            {visibleBadges.map((c) => (
              <PidTagBadge
                key={c.tagId}
                tagId={c.tagId}
                x={c.x}
                y={c.y}
                domain={CANDIDATE_TAG_DOMAIN[c.tagId]}
                primaryColumn={
                  CANDIDATE_TAG_DOMAIN[c.tagId] ? PRIMARY_COLUMN_BY_DOMAIN[CANDIDATE_TAG_DOMAIN[c.tagId]] : undefined
                }
              />
            ))}
          </svg>
          {pendingPick && (
            <CalibrationTagPicker
              screenX={pendingPick.screenX}
              screenY={pendingPick.screenY}
              candidateTags={uncalibratedTagIds}
              onPick={handlePickTag}
              onCancel={() => setPendingPick(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
