import React, { useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Checkbox, Chip, Typography, Stack, Switch,
} from '@mui/material';
import type { WardId } from '../../types';
import { PATIENTS, ORDERS } from '../../data/mockData';
import WardFilterTabs from '../common/WardFilterTabs';
import { useAppStore } from '../../stores/useAppStore';

const BatchOrder: React.FC = () => {
  const [wardFilter, setWardFilter] = useState<WardId | 'all'>('all');
  const { showSnackbar } = useAppStore();
  const filtered = wardFilter === 'all' ? PATIENTS : PATIENTS.filter((p) => p.wardId === wardFilter);

  const routineOrders = ORDERS.filter((o) => o.type === '入院定時' || (o.type === '処方' && o.status === '実施中'));

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        入院定時オーダの継続設定を一括で行います
      </Typography>
      <WardFilterTabs value={wardFilter} onChange={setWardFilter} />
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 130 }}>患者氏名</TableCell>
              <TableCell>病室</TableCell>
              <TableCell>現在のオーダ</TableCell>
              <TableCell align="center">継続</TableCell>
              <TableCell>変更メモ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((p) => {
              const pOrders = routineOrders.filter((o) => o.patientId === p.id);
              return (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.id}</Typography>
                  </TableCell>
                  <TableCell>{p.roomNumber}-{p.bedLabel}</TableCell>
                  <TableCell>
                    {pOrders.length > 0 ? (
                      <Stack spacing={0.5}>
                        {pOrders.map((o) => (
                          <Box key={o.id}>
                            <Chip label={o.type} size="small" variant="outlined" sx={{ mr: 0.5, fontSize: '0.625rem' }} />
                            <Typography component="span" variant="caption">{o.content} ({o.schedule})</Typography>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.disabled">定時オーダなし</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Switch size="small" defaultChecked={pOrders.length > 0} disabled={pOrders.length === 0} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.disabled">—</Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button variant="contained" onClick={() => showSnackbar('継続設定を更新しました', 'success')}>一括更新</Button>
      </Stack>
    </Box>
  );
};

export default BatchOrder;
