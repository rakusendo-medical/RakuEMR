import React from 'react';
import { Box } from '@mui/material';
import type { Patient } from '../../types';
import PatientCarePlan from '../../features/carePlan/pages/PatientCarePlan';
import type { KarteMode } from './KartePage';

interface Props {
  patient: Patient;
  // mode は将来拡張用（mode='outpatient' は KartePage の TABS で disabled のため、ここには到達しない想定）
  mode: KarteMode;
}

const NursingProcessTab: React.FC<Props> = ({ patient }) => {
  return (
    <Box>
      <PatientCarePlan embedded patientId={patient.id} />
    </Box>
  );
};

export default NursingProcessTab;
