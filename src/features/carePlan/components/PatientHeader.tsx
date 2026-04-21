import React from 'react';
import { Box, IconButton, Paper, Stack, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '../types';
import { useCarePlanStore } from '../store';

interface Props {
  patient: Patient;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
  title?: string;
}

const PatientHeader: React.FC<Props> = ({ patient, showBack = true, rightSlot, title }) => {
  const navigate = useNavigate();
  const nurses = useCarePlanStore((s) => s.nurses);
  const primaryNurse = nurses.find((n) => n.id === patient.primaryNurseId);

  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        {showBack && (
          <IconButton size="small" onClick={() => navigate(-1)}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        )}
        <Box sx={{ flex: 1 }}>
          {title && (
            <Typography variant="caption" color="text.secondary">
              {title}
            </Typography>
          )}
          <Stack direction="row" alignItems="baseline" spacing={1.5}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {patient.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ({patient.age}歳{patient.sex === 'M' ? '男性' : patient.sex === 'F' ? '女性' : 'その他'})
            </Typography>
            <Typography variant="body2">
              {patient.roomNo}号室
            </Typography>
            <Typography variant="body2" color="text.secondary">
              主診断: {patient.primaryDiagnosis}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              受け持ち: {primaryNurse?.name ?? '—'}
            </Typography>
          </Stack>
        </Box>
        {rightSlot}
      </Stack>
    </Paper>
  );
};

export default PatientHeader;
