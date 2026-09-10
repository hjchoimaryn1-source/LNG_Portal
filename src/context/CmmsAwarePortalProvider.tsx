// src/context/CmmsAwarePortalProvider.tsx
//
// PURPOSE
//   Refactoring Plan의 Strangler Fig 원칙: 기존 PortalDataContext.tsx는
//   단 1바이트도 수정하지 않는다. 이 파일이 그 위에 얇게 한 겹을 씌워
//   cmmsAssetRows(+ 로딩/에러 상태)를 추가로 제공한다.
//
//   기존 코드에서 실제 전환은 딱 한 줄이면 된다 — Provider 진입점 교체:
//     [기존] <PortalDataProvider>{children}</PortalDataProvider>
//     [변경] <CmmsAwarePortalProvider>{children}</CmmsAwarePortalProvider>
//
//   기존 usePortalData()를 쓰던 모든 컴포넌트는 그대로 동작한다(내부에서
//   PortalDataProvider를 그대로 렌더링하기 때문). CMMS 자산 데이터가 필요한
//   새 컴포넌트만 이 파일의 useCmmsAssets()를 추가로 호출하면 된다.
//
// 데이터 소스
//   src/app/api/v1/cmms/assets/route.ts (SQLite assets 테이블 실시간 조회).
//   응답 스키마는 과거 정적 배치 산출물(exportCmmsAssetSnapshot.ts의
//   CmmsAssetSnapshotFile)과 동일하게 유지되므로 이 파일의 파싱 로직은
//   무수정이다 — fetchCmmsAssetSnapshot()의 URL만 API 엔드포인트로
//   바뀌었다. useCmmsAssets()를 쓰는 하위 컴포넌트도 무수정.

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { PortalDataProvider, usePortalData } from './PortalDataContext';

// ----------------------------------------------------------------------------
// 1. 스냅샷 타입 (exportCmmsAssetSnapshot.ts의 CmmsAssetSnapshotRow와 동일 shape
//    — 백엔드 배치 코드와 프론트엔드가 이 스키마 하나로 계약을 맺는다)
// ----------------------------------------------------------------------------

export interface CmmsAssetRow {
  equipmentTag: string;
  assetName: string;
  isoClass: string;
  kksCode: string;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  locationArea: string;
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'STANDBY' | 'OUT_OF_SERVICE';
  manufacturer: string | null;
  parentTag: string | null;
  isMockData: boolean;
}

interface CmmsAssetSnapshotFile {
  generatedAt: string;
  totalCount: number;
  assets: CmmsAssetRow[];
}

// ----------------------------------------------------------------------------
// 2. CMMS 전용 Context (기존 PortalDataContext와 별개 — 합성만 함)
// ----------------------------------------------------------------------------

export interface CmmsDataContextType {
  cmmsAssetRows: CmmsAssetRow[];
  cmmsAssetsLoading: boolean;
  cmmsAssetsError: string | null;
  cmmsSnapshotGeneratedAt: string | null;
  /** true면 스냅샷 내 일부/전부가 [MOCK] placeholder — 건설 완료 후 실 데이터
   *  교체 전까지 UI에 "확정 전 데이터" 배너를 띄우는 용도 */
  hasMockData: boolean;
  reloadCmmsAssets: () => Promise<void>;
}

const CmmsDataContext = createContext<CmmsDataContextType | undefined>(undefined);

const DEFAULT_SNAPSHOT_URL = '/api/v1/cmms/assets';

/**
 * 정적 JSON 스냅샷을 fetch한다. 실패해도 예외를 던지지 않고 빈 배열 +
 * 에러 메시지를 반환한다 — 아직 배치를 한 번도 안 돌려서 파일이 없는
 * 초기 상태에서도 포털 전체가 깨지지 않아야 하기 때문(Strangler Fig 원칙:
 * CMMS 조각이 실패해도 기존 레거시 기능은 영향받지 않아야 한다).
 */
