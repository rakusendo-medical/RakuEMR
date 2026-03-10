import { Box } from '@mui/material';
import PatientHeader from './PatientHeader';
import LifeTimeline from './LifeTimeline';
import MedicalInfo from './MedicalInfo';
import MedicalRecords from './MedicalRecords';
import ActionBar from './ActionBar';

export default function KartePage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: '#f0f2f5',
        overflow: 'hidden',
      }}
    >
      {/* Top: Patient header with tabs and info */}
      <PatientHeader />

      {/* Middle: scrollable content area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          px: 0.5,
          py: 0.5,
          minHeight: 0,
        }}
      >
        {/* ⑤⑥ Life timeline */}
        <LifeTimeline />

        {/* ⑦⑧ Medical information */}
        <MedicalInfo />

        {/* ⑨ Medical records */}
        <MedicalRecords />
      </Box>

      {/* ⑩ Bottom action bar */}
      <ActionBar />
    </Box>
  );
}
