// src/cmms-daily-ops/pid/CalibrationTagPicker.tsx
//
// PURPOSE
//   캘리브레이션 모드에서 다이어그램 클릭 시 뜨는 미보정 태그 선택 팝업.

'use client';

import { RAISED_PANEL, BEVEL_BUTTON } from '../../components/cmms/scadaStyles';

export interface CalibrationTagPickerProps {
  screenX: number;
  screenY: number;
  candidateTags: string[];
  onPick: (tagId: string) => void;
  onCancel: () => void;
}

export function CalibrationTagPicker({ screenX, screenY, candidateTags, onPick, onCancel }: CalibrationTagPickerProps) {
  return (
    <div
      className={`${RAISED_PANEL} absolute z-50 p-2 space-y-1 w-40 max-h-48 overflow-y-auto`}
      style={{ left: screenX, top: screenY }}
    >
      <div className="text-[10px] font-bold text-slate-700 uppercase pb-1 border-b border-[#c8c2b5]">
        태그 선택 (캘리브레이션)
      </div>
      {candidateTags.length === 0 ? (
        <div className="text-[10px] text-slate-500 px-1 py-1">보정할 태그 없음</div>
      ) : (
        candidateTags.map((tagId) => (
          <button
            key={tagId}
            type="button"
            onClick={() => onPick(tagId)}
            className="block w-full text-left text-[11px] font-mono px-2 py-1 hover:bg-[#dfe5ea] cursor-pointer"
          >
            {tagId}
          </button>
        ))
      )}
      <button type="button" onClick={onCancel} className={`${BEVEL_BUTTON} w-full mt-1`}>
        취소
      </button>
    </div>
  );
}