async function fetchCmmsAssetSnapshot(url: string): Promise<{ data: CmmsAssetSnapshotFile | null; error: string | null }> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return { data: null, error: `CMMS 자산 스냅샷 로드 실패 (HTTP ${res.status}). 배치 파이프라인이 아직 실행되지 않았을 수 있습니다.` };
    }
    const json = (await res.json()) as CmmsAssetSnapshotFile;
    return { data: json, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { data: null, error: `CMMS 자산 스냅샷 로드 중 오류: ${msg}` };
  }
}

function CmmsDataProvider({ children, snapshotUrl = DEFAULT_SNAPSHOT_URL }: { children: React.ReactNode; snapshotUrl?: string }) {
  const [cmmsAssetRows, setCmmsAssetRows] = useState<CmmsAssetRow[]>([]);
  const [cmmsAssetsLoading, setCmmsAssetsLoading] = useState<boolean>(true);
  const [cmmsAssetsError, setCmmsAssetsError] = useState<string | null>(null);
  const [cmmsSnapshotGeneratedAt, setCmmsSnapshotGeneratedAt] = useState<string | null>(null);

  const reloadCmmsAssets = useCallback(async () => {
    setCmmsAssetsLoading(true);
    setCmmsAssetsError(null);
    const { data, error } = await fetchCmmsAssetSnapshot(snapshotUrl);
    if (data) {
      setCmmsAssetRows(data.assets);
      setCmmsSnapshotGeneratedAt(data.generatedAt);
    } else {
      // 스냅샷이 없어도 레거시 화면은 영향받지 않도록, 조용히 빈 배열로 둔다.
      setCmmsAssetRows([]);
      setCmmsAssetsError(error);
    }
    setCmmsAssetsLoading(false);
  }, [snapshotUrl]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    queueMicrotask(() => {
      reloadCmmsAssets();
    });
  }, []);

  const hasMockData = cmmsAssetRows.some((a) => a.isMockData);

  return (
    <CmmsDataContext.Provider
      value={{
        cmmsAssetRows,
        cmmsAssetsLoading,
        cmmsAssetsError,
        cmmsSnapshotGeneratedAt,
        hasMockData,
        reloadCmmsAssets,
      }}
    >
      {children}
    </CmmsDataContext.Provider>
  );
}

/** CMMS 자산 데이터가 필요한 컴포넌트가 사용하는 훅. 기존 usePortalData()와 별개. */
export function useCmmsAssets(): CmmsDataContextType {
  const ctx = useContext(CmmsDataContext);
  if (!ctx) {
    throw new Error('useCmmsAssets must be used within a CmmsAwarePortalProvider');
  }
  return ctx;
}

// ----------------------------------------------------------------------------
// 3. 합성 Provider — 기존 PortalDataProvider를 무수정으로 감싼다
// ----------------------------------------------------------------------------

/**
 * 진입점 교체용 컴포넌트. PortalDataProvider(기존, 무수정)와
 * CmmsDataProvider(신규)를 합성해서 렌더링한다.
 *
 * 기존 usePortalData()를 쓰는 컴포넌트는 이 Provider 아래에서도 100% 동일하게
 * 동작한다 — PortalDataProvider가 그대로 렌더 트리에 남아있기 때문이다.
 */
export function CmmsAwarePortalProvider({
  children,
  cmmsSnapshotUrl,
}: {
  children: React.ReactNode;
  cmmsSnapshotUrl?: string;
}) {
  return (
    <PortalDataProvider>
      <CmmsDataProvider snapshotUrl={cmmsSnapshotUrl}>{children}</CmmsDataProvider>
    </PortalDataProvider>
  );
}

// 기존 usePortalData를 그대로 재노출 — CmmsAwarePortalProvider로 진입점만
// 바꾼 컴포넌트가 import 경로를 안 바꿔도 되도록 편의 제공.
export { usePortalData };
