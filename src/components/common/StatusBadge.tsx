import React from 'react';
import { Chip } from '@mui/material';
import { FiberManualRecord } from '@mui/icons-material';
import type { PatientStatus } from '../../types';
import { STATUS_CONFIG } from '../../data/mockData';

interface Props {
  status: PatientStatus;
}

const StatusBadge: React.FC<Props> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <Chip
      icon={<FiberManualRecord sx={{ fontSize: 8, color: `${cfg.color} !important` }} />}
      label={cfg.label}
      size="small"
      sx={{
        bgcolor: cfg.bgColor,
        color: cfg.color,
        fontWeight: 600,
        fontSize: '0.6875rem',
        border: `1px solid ${cfg.color}20`,
        '& .MuiChip-icon': { ml: 0.5 },
      }}
    />
  );
};

export default StatusBadge;
