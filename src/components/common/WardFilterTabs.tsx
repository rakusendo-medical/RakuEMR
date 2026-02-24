import React from 'react';
import { Tabs, Tab } from '@mui/material';
import type { WardId } from '../../types';
import { WARD_LABELS } from '../../types';

interface Props {
  value: WardId | 'all';
  onChange: (value: WardId | 'all') => void;
  showAll?: boolean;
}

const WardFilterTabs: React.FC<Props> = ({ value, onChange, showAll = true }) => (
  <Tabs
    value={value}
    onChange={(_, v) => onChange(v)}
    sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
  >
    {showAll && <Tab label="全病棟" value="all" />}
    <Tab label={WARD_LABELS.ward1} value="ward1" />
    <Tab label={WARD_LABELS.ward2} value="ward2" />
  </Tabs>
);

export default WardFilterTabs;
