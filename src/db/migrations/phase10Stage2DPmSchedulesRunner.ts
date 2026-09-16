// src/db/migrations/phase10Stage2DPmSchedulesRunner.ts
//
// PURPOSE
//   Phase 10 Stage 2D — seeds `pm_schedules` with the subset of the NP-05 PM
//   mapping (docs/phase10-stage1d-np05-pm-mapping-proposal.md Item 4 +
//   docs/phase10-stage2d-np05-pm-final-mapping.md Item 6~9) that has a single,
//   unambiguous candidate row. HJ-confirmed 2026-09-16 (in-session) to insert
//   ONLY these 8 rows now; Item 1/2/3/5 remain unresolved (multiple undecided
//   options / no candidate data) and are explicitly OUT OF SCOPE here.
//
// SCHEMA
//   No ALTER/CREATE — uses pm_schedules exactly as rebuilt by Stage2C
//   (interval_type incl. 'VALIDITY_EXPIRY', nullable expiry_date).
//
// TRACEABILITY
//   pm_schedules has no remarks/reference column, so `pm_code` itself encodes
//   the source item (e.g. NP05-PM-ITEM06-VISUAL) and `title` carries the
//   NP-05 citation in prose — no new column added.
//
// IDEMPOTENCY
//   pm_code is UNIQUE; INSERT OR IGNORE keyed on it, same convention as
//   phase10_stage2c_system_safety_assets.sql's system-asset seed.
//
// ITEM 9 NOTE
//   Manufacturer sensor/cartridge expiry date is not yet known (needs
//   physical/purchase-record confirmation — mapping doc does not guess it).
//   Row is inserted with expiry_date = NULL and next_due_date = NULL
//   (computeNextDueDateForValidityExpiry returns null for a null expiry).
//   interval_value is schema NOT NULL but semantically unused for
//   VALIDITY_EXPIRY (see src/utils/pmValidityExpiryCalculator.ts) — 0 is a
//   placeholder, not a real cadence. FOLLOW-UP: fill expiry_date once the
//   real manufacturer date is confirmed.
//
// CLI USAGE
//   npx tsx src/db/migrations/phase10Stage2DPmSchedulesRunner.ts            # apply
//   npx tsx src/db/migrations/phase10Stage2DPmSchedulesRunner.ts --dry-run  # report only, no writes

import { DatabaseSync } from 'node:sqlite';
import { computeNextDueDateForValidityExpiry } from '../../utils/pmValidityExpiryCalculator';

interface PmScheduleSeedRow {
  pm_code: string;
  equipment_tag: string;
  title: string;
  interval_type: 'CALENDAR' | 'VALIDITY_EXPIRY';
  interval_value: number;
  expiry_date: string | null;
}

