import React from 'react';
import { Chip } from '@mui/material';
import type { ReliefCategory } from '../../types';
import { RELIEF_CATEGORY_CONFIG } from '../../data/mockData';

interface Props {
  category: ReliefCategory;
}

// 救護区分バッジ（担送/護送/独歩/未入力）。病棟マップの各患者に表示する。
// 横幅を抑えるため表示は 1 文字（担/護/独/未）。ホバー tooltip と aria-label で正式名を補う。
const ReliefBadge: React.FC<Props> = ({ category }) => {
  const cfg = RELIEF_CATEGORY_CONFIG[category];
  return (
    <Chip
      label={cfg.short}
      size="small"
      title={`救護区分：${cfg.label}`}
      aria-label={`救護区分 ${cfg.label}`}
      sx={{
        bgcolor: cfg.bgColor,
        color: cfg.color,
        fontWeight: 700,
        fontSize: '0.6875rem',
        height: 18,
        border: `1px solid ${cfg.color}33`,
        '& .MuiChip-label': { px: 0.5 },
      }}
    />
  );
};

export default ReliefBadge;
