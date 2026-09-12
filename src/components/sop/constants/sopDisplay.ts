// src/components/sop/constants/sopDisplay.ts
// Display-only constants for SOP category/importance badges (SCADA UI labels & colors).

import { ImportanceLevel, SOPCategory } from '../../../types/sop';

export const ALL_SOP_CATEGORIES: SOPCategory[] = [
  'MANAGEMENT_RESPONSIBILITY',
  'TRAINING_DRILL',
  'LOGISTICS_TRANSPORT',
  'AUDIT_SURVEY',
  'ASSET_MAINTENANCE',
  'PROCUREMENT_CONTRACTOR',
  'SSHQE_MANAGEMENT_SYSTEM',
  'CARGO_HANDLING',
  'SAFETY_PTW',
  'ENVIRONMENTAL',
  'EMERGENCY_RESPONSE',
  'MANAGEMENT_OF_CHANGE',
];

export const ALL_IMPORTANCE_LEVELS: ImportanceLevel[] = ['HIGH', 'MEDIUM', 'LOW'];

export const SOP_CATEGORY_LABELS: Record<SOPCategory, string> = {
  MANAGEMENT_RESPONSIBILITY: 'Management Responsibility',
  TRAINING_DRILL: 'Training & Drill',
  LOGISTICS_TRANSPORT: 'Logistics & Transport',
  AUDIT_SURVEY: 'Audit & Survey',
  ASSET_MAINTENANCE: 'Asset Maintenance',
  PROCUREMENT_CONTRACTOR: 'Procurement & Contractor',
  SSHQE_MANAGEMENT_SYSTEM: 'SSHQE Mgmt System',
  CARGO_HANDLING: 'Cargo Handling',
  SAFETY_PTW: 'Safety / PTW',
  ENVIRONMENTAL: 'Environmental',
  EMERGENCY_RESPONSE: 'Emergency Response',
  MANAGEMENT_OF_CHANGE: 'Management of Change',
};

export const IMPORTANCE_BADGE_CLASS: Record<ImportanceLevel, string> = {
  HIGH: 'bg-red-700 text-white border-red-900',
  MEDIUM: 'bg-amber-300 text-black border-[#808080]',
  LOW: 'bg-[#d4d0c8] text-black border-[#808080]',
};
