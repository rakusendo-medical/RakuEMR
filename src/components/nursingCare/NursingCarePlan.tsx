import React, { useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Typography, Checkbox, Button, Stack,
} from '@mui/material';
import type { WardId } from '../../types';
import { NURSING_CARE_SCHEDULES, patientNumberOf } from '../../data/mockData';
import WardFilterTabs from '../common/WardFilterTabs';
import { useAppStore } from '../../stores/useAppStore';

const NursingCarePlan: React.FC = () => {
  const [wardFilter, setWardFilter] = useState<WardId | 'all'>('all');
  const { showSnackbar } = useAppStore();
  const filtered = wardFilter === 'all'
    ? NURSING_CARE_SCHEDULES
    : NURSING_CARE_SCHEDULES.filter((c) => c.wardId === wardFilter);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        看護予定を一括入力・管理します
      </Typography>
      <WardFilterTabs value={wardFilter} onChange={setWardFilter} />
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>患者氏名</TableCell>
              <TableCell>患者番号</TableCell>
              <TableCell>ケア種類</TableCell>
              <TableCell>予定日</TableCell>
              <TableCell>病棟</TableCell>
              <TableCell align="center">完了</TableCell>
              <TableCell>備考</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{c.patientName}</TableCell>
                <TableCell>{patientNumberOf(c.patientId)}</TableCell>
                <TableCell><Chip label={c.careType} size="small" variant="outlined" /></TableCell>
                <TableCell>{c.scheduledDate}</TableCell>
                <TableCell>{c.wardId === 'ward1' ? '第１病棟' : '第２病棟'}</TableCell>
                <TableCell align="center">
                  <Checkbox size="small" defaultChecked={c.completed} />
                </TableCell>
                <TableCell>{c.notes || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          完了: {filtered.filter((c) => c.completed).length}/{filtered.length}件
        </Typography>
        <Button variant="contained" onClick={() => showSnackbar('ケア予定を更新しました', 'success')}>一括保存</Button>
      </Stack>
    </Box>
  );
};

export default NursingCarePlan;
