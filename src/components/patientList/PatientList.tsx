import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, TextField, InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import type { WardId } from '../../types';
import { PATIENTS } from '../../data/mockData';
import StatusBadge from '../common/StatusBadge';
import WardFilterTabs from '../common/WardFilterTabs';
import { useAppStore } from '../../stores/useAppStore';

const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedPatient } = useAppStore();
  const [wardFilter, setWardFilter] = useState<WardId | 'all'>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const byWard = wardFilter === 'all' ? PATIENTS : PATIENTS.filter((p) => p.wardId === wardFilter);
    const q = query.trim().toLowerCase();
    if (!q) return byWard;
    return byWard.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.doctorName.includes(q) ||
      (p.diagnosis ?? '').includes(q)
    );
  }, [wardFilter, query]);

  const handleRowClick = (patientId: string) => {
    const patient = PATIENTS.find((p) => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient);
      navigate(`/patients/${patientId}`);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <WardFilterTabs value={wardFilter} onChange={(v) => { setWardFilter(v); setQuery(''); }} />
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
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>患者番号</TableCell>
              <TableCell>患者氏名</TableCell>
              <TableCell>年齢</TableCell>
              <TableCell>性別</TableCell>
              <TableCell>病棟</TableCell>
              <TableCell>病室</TableCell>
              <TableCell>ベッド</TableCell>
              <TableCell>状態</TableCell>
              <TableCell>主治医</TableCell>
              <TableCell>入院日</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(p.id)}>
                <TableCell>{p.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                <TableCell>{p.age}歳</TableCell>
                <TableCell>{p.gender === 'M' ? '男' : '女'}</TableCell>
                <TableCell>{p.wardId === 'ward1' ? '第１病棟' : '第２病棟'}</TableCell>
                <TableCell>{p.roomNumber}</TableCell>
                <TableCell>{p.bedLabel}</TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell>{p.doctorName}</TableCell>
                <TableCell>{p.admitDate}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                  「{query}」に一致する患者が見つかりませんでした
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {filtered.length}件表示
      </Typography>
    </Box>
  );
};

export default PatientList;
