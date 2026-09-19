// src/components/admin/tabs/PersonnelListTab.tsx
'use client';

import { useState } from 'react';
import { RAISED_PANEL, SUNKEN_PANEL, SUNKEN_INPUT, BEVEL_BUTTON } from '../../cmms/scadaStyles';
import { usePersonnelList, type PersonnelRecord } from '../hooks/usePersonnelList';
import { useAccountAdmin } from '../hooks/useAccountAdmin';
import AddPersonnelModal from '../modals/AddPersonnelModal';
import EditPersonnelModal from '../modals/EditPersonnelModal';
import ResignPersonnelModal from '../modals/ResignPersonnelModal';
import AccountPanelModal from '../modals/AccountPanelModal';

const DEPARTMENT_GROUPS = ['ADMIN', 'SITE_MANAGER', 'OP_TEAM', 'HSSE', 'MAINTENANCE', 'LOGISTIC', 'HR'];
const EMPLOYMENT_STATUSES = ['ACTIVE', 'OFF_DUTY_ROTATION', 'RESIGNED'];

export default function PersonnelListTab() {
  const { records, filter, setFilter, loading, error, createPersonnel, updatePersonnel, resignPersonnel } = usePersonnelList();
  const accountAdmin = useAccountAdmin();

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<PersonnelRecord | null>(null);
  const [resigning, setResigning] = useState<PersonnelRecord | null>(null);
  const [managingAccountFor, setManagingAccountFor] = useState<PersonnelRecord | null>(null);

  return (
    <div className="space-y-2">
      <div className={`${RAISED_PANEL} p-2 flex flex-wrap gap-2 items-end`}>
        <div>
          <label className="block text-[10px] font-bold text-slate-600">Department</label>
          <select
            value={filter.departmentGroup ?? ''}
            onChange={(e) => setFilter({ ...filter, departmentGroup: e.target.value || undefined })}
            className={SUNKEN_INPUT}
          >
            <option value="">전체</option>
            {DEPARTMENT_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-600">Status</label>
          <select
            value={filter.employmentStatus ?? ''}
            onChange={(e) => setFilter({ ...filter, employmentStatus: e.target.value || undefined })}
            className={SUNKEN_INPUT}
          >
            <option value="">전체</option>
            {EMPLOYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button className={`${BEVEL_BUTTON} ml-auto`} onClick={() => setShowAdd(true)}>+ 신규 인력 등록</button>
      </div>

      {error && <div className="text-[11px] text-red-600 font-bold">{error}</div>}
      {loading && <div className="text-[11px] text-slate-500">Loading...</div>}

      <div className={`${SUNKEN_PANEL} overflow-x-auto`}>
        <table className="w-full text-[11px]">
          <thead className="bg-slate-100 text-slate-600 font-bold">
            <tr>
              <td className="p-1.5">Employee ID</td>
              <td className="p-1.5">Name</td>
              <td className="p-1.5">Position</td>
              <td className="p-1.5">Department</td>
              <td className="p-1.5">Status</td>
              <td className="p-1.5">Account</td>
              <td className="p-1.5">Actions</td>
            </tr>
          </thead>
          <tbody>
            {records.map((p) => {
              const account = accountAdmin.findByEmployeeId(p.employeeId);
              return (
                <tr key={p.employeeId} className="border-t border-slate-200">
                  <td className="p-1.5 font-mono">{p.employeeId}</td>
                  <td className="p-1.5">{p.fullName}</td>
                  <td className="p-1.5">{p.positionTitle}</td>
                  <td className="p-1.5">{p.departmentGroup}</td>
                  <td className="p-1.5">{p.employmentStatus}</td>
                  <td className="p-1.5">{account ? `${account.roleCode} / ${account.accountStatus}` : '(없음)'}</td>
                  <td className="p-1.5 space-x-1">
                    <button className={BEVEL_BUTTON} onClick={() => setEditing(p)}>수정</button>
                    <button className={BEVEL_BUTTON} onClick={() => setManagingAccountFor(p)}>계정</button>
                    {p.employmentStatus !== 'RESIGNED' && (
                      <button className={BEVEL_BUTTON} onClick={() => setResigning(p)}>퇴직</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAdd && <AddPersonnelModal onClose={() => setShowAdd(false)} onSubmit={createPersonnel} />}
      {editing && (
        <EditPersonnelModal person={editing} onClose={() => setEditing(null)} onSubmit={updatePersonnel} />
      )}
      {resigning && (
        <ResignPersonnelModal person={resigning} onClose={() => setResigning(null)} onConfirm={resignPersonnel} />
      )}
      {managingAccountFor && (
        <AccountPanelModal
          person={managingAccountFor}
          account={accountAdmin.findByEmployeeId(managingAccountFor.employeeId)}
          onClose={() => setManagingAccountFor(null)}
          onCreate={accountAdmin.createAccount}
          onChangeRole={accountAdmin.changeRole}
          onLock={accountAdmin.lockAccount}
          onUnlock={accountAdmin.unlockAccount}
          onResetPassword={accountAdmin.resetPassword}
        />
      )}
    </div>
  );
}
