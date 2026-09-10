// src/batch/csvUtils.ts
//
// PURPOSE
//   Node.js 배치 환경에서 쓸 최소 CSV 파서. src/utils/csvParser.ts(React용,
//   아직 미확보)에 의존하지 않고 독립적으로 동작한다.
//
//   NIAS 실제 CSV 파일들(Cert. of LNG Delivered Measurement 등)에
//   `"28,720"` 같은 천단위 콤마가 포함된 따옴표 필드가 있어, 단순
//   `line.split(',')`로는 깨진다 — 최소한의 RFC4180 quoting을 지원한다.

/** 한 줄을 필드 배열로 분리 (따옴표 내부의 콤마는 무시) */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++; // escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

/**
 * CSV 전체 텍스트를 헤더 기준 객체 배열로 파싱한다.
 * BOM(\uFEFF) 제거, CRLF/LF 모두 처리, 빈 줄 스킵.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const cleaned = text.replace(/^\uFEFF/, '');
  const lines = cleaned.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim();
    });
    rows.push(row);
  }
  return rows;
}

/** 숫자 파싱 헬퍼 — 천단위 콤마 제거 후 파싱, 실패 시 undefined */
export function parseNumericField(raw: string | undefined): number | undefined {
  if (!raw || raw.trim() === '') return undefined;
  const cleaned = raw.replace(/,/g, '').trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}
