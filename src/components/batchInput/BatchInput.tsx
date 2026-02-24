import React, { useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, TextField, Select, MenuItem, Checkbox, Typography, Stack,
} from '@mui/material';
import type { WardId } from '../../types';
import { PATIENTS } from '../../data/mockData';
import WardFilterTabs from '../common/WardFilterTabs';
import { useAppStore } from '../../stores/useAppStore';

const ITEMS = ['体温', '血圧(上)', '血圧(下)', '脈拍', 'SpO2', '食事(朝)', '食事(昼)', '食事(夕)', '服薬確認'];

const BatchInput: React.FC = () => {
  const [wardFilter, setWardFilter] = useState<WardId | 'all'>('all');
  const { showSnackbar } = useAppStore();
  const filtered = wardFilter === 'all' ? PATIENTS : PATIENTS.filter((p) => p.wardId === wardFilter);

  const stickyCell = { position: 'sticky' as const, left: 0, zIndex: 1, bgcolor: '#fff' };

  return (
    <Box>
      <WardFilterTabs value={wardFilter} onChange={setWardFilter} />
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...stickyCell, zIndex: 3, minWidth: 130, bgcolor: '#f8fafc' }}>患者氏名</TableCell>
              <TableCell sx={{ minWidth: 60 }} align="center">病室</TableCell>
              {ITEMS.map((item) => (
                <TableCell key={item} align="center" sx={{ minWidth: 65, fontSize: '0.6875rem' }}>{item}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((p, i) => (
              <TableRow key={p.id} sx={{ bgcolor: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <TableCell sx={{ ...stickyCell, bgcolor: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{p.id}</Typography>
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '0.75rem' }}>{p.roomNumber}-{p.bedLabel}</TableCell>
                {ITEMS.map((item) => (
                  <TableCell key={item} sx={{ p: 0.5 }}>
                    {item.includes('食事') ? (
                      <Select size="small" defaultValue="" fullWidth sx={{ fontSize: '0.6875rem' }}>
                        <MenuItem value="">—</MenuItem>
                        <MenuItem value="全量">全量</MenuItem>
                        <MenuItem value="8割">8割</MenuItem>
                        <MenuItem value="5割">5割</MenuItem>
                        <MenuItem value="3割">3割</MenuItem>
                        <MenuItem value="0割">0割</MenuItem>
                      </Select>
                    ) : item === '服薬確認' ? (
                      <Box sx={{ textAlign: 'center' }}><Checkbox size="small" /></Box>
                    ) : (
                      <TextField size="small" fullWidth inputProps={{ style: { fontSize: '0.6875rem', textAlign: 'center', padding: '4px 6px' } }} />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button variant="contained" onClick={() => showSnackbar('一括登録しました', 'success')}>一括登録</Button>
      </Stack>
    </Box>
  );
};

export default BatchInput;
