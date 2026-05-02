import React from 'react';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import type { BedFlag } from '../../types';
import { BED_FLAG_CONFIG, BED_FLAG_ORDER } from '../../data/mockData';

interface Props {
  flags?: BedFlag[];
  size?: 'sm' | 'md';
}

/**
 * ベッドマス内に複数の運用フラグ（隔離・拘束・外出・外泊・要報告・預り金）を
 * 重畳表示するアイコン群。BED_FLAG_ORDER の並び順に揃える。
 */
const BedFlagIcons: React.FC<Props> = ({ flags, size = 'sm' }) => {
  if (!flags || flags.length === 0) return null;
  const ordered = BED_FLAG_ORDER.filter((f) => flags.includes(f));
  const dim = size === 'sm' ? 16 : 20;

  return (
    <Stack direction="row" spacing={0.25}>
      {ordered.map((f) => {
        const cfg = BED_FLAG_CONFIG[f];
        return (
          <Tooltip key={f} title={cfg.label} arrow>
            <Box
              sx={{
                width: dim,
                height: dim,
                borderRadius: 0.75,
                bgcolor: cfg.color,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size === 'sm' ? '0.625rem' : '0.75rem',
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {cfg.short}
            </Box>
          </Tooltip>
        );
      })}
    </Stack>
  );
};

interface LegendProps {
  variant?: 'flags' | 'all';
}

/**
 * 病棟マップ画面下部の凡例。BedFlagIcons と同じ短縮表記で凡例を表示する。
 */
export const BedFlagLegend: React.FC<LegendProps> = () => (
  <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
    {BED_FLAG_ORDER.map((f) => {
      const cfg = BED_FLAG_CONFIG[f];
      return (
        <Stack key={f} direction="row" spacing={0.5} alignItems="center">
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: 0.75,
              bgcolor: cfg.color,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.625rem',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {cfg.short}
          </Box>
          <Typography variant="caption" color="text.secondary">{cfg.label}</Typography>
        </Stack>
      );
    })}
  </Stack>
);

export default BedFlagIcons;
