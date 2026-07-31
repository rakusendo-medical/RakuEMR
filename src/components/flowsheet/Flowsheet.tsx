import React, { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableRow, Button, Stack, Link as MuiLink, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Checkbox, FormControlLabel,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { IsolationOrder, IsolationSubtype } from '../../types';
import { PATIENTS, ISOLATION_ORDERS, MASTER_OBSERVATION_STATES } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import ObservationRecordDialog from '../isolation/ObservationRecordDialog';
import { NewRecordDialog } from '../karte/MedicalRecordTab';
import NursingRecordDialog from '../../features/flowsheet/components/NursingRecordDialog';

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
  laxative: string;
  bath: string;
  sign: string;
}

const DAILY: DailyRow[] = [
  {
    date: '2026/5/13', weekday: '水', admitDay: 28, isToday: false, room: 'E102号室',
    orderKinds: ['薬', '検', '処'], labLinks: ['外(CRC)血液'],
    meal: { morning: '通常指示', lunch: '臨時変更', dinner: '通常指示' },
    height: 167.8, weightBmi: '55.8(19.8)', stool: 0, urine: '1100',
    intake: { morning: '5', lunch: '8', dinner: '7' },
    sleep: '浅眠',
    med: { morning: '—', lunch: '—', dinner: '—', night: '—' },
    karteLinks: ['隔離開始(タイトル)', '生理(指示)'],
    deptLinks: ['摂食療法(実施)'], transferLinks: [], nursingLinks: [],
    stoolDetail: '—', laxative: 'なし', bath: '入浴', sign: '鈴木',
  },
  {
    date: '2026/5/14', weekday: '木', admitDay: 29, isToday: false, room: 'E102号室',
    orderKinds: ['注', '検', '処'], labLinks: ['院内血液', '外(CRC)血液', '院内血液'],
    meal: { morning: '通常指示', lunch: '欠食', dinner: '通常指示' },
    height: 167.8, weightBmi: '57(20.2)', stool: 1, urine: '1300',
    intake: { morning: '2', lunch: '0', dinner: '5' },
    sleep: '良眠',
    med: { morning: '✓(高橋)', lunch: '✓(高橋)', dinner: '✓(高橋)', night: '—' },
    karteLinks: ['精神療法(xx開始)', '生理(指示)'],
    deptLinks: ['摂食療法(実施)'], transferLinks: [], nursingLinks: ['看護記録(熱発)'],
    stoolDetail: '2', laxative: '緩下剤', bath: '入浴', sign: '高橋',
  },
  {
    date: '2026/5/15', weekday: '金', admitDay: 30, isToday: false, room: 'E102号室',
    orderKinds: ['薬', '注', '検', '処'], labLinks: [],
    meal: { morning: '通常指示', lunch: '通常指示', dinner: '通常指示' },
    height: 167.8, weightBmi: '55.8(19.8)', stool: 2, urine: '950',
    intake: { morning: '5', lunch: '5', dinner: '10' },
    sleep: '普通',
    med: { morning: '✓(山本)', lunch: '—', dinner: '✓(山本)', night: '✓(山本)' },
    karteLinks: ['隔離開始(タイトル)', '精神療法(xx開始)', '生理(指示)'],
    deptLinks: [], transferLinks: [], nursingLinks: [],
    stoolDetail: '4', laxative: 'なし', bath: 'シャワー浴', sign: '山本',
  },
  {
    date: '2026/5/16', weekday: '土', admitDay: 31, isToday: false, room: 'E102号室',
    orderKinds: ['薬', '注', '検', '処', '画', '心', 'E'], labLinks: ['院内血液'],
    meal: { morning: '外出・外泊', lunch: '通常指示', dinner: '欠食' },
    height: 167.8, weightBmi: '57(20.2)', stool: 1, urine: '1250',
    intake: { morning: '2', lunch: '8', dinner: '0' },
    sleep: '浅眠',
    med: { morning: '✓(佐々木)', lunch: '✓(佐々木)', dinner: '—', night: '✓(佐々木)' },
    karteLinks: [],
    deptLinks: ['摂食療法(実施)'], transferLinks: [], nursingLinks: ['看護記録(熱発)'],
    stoolDetail: '2', laxative: '坐薬', bath: '清拭', sign: '佐々木',
  },
  {
    date: '2026/5/17', weekday: '日', admitDay: 32, isToday: false, room: 'E102号室',
    orderKinds: ['薬', '画'], labLinks: ['外(CRC)血液'],
    meal: { morning: '通常指示', lunch: '通常指示', dinner: '外出・外泊' },
    height: 167.8, weightBmi: '55.8(19.8)', stool: 0, urine: '1000',
    intake: { morning: '5', lunch: '0', dinner: '2' },
    sleep: '良眠',
    med: { morning: '✓(中田)', lunch: '—', dinner: '✓(中田)', night: '✓(中田)' },
    karteLinks: ['隔離開始(タイトル)', '精神療法(xx開始)'],
    deptLinks: ['摂食療法(実施)'], transferLinks: [], nursingLinks: [],
    stoolDetail: '—', laxative: 'なし', bath: '入浴', sign: '中田',
  },
  {
    date: '2026/5/18', weekday: '月', admitDay: 33, isToday: false, room: 'E102号室',
    orderKinds: ['注', '画'], labLinks: ['院内血液', '外(CRC)血液'],
    meal: { morning: '通常指示', lunch: '通常指示', dinner: '臨時変更' },
    height: 167.8, weightBmi: '57(20.2)', stool: 2, urine: '1180',
    intake: { morning: '2', lunch: '5', dinner: '8' },
    sleep: '普通',
    med: { morning: '✓(鈴木)', lunch: '✓(鈴木)', dinner: '✓(鈴木)', night: '—' },
    karteLinks: ['精神療法(xx開始)', '生理(指示)'],
    deptLinks: ['摂食療法(実施)'], transferLinks: [], nursingLinks: ['看護記録(熱発)'],
    stoolDetail: '4', laxative: 'なし', bath: 'シャワー浴', sign: '鈴木',
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
    stoolDetail: '—', laxative: 'なし', bath: '—', sign: '高橋',
  },
];

