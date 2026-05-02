// ===== ep-10 看護実施（フローシート）モックデータ =====
// 本 feature 内に閉じたサンプル／マスタ。共有 mockData.ts には依存だけして変更しない。

import type {
  CareItemMaster,
  FlowsheetPatternApplication,
  FlowsheetPatternMaster,
  FlowsheetPropertyConfig,
  FlowsheetStaff,
  LabResultEntry,
  MovementSegment,
  NursingRecord,
  NursingRecordTemplate,
  ScheduledOrder,
  SignEntry,
  SleepLog,
  VitalEntry,
  CareRecord,
} from './types';

export const TODAY = '2026-05-02';

// ---- スタッフ ----
export const FLOWSHEET_STAFFS: FlowsheetStaff[] = [
  { id: 'st-yamamoto',   name: '山本 看護師',   role: '看護師',   affiliation: '第1病棟' },
  { id: 'st-sasaki',     name: '佐々木 看護師', role: '看護師',   affiliation: '第1病棟' },
  { id: 'st-nakata',     name: '中田 看護師',   role: '看護師',   affiliation: '第1病棟' },
  { id: 'st-tanaka',     name: '田中 看護師長', role: '看護師長', affiliation: '第1病棟' },
  { id: 'st-tamura',     name: '田村 医師',     role: '医師',     affiliation: '精神科' },
];
export const DEFAULT_LOGON_STAFF_ID = 'st-yamamoto';

// ---- ケア項目マスタ（最低限のサンプル） ----
export const MASTER_CARE_ITEMS: CareItemMaster[] = [
  { id: 'ci-meal-breakfast', name: '朝食摂取量',   type: 'combo', options: ['全量', '8割', '半量', '少量', '欠食'] },
  { id: 'ci-meal-lunch',     name: '昼食摂取量',   type: 'combo', options: ['全量', '8割', '半量', '少量', '欠食'] },
  { id: 'ci-meal-dinner',    name: '夕食摂取量',   type: 'combo', options: ['全量', '8割', '半量', '少量', '欠食'] },
  { id: 'ci-medication-morning', name: '朝食後服薬', type: 'check',  unit: '済' },
  { id: 'ci-medication-noon',    name: '昼食後服薬', type: 'check',  unit: '済' },
  { id: 'ci-medication-evening', name: '夕食後服薬', type: 'check',  unit: '済' },
  { id: 'ci-medication-bedtime', name: '眠前服薬',   type: 'check',  unit: '済' },
  { id: 'ci-bath',           name: '入浴',         type: 'radio', options: ['一般浴', 'シャワー', '清拭', '未'] },
  { id: 'ci-bowel',          name: '排便',         type: 'radio', options: ['有', '無'] },
  { id: 'ci-mood',           name: '気分',         type: 'combo', options: ['良好', '普通', '不安', '落ち込み', '不穏'] },
  { id: 'ci-restraint-check', name: '拘束観察', type: 'check-multi', options: ['皮膚状態', '循環', '可動域', '苦痛訴え'] },
];

// ---- フローシートパターンマスタ ----
export const MASTER_FLOWSHEET_PATTERNS: FlowsheetPatternMaster[] = [
  {
    id: 'fp-psy-basic',
    name: '精神科基本',
    careItemIds: [
      'ci-meal-breakfast', 'ci-meal-lunch', 'ci-meal-dinner',
      'ci-medication-morning', 'ci-medication-noon', 'ci-medication-evening', 'ci-medication-bedtime',
      'ci-bath', 'ci-bowel', 'ci-mood',
    ],
  },
  {
    id: 'fp-psy-isolation',
    name: '精神科隔離',
    careItemIds: [
      'ci-meal-breakfast', 'ci-meal-lunch', 'ci-meal-dinner',
      'ci-medication-morning', 'ci-medication-noon', 'ci-medication-evening', 'ci-medication-bedtime',
      'ci-bowel', 'ci-mood', 'ci-restraint-check',
    ],
  },
  {
    id: 'fp-physical',
    name: '身体管理',
    careItemIds: [
      'ci-meal-breakfast', 'ci-meal-lunch', 'ci-meal-dinner',
      'ci-medication-morning', 'ci-medication-noon', 'ci-medication-evening',
      'ci-bath', 'ci-bowel',
    ],
  },
];

