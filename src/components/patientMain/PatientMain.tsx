import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Typography, Tabs, Tab, Stack, Avatar,
  Chip, Grid, Divider,
} from '@mui/material';
import { ArrowBack, NoteAdd, Receipt, MeetingRoom } from '@mui/icons-material';
import { PATIENTS, ORDERS, NURSING_RECORDS, generateVitalSigns, generateFlowsheetDaily } from '../../data/mockData';
import StatusBadge from '../common/StatusBadge';
import FlowsheetView from '../flowsheet/Flowsheet';
import NursingRecordView from '../nursing/NursingRecord';
import OrderManagement from '../orders/OrderManagement';
import { useAppStore } from '../../stores/useAppStore';

const PatientMain: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { selectedPatient, setSelectedPatient } = useAppStore();
  const [tab, setTab] = useState(0);

  const patient = selectedPatient || PATIENTS.find((p) => p.id === patientId);

  if (!patient) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">患者が見つかりません</Typography>
        <Button onClick={() => navigate('/patients')} sx={{ mt: 2 }}>一覧に戻る</Button>
      </Box>
    );
  }

  const patientOrders = ORDERS.filter((o) => o.patientId === patient.id);
  const patientNursingRecords = NURSING_RECORDS.filter((r) => r.patientId === patient.id);

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => { setSelectedPatient(null); navigate('/patients'); }} sx={{ mb: 1.5 }}>
        一覧に戻る
      </Button>

      {/* Patient Header */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{
              width: 52, height: 52, borderRadius: 2,
              bgcolor: patient.gender === 'M' ? '#dbeafe' : '#fce7f3',
              color: patient.gender === 'M' ? 'primary.main' : '#be185d',
              fontSize: '1.25rem', fontWeight: 700,
            }}>
              {patient.name[0]}
            </Avatar>
            <Box>
              <Typography variant="h6">{patient.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {patient.id}　|　{patient.age}歳　{patient.gender === 'M' ? '男性' : '女性'}　|　
                {patient.wardId === 'ward1' ? '第１病棟' : '第２病棟'}　{patient.roomNumber}号室-{patient.bedLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                主治医: {patient.doctorName}　|　入院日: {patient.admitDate}
                {patient.diagnosis && `　|　診断: ${patient.diagnosis}`}
              </Typography>
            </Box>
          </Stack>
          <StatusBadge status={patient.status} />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="サマリ" />
        <Tab label="オーダ一覧" />
        <Tab label="看護記録" />
        <Tab label="フローシート" />
      </Tabs>

      {/* Tab Content */}
      {tab === 0 && (
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>最新オーダ</Typography>
                  {patientOrders.length === 0 ? (
                    <Typography variant="body2" color="text.disabled">オーダなし</Typography>
                  ) : (
                    patientOrders.slice(0, 4).map((o) => (
                      <Box key={o.id} sx={{ py: 1, borderBottom: '1px solid #f1f5f9' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={600}>{o.type}: {o.content}</Typography>
                          <Chip
                            label={o.status}
                            size="small"
                            color={o.status === '実施中' ? 'success' : o.status === '予定' ? 'warning' : 'default'}
                            variant="outlined"
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">{o.schedule} | {o.startDate}～</Typography>
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>最新看護記録</Typography>
                  {patientNursingRecords.length === 0 ? (
                    <Typography variant="body2" color="text.disabled">看護記録なし</Typography>
                  ) : (
                    patientNursingRecords.slice(0, 4).map((r) => (
                      <Box key={r.id} sx={{ py: 1, borderBottom: '1px solid #f1f5f9' }}>
                        <Typography variant="caption" color="text.secondary">{r.date} {r.time} ({r.author})</Typography>
                        <Typography variant="body2" sx={{ mt: 0.3 }}>{r.content.substring(0, 60)}...</Typography>
                      </Box>
                    ))
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={() => setTab(3)}>フローシート表示</Button>
            <Button variant="contained" color="secondary" startIcon={<NoteAdd />}>看護記録作成</Button>
            <Button variant="contained" sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }} startIcon={<Receipt />}>オーダ入力</Button>
            <Button variant="contained" color="error" startIcon={<MeetingRoom />} onClick={() => navigate('/admission')}>入退院管理</Button>
            <Button variant="outlined" onClick={() => navigate(`/karte-alpha/${patient.id}`)}>カルテ(α)を開く</Button>
          </Stack>
        </Box>
      )}

      {tab === 1 && <OrderManagement patientId={patient.id} />}
      {tab === 2 && <NursingRecordView patientId={patient.id} />}
      {tab === 3 && <FlowsheetView patientId={patient.id} />}
    </Box>
  );
};

export default PatientMain;
