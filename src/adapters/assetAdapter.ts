// src/adapters/assetAdapter.ts
//
// PURPOSE
//   Refactoring Plan §1.5 구현체.
//   staging_legacy_assets 등에서 IMPA 코드나 KKS 태그가 비어 있는(NULL/빈문자열)
//   레코드를 만나더라도 UI/후속 파이프라인이 절대 크래시하지 않도록,
//   안전한 기본값([Pending] 태그, UNMAPPED-ASSET 등)으로 자동 대체하는
//   읽기 전용(read-only) 어댑터.
//
// GUARANTEES
//   - 이 파일의 모든 함수는 순수 함수다. DB 쓰기, 네트워크 호출, 상태 변경 없음.
//   - 어떤 입력(undefined/null/빈문자열/공백문자열)이 들어와도 예외를 던지지 않고
//     항상 유효한 fallback 값을 반환한다 (Graceful Degradation).
//   - "PROMOTED"(정식 승격) 판단은 이 파일이 내리지 않는다 — 오직 표시/조회용
//     안전 변환만 수행한다. 실제 assets 테이블 승격 여부는 staging 파이프라인의
//     mapping_status로 별도 판단한다.

// ----------------------------------------------------------------------------
// 1. 상수 — 공백 데이터 대응 기본값
// ----------------------------------------------------------------------------

/** 태그/코드류가 비어있을 때 사람이 읽는 화면에 노출할 플레이스홀더 */
export const PENDING_LABEL = '[Pending]';

/** equipment_tag 자체가 확정되지 않은 자산에 부여하는 고정 fallback 식별자 접두사 */
export const UNMAPPED_ASSET_PREFIX = 'UNMAPPED-ASSET';

/** IMPA 코드 미배정 자재에 부여하는 fallback */
export const UNMAPPED_IMPA_CODE = 'UNMAPPED-IMPA';

/** criticality 매핑 실패 시 안전측 기본값 (과소평가로 인한 정비누락 방지 위해 중간값 채택) */
export const DEFAULT_CRITICALITY: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';

const CRITICALITY_ALIASES: Record<string, 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = {
  critical: 'CRITICAL',
  crit: 'CRITICAL',
  high: 'HIGH',
  hi: 'HIGH',
  medium: 'MEDIUM',
  med: 'MEDIUM',
  normal: 'MEDIUM',
  low: 'LOW',
};

const STATUS_ALIASES: Record<string, 'OPERATIONAL' | 'MAINTENANCE' | 'STANDBY' | 'OUT_OF_SERVICE'> = {
  running: 'OPERATIONAL',
  operational: 'OPERATIONAL',
  active: 'OPERATIONAL',
  maintenance: 'MAINTENANCE',
  repair: 'MAINTENANCE',
  standby: 'STANDBY',
  idle: 'STANDBY',
  out_of_service: 'OUT_OF_SERVICE',
  down: 'OUT_OF_SERVICE',
  offline: 'OUT_OF_SERVICE',
};

// ----------------------------------------------------------------------------
// 2. 유틸
// ----------------------------------------------------------------------------

/** null/undefined/빈문자열/공백만 있는 문자열을 "비어있음"으로 간주 */
function isBlank(value: string | null | undefined): value is null | undefined | '' {
  return value === null || value === undefined || value.trim().length === 0;
}

/**
 * 결정론적 fallback 태그 생성. 같은 legacy_tag/legacy_name 입력에는 항상
 * 같은 fallback 값을 반환해야 후속 조인(예: asset_tag_alias)에서 중복이
 * 발생하지 않는다. 별도 시퀀스/DB 없이도 안전하도록 간단한 문자열 해시를 사용한다.
 */
function stableSuffix(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0; // unsigned 32bit wrap
  }
  return hash.toString(16).toUpperCase().padStart(8, '0');
}

// ----------------------------------------------------------------------------
// 3. 필드별 Graceful Fallback Resolver
// ----------------------------------------------------------------------------