const SEED_ROWS: PmScheduleSeedRow[] = [
  {
    pm_code: 'NP05-PM-ITEM04-LOOPCHECK',
    equipment_tag: 'NIAS-30-FE-401',
    title: 'NG Metering Skid — Instrument Loop Check / Calibration (NP-05 App01.1 Instrumentation row, Annually, proxy; Stage1D Item 4)',
    interval_type: 'CALENDAR',
    interval_value: 365,
    expiry_date: null,
  },
  {
    pm_code: 'NP05-PM-ITEM06-VISUAL',
    equipment_tag: 'NIAS-90-SYS-PSV',
    title: 'PSV — Visual Inspection (NP-05 App01.1 PSVs row, Monthly; Stage2D Item 6)',
    interval_type: 'CALENDAR',
    interval_value: 30,
    expiry_date: null,
  },
  {
    pm_code: 'NP05-PM-ITEM06-POPTEST',
    equipment_tag: 'NIAS-90-SYS-PSV',
    title: 'PSV — Popping Test & Recertification (NP-05 App01.1 PSVs row, Annually; Stage2D Item 6)',
    interval_type: 'CALENDAR',
    interval_value: 365,
    expiry_date: null,
  },
  {
    pm_code: 'NP05-PM-ITEM07-ALARMTEST',
    equipment_tag: 'NIAS-90-SYS-ESD',
    title: 'ESD — Alarm & Interlock Test (NP-05 App01.1 DCS & ESD Systems row, Quarterly; Stage2D Item 7)',
    interval_type: 'CALENDAR',
    interval_value: 90,
    expiry_date: null,
  },
  {
    pm_code: 'NP05-PM-ITEM07-FUNCTEST',
    equipment_tag: 'NIAS-90-SYS-ESD',
    title: 'ESD — Functional Test & Software Backup (NP-05 App01.1 DCS & ESD Systems row, Annually; Stage2D Item 7)',
    interval_type: 'CALENDAR',
    interval_value: 365,
    expiry_date: null,
  },
  {
    pm_code: 'NP05-PM-ITEM08-BUMPTEST',
    equipment_tag: 'NIAS-90-SYS-FG',
    title: 'Fire & Gas — Detector Bump Test (NP-05 App01.1 Fire & Gas System row, Monthly; Stage2D Item 8)',
    interval_type: 'CALENDAR',
    interval_value: 30,
    expiry_date: null,
  },
  {
    pm_code: 'NP05-PM-ITEM08-CALIBRATION',
    equipment_tag: 'NIAS-90-SYS-FG',
    title: 'Fire & Gas — Full Calibration & Loop Test (NP-05 App01.1 Fire & Gas System row, Semi-annually; Stage2D Item 8)',
    interval_type: 'CALENDAR',
    interval_value: 180,
    expiry_date: null,
  },
  {
    pm_code: 'NP05-PM-ITEM09-VALIDITY',
    equipment_tag: 'NIAS-90-SYS-FG',
    title: 'Tube-type Gas Detector — Sensor/Cartridge Validity Calibration (NP-05 Ch.7 §7.4; Stage2D Item 9; expiry_date PENDING real manufacturer value)',
    interval_type: 'VALIDITY_EXPIRY',
    interval_value: 0,
    expiry_date: null,
  },
];

function insertRow(db: DatabaseSync, row: PmScheduleSeedRow): void {
  const nextDueDate =
    row.interval_type === 'VALIDITY_EXPIRY'
      ? computeNextDueDateForValidityExpiry('VALIDITY_EXPIRY', row.expiry_date)
      : null;

  db.prepare(
    `INSERT OR IGNORE INTO pm_schedules
       (pm_code, equipment_tag, title, interval_type, interval_value, expiry_date, next_due_date)
     VALUES (@pm_code, @equipment_tag, @title, @interval_type, @interval_value, @expiry_date, @next_due_date)`
  ).run({ ...row, next_due_date: nextDueDate });
}

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  const dbPath = process.env.CMMS_DB_PATH ?? './nias_cmms.db';

  if (dryRun) {
    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
      const existing = db.prepare('SELECT pm_code FROM pm_schedules').all() as Array<{ pm_code: string }>;
      const existingCodes = new Set(existing.map((r) => r.pm_code));
      const toInsert = SEED_ROWS.filter((r) => !existingCodes.has(r.pm_code));
      console.log(`[Stage2D-PM][dry-run] db=${dbPath}`);
      console.log(`[Stage2D-PM][dry-run] current pm_schedules rows: ${existing.length}`);
      console.log(`[Stage2D-PM][dry-run] would insert ${toInsert.length} of ${SEED_ROWS.length} seed rows`);
      console.log('[Stage2D-PM][dry-run] no writes performed (opened read-only).');
    } finally {
      db.close();
    }
    return;
  }

  const db = new DatabaseSync(dbPath);
  try {
    const before = (db.prepare('SELECT COUNT(*) c FROM pm_schedules').get() as { c: number }).c;
    for (const row of SEED_ROWS) insertRow(db, row);
    const after = (db.prepare('SELECT COUNT(*) c FROM pm_schedules').get() as { c: number }).c;

    console.log(`[Stage2D-PM][apply] db=${dbPath}`);
    console.log(`[Stage2D-PM][apply] pm_schedules row count: ${before} -> ${after}`);

    const rows = db
      .prepare('SELECT pm_code, equipment_tag, interval_type, interval_value, expiry_date, next_due_date FROM pm_schedules ORDER BY pm_code')
      .all();
    console.log(`[Stage2D-PM][apply] rows: ${JSON.stringify(rows, null, 1)}`);
  } finally {
    db.close();
  }
}

main();
