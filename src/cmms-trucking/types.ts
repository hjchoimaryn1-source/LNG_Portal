// src/cmms-trucking/types.ts
//
// Pure domain types for the NP-03 Trucking/Vehicle Inspection module.
// No imports from outside this file (mirrors src/cmms-auth/rbacTypes.ts
// isolation rule) — DAOs/components import these, never the other way.

export type TruckInspectionType = 'PRE_OP' | 'PERIODIC' | 'POST_TRANSIT' | 'VEHICLE_SECURITY';

/** Source form this inspection record was captured against (NP-03.md §7 Company Forms). */
export type TruckInspectionFormCode = 'NP03-02' | 'NP03-06' | 'NP03-11' | 'NP03-13' | 'NP03-15';

export type TruckInspectionStatus = 'DRAFT' | 'SUBMITTED';

export type InspectionItemStatus = 'OK' | 'NOT_OK' | 'NA';

export interface TruckInspectionHeader {
  id: number;
  inspectionDate: string;
  driver: string;
  vehicleNo: string;
  isoTankNo: string | null;
  inspectionType: TruckInspectionType;
  formCode: TruckInspectionFormCode;
  status: TruckInspectionStatus;
  checkedBy: string;
  createdAt: string;
}

export interface NewTruckInspectionHeaderInput {
  inspectionDate: string;
  driver: string;
  vehicleNo: string;
  isoTankNo?: string | null;
  inspectionType: TruckInspectionType;
  formCode: TruckInspectionFormCode;
  status?: TruckInspectionStatus;
  checkedBy: string;
}

export interface InspectionItem {
  id: number;
  inspectionId: number;
  itemLabel: string;
  criteria: string | null;
  status: InspectionItemStatus;
  remarks: string | null;
}

export interface NewInspectionItemInput {
  itemLabel: string;
  criteria?: string | null;
  status: InspectionItemStatus;
  remarks?: string | null;
}

/** NP03-09 Incident & Violation Log — Type of Incident column values (verbatim from NP-03.md). */
export type IncidentType = 'Speeding' | 'Unsafe Parking' | 'Route Deviation' | 'Accident' | 'Near Miss';

export interface IncidentLogEntry {
  id: number;
  incidentDate: string;
  driver: string;
  vehicleNo: string;
  incidentType: IncidentType;
  description: string;
  location: string | null;
  actionTaken: string;
  followUp: string;
  verifiedBy: string;
  createdAt: string;
}

export interface NewIncidentLogEntryInput {
  incidentDate: string;
  driver: string;
  vehicleNo: string;
  incidentType: IncidentType;
  description: string;
  location?: string | null;
  actionTaken: string;
  followUp: string;
  verifiedBy: string;
}
