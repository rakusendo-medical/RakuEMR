import { useMemo } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ISODate, VitalEntry } from '../types';

interface VitalChartProps {
  patientId: string;
  /** 7 日（昇順） */
  dates: ISODate[];
  vitals: VitalEntry[];
  height?: number;
}

interface DataPoint {
  ts: number;
  bpSys?: number;
  bpDia?: number;
  pulse?: number;
  resp?: number;
  temp?: number;
  spo2?: number;
}

const COLORS = {
  bpSys: '#dc2626',
  bpDia: '#f97316',
  pulse: '#0ea5e9',
  resp: '#16a34a',
  temp: '#9333ea',
  spo2: '#0891b2',
};

const ONE_DAY_MS = 24 * 3600 * 1000;

const isoToMs = (date: ISODate, time = '00:00'): number =>
  new Date(`${date}T${time}:00`).getTime();

const fmtDayTick = (ms: number): string => {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const fmtTooltipLabel = (ms: number): string => {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fmtValue = (key: string, value: unknown): [string, string] => {
  if (typeof value !== 'number') return ['—', key];
  switch (key) {
    case 'bpSys':
      return [`${value} mmHg`, 'BP(収縮)'];
    case 'bpDia':
      return [`${value} mmHg`, 'BP(拡張)'];
    case 'pulse':
      return [`${value} bpm`, 'P(脈拍)'];
    case 'resp':
      return [`${value} /分`, 'R(呼吸)'];
    case 'temp':
      return [`${value.toFixed(1)} ℃`, 'T(体温)'];
    case 'spo2':
      return [`${value} %`, 'S(SpO2)'];
    default:
      return [String(value), key];
  }
};

export default function VitalChart({ patientId, dates, vitals, height = 180 }: VitalChartProps) {
  const { points, dayTicks, minMs, maxMs } = useMemo(() => {
    const dateSet = new Set(dates);
    const pts: DataPoint[] = vitals
      .filter((v) => v.patientId === patientId && dateSet.has(v.date))
      .sort((a, b) =>
        a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date),
      )
      .map((v) => ({
        ts: isoToMs(v.date, v.time),
        bpSys: v.bpSys,
        bpDia: v.bpDia,
        pulse: v.pulse,
        resp: v.resp,
        temp: v.temp,
        spo2: v.spo2,
      }));
    const ticks = dates.map((d) => isoToMs(d));
    return {
      points: pts,
      dayTicks: ticks,
      minMs: ticks[0] ?? 0,
      maxMs: (ticks[ticks.length - 1] ?? 0) + ONE_DAY_MS,
    };
  }, [patientId, dates, vitals]);

  if (points.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#fffbeb',
          borderRadius: 0,
        }}
      >
        <Typography variant="caption" color="text.disabled">
          バイタル記録なし（過去 7 日）
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height, bgcolor: '#fffbeb', position: 'relative' }}>
      <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 4, left: 8, zIndex: 1 }}>
        <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 700, color: '#7c2d12' }}>
          バイタル（7 日 × 時間軸）
        </Typography>
      </Stack>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 24, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid stroke="#fde68a" strokeDasharray="2 4" vertical={false} />
          {/* 日境目を縦線で明示 */}
          {dayTicks.slice(1).map((t) => (
            <ReferenceLine
              key={t}
              x={t}
              stroke="#fbbf24"
              strokeDasharray="3 3"
              yAxisId="left"
            />
          ))}
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={[minMs, maxMs]}
            ticks={dayTicks}
            tickFormatter={fmtDayTick}
            tick={{ fontSize: 10, fill: '#7c2d12' }}
            stroke="#fbbf24"
          />
          <YAxis
            yAxisId="left"
            domain={[30, 200]}
            ticks={[30, 60, 90, 120, 150, 180]}
            tick={{ fontSize: 10, fill: '#7c2d12' }}
            width={28}
            stroke="#fbbf24"
          />
          {/* 体温・SpO2 用の Y 軸は表示しない（軸混雑回避）。値は Tooltip で確認 */}
          <YAxis yAxisId="rightT" orientation="right" domain={[34, 42]} hide />
          <YAxis yAxisId="rightS" orientation="right" domain={[80, 102]} hide />
          <Tooltip
            labelFormatter={fmtTooltipLabel}
            formatter={(value, name) => fmtValue(String(name), value)}
            contentStyle={{ fontSize: 11 }}
            labelStyle={{ fontSize: 11, fontWeight: 700 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10 }}
            iconSize={8}
            verticalAlign="top"
            align="right"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="bpSys"
            name="bpSys"
            stroke={COLORS.bpSys}
            strokeWidth={1.5}
            dot={{ r: 2 }}
            connectNulls
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="bpDia"
            name="bpDia"
            stroke={COLORS.bpDia}
            strokeWidth={1.5}
            dot={{ r: 2 }}
            connectNulls
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="pulse"
            name="pulse"
            stroke={COLORS.pulse}
            strokeWidth={1.5}
            dot={{ r: 2 }}
            strokeDasharray="4 2"
            connectNulls
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="resp"
            name="resp"
            stroke={COLORS.resp}
            strokeWidth={1.5}
            dot={{ r: 2 }}
            strokeDasharray="2 2"
            connectNulls
          />
          <Line
            yAxisId="rightT"
            type="monotone"
            dataKey="temp"
            name="temp"
            stroke={COLORS.temp}
            strokeWidth={1.5}
            dot={{ r: 2 }}
            connectNulls
          />
          <Line
            yAxisId="rightS"
            type="monotone"
            dataKey="spo2"
            name="spo2"
            stroke={COLORS.spo2}
            strokeWidth={1.5}
            dot={{ r: 2 }}
            strokeDasharray="6 3"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
