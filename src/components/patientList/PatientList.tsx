import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography,
} from '@mui/material';
import type { WardId } from '../../types';
import { PATIENTS } from '../../data/mockData';
import StatusBadge from '../common/StatusBadge';
import WardFilterTabs from '../common/WardFilterTabs';
import { useAppStore } from '../../stores/useAppStore';

const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedPatient } = useAppStore();
  const [wardFilter, setWardFilter] = useState<WardId | 'all'>('all');

  const filtered = wardFilter === 'all' ? PATIENTS : PATIENTS.filter((p) => p.wardId === wardFilter);

  const handleRowClick = (patientId: string) => {
    const patient = PATIENTS.find((p) => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient);
      navigate(`/patients/${patientId}`);
    }
  };

  return (
    <Box>
      <WardFilterTabs value={wardFilter} onChange={setWardFilter} />
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