// ブリストルスケール: 番号 → 性状名（便(性状)セルの表示用）
const BRISTOL_LABEL: Record<string, string> = {
  '1': 'コロコロ便', '2': '硬い便', '3': 'やや硬い便', '4': '普通便',
  '5': 'やや軟便', '6': '泥状便', '7': '水様便',
};
const formatStool = (v: string): string => (BRISTOL_LABEL[v] ? `${v} ${BRISTOL_LABEL[v]}` : v);

// 入力ダイアログの選択肢
const STOOL_COUNT_OPTIONS = [0, 1, 2, 3, 4];
const BRISTOL_OPTIONS = ['1', '2', '3', '4', '5', '6', '7'];
const LAXATIVE_OPTIONS = ['なし', '緩下剤', '坐薬', '浣腸'];
const BATH_OPTIONS = ['入浴', 'シャワー浴', '清拭', '—'];

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

// ===== 隔離拘束サブタブ（24 時間観察グリッド）=====
// 0〜23 時の行
const HOURS = Array.from({ length: 24 }, (_, i) => i);
// 勤務帯フィルタ（PM 確定: 日勤 9〜16時 / 夜勤 17〜翌8時）
const DAY_SHIFT_HOURS = [9, 10, 11, 12, 13, 14, 15, 16];
const NIGHT_SHIFT_HOURS = [17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8];
// 観察行の固定高さ（px）。セル高さを固定することで、複数記録の色セグメントを
// flex で均等分割できる（百分率高さの解決ブレを避ける）。
const OBS_ROW_HEIGHT = 32;

// 診察記録の絞込設定ダイアログのチェック項目（参考システムの絞込設定に準拠）
const EXAM_FILTER_OPTIONS = [
  '隔離中診察', '拘束中診察', '隔離開始', '隔離解除',
  '拘束開始', '拘束解除', '隔離継続', '隔離変更',
  '拘束継続', '拘束変更',
];

