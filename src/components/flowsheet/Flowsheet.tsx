import React from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Stack, Card, CardContent,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { generateVitalSigns, generateFlowsheetDaily } from '../../data/mockData';

interface Props {
  patientId?: string;
}

const FlowsheetView: React.FC<Props> = ({ patientId = 'P001' }) => {
  const vitals = generateVitalSigns(patientId, 7);
  const flowData = generateFlowsheetDaily(patientId, 7);

  // Aggregate vitals per date (use 9時 slot)
  const dates = [...new Set(vitals.map((v) => v.date))];
  const chartData = dates.map((date) => {
    const morning = vitals.find((v) => v.date === date && v.timeSlot === '9時');
    return {
      date: `${new Date(date).getMonth() + 1}/${new Date(date).getDate()}`,
      'BP(上)': morning?.bpSystolic || 0,
      'BP(下)': morning?.bpDiastolic || 0,
      '脈拍': morning?.pulse || 0,
      '体温×10': Math.round((morning?.temperature || 36) * 10),
      'SpO2': morning?.spo2 || 0,
    };
  });

  // Daily summary (one row per date)
  const dailySummary = dates.map((date) => {
    const morningVital = vitals.find((v) => v.date === date && v.timeSlot === '9時');
    const flow = flowData.find((f) => f.date === date);
    const d = new Date(date);
    return {
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
      bp: morningVital ? `${morningVital.bpSystolic}/${morningVital.bpDiastolic}` : '—',
      pulse: morningVital?.pulse ?? '—',
      temp: morningVital?.temperature ?? '—',
      resp: morningVital?.respiration ?? '—',
      spo2: morningVital?.spo2 ?? '—',
      weight: morningVital?.weight ?? '—',
      breakfast: flow?.mealBreakfast ?? '—',
      lunch: flow?.mealLunch ?? '—',
      dinner: flow?.mealDinner ?? '—',
      medAm: flow?.medMorning ? '✓' : '—',
      medNoon: flow?.medNoon ? '✓' : '—',
      medPm: flow?.medEvening ? '✓' : '—',
      medNight: flow?.medNight ? '✓' : '—',
      bath: flow?.bath ? '✓' : '—',
      sheet: flow?.sheetChange ? '✓' : '—',
    };
  });

  const stickyCell = { position: 'sticky' as const, left: 0, zIndex: 1, bgcolor: '#f8fafc', fontWeight: 600, fontSize: '0.75rem' };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          表示期間: {dates[0]} ～ {dates[dates.length - 1]}（7日間）
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small">バイタル入力</Button>
          <Button variant="contained" size="small" color="secondary">観察記録入力</Button>
        </Stack>
      </Stack>

      {/* Chart */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>バイタルサイングラフ</Typography>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barGap={1} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="BP(上)" fill="#3b82f6" />
              <Bar dataKey="脈拍" fill="#ef4444" />
              <Bar dataKey="SpO2" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Data Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...stickyCell, minWidth: 100, zIndex: 3 }}>項目</TableCell>
              {dailySummary.map((d) => (
                <TableCell key={d.dateLabel} align="center" sx={{ minWidth: 70, fontWeight: 700 }}>{d.dateLabel}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[
              { label: 'BP (mmHg)', key: 'bp' },
              { label: 'P (回/分)', key: 'pulse' },
              { label: 'T (℃)', key: 'temp' },
              { label: 'R (回/分)', key: 'resp' },
              { label: 'SpO2 (%)', key: 'spo2' },
              { label: '体重 (kg)', key: 'weight' },
            ].map(({ label, key }) => (
              <TableRow key={key}>
                <TableCell sx={stickyCell}>{label}</TableCell>
                {dailySummary.map((d, i) => (
                  <TableCell key={i} align="center" sx={{ fontSize: '0.75rem' }}>{(d as any)[key]}</TableCell>
                ))}
              </TableRow>
            ))}

            <TableRow>
              <TableCell colSpan={dailySummary.length + 1} sx={{ bgcolor: '#f0fdf4', fontWeight: 700, fontSize: '0.6875rem', color: '#16a34a' }}>
                食事
              </TableCell>
            </TableRow>
            {[
              { label: '朝食', key: 'breakfast' },
              { label: '昼食', key: 'lunch' },
              { label: '夕食', key: 'dinner' },
            ].map(({ label, key }) => (
              <TableRow key={key}>
                <TableCell sx={stickyCell}>{label}</TableCell>
                {dailySummary.map((d, i) => (
                  <TableCell key={i} align="center" sx={{ fontSize: '0.75rem' }}>{(d as any)[key]}</TableCell>
                ))}
              </TableRow>
            ))}

            <TableRow>
              <TableCell colSpan={dailySummary.length + 1} sx={{ bgcolor: '#eff6ff', fontWeight: 700, fontSize: '0.6875rem', color: '#1e40af' }}>
                服薬・その他
              </TableCell>
            </TableRow>
            {[
              { label: '服薬（朝）', key: 'medAm' },
              { label: '服薬（昼）', key: 'medNoon' },
              { label: '服薬（夕）', key: 'medPm' },
              { label: '服薬（寝）', key: 'medNight' },
              { label: '入浴', key: 'bath' },
              { label: 'シーツ交換', key: 'sheet' },
            ].map(({ label, key }) => (
              <TableRow key={key}>
                <TableCell sx={stickyCell}>{label}</TableCell>
                {dailySummary.map((d, i) => (
                  <TableCell key={i} align="center" sx={{ fontSize: '0.75rem' }}>{(d as any)[key]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FlowsheetView;
