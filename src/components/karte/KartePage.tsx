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
        height: '100%',
        bgcolor: '#f0f2f5',
        overflow: 'hidden',
      }}
    >
      {/* Top: Patient header with tabs and info */}
      <PatientHeader />

      {/* Middle: flex layout - LifeTimeline & MedicalInfo take natural height, MedicalRecords fills rest */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          px: 0.5,
          py: 0.5,
          minHeight: 0,
        }}
      >
        {/* ⑤⑥ Life timeline - fixed height */}
        <LifeTimeline />

        {/* ⑦⑧ Medical information - scrollable with max height */}
        <Box sx={{ maxHeight: '30%', overflowY: 'auto', flexShrink: 0 }}>
          <MedicalInfo />
        </Box>

        {/* ⑨ Medical records - fills remaining space */}
        <MedicalRecords />
      </Box>

      {/* ⑩ Bottom action bar */}
      <ActionBar />
    </Box>
  );
}
