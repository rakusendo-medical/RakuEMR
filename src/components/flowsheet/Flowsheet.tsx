import React from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableRow, Button, Stack, Link as MuiLink,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface Props {
  patientId?: string;
}

// 7日分の固定モック(2026-05-13〜2026-05-19、当日=5/19)
type OrderKind = '薬' | '注' | '検' | '処' | '画' | '心' | 'E';
type MealStatus = '通常指示' | '臨時変更' | '欠食' | '外出・外泊' | '絶食';

interface DailyRow {
  date: string;
  weekday: string;
  admitDay: number;
  isToday: boolean;
  room: string;
  orderKinds: OrderKind[];
  labLinks: string[];
  meal: { morning: MealStatus; lunch: MealStatus; dinner: MealStatus };
  height: number;
  weightBmi: string;
  stool: number;
  urine: string;
  intake: { morning: string; lunch: string; dinner: string };
  sleep: string;
  med: { morning: string; lunch: string; dinner: string; night: string };
  karteLinks: string[];
  deptLinks: string[];
  transferLinks: string[];
  nursingLinks: string[];
  stoolDetail: string;
  bath: string;
  sign: string;
}

const DAILY: DailyRow[] = [
  {
    date: '2026/5/13', weekday: '水', admitDay: 28, isToday: false, room: 'E102号室',
    orderKinds: ['薬', '検', '処'], labLinks: ['外(CRC)血液'],
    meal: { morning: '通常指示', lunch: '臨時変更', dinner: '通常指示' },
    height: 167.8, weightBmi: '55.8(19.8)', stool: 0, urine: '—',
    intake: { morning: '5', lunch: '8', dinner: '7' },
    sleep: '浅眠',
    med: { morning: '—', lunch: '—', dinner: '—', night: '—' },
    karteLinks: ['隔離開始(タイトル)', '生理(指示)'],
    deptLinks: ['摂食療法(実施)'], transferLinks: [], nursingLinks: [],
    stoolDetail: '—', bath: '入浴', sign: '鈴木',
  },
  {
    date: '2026/5/14', weekday: '木', admitDay: 29, isToday: false, room: 'E102号室',
    orderKinds: ['注', '検', '処'], labLinks: ['院内血液', '外(CRC)血液', '院内血液'],
    meal: { morning: '通常指示', lunch: '欠食', dinner: '通常指示' },
    height: 167.8, weightBmi: '57(20.2)', stool: 1, urine: '○',
    intake: { morning: '2', lunch: '0', dinner: '5' },
    sleep: '良眠',
    med: { morning: '✓(高橋)', lunch: '✓(高橋)', dinner: '✓(高橋)', night: '—' },
    karteLinks: ['精神療法(xx開始)', '生理(指示)'],
    deptLinks: ['摂食療法(実施)'], transferLinks: [], nursingLinks: ['看護記録(熱発)'],
    stoolDetail: '硬便', bath: '入浴', sign: '高橋',
  },
  {
    date: '2026/5/15', weekday: '金', admitDay: 30, isToday: false, room: 'E102号室',
    orderKinds: ['薬', '注', '検', '処'], labLinks: [],
    meal: { morning: '通常指示', lunch: '通常指示', dinner: '通常指示' },
    height: 167.8, weightBmi: '55.8(19.8)', stool: 2, urine: '—',
    intake: { morning: '5', lunch: '5', dinner: '10' },
    sleep: '普通',
    med: { morning: '✓(山本)', lunch: '—', dinner: '✓(山本)', night: '✓(山本)' },
    karteLinks: ['隔離開始(タイトル)', '精神療法(xx開始)', '生理(指示)'],
    deptLinks: [], transferLinks: [], nursingLinks: [],
    stoolDetail: '普通便', bath: 'シャワー浴', sign: '山本',
  },
  {
    date: '2026/5/16', weekday: '土', admitDay: 31, isToday: false, room: 'E102号室',
    orderKinds: ['薬', '注', '検', '処', '画', '心', 'E'], labLinks: ['院内血液'],
    meal: { morning: '外出・外泊', lunch: '通常指示', dinner: '欠食' },
    height: 167.8, weightBmi: '57(20.2)', stool: 1, urine: '○',
    intake: { morning: '2', lunch: '8', dinner: '0' },
    sleep: '浅眠',
    med: { morning: '✓(佐々木)', lunch: '✓(佐々木)', dinner: '—', night: '✓(佐々木)' },
    karteLinks: [],
    deptLinks: ['摂食療法(実施)'], transferLinks: [], nursingLinks: ['看護記録(熱発)'],
    stoolDetail: '硬便', bath: '清拭', sign: '佐々木',
  },
  {
    date: '2026/5/17', weekday: '日', admitDay: 32, isToday: false, room: 'E102号室',
    orderKinds: ['薬', '画'], labLinks: ['外(CRC)血液'],
    meal: { morning: '通常指示', lunch: '通常指示', dinner: '外出・外泊' },
    height: 167.8, weightBmi: '55.8(19.8)', stool: 0, urine: '—',
    intake: { morning: '5', lunch: '0', dinner: '2' },
    sleep: '良眠',
    med: { morning: '✓(中田)', lunch: '—', dinner: '✓(中田)', night: '✓(中田)' },
    karteLinks: ['隔離開始(タイトル)', '精神療法(xx開始)'],
    deptLinks: ['摂食療法(実施)'], transferLinks: [], nursingLinks: [],
    stoolDetail: '—', bath: '入浴', sign: '中田',
  },
  {
    date: '2026/5/18', weekday: '月', admitDay: 33, isToday: false, room: 'E102号室',
    orderKinds: ['注', '画'], labLinks: ['院内血液', '外(CRC)血液'],
    meal: { morning: '通常指示', lunch: '通常指示', dinner: '臨時変更' },
    height: 167.8, weightBmi: '57(20.2)', stool: 2, urine: '○',
    intake: { morning: '2', lunch: '5', dinner: '8' },
    sleep: '普通',
    med: { morning: '✓(鈴木)', lunch: '✓(鈴木)', dinner: '✓(鈴木)', night: '—' },
    karteLinks: ['精神療法(xx開始)', '生理(指示)'],
    deptLinks: ['摂食療法(実施)'], transferLinks: [], nursingLinks: ['看護記録(熱発)'],
    stoolDetail: '普通便', bath: 'シャワー浴', sign: '鈴木',
  },
  {
    date: '2026/5/19', weekday: '火', admitDay: 34, isToday: true, room: 'E102号室',
    orderKinds: ['薬', '注', '画'], labLinks: ['外(CRC)血液'],
    meal: { morning: '通常指示', lunch: '臨時変更', dinner: '絶食' },
    height: 167.8, weightBmi: '55.8(19.8)', stool: 0, urine: '—',
    intake: { morning: '5', lunch: '8', dinner: '7' },
    sleep: '良眠',
    med: { morning: '✓(高橋)', lunch: '—', dinner: '✓(高橋)', night: '—' },
    karteLinks: ['隔離開始(タイトル)', '精神療法(xx開始)'],
    deptLinks: ['摂食療法(実施)'], transferLinks: [], nursingLinks: [],
    stoolDetail: '—', bath: '—', sign: '高橋',
  },
];