// ---- 看護記録テンプレート ----
export const NURSING_RECORD_TEMPLATES: NursingRecordTemplate[] = [
  {
    id: 'nrt-soap-mood',
    name: '気分変動 SOAP',
    formType: 'soap',
    body: {
      formType: 'soap',
      body: {
        s: '「気分が落ち込んでいる」と発言。',
        o: '表情やや沈鬱。食欲低下傾向。',
        a: '抑うつ症状の悪化兆候あり。継続観察必要。',
        p: '主治医報告。傾聴対応継続。',
      },
    },
  },
  {
    id: 'nrt-focus-fall',
    name: '転倒リスク FOCUS',
    formType: 'focus',
    body: {
      formType: 'focus',
      body: {
        focus: '転倒リスク',
        data: '夜間覚醒時にふらつきあり。',
        action: '見守り強化、ナースコール周知。',
        response: '夜間転倒なく経過。',
      },
    },
  },
  {
    id: 'nrt-free-summary',
    name: '日勤サマリ（フリー）',
    formType: 'free',
    body: {
      formType: 'free',
      body: {
        free: '本日 ADL 自立。日中レクリエーション参加。表情穏やか。',
      },
    },
  },
];

// ---- マスタ設定（プロパティ）デフォルト ----
export const FLOWSHEET_DEFAULT_PROPERTY: FlowsheetPropertyConfig = {
  validateFuture: true,
  confirmFuture: false,
  medicationInitialOperator: 'logon',
  signRoleLock: 'allowOthers',
  defaultRecordForm: 'soap',
  bulkSignDefault: false,
  inputTargetOnlyDefault: true,
  shiftStartTimes: { day: '08:30', evening: '16:30', night: '00:30' },
  recordsPerPage: 30,
  forbiddenChars: ['#', '@'],
};

// ---- パターン適用 ----
export const INITIAL_PATTERN_APPLICATIONS: FlowsheetPatternApplication[] = [
  {
    id: 'fpa-001',
    patientId: 'P001',
    startDate: '2026-04-01',
    patternId: 'fp-psy-basic',
    appliedAt: '2026-04-01T09:00:00',
    appliedBy: 'st-tanaka',
  },
  {
    id: 'fpa-002',
    patientId: 'P003',
    startDate: '2026-04-15',
    patternId: 'fp-psy-isolation',
    appliedAt: '2026-04-15T10:00:00',
    appliedBy: 'st-tanaka',
  },
  {
    id: 'fpa-003',
    patientId: 'P004',
    startDate: '2026-04-20',
    patternId: 'fp-psy-isolation',
    appliedAt: '2026-04-20T08:30:00',
    appliedBy: 'st-tanaka',
  },
];

// ---- バイタルサンプル（P001 山田 太郎の直近 3 日分） ----
const v = (
  id: string, date: string, time: string,
  bpSys: number, bpDia: number, t: number, p: number, r: number, s: number,
): VitalEntry => ({
  id, patientId: 'P001', date, time,
  bpSys, bpDia, temp: t, pulse: p, resp: r, spo2: s,
  recordedBy: 'st-yamamoto', registeredAt: `${date}T${time}:00`,
});
export const INITIAL_VITALS: VitalEntry[] = [
  v('vt-001', '2026-04-30', '08:00', 124, 78, 36.5, 72, 16, 98),
  v('vt-002', '2026-04-30', '14:00', 130, 82, 36.8, 78, 18, 97),
  v('vt-003', '2026-04-30', '20:00', 122, 76, 36.6, 70, 16, 98),
  v('vt-004', '2026-05-01', '08:00', 126, 80, 36.4, 70, 16, 98),
  v('vt-005', '2026-05-01', '14:00', 128, 82, 36.7, 74, 17, 98),
  v('vt-006', '2026-05-02', '08:00', 122, 78, 36.5, 68, 16, 98),
];

// ---- ケア記録サンプル ----
export const INITIAL_CARE_RECORDS: CareRecord[] = [
  {
    id: 'cr-001', patientId: 'P001', date: '2026-05-01', careItemId: 'ci-meal-breakfast',
    value: '全量', registeredAt: '2026-05-01T08:30:00', registeredBy: 'st-yamamoto',
  },
  {
    id: 'cr-002', patientId: 'P001', date: '2026-05-01', careItemId: 'ci-medication-morning',
    value: true, administeredBy: 'st-yamamoto',
    registeredAt: '2026-05-01T08:35:00', registeredBy: 'st-yamamoto',
  },
  {
    id: 'cr-003', patientId: 'P001', date: '2026-05-01', careItemId: 'ci-mood',
    value: '良好', registeredAt: '2026-05-01T10:00:00', registeredBy: 'st-yamamoto',
  },
  {
    id: 'cr-004', patientId: 'P001', date: '2026-05-02', careItemId: 'ci-meal-breakfast',
    value: '8割', registeredAt: '2026-05-02T08:30:00', registeredBy: 'st-yamamoto',
  },
];

