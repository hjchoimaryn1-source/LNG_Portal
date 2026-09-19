// src/hmi/state/hmiTagAliasCache.ts
//
// PURPOSE
//   HMI-2-alias — pid_tag_aliases(alias → canonical) 매핑의 클라이언트 캐시.
//   useDailyOpsPatrolStore.ts의 구독/발행 Map과 달리 정적 참조 데이터라 리스너가
//   없다 — useHmiEquipment은 이 캐시를 매 렌더마다 동기적으로 읽기만 한다(순수
//   함수 호출, 훅 아님).
//
//   KNOWN GAP: DailyOpsDataContext의 하이드레이션 fetch가 useHmiEquipment을 쓰는
//   컴포넌트보다 늦게 끝나면, 그 사이 렌더는 alias 미해결 상태(원본 태그 그대로)로
//   보일 수 있다 — 이 스테이지는 구독/재렌더 배선을 요구하지 않는다(HMI-2-alias
//   지시 원문).

const aliasToCanonical = new Map<string, string>();

export interface HmiTagAliasRecord {
  canonicalTagId: string;
  aliasTagId: string;
}

/** DailyOpsDataContext 하이드레이션이 마운트 시 1회 호출 — 캐시를 전체 교체한다. */
export function setHmiTagAliases(records: HmiTagAliasRecord[]): void {
  aliasToCanonical.clear();
  for (const record of records) {
    aliasToCanonical.set(record.aliasTagId, record.canonicalTagId);
  }
}

/** alias면 canonical 태그를, 매핑이 없으면 입력 그대로 반환한다. */
export function resolveHmiDisplayTag(tag: string): string {
  return aliasToCanonical.get(tag) ?? tag;
}

/** 테스트 전용 — 모듈 스코프 캐시를 초기화한다. */
export function __resetHmiTagAliasCacheForTests(): void {
  aliasToCanonical.clear();
}
