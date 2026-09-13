export type SOPCategory =
  | 'MANAGEMENT_RESPONSIBILITY'
  | 'TRAINING_DRILL'
  | 'LOGISTICS_TRANSPORT'
  | 'AUDIT_SURVEY'
  | 'ASSET_MAINTENANCE'
  | 'PROCUREMENT_CONTRACTOR'
  | 'SSHQE_MANAGEMENT_SYSTEM'
  | 'CARGO_HANDLING'
  | 'SAFETY_PTW'
  | 'ENVIRONMENTAL'
  | 'EMERGENCY_RESPONSE'
  | 'MANAGEMENT_OF_CHANGE';

export type ImportanceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SOPAnchor {
  anchorId: string;
  headingText: string;
  level: number;
}

export interface SOPChecklistItem {
  itemId: string;
  description: string;
  fieldType: 'CHECKBOX' | 'TEXT' | 'NUMBER' | 'SELECT' | 'SIGNATURE';
  passFailCriteria?: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  options?: string[];
  required: boolean;
  anchorId?: string;
}

export interface SOPChecklist {
  checklistId: string;
  title: string;
  formCode?: string;
  items: SOPChecklistItem[];
  signers?: string[];
}

export interface SOPStructuredSummary {
  purpose: string;
  keyRequirements: string[];
  approvalLine: string[];
  safetyRules: string[];
}

export interface SOPDocument {
  npCode: string;
  title: string;
  category: SOPCategory;
  importanceLevel: ImportanceLevel;
  keywords: string[];
  markdownFilePath: string;
  structuredSummary: SOPStructuredSummary;
  anchors: SOPAnchor[];
  checklists: SOPChecklist[];
  relatedNpCodes: string[];
  version: string;
  lastUpdated: string;
}

export interface SOPSearchFilters {
  keyword?: string;
  categories?: SOPCategory[];
  importanceLevels?: ImportanceLevel[];
}
