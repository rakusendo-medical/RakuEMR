import { useState, useMemo } from 'react';
import {
  Box, Stack, Typography, Tooltip, FormControlLabel, Switch, Chip,
} from '@mui/material';
import type { Patient } from '../../types';
import SectionHeader from '../common/SectionHeader';
import type { KarteMode } from './KartePage';

// ===== タイムライン行定義 =====

interface TimelineRow {
  label: string;
  color: string;
  /** 該当する日（1〜31）。空配列なら空行 */
  activeDays: number[];
  /** 期間中継続している部分（濃い表示）の日範囲（オプション） */
  continuousDays?: number[];
  /** ホバー Tooltip 内容（オプション・該当時に詳細） */
  detail?: string;
}

/**
 * PM 指示（2026-05-07）でデイケア列削除済み → 5 行構成:
 *   治療歴 / 訪問看護 / 学歴・経歴 / エピソード / 生活歴・現病歴
 *
 * 段階 2 では mock データ（患者横断の共通値）。本格的なデータソースは段階 3 / 別エピックで詰める。
 */
const ROWS: TimelineRow[] = [
  {
    label: '治療歴',
    color: '#90caf9',
    activeDays: Array.from({ length: 31 }, (_, i) => i + 1),
    detail: '入院期間 / 治療セッション継続中',
  },
  {
    label: '訪問看護',
    color: '#ce93d8',
    activeDays: [2, 9, 16, 23, 30],
    detail: '週 1 回（金）訪問看護導入',
  },
  {
    label: '学歴・経歴',
    color: '#ffcc80',
    activeDays: [],
    detail: '当月の関連イベントなし',
  },
  {
    label: 'エピソード',
    color: '#ef9a9a',
    activeDays: [5, 12, 19],
    detail: '症状増悪 3 件（5日/12日/19日）',
  },
  {
    label: '生活歴・現病歴',
    color: '#80cbc4',
    activeDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    detail: '当月前半に変動あり',
  },
];

// ===== Component =====

interface LifeHistoryTimelineProps {
  patient: Patient;
  mode: KarteMode;
}

export default function LifeHistoryTimeline({ patient: _patient, mode }: LifeHistoryTimelineProps) {
  const [open, setOpen] = useState(true);
  const [showEmptyRows, setShowEmptyRows] = useState(false);

  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);

  const visibleRows = useMemo(
    () => (showEmptyRows ? ROWS : ROWS.filter((r) => r.activeDays.length > 0)),
    [showEmptyRows],
  );

  // SectionHeader 色: mode 別アクセント（design-rules §12 準拠）
  const headerColor =
    _patient.admissionState === 'discharged' ? '#6b7280'
      : mode === 'outpatient' ? '#16a34a'
      : '#1e3a5f';

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <SectionHeader
        title="生活歴"
        color={headerColor}
        open={open}
        onToggle={() => setOpen(!open)}
        rightSlot={
          <Stack direction="row" spacing={1} alignItems="center" onClick={(e) => e.stopPropagation()}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showEmptyRows}
                  onChange={(e) => setShowEmptyRows(e.target.checked)}
                />
              }
              label={<Typography variant="caption" sx={{ color: '#fff' }}>空行を表示</Typography>}
              sx={{ ml: 0, mr: 0 }}
            />
          </Stack>
        }
      />
      {open && (
        <Box sx={{ px: 2, py: 1 }}>
          {/* 凡例 */}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.75 }} flexWrap="wrap">
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              凡例:
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box sx={{ width: 12, height: 12, bgcolor: '#90caf9', border: '1px solid', borderColor: 'divider' }} />
              <Typography variant="caption" color="text.secondary">該当あり</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Box sx={{ width: 12, height: 12, bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider' }} />
              <Typography variant="caption" color="text.secondary">該当なし</Typography>
            </Stack>
            <Box sx={{ flex: 1 }} />
            <Chip
              label={`${visibleRows.length} / ${ROWS.length} 行表示`}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
          </Stack>

          {/* 日付軸（1〜31 ヘッダー） */}
          <Box sx={{ overflowX: 'auto' }}>
            <Stack direction="row" spacing={0} alignItems="center" sx={{ mb: 0.3 }}>
              <Box sx={{ width: 100, flexShrink: 0 }} />
              {days.map((d) => (
                <Box
                  key={d}
                  sx={{
                    width: 16,
                    minWidth: 16,
                    textAlign: 'center',
                    color: 'text.secondary',
                    fontSize: '0.55rem',
                    fontWeight: d === 1 || d === 15 || d === 31 ? 700 : 400,
                  }}
                >
                  {d === 1 || d === 5 || d === 10 || d === 15 || d === 20 || d === 25 || d === 30 ? d : ''}
                </Box>
              ))}
            </Stack>

            {/* 5 行 × 31 セル */}
            {visibleRows.map((row) => (
              <Stack
                key={row.label}
                direction="row"
                spacing={0}
                alignItems="center"
                sx={{ mb: 0.2 }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    width: 100,
                    flexShrink: 0,
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                >
                  {row.label}
                </Typography>
                {days.map((d) => {
                  const active = row.activeDays.includes(d);
                  return (
                    <Tooltip
                      key={d}
                      title={
                        active
                          ? `${row.label} (${d}日)${row.detail ? `: ${row.detail}` : ''}`
                          : `${row.label} (${d}日): 該当なし`
                      }
                      placement="top"
                      arrow
                      disableInteractive
                    >
                      <Box
                        sx={{
                          width: 16,
                          minWidth: 16,
                          height: 14,
                          bgcolor: active ? row.color : 'grey.100',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRight: 'none',
                          '&:last-child': {
                            borderRight: '1px solid',
                            borderRightColor: 'divider',
                          },
                          cursor: 'help',
                          '&:hover': active
                            ? { filter: 'brightness(0.92)' }
                            : { bgcolor: 'grey.200' },
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Stack>
            ))}

            {visibleRows.length === 0 && (
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ display: 'block', textAlign: 'center', py: 1, fontStyle: 'italic' }}
              >
                該当する行がありません（空行非表示中）。右上のトグルで空行も表示できます。
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
