// src/components/manpower/PTWManagementView.tsx
"use client";

import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Wind,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Clock,
  UserCheck,
  UserX,
  FileText,
  Activity,
  PlusCircle,
  Filter,
  CheckSquare,
  Search,
  Zap,
  Radio,
  Eye,
  XCircle,
  AlertOctagon,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  PTWPermit,
  PTWType,
  PTWWorkflowStatus,
  StaffPersonnel,
} from '../../types/lng';
import {
  PTW_SOP_FORMS,
  INITIAL_PTW_PERMITS,
  validatePTWWorkerEligibility,
  validatePTWGasSafety,
} from '../../data/ptwMasterData';
import { getStaffCompetencyStatus } from '../../data/manpowerMasterData';

interface PTWManagementViewProps {
  personnelList: StaffPersonnel[];
  isERTMet: boolean;
  ertSummary: {
    icCount: number;
    fireChiefCount: number;
    firstAiderCount: number;
    gasResponseCount: number;
  };
  onNavigateToMatrix?: (empId: string) => void;
  onNavigateToDailyShift?: () => void;
}

export default function PTWManagementView({
  personnelList,
  isERTMet,
  ertSummary,
  onNavigateToMatrix,
  onNavigateToDailyShift,
}: PTWManagementViewProps) {
  const [permits, setPermits] = useState<PTWPermit[]>(INITIAL_PTW_PERMITS);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<PTWType | 'ALL'>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<PTWWorkflowStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected permit for detail & safety gas testing
  const [selectedPermitId, setSelectedPermitId] = useState<string>(INITIAL_PTW_PERMITS[0]?.id || '');
  
  // Modal State for New PTW Permit
  const [isNewPermitModalOpen, setIsNewPermitModalOpen] = useState<boolean>(false);
  const [newPermitType, setNewPermitType] = useState<PTWType>('HOT_WORK');
  const [newPermitTitle, setNewPermitTitle] = useState<string>('');
  const [newPermitLocation, setNewPermitLocation] = useState<string>('Vaporization Skid #1');
  const [newWorkLeaderId, setNewWorkLeaderId] = useState<string>('EMP-005');
  const [newWorkerId, setNewWorkerId] = useState<string>('EMP-006');
  const [newGasLel, setNewGasLel] = useState<number>(0.0);
  const [newGasO2, setNewGasO2] = useState<number>(20.9);

  // Active Permit Object
  const activePermit = useMemo(
    () => permits.find((p) => p.id === selectedPermitId) || permits[0] || null,
    [permits, selectedPermitId]
  );

  // Filtered Permits
  const filteredPermits = useMemo(() => {
    return permits.filter((p) => {
      const matchType = selectedTypeFilter === 'ALL' || p.type === selectedTypeFilter;
      const matchStatus = selectedStatusFilter === 'ALL' || p.status === selectedStatusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.formNumber.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.workLeaderName.toLowerCase().includes(q);
      return matchType && matchStatus && matchQuery;
    });
  }, [permits, selectedTypeFilter, selectedStatusFilter, searchQuery]);

  // Dynamic Statistics
  const stats = useMemo(() => {
    const total = permits.length;
    const activeCount = permits.filter((p) => p.status === 'ACTIVE').length;
    const approvedCount = permits.filter((p) => p.status === 'APPROVED').length;
    const preparedCount = permits.filter((p) => p.status === 'PREPARED').length;
    const draftCount = permits.filter((p) => p.status === 'DRAFT').length;
    const closedCount = permits.filter((p) => p.status === 'CLOSED').length;
    const hotWorkCount = permits.filter((p) => p.type === 'HOT_WORK' && p.status === 'ACTIVE').length;
    const confinedCount = permits.filter((p) => p.type === 'CONFINED_SPACE' && (p.status === 'ACTIVE' || p.status === 'APPROVED')).length;

    return {
      total,
      activeCount,
      approvedCount,
      preparedCount,
      draftCount,
      closedCount,
      hotWorkCount,
      confinedCount,
    };
  }, [permits]);

  // Gas safety evaluation for active permit
  const currentGasSafety = useMemo(() => {
    if (!activePermit) return { isSafe: true, blockReason: null };
    return validatePTWGasSafety(activePermit.type, activePermit.gasReadings);
  }, [activePermit]);

  // Update Gas readings handler
  const handleUpdateGasReadings = (permitId: string, lel: number, o2: number) => {
    setPermits((prev) =>
      prev.map((p) => {
        if (p.id !== permitId) return p;
        const newReadings = {
          ...p.gasReadings,
          lelPercent: lel,
          o2Percent: o2,
          testedAt: `2026-09-01 ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
        };
        const safety = validatePTWGasSafety(p.type, newReadings);
        return {
          ...p,
          gasReadings: {
            ...newReadings,
            isSafeForWork: safety.isSafe,
          },
        };
      })
    );
  };

  // Workflow State Transition Handlers (Draft -> Prepared -> Approved -> Active -> Closed)
  const handleTransitionStatus = (permitId: string, nextStatus: PTWWorkflowStatus) => {
    const target = permits.find((p) => p.id === permitId);
    if (!target) return;

    // Gate 1: Confined Space O2 band check for Approval / Activation
    if (target.type === 'CONFINED_SPACE' && (nextStatus === 'APPROVED' || nextStatus === 'ACTIVE')) {
      if (target.gasReadings.o2Percent < 19.5 || target.gasReadings.o2Percent > 23.5) {
        alert(`⚠️ [CONFINED SPACE ENTRY BLOCKED]\nO2 concentration is ${target.gasReadings.o2Percent}%.\nSOP NP07-12 mandates safe atmospheric oxygen band of 19.5% ~ 23.5%.`);
        return;
      }
    }

    // Gate 2: Hot Work LEL 0.0% check for Activation
    if (target.type === 'HOT_WORK' && nextStatus === 'ACTIVE') {
      if (target.gasReadings.lelPercent > 0) {
        alert(`⚠️ [HOT WORK ACTIVATION BLOCKED]\nHydrocarbon gas reading is ${target.gasReadings.lelPercent}% LEL.\nSOP NP07-11 strictly requires 0.0% LEL in cryogenic gas zones.`);
        return;
      }
    }

    // Gate 3: ERT Minimum Manning Check for High Risk Activation
    if ((target.type === 'HOT_WORK' || target.type === 'CONFINED_SPACE') && nextStatus === 'ACTIVE' && !isERTMet) {
      alert(`⚠️ [CRITICAL ERT DEFICIT]\nCannot activate high-risk ${target.type} permit.\nERT minimum manning is not met (19 Direct personnel standard required).`);
      return;
    }

    setPermits((prev) =>
      prev.map((p) => {
        if (p.id !== permitId) return p;
        return {
          ...p,
          status: nextStatus,
          closedAt: nextStatus === 'CLOSED' ? '2026-09-01 18:00' : p.closedAt,
        };
      })
    );
  };

  // Create New PTW Permit
  const handleCreatePermit = () => {
    if (!newPermitTitle.trim()) {
      alert('Please enter a permit work title.');
      return;
    }

    const leader = personnelList.find((s) => s.id === newWorkLeaderId);
    const worker = personnelList.find((s) => s.id === newWorkerId);
    if (!leader || !worker) return;

    const leaderCheck = validatePTWWorkerEligibility(leader, newPermitType);
    const workerCheck = validatePTWWorkerEligibility(worker, newPermitType);

    if (!leaderCheck.isEligible) {
      alert(`Work Leader (${leader.name}) is disqualified: ${leaderCheck.reason}`);
      return;
    }
    if (!workerCheck.isEligible) {
      alert(`Assigned Worker (${worker.name}) is disqualified: ${workerCheck.reason}`);
      return;
    }

    const formDef = PTW_SOP_FORMS[newPermitType];
    const newId = `PTW-2026-0901-${String(permits.length + 1).padStart(2, '0')}`;

    const newPermit: PTWPermit = {
      id: newId,
      formNumber: formDef.formNumber,
      type: newPermitType,
      title: newPermitTitle,
      location: newPermitLocation,
      status: 'DRAFT',
      workLeaderId: leader.id,
      workLeaderName: leader.name,
      assignedWorkerIds: [worker.id],
      assignedWorkerNames: [worker.name],
      agtStaffId: 'EMP-013',
      approverStaffId: 'EMP-001',
      gasReadings: {
        lelPercent: newGasLel,
        o2Percent: newGasO2,
        h2sPpm: 0.0,
        coPpm: 0.0,
        testedAt: '2026-09-01 12:00 WIB',
        isSafeForWork: newPermitType === 'HOT_WORK' ? newGasLel === 0 : newGasO2 >= 19.5 && newGasO2 <= 23.5,
      },
      safetyChecklist: {
        fireWatchAssigned: newPermitType === 'HOT_WORK',
        gasDetectorContinuous: true,
        lotoApplied: newPermitType === 'ELECTRICAL',
        forcedVentilation: newPermitType === 'CONFINED_SPACE',
        ppeVerified: true,
        barricadeSet: true,
      },
      validFrom: '2026-09-01 13:00',
      validTo: '2026-09-01 18:00',
      emergencyProtocol: 'Radio Channel 1 Emergency Channel Active',
      createdAt: '2026-09-01 12:00',
      hazardDescription: `${formDef.category} protocol active under SOP ${formDef.formNumber}.`,
    };

    setPermits((prev) => [newPermit, ...prev]);
    setSelectedPermitId(newId);
    setIsNewPermitModalOpen(false);
    setNewPermitTitle('');
  };

  return (
    <div className="space-y-3 font-sans">
      
      {/* 1. Top KPI Summary & ERT Gatekeeper Bar */}
      <div className="bg-[#e9e6df] border border-slate-400 p-2.5 flex items-center justify-between gap-3 flex-wrap text-xs shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <FileText className="w-4 h-4 text-blue-900" />
            <span className="text-sm">PTW Master Register (SOP NP07-10 ~ NP07-15)</span>
          </div>
          <span className="bg-blue-900 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px]">
            {stats.total} Permits Registered
          </span>
          <span className="bg-emerald-800 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px]">
            {stats.activeCount} Active on Site
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* ERT Manning Warning */}
          {!isERTMet ? (
            <div className="flex items-center gap-1.5 bg-rose-100 border border-rose-400 text-rose-950 px-2.5 py-1 rounded font-bold text-[11px] animate-pulse">
              <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
              <span>[ERT DEFICIT] Hot Work / Confined Space Activation Suspended</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-100 border border-emerald-400 text-emerald-950 px-2.5 py-1 rounded font-bold text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>ERT Manning Verified (19 Direct Staff Cleared)</span>
            </div>
          )}

          <button
            onClick={() => setIsNewPermitModalOpen(true)}
            className="win-btn px-3 py-1 text-xs font-bold bg-blue-900 text-white hover:bg-blue-950 flex items-center gap-1.5 cursor-pointer shadow"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
            <span>+ Issue New PTW Form</span>
          </button>
        </div>
      </div>

      {/* 2. SOP 6 Form Types Quick Filter Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
        {Object.entries(PTW_SOP_FORMS).map(([typeKey, def]) => {
          const count = permits.filter((p) => p.type === typeKey).length;
          const isSelected = selectedTypeFilter === typeKey;
          return (
            <div
              key={typeKey}
              onClick={() => setSelectedTypeFilter(isSelected ? 'ALL' : (typeKey as PTWType))}
              className={`p-2 border rounded cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-blue-600 bg-white shadow-md border-blue-500'
                  : 'bg-slate-50 hover:bg-white border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${def.colorBg} ${def.colorText} border ${def.borderColor}`}>
                  {def.formNumber}
                </span>
                <span className="font-bold text-slate-800 text-[11px]">{count}</span>
              </div>
              <div className="font-sans font-bold text-[11px] text-slate-900 truncate" title={def.title}>
                {def.type.replace('_', ' ')}
              </div>
              <div className="text-[9px] text-slate-500 truncate">{def.category}</div>
            </div>
          );
        })}
      </div>

      {/* 3. Main Workspace: Permit List (Left) + 5-Stage Workflow & Gas Gate Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left Column: Filter & PTW Table List (5 Cols) */}
        <div className="lg:col-span-5 space-y-2">
          
          {/* Search & Status Filter */}
          <div className="flex gap-2 text-xs">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search permit ID, title, leader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 border border-slate-300 bg-white rounded text-xs"
              />
            </div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="border border-slate-300 bg-white px-2 py-1.5 rounded text-xs font-mono"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PREPARED">Prepared</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Permit List Cards */}
          <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredPermits.map((permit) => {
              const formDef = PTW_SOP_FORMS[permit.type];
              const isSelected = selectedPermitId === permit.id;
              const gasSafety = validatePTWGasSafety(permit.type, permit.gasReadings);

              return (
                <div
                  key={permit.id}
                  onClick={() => setSelectedPermitId(permit.id)}
                  className={`p-2.5 border-2 rounded cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-800 bg-blue-50/70 shadow-md'
                      : 'border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${formDef.colorBg} ${formDef.colorText} border ${formDef.borderColor}`}>
                        {permit.formNumber}
                      </span>
                      <span className="font-mono font-bold text-xs text-blue-950">{permit.id}</span>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      permit.status === 'ACTIVE'
                        ? 'bg-emerald-700 text-white'
                        : permit.status === 'APPROVED'
                        ? 'bg-blue-700 text-white'
                        : permit.status === 'PREPARED'
                        ? 'bg-amber-600 text-white'
                        : permit.status === 'DRAFT'
                        ? 'bg-slate-500 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      [{permit.status}]
                    </span>
                  </div>

                  <div className="font-bold text-xs text-slate-900 line-clamp-1 mb-1">{permit.title}</div>
                  
                  <div className="text-[10px] font-mono text-slate-600 flex justify-between items-center">
                    <span>Location: {permit.location}</span>
                    <span>Leader: <strong>{permit.workLeaderName}</strong></span>
                  </div>

                  {/* Gas Snapshot */}
                  <div className="mt-1.5 pt-1 border-t border-slate-200 text-[10px] font-mono flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      LEL: <strong className={permit.gasReadings.lelPercent > 0 ? 'text-rose-700 font-bold' : 'text-emerald-800'}>{permit.gasReadings.lelPercent}%</strong> | 
                      O2: <strong className={permit.gasReadings.o2Percent < 19.5 || permit.gasReadings.o2Percent > 23.5 ? 'text-rose-700 font-bold' : 'text-emerald-800'}>{permit.gasReadings.o2Percent}%</strong>
                    </span>
                    {!gasSafety.isSafe && (
                      <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-300 px-1 rounded font-bold animate-pulse">
                        ⚠️ Gas Hazard
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: 5-Stage Workflow Controller & Gas/Worker Gatekeeper (7 Cols) */}
        <div className="lg:col-span-7">
          {activePermit ? (
            <div className="win-panel p-3 border-2 border-slate-400 bg-white space-y-3">
              
              {/* Header: Permit Summary */}
              <div className="win-titlebar bg-blue-950 text-white p-2 px-3 flex justify-between items-center rounded-t">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${PTW_SOP_FORMS[activePermit.type].colorBg} ${PTW_SOP_FORMS[activePermit.type].colorText}`}>
                    {activePermit.formNumber} ({activePermit.type})
                  </span>
                  <span className="font-bold text-sm">{activePermit.id}</span>
                </div>
                <div className="text-xs font-mono font-bold bg-white text-blue-950 px-2 py-0.5 rounded">
                  STATUS: [{activePermit.status}]
                </div>
              </div>

              {/* 5-Stage Visual Workflow Pipeline */}
              <div className="bg-slate-100 p-2 border border-slate-300 rounded">
                <div className="text-[10px] font-bold text-slate-600 mb-1.5 uppercase font-mono">
                  SOP 5-Stage Approval & Life-Cycle Pipeline:
                </div>
                <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
                  {(['DRAFT', 'PREPARED', 'APPROVED', 'ACTIVE', 'CLOSED'] as PTWWorkflowStatus[]).map((stage, idx) => {
                    const isCurrent = activePermit.status === stage;
                    const stageIndex = ['DRAFT', 'PREPARED', 'APPROVED', 'ACTIVE', 'CLOSED'].indexOf(activePermit.status);
                    const isPassed = stageIndex > idx;

                    return (
                      <div
                        key={stage}
                        className={`p-1.5 border rounded font-bold ${
                          isCurrent
                            ? 'bg-blue-900 text-white border-blue-950 shadow ring-1 ring-blue-500'
                            : isPassed
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        <div>{idx + 1}. {stage}</div>
                        <div className="text-[8px] font-normal mt-0.5">
                          {isCurrent ? 'Current' : isPassed ? '✓ Complete' : 'Pending'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Work Details & Location */}
              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded space-y-1 text-xs">
                <div className="font-bold text-sm text-blue-950">{activePermit.title}</div>
                <div className="text-slate-700 font-mono text-[11px] flex justify-between">
                  <span>Location: <strong>{activePermit.location}</strong></span>
                  <span>Validity: {activePermit.validFrom} ~ {activePermit.validTo}</span>
                </div>
                <div className="text-slate-600 text-[11px] pt-1">
                  <strong>Hazard Scope:</strong> {activePermit.hazardDescription}
                </div>
              </div>

              {/* Safety Gate 1: Gas Safety Interactivity (LEL & O2 Verification) */}
              <div className={`p-3 border-2 rounded ${currentGasSafety.isSafe ? 'bg-emerald-50/50 border-emerald-400' : 'bg-red-50/80 border-red-500'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-slate-900">
                    <Activity className="w-4 h-4 text-cyan-700" />
                    <span>Authorized Gas Tester (AGT) Real-Time Verification Gate</span>
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${currentGasSafety.isSafe ? 'bg-emerald-800 text-white' : 'bg-red-700 text-white animate-pulse'}`}>
                    {currentGasSafety.isSafe ? '✓ ATMOSPHERE SAFE' : '⚠️ ATMOSPHERIC HAZARD BLOCKED'}
                  </span>
                </div>

                {!currentGasSafety.isSafe && (
                  <div className="mb-2 p-2 bg-red-100 border border-red-400 rounded text-red-950 text-xs font-bold">
                    {currentGasSafety.blockReason}
                  </div>
                )}

                {/* Gas Sliders / Number Controls for simulation */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  {/* LEL Control */}
                  <div className="bg-white p-2 border border-slate-300 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800">LEL (Hydrocarbon Gas):</span>
                      <span className={`font-black text-sm ${activePermit.gasReadings.lelPercent > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {activePermit.gasReadings.lelPercent.toFixed(1)}% LEL
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="0.5"
                      value={activePermit.gasReadings.lelPercent}
                      onChange={(e) => handleUpdateGasReadings(activePermit.id, parseFloat(e.target.value), activePermit.gasReadings.o2Percent)}
                      className="w-full cursor-pointer accent-blue-900"
                    />
                    <div className="text-[9px] text-slate-500 mt-1">
                      {activePermit.type === 'HOT_WORK' ? '⚠️ Hot Work Mandate: LEL MUST BE 0.0%' : 'Max Allowed: 5% LEL'}
                    </div>
                  </div>

                  {/* O2 Control */}
                  <div className="bg-white p-2 border border-slate-300 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800">Oxygen (O2):</span>
                      <span className={`font-black text-sm ${activePermit.gasReadings.o2Percent < 19.5 || activePermit.gasReadings.o2Percent > 23.5 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {activePermit.gasReadings.o2Percent.toFixed(1)}% O2
                      </span>
                    </div>
                    <input
                      type="range"
                      min="16.0"
                      max="24.5"
                      step="0.1"
                      value={activePermit.gasReadings.o2Percent}
                      onChange={(e) => handleUpdateGasReadings(activePermit.id, activePermit.gasReadings.lelPercent, parseFloat(e.target.value))}
                      className="w-full cursor-pointer accent-blue-900"
                    />
                    <div className="text-[9px] text-slate-500 mt-1">
                      Safe Band: 19.5% ~ 23.5% (Asphyxiation & O2 Enrichment Prevention)
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Gate 2: Worker Competency & MCU Gatekeeper */}
              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded space-y-2 text-xs">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-900" />
                    <span>Worker & Work Leader Competency Gatekeeper</span>
                  </span>
                  <span className="text-[10px] text-blue-900 font-mono underline cursor-pointer" onClick={() => onNavigateToMatrix && onNavigateToMatrix(activePermit.workLeaderId)}>
                    View in Training Matrix ➔
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  {/* Work Leader Verification */}
                  {(() => {
                    const leader = personnelList.find((s) => s.id === activePermit.workLeaderId);
                    const leaderStatus = leader ? validatePTWWorkerEligibility(leader, activePermit.type) : null;
                    return (
                      <div className="bg-white p-2 border border-slate-300 rounded">
                        <div className="text-[10px] text-slate-500 font-bold">WORK LEADER:</div>
                        <div className="font-bold text-slate-900">{activePermit.workLeaderName} ({activePermit.workLeaderId})</div>
                        <div className="mt-1 flex items-center gap-1 text-[10px]">
                          {leaderStatus?.isEligible ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> MCU Valid & PTW Certified
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> {leaderStatus?.reason}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Assigned Workers Verification */}
                  {(() => {
                    const workers = personnelList.filter((s) => activePermit.assignedWorkerIds.includes(s.id));
                    const allWorkersValid = workers.every((w) => validatePTWWorkerEligibility(w, activePermit.type).isEligible);

                    return (
                      <div className="bg-white p-2 border border-slate-300 rounded">
                        <div className="text-[10px] text-slate-500 font-bold">ASSIGNED WORKERS ({activePermit.assignedWorkerNames.length}):</div>
                        <div className="font-bold text-slate-900">{activePermit.assignedWorkerNames.join(', ')}</div>
                        <div className="mt-1 flex items-center gap-1 text-[10px]">
                          {allWorkersValid ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> All Workers Medically Cleared
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Worker Certification Attention Required
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Safety Checklist Chips */}
              <div className="p-2 border border-slate-300 bg-slate-50 rounded text-[11px]">
                <div className="font-bold text-slate-800 mb-1.5 font-mono">Mandatory Safety Controls Verification:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[10px]">
                  <div className={`p-1 rounded border flex items-center gap-1 ${activePermit.safetyChecklist.fireWatchAssigned ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                    <CheckSquare className="w-3 h-3" /> Fire Watch Designated
                  </div>
                  <div className={`p-1 rounded border flex items-center gap-1 ${activePermit.safetyChecklist.gasDetectorContinuous ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                    <CheckSquare className="w-3 h-3" /> Continuous Gas Monitor
                  </div>
                  <div className={`p-1 rounded border flex items-center gap-1 ${activePermit.safetyChecklist.lotoApplied ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                    <CheckSquare className="w-3 h-3" /> LOTO Padlocks Applied
                  </div>
                  <div className={`p-1 rounded border flex items-center gap-1 ${activePermit.safetyChecklist.forcedVentilation ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                    <CheckSquare className="w-3 h-3" /> Forced Ventilation Active
                  </div>
                  <div className={`p-1 rounded border flex items-center gap-1 ${activePermit.safetyChecklist.ppeVerified ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                    <CheckSquare className="w-3 h-3" /> Cryo / Special PPE
                  </div>
                  <div className={`p-1 rounded border flex items-center gap-1 ${activePermit.safetyChecklist.barricadeSet ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                    <CheckSquare className="w-3 h-3" /> Area Barricade Set
                  </div>
                </div>
              </div>

              {/* Action Buttons: 5-Stage State Transition Controller */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-300 flex-wrap gap-2">
                <div className="text-[11px] font-mono text-slate-500">
                  PTW ID: <strong>{activePermit.id}</strong> | Form: <strong>{activePermit.formNumber}</strong>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {/* Step 1: Draft -> Prepared */}
                  {activePermit.status === 'DRAFT' && (
                    <button
                      onClick={() => handleTransitionStatus(activePermit.id, 'PREPARED')}
                      className="win-btn px-4 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                    >
                      <span>1. Prepare & Submit to HSE ➔</span>
                    </button>
                  )}

                  {/* Step 2: Prepared -> Approved */}
                  {activePermit.status === 'PREPARED' && (
                    <button
                      onClick={() => handleTransitionStatus(activePermit.id, 'APPROVED')}
                      className="win-btn px-4 py-1 text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>2. Site Manager / HSE Approve ➔</span>
                    </button>
                  )}

                  {/* Step 3: Approved -> Active (Strict Hot Work LEL 0% & Confined O2 check) */}
                  {activePermit.status === 'APPROVED' && (
                    <button
                      disabled={!currentGasSafety.isSafe || ((activePermit.type === 'HOT_WORK' || activePermit.type === 'CONFINED_SPACE') && !isERTMet)}
                      onClick={() => handleTransitionStatus(activePermit.id, 'ACTIVE')}
                      className={`win-btn px-4 py-1 text-xs font-bold flex items-center gap-1.5 ${
                        !currentGasSafety.isSafe || ((activePermit.type === 'HOT_WORK' || activePermit.type === 'CONFINED_SPACE') && !isERTMet)
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed border-slate-400'
                          : 'bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer shadow'
                      }`}
                      title={!currentGasSafety.isSafe ? currentGasSafety.blockReason || 'Gas reading unsafe' : 'Issue permit and begin work'}
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-300" />
                      <span>3. Issue & Authorize Active Work ➔</span>
                    </button>
                  )}

                  {/* Step 4: Active -> Closed */}
                  {activePermit.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleTransitionStatus(activePermit.id, 'CLOSED')}
                      className="win-btn px-4 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"
                    >
                      <span>4. Close & Surrender Permit (Work Completed)</span>
                    </button>
                  )}

                  {activePermit.status === 'CLOSED' && (
                    <span className="px-3 py-1 bg-slate-200 text-slate-600 font-mono text-xs font-bold rounded border border-slate-300">
                      ✓ PERMIT CLOSED & ARCHIVED
                    </span>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 font-mono">No permit selected.</div>
          )}
        </div>

      </div>

      {/* 4. Modal: Issue New PTW Form (NP07-10 ~ NP07-15) */}
      {isNewPermitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="win-panel max-w-xl w-full bg-white shadow-2xl border-2 border-blue-950 text-slate-900 rounded-xl overflow-hidden font-sans">
            <div className="bg-blue-950 text-white px-5 py-3.5 flex justify-between items-center border-b border-blue-800">
              <span className="font-bold text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                <span>신규 작업허가서 발행 (Issue New PTW Form)</span>
              </span>
              <button
                onClick={() => setIsNewPermitModalOpen(false)}
                className="text-white font-bold p-1 px-2.5 bg-slate-800 hover:bg-slate-700 rounded text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-3.5 text-xs sm:text-sm">
              {/* 1. PTW Form Type Selection */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">1. 작업허가서 분류 (SOP PTW Form Type):</label>
                <select
                  value={newPermitType}
                  onChange={(e) => setNewPermitType(e.target.value as PTWType)}
                  className="w-full h-9 px-3 border border-slate-300 rounded font-medium bg-white cursor-pointer"
                >
                  {Object.entries(PTW_SOP_FORMS).map(([k, def]) => (
                    <option key={k} value={k}>
                      {def.formNumber}: {def.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Work Title */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">2. 작업 명칭 (Work Description / Title):</label>
                <input
                  type="text"
                  placeholder="e.g. Laydown-2 Flare Header Pipe Tie-in Welding"
                  value={newPermitTitle}
                  onChange={(e) => setNewPermitTitle(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-300 rounded font-medium bg-white"
                />
              </div>

              {/* 3. Location */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">3. 작업 구역 (Plant Location / Area):</label>
                <select
                  value={newPermitLocation}
                  onChange={(e) => setNewPermitLocation(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-300 rounded font-medium bg-white cursor-pointer"
                >
                  <option value="Vaporization Skid #1 (PRSS Area)">Vaporization Skid #1 (PRSS Area)</option>
                  <option value="Loading Bay 01 & 02">Loading Bay 01 & 02</option>
                  <option value="Laydown Area 2 & Flare Header">Laydown Area 2 & Flare Header</option>
                  <option value="ORU Sump Pit Area">ORU Sump Pit Area</option>
                  <option value="Main Substation MCC-01">Main Substation MCC-01</option>
                  <option value="Marine Jetty LNG Transfer Header">Marine Jetty LNG Transfer Header</option>
                </select>
              </div>

              {/* 4. Work Leader Assignment (Gatekeeper Checked) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">4. 작업 책임자 (Work Leader):</label>
                  <select
                    value={newWorkLeaderId}
                    onChange={(e) => setNewWorkLeaderId(e.target.value)}
                    className="w-full h-9 px-2 border border-slate-300 rounded font-medium bg-white cursor-pointer"
                  >
                    {personnelList.map((m) => {
                      const check = validatePTWWorkerEligibility(m, newPermitType);
                      return (
                        <option key={m.id} value={m.id} disabled={!check.isEligible}>
                          {m.name} ({m.role}) {!check.isEligible ? `[⚠️ ${check.reason}]` : '✓ Valid'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">5. 배정 작업원 (Worker):</label>
                  <select
                    value={newWorkerId}
                    onChange={(e) => setNewWorkerId(e.target.value)}
                    className="w-full h-9 px-2 border border-slate-300 rounded font-medium bg-white cursor-pointer"
                  >
                    {personnelList.map((m) => {
                      const check = validatePTWWorkerEligibility(m, newPermitType);
                      return (
                        <option key={m.id} value={m.id} disabled={!check.isEligible}>
                          {m.name} ({m.role}) {!check.isEligible ? `[⚠️ Disqualified]` : '✓ Valid'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* 5. Gas Reading Initial Verification */}
              <div className="bg-slate-50 p-3 rounded border border-slate-300 space-y-2">
                <div className="font-bold text-slate-800 text-xs">Initial Gas Test Reading:</div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <label>LEL (%):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newGasLel}
                      onChange={(e) => setNewGasLel(parseFloat(e.target.value) || 0)}
                      className="w-full h-8 px-2 border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label>O2 (%):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newGasO2}
                      onChange={(e) => setNewGasO2(parseFloat(e.target.value) || 20.9)}
                      className="w-full h-8 px-2 border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  onClick={() => setIsNewPermitModalOpen(false)}
                  className="win-btn px-4 py-1.5 text-xs font-semibold cursor-pointer hover:bg-slate-200 rounded"
                >
                  취소 (Cancel)
                </button>
                <button
                  onClick={handleCreatePermit}
                  className="win-btn px-5 py-1.5 text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white rounded cursor-pointer"
                >
                  발행 및 등록 (Submit Draft)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
