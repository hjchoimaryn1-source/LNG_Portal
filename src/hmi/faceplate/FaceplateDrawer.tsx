// src/hmi/faceplate/FaceplateDrawer.tsx
//
// PURPOSE
//   Phase HMI-1c — P&ID 배지 클릭 시 뜨는 장비 상세 슬라이드 드로어의 셸.
//   이번 스테이지는 탭 전환 UI + 슬라이드 오픈/닫힘 애니메이션만 완성하고,
//   3개 탭(Readout/Trend/PatrolHistory) 컨텐츠는 전부 "준비 중" 플레이스홀더다.
//   실제 데이터는 useHmiEquipment(HMI-1b)로 이미 라이브 구독하고 있으므로,
//   각 탭 구현체는 이 컴포넌트를 재작성하지 않고 스텁 자리만 교체하면 된다.

'use client';

import { useEffect, useState } from 'react';
import { RAISED_PANEL, TITLE_BAR, SUNKEN_PANEL, BEVEL_BUTTON, BEVEL_BUTTON_PRESSED } from '../../components/cmms/scadaStyles';
import { CANDIDATE_TAG_DOMAIN } from '../../cmms-daily-ops/pid/pidCandidateTags';
import { useHmiEquipment } from '../state/useHmiLiveStore';
import type { PatrolDomain } from '../types/hmiCore';

type FaceplateTab = 'readout' | 'trend' | 'patrol-history';

export interface FaceplateDrawerProps {
  equipmentTag: string | null;
  onClose: () => void;
  initialTab?: FaceplateTab;
}

const TAB_LABEL: Record<FaceplateTab, string> = {
  readout: 'Readout',
  trend: 'Trend',
  'patrol-history': 'Patrol History',
};

export function FaceplateDrawer({ equipmentTag, onClose, initialTab = 'readout' }: FaceplateDrawerProps) {
  const [activeTab, setActiveTab] = useState<FaceplateTab>(initialTab);
  const isOpen = equipmentTag !== null;

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [equipmentTag, isOpen, initialTab]);

  // Hooks 규칙상 조건부 호출 불가 — equipmentTag가 null이거나 미등록 태그면
  // 무해한 더미 키('aav', '')로 조회하고 isOpen으로 렌더 여부만 게이팅한다
  // (PidTagBadge.tsx와 동일한 더미-키 패턴).
  const domain: PatrolDomain | undefined = equipmentTag ? CANDIDATE_TAG_DOMAIN[equipmentTag] : undefined;
  const snapshot = useHmiEquipment(domain ?? 'aav', equipmentTag ?? '');

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 z-50 transition-transform duration-200 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-hidden={!isOpen}
    >
      <div className={`${RAISED_PANEL} h-full flex flex-col`}>
        <div className={`${TITLE_BAR} flex items-center justify-between shrink-0`}>
          <span>{equipmentTag ?? ''}</span>
          <button type="button" onClick={onClose} className={BEVEL_BUTTON}>
            X
          </button>
        </div>

        <div className="flex gap-1 p-1 border-b border-[#c8c2b5] shrink-0">
          {(Object.keys(TAB_LABEL) as FaceplateTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? BEVEL_BUTTON_PRESSED : BEVEL_BUTTON}
            >
              {TAB_LABEL[tab]}
            </button>
          ))}
        </div>

        <div className={`${SUNKEN_PANEL} m-2 p-2 flex-1 overflow-y-auto text-[11px]`}>
          <div className="mb-2 pb-2 border-b border-[#c8c2b5]">
            <span className="font-bold uppercase text-slate-600 mr-1">인터락</span>
            {snapshot.interlock.status === 'NOT_IMPLEMENTED' ? (
              <span className="italic text-slate-500">인터락 정보 없음</span>
            ) : (
              <span>{snapshot.interlock.status}</span>
            )}
          </div>
          <div className="text-slate-500">{TAB_LABEL[activeTab]} — 준비 중</div>
        </div>
      </div>
    </div>
  );
}
