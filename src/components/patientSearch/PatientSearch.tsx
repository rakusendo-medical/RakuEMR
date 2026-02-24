import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, InputAdornment, Tabs, Tab,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { PATIENTS, OUTPATIENT_VISITS, STATUS_CONFIG } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';

type VisitType = 'all' | 'inpatient' | 'outpatient';

const PatientSearch: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedPatient } = useAppStore();
  const [query, setQuery] = useState('');
  const [visitType, setVisitType] = useState<VisitType>('all');

  const normalizedQuery = query.trim().toLowerCase();

  const inpatientResults = useMemo(() => {
    if (visitType === 'outpatient') return [];
    return PATIENTS.filter((p) => {
      if (!normalizedQuery) return true;
      return (
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.id.toLowerCase().includes(normalizedQuery) ||
        (p.diagnosis ?? '').includes(normalizedQuery) ||
        p.doctorName.includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, visitType]);

  const outpatientResults = useMemo(() => {
    if (visitType === 'inpatient') return [];
    return OUTPATIENT_VISITS.filter((v) => {
      if (!normalizedQuery) return true;
      return (
        v.patientName.toLowerCase().includes(normalizedQuery) ||
        v.patientId.toLowerCase().includes(normalizedQuery) ||
        v.doctorName.includes(normalizedQuery) ||
        v.department.includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, visitType]);

  const totalCount = inpatientResults.length + outpatientResults.length;

  const handleInpatientClick = (patientId: string) => {
    const patient = PATIENTS.find((p) => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient);
      navigate(`/patients/${patientId}`);
    }
  };

  return (
    <Box>
      {/* 検索バー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={visitType} onChange={(_, v) => setVisitType(v)}>
          <Tab label="すべて" value="all" />
          <Tab label="入院" value="inpatient" />
          <Tab label="外来" value="outpatient" />
        </Tabs>
        <Box sx={{ mb: 1 }}>
          <TextField
            placeholder="患者氏名・患者番号・担当医・診断名で検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            size="small"
            sx={{ width: 360 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      {/* 入院患者結果 */}
      {inpatientResults.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            入院患者 ({inpatientResults.length}件)
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>患者番号</TableCell>
                  <TableCell>患者氏名</TableCell>
                  <TableCell>年齢</TableCell>
                  <TableCell>性別</TableCell>
                  <TableCell>病棟・病室</TableCell>
                  <TableCell>状態</TableCell>
                  <TableCell>診断</TableCell>
                  <TableCell>主治医</TableCell>
                  <TableCell>入院日</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inpatientResults.map((p) => {
                  const cfg = STATUS_CONFIG[p.status];
                  return (
                    <TableRow
                      key={p.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleInpatientClick(p.id)}
                    >
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{p.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                      <TableCell>{p.age}歳</TableCell>
                      <TableCell>{p.gender === 'M' ? '男' : '女'}</TableCell>
                      <TableCell>{p.wardId === 'ward1' ? '第１病棟' : '第２病棟'} {p.roomNumber}{p.bedLabel}</TableCell>
                      <TableCell>
                        <Chip
                          label={cfg.label}
                          size="small"
                          sx={{ bgcolor: cfg.bgColor, color: cfg.color, fontSize: '0.6875rem', fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{p.diagnosis ?? '—'}</Typography>
                      </TableCell>
                      <TableCell>{p.doctorName}</TableCell>
                      <TableCell>{p.admitDate}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* 外来患者結果 */}
      {outpatientResults.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            外来患者 ({outpatientResults.length}件)
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>受付番号</TableCell>
                  <TableCell>患者氏名</TableCell>
                  <TableCell>年齢</TableCell>
                  <TableCell>性別</TableCell>
                  <TableCell>区分</TableCell>
                  <TableCell>診療科</TableCell>
                  <TableCell>担当医</TableCell>
                  <TableCell>予約時刻</TableCell>
                  <TableCell>状態</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {outpatientResults.map((v) => (
                  <TableRow key={v.id} hover>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{v.id}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{v.patientName}</TableCell>
                    <TableCell>{v.age}歳</TableCell>
                    <TableCell>{v.gender === 'M' ? '男' : '女'}</TableCell>
                    <TableCell>
                      <Chip
                        label={v.visitType}
                        size="small"
                        variant="outlined"
                        color={v.visitType === '初診' ? 'warning' : 'default'}
                        sx={{ fontSize: '0.6875rem' }}
                      />
                    </TableCell>
                    <TableCell>{v.department}</TableCell>
                    <TableCell>{v.doctorName}</TableCell>
                    <TableCell>{v.appointmentTime}</TableCell>
                    <TableCell>
                      <Chip label={v.status} size="small" variant="outlined" sx={{ fontSize: '0.6875rem' }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* 結果なし */}
      {normalizedQuery && totalCount === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.disabled">「{query}」に一致する患者が見つかりませんでした</Typography>
        </Box>
      )}

      {/* 初期状態 */}
      {!normalizedQuery && (
        <Typography variant="caption" color="text.secondary">
          入院 {PATIENTS.length}名 / 本日の外来 {OUTPATIENT_VISITS.length}名
        </Typography>
      )}

      {normalizedQuery && totalCount > 0 && (
        <Typography variant="caption" color="text.secondary">
          合計 {totalCount}件
        </Typography>
      )}
    </Box>
  );
};

export default PatientSearch;
