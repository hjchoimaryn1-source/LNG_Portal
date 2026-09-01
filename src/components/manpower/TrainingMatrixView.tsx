// src/components/manpower/TrainingMatrixView.tsx
"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Search,
  Filter,
  FileCheck,
  FileX,
  ExternalLink,
  Info,
  Calendar,
  UploadCloud,
  Check,
  FileClock,
  Layers,
  BookOpen,
  SlidersHorizontal,
  FileText,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import {
  StaffPersonnel,
  CompetencyCertification,
  CompetencyStatus,
} from '../../types/lng';
import {
  STANDARD_COMPETENCY_COURSES,
  CompetencyCourseDef,
  getStaffCompetencyStatus,
  POSITION_STANDARD_REQUIREMENTS,
  PositionStandardRequirement,
  getPositionMandatoryCourses,
  evaluateStaffJobQualification,
} from '../../data/manpowerMasterData';
import { exportToCSV } from '../../utils/exportCsv';

interface TrainingMatrixViewProps {
  personnelList: StaffPersonnel[];
  highlightedEmpId?: string | null;
  onUpdatePersonnelCertification?: (
    empId: string,
    certCode: string,
    updatedCert: CompetencyCertification
  ) => void;
}

export default function TrainingMatrixView({
  personnelList,
  highlightedEmpId,
  onUpdatePersonnelCertification,
}: TrainingMatrixViewProps) {
  // View Mode: Personnel Status vs Job Standard Requirements
  const [viewMode, setViewMode] = useState<'PERSONNEL_STATUS' | 'JOB_STANDARD'>('PERSONNEL_STATUS');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCertDetail, setSelectedCertDetail] = useState<{
    staff: StaffPersonnel;
    cert: CompetencyCertification;
  } | null>(null);

  // Renewal Form state
  const [evidenceFileName, setEvidenceFileName] = useState<string>('');
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(highlightedEmpId || null);

  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  // Trigger Highlight animation and scrollIntoView when highlightedEmpId changes
  useEffect(() => {
    if (highlightedEmpId) {
      setActiveHighlightId(highlightedEmpId);
      const rowElem = rowRefs.current[highlightedEmpId];
      if (rowElem) {
        rowElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const timer = setTimeout(() => {
        setActiveHighlightId(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [highlightedEmpId]);

  // Overall Statistics
  const stats = useMemo(() => {
    let totalCerts = 0;
    let validCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;
    let pendingCount = 0;
    let fullyQualifiedCount = 0;

    personnelList.forEach((staff) => {
      const evalRes = evaluateStaffJobQualification(staff);
      if (evalRes.isQualified) fullyQualifiedCount++;

      (staff.competencies || []).forEach((c) => {
        totalCerts++;
        if (c.status === 'VALID') validCount++;
        else if (c.status === 'EXPIRING_SOON' || c.status === 'DUE_SOON') expiringCount++;
        else if (c.status === 'EXPIRED') expiredCount++;
        else if (c.status === 'PENDING_APPROVAL') pendingCount++;
      });
    });

    const complianceRate = totalCerts > 0 ? ((validCount / totalCerts) * 100).toFixed(1) : '100.0';
    const qualificationRate = personnelList.length > 0 ? ((fullyQualifiedCount / personnelList.length) * 100).toFixed(1) : '100.0';

    return {
      totalCerts,
      validCount,
      expiringCount,
      expiredCount,
      pendingCount,
      complianceRate,
      fullyQualifiedCount,
      qualificationRate,
    };
  }, [personnelList]);

  // Filtered personnel list
  const filteredPersonnel = useMemo(() => {
    return personnelList.filter((staff) => {
      const matchSearch =
        searchQuery === '' ||
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.id.toLowerCase().includes(searchQuery.toLowerCase());

      const certs = staff.competencies || [];
      const evalRes = evaluateStaffJobQualification(staff);

      const matchStatus =
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'NOT_QUALIFIED' && !evalRes.isQualified) ||
        (selectedStatusFilter === 'EXPIRED' && certs.some((c) => c.status === 'EXPIRED')) ||
        (selectedStatusFilter === 'EXPIRING_SOON' && certs.some((c) => c.status === 'EXPIRING_SOON' || c.status === 'DUE_SOON')) ||
        (selectedStatusFilter === 'PENDING_APPROVAL' && certs.some((c) => c.status === 'PENDING_APPROVAL')) ||
        (selectedStatusFilter === 'VALID' && evalRes.isQualified);

      return matchSearch && matchStatus;
    });
  }, [personnelList, searchQuery, selectedStatusFilter]);

  const handleExportMatrixCSV = () => {
    const rows: Record<string, any>[] = [];
    personnelList.forEach((staff) => {
      const evalRes = evaluateStaffJobQualification(staff);
      (staff.competencies || []).forEach((c) => {
        rows.push({
          Emp_ID: staff.id,
          Name: staff.name,
          Role: staff.role,
          Team: staff.teamName,
          Department: staff.department,
          Status: staff.currentStatus,
          Job_Qualified: evalRes.isQualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
          Qualification_Reason: evalRes.reason,
          Course_Code: c.code,
          Certification_Name: c.name,
          Category: c.category,
          Cert_Number: c.certNumber,
          Issuing_Body: c.issuingBody,
          Issue_Date: c.issueDate,
          Expiry_Date: c.expiryDate,
          Competency_Status: c.status,
          Evidence_File: c.evidenceFileName || 'N/A',
        });
      });
    });
    exportToCSV(`NIAS_Training_Competency_Matrix_September_2026.csv`, rows);
  };

  // Workflow Handlers
  const handleSubmitForApproval = () => {
    if (!selectedCertDetail || !onUpdatePersonnelCertification) return;
    const file = evidenceFileName.trim() || `Renewal_Evidence_${selectedCertDetail.cert.code}_${selectedCertDetail.staff.id}.pdf`;
    const updated: CompetencyCertification = {
      ...selectedCertDetail.cert,
      status: 'PENDING_APPROVAL',
      evidenceFileName: file,
      submittedDate: '2026-09-01',
    };
    onUpdatePersonnelCertification(selectedCertDetail.staff.id, selectedCertDetail.cert.code, updated);
    setSelectedCertDetail(null);
    setEvidenceFileName('');
  };

  const handleApprovePlusOneYear = () => {
    if (!selectedCertDetail || !onUpdatePersonnelCertification) return;
    const currentExp = new Date(selectedCertDetail.cert.expiryDate);
    const newYear = isNaN(currentExp.getFullYear()) ? 2027 : currentExp.getFullYear() + 1;
    const month = String(isNaN(currentExp.getMonth()) ? 9 : currentExp.getMonth() + 1).padStart(2, '0');
    const day = String(isNaN(currentExp.getDate()) ? 1 : currentExp.getDate()).padStart(2, '0');
    const newExpiryDate = `${newYear}-${month}-${day}`;

    const updated: CompetencyCertification = {
      ...selectedCertDetail.cert,
      status: 'VALID',
      expiryDate: newExpiryDate,
      issueDate: '2026-09-01',
      submittedDate: undefined,
      evidenceFileName: undefined,
    };
    onUpdatePersonnelCertification(selectedCertDetail.staff.id, selectedCertDetail.cert.code, updated);
    setSelectedCertDetail(null);
    setEvidenceFileName('');
  };

  return (
    <div className="space-y-2 p-1 font-sans text-xs">
      {/* ========================================================================= */}
      {/* 1. Top Matrix KPI Summary Strip                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5 shrink-0">
        {/* Card 1: Statutory Job Qualification Rate */}
        <div className="win-panel p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-700 font-bold text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-800" />
              Job Qualification Rate
            </span>
            <span className="win-sunken px-1 text-[9px] bg-emerald-100 text-emerald-950 font-mono font-bold">
              19 DIRECT
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-emerald-950">{stats.qualificationRate}%</span>
            <span className="text-xs font-mono text-slate-600">({stats.fullyQualifiedCount}/{personnelList.length} Qualified)</span>
          </div>
        </div>

        {/* Card 2: Total Active Certifications */}
        <div className="win-panel p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-700 font-bold text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-blue-900" />
              Active Registry
            </span>
            <span className="win-sunken px-1 text-[9px] bg-blue-100 text-blue-950 font-mono font-bold">
              6 COURSES
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-blue-950">{stats.totalCerts}</span>
            <span className="text-xs font-mono text-slate-600">Total Valid {stats.validCount}</span>
          </div>
        </div>

        {/* Card 3: Approval Queue */}
        <div className="win-panel p-2 flex flex-col justify-between bg-blue-50/40">
          <div className="flex items-center justify-between text-blue-900 font-bold text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <FileClock className="w-3.5 h-3.5 text-blue-800" />
              Approval Queue
            </span>
            <span className="win-sunken px-1 text-[9px] bg-blue-200 text-blue-950 font-mono font-bold">
              WORKFLOW
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-blue-900">{stats.pendingCount}</span>
            <span className="text-xs font-mono text-slate-600">Pending Review</span>
          </div>
        </div>

        {/* Card 4: Expiring Soon (30 Days) */}
        <div className="win-panel p-2 flex flex-col justify-between bg-amber-50/40">
          <div className="flex items-center justify-between text-amber-900 font-bold text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-800" />
              Expiring Soon (30d)
            </span>
            <span className="win-sunken px-1 text-[9px] bg-amber-200 text-amber-950 font-mono font-bold">
              REFRESH
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-amber-900">{stats.expiringCount}</span>
            <span className="text-xs font-mono text-slate-600">Certificates Due</span>
          </div>
        </div>

        {/* Card 5: Non-Compliant / Action Required */}
        <div className="win-panel p-2 flex flex-col justify-between bg-red-50/50">
          <div className="flex items-center justify-between text-red-900 font-bold text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-red-700" />
              Action Required
            </span>
            <span className="win-sunken px-1 text-[9px] bg-red-600 text-white font-mono font-bold">
              AUDIT FLAG
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-red-700">{stats.expiredCount}</span>
            <span className="text-xs font-mono text-slate-600">Expired Mandates</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Control Bar (View Mode Toggle, Filters, Legend, Search, Export)        */}
      {/* ========================================================================= */}
      <div className="bg-[#e4e0d8] border border-slate-300 px-2 py-1.5 flex items-center justify-between gap-2 flex-wrap text-xs">
        
        {/* Left: View Mode Toggle & Status Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mode Toggle Button Group */}
          <div className="flex items-center border border-slate-400 rounded overflow-hidden shadow-xs bg-slate-200 p-0.5">
            <button
              onClick={() => setViewMode('PERSONNEL_STATUS')}
              className={`px-3 py-1 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'PERSONNEL_STATUS'
                  ? 'bg-blue-900 text-white shadow'
                  : 'text-slate-700 hover:bg-slate-300'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Personnel Status View</span>
            </button>
            <button
              onClick={() => setViewMode('JOB_STANDARD')}
              className={`px-3 py-1 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'JOB_STANDARD'
                  ? 'bg-blue-900 text-white shadow'
                  : 'text-slate-700 hover:bg-slate-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>Job Standard Requirements View</span>
            </button>
          </div>

          {viewMode === 'PERSONNEL_STATUS' && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-700">Filter:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="win-panel bg-white border border-slate-300 text-[11px] px-1.5 py-0.5 cursor-pointer font-bold"
              >
                <option value="ALL">All Personnel ({personnelList.length})</option>
                <option value="NOT_QUALIFIED">❌ Not Qualified (Missing/Expired Mandate)</option>
                <option value="EXPIRED">Expired Certifications ({stats.expiredCount})</option>
                <option value="PENDING_APPROVAL">Pending Approval ({stats.pendingCount})</option>
                <option value="EXPIRING_SOON">Expiring Soon ({stats.expiringCount})</option>
                <option value="VALID">✓ Fully Qualified ({stats.fullyQualifiedCount})</option>
              </select>
            </div>
          )}

          {/* Legend */}
          <div className="hidden xl:flex items-center gap-2 text-[10px] font-mono">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-sm inline-block" />
              <span>Valid</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-sm inline-block" />
              <span>Pending</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm inline-block" />
              <span>Expiring (30d)</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-sm inline-block" />
              <span>Expired</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="px-1 bg-blue-900 text-white text-[8px] font-bold rounded-xs">M</span>
              <span>Mandatory Requirement</span>
            </span>
          </div>
        </div>

        {/* Right: Search & Export */}
        <div className="flex items-center gap-2">
          {viewMode === 'PERSONNEL_STATUS' && (
            <div className="flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-slate-600" />
              <input
                type="text"
                placeholder="Search name / position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="win-panel bg-white border border-slate-300 px-2 py-0.5 text-xs w-44 outline-none font-mono"
              />
            </div>
          )}

          <button
            onClick={handleExportMatrixCSV}
            className="win-btn text-[11px] px-2.5 py-1 flex items-center gap-1 cursor-pointer font-bold"
            title="Export Training & Competency Matrix to CSV"
          >
            <Download className="w-3 h-3" />
            <span>Export Matrix</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3-A: MODE 1 - Personnel Status Grid View                                  */}
      {/* ========================================================================= */}
      {viewMode === 'PERSONNEL_STATUS' && (
        <div className="overflow-x-auto min-w-full win-panel p-1 bg-white">
          <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
            <thead>
              <tr className="bg-slate-200 border-b border-slate-400 text-[10px]">
                <th className="p-1.5 border-r border-slate-300 w-18 text-center">Emp ID</th>
                <th className="p-1.5 border-r border-slate-300 w-36 text-center">Personnel Name</th>
                <th className="p-1.5 border-r border-slate-300 w-44 text-center">Position / Role</th>
                <th className="p-1.5 border-r border-slate-300 w-24 text-center">Team</th>
                <th className="p-1.5 border-r border-slate-300 text-center w-16">Duty</th>
                {/* 6 Standard Course Columns */}
                {STANDARD_COMPETENCY_COURSES.map((course) => (
                  <th
                    key={course.code}
                    className="p-1 border-r border-slate-300 text-center min-w-[105px] max-w-[130px]"
                    title={`${course.code}: ${course.name} (${course.issuingBody})`}
                  >
                    <div className="font-bold text-blue-950 text-[10px]">{course.shortName}</div>
                    <div className="text-[9px] text-slate-500 font-normal truncate">{course.code}</div>
                  </th>
                ))}
                <th className="p-1.5 text-center min-w-[130px]">Statutory Qualification</th>
              </tr>
            </thead>
            <tbody>
              {filteredPersonnel.map((staff, idx) => {
                const compStatus = getStaffCompetencyStatus(staff);
                const isOffDuty = staff.currentStatus === 'OFF_DUTY';
                const certsMap = new Map((staff.competencies || []).map((c) => [c.code, c]));
                const isHighlighted = activeHighlightId === staff.id;
                
                // Job-Specific Mandatory Evaluation
                const jobEval = evaluateStaffJobQualification(staff);
                const { mandatoryCourseCodes } = getPositionMandatoryCourses(staff);

                return (
                  <tr
                    key={staff.id}
                    ref={(el) => {
                      rowRefs.current[staff.id] = el;
                    }}
                    className={`transition-all duration-300 ${
                      isHighlighted
                        ? 'bg-amber-100 border-2 border-amber-500 shadow-md font-bold'
                        : !jobEval.isQualified
                        ? 'bg-rose-50/40 hover:bg-rose-100/60'
                        : idx % 2 === 0
                        ? 'bg-white hover:bg-sky-50/80'
                        : 'bg-slate-50 hover:bg-sky-50/80'
                    }`}
                  >
                    <td className="p-1.5 font-bold text-blue-950 border-r border-slate-300 text-center">
                      {staff.id}
                    </td>
                    <td className="p-1.5 font-bold text-slate-900 border-r border-slate-300 whitespace-nowrap">
                      <div className="flex items-center justify-between gap-1">
                        <span>{staff.name}</span>
                        {!jobEval.isQualified && (
                          <span className="bg-rose-600 text-white font-bold text-[8px] px-1 rounded animate-pulse" title={jobEval.reason}>
                            ! MANDATE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-1.5 text-slate-800 border-r border-slate-300 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{staff.role}</div>
                      <div className="text-[9px] text-slate-500 font-mono">Req: {mandatoryCourseCodes.length} Mandates</div>
                    </td>
                    <td className="p-1.5 border-r border-slate-300 whitespace-nowrap font-semibold text-slate-700 text-center">
                      {staff.teamName}
                    </td>
                    <td className="p-1.5 text-center border-r border-slate-300">
                      {isOffDuty ? (
                        <span className="bg-amber-100 text-amber-900 px-1 py-0.2 font-bold text-[9px]">3:1 AL</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-950 px-1 py-0.2 font-bold text-[9px]">ON-SITE</span>
                      )}
                    </td>

                    {/* Render the 6 Competency Course Cells */}
                    {STANDARD_COMPETENCY_COURSES.map((course) => {
                      const cert = certsMap.get(course.code);
                      const isMandatory = mandatoryCourseCodes.includes(course.code);

                      if (!cert) {
                        return (
                          <td
                            key={course.code}
                            className={`p-1 text-center border-r border-slate-200 text-[10px] ${
                              isMandatory
                                ? 'bg-rose-100/70 border-2 border-rose-400 text-rose-900 font-bold ring-1 ring-rose-400'
                                : 'text-slate-400'
                            }`}
                            title={isMandatory ? `MISSING MANDATORY REQUIREMENT: ${course.name}` : 'Optional / Not Applicable'}
                          >
                            {isMandatory ? (
                              <div className="flex flex-col items-center">
                                <span className="bg-rose-700 text-white text-[8px] font-bold px-1 rounded">MISSING [M]</span>
                                <span className="text-[8px] text-rose-800 mt-0.5">Required</span>
                              </div>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                        );
                      }

                      const isExpired = cert.status === 'EXPIRED';
                      const isExpiring = cert.status === 'EXPIRING_SOON' || cert.status === 'DUE_SOON';
                      const isPending = cert.status === 'PENDING_APPROVAL';

                      return (
                        <td
                          key={course.code}
                          onClick={() => {
                            setSelectedCertDetail({ staff, cert });
                            setEvidenceFileName(cert.evidenceFileName || '');
                          }}
                          className={`p-1 text-center border-r border-slate-200 cursor-pointer transition-colors ${
                            isMandatory && isExpired
                              ? 'bg-rose-200 border-2 border-rose-500 ring-2 ring-rose-500 font-bold'
                              : isExpired
                              ? 'bg-red-100 hover:bg-red-200'
                              : isPending
                              ? 'bg-blue-100 hover:bg-blue-200'
                              : isExpiring
                              ? 'bg-amber-100 hover:bg-amber-200'
                              : 'bg-emerald-50/60 hover:bg-emerald-100'
                          }`}
                          title={`Click for Renewal: ${cert.name} | Exp: ${cert.expiryDate} ${isMandatory ? '(MANDATORY REQUIREMENT)' : ''}`}
                        >
                          <div className="flex flex-col items-center justify-center leading-tight">
                            <div className="flex items-center gap-1">
                              {isExpired ? (
                                <span className="px-1 bg-red-600 text-white font-bold text-[9px] rounded">
                                  EXPIRED
                                </span>
                              ) : isPending ? (
                                <span className="px-1 bg-blue-700 text-white font-bold text-[9px] rounded">
                                  PENDING
                                </span>
                              ) : isExpiring ? (
                                <span className="px-1 bg-amber-500 text-black font-bold text-[9px] rounded">
                                  EXP {cert.expiryDate.slice(5)}
                                </span>
                              ) : (
                                <span className="px-1 bg-emerald-700 text-white font-bold text-[9px] rounded">
                                  VALID
                                </span>
                              )}
                              {isMandatory && (
                                <span className="px-1 bg-blue-900 text-white text-[8px] font-black rounded-xs" title="Position Mandatory Requirement">
                                  M
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] text-slate-500 font-mono mt-0.5">{cert.expiryDate}</span>
                          </div>
                        </td>
                      );
                    })}

                    {/* Overall Statutory Qualification Column */}
                    <td className="p-1.5 text-center">
                      {!jobEval.isQualified ? (
                        <div
                          className="bg-rose-100 text-rose-950 px-2 py-1 font-bold border border-rose-400 rounded flex flex-col items-center justify-center shadow-xs"
                          title={jobEval.reason}
                        >
                          <span className="flex items-center gap-1 text-[10px] text-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            ❌ Not Qualified
                          </span>
                          <span className="text-[8px] text-rose-700 font-normal truncate max-w-[120px]">
                            {jobEval.reason.replace('Missing Mandatory Requirement', 'Missing')}
                          </span>
                        </div>
                      ) : compStatus.hasPendingApproval ? (
                        <span className="bg-blue-100 text-blue-900 px-1.5 py-0.5 font-bold border border-blue-300 rounded flex items-center justify-center gap-1">
                          <FileClock className="w-3 h-3 text-blue-700" />
                          In Review
                        </span>
                      ) : compStatus.hasExpiringSoon ? (
                        <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 font-bold border border-amber-300 rounded flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700" />
                          Due Soon
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-950 px-1.5 py-0.5 font-bold border border-emerald-300 rounded flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          ✓ Qualified (Passed)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3-B: MODE 2 - Job Standard Requirements View                              */}
      {/* ========================================================================= */}
      {viewMode === 'JOB_STANDARD' && (
        <div className="space-y-3">
          
          {/* Statutory Policy Overview Card */}
          <div className="bg-[#eef2f6] border border-blue-300 p-3 rounded text-xs text-blue-950 flex items-start gap-2.5">
            <BookOpen className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm text-blue-950">
                Indonesian Oil & Gas Statutory Competency Standard (SKK Migas PTK-007 / Ditjen Migas / Kemenaker RI)
              </div>
              <div className="text-slate-700 leading-relaxed text-[11px]">
                NIAS LNG Terminal 운영 요원의 직무별 법정 필수 자격(Mandatory Minimum Requirements) 매트릭스입니다.
                각 직책별 법령 필수 자격을 보유하지 않거나 유효기간이 만료된 작업자는 <strong>현장 단독 작업 및 PTW 승인이 법적으로 금지</strong>되며, 즉시 자격 갱신 프로세스를 이행해야 합니다.
              </div>
            </div>
          </div>

          {/* Job Standard Matrix Table */}
          <div className="overflow-x-auto min-w-full win-panel p-1 bg-white">
            <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
              <thead>
                <tr className="bg-blue-950 text-white text-[10px]">
                  <th className="p-2 border-r border-blue-800 w-44">직급 / 직책 (Job Position)</th>
                  <th className="p-2 border-r border-blue-800 w-28">소속 부서 (Dept)</th>
                  <th className="p-2 border-r border-blue-800 w-52">법적 근거 (Statutory Mandate)</th>
                  {STANDARD_COMPETENCY_COURSES.map((c) => (
                    <th key={c.code} className="p-2 border-r border-blue-800 text-center min-w-[105px]">
                      <div className="font-bold">{c.shortName}</div>
                      <div className="text-[9px] text-blue-200 font-normal">{c.code}</div>
                    </th>
                  ))}
                  <th className="p-2 min-w-[180px]">직무 수행 필수 요건 및 ERT 보직</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(POSITION_STANDARD_REQUIREMENTS).map((req, idx) => (
                  <tr
                    key={req.positionKey}
                    className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 hover:bg-slate-100'}
                  >
                    <td className="p-2 border-r border-slate-300 font-bold text-blue-950 text-xs">
                      {req.positionTitle}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-slate-700 font-semibold">
                      {req.department}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-slate-800 text-[10px]">
                      <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                        {req.legalBasis}
                      </span>
                    </td>

                    {/* Course Columns */}
                    {STANDARD_COMPETENCY_COURSES.map((course) => {
                      const isMandatory = req.mandatoryCourseCodes.includes(course.code);
                      return (
                        <td
                          key={course.code}
                          className={`p-2 border-r border-slate-300 text-center text-xs ${
                            isMandatory ? 'bg-blue-50/80 font-bold' : 'text-slate-400'
                          }`}
                        >
                          {isMandatory ? (
                            <div className="flex flex-col items-center justify-center">
                              <span className="bg-blue-900 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow-xs">
                                [M] MANDATORY
                              </span>
                              <span className="text-[8px] text-slate-500 mt-0.5">{course.validityYears}y Validity</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal">-</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="p-2 text-slate-700 text-[10px] leading-snug">
                      {req.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. Certification Detail & Renewal Workflow Modal                          */}
      {/* ========================================================================= */}
      {selectedCertDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="win-panel max-w-lg w-full bg-white shadow-2xl border-2 border-blue-950 text-slate-900 font-sans rounded-lg overflow-hidden">
            <div className="bg-blue-950 text-white p-2.5 px-3 flex justify-between items-center">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-300" />
                Certification Lifecycle & Renewal Workflow
              </span>
              <button
                onClick={() => setSelectedCertDetail(null)}
                className="text-white font-bold px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-xs rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs font-mono">
              {/* Personnel & Cert Summary */}
              <div className="bg-slate-100 p-2.5 border border-slate-300 rounded space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-blue-950">{selectedCertDetail.staff.name}</span>
                  <span className="bg-blue-900 text-white px-2 py-0.5 text-[10px] font-bold rounded">
                    {selectedCertDetail.staff.id}
                  </span>
                </div>
                <div className="text-slate-700 flex justify-between">
                  <span>Role: <strong>{selectedCertDetail.staff.role}</strong></span>
                  <span>Team: <strong>{selectedCertDetail.staff.teamName}</strong></span>
                </div>
              </div>

              {/* Course & Expiry Status */}
              <div className="border border-slate-300 p-2.5 rounded bg-slate-50 space-y-1.5">
                <div className="font-bold text-slate-900 text-[11px] flex justify-between items-center">
                  <span>{selectedCertDetail.cert.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedCertDetail.cert.status === 'EXPIRED'
                      ? 'bg-red-600 text-white'
                      : selectedCertDetail.cert.status === 'PENDING_APPROVAL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-emerald-700 text-white'
                  }`}>
                    {selectedCertDetail.cert.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 pt-1">
                  <div>Cert No: <strong>{selectedCertDetail.cert.certNumber}</strong></div>
                  <div>Issuing Body: <strong>{selectedCertDetail.cert.issuingBody}</strong></div>
                  <div>Issue Date: <strong>{selectedCertDetail.cert.issueDate}</strong></div>
                  <div>Expiry Date: <strong className="text-red-700">{selectedCertDetail.cert.expiryDate}</strong></div>
                </div>
              </div>

              {/* Evidence Upload Simulator */}
              <div className="space-y-1">
                <label className="block text-slate-800 font-bold text-[11px]">
                  Renewal Evidence Document (Certificate PDF / Exam Result):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. K3_Migas_Renewal_Evidence_EMP006.pdf"
                    value={evidenceFileName}
                    onChange={(e) => setEvidenceFileName(e.target.value)}
                    className="flex-1 border border-slate-300 px-2 py-1 bg-white rounded text-xs"
                  />
                  <button
                    onClick={() => setEvidenceFileName(`BNSP_MIGAS_CERT_${selectedCertDetail.cert.code}_2026.pdf`)}
                    className="win-btn text-[10px] px-2 py-1 font-bold cursor-pointer hover:bg-slate-200"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  onClick={() => setSelectedCertDetail(null)}
                  className="win-btn px-3 py-1 text-xs cursor-pointer hover:bg-slate-200"
                >
                  Close
                </button>
                
                {selectedCertDetail.cert.status !== 'PENDING_APPROVAL' && (
                  <button
                    onClick={handleSubmitForApproval}
                    className="win-btn px-3 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                  >
                    Submit for HSE Approval
                  </button>
                )}

                <button
                  onClick={handleApprovePlusOneYear}
                  className="win-btn px-4 py-1 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer"
                >
                  ✓ Approve & Extend 1 Year
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
