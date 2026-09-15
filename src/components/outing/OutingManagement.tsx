import React, { useState, useMemo } from 'react';
import {
  Box, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, Typography, Button, Stack, Card, CardContent,
  Grid, TextField, MenuItem, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
} from '@mui/material';
import { OUTING_RECORDS, PATIENTS, patientNumberOf } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import type { OutingRecord } from '../../types';

// 'YYYY-MM-DDTHH:mm'（datetime-local）→ 'YYYY-MM-DD HH:mm'（OutingRecord 形式）
const toRecordDt = (v: string) => v.replace('T', ' ');
const nowRecordDt = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const OutingManagement: React.FC = () => {
  const [tab, setTab] = useState(0);
  const { showSnackbar, dynamicOutings, outingReturns, addOuting, returnOuting } = useAppStore();

  // seed + 動的登録分に、帰院上書き（outingReturns）を適用した実効一覧。
  const outings = useMemo<OutingRecord[]>(
    () => [...OUTING_RECORDS, ...dynamicOutings].map((o) =>
      outingReturns[o.id] ? { ...o, returnedAt: outingReturns[o.id] } : o),
    [dynamicOutings, outingReturns],
  );
  const activeOutings = outings.filter((o) => o.status === '許可' && !o.returnedAt);

  // ===== 新規申請フォーム（制御） =====
  const [patientNumber, setPatientNumber] = useState('');
  const [method, setMethod] = useState<'application' | 'direct'>('application');
  const [type, setType] = useState<'外出' | '外泊'>('外出');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const matched = PATIENTS.find((p) => p.patientNumber === patientNumber.trim());

  const resetForm = () => {
    setPatientNumber(''); setMethod('application'); setType('外出'); setStartAt(''); setEndAt('');
  };
  const handleApply = () => {
    if (!matched) { showSnackbar('患者番号に一致する患者が見つかりません', 'warning'); return; }
    if (!startAt || !endAt) { showSnackbar('開始日時・終了日時を入力してください', 'warning'); return; }
    const rec: OutingRecord = {
      id: `OUT-${Date.now()}`,
      patientId: matched.id,
      patientName: matched.name,
      type,
      status: '許可',
      startDatetime: toRecordDt(startAt),
      endDatetime: toRecordDt(endAt),
      wardId: matched.wardId,
      method,
      approvedBy: '（申請登録）',
    };
    addOuting(rec);
    showSnackbar(`${matched.name}の${type}を登録しました（病棟マップに${type === '外泊' ? '外泊' : '外出'}バッジが付きます）`, 'success');
    resetForm();
    setTab(0);
  };

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="外出外泊一覧" />
        <Tab label="帰院管理" />
        <Tab label="新規申請" />
      </Tabs>

      {tab === 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>患者氏名</TableCell>
                <TableCell>患者番号</TableCell>
                <TableCell>種別</TableCell>
                <TableCell>申請状態</TableCell>
                <TableCell>方法</TableCell>
                <TableCell>開始</TableCell>
                <TableCell>終了</TableCell>
                <TableCell>病棟</TableCell>
                <TableCell>帰院</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {outings.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{o.patientName}</TableCell>
                  <TableCell>{patientNumberOf(o.patientId)}</TableCell>
                  <TableCell>
                    <Chip label={o.type} size="small" color={o.type === '外泊' ? 'info' : 'success'} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={o.status} size="small" color={o.status === '許可' ? 'success' : o.status === '申請中' ? 'warning' : 'error'} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{o.method === 'application' ? '申請・許可' : '医師直接許可'}</Typography>
                  </TableCell>
                  <TableCell>{o.startDatetime}</TableCell>
                  <TableCell>{o.endDatetime}</TableCell>
                  <TableCell>{o.wardId === 'ward1' ? '第１病棟' : '第２病棟'}</TableCell>
                  <TableCell>{o.returnedAt || (o.status === '許可' && !o.returnedAt ? '外出中' : '—')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 1 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>外出外泊中の患者（帰院入力可能）</Typography>
          {activeOutings.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.disabled">現在外出外泊中の患者はいません</Typography>
            </Paper>
          ) : (
            <Stack spacing={1}>
              {activeOutings.map((o) => (
                <Card key={o.id}>
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {o.patientName} <Typography component="span" variant="caption" color="text.secondary">({patientNumberOf(o.patientId)})</Typography>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {o.type} | {o.startDatetime} ～ {o.endDatetime}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained" color="secondary"
                      onClick={() => { returnOuting(o.id, nowRecordDt()); showSnackbar(`${o.patientName}の帰院を記録しました（${o.type}バッジが外れます）`, 'success'); }}
                    >
                      帰院入力
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {tab === 2 && (
        <Paper variant="outlined" sx={{ p: 3, maxWidth: 600 }}>
          <Typography variant="subtitle1" gutterBottom>外出外泊申請</Typography>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={6}>
              <TextField label="患者番号" fullWidth value={patientNumber} onChange={(e) => setPatientNumber(e.target.value)} placeholder="例: 00010001" />
            </Grid>
            <Grid item xs={6}>
              <TextField label="患者氏名" fullWidth value={matched?.name ?? ''} InputProps={{ readOnly: true }} helperText={patientNumber && !matched ? '該当患者なし' : ' '} />
            </Grid>
            <Grid item xs={12}>
              <FormControl>
                <FormLabel sx={{ fontSize: '0.8125rem' }}>申請方法</FormLabel>
                <RadioGroup row value={method} onChange={(e) => setMethod(e.target.value as 'application' | 'direct')}>
                  <FormControlLabel value="application" control={<Radio size="small" />} label="申請・許可" />
                  <FormControlLabel value="direct" control={<Radio size="small" />} label="医師直接許可" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField label="種別" select fullWidth value={type} onChange={(e) => setType(e.target.value as '外出' | '外泊')}>
                <MenuItem value="外出">外出</MenuItem>
                <MenuItem value="外泊">外泊</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}><TextField label="開始日時" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={startAt} onChange={(e) => setStartAt(e.target.value)} /></Grid>
            <Grid item xs={6}><TextField label="終了日時" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={endAt} onChange={(e) => setEndAt(e.target.value)} /></Grid>
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Button variant="outlined" onClick={resetForm}>キャンセル</Button>
                <Button variant="contained" onClick={handleApply}>申請</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default OutingManagement;
