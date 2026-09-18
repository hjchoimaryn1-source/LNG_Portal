// src/gas-metering/entry/FlobossEntryFieldGrid.tsx
//
// PURPOSE
//   Generic editable number-field grid for one FlobossDailyEntryForm
//   section — takes an EntryFieldSpec[] + the current draft record, same
//   role as GasDeliverySummaryForm.tsx's inline DAILY_FIELDS.map() grid,
//   factored out since this form has 6 sections instead of 1.

import { SUNKEN_INPUT } from '../../components/cmms/scadaStyles';
import type { EntryFieldSpec } from './flobossEntryFieldMaps';

export interface FlobossEntryFieldGridProps {
  fields: EntryFieldSpec[];
  values: Record<string, number | null>;
  onChange: (key: string, value: number | null) => void;
}

export function FlobossEntryFieldGrid({ fields, values, onChange }: FlobossEntryFieldGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {fields.map(({ key, label, unit }) => (
        <label key={key} className="text-[10px] font-mono text-slate-700 flex flex-col gap-0.5">
          {label}
          {unit ? ` (${unit})` : ''}
          <input
            type="number"
            value={values[key] ?? ''}
            onChange={(e) => onChange(key, e.target.value === '' ? null : Number(e.target.value))}
            className={SUNKEN_INPUT}
          />
        </label>
      ))}
    </div>
  );
}
