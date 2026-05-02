import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, TextField, InputAdornment, FormControl, InputLabel,
  MenuItem, Select, TableSortLabel, Stack, useMediaQuery,
} from '@mui/material';
import { Search, Male, Female } from '@mui/icons-material';
import type { WardId } from '../../types';
import { WARD_LABELS } from '../../types';
import { PATIENTS } from '../../data/mockData';
import StatusBadge from '../common/StatusBadge';
import WardFilterTabs from '../common/WardFilterTabs';
import { useAppStore } from '../../stores/useAppStore';

type SortKey = 'wardRoom' | 'admitDate' | 'doctor' | null;
type SortDir = 'asc' | 'desc';

const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const daysBetween = (admitISO: string, baseISO: string): number => {
  const a = new Date(admitISO);
  const b = new Date(baseISO);
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedPatient } = useAppStore();
  const [wardFilter, setWardFilter] = useState<WardId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [baseDate, setBaseDate] = useState<string>(todayISO());
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const isWide = useMediaQuery('(min-width:1100px)');

  // 主治医プルダウン候補（PATIENTS から重複排除して動的生成）
  const doctorOptions = useMemo(() => {
    const set = new Set<string>();
    PATIENTS.forEach((p) => p.doctorName && set.add(p.doctorName));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    let list = PATIENTS.slice();
    // 在院判定: admitDate <= baseDate（discharged は除外。Patient.admissionState 未指定は in 院扱い）
    list = list.filter((p) => {
      if (p.admissionState === 'discharged') return false;
      return p.admitDate <= baseDate;
    });
    if (wardFilter !== 'all') list = list.filter((p) => p.wardId === wardFilter);
    if (doctorFilter !== 'all') list = list.filter((p) => p.doctorName === doctorFilter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.doctorName.includes(q) ||
        (p.diagnosis ?? '').includes(q)
      );
    }
    return list;
  }, [wardFilter, query, baseDate, doctorFilter]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const arr = filtered.slice();
    const sign = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'wardRoom': {
          const aw = a.wardId.localeCompare(b.wardId);
          if (aw !== 0) return aw * sign;
          return a.roomNumber.localeCompare(b.roomNumber, 'ja', { numeric: true }) * sign;
        }
        case 'admitDate':
          // asc = 入院日昇順（古→新）= 日数降順（spec の初期動作）
          // desc = 入院日降順（新→古）= 日数昇順
          return a.admitDate.localeCompare(b.admitDate) * sign;
        case 'doctor':
          return a.doctorName.localeCompare(b.doctorName, 'ja') * sign;
        default:
          return 0;
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: Exclude<SortKey, null>) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
      return;
    }
    if (sortDir === 'asc') {
      setSortDir('desc');
      return;
    }
    // asc → desc → 解除
    setSortKey(null);
    setSortDir('asc');
  };

  const navigateToKarte = (patientId: string) => {
    const patient = PATIENTS.find((p) => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient);
      navigate(`/karte-alpha/${patientId}`);
    }
  };

  const wardLabel = (wardId: WardId) => WARD_LABELS[wardId];

  return (
    <Box>
      <WardFilterTabs
        value={wardFilter}
        onChange={(v) => { setWardFilter(v); setQuery(''); }}
      />
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 1 }}
      >
        <TextField
          label="基準日"
          type="date"
          size="small"
          value={baseDate}
          onChange={(e) => setBaseDate(e.target.value || todayISO())}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 160 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>主治医</InputLabel>
          <Select
            label="主治医"
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
          >
            <MenuItem value="all">全主治医</MenuItem>
            {doctorOptions.map((d) => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <TextField
          placeholder="氏名・患者番号・担当医・診断名"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          size="small"
          sx={{ width: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortKey === 'wardRoom'}
                  direction={sortKey === 'wardRoom' ? sortDir : 'asc'}
                  onClick={() => handleSort('wardRoom')}
                >
                  病棟・病室
                </TableSortLabel>
              </TableCell>
              <TableCell>患者番号</TableCell>
              <TableCell>氏名（年齢）</TableCell>
              <TableCell>状態</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortKey === 'admitDate'}
                  direction={sortKey === 'admitDate' ? sortDir : 'asc'}
                  onClick={() => handleSort('admitDate')}
                >
                  入院日（日数）
                </TableSortLabel>
              </TableCell>
              {isWide && <TableCell>ICD10・病名</TableCell>}
              <TableCell>ベッド</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortKey === 'doctor'}
                  direction={sortKey === 'doctor' ? sortDir : 'asc'}
                  onClick={() => handleSort('doctor')}
                >
                  主治医
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((p) => (
              <TableRow
                key={p.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigateToKarte(p.id)}
              >
                <TableCell>
                  {wardLabel(p.wardId)} / {p.roomNumber}
                </TableCell>
                <TableCell
                  onClick={(e) => { e.stopPropagation(); navigateToKarte(p.id); }}
                  sx={{
                    color: 'primary.main',
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {p.id}
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {p.gender === 'M' ? (
                      <Male sx={{ fontSize: 16, color: '#3b82f6' }} />
                    ) : (
                      <Female sx={{ fontSize: 16, color: '#ec4899' }} />
                    )}
                    <Typography component="span" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                      {p.name}
                    </Typography>
                    <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                      （{p.age}歳）
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell>
                  {p.admitDate}
                  <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.75rem', ml: 0.5 }}>
                    ({daysBetween(p.admitDate, baseDate)}日目)
                  </Typography>
                </TableCell>
                {isWide && (
                  <TableCell sx={{ color: 'text.secondary' }}>{p.diagnosis ?? '—'}</TableCell>
                )}
                <TableCell>{p.bedLabel}</TableCell>
                <TableCell>{p.doctorName}</TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={isWide ? 8 : 7}
                  sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}
                >
                  該当する患者が見つかりませんでした
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1, display: 'block', fontWeight: 600 }}
      >
        {sorted.length}件表示
      </Typography>
    </Box>
  );
};

export default PatientList;