/**
 * equipment_tag 확정값이 없을 때 사용할 안정적인 fallback을 만든다.
 * 원본 legacy_tag가 있으면 그것을 시드로 사용해 재현 가능한 식별자를 만들고,
 * 그마저 없으면 legacy_name을 시드로 쓴다.
 */
export function resolveEquipmentTag(
  proposedEquipmentTag: string | null | undefined,
  legacyTag: string | null | undefined,
  legacyName: string | null | undefined
): { value: string; isFallback: boolean } {
  if (!isBlank(proposedEquipmentTag)) {
    return { value: proposedEquipmentTag!.trim(), isFallback: false };
  }
  const seed = !isBlank(legacyTag) ? legacyTag! : !isBlank(legacyName) ? legacyName! : 'UNKNOWN';
  return { value: `${UNMAPPED_ASSET_PREFIX}-${stableSuffix(seed)}`, isFallback: true };
}

/** KKS 코드 — 비어있으면 [Pending] 라벨 */
export function resolveKksCode(proposedKksCode: string | null | undefined): { value: string; isFallback: boolean } {
  if (!isBlank(proposedKksCode)) return { value: proposedKksCode!.trim(), isFallback: false };
  return { value: PENDING_LABEL, isFallback: true };
}

/** ISO 14224 Class — 비어있으면 [Pending] 라벨 (legacy_type_filter로 최소 추정 시도) */
export function resolveIso14224Class(
  proposedClass: string | null | undefined,
  legacyTypeFilter?: 'PLANT' | 'INSTRUMENTS' | null
): { value: string; isFallback: boolean } {
  if (!isBlank(proposedClass)) return { value: proposedClass!.trim(), isFallback: false };
  if (legacyTypeFilter === 'INSTRUMENTS') return { value: 'Instrument', isFallback: true };
  if (legacyTypeFilter === 'PLANT') return { value: PENDING_LABEL, isFallback: true }; // PLANT는 세부 클래스 추정 불가
  return { value: PENDING_LABEL, isFallback: true };
}

/** IMPA 코드 — 비어있으면 UNMAPPED-IMPA */
export function resolveImpaCode(proposedImpaCode: string | null | undefined): { value: string; isFallback: boolean } {
  if (!isBlank(proposedImpaCode)) return { value: proposedImpaCode!.trim(), isFallback: false };
  return { value: UNMAPPED_IMPA_CODE, isFallback: true };
}

/** Criticality — 표기 혼재(대소문자/약어) 정규화, 실패 시 DEFAULT_CRITICALITY */
export function resolveCriticality(
  raw: string | null | undefined
): { value: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; isFallback: boolean } {
  if (isBlank(raw)) return { value: DEFAULT_CRITICALITY, isFallback: true };
  const normalized = CRITICALITY_ALIASES[raw!.trim().toLowerCase()];
  if (normalized) return { value: normalized, isFallback: false };
  return { value: DEFAULT_CRITICALITY, isFallback: true };
}

/** Status — 표기 혼재 정규화, 실패 시 OUT_OF_SERVICE로 보수적 fallback
 *  (운영중 자산을 잘못 표시하는 것보다, 미확인 자산을 정지로 보이게 하는 편이 더 안전) */
export function resolveStatus(
  raw: string | null | undefined
): { value: 'OPERATIONAL' | 'MAINTENANCE' | 'STANDBY' | 'OUT_OF_SERVICE'; isFallback: boolean } {
  if (isBlank(raw)) return { value: 'OUT_OF_SERVICE', isFallback: true };
  const normalized = STATUS_ALIASES[raw!.trim().toLowerCase()];
  if (normalized) return { value: normalized, isFallback: false };
  return { value: 'OUT_OF_SERVICE', isFallback: true };
}

// ----------------------------------------------------------------------------
// 4. 레코드 단위 통합 어댑터
// ----------------------------------------------------------------------------

