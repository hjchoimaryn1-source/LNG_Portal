// src/batch/dualReadReport.ts
//
// PURPOSE
//   runDualReadDiff() 실행 결과 + asset_dual_read_diffs 누적 스냅샷을
//   사람이 검토할 수 있는 Markdown 리포트로 만든다. UI 미노출, 백엔드 산출물.

import type { SqlExecutor } from '../adapters/db/sqlExecutor';
import { findUnresolvedDrifts, type DualReadResult } from './dualReadDiff';

export function generateDualReadReport(db: SqlExecutor, result: DualReadResult): string {
  const unresolved = findUnresolvedDrifts(db);

  const lines: string[] = [];
  lines.push(`# NIAS CMMS Phase 1 — Dual Read Diff Report`);
  lines.push('');
  lines.push(`> 실행 시각: ${result.runAt}`);
  lines.push(`> 범위: 레거시 소스 vs CMMS \`assets\` 테이블 (UI 미노출, 백엔드 전용 diff 비교)`);
  lines.push('');

  lines.push(`## 1. 금일 실행 요약`);
  lines.push('');
  lines.push(`| 항목 | 건수 |`);
  lines.push(`|---|---|`);
  lines.push(`| 완전 일치(matched) | ${result.matchedCount} |`);
  lines.push(`| 값 불일치(drifted) | ${result.driftedCount} |`);
  lines.push(`| 미승격(Phase 0 큐로 위임) | ${result.unmappedCount} |`);
  lines.push(`| Orphaned Alias(정합성 이상) | ${result.orphanedAliasCount} |`);
  lines.push('');

  lines.push(`## 2. 금일 감지된 Drift 상세`);
  lines.push('');
  if (result.drifts.length === 0) {
    lines.push(`금일 새로 감지된 drift가 없습니다.`);
  } else {
    for (const d of result.drifts) {
      lines.push(`### \`${d.legacyTag}\` ↔ \`${d.equipmentTag}\``);
      lines.push(`| 필드 | 레거시 값 | CMMS 값 |`);
      lines.push(`|---|---|---|`);
      for (const f of d.diffs) {
        lines.push(`| ${f.field} | ${f.legacyValue || '(빈값)'} | ${f.cmmsValue || '(빈값)'} |`);
      }
      lines.push('');
    }
  }

  lines.push(`## 3. 누적 미해소(resolved=0) Drift 전체 목록`);
  lines.push('');
  if (unresolved.length === 0) {
    lines.push(`미해소 drift가 없습니다.`);
  } else {
    lines.push(`| legacy_tag | equipment_tag | field | legacy_value | cmms_value | 최초 감지 |`);
    lines.push(`|---|---|---|---|---|---|`);
    for (const row of unresolved) {
      lines.push(
        `| ${row.legacy_tag} | ${row.equipment_tag} | ${row.field_name} | ${row.legacy_value ?? ''} | ${row.cmms_value ?? ''} | ${row.detected_at} |`
      );
    }
  }
  lines.push('');

  lines.push(`---`);
  lines.push(
    `_본 리포트는 Phase 1(Dual Read) 배치 산출물이며, 레거시 포털 UI는 이 실행으로 인해 어떠한 값도 변경되지 않습니다. ` +
      `drift 필드는 운영자 검토 후 assets 테이블을 직접 수정하고, 해소되면 다음 실행 시 자동으로 resolved=1 처리됩니다._`
  );

  return lines.join('\n');
}
