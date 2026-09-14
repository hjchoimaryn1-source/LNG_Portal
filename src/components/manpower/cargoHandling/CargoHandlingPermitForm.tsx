// src/components/manpower/cargoHandling/CargoHandlingPermitForm.tsx
"use client";

import React from 'react';
import { X, Ship } from 'lucide-react';
import type { CargoHandlingActivityType, PTWPermit } from '../../../types/lng';
import { CARGO_HANDLING_AGT_MANDATORY_POINTS } from '../../../data/ptwCargoHandlingRules';
import { mapCargoHandlingFormToPermit } from '../../../data/ptwCargoHandlingMapper';
import { useCargoHandlingPermitForm } from './hooks/useCargoHandlingPermitForm';
import StatusGateChecklist from './StatusGateChecklist';
import { SopQuickLinkBar } from '../../sop';
import { encodeSopQuickLinkTarget } from '../../sop/utils/sopQuickLinkTarget';

export interface CargoHandlingPermitFormProps {
  isOpen: boolean;
  onClose: () => void;
  sequenceNumber: number;
  onSubmitSuccess: (newPermit: PTWPermit) => void;
  onOpenSopReference?: (target?: string) => void;
}

const ACTIVITY_LABELS: Record<CargoHandlingActivityType, string> = {
  UNLOADING: 'ISO Tank 하역 (Unloading)',
  LIFTING: '크레인/리치스태커 인양 (Lifting)',
  COMBINED: '하역 + 인양 연속 조업 (Combined)',
};

