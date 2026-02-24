import React, { useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Typography, Button, Stack, TextField, MenuItem, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import type { WardId, BehaviorRangeLevel } from '../../types';
import { BEHAVIOR_RANGES } from '../../data/mockData';
import WardFilterTabs from '../common/WardFilterTabs';
import { useAppStore } from '../../stores/useAppStore';

const LEVEL_COLORS: Record<BehaviorRangeLevel, string> = {
  '病棟内': '#dc2626', '院内': '#d97706', '院外許可あり': '#16a34a', '開放病棟': '#3b82f6',
};

const BehaviorRange: React.FC = () => {
  const [wardFilter, setWardFilter] = useState<WardId | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { showSnackbar } = useAppStore();
  const filtered = wardFilter === 'all' ? BEHAVIOR_RANGES : BEHAVIOR_RANGES.filter((b) => b.wardId === wardFilter);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">行動範囲が設定されている患者の一覧</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>新規指示</Button>
      </Stack>
      <WardFilterTabs value={wardFilter} onChange={setWardFilter} />
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>患者氏名</TableCell>
              <TableCell>患者番号</TableCell>
              <TableCell>行動範囲</TableCell>
              <TableCell>開始日</TableCell>
              <TableCell>病棟</TableCell>
              <TableCell>指示医</TableCell>
              <TableCell>備考</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((b) => (
              <TableRow key={b.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{b.patientName}</TableCell>
                <TableCell>{b.patientId}</TableCell>
                <TableCell>
                  <Chip label={b.level} size="small" sx={{ bgcolor: LEVEL_COLORS[b.level] + '18', color: LEVEL_COLORS[b.level], fontWeight: 600, border: `1px solid ${LEVEL_COLORS[b.level]}30` }} />
                </TableCell>
                <TableCell>{b.startDate}</TableCell>
                <TableCell>{b.wardId === 'ward1' ? '第１病棟' : '第２病棟'}</TableCell>
                <TableCell>{b.doctorName}</TableCell>
                <TableCell>{b.notes || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>行動範囲指示入力</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={6}><TextField label="患者番号" fullWidth /></Grid>
            <Grid item xs={6}><TextField label="患者氏名" fullWidth InputProps={{ readOnly: true }} /></Grid>
            <Grid item xs={6}>
              <TextField label="行動範囲" select fullWidth defaultValue="">
                <MenuItem value="病棟内">病棟内</MenuItem>
                <MenuItem value="院内">院内</MenuItem>
                <MenuItem value="院外許可あり">院外許可あり</MenuItem>
                <MenuItem value="開放病棟">開放病棟</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}><TextField label="開始日" type="date" fullWidth defaultValue="2026-02-24" InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={12}><TextField label="備考" multiline rows={2} fullWidth /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={() => { setDialogOpen(false); showSnackbar('行動範囲指示を登録しました', 'success'); }}>登録</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BehaviorRange;
