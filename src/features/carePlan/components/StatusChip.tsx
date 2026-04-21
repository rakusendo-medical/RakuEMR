import React from 'react';
import { Chip } from '@mui/material';
import type { ProblemItemStatus } from '../types';

const CONFIG: Record<ProblemItemStatus, { label: string; color: 'default' | 'primary' | 'warning' | 'success' | 'info' }> = {
  draft: { label: '下書き', color: 'default' },
  active: { label: '有効', color: 'primary' },
  evaluating: { label: '評価中', color: 'warning' },
  closed_resolved: { label: '解決', color: 'success' },
  closed_cancelled: { label: '中止', color: 'default' },
  closed_changed: { label: '変更', color: 'info' },
};

interface Props {
  status: ProblemItemStatus;
}

const StatusChip: React.FC<Props> = ({ status }) => {
  const { label, color } = CONFIG[status];
  return <Chip label={label} color={color} size="small" />;
};

export default StatusChip;
