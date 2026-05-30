import React, { useMemo, useState } from 'react';
import {
  Alert, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Typography, Button, Stack, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Add, Visibility, Print, Search, FilterAltOff } from '@mui/icons-material';
import { DOCUMENTS } from '../../data/mockData';

const DOC_TYPE_COLORS: Record<string, string> = {
  '入院時': '#1e40af', '退院時': '#059669', '隔離拘束': '#dc2626', '行動制限': '#d97706', 'その他': '#64748b',
};

const ALL = 'all';
// 状態の表示順（プルダウン・絞り込み用）
const STATUS_ORDER = ['作成中', '完成', '登録済'];

const DocumentManagement: React.FC = () => {
  // ① 書類タイトル検索 ② 患者 ③ 作成者 ④ 状態
  const [titleQuery, setTitleQuery] = useState('');
  const [patientFilter, setPatientFilter] = useState<string>(ALL);
  const [creatorFilter, setCreatorFilter] = useState<string>(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);

  // プルダウン選択肢は実データ(DOCUMENTS)から重複なく生成
  const patientOptions = useMemo(() => {
    const map = new Map<string, string>(); // patientId -> patientName
    DOCUMENTS.forEach((d) => map.set(d.patientId, d.patientName));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'ja'));
  }, []);
  const creatorOptions = useMemo(
    () => [...new Set(DOCUMENTS.map((d) => d.createdBy))].sort((a, b) => a.localeCompare(b, 'ja')),
    [],
  );
  const statusOptions = useMemo(
    () => [...new Set(DOCUMENTS.map((d) => d.status))].sort(
      (a, b) => STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b),
    ),
    [],
  );

  const filtered = useMemo(() => {
    const q = titleQuery.trim().toLowerCase();
    return DOCUMENTS.filter((d) => {
      if (q && !d.title.toLowerCase().includes(q)) return false;
      if (patientFilter !== ALL && d.patientId !== patientFilter) return false;
      if (creatorFilter !== ALL && d.createdBy !== creatorFilter) return false;
      if (statusFilter !== ALL && d.status !== statusFilter) return false;
      return true;
    });
  }, [titleQuery, patientFilter, creatorFilter, statusFilter]);

  const isFiltered = titleQuery.trim() !== '' || patientFilter !== ALL || creatorFilter !== ALL || statusFilter !== ALL;
  const clearFilters = () => {
    setTitleQuery('');
    setPatientFilter(ALL);
    setCreatorFilter(ALL);
    setStatusFilter(ALL);
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        この画面は調整中です。表示・操作内容は仮実装です。
      </Alert>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">入院に必要な書類の作成・登録・表示</Typography>
        <Button variant="contained" startIcon={<Add />}>新規作成</Button>
      </Stack>

      {/* 絞り込みバー: ① タイトル検索 ② 患者 ③ 作成者 ④ 状態 */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <TextField
          size="small"
          placeholder="書類タイトルで検索"
          value={titleQuery}
          onChange={(e) => setTitleQuery(e.target.value)}
          sx={{ width: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>患者</InputLabel>
          <Select label="患者" value={patientFilter} onChange={(e) => setPatientFilter(e.target.value)}>
            <MenuItem value={ALL}>すべて</MenuItem>
            {patientOptions.map(([id, name]) => (
              <MenuItem key={id} value={id}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>作成者</InputLabel>
          <Select label="作成者" value={creatorFilter} onChange={(e) => setCreatorFilter(e.target.value)}>
            <MenuItem value={ALL}>すべて</MenuItem>
            {creatorOptions.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>状態</InputLabel>
          <Select label="状態" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value={ALL}>すべて</MenuItem>
            {statusOptions.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          size="small"
          startIcon={<FilterAltOff />}
          onClick={clearFilters}
          disabled={!isFiltered}
        >
          クリア
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {filtered.length} / {DOCUMENTS.length} 件
        </Typography>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>書類ID</TableCell>
              <TableCell>患者氏名</TableCell>
              <TableCell>書類タイトル</TableCell>
              <TableCell>種別</TableCell>
              <TableCell>作成日</TableCell>
              <TableCell>作成者</TableCell>
              <TableCell>状態</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((d) => (
              <TableRow key={d.id} hover>
                <TableCell>{d.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{d.patientName}</TableCell>
                <TableCell>{d.title}</TableCell>
                <TableCell>
                  <Chip label={d.type} size="small" sx={{ bgcolor: (DOC_TYPE_COLORS[d.type] || '#64748b') + '18', color: DOC_TYPE_COLORS[d.type], fontWeight: 600 }} />
                </TableCell>
                <TableCell>{d.createdAt}</TableCell>
                <TableCell>{d.createdBy}</TableCell>
                <TableCell>
                  <Chip label={d.status} size="small" color={d.status === '登録済' ? 'success' : d.status === '完成' ? 'info' : 'warning'} variant="outlined" />
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Button size="small" startIcon={<Visibility />}>表示</Button>
                    <Button size="small" startIcon={<Print />}>印刷</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="caption" color="text.secondary">該当する書類はありません</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DocumentManagement;