// 表示用日付（"2026/5/13"）→ ISO（"2026-05-13"）。観察記録・指示の照合に使う
function toIso(display: string): string {
  const [y, m, d] = display.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// 以下 2 つは RestraintObservationMatrix.tsx:31-46 と同等の純関数（結合回避のためローカル複製）
function getSubtype(o: IsolationOrder): IsolationSubtype {
  return o.subtype ?? (o.type === '隔離' ? '隔離' : '拘束');
}
function isActiveAt(o: IsolationOrder, dateStr: string, hour: number): boolean {
  const target = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00`).getTime();
  const start = new Date(o.startDatetime.replace(' ', 'T')).getTime();
  if (target < start) return false;
  if (o.endDatetime) {
    const end = new Date(o.endDatetime.replace(' ', 'T')).getTime();
    if (target > end) return false;
  }
  return true;
}

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

const FlowsheetView: React.FC<Props> = ({ patientId }) => {
  // 表示データを state 化（日列クリックで当日分を編集できるようにする）
  const [rows, setRows] = useState<DailyRow[]>(DAILY);
  const [editDay, setEditDay] = useState<number | null>(null);
  const [draft, setDraft] = useState<DailyRow | null>(null);

  // ----- サブタブ（フローシート / 隔離拘束）-----
  // 外出・外泊行から下を切り替える。デフォルト flowsheet で既存挙動を維持。
  const [subTab, setSubTab] = useState<'flowsheet' | 'isolation'>('flowsheet');

  // ----- 勤務帯フィルタ（24時間 / 日勤 / 夜勤）-----
  const [shift, setShift] = useState<'24h' | 'day' | 'night'>('24h');
  const visibleHours = shift === 'day' ? DAY_SHIFT_HOURS : shift === 'night' ? NIGHT_SHIFT_HOURS : HOURS;

  // ----- 隔離拘束 観察グリッド用データ（read-only 流用）-----
  const dynamicOrders = useAppStore((s) => s.dynamicIsolationOrders);
  const dynamicObservations = useAppStore((s) => s.dynamicObservationRecords);
  const patient = useMemo(() => PATIENTS.find((p) => p.id === patientId), [patientId]);
  // 7 日列の ISO 日付（共通ヘッダの日付列と一致）
  const dayIso = useMemo(() => DAILY.map((d) => toIso(d.date)), []);
  // 患者の指示集合（マスタ + dynamic、同 id は dynamic 優先）
  const orders = useMemo<IsolationOrder[]>(() => {
    if (!patientId) return [];
    const merged = new Map<string, IsolationOrder>();
    [...ISOLATION_ORDERS, ...dynamicOrders].forEach((o) => {
      if (o.patientId === patientId) merged.set(o.id, o);
    });
    return Array.from(merged.values());
  }, [patientId, dynamicOrders]);
  const observations = useMemo(
    () => dynamicObservations.filter((r) => r.patientId === patientId),
    [dynamicObservations, patientId],
  );
  // 観察記録ダイアログ
  const [obsDialog, setObsDialog] = useState<{
    date: string; hour: number; subtype: IsolationSubtype | 'その他'; isolationOrderId?: string;
  } | null>(null);

  // 診療録作成ダイアログ（[未診察] セルから起動・カルテと同一の NewRecordDialog を再利用）
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const [examOpen, setExamOpen] = useState(false);
  const openExam = () => setExamOpen(true);
  const closeExam = () => setExamOpen(false);

  // 診察記録の絞込設定ダイアログ（[絞込設定] から起動）。初期は全てチェック
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterChecks, setFilterChecks] = useState<Record<string, boolean>>(
    () => Object.fromEntries(EXAM_FILTER_OPTIONS.map((o) => [o, true])),
  );
  const setAllFilters = (v: boolean) =>
    setFilterChecks(Object.fromEntries(EXAM_FILTER_OPTIONS.map((o) => [o, v])));

  // 観察セル描画（縦=時刻 / 横=日）。どのセルもクリックで観察記録ダイアログを開く。
  // active な隔離/拘束指示があれば subtype をそれに合わせ、無ければ「その他」で起票する。
  const renderObsCell = (iso: string, hour: number) => {
    const activeOrders = patient ? orders.filter((o) => isActiveAt(o, iso, hour)) : [];
    // 拘束優先（spec us-13 AC-8）→ 隔離 → 無ければ「その他」
    const restraint = activeOrders.find((o) => getSubtype(o) === '拘束' || getSubtype(o) === '隔離拘束');
    const isolation = activeOrders.find((o) => getSubtype(o) === '隔離');
    const primary = restraint ?? isolation;
    const subtype: IsolationSubtype | 'その他' = primary ? getSubtype(primary) : 'その他';
    // その時間帯の観察記録（複数回数分）を時刻順に並べ、各記録を色セグメントで表示。
    // 後勝ちで 1 色に潰さず、それぞれの色を横並びで表示する（文字は出さない）。
    const recs = observations
      .filter((r) => r.date === iso && r.time.startsWith(`${String(hour).padStart(2, '0')}:`))
      .slice()
      .sort((a, b) => a.time.localeCompare(b.time));
    // 背景: 指示下→未記入色 / 指示なし→白
    const baseBg = primary ? '#f8fafc' : '#fff';
    return (
      <Box
        aria-label={`観察 ${iso} ${String(hour).padStart(2, '0')}:00`}
        onClick={() => setObsDialog({ date: iso, hour, subtype, isolationOrderId: primary?.id })}
        sx={{
          // セル高さを固定（行も OBS_ROW_HEIGHT 固定）。これで複数記録の
          // 色セグメントを flex で均等分割できる（百分率高さのブレを回避）。
          width: '100%', height: OBS_ROW_HEIGHT, cursor: 'pointer',
          bgcolor: baseBg,
          // 縦の区切り線のみセルに付与（横線はテーブル本来の行ボーダーに任せ、
          // 二重線で太く見えるのを防ぐ）
          borderRight: '1px solid #cbd5e1',
          // 複数記録は上下に積み、各セグメントを均等高さで分割
          display: 'flex', flexDirection: 'column',
          '&:hover': { boxShadow: 'inset 0 0 0 2px #2563eb' },
        }}
      >
        {recs.map((r, idx) => {
          const conf = MASTER_OBSERVATION_STATES.find((s) => s.state === r.state);
          return (
            <Box
              key={idx}
              data-testid="obs-segment"
              title={`${r.time} ${r.state}`}
              sx={{
                // flex-grow:1 / flex-basis:0 で均等分割。minHeight:0 で確実に縮む
                flexGrow: 1, flexBasis: 0, minHeight: 0,
                bgcolor: conf?.bgColor ?? baseBg,
              }}
            />
          );
        })}
      </Box>
    );
  };

  const openEdit = (i: number) => {
    setEditDay(i);
    // ネストした参照ごとコピー（保存まで元データを汚さない）
    setDraft({ ...rows[i], meal: { ...rows[i].meal }, intake: { ...rows[i].intake }, med: { ...rows[i].med } });
  };
  const closeEdit = () => { setEditDay(null); setDraft(null); };
  const saveEdit = () => {
    if (editDay === null || !draft) return;
    setRows((rs) => rs.map((r, i) => (i === editDay ? draft : r)));
    closeEdit();
  };
  const patchDraft = (patch: Partial<DailyRow>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const patchIntake = (k: 'morning' | 'lunch' | 'dinner', v: string) =>
    setDraft((d) => (d ? { ...d, intake: { ...d.intake, [k]: v } } : d));

  // ----- 看護記録 新規登録（フッター「看護記録」ボタンと同一の NursingRecordDialog を流用）-----
  const [nrOpen, setNrOpen] = useState(false);
  const [nrDate, setNrDate] = useState<string | undefined>(undefined);
  const openNursing = (i: number) => {
    // 行の日付（YYYY/M/D）を ISO（YYYY-MM-DD）へ変換してダイアログの記載日初期値に渡す。
    const parts = rows[i]?.date.split('/');
    setNrDate(parts && parts.length === 3
      ? `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
      : undefined);
    setNrOpen(true);
  };

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
              {rows.map((d, i) => (
                <TableCell
                  key={i}
                  title="クリックで当日の項目を入力"
                  onClick={() => openEdit(i)}
                  sx={{ ...todayHeaderCellSx(d.isToday), cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
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
              {rows.map((d, i) => (
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
                sx={{ ...stickyLabelCell, borderBottom: '2px solid #1e3a5f' }}
                style={{ position: 'sticky', top: HEADER_ROW_TOP.row3, left: 0, zIndex: 100, boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}
              />
              <TableCell
                sx={{ ...stickySubCell, borderBottom: '2px solid #1e3a5f' }}
                style={{ position: 'sticky', top: HEADER_ROW_TOP.row3, left: LABEL_COL_WIDTH, zIndex: 100, boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}
              />
              {rows.map((d, i) => (
                <TableCell
                  key={i}
                  sx={{ ...dayCellSx(d.isToday), py: 0.3, bgcolor: d.isToday ? '#fff8e1' : '#fff', borderBottom: '2px solid #1e3a5f' }}
                  style={{ position: 'sticky', top: HEADER_ROW_TOP.row3, zIndex: 100, boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}
                >
                  <Stack direction="row" spacing={0.3} justifyContent="center">
                    <Button
                      size="small" variant="outlined"
                      onClick={() => openNursing(i)}
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
                      onClick={() => openEdit(i)}
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
              {rows.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.room}</TableCell>
              ))}
            </TableRow>
            <RestraintRow label="隔離" bar={RESTRAINTS.isolation} />
            <RestraintRow label="拘束" bar={RESTRAINTS.restraint} />
            <RestraintRow label="行動制限(その他)" bar={RESTRAINTS.behavior} />
            <RestraintRow label="外出・外泊" bar={RESTRAINTS.outing} />

            {/* サブタブ: ここから下を「フローシート / 隔離拘束」で切替（design-rules §2.3）。
                横スクロールしても見えるよう左寄せ＋左 sticky で固定。 */}
            <TableRow>
              <TableCell
                colSpan={9}
                sx={{ p: 0, borderBottom: '2px solid #1e3a5f', bgcolor: '#f1f5f9' }}
              >
                <Box
                  sx={{
                    position: 'sticky', left: 0,
                    display: 'inline-flex', alignItems: 'center', pl: 1,
                  }}
                >
                  <Tabs
                    value={subTab}
                    onChange={(_, v: 'flowsheet' | 'isolation') => setSubTab(v)}
                    sx={{ minHeight: 34 }}
                  >
                    <Tab label="フローシート" value="flowsheet" sx={{ minHeight: 34, py: 0, fontSize: '0.75rem' }} />
                    <Tab label="隔離拘束" value="isolation" sx={{ minHeight: 34, py: 0, fontSize: '0.75rem' }} />
                  </Tabs>
                </Box>
              </TableCell>
            </TableRow>

            {/* ===== 隔離拘束サブタブ: 診察記録 + 24 時間観察グリッド ===== */}
            {subTab === 'isolation' && (
              <>
                {/* 診察記録 行。[未診察] クリックで診察録作成、[絞込設定] で絞込設定ダイアログ */}
                <TableRow>
                  <TableCell sx={{ ...stickyLabelCell, whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                    診察記録{' '}
                    <Box
                      component="span"
                      role="button"
                      aria-label="絞込設定"
                      onClick={() => setFilterOpen(true)}
                      sx={{ color: '#1e40af', cursor: 'pointer', whiteSpace: 'nowrap', '&:hover': { textDecoration: 'underline' } }}
                    >
                      [絞込設定]
                    </Box>
                  </TableCell>
                  <TableCell sx={stickySubCell} />
                  {rows.map((d, i) => (
                    <TableCell key={i} sx={{ ...dayCellSx(d.isToday), p: 0 }}>
                      <Box
                        aria-label={`診療録作成 ${dayIso[i]}`}
                        onClick={openExam}
                        sx={{
                          color: '#dc2626', fontWeight: 600, cursor: 'pointer', py: 0.5,
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        [未診察]
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
                {/* 観察記録ヘッダ + 勤務帯フィルタ（24時間 / 日勤 / 夜勤） */}
                <TableRow>
                  <TableCell colSpan={9} sx={{ ...sectionHeaderCellSx, py: 0.3 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#1e3a5f' }}>
                        隔離拘束 観察記録
                      </Typography>
                      <Box sx={{ flex: 1 }} />
                      <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={shift}
                        onChange={(_, v: '24h' | 'day' | 'night' | null) => { if (v) setShift(v); }}
                        sx={{ bgcolor: '#fff', '& .MuiToggleButton-root': { py: 0, px: 1, fontSize: '0.7rem', lineHeight: 1.6 } }}
                      >
                        <ToggleButton value="24h">24時間</ToggleButton>
                        <ToggleButton value="day">日勤</ToggleButton>
                        <ToggleButton value="night">夜勤</ToggleButton>
                      </ToggleButtonGroup>
                    </Stack>
                  </TableCell>
                </TableRow>
                {/* 凡例（色 + 状態テキストで色覚配慮・design-rules §13.5）。
                    どのセルもクリックで観察記録ダイアログを開ける。 */}
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 0.5, px: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center" useFlexGap>
                      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                        セルクリックで観察記録を入力
                      </Typography>
                      {MASTER_OBSERVATION_STATES.map((s) => (
                        <Stack key={s.state} direction="row" spacing={0.4} alignItems="center">
                          <Box sx={{ width: 12, height: 12, bgcolor: s.bgColor, border: '1px solid #cbd5e1' }} />
                          <Typography sx={{ fontSize: '0.65rem', color: s.color }}>{s.state}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </TableCell>
                </TableRow>
                {/* 勤務帯に応じた時間行 × 7 日 */}
                {visibleHours.map((h) => (
                  <TableRow key={`obs-${h}`}>
                    {/* 行高を固定（セグメント均等分割のため）。横線の色は縦線（#cbd5e1）と揃える */}
                    <TableCell sx={{ ...stickyLabelCell, height: OBS_ROW_HEIGHT, py: 0, borderBottom: '1px solid #cbd5e1' }}>{h}時</TableCell>
                    <TableCell sx={{ ...stickySubCell, height: OBS_ROW_HEIGHT, py: 0, borderBottom: '1px solid #cbd5e1' }} />
                    {rows.map((d, i) => (
                      <TableCell
                        key={i}
                        sx={{
                          p: 0, height: OBS_ROW_HEIGHT, minWidth: DAY_COL_WIDTH, width: DAY_COL_WIDTH,
                          borderBottom: '1px solid #cbd5e1',
                          bgcolor: d.isToday ? '#fff8e1' : undefined,
                        }}
                      >
                        {renderObsCell(dayIso[i], h)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            )}

            {/* ===== フローシートサブタブ: 既存セクション ===== */}
            {subTab === 'flowsheet' && (
            <>
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
              {rows.map((d, i) => (
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
              {rows.map((d, i) => (
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
              {rows.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.height}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={stickyLabelCell}>体重(BMI)</TableCell>
              <TableCell sx={stickySubCell} />
              {rows.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.weightBmi}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={stickyLabelCell}>便(回数)</TableCell>
              <TableCell sx={stickySubCell} />
              {rows.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.stool}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              {/* 便の性状はブリストルスケールの番号(1〜7)で記入 */}
              <TableCell sx={stickyLabelCell}>便(性状)</TableCell>
              <TableCell sx={stickySubCell} />
              {rows.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>{formatStool(d.stoolDetail)}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={stickyLabelCell}>下剤</TableCell>
              <TableCell sx={stickySubCell} />
              {rows.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.laxative}</TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={stickyLabelCell}>尿量</TableCell>
              <TableCell sx={stickySubCell} />
              {rows.map((d, i) => (
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
                  {rows.map((d, i) => (
                    <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.intake[k]}</TableCell>
                  ))}
                </TableRow>
              );
            })}
            {/* 睡眠行は一旦非表示（PM指示） */}
            {/* 服薬 朝/昼/夕/寝 */}
            {(['morning', 'lunch', 'dinner', 'night'] as const).map((k, idx) => {
              const sub = k === 'morning' ? '朝' : k === 'lunch' ? '昼' : k === 'dinner' ? '夕' : '寝';
              return (
                <TableRow key={`med-${k}`}>
                  {idx === 0 && (
                    <TableCell rowSpan={4} sx={{ ...stickyLabelCell, verticalAlign: 'top' }}>服薬</TableCell>
                  )}
                  <TableCell sx={stickySubCell}>{sub}</TableCell>
                  {rows.map((d, i) => (
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
              {rows.map((d, i) => (
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
              {rows.map((d, i) => (
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
              {rows.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>
                  {d.transferLinks.length === 0 ? '—' : d.transferLinks.join(', ')}
                </TableCell>
              ))}
            </TableRow>
            {/* 看護記録 */}
            <TableRow>
              <TableCell sx={stickyLabelCell}>看護記録</TableCell>
              <TableCell sx={stickySubCell} />
              {rows.map((d, i) => (
                <TableCell key={i} sx={{ ...dayCellSx(d.isToday), verticalAlign: 'top' }}>
                  <Stack spacing={0.3} alignItems="center">
                    {d.nursingLinks.map((l, idx) => (
                      <MuiLink key={idx} underline="always" sx={{ fontSize: '0.7rem', color: '#1e40af', cursor: 'pointer' }}>
                        {l}
                      </MuiLink>
                    ))}
                    <Button
                      size="small" variant="outlined"
                      onClick={() => openNursing(i)}
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
            {/* 便(性状) はバイタル群（便の回数の直下）へ移動済み */}
            <TableRow>
              <TableCell sx={stickyLabelCell}>入浴</TableCell>
              <TableCell sx={stickySubCell} />
              {rows.map((d, i) => (
                <TableCell key={i} sx={dayCellSx(d.isToday)}>{d.bath}</TableCell>
              ))}
            </TableRow>

            {/* ===== サイン ===== */}
            <TableRow>
              <TableCell sx={{ ...stickyLabelCell, bgcolor: '#e3edf7', color: '#1e3a5f', fontWeight: 700 }}>
                サイン
              </TableCell>
              <TableCell sx={{ ...stickySubCell, bgcolor: '#e3edf7' }} />
              {rows.map((d, i) => (
                <TableCell key={i} sx={{ ...dayCellSx(d.isToday), bgcolor: '#e3edf7', color: '#1e3a5f', fontWeight: 700 }}>
                  {d.sign}
                </TableCell>
              ))}
            </TableRow>
            </>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 当日入力ダイアログ（日列クリック / バイタルボタンで起動） */}
      <Dialog open={editDay !== null} onClose={closeEdit} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          {draft ? `${draft.date}（${draft.weekday}）の入力` : '入力'}
        </DialogTitle>
        {draft && (
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <TextField
                size="small" label="体重(BMI)" value={draft.weightBmi}
                onChange={(e) => patchDraft({ weightBmi: e.target.value })}
              />
              <TextField
                select size="small" label="便（回数）" value={String(draft.stool)}
                onChange={(e) => patchDraft({ stool: Number(e.target.value) })}
              >
                {STOOL_COUNT_OPTIONS.map((n) => (
                  <MenuItem key={n} value={String(n)}>{n}</MenuItem>
                ))}
              </TextField>
              <TextField
                select size="small" label="便（性状・ブリストル）" value={draft.stoolDetail}
                onChange={(e) => patchDraft({ stoolDetail: e.target.value })}
              >
                <MenuItem value="—">—（記載なし）</MenuItem>
                {BRISTOL_OPTIONS.map((v) => (
                  <MenuItem key={v} value={v}>{formatStool(v)}</MenuItem>
                ))}
              </TextField>
              <TextField
                select size="small" label="下剤" value={draft.laxative}
                onChange={(e) => patchDraft({ laxative: e.target.value })}
              >
                {LAXATIVE_OPTIONS.map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </TextField>
              <TextField
                size="small" label="尿量（mL）" value={draft.urine}
                onChange={(e) => patchDraft({ urine: e.target.value })}
                placeholder="例: 1200 / —"
              />
              <Box>
                <Typography variant="caption" color="text.secondary">食事（摂取量）</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  {(['morning', 'lunch', 'dinner'] as const).map((k) => (
                    <TextField
                      key={k} size="small"
                      label={k === 'morning' ? '朝' : k === 'lunch' ? '昼' : '夕'}
                      value={draft.intake[k]}
                      onChange={(e) => patchIntake(k, e.target.value)}
                      sx={{ width: 72 }}
                    />
                  ))}
                </Stack>
              </Box>
              <TextField
                select size="small" label="入浴" value={draft.bath}
                onChange={(e) => patchDraft({ bath: e.target.value })}
              >
                {BATH_OPTIONS.map((v) => (
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={closeEdit}>キャンセル</Button>
          <Button variant="contained" onClick={saveEdit}>保存</Button>
        </DialogActions>
      </Dialog>

      {/* 看護記録 新規登録（看護記録ボタン / 新規作成ボタンで起動）。
          フッターの「看護記録」と同一の NursingRecordDialog を流用する。 */}
      <NursingRecordDialog
        open={nrOpen}
        patientId={patientId ?? ''}
        defaultDate={nrDate}
        initialMode="new"
        onClose={() => setNrOpen(false)}
      />

      {/* 隔離拘束 観察記録ダイアログ（セルクリックで起動・既存 ep-07 ダイアログを流用） */}
      {obsDialog && patient && (
        <ObservationRecordDialog
          open
          onClose={() => setObsDialog(null)}
          patient={{ id: patient.id, name: patient.name, age: patient.age, wardId: patient.wardId }}
          date={obsDialog.date}
          hour={obsDialog.hour}
          subtype={obsDialog.subtype}
          isolationOrderId={obsDialog.isolationOrderId}
          defaultFrequency={2}
          showIntervalToggle
          replaceExistingForHour
        />
      )}

      {/* 診療録作成ダイアログ（[未診察] セルから起動・カルテ画面と同一の NewRecordDialog を再利用） */}
      <NewRecordDialog
        open={examOpen}
        mode="inpatient"
        patientId={patientId}
        onClose={closeExam}
        onSaved={(m) => showSnackbar(m, 'success')}
      />

      {/* 絞込設定ダイアログ（診察記録 [絞込設定] から起動） */}
      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>絞込設定</DialogTitle>
        <DialogContent dividers>
          <Stack direction="row" spacing={2}>
            {/* 左: 操作（全てチェック / クリア） */}
            <Stack spacing={0.5} sx={{ flexShrink: 0, pt: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>絞込設定</Typography>
              <Button size="small" variant="text" onClick={() => setAllFilters(true)} sx={{ justifyContent: 'flex-start', minWidth: 0, whiteSpace: 'nowrap' }}>
                [全てチェック]
              </Button>
              <Button size="small" variant="text" onClick={() => setAllFilters(false)} sx={{ justifyContent: 'flex-start', minWidth: 0, whiteSpace: 'nowrap' }}>
                [クリア]
              </Button>
            </Stack>
            {/* 右: チェック項目（4 列） */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', columnGap: 1, rowGap: 0 }}>
              {EXAM_FILTER_OPTIONS.map((o) => (
                <FormControlLabel
                  key={o}
                  control={
                    <Checkbox
                      size="small"
                      checked={filterChecks[o] ?? false}
                      onChange={(e) => setFilterChecks((prev) => ({ ...prev, [o]: e.target.checked }))}
                    />
                  }
                  label={<Typography sx={{ fontSize: '0.8rem' }}>{o}</Typography>}
                />
              ))}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilterOpen(false)}>閉じる</Button>
          <Button variant="contained" onClick={() => setFilterOpen(false)}>設定</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FlowsheetView;
