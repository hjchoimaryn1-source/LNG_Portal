// src/cmms-trucking/components/ChecklistItemRow.tsx
//
// PURPOSE
//   NP-03 체크리스트 공용 1행 렌더러. options가 있으면 그 옵션(예: Pass/Fail)을,
//   없으면 OK/Not OK 2지선다를 라디오 버튼 그룹으로 렌더링한다.

import { SUNKEN_INPUT } from '../../components/cmms/scadaStyles';
import type { ChecklistItemDef } from '../hooks/useTruckChecklistForm';

interface ChecklistItemRowProps {
  def: ChecklistItemDef;
  value: string | undefined;
  onChange: (value: string) => void;
  remarks: string;
  onRemarksChange: (value: string) => void;
}

const DEFAULT_OPTIONS = ['OK', 'Not OK'];

export function ChecklistItemRow({ def, value, onChange, remarks, onRemarksChange }: ChecklistItemRowProps) {
  const options = def.options ?? DEFAULT_OPTIONS;

  return (
    <tr className="border-b border-slate-300">
      <td className="px-2 py-1 align-top text-[12px]">
        <div className="font-semibold">
          {def.label}
          {def.required === false && <span className="text-slate-400 font-normal"> (optional)</span>}
        </div>
        {def.criteria && <div className="text-[11px] text-slate-600">{def.criteria}</div>}
      </td>
      <td className="px-2 py-1 align-top">
        <div className="flex gap-3">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-1 text-[11px] cursor-pointer">
              <input type="radio" name={def.itemId} checked={value === opt} onChange={() => onChange(opt)} />
              {opt}
            </label>
          ))}
        </div>
      </td>
      <td className="px-2 py-1 align-top">
        <input
          type="text"
          className={`${SUNKEN_INPUT} w-full`}
          value={remarks}
          onChange={(e) => onRemarksChange(e.target.value)}
          placeholder="Remarks"
        />
      </td>
    </tr>
  );
}
