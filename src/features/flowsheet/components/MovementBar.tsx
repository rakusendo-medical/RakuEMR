import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import type { ISODate, MovementSegment, MovementSegmentKind } from '../types';

interface Props {
  dates: ISODate[];                  // 7 日分
  segments: MovementSegment[];       // 当該患者のセグメント
}

const KIND_LABEL: Record<MovementSegmentKind, string> = {
  room: '病室',
  isolation: '隔離',
  restraint: '拘束',
  restriction: '行動制限',
  outing: '外出',
  leave: '外泊',
};

const KIND_COLOR: Record<MovementSegmentKind, string> = {
  room: '#94a3b8',
  isolation: '#dc2626',
  restraint: '#b91c1c',
  restriction: '#f59e0b',
  outing: '#fb923c',
  leave: '#fb923c',
};

/** ISO 日付の 1 日範囲とセグメントが重なるか判定 */
const overlaps = (date: ISODate, segStart: string, segEnd?: string): boolean => {
  const dayStart = new Date(`${date}T00:00:00`).getTime();
  const dayEnd = new Date(`${date}T23:59:59`).getTime();
  const s = new Date(segStart).getTime();
  const e = segEnd ? new Date(segEnd).getTime() : Number.POSITIVE_INFINITY;
  return s <= dayEnd && e >= dayStart;
};

const formatDateTime = (iso?: string): string => {
  if (!iso) return '継続中';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const ROW_KINDS: MovementSegmentKind[] = ['room', 'isolation', 'restraint', 'restriction', 'outing', 'leave'];

const MovementBar: React.FC<Props> = ({ dates, segments }) => {
  // 種類別に行を表示。当該種類のセグメントがあれば該当日に色帯
  const rowsToShow = ROW_KINDS.filter((kind) =>
    segments.some((s) => s.kind === kind && dates.some((d) => overlaps(d, s.startAt, s.endAt))),
  );

  if (rowsToShow.length === 0) return null;

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 0.5, bgcolor: '#fafafa' }}>
      {rowsToShow.map((kind) => (
        <Box key={kind} sx={{ display: 'grid', gridTemplateColumns: `64px repeat(7, 1fr)`, alignItems: 'center', mb: 0.25 }}>
          <Typography variant="caption" sx={{ color: '#475569', pl: 0.5 }}>
            {KIND_LABEL[kind]}
          </Typography>
          {dates.map((d) => {
            const matched = segments.filter((s) => s.kind === kind && overlaps(d, s.startAt, s.endAt));
            if (matched.length === 0) {
              return <Box key={d} sx={{ height: 18, mx: 0.25 }} />;
            }
            const seg = matched[0];
            const tip = `${formatDateTime(seg.startAt)} 〜 ${formatDateTime(seg.endAt)}${seg.label ? `（${seg.label}）` : ''}`;
            return (
              <Tooltip key={d} title={tip} arrow>
                <Box sx={{
                  height: 18, mx: 0.25, borderRadius: 0.5,
                  bgcolor: KIND_COLOR[kind], opacity: 0.85,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 10, fontWeight: 600,
                }}>
                  {seg.label ?? ''}
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};

export default MovementBar;
