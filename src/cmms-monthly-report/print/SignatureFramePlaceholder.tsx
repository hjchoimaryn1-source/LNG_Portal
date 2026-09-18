// src/cmms-monthly-report/print/SignatureFramePlaceholder.tsx
//
// PURPOSE
//   Static visual frame for Statement of Delivery (P7)'s sign-off area —
//   Name/Designation/Date/Sign Box regions. HJ decision (Stage 2):
//   approximate placement only, since the source workbook has NO layout
//   signal for this area at all (verified via direct xlsx inspection — no
//   bordered sub-box, no drawing object, page frame border only). No DB
//   table, no API route, no auto-fill this stage — signerData is an empty
//   architecture slot, always undefined until a future stage wires real
//   signer identity + an approval workflow.

export interface SignerInfo {
  name: string;
  designation: string;
  date: string;
}

export interface SignatureFramePlaceholderProps {
  signerData?: SignerInfo;
}

const SIGNATURE_ROLES = ['Prepared By', 'Approved By'];

export function SignatureFramePlaceholder({ signerData }: SignatureFramePlaceholderProps) {
  return (
    <div className="print-signature-frame">
      {SIGNATURE_ROLES.map((role) => (
        <div key={role} className="print-signature-box">
          <div>{role}</div>
          <div>Name: {signerData?.name ?? ''}</div>
          <div>Designation: {signerData?.designation ?? ''}</div>
          <div>Date: {signerData?.date ?? ''}</div>
        </div>
      ))}
    </div>
  );
}
