import React, { useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, Stack, Link as MuiLink, Tabs, Tab, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Checkbox, FormControlLabel,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import IconButton from '@mui/material/IconButton';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { IsolationOrder, IsolationSubtype, OrderType, Order } from '../../types';
import { PATIENTS, ISOLATION_ORDERS, MASTER_OBSERVATION_STATES, ORDERS } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import ObservationRecordDialog from '../isolation/ObservationRecordDialog';
import { isFutureSlot, useNowTick, OBSERVATION_FUTURE_BLOCK_LABEL } from '../isolation/observationFutureBlock';
import { NewRecordDialog } from '../karte/MedicalRecordTab';
import NursingRecordDialog from '../../features/flowsheet/components/NursingRecordDialog';
import { PATTERN_OPTIONS, FLOWSHEET_PATTERNS, patternItems, careItemLabel } from './patternMaster';
import RecordSummaryStrip from './RecordSummaryStrip';

interface Props {
  patientId?: string;
}

// 7日分の固定モック(2026-05-13〜2026-05-19、当日=5/19)
type OrderKind = '薬' | '注' | '検' | '処' | '画' | '心' | 'E';

// オーダ入力（オーダ送信画面）の OrderType → 予定オーダ欄の種名1文字（参考システムマニュアル 02 看護支援 第1章第2部）。
// 薬=処方・入院定時、注=注射、検=検査、処=処置、画=画像、心=心理検査、E=ECT。
// リハビリ／IF／文字（テキスト）は予定オーダ欄の種名表に無いため対象外（表示しない）。
const ORDER_KIND_OF: Partial<Record<OrderType, OrderKind>> = {
  処方: '薬', 入院定時: '薬',
  注射: '注', 検査: '検', 画像: '画', 心理検査: '心', ECT: 'E',
};

// OrderType の表示ラベル（内部値「文字」は「テキスト」表示）。
const orderTypeLabel = (t: OrderType): string => (t === '文字' ? 'テキスト' : t);

// 実施者（ログイン看護師・モック固定）。
const LOGIN_NURSE = '看護 花子';
// 指示受け候補（モック）。先頭は未選択（[未]）。
const ACK_NURSES = ['看護 花子', '看護 太郎', '主任 山田', '看護 佐藤'];

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

// ===== 日付送り（ページめくり）用ユーティリティ =====
// 7 日列は「基準日（右端）から遡る 7 日」で組み立てる。モックデータ（DAILY）は
// 元の日付（2026/5/13〜19）に紐付けたまま扱い、範囲外の日は空列で表示する。
const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

/** ISO（"2026-05-13"）→ 表示用（"2026/5/13"） */
function fromIso(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${y}/${Number(m)}/${Number(d)}`;
}
/** ISO 日付を days 日ずらす */
function shiftIso(iso: string, days: number): string {
  const dt = new Date(`${iso}T00:00:00`);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}
/** ISO 日付の曜日ラベル */
function weekdayOf(iso: string): string {
  return WEEKDAY_LABELS[new Date(`${iso}T00:00:00`).getDay()];
}
/** 2 つの ISO 日付の差（日数。b - a） */
function diffDays(a: string, b: string): number {
  const ms = new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime();
  return Math.round(ms / 86400000);
}
/** 実際の当日（ISO） */
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** モックデータの日付（ISO・昇順）と、その右端＝初期表示の基準日 */
const ANCHOR_ISO: string[] = DAILY.map((d) => toIso(d.date));
const ANCHOR_END_ISO = ANCHOR_ISO[ANCHOR_ISO.length - 1];
const ANCHOR_END_ADMIT_DAY = DAILY[DAILY.length - 1].admitDay;
const DAILY_BY_ISO = new Map<string, DailyRow>(DAILY.map((d) => [toIso(d.date), d]));

/** モックデータを持たない日の空列テンプレート */
const EMPTY_DAY: Omit<DailyRow, 'date' | 'weekday' | 'admitDay' | 'isToday'> = {
  room: 'E102号室',
  orderKinds: [], labLinks: [],
  meal: { morning: '通常指示', lunch: '通常指示', dinner: '通常指示' },
  height: 167.8, weightBmi: '—', stool: 0, urine: '—',
  intake: { morning: '—', lunch: '—', dinner: '—' },
  sleep: '—',
  med: { morning: '—', lunch: '—', dinner: '—', night: '—' },
  karteLinks: [], deptLinks: [], transferLinks: [], nursingLinks: [],
  stoolDetail: '—', laxative: '—', bath: '—', sign: '—',
};

/** 指定 ISO 日付の 1 列分を組み立てる（モックデータがあれば流用、無ければ空列） */
function buildDay(iso: string): DailyRow {
  const base = DAILY_BY_ISO.get(iso);
  return {
    ...(base ?? EMPTY_DAY),
    date: fromIso(iso),
    weekday: weekdayOf(iso),
    // 在院日数は基準日（モック右端 = 34 日目）からの相対で算出
    admitDay: Math.max(1, ANCHOR_END_ADMIT_DAY + diffDays(ANCHOR_END_ISO, iso)),
    // 実際の当日に加え、モックが「当日」と定義している日（2026/5/19）も当日扱いで色付けする
    isToday: iso === todayIso() || (base?.isToday ?? false),
  };
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

// チャート用データ(7日分)。モックデータを持つ日のみ値を入れ、それ以外は null（線を引かない）
function buildChartData(dayIso: string[]) {
  // モック値:画像のグラフ形状にざっくり合わせる
  const tempPattern = [36.4, 37.2, 36.8, 37.4, 36.5, 37.2, 36.6];
  const bpHighPattern = [115, 122, 128, 135, 110, 118, 125];
  const bpLowPattern = [70, 75, 78, 82, 68, 72, 76];
  const pulsePattern = [88, 102, 80, 95, 70, 105, 82];
  const spo2Pattern = [98, 97, 98, 97, 98, 98, 97];
  const respPattern = [16, 18, 17, 19, 16, 18, 17];
  return dayIso.map((iso) => {
    const i = ANCHOR_ISO.indexOf(iso);
    const at = (arr: number[]) => (i < 0 ? null : arr[i]);
    return {
      date: fromIso(iso).slice(5),
      体温: at(tempPattern),
      'BP(上)': at(bpHighPattern),
      'BP(下)': at(bpLowPattern),
      脈拍: at(pulsePattern),
      SpO2: at(spo2Pattern),
      呼吸: at(respPattern),
    };
  });
}

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

// 行動制限・隔離・外出など、特定の日付範囲だけセルに色帯+ラベルを置く。
// バーの範囲はモックデータの日付（ANCHOR_ISO）に固定し、日付送りしても同じ日に留まる。
function RestraintRow({ label, bar, rows, dayIso }: {
  label: string; bar: RestraintBar; rows: DailyRow[]; dayIso: string[];
}) {
  const fromIsoDate = ANCHOR_ISO[bar.from];
  const toIsoDate = ANCHOR_ISO[bar.to];
  return (
    <TableRow>
      <TableCell sx={stickyLabelCell}>{label}</TableCell>
      <TableCell sx={stickySubCell} />
      {rows.map((d, i) => {
        const iso = dayIso[i];
        const inRange = iso >= fromIsoDate && iso <= toIsoDate;
        const isStart = iso === fromIsoDate;
        const isEnd = iso === toIsoDate;
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

// ----- フローシートパターン変更（最下部の欄 + ダイアログ）-----
// パターン候補・入力項目はマスタ（patternMaster: ケア項目マスタ＋パターンマスタ）で管理する。
// 未適用の患者は「共通項目時間設定」が適用される想定。パターン候補は PATTERN_OPTIONS、
// パターンごとの入力項目は patternItems（いずれも patternMaster から import）で解決する。
// endDate 未設定（''）は「終了日なし＝以降ずっと適用」。終了日以降は入力不可。
interface PatternPeriod { id: string; startDate: string; endDate?: string; pattern: string; }
// iso が適用期間内か（開始日〜終了日、終了日なしは開始日以降すべて）。
const inPeriod = (startDate: string, endDate: string | undefined, iso: string) =>
  iso >= startDate && (!endDate || iso <= endDate);

const FlowsheetView: React.FC<Props> = ({ patientId }) => {
  // ----- 日付送り（ページめくり）-----
  // 右端（基準日）を state で持ち、7 日列は「基準日から遡る 7 日」を都度組み立てる。
  // 初期値はモックデータの右端（2026/5/19）＝従来表示と同じ。
  const [endDate, setEndDate] = useState<string>(ANCHOR_END_ISO);
  // 7 日列の ISO 日付（昇順。共通ヘッダの日付列・観察グリッドの日付列と一致）
  const dayIso = useMemo(
    () => Array.from({ length: 7 }, (_, i) => shiftIso(endDate, i - 6)),
    [endDate],
  );
  const shiftEndDate = (days: number) => setEndDate((prev) => shiftIso(prev, days));

  // 日列クリックで編集した内容は日付キーで保持する（日付送りしても保たれる）
  const [rowEdits, setRowEdits] = useState<Record<string, DailyRow>>({});
  const rows = useMemo<DailyRow[]>(
    () => dayIso.map((iso) => rowEdits[iso] ?? buildDay(iso)),
    [dayIso, rowEdits],
  );
  const chartData = useMemo(() => buildChartData(dayIso), [dayIso]);

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
  // ep-10 予定オーダ連携: オーダ入力（オーダ送信画面）で作成したオーダ（非永続）。seed ORDERS と合成する。
  const orderEntryOrders = useAppStore((s) => s.dynamicOrders);
  const patient = useMemo(() => PATIENTS.find((p) => p.id === patientId), [patientId]);
  // 予定オーダ連携: この患者のオーダ（seed + オーダ入力で作成）を「開始日(ISO) → 種名1文字[]」に集約。
  //   dayIso は上部の日付送り基盤（endDate ベース）を共用する。
  //   フローシート表示範囲内（dayIso）の開始日を持つオーダのみが予定オーダ欄に現れる。
  const orderKindsByIso = useMemo(() => {
    const m = new Map<string, OrderKind[]>();
    if (!patientId) return m;
    for (const o of [...ORDERS, ...orderEntryOrders]) {
      if (o.patientId !== patientId) continue;
      const kind = ORDER_KIND_OF[o.type];
      if (!kind) continue; // 種名表に無い種別（リハビリ/IF/文字）は対象外
      const arr = m.get(o.startDate) ?? [];
      if (!arr.includes(kind)) arr.push(kind);
      m.set(o.startDate, arr);
    }
    return m;
  }, [patientId, orderEntryOrders]);
  // 予定オーダ「一覧」(指示状況) / 「実施確認表」用: この患者のオーダ（seed + オーダ入力）を新しい順に。
  const patientOrders = useMemo(
    () =>
      [...ORDERS, ...orderEntryOrders]
        .filter((o) => o.patientId === patientId)
        .slice()
        .sort((a, b) => (a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0)),
    [patientId, orderEntryOrders],
  );
  // 予定オーダ 指示状況（一覧・参照のみ）／実施確認表（日別）ダイアログの開閉。
  const [orderListOpen, setOrderListOpen] = useState(false);
  const [execDay, setExecDay] = useState<string | null>(null);
  // 実施ダイアログ（実施確認表の未実施オーダをクリックで開く）。対象オーダと実施日時。
  const orderExecutions = useAppStore((s) => s.orderExecutions);
  const executeOrder = useAppStore((s) => s.executeOrder);
  const orderKarteNos = useAppStore((s) => s.orderKarteNos);
  const orderShoken = useAppStore((s) => s.orderShoken);
  const [execTarget, setExecTarget] = useState<Order | null>(null);
  // オーダ実施ダイアログ: 実施チェック（これが ON のときのみ [実施] 可）と、2 つの指示受け。
  const [execChecked, setExecChecked] = useState(false);
  const [ack1, setAck1] = useState<string | null>(null);
  const [ack2, setAck2] = useState<string | null>(null);
  // 実施ダイアログを開く（チェック・指示受けを初期化）。
  const openExec = (o: Order) => { setExecTarget(o); setExecChecked(false); setAck1(null); setAck2(null); };

  // 定期処方実施ダイアログ（オーダ実施ダイアログで入院定時の行をクリックすると開く）。
  const [rxExecOpen, setRxExecOpen] = useState(false);
  const [rxExecutor, setRxExecutor] = useState(LOGIN_NURSE);   // 実施者（ログイン者）
  const [rxAckPerson, setRxAckPerson] = useState('');          // 指示受け者（オーダ実施で決めた人、無ければ空白）
  const [rxDoctorNote, setRxDoctorNote] = useState('');        // 医師より
  const [rxRemark, setRxRemark] = useState('');                // 備考（自由入力）
  const [rxDatetime, setRxDatetime] = useState('');            // 実施日時（現在日時が初期値）
  const [rxSpecialReport, setRxSpecialReport] = useState(false); // 特記報告
  // 現在日時を datetime-local 用文字列（YYYY-MM-DDTHH:mm）で返す。
  const nowLocalStr = (): string => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const openRxExec = () => {
    setRxExecutor(LOGIN_NURSE);
    setRxAckPerson(ack1 ?? ack2 ?? '');
    // 医師より＝オーダ発行時にカルテ記事作成で入力した所見（医師コメント）。
    setRxDoctorNote(execTarget ? (orderShoken[execTarget.id] ?? '') : '');
    setRxRemark('');
    setRxSpecialReport(false);
    setRxDatetime(nowLocalStr());
    setRxExecOpen(true);
  };
  // 入院定時 content を [1][2]… の薬剤明細に分解（末尾の「N日分／継続」は用法として共有）。
  const parseRxItems = (o: Order): { drugs: string[]; usage: string } => {
    const lines = o.content.split('\n').map((s) => s.trim()).filter(Boolean);
    let days = '';
    const drugs: string[] = [];
    lines.forEach((ln) => {
      if (/^(\d+日分|継続)$/.test(ln)) { days = ln; return; }
      drugs.push(ln.replace(/^Rp\d+[　\s]*/, '').replace(/^[　\s]+/, ''));
    });
    const usage = [o.schedule, days].filter(Boolean).join('　');
    return { drugs, usage };
  };

  // オーダが実施済か（seed の status か、実施記録があるか）。
  const isExecuted = (o: Order): boolean => o.status === '実施済' || !!orderExecutions[o.id];

  // 予定オーダの実施回数（1日N回）を用法/内容から推定（既定1）。
  const dosesPerDay = (o: Order): number => {
    const m = `${o.schedule} ${o.content}`.match(/1日(\d+)回/);
    return m ? Number(m[1]) : 1;
  };
  // オーダが対象日(iso)に実施予定か。処方系は開始日〜日数、単発（検査/ECT/IF/文字/日数0）は開始日のみ。
  const RX_TYPES: OrderType[] = ['処方', '注射', '入院定時'];
  const activeOnDay = (o: Order, iso: string): boolean => {
    if (iso < o.startDate) return false;
    const start = new Date(`${o.startDate}T00:00:00`).getTime();
    const cur = new Date(`${iso}T00:00:00`).getTime();
    const offset = Math.round((cur - start) / 86_400_000);
    if (o.days > 0) return offset < o.days;           // 日数指定 = 開始日〜(日数-1)
    return RX_TYPES.includes(o.type) ? true : offset === 0; // 継続処方=窓内すべて／単発=開始日のみ
  };
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
  // 未来日入力不可（ep-07 共通ルール）の判定に使う現在時刻。時刻経過で未来枠が入力可へ変わる
  const nowTick = useNowTick();

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

  // ----- フローシートパターン変更（最下部の欄 → [パターン変更] でダイアログ）-----
  const [patternPeriods, setPatternPeriods] = useState<PatternPeriod[]>([
    { id: 'pp1', startDate: '2026-05-13', pattern: '精神科基本' },
    { id: 'pp2', startDate: '2026-05-16', pattern: '精神科隔離' },
  ]);
  const [patternDialogOpen, setPatternDialogOpen] = useState(false);
  const [pStart, setPStart] = useState('2026-05-19'); // 既定は当日（モック当日=5/19）
  const [pEnd, setPEnd] = useState(''); // 終了日（空＝終了日なし）
  const [pName, setPName] = useState(PATTERN_OPTIONS[0]);
  // [登録]（新規適用）は確認サブダイアログ（AC-1）を挟み、OK で適用＋適用日以降データ削除（AC-3）。
  const [applyConfirm, setApplyConfirm] = useState<{ startDate: string; endDate: string; pattern: string } | null>(null);
  const requestApplyPattern = () => setApplyConfirm({ startDate: pStart, endDate: pEnd, pattern: pName });
  const confirmApplyPattern = () => {
    if (!applyConfirm) return;
    const { startDate, endDate, pattern } = applyConfirm;
    setPatternPeriods((prev) => [...prev, { id: `pp-${Date.now()}-${prev.length}`, startDate, endDate: endDate || undefined, pattern }]);
    // AC-3: 適用日以降のケアメニューデータを削除（不可逆）。
    setPatternCells((prev) => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const [, , iso] = k.split('|');
        if (iso >= startDate) continue;
        next[k] = v;
      }
      return next;
    });
    setApplyConfirm(null);
  };
  // 削除＝適用解除（「パターンなし」状態になる）。
  const removePatternPeriod = (id: string) =>
    setPatternPeriods((prev) => prev.filter((p) => p.id !== id));

  // ----- パターンボックス: 表示モードトグル（全パターン / 適用パターン名）-----
  // 'applied'（既定）= 適用中のパターンのみ表示（＝従来の挙動）。
  // 'all' = マスタの全パターンを表示（未適用は薄グレー・入力不可）。
  const [patternViewMode, setPatternViewMode] = useState<'applied' | 'all'>('applied');
  // 表示するパターングループ（startDate=null は未適用＝全パターン表示時のみ）。
  const patternGroups: { id: string; pattern: string; startDate: string | null; endDate?: string }[] =
    patternViewMode === 'all'
      ? FLOWSHEET_PATTERNS.map((mp) => {
          const applied = patternPeriods.find((p) => p.pattern === mp.name);
          return applied
            ? { id: applied.id, pattern: applied.pattern, startDate: applied.startDate, endDate: applied.endDate }
            : { id: `all-${mp.id}`, pattern: mp.name, startDate: null };
        })
      : patternPeriods.map((p) => ({ id: p.id, pattern: p.pattern, startDate: p.startDate, endDate: p.endDate }));
  // パターン適用行 × 日付セルの登録値（key = `${periodId}|${item}|${iso}`）。
  // セルは読み取り専用。値の登録は見出しの [新規作成] ダイアログ（savePatternEntry）経由のみ。
  const [patternCells, setPatternCells] = useState<Record<string, string>>({});

  // ----- 適用期間テーブルのインライン編集（開始日・パターンの変更）-----
  // 変更は draft（periodEdits）に保持し、[更新] → 確認サブダイアログ → 反映（不可逆挙動）。
  const [periodEdits, setPeriodEdits] = useState<Record<string, { startDate: string; endDate: string; pattern: string }>>({});
  // 一覧は「行クリックで編集モード」（SPEC us-21）。編集中の行 id のみ入力コントロールを表示。
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const editedPeriod = (p: PatternPeriod) => periodEdits[p.id] ?? { startDate: p.startDate, endDate: p.endDate ?? '', pattern: p.pattern };
  const isPeriodDirty = (p: PatternPeriod) => {
    const e = periodEdits[p.id];
    return !!e && (e.startDate !== p.startDate || e.endDate !== (p.endDate ?? '') || e.pattern !== p.pattern);
  };
  const setPeriodEdit = (p: PatternPeriod, patch: Partial<{ startDate: string; endDate: string; pattern: string }>) =>
    setPeriodEdits((prev) => ({ ...prev, [p.id]: { ...editedPeriod(p), ...patch } }));

  // パターン変更の確認サブダイアログ（適用日以降のケアメニューデータ削除を伴う）。
  const [periodConfirm, setPeriodConfirm] = useState<{ id: string; startDate: string; endDate: string; pattern: string } | null>(null);
  // パターン削除（適用解除）の確認サブダイアログ（AC-6）。
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; pattern: string } | null>(null);
  // 当該パターン（期間）に入力済みの値があるか（key = `${periodId}|${label}|${iso}`）。
  const hasPeriodValues = (id: string) =>
    Object.entries(patternCells).some(([k, v]) => k.split('|')[0] === id && v.trim() !== '');
  // 削除要求: 入力済みの値がある場合は削除不可（確認を開かず警告）。
  const requestDeletePeriod = (p: PatternPeriod) => {
    if (hasPeriodValues(p.id)) {
      showSnackbar('入力済みの値があるため削除できません', 'warning');
      return;
    }
    setDeleteConfirm({ id: p.id, pattern: p.pattern });
  };
  const confirmDeletePeriod = () => {
    if (!deleteConfirm) return;
    removePatternPeriod(deleteConfirm.id);
    setEditingPeriodId(null);
    setDeleteConfirm(null);
  };
  const requestPeriodChange = (p: PatternPeriod) => {
    const e = editedPeriod(p);
    setPeriodConfirm({ id: p.id, startDate: e.startDate, endDate: e.endDate, pattern: e.pattern });
  };
  const applyPeriodChange = () => {
    if (!periodConfirm) return;
    const { id, startDate, endDate, pattern } = periodConfirm;
    setPatternPeriods((prev) => prev.map((p) => (p.id === id ? { ...p, startDate, endDate: endDate || undefined, pattern } : p)));
    // 「適用日以降のケアメニューデータは削除」をワイヤーフレームで表現: 当該期間の開始日以降セルをクリア。
    setPatternCells((prev) => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const [pid, , iso] = k.split('|');
        if (pid === id && iso >= startDate) continue;
        next[k] = v;
      }
      return next;
    });
    setPeriodEdits((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setEditingPeriodId(null);
    setPeriodConfirm(null);
    showSnackbar('パターンを変更しました', 'success');
  };

  // パターン見出しの [入力] → そのパターンの入力ダイアログ（日付＋各項目をまとめて入力）。
  // 入力は適用パターン下のみ（パターンなし＝未適用では入力不可）。
  const [entryTarget, setEntryTarget] = useState<PatternPeriod | null>(null);
  const [entryDate, setEntryDate] = useState('');
  const [entryValues, setEntryValues] = useState<Record<string, string>>({});
  // 指定日付の既存入力値を項目ラベル→値のマップとして読み込む（未入力は空文字）。
  const loadEntryValues = (p: PatternPeriod, iso: string): Record<string, string> =>
    Object.fromEntries(patternItems(p.pattern).map((ci) => {
      const label = careItemLabel(ci);
      return [label, patternCells[`${p.id}|${label}|${iso}`] ?? ''];
    }));
  // iso 未指定時は適用開始日（開始日より前は入力不可のため）。
  // 呼び出し側は endDate も含めた PatternPeriod を渡すこと（ダイアログの日付 max 制約に使う）。
  const openPatternEntry = (p: PatternPeriod, iso: string = p.startDate) => {
    setEntryTarget(p);
    setEntryDate(iso);
    setEntryValues(loadEntryValues(p, iso));
  };
  // AC-4: 日付のフローシートアイコン → その日に適用中パターンの [入力]（項目はそのパターンのみ）。
  // 同日複数適用時は開始日が最も新しいものを対象。未適用（パターンなし）は入力導線なし。
  const openFlowsheetEdit = (i: number) => {
    const iso = dayIso[i];
    const applicable = patternPeriods
      .filter((p) => inPeriod(p.startDate, p.endDate, iso))
      .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
    if (!applicable) {
      showSnackbar('適用パターンがありません（パターンなし）', 'info');
      return;
    }
    openPatternEntry(applicable, iso);
  };

  const savePatternEntry = () => {
    if (!entryTarget) return;
    const p = entryTarget;
    setPatternCells((prev) => {
      const next = { ...prev };
      patternItems(p.pattern).forEach((ci) => {
        const label = careItemLabel(ci);
        next[`${p.id}|${label}|${entryDate}`] = entryValues[label] ?? '';
      });
      return next;
    });
    showSnackbar(`${p.pattern} を登録しました`, 'success');
    setEntryTarget(null);
  };

  // 観察セル描画（縦=時刻 / 横=日）。未来枠以外のセルはクリックで観察記録ダイアログを開く。
  // active な隔離/拘束指示があれば subtype をそれに合わせ、無ければ「その他」で起票する。
  const renderObsCell = (iso: string, hour: number) => {
    // 未来日入力不可: 現在日時が当該 1 時間枠の開始時刻に達していなければグレー＋クリック不可
    const isFuture = isFutureSlot(iso, hour, 0, nowTick);
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
    // 背景: 未来枠→グレー / 指示下→未記入色 / 指示なし→白
    const baseBg = isFuture ? '#e2e8f0' : primary ? '#f8fafc' : '#fff';
    return (
      <Box
        aria-label={`観察 ${iso} ${String(hour).padStart(2, '0')}:00`}
        aria-disabled={isFuture || undefined}
        title={isFuture ? OBSERVATION_FUTURE_BLOCK_LABEL : undefined}
        onClick={isFuture ? undefined : () => setObsDialog({ date: iso, hour, subtype, isolationOrderId: primary?.id })}
        sx={{
          // セル高さを固定（行も OBS_ROW_HEIGHT 固定）。これで複数記録の
          // 色セグメントを flex で均等分割できる（百分率高さのブレを回避）。
          width: '100%', height: OBS_ROW_HEIGHT, cursor: isFuture ? 'not-allowed' : 'pointer',
          bgcolor: baseBg,
          // 縦の区切り線のみセルに付与（横線はテーブル本来の行ボーダーに任せ、
          // 二重線で太く見えるのを防ぐ）
          borderRight: '1px solid #cbd5e1',
          // 複数記録は上下に積み、各セグメントを均等高さで分割
          display: 'flex', flexDirection: 'column',
          '&:hover': isFuture ? {} : { boxShadow: 'inset 0 0 0 2px #2563eb' },
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
    // 編集内容は日付キーで保持（日付送りしても該当日に残る）
    setRowEdits((prev) => ({ ...prev, [dayIso[editDay]]: draft }));
    closeEdit();
  };
  const patchDraft = (patch: Partial<DailyRow>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const patchIntake = (k: 'morning' | 'lunch' | 'dinner', v: string) =>
    setDraft((d) => (d ? { ...d, intake: { ...d.intake, [k]: v } } : d));

  // ----- 看護記録 新規登録（フッター「看護記録」ボタンと同一の NursingRecordDialog を流用）-----
  const [nrOpen, setNrOpen] = useState(false);
  const [nrDate, setNrDate] = useState<string | undefined>(undefined);
  const openNursing = (i: number) => {
    // 患者未指定（/flowsheet 等）では開かず通知して return（空 patientId のレコード作成を防ぐ）。
    if (!patientId) { showSnackbar('患者が選択されていません', 'warning'); return; }
    // 対象日の ISO（YYYY-MM-DD・main の date-send 基盤の dayIso）をダイアログの記載日初期値に渡す。
    setNrDate(dayIso[i]);
    setNrOpen(true);
  };

  return (
    // 記録サマリー帯と詳細テーブルの右端をそろえる: ルートを最も広い子（＝固定幅の詳細テーブル）に
    // 合わせて shrink-wrap（width:max-content）する。minWidth:100% は付けない（付けると広い
    // ビューポートで帯だけがコンテナ幅まで伸び、固定幅のテーブルより右へはみ出すため）。
    // これで帯（width:100%）は常にテーブル幅ちょうどになり、画面幅に依らず右端が一致する。
    <Box sx={{ width: 'max-content' }}>
      {/* === 記録サマリー帯（最近30日・色バッジ俯瞰）=== */}
      {/* 医師・相談員が「いつ・どの記録が・どの程度あるか」を時系列で俯瞰する（表示専用）。詳細入力は下の7日表で行う。
          endDate を本体と共有して右端7日を青枠でハイライト（＝下の詳細に出ている範囲の目印）。
          ラベル幅・総幅を下の詳細テーブル（colgroup）に一致させ、左端・右端をそろえる。 */}
      <RecordSummaryStrip
        patientId={patientId}
        endDate={endDate}
        today={ANCHOR_END_ISO}
        labelWidth={LABEL_COL_WIDTH + SUB_COL_WIDTH}
        totalWidth={LABEL_COL_WIDTH + SUB_COL_WIDTH + DAY_COL_WIDTH * dayIso.length}
        detailDays={dayIso.length}
      />
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
            {dayIso.map((iso) => (
              <col key={iso} style={{ width: DAY_COL_WIDTH }} />
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
                {/* 日付送り: ≪ 7日前 / ＜ 1日前 / 当日 / ＞ 1日後 / ≫ 7日後。
                    右端（基準日）を動かし、7 日列を組み直す。 */}
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {([
                    { label: '≪', title: '7日前', onClick: () => shiftEndDate(-7) },
                    { label: '＜', title: '1日前', onClick: () => shiftEndDate(-1) },
                    { label: '当日', title: '当日を右端に表示', onClick: () => setEndDate(todayIso()) },
                    { label: '＞', title: '1日後', onClick: () => shiftEndDate(1) },
                    { label: '≫', title: '7日後', onClick: () => shiftEndDate(7) },
                  ] as const).map((b) => (
                    <Typography
                      key={b.label}
                      role="button"
                      aria-label={b.title}
                      title={b.title}
                      onClick={b.onClick}
                      sx={{
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: 700,
                        color: b.label === '当日' ? '#1e3a5f' : '#1e40af',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      {b.label}
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
                      aria-label={`フローシート編集 ${dayIso[i]}`}
                      onClick={() => openFlowsheetEdit(i)}
                      sx={{ minWidth: 0, px: 0.5, py: 0, color: '#1e3a5f', borderColor: '#c5d5e8' }}
                    >
                      <AssignmentIcon sx={{ fontSize: '0.95rem' }} />
                    </Button>
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
            <RestraintRow label="隔離" bar={RESTRAINTS.isolation} rows={rows} dayIso={dayIso} />
            <RestraintRow label="拘束" bar={RESTRAINTS.restraint} rows={rows} dayIso={dayIso} />
            <RestraintRow label="行動制限(その他)" bar={RESTRAINTS.behavior} rows={rows} dayIso={dayIso} />
            <RestraintRow label="外出・外泊" bar={RESTRAINTS.outing} rows={rows} dayIso={dayIso} />

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
                    未来枠（未到来の時間帯）以外のセルはクリックで観察記録ダイアログを開ける。 */}
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
                      <Stack direction="row" spacing={0.4} alignItems="center">
                        <Box sx={{ width: 12, height: 12, bgcolor: '#e2e8f0', border: '1px solid #cbd5e1' }} />
                        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                          {OBSERVATION_FUTURE_BLOCK_LABEL}
                        </Typography>
                      </Stack>
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
                      <LineChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 5 }}>
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
                    onClick={() => setOrderListOpen(true)}
                    sx={{ fontSize: '0.6rem', minWidth: 0, px: 1, py: 0, lineHeight: 1.5, color: '#1e40af', borderColor: '#1e40af' }}
                  >
                    一覧
                  </Button>
                </Stack>
              </TableCell>
              <TableCell sx={stickySubCell} />
              {rows.map((d, i) => {
                const iso = dayIso[i];
                // 静的モックの種名 ＋ オーダ入力連携で得た種名 を合成（同一種名は1文字に集約＝マニュアル準拠）。
                const derived = orderKindsByIso.get(iso) ?? [];
                const kinds: OrderKind[] = [...d.orderKinds];
                derived.forEach((k) => { if (!kinds.includes(k)) kinds.push(k); });
                // 実施状況: その日の実オーダを種名別に集計（全件実施済でグレー、1件でも実施でセル背景オレンジ）。
                const dayOrders = patientOrders.filter((o) => o.startDate === iso);
                const kindStat = new Map<OrderKind, { total: number; done: number }>();
                dayOrders.forEach((o) => {
                  const k = ORDER_KIND_OF[o.type];
                  if (!k) return;
                  const s = kindStat.get(k) ?? { total: 0, done: 0 };
                  s.total += 1; if (isExecuted(o)) s.done += 1;
                  kindStat.set(k, s);
                });
                const anyDone = dayOrders.some(isExecuted);
                const kindColor = (k: OrderKind): string => {
                  const s = kindStat.get(k);
                  return s && s.done === s.total ? '#94a3b8' : ORDER_COLOR[k].fg; // 全件実施済→グレー
                };
                return (
                <TableCell
                  key={i}
                  onClick={() => setExecDay(iso)}
                  sx={{
                    ...dayCellSx(d.isToday),
                    ...(anyDone && { bgcolor: '#fff7ed' }), // 実施オーダあり→オレンジ背景（マニュアル準拠）
                    cursor: 'pointer', '&:hover': { bgcolor: '#eef2ff' },
                  }}
                >
                  <Stack direction="row" spacing={0} justifyContent="center" sx={{ flexWrap: 'wrap' }}>
                    {kinds.map((k, idx) => (
                      <React.Fragment key={`${k}-${idx}`}>
                        <Typography
                          component="span"
                          sx={{ fontSize: '0.75rem', fontWeight: 700, color: kindColor(k) }}
                        >
                          {k}
                        </Typography>
                        {idx < kinds.length - 1 && (
                          <Typography component="span" sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>／</Typography>
                        )}
                      </React.Fragment>
                    ))}
                  </Stack>
                </TableCell>
                );
              })}
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
                  {rows.map((d, i) => {
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

            </>
            )}

            {/* ===== パターン変更（フローシートサブタブのみ・最下部に統合して日付列に整列） ===== */}
            {subTab === 'flowsheet' && (
            <>
            <TableRow>
              <TableCell colSpan={9} sx={{ ...sectionHeaderCellSx, bgcolor: '#eef2f7' }}>
                {/* パターンボックス: 表示モードトグル ＋ [パターン変更] ボタン */}
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <ToggleButtonGroup
                    size="small" exclusive value={patternViewMode}
                    onChange={(_, v) => { if (v) setPatternViewMode(v); }}
                  >
                    <ToggleButton value="applied" aria-label="適用パターン名表示" sx={{ py: 0, px: 1, fontSize: '0.7rem' }}>適用パターン名</ToggleButton>
                    <ToggleButton value="all" aria-label="全パターン表示" sx={{ py: 0, px: 1, fontSize: '0.7rem' }}>全パターン</ToggleButton>
                  </ToggleButtonGroup>
                  <Button size="small" variant="outlined" onClick={() => setPatternDialogOpen(true)}>
                    パターン変更
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
            {patternGroups.length === 0 ? (
              // パターンなし（未適用）: グレー・入力不可（共通項目時間設定）。入力は要パターン適用。
              <TableRow>
                <TableCell sx={stickyLabelCell}>パターンなし</TableCell>
                <TableCell sx={stickySubCell} />
                {rows.map((d, i) => (
                  <TableCell key={i} aria-label={i === 0 ? 'パターン未適用' : undefined} sx={{ ...dayCellSx(d.isToday), bgcolor: '#e2e8f0' }} />
                ))}
              </TableRow>
            ) : (
              patternGroups.map((g) => (
                <React.Fragment key={g.id}>
                  {/* パターン名のグループ見出し行（label+sub をまたいで表示）。
                      startDate=null（全パターン表示時の未適用）は入力ボタン無し・薄グレー。 */}
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      aria-label={`${g.startDate != null ? 'パターン適用済' : 'パターン未適用行'} ${g.pattern}`}
                      sx={{ ...stickyLabelCell, width: 'auto', bgcolor: '#eef2f7', color: '#1e3a5f', fontWeight: 700, fontSize: '0.8rem' }}
                    >
                      {g.pattern}
                    </TableCell>
                    {dayIso.map((iso, i) => {
                      // 入力可能日付（適用開始日〜終了日）のみ [入力] を表示。範囲外・未適用は薄グレー。
                      const active = g.startDate != null && inPeriod(g.startDate, g.endDate, iso);
                      return (
                        <TableCell key={i} sx={{ ...dayCellSx(rows[i].isToday), p: 0.25, bgcolor: active ? '#eef2f7' : '#f1f5f9' }}>
                          {active && (
                            <Button
                              size="small" variant="outlined"
                              aria-label={`${g.pattern} 入力 ${iso}`}
                              onClick={() => openPatternEntry({ id: g.id, pattern: g.pattern, startDate: g.startDate as string, endDate: g.endDate }, iso)}
                              sx={{ fontSize: '0.6rem', minWidth: 0, px: 1, py: 0, lineHeight: 1.5, color: '#475569', borderColor: '#cbd5e1', whiteSpace: 'nowrap' }}
                            >
                              入力
                            </Button>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {/* パターンの入力項目（子行）: 各項目 × 日付セルは読み取り専用（直接入力不可）。
                      入力は見出しの [入力] ダイアログ経由のみ。登録値をセルに表示する。 */}
                  {patternItems(g.pattern).map((ci) => {
                    const item = careItemLabel(ci);
                    return (
                    <TableRow key={item}>
                      <TableCell colSpan={2} sx={{ ...stickyLabelCell, width: 'auto', pl: 2, fontWeight: 400, fontSize: '0.72rem' }}>
                        {item}
                      </TableCell>
                      {dayIso.map((iso, i) => {
                        const key = `${g.id}|${item}|${iso}`;
                        const active = g.startDate != null && inPeriod(g.startDate, g.endDate, iso); // 適用期間内のみ表示
                        return (
                          <TableCell
                            key={iso}
                            sx={{ ...dayCellSx(rows[i].isToday), p: 0.25, ...(active ? {} : { bgcolor: '#f1f5f9' }) }}
                          >
                            {active && (
                              <Box
                                aria-label={`${g.pattern} ${item} ${iso}`}
                                sx={{ fontSize: '0.72rem', textAlign: 'center', minHeight: 18, lineHeight: '18px' }}
                              >
                                {patternCells[key] ?? ''}
                              </Box>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    );
                  })}
                </React.Fragment>
              ))
            )}

            {/* ===== サイン（パターン変更セクションの下に配置） ===== */}
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

      {/* パターン変更欄の凡例（フローシートサブタブのみ） */}
      {subTab === 'flowsheet' && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          グレー＝パターンなし（共通項目時間設定）／白＝パターン適用済（日付枠ごとに入力可）
        </Typography>
      )}

      {/* パターン変更ダイアログ（最下部 [パターン変更] から起動） */}
      <Dialog open={patternDialogOpen} onClose={() => setPatternDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>フローシートパターン変更</DialogTitle>
        <DialogContent dividers>
          {/* ヘッダー入力: 開始日 + 終了日 + パターン + [登録] */}
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
            <TextField
              type="date" size="small" label="開始日" InputLabelProps={{ shrink: true }}
              value={pStart} onChange={(e) => setPStart(e.target.value)}
            />
            <TextField
              type="date" size="small" label="終了日" InputLabelProps={{ shrink: true }}
              inputProps={{ min: pStart }}
              value={pEnd} onChange={(e) => setPEnd(e.target.value)}
            />
            <TextField
              select size="small" label="パターン" sx={{ minWidth: 180 }}
              value={pName} onChange={(e) => setPName(e.target.value)}
            >
              {PATTERN_OPTIONS.map((o) => (<MenuItem key={o} value={o}>{o}</MenuItem>))}
            </TextField>
            <Button variant="contained" size="small" onClick={requestApplyPattern}>登録</Button>
          </Stack>
          {/* 適用期間テーブル */}
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableBody>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 700 }}>開始日</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>終了日</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>パターン名</TableCell>
                  <TableCell sx={{ width: 56 }} />
                </TableRow>
                {patternPeriods.map((p) => {
                  const e = editedPeriod(p);
                  const dirty = isPeriodDirty(p);
                  const editing = editingPeriodId === p.id;
                  return editing ? (
                    // 編集モード: 開始日・パターンを編集可。[更新]で確認サブダイアログ。
                    <TableRow key={p.id}>
                      <TableCell>
                        <TextField
                          type="date" size="small" variant="standard"
                          value={e.startDate}
                          onChange={(ev) => setPeriodEdit(p, { startDate: ev.target.value })}
                          inputProps={{ 'aria-label': `開始日 ${p.pattern}` }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="date" size="small" variant="standard"
                          value={e.endDate}
                          onChange={(ev) => setPeriodEdit(p, { endDate: ev.target.value })}
                          inputProps={{ 'aria-label': `終了日 ${p.pattern}`, min: e.startDate }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          select size="small" variant="standard" sx={{ minWidth: 110 }}
                          value={e.pattern}
                          onChange={(ev) => setPeriodEdit(p, { pattern: ev.target.value })}
                          inputProps={{ 'aria-label': `パターン名 ${p.pattern}` }}
                        >
                          {PATTERN_OPTIONS.map((o) => (<MenuItem key={o} value={o}>{o}</MenuItem>))}
                        </TextField>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {dirty && (
                          <Button size="small" onClick={() => requestPeriodChange(p)}>更新</Button>
                        )}
                        <Button size="small" color="error" onClick={() => requestDeletePeriod(p)}>削除</Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // 参照モード: 行クリックで編集モードに入る（SPEC us-21）。
                    <TableRow
                      key={p.id} hover sx={{ cursor: 'pointer' }}
                      aria-label={`適用パターン行 ${p.pattern}`}
                      onClick={() => setEditingPeriodId(p.id)}
                    >
                      <TableCell>{p.startDate}</TableCell>
                      <TableCell>{p.endDate || '—'}</TableCell>
                      <TableCell>{p.pattern}</TableCell>
                      <TableCell sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <Button
                          size="small" color="error"
                          onClick={(ev) => { ev.stopPropagation(); requestDeletePeriod(p); }}
                        >
                          削除
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {patternPeriods.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography variant="caption" color="text.secondary">
                        適用中のパターンはありません（共通項目時間設定が適用されます）
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ textAlign: 'center', mt: 0.5 }}>
            <Button size="small" onClick={requestApplyPattern}>[新規]</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => { setEditingPeriodId(null); setPatternDialogOpen(false); }}>キャンセル</Button>
        </DialogActions>
      </Dialog>

      {/* パターン変更の確認サブダイアログ（適用日以降のケアメニューデータ削除を伴う不可逆操作） */}
      <Dialog open={!!periodConfirm} onClose={() => setPeriodConfirm(null)} maxWidth="xs">
        <DialogTitle sx={{ pb: 1 }}>パターン変更の確認</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9rem' }}>
            {periodConfirm?.startDate} 以降のケアメニューデータは削除されます。よろしいですか？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPeriodConfirm(null)}>キャンセル</Button>
          <Button variant="contained" color="error" onClick={applyPeriodChange}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* パターン削除（適用解除）の確認サブダイアログ（AC-6） */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs">
        <DialogTitle sx={{ pb: 1 }}>パターン削除の確認</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9rem' }}>
            「{deleteConfirm?.pattern}」を適用解除します（パターンなし状態になります）。よろしいですか？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>キャンセル</Button>
          <Button variant="contained" color="error" onClick={confirmDeletePeriod}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* 新規適用の確認サブダイアログ（AC-1/AC-3: 適用日以降のケアメニューデータ削除を伴う不可逆操作） */}
      <Dialog open={!!applyConfirm} onClose={() => setApplyConfirm(null)} maxWidth="xs">
        <DialogTitle sx={{ pb: 1 }}>パターン適用の確認</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9rem' }}>
            {applyConfirm?.startDate} 以降のケアメニューデータは削除されます。よろしいですか？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyConfirm(null)}>キャンセル</Button>
          <Button variant="contained" color="error" onClick={confirmApplyPattern}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* パターン項目の入力ダイアログ（パターン見出し／未適用行の [入力] から起動） */}
      <Dialog open={!!entryTarget} onClose={() => setEntryTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>{entryTarget?.pattern} 新規作成</DialogTitle>
        {entryTarget && (
          <DialogContent dividers>
            <TextField
              type="date" size="small" label="日付" InputLabelProps={{ shrink: true }} fullWidth
              inputProps={{ min: entryTarget.startDate, max: entryTarget.endDate || undefined }}  // 適用開始日〜終了日のみ
              value={entryDate}
              onChange={(e) => { setEntryDate(e.target.value); setEntryValues(loadEntryValues(entryTarget, e.target.value)); }}
              sx={{ mb: 1.5 }}
            />
            <Stack spacing={1.25}>
              {patternItems(entryTarget.pattern).map((ci) => {
                const label = careItemLabel(ci);
                const hasOptions = !!ci.options && ci.options.length > 0;
                return (
                  <TextField
                    key={label} size="small" label={label} fullWidth
                    select={hasOptions}
                    placeholder={hasOptions ? undefined : '入力'}
                    value={entryValues[label] ?? ''}
                    onChange={(e) => setEntryValues((prev) => ({ ...prev, [label]: e.target.value }))}
                    inputProps={hasOptions ? undefined : { 'aria-label': `入力 ${label}` }}
                  >
                    {hasOptions
                      ? [
                          <MenuItem key="__empty" value=""><em>（未選択）</em></MenuItem>,
                          ...ci.options!.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>),
                        ]
                      : undefined}
                  </TextField>
                );
              })}
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setEntryTarget(null)}>キャンセル</Button>
          <Button variant="contained" onClick={savePatternEntry}>登録</Button>
        </DialogActions>
      </Dialog>

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
        onSaved={(info) => {
          // 作成した看護記録を、記載日に対応する列の「看護記録」行へリンク表示する（従来挙動）。
          // main の date-send 基盤に合わせ rowEdits（ISO キー）へ反映＝セッション限定・リロードで消える。
          if (info.mode !== 'new') return;
          const iso = info.recordedAt.slice(0, 10);
          if (!dayIso.includes(iso)) return; // 表示中の週外なら反映しない
          setRowEdits((prev) => {
            const base = prev[iso] ?? buildDay(iso);
            return { ...prev, [iso]: { ...base, nursingLinks: [...base.nursingLinks, `看護記録(${info.title})`] } };
          });
        }}
      />

      {/* 予定オーダ「一覧」= 指示状況ダイアログ（参照のみ。マニュアル準拠：DO・新規指示不可） */}
      <Dialog open={orderListOpen} onClose={() => setOrderListOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ py: 1 }}>
          予定オーダ 指示状況（参照）
          <Typography component="span" variant="body2" color="text.secondary">
            　{patient ? `${patient.patientNumber ?? patient.id}　${patient.name}` : ''}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            参照のみ可能です（DO・新規指示はできません）。オーダの作成はカルテの「オーダー入力」から行います。
          </Typography>
          {patientOrders.length === 0 ? (
            <Typography variant="body2" color="text.secondary">オーダはありません。</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 110 }}>開始日</TableCell>
                  <TableCell sx={{ width: 90 }}>種別</TableCell>
                  <TableCell>内容</TableCell>
                  <TableCell sx={{ width: 80 }}>状態</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patientOrders.map((o) => (
                  <TableRow key={o.id} hover>
                    <TableCell>{o.startDate}</TableCell>
                    <TableCell><Chip size="small" label={orderTypeLabel(o.type)} /></TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'pre-line' }}>{o.content}</TableCell>
                    <TableCell>{o.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderListOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>

      {/* 予定オーダ セルクリック = 実施確認表ダイアログ（1週間カレンダー・実施日に実施回数。当日は右端） */}
      <Dialog open={execDay !== null} onClose={() => setExecDay(null)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ py: 1 }}>
          実施確認表
          <Typography component="span" variant="body2" color="text.secondary">
            　{dayIso[0]?.replace(/-/g, '/')} 〜 {dayIso[dayIso.length - 1]?.replace(/-/g, '/')}（当日: 右端）
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {(() => {
            // 予定オーダ欄の種名（薬/注/検/E）を持つ型のみ対象（IF・リハビリ・文字は実施確認表に出さない）。
            // ※IF は頓用のため、指示時点では出さず、IFオーダタブで実施した各サブオーダが実施済として並ぶ。
            const rows = patientOrders.filter(
              (o) => ORDER_KIND_OF[o.type] && dayIso.some((iso) => activeOnDay(o, iso)),
            );
            if (rows.length === 0) {
              return <Typography variant="body2" color="text.secondary">この期間のオーダはありません。</Typography>;
            }
            return (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  実施予定日に実施回数（1日N回）を表示します。未実施の回数をクリックすると実施できます。
                </Typography>
                <Table size="small" sx={{ '& td, & th': { px: 0.75 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 84 }}>種別</TableCell>
                      <TableCell sx={{ minWidth: 240 }}>内容</TableCell>
                      {DAILY.map((d, i) => (
                        <TableCell key={i} align="center" sx={{ width: 52, bgcolor: d.isToday ? '#eff6ff' : undefined }}>
                          <Typography variant="caption" fontWeight={700}>{d.date.slice(5)}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>（{d.weekday}）</Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((o) => {
                      const done = isExecuted(o);
                      const n = dosesPerDay(o);
                      return (
                        <TableRow key={o.id}>
                          <TableCell><Chip size="small" label={orderTypeLabel(o.type)} /></TableCell>
                          <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'pre-line', verticalAlign: 'top', py: 0.5 }}>{o.content}</TableCell>
                          {dayIso.map((iso, i) => {
                            const active = activeOnDay(o, iso);
                            return (
                              <TableCell key={i} align="center"
                                onClick={() => { if (active && !done) openExec(o); }}
                                sx={{
                                  cursor: active && !done ? 'pointer' : 'default',
                                  bgcolor: DAILY[i].isToday ? '#eff6ff' : undefined,
                                  '&:hover': active && !done ? { bgcolor: '#dbeafe' } : undefined,
                                }}
                              >
                                {active ? (
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: done ? '#94a3b8' : '#dc2626' }}>
                                    {n}
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" color="text.disabled">—</Typography>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExecDay(null)}>閉じる</Button>
        </DialogActions>
      </Dialog>

      {/* オーダ実施ダイアログ（実施確認表の未実施オーダから起動。参考システム実機準拠）
          患者／内容(カルテNo＋医薬品)／予定日／伝票(指示医)／印刷／指示受け(2つ)／実施(チェック) の一覧。
          実施チェックが ON のときのみ [実施] 可能。 */}
      <Dialog open={execTarget !== null} onClose={() => setExecTarget(null)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ py: 1, bgcolor: '#2f6ca6', color: '#fff', fontSize: '1rem' }}>オーダ実施</DialogTitle>
        <DialogContent dividers sx={{ p: 1.5 }}>
          {execTarget && (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#eaf2fa' }}>
                      <TableCell sx={{ fontWeight: 700, width: 150 }}>患者</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>内容</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 110 }} align="center">予定日</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 150 }} align="center">伝票(指示医)</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 56 }} align="center">印刷</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 120 }} align="center">指示受け</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: 56 }} align="center">実施</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      // 入院定時は「印刷」欄より左（患者/内容/予定日/伝票）クリックで定期処方実施ダイアログを開く。
                      const rxClick = execTarget.type === '入院定時';
                      const rxCellSx = { verticalAlign: 'top' as const, ...(rxClick && { cursor: 'pointer', '&:hover': { bgcolor: '#eef5fb' } }) };
                      const onRx = rxClick ? openRxExec : undefined;
                      return (
                    <TableRow>
                      {/* 患者: 病棟 + 患者名 + 年齢 */}
                      <TableCell sx={rxCellSx} onClick={onRx}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {patient?.wardName ?? patient?.roomNumber ?? ''}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {patient?.name ?? ''}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          （{patient?.age ?? '—'}）
                        </Typography>
                      </TableCell>
                      {/* 内容: カルテNo + 医薬品/検査内容 */}
                      <TableCell sx={rxCellSx} onClick={onRx}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {orderKarteNos[execTarget.id] ?? '（カルテNo未発行）'}
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                          {execTarget.content}
                        </Typography>
                      </TableCell>
                      {/* 予定日: 待ち + 実施予定日 */}
                      <TableCell align="center" sx={rxCellSx} onClick={onRx}>
                        <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700 }} display="block">
                          待ち
                        </Typography>
                        <Typography variant="body2">{execTarget.startDate}</Typography>
                      </TableCell>
                      {/* 伝票(指示医): オーダ名 + 指示医 */}
                      <TableCell align="center" sx={rxCellSx} onClick={onRx}>
                        <Typography variant="body2">{orderTypeLabel(execTarget.type)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          （{execTarget.doctorName}）
                        </Typography>
                      </TableCell>
                      {/* 印刷 */}
                      <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                        <IconButton size="small" aria-label="印刷"
                          onClick={() => showSnackbar('伝票を印刷しました', 'success')}>
                          <PrintOutlinedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                      {/* 指示受け: 2 つ。リストから指示受け者を選ぶ（未選択＝[未]） */}
                      <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                        <Stack spacing={0.5}>
                          {[{ v: ack1, set: setAck1, n: 1 }, { v: ack2, set: setAck2, n: 2 }].map(({ v, set, n }) => (
                            <TextField
                              key={n} select size="small" variant="standard"
                              value={v ?? ''}
                              onChange={(e) => set(e.target.value || null)}
                              inputProps={{ 'aria-label': `指示受け${n}` }}
                              SelectProps={{ displayEmpty: true }}
                              sx={{ minWidth: 96 }}
                            >
                              <MenuItem value=""><em style={{ color: '#c62828' }}>［未］</em></MenuItem>
                              {ACK_NURSES.map((name) => (
                                <MenuItem key={name} value={name}>{name}</MenuItem>
                              ))}
                            </TextField>
                          ))}
                        </Stack>
                      </TableCell>
                      {/* 実施: チェックボックス */}
                      <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                        <Checkbox size="small" checked={execChecked}
                          onChange={(e) => setExecChecked(e.target.checked)}
                          inputProps={{ 'aria-label': '実施' }} />
                      </TableCell>
                    </TableRow>
                      );
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* 凡例（参考システム実機準拠） */}
              <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 0.5 }}>
                {[
                  { c: '#f5e79e', l: '実施日未定オーダ' },
                  { c: '#f5c6c6', l: '未印刷' },
                  { c: '#c62828', l: '他所で編集中' },
                  { c: '#d4a017', l: '未署名' },
                ].map((x) => (
                  <Stack key={x.l} direction="row" spacing={0.5} alignItems="center">
                    <Box sx={{ width: 14, height: 14, bgcolor: x.c, border: '1px solid', borderColor: 'divider' }} />
                    <Typography variant="caption" color="text.secondary">{x.l}</Typography>
                  </Stack>
                ))}
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            disabled={!execChecked}
            onClick={() => {
              if (execTarget) {
                executeOrder(execTarget.id, LOGIN_NURSE);
                showSnackbar(`「${orderTypeLabel(execTarget.type)}：${execTarget.content}」を実施しました`, 'success');
              }
              setExecTarget(null);
            }}
          >
            実施
          </Button>
          <Button onClick={() => setExecTarget(null)}>閉じる</Button>
        </DialogActions>
      </Dialog>

      {/* 定期処方実施ダイアログ（オーダ実施ダイアログで入院定時の行をクリックで起動。参考システム実機準拠）
          実施者(ログイン)／実施日時(現在日時)／指示受け者(オーダ実施で決めた人)／医師より／備考、
          前回処方｜今回処方＋中止薬剤。下部＝特記報告・実施・中止・指示箋印刷・閉じる。 */}
      <Dialog open={rxExecOpen} onClose={() => setRxExecOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ py: 1, bgcolor: '#2f6ca6', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          定期処方実施
          <Button size="small" onClick={() => setRxExecOpen(false)} sx={{ color: '#fff' }}>← 戻る</Button>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 1.5 }}>
          {execTarget && (
            <>
              {/* 上段フォーム */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '90px 1fr 90px 1fr', gap: 1, alignItems: 'center', mb: 1.5 }}>
                <Typography variant="body2" sx={{ bgcolor: '#eaf2fa', px: 1, py: 0.75 }}>実施者</Typography>
                <TextField select size="small" value={rxExecutor} onChange={(e) => setRxExecutor(e.target.value)}
                  inputProps={{ 'aria-label': '実施者' }}>
                  {ACK_NURSES.map((name) => (<MenuItem key={name} value={name}>{name}</MenuItem>))}
                </TextField>
                <Typography variant="body2" sx={{ bgcolor: '#eaf2fa', px: 1, py: 0.75 }}>実施日時</Typography>
                <TextField type="datetime-local" size="small" value={rxDatetime}
                  onChange={(e) => setRxDatetime(e.target.value)}
                  InputLabelProps={{ shrink: true }} inputProps={{ 'aria-label': '実施日時' }} />

                <Typography variant="body2" sx={{ bgcolor: '#eaf2fa', px: 1, py: 0.75 }}>指示受け者</Typography>
                <TextField size="small" value={rxAckPerson} onChange={(e) => setRxAckPerson(e.target.value)}
                  placeholder="（指示受けなし）" inputProps={{ 'aria-label': '指示受け者' }} />
                {/* 医師より: 医師がオーダ発行時に「備考」へ入力したコメントの読取専用表示（実施者への申し送り）。
                    マニュアル（基本システム編 第5章 オーダリング p.1016/1171-1172/1174）準拠。 */}
                <Typography variant="body2" sx={{ bgcolor: '#eaf2fa', px: 1, py: 0.75 }}>医師より</Typography>
                <TextField size="small" value={rxDoctorNote}
                  InputProps={{ readOnly: true }} placeholder="（医師コメントなし）"
                  inputProps={{ 'aria-label': '医師より' }} />

                <Typography variant="body2" sx={{ bgcolor: '#eaf2fa', px: 1, py: 0.75 }}>備考</Typography>
                <TextField size="small" value={rxRemark} onChange={(e) => setRxRemark(e.target.value)}
                  sx={{ gridColumn: '2 / 5' }} inputProps={{ 'aria-label': '備考' }} />
              </Box>

              {/* 前回処方 ｜ 今回処方＋中止薬剤 */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                {/* 前回処方 */}
                <Box sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" align="center" sx={{ bgcolor: '#eaf2fa', fontWeight: 700, py: 0.5 }}>前回処方</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>前回処方はありません。</Typography>
                </Box>
                {/* 今回処方 ＋ 中止薬剤 */}
                <Box sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" align="center" sx={{ bgcolor: '#eaf2fa', fontWeight: 700, py: 0.5 }}>今回処方</Typography>
                  <Box sx={{ p: 1 }}>
                    {parseRxItems(execTarget).drugs.map((d, i) => (
                      <Box key={i} sx={{ mb: 1 }}>
                        <Stack direction="row" spacing={1}>
                          <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>[{i + 1}]</Typography>
                          <Typography variant="body2" sx={{ color: 'primary.main' }}>{d}</Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" align="right" display="block">
                          {parseRxItems(execTarget).usage || '　'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Typography variant="body2" align="center" sx={{ bgcolor: '#eaf2fa', fontWeight: 700, py: 0.5 }}>中止薬剤</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>中止薬剤はありません。</Typography>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2 }}>
          <FormControlLabel sx={{ mr: 'auto' }}
            control={<Checkbox size="small" checked={rxSpecialReport} onChange={(e) => setRxSpecialReport(e.target.checked)} inputProps={{ 'aria-label': '特記報告' }} />}
            label={<Typography variant="body2">特記報告</Typography>} />
          <Button variant="contained" onClick={() => {
            if (execTarget) {
              executeOrder(execTarget.id, rxExecutor);
              showSnackbar(`「入院定時：${execTarget.content}」を実施しました`, 'success');
            }
            setRxExecOpen(false);
            setExecTarget(null);
          }}>実施</Button>
          <Button color="error" onClick={() => {
            showSnackbar('入院定時を中止しました', 'info');
            setRxExecOpen(false);
            setExecTarget(null);
          }}>中止</Button>
          <Button onClick={() => showSnackbar('指示箋を印刷しました', 'success')}>指示箋印刷</Button>
          <Button onClick={() => setRxExecOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>

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
