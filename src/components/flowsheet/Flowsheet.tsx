import React from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Stack, Card, CardContent, IconButton,
  Tooltip as MuiTooltip,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { generateVitalSigns, generateFlowsheetDaily } from '../../data/mockData';

interface Props {
  patientId?: string;
}

// ── Table helper components ──

const groupHeaderSx = {
  bgcolor: '#e3edf7',
  fontWeight: 700,
  fontSize: '0.75rem',
  color: '#1e3a5f',
  py: 0.3,
  px: 1,
  borderBottom: '1px solid #c5d5e8',
};

function GroupHeaderRow({ label, actionLabel, colSpan }: { label: string; actionLabel?: string; colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={2} sx={{ ...groupHeaderSx, position: 'sticky' as const, left: 0, zIndex: 2, minWidth: 120 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#1e3a5f' }}>{label}</Typography>
          {actionLabel && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => {}}
              sx={{
                fontSize: '0.6rem',
                minWidth: 0,
                px: 1,
                py: 0,
                lineHeight: 1.6,
                color: '#1e40af',
                borderColor: '#1e40af',
                '&:hover': { bgcolor: '#e8eaf6', borderColor: '#1e40af' },
              }}
            >
              {actionLabel}
            </Button>
          )}
        </Box>
      </TableCell>
      {Array.from({ length: colSpan - 2 }).map((_, i) => (
        <TableCell key={i} sx={{ ...groupHeaderSx, py: 0.3 }} />
      ))}
    </TableRow>
  );
}

const stickyCellBase = { position: 'sticky' as const, left: 0, zIndex: 1, bgcolor: '#f8fafc', fontWeight: 600, fontSize: '0.75rem' };

function DataRow({ label, sub, data, dataKey, stickyCell, render }: {
  label: string; sub: string; data: any[]; dataKey: string; stickyCell: any; render?: (v: any) => string;
}) {
  return (
    <TableRow>
      <TableCell colSpan={2} sx={stickyCell}>{label}{sub && ` ${sub}`}</TableCell>
      {data.map((d: any, i: number) => (
        <TableCell key={i} align="center" sx={{ fontSize: '0.75rem' }}>
          {render ? render(d[dataKey]) : d[dataKey]}
        </TableCell>
      ))}
    </TableRow>
  );
}

function SubGroupRow({ label, sub, data, dataKey, stickyCell, rowSpan }: {
  label: string; sub: string; data: any[]; dataKey: string; stickyCell: any; rowSpan: number;
}) {
  return (
    <TableRow>
      <TableCell rowSpan={rowSpan} sx={{ ...stickyCell, verticalAlign: 'top', borderRight: '1px solid #e0e0e0' }}>{label}</TableCell>
      <TableCell sx={{ ...stickyCell, left: 60, pl: 0.5 }}>{sub}</TableCell>
      {data.map((d: any, i: number) => (
        <TableCell key={i} align="center" sx={{ fontSize: '0.75rem' }}>{d[dataKey]}</TableCell>
      ))}
    </TableRow>
  );
}