export default function CargoHandlingPermitForm({ isOpen, onClose, sequenceNumber, onSubmitSuccess, onOpenSopReference }: CargoHandlingPermitFormProps) {
  const { details, identity, update, updateIdentity, updateGasPoint, setActivityType, gates } = useCargoHandlingPermitForm();

  if (!isOpen) return null;

  const isUnloading = details.activityType !== 'LIFTING';
  const isLifting = details.activityType !== 'UNLOADING';

  const handleSubmit = () => {
    if (!identity.title.trim() || !identity.location.trim() || !identity.workLeaderName.trim()) {
      alert('Please enter Title, Location, and Work Leader.');
      return;
    }
    const newPermit = mapCargoHandlingFormToPermit(identity, details, gates.requiredSopCodes, sequenceNumber);
    onSubmitSuccess(newPermit);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="win-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] p-1 shadow-2xl font-sans text-xs">
        <div className="bg-blue-950 text-white px-3 py-1.5 flex justify-between items-center font-bold tracking-wide">
          <span className="flex items-center gap-2">
            <Ship className="w-4 h-4 text-amber-400" />
            <span>Cargo Handling PTW — Issuance & Status Gate</span>
          </span>
          <button onClick={onClose} className="win-btn px-1.5 py-0.5 text-black font-black bg-[#d4d0c8] border border-gray-600 hover:bg-slate-300">
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-[#d4d0c8] px-3 py-1 border-b border-[#808080]">
          {isUnloading && (
            <SopQuickLinkBar
              context="PTW_CARGO_HANDLING_UNLOADING"
              onSelect={(link) => onOpenSopReference?.(encodeSopQuickLinkTarget(link))}
            />
          )}
          {isLifting && (
            <SopQuickLinkBar
              context="PTW_CARGO_HANDLING_LIFTING"
              onSelect={(link) => onOpenSopReference?.(encodeSopQuickLinkTarget(link))}
            />
          )}
        </div>

        <div className="p-3 grid grid-cols-2 gap-3 bg-[#d4d0c8]">
          <div className="space-y-2">
            <div className="border border-[#808080] p-2 bg-slate-50 rounded space-y-1.5">
              <label className="text-[10px] font-bold text-slate-700 block">작업 유형 (Activity Type)</label>
              <select value={details.activityType} onChange={(e) => setActivityType(e.target.value as CargoHandlingActivityType)} className="w-full win-sunken p-1 text-xs font-semibold bg-white border border-gray-400">
                {(Object.keys(ACTIVITY_LABELS) as CargoHandlingActivityType[]).map((k) => (
                  <option key={k} value={k}>{ACTIVITY_LABELS[k]}</option>
                ))}
              </select>
              <input placeholder="Title" value={identity.title} onChange={(e) => updateIdentity('title', e.target.value)} className="w-full win-sunken p-1 text-xs bg-white border border-gray-400" />
              <input placeholder="Location" value={identity.location} onChange={(e) => updateIdentity('location', e.target.value)} className="w-full win-sunken p-1 text-xs bg-white border border-gray-400" />
              <input placeholder="Work Leader" value={identity.workLeaderName} onChange={(e) => updateIdentity('workLeaderName', e.target.value)} className="w-full win-sunken p-1 text-xs bg-white border border-gray-400" />
            </div>

            <div className="border border-[#808080] p-2 bg-slate-50 rounded space-y-1.5">
              <label className="text-[10px] font-bold text-slate-700 block">Critical High Risk Inputs</label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] w-28">적재 중량 (ton)</span>
                <input type="number" value={details.loadedWeightTon} onChange={(e) => update('loadedWeightTon', Number(e.target.value))} className="win-sunken p-1 text-xs bg-white border border-gray-400 w-24" />
              </div>
              <label className="flex items-center gap-1.5 text-[11px]">
                <input type="checkbox" checked={details.isActiveCryogenicFlow} onChange={(e) => update('isActiveCryogenicFlow', e.target.checked)} /> 가압/극저온 유동 중 (Active Cryogenic Flow)
              </label>
              <label className="flex items-center gap-1.5 text-[11px]">
                <input type="checkbox" checked={details.hoseDisconnectionInProgress} onChange={(e) => update('hoseDisconnectionInProgress', e.target.checked)} /> 배관/호스 분리 작업 진행
              </label>
            </div>

            {isUnloading && (
              <div className="border border-[#808080] p-2 bg-slate-50 rounded space-y-1.5">
                <label className="text-[10px] font-bold text-slate-700 block">AGT (T-201~T-204) / Grounding</label>
                {CARGO_HANDLING_AGT_MANDATORY_POINTS.map((tagId) => {
                  const point = details.gasReadingPoints.find((p) => p.tagId === tagId)!;
                  return (
                    <div key={tagId} className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono w-10">{tagId}</span>
                      <input type="number" step="0.1" value={point.lelPercent} onChange={(e) => updateGasPoint(tagId, { lelPercent: Number(e.target.value) })} className="win-sunken p-1 text-[11px] bg-white border border-gray-400 w-16" placeholder="LEL%" />
                      <input type="number" step="0.1" value={point.o2Percent} onChange={(e) => updateGasPoint(tagId, { o2Percent: Number(e.target.value) })} className="win-sunken p-1 text-[11px] bg-white border border-gray-400 w-16" placeholder="O2%" />
                      <input type="datetime-local" value={point.testedAt} onChange={(e) => updateGasPoint(tagId, { testedAt: e.target.value })} className="win-sunken p-1 text-[10px] bg-white border border-gray-400 flex-1" />
                    </div>
                  );
                })}
                <label className="flex items-center gap-1.5 text-[11px] pt-1">
                  <input type="checkbox" checked={details.atmosphereSafeCertifiedByHseOfficer} disabled={!gates.agt.isAtmosphereSafeCertifiable} onChange={(e) => update('atmosphereSafeCertifiedByHseOfficer', e.target.checked)} />
                  Atmosphere Safe 최종 인증 (HSE Officer)
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] w-28">접지 저항 (Ω)</span>
                  <input type="number" step="0.1" value={details.groundingResistanceOhm} onChange={(e) => update('groundingResistanceOhm', Number(e.target.value))} className="win-sunken p-1 text-xs bg-white border border-gray-400 w-24" />
                </div>
                <label className={`flex items-center gap-1.5 text-[11px] ${!gates.depressurization.isDisconnectionApproved ? 'opacity-50' : ''}`} title={!gates.depressurization.isDisconnectionApproved ? '감압 목표 미충족 — 배관/호스 분리 완료 체크 불가' : undefined}>
                  <input type="checkbox" checked={details.allHosesDisconnected} disabled={!gates.depressurization.isDisconnectionApproved} onChange={(e) => update('allHosesDisconnected', e.target.checked)} /> 모든 배관/호스 분리 완료
                </label>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="border border-[#808080] p-2 bg-slate-50 rounded space-y-1.5">
              <label className="text-[10px] font-bold text-slate-700 block">Depressurization</label>
              <select value={details.depressurizationTagId} onChange={(e) => update('depressurizationTagId', e.target.value)} className="w-full win-sunken p-1 text-xs bg-white border border-gray-400">
                {['T-203', 'ISO-TANK-GENERAL'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-[10px] w-28">현재 압력 (MPa)</span>
                <input type="number" step="0.01" value={details.currentPressureMPa} onChange={(e) => update('currentPressureMPa', Number(e.target.value))} className="win-sunken p-1 text-xs bg-white border border-gray-400 w-24" />
              </div>
              <label className="flex items-center gap-1.5 text-[11px]">
                <input type="checkbox" checked={details.isFlexibleHoseOrQccDisconnection} onChange={(e) => update('isFlexibleHoseOrQccDisconnection', e.target.checked)} /> 극저온 호스/QCC 커플러 탈거
              </label>
              <label className="flex items-center gap-1.5 text-[11px]">
                <input type="checkbox" checked={details.icingPresent} onChange={(e) => update('icingPresent', e.target.checked)} /> 배관 결빙 (Icing) 존재
              </label>
            </div>

            <div className="border border-[#808080] p-2 bg-slate-50 rounded space-y-1.5">
              <label className="text-[10px] font-bold text-slate-700 block">Mandatory Safety Controls</label>
              <label className="flex items-center gap-1.5 text-[11px]">
                <input type="checkbox" checked={details.fireWatchAssigned} onChange={(e) => update('fireWatchAssigned', e.target.checked)} /> Fire Watch 배치 (DCP/CO2 휴대)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] w-28">바리케이드 반경 (m)</span>
                <input type="number" value={details.barricadeRadiusM} onChange={(e) => update('barricadeRadiusM', Number(e.target.value))} className="win-sunken p-1 text-xs bg-white border border-gray-400 w-24" />
              </div>
              <label className="flex items-center gap-1.5 text-[11px]">
                <input type="checkbox" checked={details.ertStandbyReady} onChange={(e) => update('ertStandbyReady', e.target.checked)} /> ERT Standby (SCBA 완비)
              </label>
              {isLifting && (
                <>
                  <label className="flex items-center gap-1.5 text-[11px]">
                    <input type="checkbox" checked={details.craneOperatorSioClassIIOrAbove} onChange={(e) => update('craneOperatorSioClassIIOrAbove', e.target.checked)} /> Crane Operator SIO Class II+
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px]">
                    <input type="checkbox" checked={details.riggerCertificateHeld} onChange={(e) => update('riggerCertificateHeld', e.target.checked)} /> Rigger Certificate 보유
                  </label>
                </>
              )}
            </div>

            <div className="border border-[#808080] p-2 bg-slate-50 rounded space-y-1.5">
              <label className="text-[10px] font-bold text-slate-700 block">Approval & Closure Signatures</label>
              <label className="flex items-center gap-1.5 text-[11px]">
                <input type="checkbox" checked={details.siteManagerAvailable} onChange={(e) => update('siteManagerAvailable', e.target.checked)} /> Site Manager 재직 중 (Available)
              </label>
              <label className="flex items-center gap-1.5 text-[11px]">
                <input type="checkbox" checked={details.delegationMemoAttached} onChange={(e) => update('delegationMemoAttached', e.target.checked)} /> 위임 Memo 첨부 (Sr. O&M Leader 대행 시)
              </label>
              <label className="flex items-center gap-1.5 text-[11px]">
                <input type="checkbox" checked={details.esdvThreeStageIsolationConfirmed} onChange={(e) => update('esdvThreeStageIsolationConfirmed', e.target.checked)} /> ESDV 3단계 완전 고립 확인
              </label>
              <div className="grid grid-cols-3 gap-1 pt-1">
                <label className="flex items-center gap-1 text-[10px]"><input type="checkbox" checked={details.workLeaderSignedOff} onChange={(e) => update('workLeaderSignedOff', e.target.checked)} /> Work Leader</label>
                <label className="flex items-center gap-1 text-[10px]"><input type="checkbox" checked={details.hseOfficerSignedOff} onChange={(e) => update('hseOfficerSignedOff', e.target.checked)} /> HSE Officer</label>
                <label className="flex items-center gap-1 text-[10px]"><input type="checkbox" checked={details.siteManagerSignedOff} onChange={(e) => update('siteManagerSignedOff', e.target.checked)} /> Site Manager</label>
              </div>
              <label className="flex items-center gap-1.5 text-[11px]">
                <input type="checkbox" checked={details.allLotoLocksRemoved} onChange={(e) => update('allLotoLocksRemoved', e.target.checked)} /> LOTO 잠금 전체 해제
              </label>
              <label className="flex items-center gap-1.5 text-[11px]">
                <input type="checkbox" checked={details.leakTestPassed} onChange={(e) => update('leakTestPassed', e.target.checked)} /> 배관 기밀/누설 테스트 통과
              </label>
            </div>
          </div>
        </div>

        <div className="px-3 pb-3 bg-[#d4d0c8]">
          <div className="border-t border-gray-500 pt-2">
            <StatusGateChecklist gates={gates} />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button onClick={onClose} className="win-btn px-3 py-1 text-xs font-bold text-black bg-[#d4d0c8] border border-gray-600 hover:bg-slate-300">
              Cancel
            </button>
            <button onClick={handleSubmit} className="win-btn px-3 py-1 text-xs font-bold text-white bg-blue-900 border border-gray-600 hover:bg-blue-800">
              Submit (DRAFT)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
