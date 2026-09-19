// src/cmms-daily-ops/print/PrintPage5.tsx
//
// PURPOSE
//   FORM-NP-08-33-N p5: Critical Events, Remarks, Safety Information,
//   Signature block. 이 페이지의 데이터(critical_events/safety_notes/
//   signatures)는 snapshot_payload가 아니라 별도 child 테이블(Stage C2)에서
//   오므로, DailyReportPrintView.tsx가 별도로 조회해 props로 내려준다.
//
//   서명은 읽기 전용 텍스트만 렌더링한다(signer_name + signed_at) —
//   signature_image_ref가 항상 null이라 이미지 엘리먼트를 쓰지 않는다.

import type { CriticalEvent, SafetyNotes, Signature, SignatureRole } from '../dao/dailyReportChildDao';

const SIGNATURE_ROLE_LABEL: Record<SignatureRole, string> = {
  prepared_by: 'Prepared By',
  acknowledged_by: 'Acknowledged By',
};

export interface PrintPage5Props {
  criticalEvents: CriticalEvent[];
  safetyNotes: SafetyNotes | undefined;
  signatures: Signature[];
}

export function PrintPage5({ criticalEvents, safetyNotes, signatures }: PrintPage5Props) {
  return (
    <div className="print-page">
      <div className="print-section-header">G. CRITICAL EVENTS</div>
      <table className="print-field-grid">
        <thead>
          <tr>
            <td>Time</td>
            <td>Equipment/System</td>
            <td>Condition/Alarm</td>
            <td>Impact</td>
            <td>Immediate Action</td>
            <td>Status</td>
            <td>PIC</td>
          </tr>
        </thead>
        <tbody>
          {criticalEvents.map((e) => (
            <tr key={e.id}>
              <td>{e.eventTime ?? '-'}</td>
              <td>{e.equipmentSystem ?? '-'}</td>
              <td>{e.conditionAlarm ?? '-'}</td>
              <td>{e.impact ?? '-'}</td>
              <td>{e.immediateAction ?? '-'}</td>
              <td>{e.status ?? '-'}</td>
              <td>{e.pic ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="print-section-header">REMARKS</div>
      <div className="print-field-grid">{safetyNotes?.remarksText ?? '-'}</div>

      <div className="print-section-header">H. SAFETY INFORMATION</div>
      <table className="print-field-grid">
        <tbody>
          <tr>
            <td>Unsafe Action</td>
            <td>{safetyNotes?.unsafeActionText ?? '-'}</td>
          </tr>
          <tr>
            <td>Unsafe Condition</td>
            <td>{safetyNotes?.unsafeConditionText ?? '-'}</td>
          </tr>
          <tr>
            <td>Incident</td>
            <td>{safetyNotes?.incidentText ?? '-'}</td>
          </tr>
        </tbody>
      </table>

      <div className="print-section-header">SIGNATURES</div>
      <table className="print-field-grid">
        <tbody>
          {(Object.keys(SIGNATURE_ROLE_LABEL) as SignatureRole[]).map((role) => {
            const signature = signatures.find((s) => s.role === role);
            return (
              <tr key={role}>
                <td>{SIGNATURE_ROLE_LABEL[role]}</td>
                <td>
                  {signature
                    ? `${signature.signerName}${signature.signerTitle ? ` (${signature.signerTitle})` : ''} — ${signature.signedAt}`
                    : 'Not signed'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
