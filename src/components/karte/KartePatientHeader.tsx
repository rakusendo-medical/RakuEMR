import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { Patient } from '../../types';
import type { KarteMode } from './KartePage';

interface KartePatientHeaderProps {
  patient: Patient;
  mode: KarteMode;
  onBack: () => void;
}

export default function KartePatientHeader({ patient, mode, onBack }: KartePatientHeaderProps) {
  const isOutpatient = mode === 'outpatient';
  const isDischarged = patient.admissionState === 'discharged';

  return (
    <Box
      sx={{
        px: 2,
        py: 1,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
        <Button
          size="small"
          variant="text"
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={onBack}
          sx={{ textTransform: 'none' }}
        >
          一覧に戻る
        </Button>

        <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
          {patient.id}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {patient.name}
        </Typography>
        {patient.nameKana && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {patient.nameKana}
          </Typography>
        )}
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {patient.age} 歳 / {patient.gender}
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Chip
          label={isOutpatient ? '外来' : '入院'}
          size="small"
          color={isOutpatient ? 'success' : 'primary'}
        />
        {!isOutpatient && (patient.wardName || patient.roomNumber) && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {[patient.wardName, patient.roomNumber].filter(Boolean).join(' / ')}
          </Typography>
        )}
        {!isOutpatient && isDischarged && (
          <Chip label="退院済" size="small" color="default" />
        )}
      </Stack>
    </Box>
  );
}
