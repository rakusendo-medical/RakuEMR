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
import { useAppStore } from '../../stores/useAppStore';
import SectionHeader from '../common/SectionHeader';
import OrderEditDialog from '../orders/OrderEditDialog';
import type { KarteMode } from './KartePage';

// 指示簿の種別表示は「定期／臨時／IF／文字」にグルーピングする（オーダ内部の型はそのまま）。
//   定期: 入院定時・治療形態(リハビリ)／臨時: 処方・注射・検査・画像・心理検査・ECT／IF: IF／文字: テキスト
type OrderGroup = '定期' | '臨時' | 'IF' | '文字';
const ORDER_TYPE_LABEL: Record<OrderType, OrderGroup> = {
  入院定時: '定期',
  リハビリ: '定期',
  処方: '臨時',
  注射: '臨時',
  検査: '臨時',
  画像: '臨時',
  心理検査: '臨時',
  ECT: '臨時',
  IF: 'IF',
  文字: '文字',
};

const GROUP_COLORS: Record<OrderGroup, { bg: string; color: string }> = {
  定期: { bg: '#dbeafe', color: '#1e40af' },
  臨時: { bg: '#fce7f3', color: '#be185d' },
  IF: { bg: '#e0e7ff', color: '#4338ca' },
  文字: { bg: '#f1f5f9', color: '#475569' },
};

type TypeFilter = 'all' | OrderGroup;
type StatusFilter = 'all' | OrderStatus;

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: '全て' },
  { key: '定期', label: '定期' },
  { key: '臨時', label: '臨時' },
  { key: 'IF', label: 'IF' },
  { key: '文字', label: '文字' },
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
  /** IF オーダ行クリック時に呼ばれる。KartePage 側で IFオーダタブへ遷移し、対象オーダを表示する。 */
  onOpenIfOrder: (orderId: string) => void;
}

export default function OrdersTab({ patient, mode, onOpenOrderStatusTab, onOpenIfOrder }: OrdersTabProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  // 臨時オーダ編集ダイアログで編集中のオーダ id。
  const [editingId, setEditingId] = useState<string | null>(null);

  const dynamicOrders = useAppStore((s) => s.dynamicOrders);
  const orderKarteNos = useAppStore((s) => s.orderKarteNos);
  const orderOverrides = useAppStore((s) => s.orderOverrides);
  const setOrderOverride = useAppStore((s) => s.setOrderOverride);

  // 指示簿は「指示済みオーダの閲覧一覧」。seed の静的 ORDERS に、オーダ入力（アクションバー起動）で
  // 追加された dynamicOrders を合成して当該患者分を表示する（新規登録の導線は指示簿には置かない）。
  // 臨時オーダ編集（orderOverrides）があれば表示時に上書き適用する（seed/dynamic は破壊しない）。
  const all = useMemo(
    () =>
      [...ORDERS, ...dynamicOrders]
        .filter((o) => o.patientId === patient.id)
        .map((o) => {
          const ov = orderOverrides[o.id];
          if (!ov) return o;
          return {
            ...o,
            startDate: ov.startDate ?? o.startDate,
            remark: ov.remark ?? o.remark,
            content: ov.content ?? o.content,
            days: ov.days ?? o.days,
            schedule: ov.schedule ?? o.schedule,
          };
        }),
    [patient.id, dynamicOrders, orderOverrides],
  );
  const editingOrder = editingId ? all.find((o) => o.id === editingId) ?? null : null;
  const filtered = useMemo(() => {
    return all
      .filter((o) => typeFilter === 'all' || ORDER_TYPE_LABEL[o.type] === typeFilter)
      .filter((o) => statusFilter === 'all' || o.status === statusFilter)
      .slice()
      .sort((a, b) => (a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0));
  }, [all, typeFilter, statusFilter]);

  const accent: 'success' | 'primary' = mode === 'outpatient' ? 'success' : 'primary';
  const sectionHeaderColor = mode === 'outpatient' ? '#15803d' : '#1e3a5f';

  return (
    <Stack spacing={2}>
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
                <TableCell sx={{ width: 84 }}>カルテNo</TableCell>
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
                const group = ORDER_TYPE_LABEL[o.type];
                const t = GROUP_COLORS[group];
                const editable = group === '臨時';
                const ifRow = group === 'IF';
                const clickable = editable || ifRow;
                return (
                  <TableRow
                    key={o.id}
                    hover
                    onClick={editable ? () => setEditingId(o.id) : ifRow ? () => onOpenIfOrder(o.id) : undefined}
                    sx={clickable ? { cursor: 'pointer' } : undefined}
                    title={editable ? 'クリックで内容を確認・変更' : ifRow ? 'クリックで IFオーダタブを開く' : undefined}
                  >
                    <TableCell>
                      <Typography variant="caption" color={orderKarteNos[o.id] ? 'text.primary' : 'text.disabled'}>
                        {orderKarteNos[o.id] ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={group}
                        size="small"
                        sx={{ bgcolor: t.bg, color: t.color, fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'pre-line' }}>{o.content}</TableCell>
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

      {/* 臨時オーダの確認・変更ダイアログ（作成中のオーダと同じ形式で編集） */}
      <OrderEditDialog
        open={editingOrder !== null}
        patient={patient}
        order={editingOrder}
        override={editingId ? orderOverrides[editingId] : undefined}
        onClose={() => setEditingId(null)}
        onSave={(patch) => { if (editingId) setOrderOverride(editingId, patch); }}
      />
    </Stack>
  );
}