// ---- サインサンプル ----
export const INITIAL_SIGNS: SignEntry[] = [
  { id: 'sg-001', patientId: 'P001', date: '2026-05-01', shift: 'night',   signerId: 'st-sasaki',   registeredAt: '2026-05-01T08:30:00' },
  { id: 'sg-002', patientId: 'P001', date: '2026-05-01', shift: 'day',     signerId: 'st-yamamoto', registeredAt: '2026-05-01T17:00:00' },
  { id: 'sg-003', patientId: 'P001', date: '2026-05-01', shift: 'evening', signerId: 'st-nakata',   registeredAt: '2026-05-02T00:30:00' },
  { id: 'sg-004', patientId: 'P001', date: '2026-05-02', shift: 'night',   signerId: 'st-sasaki',   registeredAt: '2026-05-02T08:30:00' },
];

// ---- 予定オーダ ----
export const INITIAL_SCHEDULED_ORDERS: ScheduledOrder[] = [
  { id: 'so-001', patientId: 'P001', date: '2026-04-30', kind: '薬', name: 'リスパダール 1mg 朝',  status: 'done' },
  { id: 'so-002', patientId: 'P001', date: '2026-04-30', kind: '薬', name: 'リスパダール 1mg 夕',  status: 'done' },
  { id: 'so-003', patientId: 'P001', date: '2026-05-01', kind: '薬', name: 'リスパダール 1mg 朝',  status: 'done' },
  { id: 'so-004', patientId: 'P001', date: '2026-05-01', kind: '薬', name: 'リスパダール 1mg 夕',  status: 'done' },
  { id: 'so-005', patientId: 'P001', date: '2026-05-02', kind: '薬', name: 'リスパダール 1mg 朝',  status: 'done' },
  { id: 'so-006', patientId: 'P001', date: '2026-05-02', kind: '薬', name: 'リスパダール 1mg 夕',  status: 'pending' },
  { id: 'so-007', patientId: 'P001', date: '2026-05-02', kind: '検', name: '血液検査（生化学）',  status: 'pending' },
  { id: 'so-008', patientId: 'P001', date: '2026-05-01', kind: '処', name: '採血',                status: 'done' },
];

// ---- 検査結果 ----
export const INITIAL_LAB_RESULTS: LabResultEntry[] = [
  {
    id: 'lr-001', patientId: 'P001', date: '2026-04-15', ticketName: '血液検査（生化学）',
    status: 'available',
    items: [
      { name: 'AST', value: 22, unit: 'U/L' },
      { name: 'ALT', value: 18, unit: 'U/L' },
      { name: 'γ-GTP', value: 30, unit: 'U/L' },
    ],
  },
  {
    id: 'lr-002', patientId: 'P001', date: '2026-04-30', ticketName: '血液検査（生化学）',
    status: 'available',
    items: [
      { name: 'AST', value: 24, unit: 'U/L' },
      { name: 'ALT', value: 20, unit: 'U/L' },
      { name: 'γ-GTP', value: 32, unit: 'U/L' },
    ],
  },
  {
    id: 'lr-003', patientId: 'P001', date: '2026-05-02', ticketName: '血液検査（生化学）',
    status: 'pending',  // 「待ち」: 表示しない
    items: [],
  },
];

// ---- 移動状況（オレンジバー表示用） ----
export const INITIAL_MOVEMENT_SEGMENTS: MovementSegment[] = [
  // P001 山田 — 病室在床（連続）
  { id: 'ms-001', patientId: 'P001', kind: 'room', startAt: '2026-04-26T00:00:00', endAt: '2026-05-02T23:59:59', label: '101A' },
  // P003 鈴木 — 隔離期間
  { id: 'ms-002', patientId: 'P003', kind: 'room',      startAt: '2026-04-26T00:00:00', endAt: '2026-05-02T23:59:59', label: '102A' },
  { id: 'ms-003', patientId: 'P003', kind: 'isolation', startAt: '2026-04-28T15:00:00', endAt: '2026-05-02T23:59:59' },
  // P006 伊藤 — 外出
  { id: 'ms-004', patientId: 'P006', kind: 'room',   startAt: '2026-04-26T00:00:00', endAt: '2026-05-02T23:59:59', label: '104A' },
  { id: 'ms-005', patientId: 'P006', kind: 'outing', startAt: '2026-05-02T10:00:00', endAt: '2026-05-02T17:00:00' },
];