// 隔離拘束帯: dateIdx range [from, to]
interface RestraintBar {
  from: number;
  to: number;
  startLabel?: string;  // 開始セルに表示するテキスト("10:00〜")
  endLabel?: string;    // 終了セルに表示するテキスト("〜16:00")
  singleLabel?: string; // 単日の場合のテキスト
  bg: string;
}

const RESTRAINTS = {
  isolation: { from: 1, to: 5, startLabel: '10:00〜', endLabel: '〜16:00', bg: '#fff1d6' } as RestraintBar,
  restraint: { from: 2, to: 5, startLabel: '08:00〜', endLabel: '〜20:00', bg: '#fde0e0' } as RestraintBar,
  behavior:  { from: 3, to: 6, startLabel: '09:00〜', endLabel: '〜08:00', bg: '#fff8c5' } as RestraintBar,
  outing:    { from: 4, to: 4, singleLabel: '10:00〜18:00', bg: '#dbeafe' } as RestraintBar,
};

// チャート用データ(7日分)
const CHART_DATA = DAILY.map((d) => {
  // モック値:画像のグラフ形状にざっくり合わせる
  const i = d.admitDay - 28;
  const tempPattern = [36.4, 37.2, 36.8, 37.4, 36.5, 37.2, 36.6];
  const bpHighPattern = [115, 122, 128, 135, 110, 118, 125];
  const bpLowPattern = [70, 75, 78, 82, 68, 72, 76];
  const pulsePattern = [88, 102, 80, 95, 70, 105, 82];
  const spo2Pattern = [98, 97, 98, 97, 98, 98, 97];
  const respPattern = [16, 18, 17, 19, 16, 18, 17];
  return {
    date: d.date.slice(5),
    体温: tempPattern[i],
    'BP(上)': bpHighPattern[i],
    'BP(下)': bpLowPattern[i],
    脈拍: pulsePattern[i],
    SpO2: spo2Pattern[i],
    呼吸: respPattern[i],
  };
});

