import React from 'react';
import { Box, Card, CardContent, Chip, IconButton, Stack, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '../types';
import { useCarePlanStore, formatJPDate } from '../store';
import { patientNumberOf } from '../../../data/mockData';

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
    <Card sx={{ border: '1px solid #1e3a5f', boxShadow: 'none', mb: 1.5 }}>
      <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {showBack && (
            <IconButton size="small" onClick={() => navigate(-1)}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}
          <Chip
            label="入院"
            size="small"
            color="error"
            sx={{ fontWeight: 700 }}
          />
          <Box sx={{ flex: 1 }}>
            {title && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {title}
              </Typography>
            )}
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 700 }}>
                {patientNumberOf(patient.id)}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {patient.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {patient.sex === 'M' ? '男' : patient.sex === 'F' ? '女' : 'その他'}　{patient.age}歳
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {patient.roomNo}号室
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 0.3 }}>
              <Typography variant="caption" color="text.secondary">
                主診断: {patient.primaryDiagnosis}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                受け持ち: {primaryNurse?.name ?? '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                入院日: {formatJPDate(patient.admissionDate)}
              </Typography>
            </Stack>
          </Box>
          {rightSlot}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PatientHeader;
