import React, { useState } from 'react';
import {
  Box, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, Typography, Stack, Button,
} from '@mui/material';
import { Print } from '@mui/icons-material';
import { ISOLATION_ORDERS, generateObservationRecords } from '../../data/mockData';
import type { ObservationState } from '../../types';

const OBS_COLORS: Record<ObservationState, string> = {
  '未記入':   '#f1f5f9',
  '浅眠':     '#fef3c7',
  '落ち着き': '#dcfce7',
  '不穏':     '#fef2f2',
  '睡眠':     '#dbeafe',
  '中途覚醒': '#fce7f3',
};

const IsolationRestraint: React.FC = () => {
  const [tab, setTab] = useState(0);
  const activeOrders = ISOLATION_ORDERS.filter((o) => !o.endDatetime);

  // Generate 15-min slots for observation (show 6:00-22:00)
  const obsSlots = Array.from({ length: 64 }, (_, i) => {
    const totalMin = 6 * 60 + i * 15;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }).filter((_, i) => i < 48); // 6:00 to 18:00 for display

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="隔離拘束一覧" />
        <Tab label="観察記録" />
        <Tab label="隔離歴" />
        <Tab label="行動制限台帳" />
      </Tabs>

      {tab === 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>患者氏名</TableCell>
                <TableCell>患者番号</TableCell>
                <TableCell>種別</TableCell>
                <TableCell>開始</TableCell>
                <TableCell>終了</TableCell>
                <TableCell>病棟</TableCell>
                <TableCell>病室</TableCell>
                <TableCell>指示医</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ISOLATION_ORDERS.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{o.patientName}</TableCell>
                  <TableCell>{o.patientId}</TableCell>
                  <TableCell>
                    <Chip label={o.type} size="small" color={o.type === '隔離' ? 'error' : 'warning'} variant="outlined" />
                  </TableCell>
                  <TableCell>{o.startDatetime}</TableCell>
                  <TableCell>
                    {o.endDatetime ? o.endDatetime : <Chip label="継続中" size="small" color="error" />}
                  </TableCell>
                  <TableCell>{o.wardId === 'ward1' ? '第１病棟' : '第２病棟'}</TableCell>
                  <TableCell>{o.roomNumber}</TableCell>
                  <TableCell>{o.doctorName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 1 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              本日の観察記録対象者（15分単位）— 2026/02/24
            </Typography>
          </Stack>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ position: 'sticky', left: 0, zIndex: 3, minWidth: 110, bgcolor: '#f8fafc' }}>患者</TableCell>
                  {obsSlots.slice(0, 24).map((s) => (
                    <TableCell key={s} align="center" sx={{ minWidth: 38, fontSize: '0.5625rem', p: 0.5 }}>{s}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {activeOrders.map((order, oi) => {
                  const obsRecords = generateObservationRecords(order.id, order.patientId);
                  return (
                    <TableRow key={order.id}>
                      <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, bgcolor: '#fff', fontWeight: 600, fontSize: '0.75rem' }}>
                        {order.patientName}
                        <Typography variant="caption" display="block" color="text.secondary">{order.type}</Typography>
                      </TableCell>
                      {obsSlots.slice(0, 24).map((slot) => {
                        const rec = obsRecords.find((r) => r.time === slot);
                        const state = rec?.state || '未記入';
                        return (
                          <TableCell
                            key={slot}
                            align="center"
                            sx={{
                              p: 0.3, fontSize: '0.5625rem', cursor: 'pointer',
                              bgcolor: OBS_COLORS[state] || '#fff',
                              borderRight: '1px solid #f1f5f9',
                            }}
                          >
                            {state !== '未記入' ? state.substring(0, 2) : ''}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack direction="row" spacing={1.5} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
            {Object.entries(OBS_COLORS).map(([state, color]) => (
              <Stack key={state} direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: color, border: '1px solid #e2e8f0' }} />
                <Typography variant="caption" color="text.secondary">{state}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      {tab === 2 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>患者氏名</TableCell>
                <TableCell>種別</TableCell>
                <TableCell>開始日時</TableCell>
                <TableCell>終了日時</TableCell>
                <TableCell>期間</TableCell>
                <TableCell>指示医</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ISOLATION_ORDERS.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{o.patientName}</TableCell>
                  <TableCell><Chip label={o.type} size="small" color={o.type === '隔離' ? 'error' : 'warning'} variant="outlined" /></TableCell>
                  <TableCell>{o.startDatetime}</TableCell>
                  <TableCell>{o.endDatetime || '継続中'}</TableCell>
                  <TableCell>{o.endDatetime ? '2日間' : '継続中'}</TableCell>
                  <TableCell>{o.doctorName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 3 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">行動制限一覧性台帳</Typography>
            <Button variant="outlined" startIcon={<Print />}>印刷</Button>
          </Stack>
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">月と病棟を指定して台帳を表示・印刷できます</Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default IsolationRestraint;
