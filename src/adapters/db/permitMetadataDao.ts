// src/adapters/db/permitMetadataDao.ts
//
// PURPOSE
//   permit_metadata 테이블(CMMS_Architecture.md §5.2 SIMOPS 판정용 permit
//   type/work_area/equipment_tag 스냅샷)에 대한 순수 DAO. ptwPermitDao.ts와
//   동일 패턴 — SqlExecutor에만 의존하며 React/Next 바인딩이 없다.
//
// NOT IN SCOPE
//   SIMOPS 간섭 판정 로직 — src/adapters/simopsDbAdapter.ts의 책임이며 이
//   파일은 조회 대상 데이터를 저장/조회만 한다.

import type { SqlExecutor } from './sqlExecutor';

export interface PermitMetadataRow {
  permitRefNo: string;
  ptwType: string;
  workArea: string;
  equipmentTag: string;
}

interface PermitMetadataSqlRow {
  permit_ref_no: string;
  ptw_type: string;
  work_area: string;
  equipment_tag: string;
}

const INSERT_IGNORE_SQL = `
  INSERT OR IGNORE INTO permit_metadata (permit_ref_no, ptw_type, work_area, equipment_tag)
  VALUES (@permitRefNo, @ptwType, @workArea, @equipmentTag)
`;

const SELECT_ALL_SQL = `SELECT * FROM permit_metadata`;

function rowToMetadata(row: PermitMetadataSqlRow): PermitMetadataRow {
  return {
    permitRefNo: row.permit_ref_no,
    ptwType: row.ptw_type,
    workArea: row.work_area,
    equipmentTag: row.equipment_tag,
  };
}

/** 이미 존재하는 permit_ref_no는 건드리지 않는다 — 생성 시점 1회 시딩 전용(ptw_permits와 동일 컨벤션). */
export function insertPermitMetadataIfAbsent(
  db: SqlExecutor,
  input: { permitRefNo: string; ptwType: string; workArea: string; equipmentTag: string }
): void {
  db.run(INSERT_IGNORE_SQL, input);
}

/** 전체 메타데이터 조회 — SIMOPS DB 판정의 후보 집합 구성용. */
export function selectAllPermitMetadata(db: SqlExecutor): PermitMetadataRow[] {
  return db.all<PermitMetadataSqlRow>(SELECT_ALL_SQL).map(rowToMetadata);
}
