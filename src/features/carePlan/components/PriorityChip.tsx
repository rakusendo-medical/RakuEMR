import React from 'react';
import { Chip } from '@mui/material';
import type { Priority } from '../types';

const CONFIG: Record<Priority, { label: string; color: 'default' | 'error' | 'warning' }> = {
  high: { label: '優先度:高', color: 'error' },
  medium: { label: '優先度:中', color: 'warning' },
  low: { label: '優先度:低', color: 'default' },
};

const PriorityChip: React.FC<{ priority: Priority }> = ({ priority }) => {
  const { label, color } = CONFIG[priority];
  return <Chip label={label} color={color} size="small" variant="outlined" />;
};

export default PriorityChip;
