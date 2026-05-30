import React, { useMemo, useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Typography, Stack, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { ORDERS } from '../../data/mockData';
import type { OrderType } from '../../types';

const ORDER_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  '処方':     { bg: '#dbeafe', color: '#1e40af' },
  '注射':     { bg: '#fce7f3', color: '#be185d' },
  '心理検査': { bg: '#fef3c7', color: '#d97706' },
  'ECT':      { bg: '#fef3c7', color: '#d97706' },
  'リハ':     { bg: '#ccfbf1', color: '#0f766e' },
  '入院定時': { bg: '#dcfce7', color: '#16a34a' },
  'IF':       { bg: '#e0e7ff', color: '#4338ca' },
  '文字':     { bg: '#f1f5f9', color: '#475569' },
};

const TYPE_OPTIONS: OrderType[] = ['処方', '注射', '心理検査', 'ECT', 'リハ', '入院定時', 'IF', '文字'];

interface Props {
  patientId?: string;
}

const OrderManagement: React.FC<Props> = ({ patientId }) => {
  const [patientFilter, setPatientFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<OrderType | 'all'>('all');

  // 患者プルダウン候補（オーダのある患者のみ）
  const patientOptions = useMemo(() => {
    const map = new Map<string, string>();
    ORDERS.forEach((o) => { if (!map.has(o.patientId)) map.set(o.patientId, o.patientName); });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, []);

  const data = useMemo(() => {
    return ORDERS
      .filter((o) => (patientId ? o.patientId === patientId : true))
      .filter((o) => (patientId || patientFilter === 'all' ? true : o.patientId === patientFilter))
      .filter((o) => (typeFilter === 'all' ? true : o.type === typeFilter));
  }, [patientId, patientFilter, typeFilter]);

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
        {!patientId && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>患者</InputLabel>
            <Select label="患者" value={patientFilter} onChange={(e) => setPatientFilter(e.target.value)}>
              <MenuItem value="all">全患者</MenuItem>
              {patientOptions.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.id} {p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>種類</InputLabel>
          <Select
            label="種類"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as OrderType | 'all')}
          >
            <MenuItem value="all">全種類</MenuItem>
            {TYPE_OPTIONS.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>オーダID</TableCell>
              {!patientId && <TableCell>患者氏名</TableCell>}
              <TableCell>種類</TableCell>
              <TableCell>内容</TableCell>
              <TableCell>スケジュール</TableCell>
              <TableCell>開始日</TableCell>
              <TableCell>日数</TableCell>
              <TableCell>状態</TableCell>
              <TableCell>指示医</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((o) => {
              const typeStyle = ORDER_TYPE_COLORS[o.type] || ORDER_TYPE_COLORS['文字'];
              return (
                <TableRow key={o.id} hover>
                  <TableCell>{o.id}</TableCell>
                  {!patientId && <TableCell sx={{ fontWeight: 600 }}>{o.patientName}</TableCell>}
                  <TableCell>
                    <Chip label={o.type} size="small" sx={{ bgcolor: typeStyle.bg, color: typeStyle.color, fontWeight: 600 }} />
                  </TableCell>
                  <TableCell>{o.content}</TableCell>
                  <TableCell>{o.schedule}</TableCell>
                  <TableCell>{o.startDate}</TableCell>
                  <TableCell>{o.days > 0 ? `${o.days}日` : '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={o.status}
                      size="small"
                      color={o.status === '実施中' ? 'success' : o.status === '予定' ? 'warning' : o.status === '中止' ? 'error' : 'info'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{o.doctorName}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {data.length}件
      </Typography>
    </Box>
  );
};

export default OrderManagement;