const ORDER_COLOR: Record<OrderKind, { fg: string; bg: string }> = {
  薬: { fg: '#dc2626', bg: 'transparent' },
  注: { fg: '#2563eb', bg: 'transparent' },
  検: { fg: '#475569', bg: 'transparent' },
  処: { fg: '#475569', bg: 'transparent' },
  画: { fg: '#475569', bg: 'transparent' },
  心: { fg: '#475569', bg: 'transparent' },
  E: { fg: '#475569', bg: 'transparent' },
};

const MEAL_STYLE: Record<MealStatus, { bg: string; fg: string }> = {
  通常指示: { bg: '#16a34a', fg: '#fff' },
  臨時変更: { bg: '#ea580c', fg: '#fff' },
  欠食:     { bg: '#dc2626', fg: '#fff' },
  '外出・外泊': { bg: '#2563eb', fg: '#fff' },
  絶食:     { bg: '#991b1b', fg: '#fff' },
};

// 共通スタイル
// 単一 Table 化（B 案・S2 2026-05-29）: 7 つの独立した Table を 1 つの
// `<Table sx={{ tableLayout: 'fixed' }}>` + `<colgroup>` に統合し、9 列の幅を colgroup で共有する。
// これにより日付列の縦位置が全行で完全に一致する。
const LABEL_COL_WIDTH = 130;
const SUB_COL_WIDTH = 40;
const DAY_COL_WIDTH = 110;

const stickyLabelCell = {
  position: 'sticky' as const,
  left: 0,
  zIndex: 1,
  bgcolor: '#f8fafc',
  fontWeight: 600,
  fontSize: '0.75rem',
  minWidth: LABEL_COL_WIDTH,
  width: LABEL_COL_WIDTH,
};
const stickySubCell = {
  position: 'sticky' as const,
  left: LABEL_COL_WIDTH,
  zIndex: 1,
  bgcolor: '#f8fafc',
  fontWeight: 500,
  fontSize: '0.75rem',
  minWidth: SUB_COL_WIDTH,
  width: SUB_COL_WIDTH,
  pl: 1,
};
const dayCellBase = {
  fontSize: '0.75rem',
  minWidth: DAY_COL_WIDTH,
  width: DAY_COL_WIDTH,
  textAlign: 'center' as const,
  py: 0.5,
};
// セクション見出し行（旧: 独立 `<Box>` ヘッダー → 単一 Table 化により `<TableRow>` + `<TableCell colSpan={9}>` で表現）
const sectionHeaderCellSx = {
  bgcolor: '#e3edf7',
  color: '#1e3a5f',
  fontWeight: 700,
  fontSize: '0.75rem',
  py: 0.5,
  px: 1.5,
  borderBottom: '1px solid #c5d5e8',
};

function dayCellSx(isToday: boolean): any {
  return {
    ...dayCellBase,
    bgcolor: isToday ? '#fff8e1' : undefined,
  };
}

function todayHeaderCellSx(isToday: boolean): any {
  return {
    ...dayCellBase,
    fontWeight: 700,
    bgcolor: isToday ? '#fff3c4' : '#e3edf7',
    color: '#1e3a5f',
  };
}

// 縦スクロール時のヘッダ 3 行スティッキー化。
// MUI の stickyHeader 自動 CSS だけでは day cell 側で position: sticky が
// 安定して効かないケースがあったため、各行に明示で付与する。
// top 値の初期値はヘッダ 3 行の cumulative 高さの目安。
const HEADER_ROW_TOP = { row1: 0, row2: 30, row3: 58 };

