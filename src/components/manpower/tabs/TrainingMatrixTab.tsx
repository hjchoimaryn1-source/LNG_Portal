import React from 'react';
import { StaffPersonnel, CompetencyCertification } from '../../../types/lng';
import TrainingMatrixView from '../TrainingMatrixView';

interface TrainingMatrixTabProps {
  personnelList: StaffPersonnel[];
  highlightedEmpId?: string | null;
  onUpdatePersonnelCertification?: (
    empId: string,
    certCode: string,
    updatedCert: CompetencyCertification
  ) => void;
}

export default function TrainingMatrixTab({
  personnelList,
  highlightedEmpId,
  onUpdatePersonnelCertification,
}: TrainingMatrixTabProps) {
  return (
    <TrainingMatrixView
      personnelList={personnelList}
      highlightedEmpId={highlightedEmpId}
      onUpdatePersonnelCertification={onUpdatePersonnelCertification}
    />
  );
}
