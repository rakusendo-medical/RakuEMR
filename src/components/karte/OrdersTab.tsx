import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import type { Order, OrderStatus, OrderType, Patient } from '../../types';
import { ORDERS } from '../../data/mockData';
import SectionHeader from '../common/SectionHeader';
import type { KarteMode } from './KartePage';

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  処方: '処方',
  注射: '注射',
  心理検査: '心理検査',
  ECT: 'ECT',
  入院定時: '入院定時',
  IF: 'IF',
  文字: 'テキスト',
};

const ORDER_TYPE_COLORS: Record<OrderType, { bg: string; color: string }> = {
  処方: { bg: '#dbeafe', color: '#1e40af' },
  注射: { bg: '#fce7f3', color: '#be185d' },
  心理検査: { bg: '#fef3c7', color: '#d97706' },
  ECT: { bg: '#fef3c7', color: '#d97706' },
  入院定時: { bg: '#dcfce7', color: '#16a34a' },
  IF: { bg: '#e0e7ff', color: '#4338ca' },
  文字: { bg: '#f1f5f9', color: '#475569' },
};

type TypeFilter = 'all' | OrderType;
type StatusFilter = 'all' | OrderStatus;

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: '全て' },
  { key: '処方', label: '処方' },
  { key: '注射', label: '注射' },
  { key: '心理検査', label: '心理検査' },
  { key: 'ECT', label: 'ECT' },
  { key: '入院定時', label: '入院定時' },
  { key: 'IF', label: 'IF' },
  { key: '文字', label: 'テキスト' },
];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '全て' },
  { key: '指示済', label: '指示済' },
  { key: '実施中', label: '実施中' },
  { key: '予定', label: '予定' },
  { key: '中止', label: '中止' },
  { key: '実施済', label: '実施済' },
];

function statusChipColor(s: OrderStatus): 'success' | 'warning' | 'error' | 'info' | 'default' {
  switch (s) {
    case '実施中':
      return 'success';
    case '予定':
      return 'warning';
    case '中止':
      return 'error';
    case '指示済':
      return 'info';
    case '実施済':
      return 'default';
  }
}

function periodText(o: Order): string {
  if (o.days <= 0) return `${o.startDate}〜（継続）`;
  return `${o.startDate}〜（${o.days}日）`;
}

interface OrdersTabProps {
  patient: Patient;
  mode: KarteMode;
  /** 「指示状況タブを開く」クリック時に呼ばれる。KartePage 側で `commitTab('order-status')` 相当へ繋ぐ */
  onOpenOrderStatusTab: () => void;
}

export default function OrdersTab({ patient, mode, onOpenOrderStatusTab }: OrdersTabProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const all = useMemo(
    () => ORDERS.filter((o) => o.patientId === patient.id),
    [patient.id],
  );
  const filtered = useMemo(() => {
    return all
      .filter((o) => typeFilter === 'all' || o.type === typeFilter)
      .filter((o) => statusFilter === 'all' || o.status === statusFilter)
      .slice()
      .sort((a, b) => (a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0));
  }, [all, typeFilter, statusFilter]);

  const accent: 'success' | 'primary' = mode === 'outpatient' ? 'success' : 'primary';
  const sectionHeaderColor = mode === 'outpatient' ? '#15803d' : '#1e3a5f';

  return (
    <Stack spacing={2}>
      <Box>
        <SectionHeader title="指示簿" color={sectionHeaderColor} />
        <Paper variant="outlined" sx={{ p: 2, borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={1}
            >
              <Typography variant="body2" color="text.secondary">
                {filtered.length} 件
                {filtered.length !== all.length && (
                  <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                    （全 {all.length} 件中）
                  </Typography>
                )}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                color={accent}
                startIcon={<LaunchIcon />}
                onClick={onOpenOrderStatusTab}
              >
                指示状況タブを開く
              </Button>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                種別:
              </Typography>
              {TYPE_FILTERS.map((f) => (
                <Chip
                  key={f.key}
                  size="small"
                  label={f.label}
                  color={typeFilter === f.key ? accent : 'default'}
                  variant={typeFilter === f.key ? 'filled' : 'outlined'}
                  onClick={() => setTypeFilter(f.key)}
                />
              ))}
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                状態:
              </Typography>
              {STATUS_FILTERS.map((f) => (
                <Chip
                  key={f.key}
                  size="small"
                  label={f.label}
                  color={statusFilter === f.key ? accent : 'default'}
                  variant={statusFilter === f.key ? 'filled' : 'outlined'}
                  onClick={() => setStatusFilter(f.key)}
                />
              ))}
            </Stack>
          </Stack>
        </Paper>
      </Box>

      {filtered.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {all.length === 0
              ? 'この患者にはオーダーがありません。'
              : '条件に該当するオーダーがありません。'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 110 }}>種別</TableCell>
                <TableCell>内容</TableCell>
                <TableCell sx={{ width: 160 }}>スケジュール</TableCell>
                <TableCell sx={{ width: 110 }}>状態</TableCell>
                <TableCell sx={{ width: 200 }}>期間</TableCell>
                <TableCell sx={{ width: 140 }}>担当医</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((o) => {
                const t = ORDER_TYPE_COLORS[o.type];
                return (
                  <TableRow key={o.id} hover>
                    <TableCell>
                      <Chip
                        label={ORDER_TYPE_LABEL[o.type]}
                        size="small"
                        sx={{ bgcolor: t.bg, color: t.color, fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>{o.content}</TableCell>
                    <TableCell>{o.schedule}</TableCell>
                    <TableCell>
                      <Chip
                        label={o.status}
                        size="small"
                        color={statusChipColor(o.status)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{periodText(o)}</TableCell>
                    <TableCell>{o.doctorName}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
