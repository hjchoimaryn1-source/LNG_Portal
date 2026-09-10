// src/adapters/tagNormalizationService.ts
//
// PURPOSE
//   Refactoring Plan §1.2 + 태그 규칙 확정 구현.
//   레거시 태그(예: "AAV-104", "T-201") → CMMS equipment_tag + kks_code 생성.
//   순수 함수, side-effect 없음.
//
// 규칙
//   equipment_tag: NIAS-[System Code]-[Equipment Category]-[Sequence]
//   kks_code: [System Code][Equipment Category][Sequence]
//
// 예시
//   AAV-104 + location="Vaporizer Area" 
//   → equipment_tag="NIAS-20-VP-104", kks_code="20VP104"

// ============================================================================
// 0. 원본 태그 표기 정규화 (실제 CSV의 표기 혼재 방어)
// ============================================================================

/**
 * 레거시 태그 표기를 정리한다. 실제 CSV에서 "ISOT - 1"처럼 하이픈 앞뒤에
 * 공백이 들어간 경우("ISOT-026"과 표기가 다름)를 통일한다.
 * 이 함수는 legacyTag 자체(자연키로 쓰이는 문자열)를 정리하는 용도이므로,
 * 데이터 소스 단에서 legacyTag를 만들 때 반드시 거쳐야 한다.
 */
export function normalizeTagFormat(raw: string): string {
  return raw
    .trim()
    .replace(/\s*-\s*/g, '-') // "ISOT - 1" -> "ISOT-1"
    .replace(/\s+/g, ' ');
}

// ============================================================================
// 1. Equipment Category 매핑
// ============================================================================

/** 레거시 태그 prefix 또는 Equipment Type → 2글자 Category Code */
const EQUIPMENT_CATEGORY_MAP: Record<string, string> = {
  // Vaporizer
  AAV: 'VP',
  VAP: 'VP',
  // LNG ISO Tank
  ISOT: 'TK',
  // Vessel / Buffer Tank
  V: 'VS',
  // Compressor
  CP: 'CP',
  // Pump
  P: 'PP',
  PMP: 'PP',
  // Metering Skid
  M: 'FE', // 또는 ME (현재는 FE로 기본)
  // Vent Stack
  VT: 'VT',
  // Generator
  GEN: 'GE',
  // Pressure Regulator
  PRSS: 'PR',
  PRV: 'PR',
  // LNG Tank (SHEET 2)
  T: 'TK',
};

/**
 * 레거시 태그의 prefix를 보고 Equipment Category Code(2글자)를 찾는다.
 * 예: "AAV-104" → prefix "AAV" → "VP"
 *
 * 일치하지 않으면 fallback "XX" 반환 (나중에 mapping_status='PENDING_REVIEW'로 표시)
 */
export function resolveEquipmentCategoryCode(
  legacyTag: string,
  explicitType?: string // 명시적 지정(우선순위 높음)
): { code: string; isFallback: boolean } {
  if (explicitType) {
    const code = EQUIPMENT_CATEGORY_MAP[explicitType];
    if (code) return { code, isFallback: false };
  }

  const cleanTag = normalizeTagFormat(legacyTag);
  const parts = cleanTag.split(/[-_]/);
  const prefix = (parts[0] ?? '').trim();
  const code = EQUIPMENT_CATEGORY_MAP[prefix];
  if (code) return { code, isFallback: false };

  return { code: 'XX', isFallback: true };
}

// ============================================================================
// 2. Sequence 추출
// ============================================================================

/**
 * 레거시 태그에서 일련번호를 추출한다.
 * 예: "AAV-104" → "104", "T-201" → "201", "PRSS-01" → "01"
 *
 * 규칙: 하이픈(-) 뒤의 연속된 숫자, 또는 문자열 끝의 연속된 숫자를 추출.
 * 3~4자리가 기본이지만, 2자리("01") 같은 짧은 것도 허용(앞에 0 채우지 않음 — 원본 그대로).
 */
export function extractSequence(legacyTag: string): { sequence: string; isFallback: boolean } {
  const match = legacyTag.match(/[-_]?(\d{1,4})$/);
  if (match && match[1]) {
    return { sequence: match[1], isFallback: false };
  }
  return { sequence: '0000', isFallback: true };
}

// ============================================================================
// 3. 통합: 레거시 태그 → equipment_tag + kks_code
// ============================================================================

export interface TagNormalizationResult {
  equipmentTag: string;
  kksCode: string;
  systemCode: string;
  categoryCode: string;
  sequence: string;
  hasFallback: boolean; // category 또는 sequence가 fallback인 경우 true
}

/**
 * 레거시 태그(예: "AAV-104")를 CMMS 태그로 정규화한다.
 *
 * @param legacyTag 원본 태그 (예: "AAV-104")
 * @param systemCode Location 기반 매핑에서 온 System Code (예: "20")
 * @param explicitType 명시적 Equipment Type (optional, ISO14224Class 등에서 오거나 사용자 입력)
 * @returns equipment_tag, kks_code, 그리고 사용된 fallback 여부
 */
export function normalizeTag(
  legacyTag: string,
  systemCode: string,
  explicitType?: string
): TagNormalizationResult {
  const category = resolveEquipmentCategoryCode(legacyTag, explicitType);
  const seq = extractSequence(legacyTag);

  const plant = 'NIAS'; // 고정
  const equipmentTag = `${plant}-${systemCode}-${category.code}-${seq.sequence}`;
  const kksCode = `${systemCode}${category.code}${seq.sequence}`;

  return {
    equipmentTag,
    kksCode,
    systemCode,
    categoryCode: category.code,
    sequence: seq.sequence,
    hasFallback: category.isFallback || seq.isFallback,
  };
}

/**
 * 여러 레거시 태그를 일괄 정규화한다 (batch 처리용).
 */
export function normalizeTagsBatch(
  tags: Array<{ legacyTag: string; systemCode: string; explicitType?: string }>
): TagNormalizationResult[] {
  return tags.map((t) => normalizeTag(t.legacyTag, t.systemCode, t.explicitType));
}
