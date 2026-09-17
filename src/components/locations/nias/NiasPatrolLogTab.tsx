// src/components/locations/nias/NiasPatrolLogTab.tsx
//
// PURPOSE
//   "4-HR PATROL LOG" — Phase 12 Stage 2, 3-서브탭 재편(Stage E-5,
//   2026-09-17 HJ 승인)으로 AAV/N2/GC 순찰 폼을 최초로 라이브 마운트한다.
//   서브탭 상태는 NiasSubTabsNavPanel.tsx와 동일한 단일 슬롯 activeKey
//   패턴(win-tab-active/win-tab-inactive)을 재사용한다.
//
//   Metering Train A/B + NG Buffer Tank는 기존 마운트를 그대로 이동한
//   것뿐(저장 로직 무변경). AavPatrolForm/N2SkidPatrolForm/GcPatrolForm은
//   이전까지 자체 테스트에서만 참조되던 orphaned 컴포넌트로, 이번에
//   처음 라이브 저장 경로에 연결된다.
//
//   The old "Generate Daily Report" trigger is NOT relocated here — it was
//   a duplicate of DailyOpsOverviewView.tsx's ApprovalPanel, which remains
//   the single canonical entry point for report generation.

'use client';

import { useState } from 'react';
import { AavPatrolForm } from '../../../cmms-daily-ops/components/patrol/AavPatrolForm';
import { MeteringPatrolForm } from '../../../cmms-daily-ops/components/patrol/MeteringPatrolForm';
import { NgBufferTankPatrolForm } from '../../../cmms-daily-ops/components/patrol/NgBufferTankPatrolForm';
import { GcPatrolForm } from '../../../cmms-daily-ops/components/patrol/GcPatrolForm';
import { N2SkidPatrolForm } from '../../../cmms-daily-ops/components/patrol/N2SkidPatrolForm';
import { IsoTankUnloadingSkidPatrolForm } from '../../../cmms-daily-ops/components/patrol/IsoTankUnloadingSkidPatrolForm';
import { usePatrolSaveHandler } from '../../../cmms-daily-ops/hooks/usePatrolSaveHandler';
import { TITLE_BAR } from '../../cmms/scadaStyles';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

type PatrolLogSubTab = 'AAV_BUFFER' | 'METERING' | 'N2_BOTTLES' | 'ISO_TANK_SKID';

const SUB_TAB_BUTTON = 'px-2.5 py-1 text-xs font-bold font-mono cursor-pointer';

export default function NiasPatrolLogTab() {
  const [reportDate] = useState(today);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<PatrolLogSubTab>('AAV_BUFFER');

  const onSaveAav = usePatrolSaveHandler('aav', reportDate, 'FIELD OP-1', setBlockedReason);
  const onSaveNgBufferTank = usePatrolSaveHandler('ng_buffer_tank', reportDate, 'FIELD OP-1', setBlockedReason);
  const onSaveTrainA = usePatrolSaveHandler('metering_train_a', reportDate, 'FIELD OP-1', setBlockedReason);
  const onSaveTrainB = usePatrolSaveHandler('metering_train_b', reportDate, 'FIELD OP-1', setBlockedReason);
  const onSaveGc = usePatrolSaveHandler('gc', reportDate, 'FIELD OP-1', setBlockedReason);
  const onSaveN2Skid = usePatrolSaveHandler('n2_skid', reportDate, 'FIELD OP-1', setBlockedReason);
  const onSaveIsoTankSkid = usePatrolSaveHandler('iso_tank_unloading_skid', reportDate, 'FIELD OP-1', setBlockedReason);

  return (
    <div className="p-4 space-y-4">
      <div className={TITLE_BAR}>4-HR PATROL LOG — {reportDate}</div>
      {blockedReason && (
        <div className="text-[11px] text-red-700 font-bold">{blockedReason}</div>
      )}

      <div className="flex items-center gap-1 border-b border-[#808080]">
        <button
          type="button"
          onClick={() => setSubTab('AAV_BUFFER')}
          className={`${SUB_TAB_BUTTON} ${subTab === 'AAV_BUFFER' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'}`}
        >
          AAV & Buffer Tank
        </button>
        <button
          type="button"
          onClick={() => setSubTab('METERING')}
          className={`${SUB_TAB_BUTTON} ${subTab === 'METERING' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'}`}
        >
          Metering
        </button>
        <button
          type="button"
          onClick={() => setSubTab('N2_BOTTLES')}
          className={`${SUB_TAB_BUTTON} ${subTab === 'N2_BOTTLES' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'}`}
        >
          N2 & Bottles
        </button>
        <button
          type="button"
          onClick={() => setSubTab('ISO_TANK_SKID')}
          className={`${SUB_TAB_BUTTON} ${subTab === 'ISO_TANK_SKID' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'}`}
        >
          ISO Tank Unloading Skid
        </button>
      </div>

      {subTab === 'AAV_BUFFER' && (
        <>
          <AavPatrolForm onSave={onSaveAav} />
          <NgBufferTankPatrolForm onSave={onSaveNgBufferTank} />
        </>
      )}
      {subTab === 'METERING' && (
        <>
          <MeteringPatrolForm train="A" onSave={onSaveTrainA} />
          <MeteringPatrolForm train="B" onSave={onSaveTrainB} />
          <GcPatrolForm onSave={onSaveGc} />
        </>
      )}
      {subTab === 'N2_BOTTLES' && <N2SkidPatrolForm onSave={onSaveN2Skid} />}
      {subTab === 'ISO_TANK_SKID' && <IsoTankUnloadingSkidPatrolForm onSave={onSaveIsoTankSkid} />}
    </div>
  );
}
