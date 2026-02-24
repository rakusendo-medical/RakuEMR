import React, { useState } from 'react';
import {
  Box, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, Typography, Card, CardContent, Stack, Button, Grid,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { REHAB_ORDERS, REHAB_DAILY_REPORTS, REHAB_EVALUATIONS } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';

const Rehabilitation: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [evalDialog, setEvalDialog] = useState(false);
  const { showSnackbar } = useAppStore();

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="リハビリ指示一覧" />
        <Tab label="日報一覧" />
        <Tab label="評価" />
      </Tabs>

      {tab === 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>患者氏名</TableCell>
                <TableCell>内容</TableCell>
                <TableCell>指示医</TableCell>
                <TableCell>開始日</TableCell>
                <TableCell>頻度</TableCell>
                <TableCell>状態</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {REHAB_ORDERS.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{r.patientName}</TableCell>
                  <TableCell>{r.content}</TableCell>
                  <TableCell>{r.doctorName}</TableCell>
                  <TableCell>{r.startDate}</TableCell>
                  <TableCell>{r.frequency}</TableCell>
                  <TableCell><Chip label={r.status} size="small" color={r.status === '実施中' ? 'success' : r.status === '指示済' ? 'warning' : 'default'} variant="outlined" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 1 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>日付</TableCell>
                <TableCell>患者</TableCell>
                <TableCell>出席</TableCell>
                <TableCell>内容</TableCell>
                <TableCell>担当OT</TableCell>
                <TableCell>備考</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {REHAB_DAILY_REPORTS.map((r) => {
                const patient = REHAB_ORDERS.find((o) => o.id === r.rehabOrderId);
                return (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.date}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{patient?.patientName || r.patientId}</TableCell>
                    <TableCell><Chip label={r.attendance ? '出席' : '欠席'} size="small" color={r.attendance ? 'success' : 'error'} variant="outlined" /></TableCell>
                    <TableCell>{r.content}</TableCell>
                    <TableCell>{r.therapist}</TableCell>
                    <TableCell>{r.notes || '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 2 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">定期評価一覧</Typography>
            <Button variant="contained" onClick={() => setEvalDialog(true)}>評価入力</Button>
          </Stack>
          <Stack spacing={1.5}>
            {REHAB_EVALUATIONS.map((e) => {
              const patient = REHAB_ORDERS.find((o) => o.id === e.rehabOrderId);
              return (
                <Card key={e.id}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2">{patient?.patientName} — {e.date}</Typography>
                      <Chip label={e.type} size="small" variant="outlined" />
                    </Stack>
                    <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{e.content}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>評価者: {e.evaluator}</Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
          <Dialog open={evalDialog} onClose={() => setEvalDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>評価入力</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 0 }}>
                <Grid item xs={6}><TextField label="患者" select fullWidth defaultValue="">
                  {REHAB_ORDERS.map((r) => <option key={r.id} value={r.patientId}>{r.patientName}</option>)}
                </TextField></Grid>
                <Grid item xs={6}><TextField label="評価種別" select fullWidth defaultValue="定期">
                  <option value="定期">定期</option><option value="開始時">開始時</option><option value="終了時">終了時</option>
                </TextField></Grid>
                <Grid item xs={12}><TextField label="評価内容" multiline rows={4} fullWidth /></Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEvalDialog(false)}>キャンセル</Button>
              <Button variant="contained" onClick={() => { setEvalDialog(false); showSnackbar('評価を登録しました', 'success'); }}>登録</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Box>
  );
};

export default Rehabilitation;