function SubRow({ sub, data, dataKey, stickyCell }: {
  sub: string; data: any[]; dataKey: string; stickyCell: any;
}) {
  return (
    <TableRow>
      <TableCell sx={{ ...stickyCell, left: 60, pl: 0.5 }}>{sub}</TableCell>
      {data.map((d: any, i: number) => (
        <TableCell key={i} align="center" sx={{ fontSize: '0.75rem' }}>{d[dataKey]}</TableCell>
      ))}
    </TableRow>
  );
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
      'BP(上)': morning?.bpSystolic || null,
      'BP(下)': morning?.bpDiastolic || null,
      '脈拍': morning?.pulse || null,
      '体温': morning?.temperature || null,
      'SpO2': morning?.spo2 || null,
      '呼吸': morning?.respiration || null,
    };
  });

  // Daily summary (one row per date)
  const baseAdmitDays = 28; // 1日目の在院日数
  const dailySummary = dates.map((date, dateIndex) => {
    const morningVital = vitals.find((v) => v.date === date && v.timeSlot === '9時');
    const flow = flowData.find((f) => f.date === date);
    const d = new Date(date);
    const weight = morningVital?.weight ?? 72;
    const height = 167.8;
    const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
    // Mock extra data per date
    const seed = d.getDate();
    const nurses = ['山本', '佐々木', '中田', '鈴木', '高橋'];
    const nurse = nurses[seed % nurses.length];
    const sleepTypes = ['良眠', '普通', '浅眠', '良眠', '普通', '良眠', '浅眠'];
    const bathTypes = ['入浴', 'シャワー浴', '清拭', '入浴', 'シャワー浴', '—', '入浴'];
    return {
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
      // 予定オーダ
      orderCount: (seed % 3) + 1,
      // 検査結果
      labResult: seed % 2 === 0 ? '異常なし' : '—',
      // 食事
      mealType: '常食',
      // 身長
      height: height,
      // 体重(BMI)
      weightBmi: `${weight}(${bmi})`,
      // 便（回数）
      stool: seed % 3 === 0 ? 2 : seed % 2 === 0 ? 1 : 0,
      // 尿
      urine: seed % 2 === 0 ? '○' : '—',
      // 食事: 朝昼夕
      breakfast: flow?.mealBreakfast ?? '—',
      lunch: flow?.mealLunch ?? '—',
      dinner: flow?.mealDinner ?? '—',
      // 睡眠
      sleep: sleepTypes[seed % sleepTypes.length],
      // 服薬: 朝昼夕寝（チェック+ナース名）
      medAm: flow?.medMorning ? `✓(${nurse})` : '—',
      medNoon: flow?.medNoon ? `✓(${nurse})` : '—',
      medPm: flow?.medEvening ? `✓(${nurse})` : '—',
      medNight: flow?.medNight ? `✓(${nurse})` : '—',
      // 診療録
      karteNote: seed % 4 === 0 ? '回診記録' : seed % 3 === 0 ? '処方変更' : '—',
      // 部門診療録
      deptNote: seed % 5 === 0 ? 'PSW面談' : '—',
      // 移行記事
      transferNote: '—',
      // 看護記録
      nursingNote: seed % 2 === 0 ? '記録あり' : '—',
      // 便(性状)
      stoolDetail: seed % 3 === 0 ? '普通便' : seed % 2 === 0 ? '硬便' : '—',
      // 入浴（種類を記載）
      bath: bathTypes[seed % bathTypes.length],
      // サイン（記録入力者）
      sign: nurse,
      // ヘッダー情報
      fullDate: `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}(${['日','月','火','水','木','金','土'][d.getDay()]})`,
      admitDays: baseAdmitDays + dateIndex,
      hasNote: seed % 2 === 0,
      room: 'E102号室',
      isolation: seed === 11 ? '10:30～16:20' : '—',
      restraint: '—',
      behaviorLimit: '—',
      outing: seed === 12 ? '08:00～11:00' : '—',
    };
  });

  const stickyCell = { position: 'sticky' as const, left: 0, zIndex: 1, bgcolor: '#f8fafc', fontWeight: 600, fontSize: '0.75rem' };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        表示期間: {dates[0]} ～ {dates[dates.length - 1]}（7日間）
      </Typography>

      {/* Header info table (date nav, admit days, buttons) */}
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 0 }}>
        <Table size="small">
          <TableBody>
            {/* Date navigation row */}
            <TableRow>
              <TableCell sx={{ ...stickyCell, minWidth: 120, zIndex: 2, bgcolor: '#e3edf7' }}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography sx={{ fontSize: '0.7rem', color: '#1e40af', cursor: 'pointer', fontWeight: 700 }}>≪</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#1e40af', cursor: 'pointer', fontWeight: 700 }}>＜</Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e3a5f' }}>当日</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#1e40af', cursor: 'pointer', fontWeight: 700 }}>＞</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#1e40af', cursor: 'pointer', fontWeight: 700 }}>≫</Typography>
                </Stack>
              </TableCell>
              {dailySummary.map((d, i) => (
                <TableCell key={i} align="center" sx={{
                  fontSize: '0.7rem', fontWeight: 700,
                  bgcolor: i === 0 ? '#fff3cd' : '#e3edf7',
                  color: '#1e3a5f',
                  minWidth: 85,
                }}>
                  {d.fullDate}
                </TableCell>
              ))}
            </TableRow>
            {/* 在院日数 */}
            <TableRow>
              <TableCell sx={{ ...stickyCell, fontSize: '0.7rem' }}>在院日数</TableCell>
              {dailySummary.map((d, i) => (
                <TableCell key={i} align="center" sx={{ fontSize: '0.7rem' }}>{d.admitDays}日目</TableCell>
              ))}
            </TableRow>
            {/* 看護記録・バイタル入力ボタン */}
            <TableRow>
              <TableCell sx={{ ...stickyCell, fontSize: '0.65rem', color: 'text.secondary' }}></TableCell>
              {dailySummary.map((d, i) => (
                <TableCell key={i} align="center" sx={{ py: 0.3 }}>
                  <Stack direction="row" spacing={0.3} justifyContent="center">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditNoteIcon sx={{ fontSize: '0.8rem !important' }} />}
                      onClick={() => {}}
                      sx={{
                        fontSize: '0.65rem',
                        minWidth: 0,
                        px: 0.5,
                        py: 0,
                        lineHeight: 1.5,
                        color: '#1e3a5f',
                        borderColor: '#c5d5e8',
                        whiteSpace: 'nowrap',
                        '&:hover': { bgcolor: '#e3edf7', borderColor: '#1e3a5f' },
                      }}
                    >
                      看護記録
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ThermostatIcon sx={{ fontSize: '0.8rem !important' }} />}
                      onClick={() => {}}
                      sx={{
                        fontSize: '0.65rem',
                        minWidth: 0,
                        px: 0.5,
                        py: 0,
                        lineHeight: 1.5,
                        color: '#e53935',
                        borderColor: '#ffcdd2',
                        whiteSpace: 'nowrap',
                        '&:hover': { bgcolor: '#ffebee', borderColor: '#e53935' },
                      }}
                    >
                      バイタル
                    </Button>
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── セクション: 隔離拘束・外出外泊 ── */}
      <Box sx={{ bgcolor: '#e3edf7', px: 1.5, py: 0.5, borderLeft: '1px solid #c5d5e8', borderRight: '1px solid #c5d5e8' }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e3a5f' }}>隔離拘束・外出外泊</Typography>
      </Box>
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 0, borderTop: 'none', borderRadius: 0 }}>
        <Table size="small">
          <TableBody>
            {/* 病室 */}
            <TableRow>
              <TableCell sx={{ ...stickyCell, minWidth: 120, fontSize: '0.7rem' }}>病室</TableCell>
              {dailySummary.map((d, i) => (
                <TableCell key={i} align="center" sx={{ fontSize: '0.7rem', minWidth: 85 }}>{d.room}</TableCell>
              ))}
            </TableRow>
            {/* 隔離 */}
            <TableRow>
              <TableCell sx={{ ...stickyCell, fontSize: '0.7rem' }}>隔離</TableCell>
              {dailySummary.map((d, i) => (
                <TableCell key={i} align="center" sx={{ fontSize: '0.7rem', color: d.isolation !== '—' ? '#e53935' : 'text.disabled' }}>
                  {d.isolation}
                </TableCell>
              ))}
            </TableRow>
            {/* 拘束 */}
            <TableRow>
              <TableCell sx={{ ...stickyCell, fontSize: '0.7rem' }}>拘束</TableCell>
              {dailySummary.map((d, i) => (
                <TableCell key={i} align="center" sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>{d.restraint}</TableCell>
              ))}
            </TableRow>
            {/* 行動制限(その他) */}
            <TableRow>
              <TableCell sx={{ ...stickyCell, fontSize: '0.7rem' }}>行動制限(その他)</TableCell>
              {dailySummary.map((d, i) => (
                <TableCell key={i} align="center" sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>{d.behaviorLimit}</TableCell>
              ))}
            </TableRow>
            {/* 外出・外泊 */}
            <TableRow>
              <TableCell sx={{ ...stickyCell, fontSize: '0.7rem' }}>外出・外泊</TableCell>
              {dailySummary.map((d, i) => (
                <TableCell key={i} align="center" sx={{ fontSize: '0.7rem', color: d.outing !== '—' ? '#1e40af' : 'text.disabled' }}>
                  {d.outing}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── セクション: バイタル・サイングラフ ── */}
      <Box sx={{ bgcolor: '#e3edf7', px: 1.5, py: 0.5, borderLeft: '1px solid #c5d5e8', borderRight: '1px solid #c5d5e8' }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e3a5f' }}>バイタル・サイングラフ</Typography>
      </Box>
      <Paper variant="outlined" sx={{ mb: 2, borderTop: 'none', borderRadius: 0 }}>
        <Box sx={{ display: 'flex' }}>
          {/* Left label column to align with tables */}
          <Box sx={{ minWidth: 120, maxWidth: 120, bgcolor: '#f8fafc', borderRight: '1px solid #e0e0e0', p: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {[
                { label: '体温', color: '#e53935', unit: '℃' },
                { label: 'BP', color: '#1e40af', unit: 'mmHg' },
                { label: '脈拍', color: '#d32f2f', unit: '回/分' },
                { label: 'SpO2', color: '#2e7d32', unit: '%' },
                { label: '呼吸', color: '#9c27b0', unit: '回/分' },
              ].map((item) => (
                <Stack key={item.label} direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 12, height: 3, bgcolor: item.color, borderRadius: 1 }} />
                  <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>{item.label}({item.unit})</Typography>
                </Stack>
              ))}
            </Box>
          </Box>
          {/* Chart area */}
          <Box sx={{ flex: 1, py: 1, pr: 1 }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" fontSize={11} tick={{ fill: '#666' }} />
                <YAxis
                  yAxisId="vitals"
                  domain={[0, 300]}
                  ticks={[0, 50, 100, 150, 200, 250, 300]}
                  fontSize={10}
                  tick={{ fill: '#666' }}
                  width={35}
                />
                <YAxis
                  yAxisId="temp"
                  orientation="right"
                  domain={[35, 40]}
                  ticks={[35, 36, 37, 38, 39, 40]}
                  fontSize={10}
                  tick={{ fill: '#e53935' }}
                  width={35}
                />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <ReferenceLine yAxisId="vitals" y={120} stroke="#ccc" strokeDasharray="3 3" />
                <ReferenceLine yAxisId="vitals" y={80} stroke="#ccc" strokeDasharray="3 3" />
                {/* BP上 - blue solid */}
                <Line yAxisId="vitals" type="monotone" dataKey="BP(上)" stroke="#1e40af" strokeWidth={2} dot={{ r: 4, fill: '#1e40af' }} connectNulls />
                {/* BP下 - blue dashed */}
                <Line yAxisId="vitals" type="monotone" dataKey="BP(下)" stroke="#1e40af" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 4, fill: '#1e40af' }} connectNulls />
                {/* 脈拍 - red */}
                <Line yAxisId="vitals" type="monotone" dataKey="脈拍" stroke="#d32f2f" strokeWidth={2} dot={{ r: 4, fill: '#d32f2f' }} connectNulls />
                {/* SpO2 - green */}
                <Line yAxisId="vitals" type="monotone" dataKey="SpO2" stroke="#2e7d32" strokeWidth={2} dot={{ r: 3, fill: '#2e7d32', stroke: '#2e7d32' }} connectNulls />
                {/* 呼吸 - purple */}
                <Line yAxisId="vitals" type="monotone" dataKey="呼吸" stroke="#9c27b0" strokeWidth={1.5} dot={{ r: 3, fill: '#9c27b0' }} connectNulls />
                {/* 体温 - red (right axis) */}
                <Line yAxisId="temp" type="monotone" dataKey="体温" stroke="#e53935" strokeWidth={2} dot={{ r: 4, fill: '#ff9800', stroke: '#e53935', strokeWidth: 2 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Paper>

      {/* Data Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell colSpan={2} sx={{ ...stickyCell, minWidth: 120, zIndex: 3 }}>項目</TableCell>
              {dailySummary.map((d) => (
                <TableCell key={d.dateLabel} align="center" sx={{ minWidth: 85, fontWeight: 700 }}>{d.dateLabel}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* ── 予定オーダ ── */}
            <GroupHeaderRow label="予定オーダ" actionLabel="一覧" colSpan={dailySummary.length + 2} />
            <DataRow label="" sub="" data={dailySummary} dataKey="orderCount" stickyCell={stickyCell} render={(v) => v > 0 ? `${v}件` : '—'} />

            {/* ── 検査結果 ── */}
            <GroupHeaderRow label="検査結果" actionLabel="設定" colSpan={dailySummary.length + 2} />
            <DataRow label="" sub="" data={dailySummary} dataKey="labResult" stickyCell={stickyCell} />

            {/* ── 食事 ── */}
            <GroupHeaderRow label="食事" actionLabel="凡例" colSpan={dailySummary.length + 2} />
            <DataRow label="" sub="" data={dailySummary} dataKey="mealType" stickyCell={stickyCell} />

            {/* ── 身体測定 ── */}
            <DataRow label="身長" sub="" data={dailySummary} dataKey="height" stickyCell={stickyCell} />
            <DataRow label="体重(BMI)" sub="" data={dailySummary} dataKey="weightBmi" stickyCell={stickyCell} />

            {/* ── 排泄 ── */}
            <DataRow label="便" sub="" data={dailySummary} dataKey="stool" stickyCell={stickyCell} />
            <DataRow label="尿" sub="" data={dailySummary} dataKey="urine" stickyCell={stickyCell} />

            {/* ── 食事(摂取) ── */}
            <SubGroupRow label="食事" sub="朝" data={dailySummary} dataKey="breakfast" stickyCell={stickyCell} rowSpan={3} />
            <SubRow sub="昼" data={dailySummary} dataKey="lunch" stickyCell={stickyCell} />
            <SubRow sub="夕" data={dailySummary} dataKey="dinner" stickyCell={stickyCell} />

            {/* ── 睡眠 ── */}
            <DataRow label="睡眠" sub="" data={dailySummary} dataKey="sleep" stickyCell={stickyCell} />

            {/* ── 服薬 ── */}
            <SubGroupRow label="服薬" sub="朝" data={dailySummary} dataKey="medAm" stickyCell={stickyCell} rowSpan={4} />
            <SubRow sub="昼" data={dailySummary} dataKey="medNoon" stickyCell={stickyCell} />
            <SubRow sub="夕" data={dailySummary} dataKey="medPm" stickyCell={stickyCell} />
            <SubRow sub="寝" data={dailySummary} dataKey="medNight" stickyCell={stickyCell} />

            {/* ── 記録系 ── */}
            <DataRow label="診療録" sub="" data={dailySummary} dataKey="karteNote" stickyCell={stickyCell} />
            <DataRow label="部門診療録" sub="" data={dailySummary} dataKey="deptNote" stickyCell={stickyCell} />
            <DataRow label="移行記事" sub="" data={dailySummary} dataKey="transferNote" stickyCell={stickyCell} />
            <DataRow label="看護記録" sub="" data={dailySummary} dataKey="nursingNote" stickyCell={stickyCell} />

            {/* ── その他 ── */}
            <DataRow label="便(性状)" sub="" data={dailySummary} dataKey="stoolDetail" stickyCell={stickyCell} />
            <DataRow label="入浴" sub="" data={dailySummary} dataKey="bath" stickyCell={stickyCell} />

            {/* ── サイン ── */}
            <TableRow>
              <TableCell colSpan={2} sx={{ ...stickyCell, bgcolor: '#e3edf7', color: '#1e3a5f', fontWeight: 700, borderTop: '2px solid #c5d5e8' }}>
                サイン
              </TableCell>
              {dailySummary.map((d, i) => (
                <TableCell key={i} align="center" sx={{ fontSize: '0.75rem', bgcolor: '#e3edf7', borderTop: '2px solid #c5d5e8', fontWeight: 600, color: '#1e3a5f' }}>
                  {d.sign}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FlowsheetView;
