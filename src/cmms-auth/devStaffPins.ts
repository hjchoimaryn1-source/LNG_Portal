// src/cmms-auth/devStaffPins.ts
//
// DEV-ONLY: per-account fixed PINs for the Quick-Login PIN modal. Real
// PIN provisioning/reset is out of scope until userAccountsSeed.ts (or a
// real staff onboarding flow) has an actual PIN policy — until then each
// seed account gets a fixed, distinct 4-digit PIN derived from its
// userId so testers can tell accounts apart. Remove once real PIN
// issuance exists.

const FALLBACK_PIN = '0000';

const DEV_STAFF_PINS: Record<string, string> = {
  'BSG259529': '9529', // Edi Hermawan — Site Manager
  'BSG259524': '9524', // Shadiq M. Shalih — Operation Team Leader
  'DEV-HQ-001': '0001', // Choi Hong-joon — System Admin (dev account)
};

export function getDevStaffPin(staffId: string): string {
  return DEV_STAFF_PINS[staffId] ?? FALLBACK_PIN;
}
