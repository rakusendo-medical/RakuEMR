import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, Tabs, Tab, Stack,
} from '@mui/material';
import type { OutpatientStatus } from '../../types';
import { OUTPATIENT_VISITS } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';

type FilterStatus = OutpatientStatus | 'all';

const STATUS_COLOR: Record<OutpatientStatus, { label: string; color: 'default' | 'info' | 'warning' | 'secondary' | 'success' }> = {
  '待機中':   { label: '待機中',   color: 'info' },
  '診察中':   { label: '診察中',   color: 'warning' },
  '会計待ち': { label: '会計待ち', color: 'secondary' },
  '完了':     { label: '完了',     color: 'success' },
};

const FILTER_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'all',    label: 'すべて' },
  { value: '待機中',   label: '待機中' },
  { value: '診察中',   label: '診察中' },
  { value: '会計待ち', label: '会計待ち' },
  { value: '完了',     label: '完了' },
];

const OutpatientList: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedPatient } = useAppStore();
  const [filter, setFilter] = useState<FilterStatus>('all');

  const handleRowClick = (visit: typeof OUTPATIENT_VISITS[0]) => {
    setSelectedPatient({
      id: visit.patientId,
      name: visit.patientName,
      age: visit.age,
      gender: visit.gender,
      wardId: 'ward1' as any,
      roomNumber: '',
      bedLabel: '',
      status: 'stable' as any,
      admitDate: '',
      doctorName: visit.doctorName,
      diagnosis: '',
      department: visit.department,
    } as any);
    navigate(`/karte-outpatient/${visit.patientId}`);
  };

  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

  const filtered = filter === 'all'
    ? OUTPATIENT_VISITS
    : OUTPATIENT_VISITS.filter((v) => v.status === filter);

  const counts = {
    '待機中':   OUTPATIENT_VISITS.filter((v) => v.status === '待機中').length,
    '診察中':   OUTPATIENT_VISITS.filter((v) => v.status === '診察中').length,
    '会計待ち': OUTPATIENT_VISITS.filter((v) => v.status === '会計待ち').length,
    '完了':     OUTPATIENT_VISITS.filter((v) => v.status === '完了').length,
  };

  return (
    <Box>
      {/* ヘッダー情報 */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">{today}</Typography>
        <Stack direction="row" spacing={1}>
          {(Object.entries(counts) as [OutpatientStatus, number][]).map(([status, count]) => (
            <Chip
              key={status}
              label={`${status} ${count}名`}
              size="small"
              color={STATUS_COLOR[status].color}
              variant="outlined"
            />
          ))}
        </Stack>
      </Stack>

      {/* フィルタータブ */}
      <Tabs
        value={filter}
        onChange={(_, v) => setFilter(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {FILTER_TABS.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.value === 'all' ? `すべて (${OUTPATIENT_VISITS.length})` : `${tab.label} (${counts[tab.value as OutpatientStatus] ?? 0})`}
            sx={{ fontSize: '0.8125rem', minHeight: 40 }}
          />
        ))}
      </Tabs>

      {/* テーブル */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>受付番号</TableCell>
              <TableCell>患者氏名</TableCell>
              <TableCell>年齢</TableCell>
              <TableCell>性別</TableCell>
              <TableCell>区分</TableCell>
              <TableCell>診療科</TableCell>
              <TableCell>担当医</TableCell>
              <TableCell>予約時刻</TableCell>
              <TableCell>受付時刻</TableCell>
              <TableCell>状態</TableCell>
              <TableCell>備考</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((v) => (
              <TableRow key={v.id} hover onClick={() => handleRowClick(v)} sx={{ cursor: 'pointer' }}>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{v.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{v.patientName}</TableCell>
                <TableCell>{v.age}歳</TableCell>
                <TableCell>{v.gender === 'M' ? '男' : '女'}</TableCell>
                <TableCell>
                  <Chip
                    label={v.visitType}
                    size="small"
                    variant="outlined"
                    color={v.visitType === '初診' ? 'warning' : 'default'}
                    sx={{ fontSize: '0.6875rem' }}
                  />
                </TableCell>
                <TableCell>{v.department}</TableCell>
                <TableCell>{v.doctorName}</TableCell>
                <TableCell>{v.appointmentTime}</TableCell>
                <TableCell>{v.receptionTime ?? '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={STATUS_COLOR[v.status].label}
                    size="small"
                    color={STATUS_COLOR[v.status].color}
                    variant={v.status === '完了' ? 'outlined' : 'filled'}
                    sx={{ fontSize: '0.6875rem' }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {v.notes ?? ''}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {filtered.length}件表示
      </Typography>
    </Box>
  );
};

export default OutpatientList;
