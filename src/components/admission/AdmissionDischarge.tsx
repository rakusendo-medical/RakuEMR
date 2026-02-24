import React, { useState } from 'react';
import {
  Box, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, Typography, TextField, Button, Stack, Grid,
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Select, MenuItem,
} from '@mui/material';
import {
  ADMISSION_ORDERS, TRANSFER_HISTORY, ADMISSION_HISTORY,
} from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';

const AdmissionDischarge: React.FC = () => {
  const [tab, setTab] = useState(0);
  const { showSnackbar } = useAppStore();

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="入退院一覧" />
        <Tab label="入院歴" />
        <Tab label="移動歴" />
        <Tab label="新規入退院指示" />
      </Tabs>

      {tab === 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>患者番号</TableCell>
                <TableCell>患者氏名</TableCell>
                <TableCell>種別</TableCell>
                <TableCell>状態</TableCell>
                <TableCell>予定日</TableCell>
                <TableCell>主治医</TableCell>
                <TableCell>病室</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ADMISSION_ORDERS.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>{a.patientId}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{a.patientName}</TableCell>
                  <TableCell>
                    <Chip label={a.type} size="small" color={a.type === '入院' ? 'primary' : 'error'} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={a.status}
                      size="small"
                      color={a.status === '手続完了' ? 'success' : a.status === '手続中' ? 'info' : 'warning'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{a.scheduledDate}</TableCell>
                  <TableCell>{a.doctorName}</TableCell>
                  <TableCell>{a.roomNumber === '—' ? '未割当' : `${a.roomNumber}-${a.bedLabel}`}</TableCell>
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
                <TableCell>患者番号</TableCell>
                <TableCell>患者氏名</TableCell>
                <TableCell>入院日</TableCell>
                <TableCell>退院日</TableCell>
                <TableCell>病棟</TableCell>
                <TableCell>病室</TableCell>
                <TableCell>主治医</TableCell>
                <TableCell>状態</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ADMISSION_HISTORY.map((h) => (
                <TableRow key={h.id} hover>
                  <TableCell>{h.patientId}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{h.patientName}</TableCell>
                  <TableCell>{h.admitDate}</TableCell>
                  <TableCell>{h.dischargeDate || '—'}</TableCell>
                  <TableCell>{h.wardId === 'ward1' ? '第１病棟' : '第２病棟'}</TableCell>
                  <TableCell>{h.roomNumber}</TableCell>
                  <TableCell>{h.doctorName}</TableCell>
                  <TableCell>
                    <Chip label={h.status} size="small" color={h.status === '入院中' ? 'primary' : 'default'} variant="outlined" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 2 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>日付</TableCell>
                <TableCell>患者氏名</TableCell>
                <TableCell>移動元</TableCell>
                <TableCell>移動先</TableCell>
                <TableCell>理由</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {TRANSFER_HISTORY.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>{t.date}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t.patientName}</TableCell>
                  <TableCell>{t.fromRoom}</TableCell>
                  <TableCell>{t.toRoom}</TableCell>
                  <TableCell>{t.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 3 && (
        <Paper variant="outlined" sx={{ p: 3, maxWidth: 600 }}>
          <Typography variant="subtitle1" gutterBottom>入退院指示入力</Typography>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <FormControl>
                <FormLabel sx={{ fontSize: '0.8125rem' }}>種別</FormLabel>
                <RadioGroup row defaultValue="admission">
                  <FormControlLabel value="admission" control={<Radio size="small" />} label="入院" />
                  <FormControlLabel value="discharge" control={<Radio size="small" />} label="退院" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField label="患者番号" fullWidth placeholder="患者番号を入力" /></Grid>
            <Grid item xs={6}><TextField label="患者氏名" fullWidth placeholder="ORCA連携で自動取得" InputProps={{ readOnly: true }} /></Grid>
            <Grid item xs={6}><TextField label="予定日" type="date" fullWidth defaultValue="2026-02-24" InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}>
              <TextField label="主治医" select fullWidth defaultValue="田村 医師">
                <MenuItem value="田村 医師">田村 医師</MenuItem>
                <MenuItem value="岸本 医師">岸本 医師</MenuItem>
                <MenuItem value="森田 医師">森田 医師</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField label="病棟" select fullWidth defaultValue="ward1">
                <MenuItem value="ward1">第１病棟</MenuItem>
                <MenuItem value="ward2">第２病棟</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField label="病室・ベッド" select fullWidth defaultValue="">
                <MenuItem value="">選択してください</MenuItem>
                <MenuItem value="102-B">102号室 B（空床）</MenuItem>
                <MenuItem value="205-A">205号室 A（空床）</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField label="備考" multiline rows={2} fullWidth /></Grid>
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Button variant="outlined">キャンセル</Button>
                <Button variant="contained" onClick={() => showSnackbar('入退院指示を登録しました', 'success')}>登録</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default AdmissionDischarge;
