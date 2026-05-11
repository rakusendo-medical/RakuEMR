import React, { useMemo, useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, Paper, Stack, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import { ListAlt as ListAltIcon, Circle as CircleIcon } from '@mui/icons-material';
import type { Patient, Order, OrderStatus } from '../../types';
import { ORDERS } from '../../data/mockData';
import type { KarteMode } from './KartePage';

interface Props {
  patient: Patient;
  mode: KarteMode;
  onOpenOrdersTab: () => void;
}

const ORDER_STATUSES: OrderStatus[] = ['指示済', '実施中', '予定', '中止', '実施済'];

const PERIODS = ['today', 'week', 'all'] as const;
type Period = typeof PERIODS[number];
const PERIOD_LABELS: Record<Period, string> = {
  today: '今日',
  week: '今週',
  all: '全期間',
};

// design-rules §7.1 準拠（業務ステータス Chip 色は mode より優先・§12.3 末尾）
const STATUS_COLORS: Record<OrderStatus, 'primary' | 'success' | 'warning' | 'default' | 'info'> = {
  '指示済': 'info',
  '実施中': 'primary',
  '予定': 'warning',
  '中止': 'default',
  '実施済': 'success',
};

// AC-5 未対応マーカー対象
const PENDING_STATUSES: ReadonlyArray<OrderStatus> = ['指示済', '予定'];

const toSlash = (iso: string) => iso.replace(/-/g, '/');

const formatPeriod = (o: Order): string => {
  const start = toSlash(o.startDate);
  if (!o.days || o.days <= 1) return start;
  const end = new Date(o.startDate);
  end.setDate(end.getDate() + o.days - 1);
  return `${start} 〜 ${toSlash(end.toISOString().slice(0, 10))}`;
};

const OrderStatusTab: React.FC<Props> = ({ patient, mode, onOpenOrdersTab }) => {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [period, setPeriod] = useState<Period>('week');

  const allOrders = useMemo(
    () => ORDERS.filter((o) => o.patientId === patient.id),
    [patient.id],
  );

  // 期間フィルタ（既定: 今週 = 直近 7 日）
  const periodFiltered = useMemo(() => {
    if (period === 'all') return allOrders;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === 'today') {
      const todayStr = today.toISOString().slice(0, 10);
      return allOrders.filter((o) => o.startDate === todayStr);
    }
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);
    return allOrders.filter((o) => {
      const d = new Date(o.startDate);
      return d >= weekStart && d <= now;
    });
  }, [allOrders, period]);

  const visibleOrders = useMemo(
    () => (statusFilter === 'all' ? periodFiltered : periodFiltered.filter((o) => o.status === statusFilter)),
    [periodFiltered, statusFilter],
  );

  const counts = useMemo(() => {
    const c: Record<OrderStatus, number> = { 指示済: 0, 実施中: 0, 予定: 0, 中止: 0, 実施済: 0 };
    periodFiltered.forEach((o) => { c[o.status] += 1; });
    return c;
  }, [periodFiltered]);

  const allFilterColor = mode === 'outpatient' ? 'success' : 'primary';

  return (
    <Stack spacing={2}>
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ mb: 1.5 }}>
          <Button
            startIcon={<ListAltIcon />}
            variant="outlined"
            size="small"
            onClick={onOpenOrdersTab}
          >
            指示簿タブを開く
          </Button>
        </Stack>

        {/* AC-1 ステータス別件数サマリ */}
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5, rowGap: 1 }}>
          {ORDER_STATUSES.map((s) => (
            <Chip
              key={s}
              size="small"
              color={STATUS_COLORS[s]}
              label={`${s} ${counts[s]}`}
              variant={counts[s] > 0 ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>

        {/* AC-2 ステータスフィルタ Chip */}
        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" sx={{ mb: 1.5, rowGap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>絞込:</Typography>
          <Chip
            size="small"
            label="全て"
            clickable
            onClick={() => setStatusFilter('all')}
            color={statusFilter === 'all' ? allFilterColor : 'default'}
            variant={statusFilter === 'all' ? 'filled' : 'outlined'}
          />
          {ORDER_STATUSES.map((s) => (
            <Chip
              key={s}
              size="small"
              label={s}
              clickable
              onClick={() => setStatusFilter(s)}
              color={statusFilter === s ? STATUS_COLORS[s] : 'default'}
              variant={statusFilter === s ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>

        {/* AC-3 期間切替 */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>期間:</Typography>
          <ToggleButtonGroup
            size="small"
            value={period}
            exclusive
            onChange={(_, v) => { if (v) setPeriod(v); }}
            color={mode === 'outpatient' ? 'success' : 'primary'}
          >
            {PERIODS.map((p) => (
              <ToggleButton key={p} value={p} sx={{ px: 1.5 }}>
                {PERIOD_LABELS[p]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      </Box>

      {/* AC-4 行表示 / AC-5 未対応マーカー / AC-7 0 件空状態 */}
      <Stack spacing={1}>
        {visibleOrders.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              該当する指示はありません（{PERIOD_LABELS[period]}
              {statusFilter !== 'all' ? ` / ${statusFilter}` : ''}）
            </Typography>
          </Paper>
        ) : (
          visibleOrders.map((o) => (
            <Card key={o.id} variant="outlined">
              <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Chip
                    size="small"
                    color={STATUS_COLORS[o.status]}
                    label={o.status}
                    sx={{ minWidth: 70, justifyContent: 'center' }}
                  />
                  <Chip size="small" variant="outlined" label={o.type} sx={{ minWidth: 60 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      担当医: {o.doctorName} / 受け持ち: {patient.nurse ?? '—'} / {formatPeriod(o)}
                      {o.schedule && o.schedule !== '—' ? ` / ${o.schedule}` : ''}
                    </Typography>
                  </Box>
                  {PENDING_STATUSES.includes(o.status) && (
                    <CircleIcon
                      sx={{ fontSize: 10, color: 'warning.main' }}
                      aria-label="未対応"
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'flex-end' }}>
          表示 {visibleOrders.length} 件 / {PERIOD_LABELS[period]}内 {periodFiltered.length} 件 / 全 {allOrders.length} 件
        </Typography>
      </Stack>
    </Stack>
  );
};

export default OrderStatusTab;
