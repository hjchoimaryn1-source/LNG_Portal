// DEV-ONLY TEMPORARY BYPASS IDENTITY
// TODO(auth-migration): Delete this file once §3.5 user_sessions table & real auth ship.
// Must be imported ONLY by src/lib/rbac/ptwSelfApproval.ts (or its call site) until then.
export function getCurrentApproverId(): string {
  return process.env.NEXT_PUBLIC_DEV_APPROVER_ID || 'DEV_USER_PAK_EDI';
}
