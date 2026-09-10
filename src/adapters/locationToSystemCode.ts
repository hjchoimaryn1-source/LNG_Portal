// src/adapters/locationToSystemCode.ts
//
// PURPOSE
//   레거시 location_raw (자유텍스트, 예: "Vaporizer Area") →
//   CMMS System Code (예: "20") 자동 매핑.
//   Tag Normalization의 입력으로 사용됨.
//
// 기준: P&ID NIAS-PS-PI-0002 (각 System Code별 설비 배치도)
// 참고: Refactoring Plan §1.2, 태그 규칙 확정 문서

export interface SystemCodeInfo {
  systemCode: string;
  systemName: string;
}

export const LOCATION_AREA_TO_SYSTEM_CODE: Record<string, SystemCodeInfo> = {
  // System 10: Jetty & Offloading
  'Jetty Area': { systemCode: '10', systemName: 'Jetty & Offloading' },
  'LNG ISO Tank Unloading Area': { systemCode: '10', systemName: 'Jetty & Offloading' },
  'LNG ISO Tank Storage Area': { systemCode: '10', systemName: 'Jetty & Offloading' },
  'Offloading Bay': { systemCode: '10', systemName: 'Jetty & Offloading' },
  'ISO Tank Yard': { systemCode: '10', systemName: 'Jetty & Offloading' },

  // System 20: Regasification & BOG Compression
  'Vaporizer Area': { systemCode: '20', systemName: 'Regasification & BOG Compression' },
  'BOG Compressor Area': { systemCode: '20', systemName: 'Regasification & BOG Compression' },
  'Electrical MCC & Substation': { systemCode: '20', systemName: 'Regasification & BOG Compression' },
  'Regasification Plant': { systemCode: '20', systemName: 'Regasification & BOG Compression' },
  'Compressor Station': { systemCode: '20', systemName: 'Regasification & BOG Compression' },

  // System 30: Gas Metering & Distribution
  'Gas Metering Area': { systemCode: '30', systemName: 'Gas Metering & Distribution' },
  'Metering Skid Area': { systemCode: '30', systemName: 'Gas Metering & Distribution' },
  'Distribution Header': { systemCode: '30', systemName: 'Gas Metering & Distribution' },

  // 추가 설비 영역 (확장용)
  // System 40: Utilities (임시 - 필요시 추가)
  // System 50: Safety Systems (임시 - 필요시 추가)
};

/**
 * location 텍스트로부터 System Code를 조회한다.
 * 일치하지 않으면 fallback "20" (Regasification & BOG Compression) 반환.
 */
export function resolveSystemCode(location: string | null | undefined): SystemCodeInfo {
  if (!location) return { systemCode: '20', systemName: 'Regasification & BOG Compression (Default)' };
  const found = LOCATION_AREA_TO_SYSTEM_CODE[location.trim()];
  if (found) return found;
  return { systemCode: '20', systemName: 'Regasification & BOG Compression (Default - Unknown Location)' };
}

/**
 * 이동식 자산(ISO Tank 등) 여부를 legacy_tag prefix로 판별하는 목록.
 * 태그 규칙 확정 문서 §4: "공통 영역인 경우 System 10(Jetty & Offloading) 적용".
 * ISO Tank는 Ship/Yard/Regas Bay 등을 오가는 이동식 자산이라 고정 location
 * 텍스트("Ship", "MV. SAVIOUR" 등)로는 System을 판단할 수 없어, 태그 자체로
 * 판별해 System 10을 강제 적용한다.
 */
const MOBILE_ASSET_TAG_PREFIXES = ['ISOT', 'ISO'];

/**
 * legacy_tag와 location을 함께 고려해 System Code를 결정한다.
 * assetStagingWriter.ts가 이 함수를 통해 System Code를 구해야 한다
 * (resolveSystemCode를 location만으로 직접 호출하면 이동식 자산 규칙이 적용되지 않음).
 */
export function resolveSystemCodeForLegacyTag(
  legacyTag: string,
  location: string | null | undefined
): SystemCodeInfo {
  const prefix = legacyTag.trim().split(/[-_\s]/)[0]?.toUpperCase();
  if (prefix && MOBILE_ASSET_TAG_PREFIXES.includes(prefix)) {
    return { systemCode: '10', systemName: 'Jetty & Offloading (Mobile Asset Default)' };
  }
  return resolveSystemCode(location);
}
