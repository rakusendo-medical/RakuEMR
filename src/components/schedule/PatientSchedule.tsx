import React, { useState } from 'react';
import {
  Box, Tabs, Tab, Paper, Typography, Grid, Card, CardContent, Stack,
  Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem,
} from '@mui/material';
import { Add, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { SCHEDULE_EVENTS, PATIENTS } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';

const CATEGORY_COLORS: Record<string, string> = {
  order: '#1e40af', rehab: '#059669', meeting: '#7c3aed', outing: '#6366f1', other: '#d97706',
};
const CATEGORY_LABELS: Record<string, string> = {
  order: 'オーダ', rehab: 'リハビリ', meeting: '面会', outing: '外出外泊', other: 'その他',
};

const PatientSchedule: React.FC = () => {
  const [view, setView] = useState(0); // 0=week, 1=month
  const [dialogOpen, setDialogOpen] = useState(false);
  const { showSnackbar, selectedPatient } = useAppStore();

  const patientId = selectedPatient?.id || 'P001';
  const events = SCHEDULE_EVENTS.filter((e) => e.patientId === patientId);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2026, 1, 23 + i);
    return { date: d.toISOString().split('T')[0], label: `${d.getMonth() + 1}/${d.getDate()}`, dayName: ['日', '月', '火', '水', '木', '金', '土'][d.getDay()] };
  });

  const monthDays = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(2026, 1, 1 + i);
    return { date: d.toISOString().split('T')[0], label: `${d.getDate()}`, dayName: ['日', '月', '火', '水', '木', '金', '土'][d.getDay()] };
  });

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Tabs value={view} onChange={(_, v) => setView(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="週間スケジュール" />
          <Tab label="月間スケジュール" />
        </Tabs>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>スケジュール追加</Button>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        患者: {PATIENTS.find((p) => p.id === patientId)?.name || patientId} | 2026年2月
      </Typography>

      {view === 0 && (
        <Grid container spacing={1}>
          {weekDays.map((day) => {
            const dayEvents = events.filter((e) => e.date === day.date);
            return (
              <Grid item xs={12 / 7} key={day.date} sx={{ minWidth: 130 }}>
                <Paper variant="outlined" sx={{ p: 1, minHeight: 150, bgcolor: day.dayName === '日' ? '#fef2f2' : day.dayName === '土' ? '#eff6ff' : '#fff' }}>
                  <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.5, textAlign: 'center' }}>
                    {day.label} ({day.dayName})
                  </Typography>
                  <Stack spacing={0.5}>
                    {dayEvents.map((e) => (
                      <Card key={e.id} sx={{ bgcolor: CATEGORY_COLORS[e.category] + '10', border: `1px solid ${CATEGORY_COLORS[e.category]}30` }}>
                        <CardContent sx={{ p: 0.5, '&:last-child': { pb: 0.5 } }}>
                          <Typography variant="caption" fontWeight={600} sx={{ color: CATEGORY_COLORS[e.category], fontSize: '0.625rem' }}>
                            {e.startTime}{e.endTime && `〜${e.endTime}`}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ fontSize: '0.6875rem' }}>{e.title}</Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {view === 1 && (
        <Grid container spacing={0.5}>
          {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
            <Grid item xs={12 / 7} key={d}>
              <Typography variant="caption" fontWeight={700} sx={{ textAlign: 'center', display: 'block', py: 0.5, bgcolor: '#f8fafc' }}>{d}</Typography>
            </Grid>
          ))}
          {/* Offset for Feb 2026 starting on Sunday */}
          {monthDays.map((day) => {
            const dayEvents = events.filter((e) => e.date === day.date);
            return (
              <Grid item xs={12 / 7} key={day.date}>
                <Paper variant="outlined" sx={{ p: 0.5, minHeight: 60, bgcolor: dayEvents.length > 0 ? '#eff6ff' : '#fff' }}>
                  <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.625rem' }}>{day.label}</Typography>
                  {dayEvents.map((e) => (
                    <Typography key={e.id} variant="caption" display="block" sx={{ fontSize: '0.5625rem', color: CATEGORY_COLORS[e.category] }}>
                      {e.title}
                    </Typography>
                  ))}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: 'wrap' }}>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <Stack key={key} direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: CATEGORY_COLORS[key] }} />
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Stack>
        ))}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>スケジュール追加</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}><TextField label="タイトル" fullWidth /></Grid>
            <Grid item xs={6}><TextField label="日付" type="date" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={3}><TextField label="開始時間" type="time" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={3}><TextField label="終了時間" type="time" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
            <Grid item xs={6}>
              <TextField label="カテゴリ" select fullWidth defaultValue="other">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField label="メモ" multiline rows={2} fullWidth /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={() => { setDialogOpen(false); showSnackbar('スケジュールを登録しました', 'success'); }}>登録</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientSchedule;