// ---- 看護記録サンプル ----
export const INITIAL_NURSING_RECORDS: NursingRecord[] = [
  {
    id: 'nr-001', patientId: 'P001', title: '気分変動',
    recordedAt: '2026-05-01T10:30:00', shift: 'day', formType: 'soap',
    body: {
      formType: 'soap',
      body: {
        s: '「眠れないことが多い」と発言。',
        o: '夜間中途覚醒 2 回確認。日中も眠そうな様子。',
        a: '不眠による日中傾眠あり。',
        p: '主治医に報告。眠剤調整の検討依頼。',
      },
    },
    connections: ['flowsheet', 'handover'],
    reportTargets: [{ staffId: 'st-tamura', role: '確' }],
    tags: ['看護記録'],
    isPublished: true,
    recordedBy: 'st-yamamoto', registeredAt: '2026-05-01T10:32:00',
  },
  {
    id: 'nr-002', patientId: 'P001', title: '転倒リスク',
    recordedAt: '2026-05-02T14:00:00', shift: 'day', formType: 'focus',
    body: {
      formType: 'focus',
      body: {
        focus: '転倒リスク',
        data: '夜間覚醒時のふらつきが続く。',
        action: '見守り強化、夜間ラウンドを 1 時間ごとに変更。',
        response: '夜間転倒なし。',
      },
    },
    connections: ['flowsheet'],
    reportTargets: [],
    tags: ['看護記録', 'リスク管理'],
    isPublished: true,
    recordedBy: 'st-sasaki', registeredAt: '2026-05-02T14:05:00',
  },
];

// ---- 睡眠ログ ----
export const INITIAL_SLEEP_LOGS: SleepLog[] = [
  {
    id: 'sl-001', patientId: 'P001',
    startAt: '2026-05-01T22:00:00', endAt: '2026-05-02T05:30:00',
    state: '入眠', registeredAt: '2026-05-02T06:00:00', registeredBy: 'st-sasaki',
  },
  {
    id: 'sl-002', patientId: 'P001',
    startAt: '2026-05-02T02:00:00', endAt: '2026-05-02T02:30:00',
    state: '中途覚醒', registeredAt: '2026-05-02T06:00:00', registeredBy: 'st-sasaki',
  },
];

// ---- 睡眠状態マスタ ----
export const MASTER_SLEEP_STATES = ['入眠', '覚醒', '離床', '中途覚醒', '不穏'] as const;

// ---- 病棟マスタ（モック内、表示用） ----
export const FLOWSHEET_WARDS: { id: string; label: string }[] = [
  { id: 'ward1', label: '第1病棟' },
  { id: 'ward2', label: '第2病棟' },
];

// ---- 一括バイタル入力の「種類」マスタ ----
// spec の「種類」は ケア項目マスタの集合（基本昼／体温のみ 等）。本モックは bp+T+P+R+S を
// 1 つのセットとして扱い、種類により表示列を制御する。
export type BulkVitalKindId = 'basic' | 'temp-only' | 'bp-only';
export interface BulkVitalKindMaster {
  id: BulkVitalKindId;
  label: string;
  defaultTime: string;
  /** どのバイタル種別の列を表示するか */
  fields: Array<'bpSys' | 'bpDia' | 'temp' | 'pulse' | 'resp' | 'spo2' | 'weight'>;
  /** サイン連動対象の勤務帯 */
  signShift?: 'night' | 'day' | 'evening';
}
export const MASTER_BULK_VITAL_KINDS: BulkVitalKindMaster[] = [
  { id: 'basic',     label: '基本（昼）', defaultTime: '13:00', fields: ['bpSys', 'bpDia', 'temp', 'pulse', 'resp', 'spo2'], signShift: 'day' },
  { id: 'temp-only', label: '体温のみ',   defaultTime: '07:00', fields: ['temp'], signShift: 'day' },
  { id: 'bp-only',   label: '血圧のみ',   defaultTime: '08:00', fields: ['bpSys', 'bpDia'], signShift: 'day' },
];
