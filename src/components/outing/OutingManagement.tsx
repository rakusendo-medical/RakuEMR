import React, { useState } from 'react';
import {
  Box, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, Typography, Button, Stack, Card, CardContent,
  Grid, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { OUTING_RECORDS } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';

const OutingManagement: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { showSnackbar } = useAppStore();

  const activeOutings = OUTING_RECORDS.filter((o) => o.status === '許可' && !o.returnedAt);

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
              {OUTING_RECORDS.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{o.patientName}</TableCell>
                  <TableCell>{o.patientId}</TableCell>
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
                        {o.patientName} <Typography component="span" variant="caption" color="text.secondary">({o.patientId})</Typography>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {o.type} | {o.startDatetime} ～ {o.endDatetime}
                      </Typography>
                    </Box>
                    <Button variant="contained" color="secondary" onClick={() => showSnackbar(`${o.patientName}の帰院を記録しました`, 'success')}>
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
            <Grid item xs={6}><TextField label="患者番号" fullWidth /></Grid>
            <Grid item xs={6}><TextField label="患者氏名" fullWidth InputProps={{ readOnly: true }} /></Grid>
            <Grid item xs={12}>
              <FormControl>
                <FormLabel sx={{ fontSize: '0.8125rem' }}>申請方法</FormLabel>
                <RadioGroup row defaultValue="application">
                  <FormControlLabel value="application" control={<Radio size="small" />} label="申請・許可" />
                  <FormControlLabel value="direct" control={<Radio size="small" />} label="医師直接許可" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField label="種別" select fullWidth defaultValue="外出">
                <MenuItem value="外出">外出</MenuItem>
                <MenuItem value="外泊">外泊</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}><TextField label="開始日時" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}><TextField label="終了日時" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}><TextField label="備考" fullWidth /></Grid>
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Button variant="outlined">キャンセル</Button>
                <Button variant="contained" onClick={() => showSnackbar('外出外泊申請を登録しました', 'success')}>申請</Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default OutingManagement;