/** staging_legacy_assets 1행에 대응하는 최소 입력 shape (읽기 전용 입력) */
export interface StagingAssetRowInput {
  legacyTag?: string | null;
  legacyName?: string | null;
  legacyLocationRaw?: string | null;
  legacyMaker?: string | null;
  legacyCriticalityRaw?: string | null;
  legacyStatusRaw?: string | null;
  legacyTypeFilter?: 'PLANT' | 'INSTRUMENTS' | null;
  legacyImpaCodeRaw?: string | null;
  proposedEquipmentTag?: string | null;
  proposedKksCode?: string | null;
  proposedIso14224Class?: string | null;
  proposedImpaCode?: string | null;
  proposedCriticality?: string | null;
}

/** UI/다운스트림 소비용, 항상 완전히 채워진(fallback 포함) 안전 뷰 */
export interface SafeAssetView {
  equipmentTag: string;
  assetName: string;
  locationArea: string;
  manufacturer: string;
  kksCode: string;
  iso14224Class: string;
  impaCode: string;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'STANDBY' | 'OUT_OF_SERVICE';
  /** 어느 필드가 fallback으로 채워졌는지 — 검수 큐(§1.3 mapping_status='PENDING_REVIEW') 노출용 */
  fallbackFields: string[];
  /** 하나라도 fallback이 있으면 true — UI에서 "검토 필요" 배지 렌더링 트리거 */
  needsReview: boolean;
}

/**
 * staging_legacy_assets 원본(공백 가능)을 받아, 절대 크래시하지 않는
 * 완전한 SafeAssetView로 변환한다. DB 쓰기 없음 (읽기 전용).
 */
export function toSafeAssetView(row: StagingAssetRowInput): SafeAssetView {
  const fallbackFields: string[] = [];

  const equipmentTag = resolveEquipmentTag(row.proposedEquipmentTag, row.legacyTag, row.legacyName);
  if (equipmentTag.isFallback) fallbackFields.push('equipmentTag');

  const kksCode = resolveKksCode(row.proposedKksCode);
  if (kksCode.isFallback) fallbackFields.push('kksCode');

  const iso14224Class = resolveIso14224Class(row.proposedIso14224Class, row.legacyTypeFilter);
  if (iso14224Class.isFallback) fallbackFields.push('iso14224Class');

  const impaCode = resolveImpaCode(row.proposedImpaCode ?? row.legacyImpaCodeRaw);
  if (impaCode.isFallback) fallbackFields.push('impaCode');

  const criticality = resolveCriticality(row.proposedCriticality ?? row.legacyCriticalityRaw);
  if (criticality.isFallback) fallbackFields.push('criticality');

  const status = resolveStatus(row.legacyStatusRaw);
  if (status.isFallback) fallbackFields.push('status');

  return {
    equipmentTag: equipmentTag.value,
    assetName: isBlank(row.legacyName) ? PENDING_LABEL : row.legacyName!.trim(),
    locationArea: isBlank(row.legacyLocationRaw) ? PENDING_LABEL : row.legacyLocationRaw!.trim(),
    manufacturer: isBlank(row.legacyMaker) ? PENDING_LABEL : row.legacyMaker!.trim(),
    kksCode: kksCode.value,
    iso14224Class: iso14224Class.value,
    impaCode: impaCode.value,
    criticality: criticality.value,
    status: status.value,
    fallbackFields,
    needsReview: fallbackFields.length > 0,
  };
}

/** 여러 행 일괄 변환 (staging 테이블 SELECT 결과를 그대로 넣을 수 있음) */
export function toSafeAssetViewList(rows: StagingAssetRowInput[]): SafeAssetView[] {
  return rows.map(toSafeAssetView);
}

/**
 * 검토 필요 자산만 골라내는 헬퍼 — Refactoring Plan Phase 0/1의
 * "PENDING_REVIEW 큐잉" 작업에 그대로 사용 가능.
 */
export function filterNeedsReview(views: SafeAssetView[]): SafeAssetView[] {
  return views.filter((v) => v.needsReview);
}
