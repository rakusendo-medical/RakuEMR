import { Box, Typography } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { flowsheetDays, vitalRecords } from '../../data/flowsheetMockData';

export default function VitalChart() {
  const chartData = flowsheetDays.map((day) => {
    const morningVital = vitalRecords.find(
      (v) => v.date === day.date && v.time === 'morning',
    );
    const afternoonVital = vitalRecords.find(
      (v) => v.date === day.date && v.time === 'afternoon',
    );
    return {
      date: day.date.slice(5),
      dayOfWeek: day.dayOfWeek,
      systolicAM: morningVital?.systolic,
      diastolicAM: morningVital?.diastolic,
      systolicPM: afternoonVital?.systolic,
      diastolicPM: afternoonVital?.diastolic,
      pulseAM: morningVital?.pulse,
      pulsePM: afternoonVital?.pulse,
      tempAM: morningVital?.temperature,
      tempPM: afternoonVital?.temperature,
    };
  });

  return (
    <Box sx={{ border: '1px solid #ccc', bgcolor: '#fff', mb: 0.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: '#e8eef5',
          px: 1,
          py: 0.3,
          borderBottom: '1px solid #ddd',
          gap: 2,
        }}
      >
        <Typography sx={{ fontSize: '10px', fontWeight: 600 }}>BP</Typography>
        <Typography sx={{ fontSize: '10px', fontWeight: 600 }}>R</Typography>
        <Typography sx={{ fontSize: '10px', fontWeight: 600 }}>P</Typography>
        <Typography sx={{ fontSize: '10px', fontWeight: 600 }}>T</Typography>
      </Box>

      <Box sx={{ width: '100%', height: 200, px: 1, py: 0.5 }}>
        <ResponsiveContainer width="99%" height={190}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9 }}
              interval={0}
            />
            <YAxis
              domain={[60, 160]}
              ticks={[60, 80, 100, 120, 140, 160]}
              tick={{ fontSize: 9 }}
              width={30}
            />
            <Tooltip
              contentStyle={{ fontSize: '10px' }}
              labelStyle={{ fontSize: '10px', fontWeight: 600 }}
            />
            <ReferenceLine y={140} stroke="#ffcdd2" strokeDasharray="3 3" />
            <ReferenceLine y={90} stroke="#c8e6c9" strokeDasharray="3 3" />

            {/* Systolic BP - morning */}
            <Line
              type="monotone"
              dataKey="systolicAM"
              stroke="#d32f2f"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="収縮期(朝)"
            />
            {/* Diastolic BP - morning */}
            <Line
              type="monotone"
              dataKey="diastolicAM"
              stroke="#1565c0"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="拡張期(朝)"
            />
            {/* Pulse - morning */}
            <Line
              type="monotone"
              dataKey="pulseAM"
              stroke="#2e7d32"
              strokeWidth={1.5}
              dot={{ r: 2 }}
              strokeDasharray="5 3"
              name="脈拍(朝)"
            />
            {/* Systolic PM */}
            <Line
              type="monotone"
              dataKey="systolicPM"
              stroke="#e57373"
              strokeWidth={1.5}
              dot={{ r: 2 }}
              name="収縮期(午後)"
            />
            {/* Diastolic PM */}
            <Line
              type="monotone"
              dataKey="diastolicPM"
              stroke="#64b5f6"
              strokeWidth={1.5}
              dot={{ r: 2 }}
              name="拡張期(午後)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* Temperature sub-row below chart */}
      <Box
        sx={{
          display: 'flex',
          borderTop: '1px solid #eee',
          px: 1,
          py: 0.3,
        }}
      >
        <Box sx={{ width: 30, flexShrink: 0 }}>
          <Typography sx={{ fontSize: '9px', color: '#888' }}>体温</Typography>
        </Box>
        <Box sx={{ display: 'flex', flex: 1, justifyContent: 'space-around' }}>
          {chartData.map((d) => (
            <Box key={d.date} sx={{ textAlign: 'center', minWidth: 50 }}>
              <Typography sx={{ fontSize: '9px', color: '#e65100' }}>
                {d.tempAM}
              </Typography>
              <Typography sx={{ fontSize: '9px', color: '#f57c00' }}>
                {d.tempPM}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
