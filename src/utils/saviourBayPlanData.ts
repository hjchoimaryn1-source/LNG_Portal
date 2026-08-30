// src/utils/saviourBayPlanData.ts

export interface OfficialBayPlanRecord {
  deckMode: 'ON_DECK' | 'CARGO_HOLD';
  bay: string;
  tier: string;
  row: string;
  serialNo: string;
  tankNo: string;
}

// Exact 120 tanks mapped from 'BAY PLAN MV SAVIOUR ARUN VOY 25002 A 28.11.2025.xlsx'
export const OFFICIAL_SAVIOUR_BAY_PLAN_120: OfficialBayPlanRecord[] = [
  // ================= ON DECK (78 TANKS) =================
  // --- Tier 86 ---
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 86", row: "ROW 06", serialNo: "SIMU 811129 7", tankNo: "ISOT-001" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 86", row: "ROW 06", serialNo: "SIMU 810288 6", tankNo: "ISOT-002" },
  { deckMode: "ON_DECK", bay: "BAY 17", tier: "Tier 86", row: "ROW 04", serialNo: "SIMU 810218 7", tankNo: "ISOT-003" },
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 86", row: "ROW 04", serialNo: "SIMU 810197 7", tankNo: "ISOT-004" },
  { deckMode: "ON_DECK", bay: "BAY 09", tier: "Tier 86", row: "ROW 04", serialNo: "SIMU 810144 7", tankNo: "ISOT-005" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 86", row: "ROW 04", serialNo: "SIMU 811081 3", tankNo: "ISOT-006" },
  { deckMode: "ON_DECK", bay: "BAY 17", tier: "Tier 86", row: "ROW 02", serialNo: "SIMU 811100 2", tankNo: "ISOT-007" },
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 86", row: "ROW 02", serialNo: "SIMU 810165 8", tankNo: "ISOT-008" },
  { deckMode: "ON_DECK", bay: "BAY 09", tier: "Tier 86", row: "ROW 02", serialNo: "SIMU 811122 9", tankNo: "ISOT-009" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 86", row: "ROW 02", serialNo: "SIMU 810147 3", tankNo: "ISOT-010" },
  { deckMode: "ON_DECK", bay: "BAY 17", tier: "Tier 86", row: "ROW 00/01", serialNo: "SIMU 810367 1", tankNo: "ISOT-011" },
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 86", row: "ROW 00/01", serialNo: "SIMU 810283 9", tankNo: "ISOT-012" },
  { deckMode: "ON_DECK", bay: "BAY 09", tier: "Tier 86", row: "ROW 00/01", serialNo: "SIMU 810359 0", tankNo: "ISOT-013" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 86", row: "ROW 00/01", serialNo: "SIMU 810200 0", tankNo: "ISOT-014" },
  { deckMode: "ON_DECK", bay: "BAY 17", tier: "Tier 86", row: "ROW 03", serialNo: "SIMU 811161 4", tankNo: "ISOT-015" },
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 86", row: "ROW 03", serialNo: "SIMU 810289 1", tankNo: "ISOT-016" },
  { deckMode: "ON_DECK", bay: "BAY 09", tier: "Tier 86", row: "ROW 03", serialNo: "SIMU 810247 0", tankNo: "ISOT-017" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 86", row: "ROW 03", serialNo: "SIMU 8101874", tankNo: "ISOT-018" },
  { deckMode: "ON_DECK", bay: "BAY 17", tier: "Tier 86", row: "ROW 05", serialNo: "SIMU 810371 1", tankNo: "ISOT-019" },
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 86", row: "ROW 05", serialNo: "SIMU 810358 4", tankNo: "ISOT-020" },
  { deckMode: "ON_DECK", bay: "BAY 09", tier: "Tier 86", row: "ROW 05", serialNo: "SIMU 810205 8", tankNo: "ISOT-021" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 86", row: "ROW 05", serialNo: "SIMU 810229 5", tankNo: "ISOT-022" },
  { deckMode: "ON_DECK", bay: "BAY 19", tier: "Tier 86", row: "ROW 05", serialNo: "SIMU 810175 0", tankNo: "ISOT-023" },
  { deckMode: "ON_DECK", bay: "BAY 11", tier: "Tier 86", row: "ROW 05", serialNo: "SIMU 810357 9", tankNo: "ISOT-024" },
  { deckMode: "ON_DECK", bay: "BAY 07", tier: "Tier 86", row: "ROW 05", serialNo: "SIMU 810207 9", tankNo: "ISOT-025" },
  { deckMode: "ON_DECK", bay: "BAY 03", tier: "Tier 86", row: "ROW 05", serialNo: "SIMU 810191 4", tankNo: "ISOT-026" },

  // --- Tier 84 ---
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 84", row: "ROW 06", serialNo: "SIMU 810243 8", tankNo: "ISOT-027" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 84", row: "ROW 06", serialNo: "SIMU 810194 0", tankNo: "ISOT-028" },
  { deckMode: "ON_DECK", bay: "BAY 17", tier: "Tier 84", row: "ROW 04", serialNo: "SIMU 810256 7", tankNo: "ISOT-029" },
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 84", row: "ROW 04", serialNo: "SIMU 811117 3", tankNo: "ISOT-030" },
  { deckMode: "ON_DECK", bay: "BAY 09", tier: "Tier 84", row: "ROW 04", serialNo: "SIMU 810192 0", tankNo: "ISOT-031" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 84", row: "ROW 04", serialNo: "SIMU 810178 7", tankNo: "ISOT-032" },
  { deckMode: "ON_DECK", bay: "BAY 17", tier: "Tier 84", row: "ROW 02", serialNo: "SIMU 810219 2", tankNo: "ISOT-033" },
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 84", row: "ROW 02", serialNo: "SIMU 811166 1", tankNo: "ISOT-034" },
  { deckMode: "ON_DECK", bay: "BAY 09", tier: "Tier 84", row: "ROW 02", serialNo: "SIMU 810176 6", tankNo: "ISOT-035" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 84", row: "ROW 02", serialNo: "SIMU 810198 2", tankNo: "ISOT-036" },
  { deckMode: "ON_DECK", bay: "BAY 17", tier: "Tier 84", row: "ROW 00/01", serialNo: "SIMU 810159 7", tankNo: "ISOT-037" },
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 84", row: "ROW 00/01", serialNo: "SIMU 811096 3", tankNo: "ISOT-038" },
  { deckMode: "ON_DECK", bay: "BAY 09", tier: "Tier 84", row: "ROW 00/01", serialNo: "SIMU 810206 3", tankNo: "ISOT-039" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 84", row: "ROW 00/01", serialNo: "SIMU 810127 8", tankNo: "ISOT-040" },
  { deckMode: "ON_DECK", bay: "BAY 19", tier: "Tier 84", row: "ROW 00/01", serialNo: "SIMU 810365 0", tankNo: "ISOT-041" },
  { deckMode: "ON_DECK", bay: "BAY 11", tier: "Tier 84", row: "ROW 00/01", serialNo: "SIMU 810223 2", tankNo: "ISOT-042" },
  { deckMode: "ON_DECK", bay: "BAY 07", tier: "Tier 84", row: "ROW 00/01", serialNo: "SIMU 811151 1", tankNo: "ISOT-043" },
  { deckMode: "ON_DECK", bay: "BAY 03", tier: "Tier 84", row: "ROW 00/01", serialNo: "SIMU 811078 9", tankNo: "ISOT-044" },
  { deckMode: "ON_DECK", bay: "BAY 17", tier: "Tier 84", row: "ROW 03", serialNo: "SIMU 810158 1", tankNo: "ISOT-045" },
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 84", row: "ROW 03", serialNo: "SIMU 810360 3", tankNo: "ISOT-046" },
  { deckMode: "ON_DECK", bay: "BAY 09", tier: "Tier 84", row: "ROW 03", serialNo: "SIMU 810374 8", tankNo: "ISOT-047" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 84", row: "ROW 03", serialNo: "SIMU 810235 6", tankNo: "ISOT-048" },
  { deckMode: "ON_DECK", bay: "BAY 19", tier: "Tier 84", row: "ROW 05", serialNo: "SIMU 810138 6", tankNo: "ISOT-049" },
  { deckMode: "ON_DECK", bay: "BAY 11", tier: "Tier 84", row: "ROW 05", serialNo: "SIMU 810152 9", tankNo: "ISOT-050" },
  { deckMode: "ON_DECK", bay: "BAY 07", tier: "Tier 84", row: "ROW 05", serialNo: "SIMU 810220 6", tankNo: "ISOT-051" },
  { deckMode: "ON_DECK", bay: "BAY 03", tier: "Tier 84", row: "ROW 05", serialNo: "SIMU 810231 4", tankNo: "ISOT-052" },

  // --- Tier 82 ---
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 82", row: "ROW 06", serialNo: "SIMU 810356 3", tankNo: "ISOT-053" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 82", row: "ROW 06", serialNo: "SIMU 810361 9", tankNo: "ISOT-054" },
  { deckMode: "ON_DECK", bay: "BAY 17", tier: "Tier 82", row: "ROW 04", serialNo: "SIMU 810142 6", tankNo: "ISOT-055" },
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 82", row: "ROW 04", serialNo: "SIMU 810148 9", tankNo: "ISOT-056" },
  { deckMode: "ON_DECK", bay: "BAY 09", tier: "Tier 82", row: "ROW 04", serialNo: "SIMU 810251 0", tankNo: "ISOT-057" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 82", row: "ROW 04", serialNo: "SIMU 810172 4", tankNo: "ISOT-058" },
  { deckMode: "ON_DECK", bay: "BAY 17", tier: "Tier 82", row: "ROW 02", serialNo: "SIMU 810190 9", tankNo: "ISOT-059" },
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 82", row: "ROW 02", serialNo: "SIMU 810131 8", tankNo: "ISOT-060" },
  { deckMode: "ON_DECK", bay: "BAY 09", tier: "Tier 82", row: "ROW 02", serialNo: "SIMU 810230 9", tankNo: "ISOT-061" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 82", row: "ROW 02", serialNo: "SIMU 810282 3", tankNo: "ISOT-062" },
  { deckMode: "ON_DECK", bay: "BAY 17", tier: "Tier 82", row: "ROW 00/01", serialNo: "SIMU 810184 8", tankNo: "ISOT-063" },
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 82", row: "ROW 00/01", serialNo: "SIMU 810372 7", tankNo: "ISOT-064" },
  { deckMode: "ON_DECK", bay: "BAY 09", tier: "Tier 82", row: "ROW 00/01", serialNo: "SIMU 811315 5", tankNo: "ISOT-065" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 82", row: "ROW 00/01", serialNo: "SIMU 810170 3", tankNo: "ISOT-066" },
  { deckMode: "ON_DECK", bay: "BAY 17", tier: "Tier 82", row: "ROW 00/01", serialNo: "SIMU 810373 2", tankNo: "ISOT-067" },
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 82", row: "ROW 00/01", serialNo: "SIMU 810167 9", tankNo: "ISOT-068" },
  { deckMode: "ON_DECK", bay: "BAY 09", tier: "Tier 82", row: "ROW 00/01", serialNo: "SIMU 810163 7", tankNo: "ISOT-069" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 82", row: "ROW 00/01", serialNo: "SIMU 810185 3", tankNo: "ISOT-070" },
  { deckMode: "ON_DECK", bay: "BAY 17", tier: "Tier 82", row: "ROW 03", serialNo: "SIMU 811317 6", tankNo: "ISOT-071" },
  { deckMode: "ON_DECK", bay: "BAY 13", tier: "Tier 82", row: "ROW 03", serialNo: "SIMU 811313 4", tankNo: "ISOT-072" },
  { deckMode: "ON_DECK", bay: "BAY 09", tier: "Tier 82", row: "ROW 03", serialNo: "SIMU 810188 0", tankNo: "ISOT-073" },
  { deckMode: "ON_DECK", bay: "BAY 05", tier: "Tier 82", row: "ROW 03", serialNo: "SIMU 811254 4", tankNo: "ISOT-074" },
  { deckMode: "ON_DECK", bay: "BAY 19", tier: "Tier 82", row: "ROW 05", serialNo: "SIMU 810151 3", tankNo: "ISOT-075" },
  { deckMode: "ON_DECK", bay: "BAY 11", tier: "Tier 82", row: "ROW 05", serialNo: "SIMU 810195 6", tankNo: "ISOT-076" },
  { deckMode: "ON_DECK", bay: "BAY 07", tier: "Tier 82", row: "ROW 05", serialNo: "SIMU 810284 4", tankNo: "ISOT-077" },
  { deckMode: "ON_DECK", bay: "BAY 03", tier: "Tier 82", row: "ROW 05", serialNo: "SIMU 810189 5", tankNo: "ISOT-078" },

  // ================= CARGO HOLD (42 TANKS) =================
  // --- Tier 06 ---
  { deckMode: "CARGO_HOLD", bay: "BAY 17", tier: "Tier 06", row: "ROW 06", serialNo: "SIMU 811298 7", tankNo: "ISOT-079" },
  { deckMode: "CARGO_HOLD", bay: "BAY 13", tier: "Tier 06", row: "ROW 06", serialNo: "SIMU 810366 6", tankNo: "ISOT-080" },
  { deckMode: "CARGO_HOLD", bay: "BAY 09", tier: "Tier 06", row: "ROW 06", serialNo: "SIMU 810202 1", tankNo: "ISOT-081" },
  { deckMode: "CARGO_HOLD", bay: "BAY 17", tier: "Tier 06", row: "ROW 04", serialNo: "SIMU 810286 5", tankNo: "ISOT-082" },
  { deckMode: "CARGO_HOLD", bay: "BAY 13", tier: "Tier 06", row: "ROW 04", serialNo: "SIMU 810123 6", tankNo: "ISOT-083" },
  { deckMode: "CARGO_HOLD", bay: "BAY 09", tier: "Tier 06", row: "ROW 04", serialNo: "SIMU 811125 5", tankNo: "ISOT-084" },
  { deckMode: "CARGO_HOLD", bay: "BAY 17", tier: "Tier 06", row: "ROW 02", serialNo: "SIMU 811314 0", tankNo: "ISOT-085" },
  { deckMode: "CARGO_HOLD", bay: "BAY 13", tier: "Tier 06", row: "ROW 02", serialNo: "SIMU 811164 0", tankNo: "ISOT-086" },
  { deckMode: "CARGO_HOLD", bay: "BAY 09", tier: "Tier 06", row: "ROW 02", serialNo: "SIMU 810214 5", tankNo: "ISOT-087" },
  { deckMode: "CARGO_HOLD", bay: "BAY 05", tier: "Tier 06", row: "ROW 02", serialNo: "SIMU 811132 1", tankNo: "ISOT-088" },
  { deckMode: "CARGO_HOLD", bay: "BAY 17", tier: "Tier 06", row: "ROW 00/01", serialNo: "SIMU 810168 4", tankNo: "ISOT-089" },
  { deckMode: "CARGO_HOLD", bay: "BAY 13", tier: "Tier 06", row: "ROW 00/01", serialNo: "SIMU 810201 6", tankNo: "ISOT-090" },
  { deckMode: "CARGO_HOLD", bay: "BAY 09", tier: "Tier 06", row: "ROW 00/01", serialNo: "SIMU 810214 1", tankNo: "ISOT-091" },
  { deckMode: "CARGO_HOLD", bay: "BAY 05", tier: "Tier 06", row: "ROW 00/01", serialNo: "SIMU 810203 7", tankNo: "ISOT-092" },
  { deckMode: "CARGO_HOLD", bay: "BAY 17", tier: "Tier 06", row: "ROW 03", serialNo: "SIMU 810129 9", tankNo: "ISOT-093" },
  { deckMode: "CARGO_HOLD", bay: "BAY 13", tier: "Tier 06", row: "ROW 03", serialNo: "SIMU 811312 9", tankNo: "ISOT-094" },
  { deckMode: "CARGO_HOLD", bay: "BAY 09", tier: "Tier 06", row: "ROW 03", serialNo: "SIMU 811131 6", tankNo: "ISOT-095" },
  { deckMode: "CARGO_HOLD", bay: "BAY 17", tier: "Tier 06", row: "ROW 05", serialNo: "SIMU 810369 2", tankNo: "ISOT-096" },
  { deckMode: "CARGO_HOLD", bay: "BAY 13", tier: "Tier 06", row: "ROW 05", serialNo: "SIMU 811130 0", tankNo: "ISOT-097" },
  { deckMode: "CARGO_HOLD", bay: "BAY 09", tier: "Tier 06", row: "ROW 05", serialNo: "SIMU 810180 6", tankNo: "ISOT-098" },

  // --- Tier 04 ---
  { deckMode: "CARGO_HOLD", bay: "BAY 19", tier: "Tier 04", row: "ROW 06", serialNo: "SIMU 811092 1", tankNo: "ISOT-099" },
  { deckMode: "CARGO_HOLD", bay: "BAY 17", tier: "Tier 04", row: "ROW 06", serialNo: "SIMU 810265 4", tankNo: "ISOT-100" },
  { deckMode: "CARGO_HOLD", bay: "BAY 13", tier: "Tier 04", row: "ROW 06", serialNo: "SIMU 810156 0", tankNo: "ISOT-101" },
  { deckMode: "CARGO_HOLD", bay: "BAY 09", tier: "Tier 04", row: "ROW 06", serialNo: "SIMU 811076 8", tankNo: "ISOT-102" },
  { deckMode: "CARGO_HOLD", bay: "BAY 17", tier: "Tier 04", row: "ROW 04", serialNo: "SIMU 810164 2", tankNo: "ISOT-103" },
  { deckMode: "CARGO_HOLD", bay: "BAY 13", tier: "Tier 04", row: "ROW 04", serialNo: "SIMU 810368 7", tankNo: "ISOT-104" },
  { deckMode: "CARGO_HOLD", bay: "BAY 09", tier: "Tier 04", row: "ROW 04", serialNo: "SIMU 810134 4", tankNo: "ISOT-105" },
  { deckMode: "CARGO_HOLD", bay: "BAY 17", tier: "Tier 04", row: "ROW 02", serialNo: "SIMU 810244 3", tankNo: "ISOT-106" },
  { deckMode: "CARGO_HOLD", bay: "BAY 13", tier: "Tier 04", row: "ROW 02", serialNo: "SIMU 810204 2", tankNo: "ISOT-107" },
  { deckMode: "CARGO_HOLD", bay: "BAY 09", tier: "Tier 04", row: "ROW 02", serialNo: "SIMU 811134 2", tankNo: "ISOT-108" },
  { deckMode: "CARGO_HOLD", bay: "BAY 05", tier: "Tier 04", row: "ROW 02", serialNo: "SIMU 811121 3", tankNo: "ISOT-109" },
  { deckMode: "CARGO_HOLD", bay: "BAY 19", tier: "Tier 04", row: "ROW 00/01", serialNo: "SIMU 810183 2", tankNo: "ISOT-110" },
  { deckMode: "CARGO_HOLD", bay: "BAY 17", tier: "Tier 04", row: "ROW 00/01", serialNo: "SIMU 810281 8", tankNo: "ISOT-111" },
  { deckMode: "CARGO_HOLD", bay: "BAY 13", tier: "Tier 04", row: "ROW 00/01", serialNo: "SIMU 810387 7", tankNo: "ISOT-112" },
  { deckMode: "CARGO_HOLD", bay: "BAY 09", tier: "Tier 04", row: "ROW 00/01", serialNo: "SIMU 810150 8", tankNo: "ISOT-113" },
  { deckMode: "CARGO_HOLD", bay: "BAY 05", tier: "Tier 04", row: "ROW 00/01", serialNo: "SIMU 810140 5", tankNo: "ISOT-114" },
  { deckMode: "CARGO_HOLD", bay: "BAY 17", tier: "Tier 04", row: "ROW 03", serialNo: "SIMU 810355 8", tankNo: "ISOT-115" },
  { deckMode: "CARGO_HOLD", bay: "BAY 13", tier: "Tier 04", row: "ROW 03", serialNo: "SIMU 811141 9", tankNo: "ISOT-116" },
  { deckMode: "CARGO_HOLD", bay: "BAY 09", tier: "Tier 04", row: "ROW 03", serialNo: "SIMU 811101 8", tankNo: "ISOT-117" },
  { deckMode: "CARGO_HOLD", bay: "BAY 17", tier: "Tier 04", row: "ROW 05", serialNo: "SIMU 811089 7", tankNo: "ISOT-118" },
  { deckMode: "CARGO_HOLD", bay: "BAY 13", tier: "Tier 04", row: "ROW 05", serialNo: "SIMU 810362 4", tankNo: "ISOT-119" },
  { deckMode: "CARGO_HOLD", bay: "BAY 09", tier: "Tier 04", row: "ROW 05", serialNo: "SIMU 811163 5", tankNo: "ISOT-120" },
];

// Master 120 Fleet Serial-to-ISOT Mapping dynamically derived from OFFICIAL_SAVIOUR_BAY_PLAN_120
export const SERIAL_TO_ISOT_MAP: Record<string, string> = OFFICIAL_SAVIOUR_BAY_PLAN_120.reduce((acc, r) => {
  const digits = r.serialNo.replace(/[^0-9]/g, '');
  acc[digits] = r.tankNo;
  return acc;
}, {} as Record<string, string>);