// 行動制限・隔離・外出など、特定の日付範囲だけセルに色帯+ラベルを置く
function RestraintRow({ label, bar }: { label: string; bar: RestraintBar }) {
  return (
    <TableRow>
      <TableCell sx={stickyLabelCell}>{label}</TableCell>
      <TableCell sx={stickySubCell} />
      {DAILY.map((d, i) => {
        const inRange = i >= bar.from && i <= bar.to;
        const isStart = i === bar.from;
        const isEnd = i === bar.to;
        const single = bar.from === bar.to;
        const text = single
          ? (isStart ? bar.singleLabel : '')
          : isStart
            ? bar.startLabel
            : isEnd
              ? bar.endLabel
              : '';
        return (
          <TableCell
            key={i}
            sx={{
              ...dayCellSx(d.isToday),
              bgcolor: inRange ? bar.bg : (d.isToday ? '#fff8e1' : undefined),
              fontWeight: text ? 600 : undefined,
            }}
          >
            {text || ''}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

// セクション見出し行（colSpan={9} の汎用化）
function SectionHeaderRow({ title }: { title: string }) {
  return (
    <TableRow>
      <TableCell colSpan={9} sx={sectionHeaderCellSx}>
        {title}
      </TableCell>
    </TableRow>
  );
}

const FlowsheetView: React.FC<Props> = () => {
  return (
    <Box>
      {/* === 単一 Table（B 案・全 7 セクション統合）=== */}
      {/*
        TableContainer のデフォルト `overflow-x: auto` は sticky の参照スクロールコンテナを
        奪う（縦は visible なのに横は scroll になり、結果 sticky の縦位置が効かなくなる）。
        ここでは overflow を visible に明示し、横スクロールは外側（KartePage の overflow:auto）に
        任せることで sticky の参照を外側スクロール Box に揃える。
      */}
      <TableContainer component={Paper} variant="outlined" sx={{ overflow: 'visible' }}>
        {/* テーブル幅を colgroup 合計（130 + 40 + 110×7 = 940）で固定。
            sx の width: 'auto' を明示することで MUI Table のデフォルト width: '100%' を override し、
            コンテナ幅に対する比例拡大を防いで各 col が指定通りの幅を保つ。 */}
        {/*
          スティッキーヘッダ: 各セルに style 属性（インライン）で
          position: sticky と top を強制適用する。sx 経由だと MUI の
          stickyHeader と CSS 特異度競合で top が上書きされる事象があったため
          style 属性で確実に効かせる。
        */}
        <Table size="small" sx={{ tableLayout: 'fixed', width: 'auto' }}>
          {/* 9 列の幅を colgroup で共有: label(130) / sub(40) / day(110)×7 */}
          <colgroup>
            <col style={{ width: LABEL_COL_WIDTH }} />
            <col style={{ width: SUB_COL_WIDTH }} />
            {DAILY.map((_, i) => (
              <col key={i} style={{ width: DAY_COL_WIDTH }} />
            ))}
          </colgroup>
          <TableBody>
            {/* ===== 上部ヘッダー（スティッキー化）===== */}
            {/* 日付ナビ行（top: 0） */}
            <TableRow>
              <TableCell
                sx={{ ...stickyLabelCell, bgcolor: '#e3edf7' }}
                style={{ position: 'sticky', top: HEADER_ROW_TOP.row1, left: 0, zIndex: 100 }}
              >
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {['≪', '＜', '当日', '＞', '≫'].map((s, i) => (
                    <Typography
                      key={i}
                      sx={{
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: 700,
                        color: s === '当日' ? '#1e3a5f' : '#1e40af',
                      }}
                    >
                      {s}
                    </Typography>
                  ))}
                </Stack>
              </TableCell>
              <TableCell
                sx={{ ...stickySubCell, bgcolor: '#e3edf7' }}
                style={{ position: 'sticky', top: HEADER_ROW_TOP.row1, left: LABEL_COL_WIDTH, zIndex: 100 }}
              />
              {DAILY.map((d, i) => (
                <TableCell
                  key={i}
                  sx={todayHeaderCellSx(d.isToday)}
                  style={{ position: 'sticky', top: HEADER_ROW_TOP.row1, zIndex: 100 }}
                >
                  {d.date}({d.weekday})
                </TableCell>
              ))}
            </TableRow>
            {/* 在院日数（top: 30） */}
            <TableRow>
              <TableCell
                sx={stickyLabelCell}
                style={{ position: 'sticky', top: HEADER_ROW_TOP.row2, left: 0, zIndex: 100 }}
              >在院日数</TableCell>
              <TableCell
                sx={stickySubCell}
                style={{ position: 'sticky', top: HEADER_ROW_TOP.row2, left: LABEL_COL_WIDTH, zIndex: 100 }}
              />
              {DAILY.map((d, i) => (
                <TableCell
                  key={i}
                  sx={{ ...dayCellSx(d.isToday), bgcolor: d.isToday ? '#fff8e1' : '#fff' }}
                  style={{ position: 'sticky', top: HEADER_ROW_TOP.row2, zIndex: 100 }}
                >{d.admitDay}日目</TableCell>
              ))}
            </TableRow>
            {/* 看護記録・バイタル ボタン行（top: 58） */}
            <TableRow>
              <TableCell
                sx={stickyLabelCell}
                style={{ position: 'sticky', top: HEADER_ROW_TOP.row3, left: 0, zIndex: 100 }}
              />
              <TableCell
                sx={stickySubCell}
                style={{ position: 'sticky', top: HEADER_ROW_TOP.row3, left: LABEL_COL_WIDTH, zIndex: 100 }}
              />
              {DAILY.map((d, i) => (
                <TableCell
                  key={i}
                  sx={{ ...dayCellSx(d.isToday), py: 0.3, bgcolor: d.isToday ? '#fff8e1' : '#fff' }}
                  style={{ position: 'sticky', top: HEADER_ROW_TOP.row3, zIndex: 100 }}
                >
                  <Stack direction="row" spacing={0.3} justifyContent="center">
                    <Button
                      size="small" variant="outlined"
                      startIcon={<EditNoteIcon sx={{ fontSize: '0.85rem !important' }} />}
                      sx={{
                        fontSize: '0.65rem', minWidth: 0, px: 0.5, py: 0,
                        lineHeight: 1.5, color: '#1e3a5f', borderColor: '#c5d5e8',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      看護記録
                    </Button>
                    <Button
                      size="small" variant="outlined"
                      startIcon={<ThermostatIcon sx={{ fontSize: '0.85rem !important' }} />}
                      sx={{
                        fontSize: '0.65rem', minWidth: 0, px: 0.5, py: 0,
                        lineHeight: 1.5, color: '#e53935', borderColor: '#ffcdd2',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      バイタル
                    </Button>
                  </Stack>
                </TableCell>
              ))}
            </TableRow>

            {/* ===== 隔離拘束・外出外泊 ===== */}
            <SectionHeaderRow title="隔離拘束・外出外泊" />
            {/* 病室 */}
            <TableRow>
              <TableCell sx={stickyLabelCell}>病室</TableCell>
              <TableCell sx={stickySubCell} />
              {DAILY.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.room}</TableCell>
              ))}
            </TableRow>
            <RestraintRow label="隔離" bar={RESTRAINTS.isolation} />
            <RestraintRow label="拘束" bar={RESTRAINTS.restraint} />
            <RestraintRow label="行動制限(その他)" bar={RESTRAINTS.behavior} />
            <RestraintRow label="外出・外泊" bar={RESTRAINTS.outing} />

            {/* ===== バイタル・サイングラフ ===== */}
            <SectionHeaderRow title="バイタル・サイングラフ" />
            <TableRow>
              <TableCell colSpan={9} sx={{ p: 0, borderBottom: '1px solid #e0e0e0' }}>
                <Box sx={{ display: 'flex' }}>
                  <Box sx={{
                    minWidth: LABEL_COL_WIDTH + SUB_COL_WIDTH, maxWidth: LABEL_COL_WIDTH + SUB_COL_WIDTH,
                    bgcolor: '#f8fafc', borderRight: '1px solid #e0e0e0', p: 1,
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  }}>
                    <Stack spacing={0.5}>
                      {[
                        { label: '体温', color: '#e53935', unit: '℃' },
                        { label: 'BP', color: '#1e40af', unit: 'mmHg' },
                        { label: '脈拍', color: '#d32f2f', unit: '回/分' },
                        { label: 'SpO2', color: '#2e7d32', unit: '%' },
                        { label: '呼吸', color: '#9c27b0', unit: '回/分' },
                      ].map((item) => (
                        <Stack key={item.label} direction="row" spacing={0.5} alignItems="center">
                          <Box sx={{ width: 12, height: 3, bgcolor: item.color, borderRadius: 1 }} />
                          <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                            {item.label}({item.unit})
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                  {/*
                    チャート本体。テーブル日付列とチャート内データ点の横位置を一致させるため
                    LineChart の左右マージン・Y 軸幅をゼロ化し、プロット領域 = TableCell 右側
                    （flex: 1 領域）と完全に一致させる。Y 軸の主要参照値は ReferenceLine の
                    label で代替表示する。
                  */}
                  <Box sx={{ flex: 1, py: 1 }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={CHART_DATA} margin={{ top: 10, right: 0, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        {/*
                          列幅 110px の中央にデータ点を配置するため、左右に半列分（55px）の
                          padding を入れる。これで categorical の 7 点が各日付列の中央に揃う。
                        */}
                        <XAxis
                          dataKey="date"
                          fontSize={11}
                          tick={{ fill: '#666' }}
                          padding={{ left: DAY_COL_WIDTH / 2, right: DAY_COL_WIDTH / 2 }}
                        />
                        <YAxis yAxisId="vitals" domain={[0, 300]} hide width={0} />
                        <YAxis yAxisId="temp" orientation="right" domain={[35, 40]} hide width={0} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <ReferenceLine yAxisId="vitals" y={120} stroke="#ccc" strokeDasharray="3 3"
                          label={{ value: '120', position: 'insideLeft', fontSize: 9, fill: '#666' }} />
                        <ReferenceLine yAxisId="vitals" y={80} stroke="#ccc" strokeDasharray="3 3"
                          label={{ value: '80', position: 'insideLeft', fontSize: 9, fill: '#666' }} />
                        <ReferenceLine yAxisId="temp" y={37} stroke="#fde0e0" strokeDasharray="3 3"
                          label={{ value: '37℃', position: 'insideRight', fontSize: 9, fill: '#e53935' }} />
                        <Line yAxisId="vitals" type="monotone" dataKey="BP(上)" stroke="#1e40af" strokeWidth={2} dot={{ r: 4, fill: '#1e40af' }} connectNulls />
                        <Line yAxisId="vitals" type="monotone" dataKey="BP(下)" stroke="#1e40af" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 4, fill: '#1e40af' }} connectNulls />
                        <Line yAxisId="vitals" type="monotone" dataKey="脈拍" stroke="#d32f2f" strokeWidth={2} dot={{ r: 4, fill: '#d32f2f' }} connectNulls />
                        <Line yAxisId="vitals" type="monotone" dataKey="SpO2" stroke="#2e7d32" strokeWidth={2} dot={{ r: 3, fill: '#2e7d32' }} connectNulls />
                        <Line yAxisId="vitals" type="monotone" dataKey="呼吸" stroke="#9c27b0" strokeWidth={1.5} dot={{ r: 3, fill: '#9c27b0' }} connectNulls />
                        <Line yAxisId="temp" type="monotone" dataKey="体温" stroke="#e53935" strokeWidth={2} dot={{ r: 4, fill: '#ff9800', stroke: '#e53935', strokeWidth: 2 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              </TableCell>
            </TableRow>

            {/* ===== 指示・実施管理 ===== */}
            <SectionHeaderRow title="指示・実施管理" />
            {/* 予定オーダ */}
            <TableRow>
              <TableCell sx={stickyLabelCell}>
                <Stack direction="column" alignItems="flex-start" spacing={0.3}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>予定オーダ</Typography>
                  <Button
                    size="small" variant="outlined"
                    sx={{ fontSize: '0.6rem', minWidth: 0, px: 1, py: 0, lineHeight: 1.5, color: '#1e40af', borderColor: '#1e40af' }}
                  >
                    一覧
                  </Button>
                </Stack>
              </TableCell>
              <TableCell sx={stickySubCell} />
              {DAILY.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>
                  <Stack direction="row" spacing={0} justifyContent="center" sx={{ flexWrap: 'wrap' }}>
                    {d.orderKinds.map((k, idx) => (
                      <React.Fragment key={`${k}-${idx}`}>
                        <Typography
                          component="span"
                          sx={{ fontSize: '0.75rem', fontWeight: 700, color: ORDER_COLOR[k].fg }}
                        >
                          {k}
                        </Typography>
                        {idx < d.orderKinds.length - 1 && (
                          <Typography component="span" sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>／</Typography>
                        )}
                      </React.Fragment>
                    ))}
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
            {/* 検査結果 */}
            <TableRow>
              <TableCell sx={stickyLabelCell}>
                <Stack direction="column" alignItems="flex-start" spacing={0.3}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>検査結果</Typography>
                  <Button
                    size="small" variant="outlined"
                    sx={{ fontSize: '0.6rem', minWidth: 0, px: 1, py: 0, lineHeight: 1.5, color: '#1e40af', borderColor: '#1e40af' }}
                  >
                    設定
                  </Button>
                </Stack>
              </TableCell>
              <TableCell sx={stickySubCell} />
              {DAILY.map((d, i) => (
                <TableCell key={i} sx={{ ...dayCellSx(d.isToday), verticalAlign: 'top' }}>
                  {d.labLinks.length === 0 ? '—' : (
                    <Stack spacing={0.2} alignItems="center">
                      {d.labLinks.map((l, idx) => (
                        <MuiLink
                          key={idx}
                          underline="always"
                          sx={{ fontSize: '0.7rem', color: '#1e40af', cursor: 'pointer' }}
                        >
                          {l}
                        </MuiLink>
                      ))}
                    </Stack>
                  )}
                </TableCell>
              ))}
            </TableRow>
            {/* 食事 - 朝/昼/夕 */}
            {(['morning', 'lunch', 'dinner'] as const).map((mealKey, mealIdx) => {
              const subLabel = mealKey === 'morning' ? '朝' : mealKey === 'lunch' ? '昼' : '夕';
              return (
                <TableRow key={mealKey}>
                  {mealIdx === 0 && (
                    <TableCell rowSpan={3} sx={{ ...stickyLabelCell, verticalAlign: 'top' }}>食事</TableCell>
                  )}
                  <TableCell sx={stickySubCell}>{subLabel}</TableCell>
                  {DAILY.map((d, i) => {
                    const status = d.meal[mealKey];
                    const style = MEAL_STYLE[status];
                    return (
                      <TableCell key={i} sx={dayCellSx(d.isToday)}>
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 1, py: 0.2,
                            bgcolor: style.bg, color: style.fg,
                            fontSize: '0.7rem', fontWeight: 700,
                            borderRadius: 0.5,
                          }}
                        >
                          {status}
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}

            {/* ===== 基本観察項目 ===== */}
            <SectionHeaderRow title="基本観察項目" />
            <TableRow>
              <TableCell sx={stickyLabelCell}>身長</TableCell>
              <TableCell sx={stickySubCell} />
              {DAILY.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.height}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={stickyLabelCell}>体重(BMI)</TableCell>
              <TableCell sx={stickySubCell} />
              {DAILY.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.weightBmi}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={stickyLabelCell}>便</TableCell>
              <TableCell sx={stickySubCell} />
              {DAILY.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.stool}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={stickyLabelCell}>尿</TableCell>
              <TableCell sx={stickySubCell} />
              {DAILY.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.urine}</TableCell>
              ))}
            </TableRow>
            {/* 食事(摂取量) 朝/昼/夕 */}
            {(['morning', 'lunch', 'dinner'] as const).map((k, idx) => {
              const sub = k === 'morning' ? '朝' : k === 'lunch' ? '昼' : '夕';
              return (
                <TableRow key={`intake-${k}`}>
                  {idx === 0 && (
                    <TableCell rowSpan={3} sx={{ ...stickyLabelCell, verticalAlign: 'top' }}>食事</TableCell>
                  )}
                  <TableCell sx={stickySubCell}>{sub}</TableCell>
                  {DAILY.map((d, i) => (
                    <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.intake[k]}</TableCell>
                  ))}
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell sx={stickyLabelCell}>睡眠</TableCell>
              <TableCell sx={stickySubCell} />
              {DAILY.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.sleep}</TableCell>
              ))}
            </TableRow>
            {/* 服薬 朝/昼/夕/寝 */}
            {(['morning', 'lunch', 'dinner', 'night'] as const).map((k, idx) => {
              const sub = k === 'morning' ? '朝' : k === 'lunch' ? '昼' : k === 'dinner' ? '夕' : '寝';
              return (
                <TableRow key={`med-${k}`}>
                  {idx === 0 && (
                    <TableCell rowSpan={4} sx={{ ...stickyLabelCell, verticalAlign: 'top' }}>服薬</TableCell>
                  )}
                  <TableCell sx={stickySubCell}>{sub}</TableCell>
                  {DAILY.map((d, i) => (
                    <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.med[k]}</TableCell>
                  ))}
                </TableRow>
              );
            })}

            {/* ===== 記事連携項目 ===== */}
            <SectionHeaderRow title="記事連携項目" />
            {/* 診療録 */}
            <TableRow>
              <TableCell sx={stickyLabelCell}>診療録</TableCell>
              <TableCell sx={stickySubCell} />
              {DAILY.map((d, i) => (
                <TableCell key={i} sx={{ ...dayCellSx(d.isToday), verticalAlign: 'top' }}>
                  {d.karteLinks.length === 0 ? '—' : (
                    <Stack spacing={0.2} alignItems="center">
                      {d.karteLinks.map((l, idx) => (
                        <MuiLink key={idx} underline="always" sx={{ fontSize: '0.7rem', color: '#1e40af', cursor: 'pointer' }}>
                          {l}
                        </MuiLink>
                      ))}
                    </Stack>
                  )}
                </TableCell>
              ))}
            </TableRow>
            {/* 部門診療録 */}
            <TableRow>
              <TableCell sx={stickyLabelCell}>部門診療録</TableCell>
              <TableCell sx={stickySubCell} />
              {DAILY.map((d, i) => (
                <TableCell key={i} sx={{ ...dayCellSx(d.isToday), verticalAlign: 'top' }}>
                  {d.deptLinks.length === 0 ? '—' : (
                    <Stack spacing={0.2} alignItems="center">
                      {d.deptLinks.map((l, idx) => (
                        <MuiLink key={idx} underline="always" sx={{ fontSize: '0.7rem', color: '#1e40af', cursor: 'pointer' }}>
                          {l}
                        </MuiLink>
                      ))}
                    </Stack>
                  )}
                </TableCell>
              ))}
            </TableRow>
            {/* 移行記事 */}
            <TableRow>
              <TableCell sx={stickyLabelCell}>移行記事</TableCell>
              <TableCell sx={stickySubCell} />
              {DAILY.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>
                  {d.transferLinks.length === 0 ? '—' : d.transferLinks.join(', ')}
                </TableCell>
              ))}
            </TableRow>
            {/* 看護記録 */}
            <TableRow>
              <TableCell sx={stickyLabelCell}>看護記録</TableCell>
              <TableCell sx={stickySubCell} />
              {DAILY.map((d, i) => (
                <TableCell key={i} sx={{ ...dayCellSx(d.isToday), verticalAlign: 'top' }}>
                  <Stack spacing={0.3} alignItems="center">
                    {d.nursingLinks.map((l, idx) => (
                      <MuiLink key={idx} underline="always" sx={{ fontSize: '0.7rem', color: '#1e40af', cursor: 'pointer' }}>
                        {l}
                      </MuiLink>
                    ))}
                    <Button
                      size="small" variant="outlined"
                      sx={{ fontSize: '0.6rem', minWidth: 0, px: 1, py: 0, lineHeight: 1.5, color: '#475569', borderColor: '#cbd5e1' }}
                    >
                      新規作成
                    </Button>
                  </Stack>
                </TableCell>
              ))}
            </TableRow>

            {/* ===== 個別ケア・観察項目 ===== */}
            <SectionHeaderRow title="個別ケア・観察項目" />
            <TableRow>
              <TableCell sx={stickyLabelCell}>便(性状)</TableCell>
              <TableCell sx={stickySubCell} />
              {DAILY.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.stoolDetail}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={stickyLabelCell}>入浴</TableCell>
              <TableCell sx={stickySubCell} />
              {DAILY.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.bath}</TableCell>
              ))}
            </TableRow>

            {/* ===== サイン ===== */}
            <TableRow>
              <TableCell sx={{ ...stickyLabelCell, bgcolor: '#e3edf7', color: '#1e3a5f', fontWeight: 700 }}>
                サイン
              </TableCell>
              <TableCell sx={{ ...stickySubCell, bgcolor: '#e3edf7' }} />
              {DAILY.map((d, i) => (
                <TableCell key={i} sx={{ ...dayCellSx(d.isToday), bgcolor: '#e3edf7', color: '#1e3a5f', fontWeight: 700 }}>
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
