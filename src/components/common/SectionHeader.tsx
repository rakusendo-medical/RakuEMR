import React from 'react';
import { Box, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

interface Props {
  title: React.ReactNode;
  /** 右側に置く要素 (ボタン等)。クリックは header の toggle に伝播しない */
  rightSlot?: React.ReactNode;
  /** 折りたたみ機能を使う場合に指定 */
  open?: boolean;
  onToggle?: () => void;
  /** 背景色。デフォルトはダークネイビー */
  color?: string;
}

const SectionHeader: React.FC<Props> = ({
  title, rightSlot, open, onToggle, color = '#1e3a5f',
}) => {
  const collapsible = onToggle !== undefined && open !== undefined;
  return (
    <Box
      onClick={collapsible ? onToggle : undefined}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        bgcolor: color,
        px: 1.5,
        py: 0.5,
        cursor: collapsible ? 'pointer' : 'default',
        borderRadius: collapsible
          ? (open ? '8px 8px 0 0' : '8px')
          : '8px 8px 0 0',
        '&:hover': collapsible ? { opacity: 0.92 } : undefined,
      }}
    >
      <Typography sx={{ fontWeight: 700, color: '#fff' }}>
        {title}
      </Typography>
      <Box sx={{ flex: 1 }} />
      {rightSlot && (
        <Box onClick={(e) => e.stopPropagation()} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {rightSlot}
        </Box>
      )}
      {collapsible && (open ? (
        <ExpandLess sx={{ color: '#fff', fontSize: 18 }} />
      ) : (
        <ExpandMore sx={{ color: '#fff', fontSize: 18 }} />
      ))}
    </Box>
  );
};

export default SectionHeader;
