import type {
  Patient,
  InsuranceInfo,
  DiagnosisInfo,
  AllergyInfo,
  StaffInfo,
  AdlInfo,
  MedicalRecord,
  KarteTab,
} from '../types';
import {
  Room, Order, NursingRecord, VitalSign, FlowsheetDaily,
  AdmissionOrder, TransferHistory, AdmissionHistory, IsolationOrder,
  ObservationRecord, BehaviorRange, OutingRecord, PatientScheduleEvent,
  RehabOrder, RehabDailyReport, RehabEvaluation, NursingCareSchedule,
  Document, NursingDiaryEntry, WardDiaryEntry, StatusConfig, PatientStatus,
  OutpatientVisit, NursingPlan, PeriodicEvaluationRecord,
  BedFlag, BedFlagConfig, UnassignedPatient,
} from '../types';

// ===== カルテ画面用データ =====

export const currentPatient: Patient = {
  id: '44695',
  name: 'テスト 端末',
  age: 44,
  gender: 'M',
  wardId: 'ward1',
  roomNumber: '104',
  bedLabel: 'A',
  status: 'stable',
  admitDate: '2017-02-08',
  doctorName: '医師 太郎',
  nameKana: 'てすと まきな',
  bloodType: 'A型(+)',
  birthDate: 'S47.6.8',
  wardName: '1病棟 111b',
  nurse: 'Dr 医師 太郎',
  daycare: 'デイケア 大地',
};

export const insuranceInfo: InsuranceInfo = {
  type: 'テスト保険',
  validPeriod: '有効期限: 39999999',
  insurerNumber: '39999839',
  recordNumber: '01・23456789',
  insuredNumber: '検証',
  copay: '3割',
};

export const diagnosisInfo: DiagnosisInfo = {
  mainDiagnosis: '統合失調症',
  mainDiagnosisCode: 'F20.9',
  mainDiagnosisDate: '2017/02/08 ～',
  subDiagnosis: '不眠症',
  subDiagnosisCode: 'G47.0',
  subDiagnosisDate: '2017/04/05 ～',
};

export const allergyInfo: AllergyInfo = {
  drug: ['アレルギー性鼻炎[アレルギー性鼻炎炎]', '喘息', 'ウイルス性肝炎X'],
  food: ['卵アレルギー[鶏卵]'],
  other: ['カナ'],
};

export const staffInfo: StaffInfo = {
  responsibleTeam: '病棟内/スタッフ同伴',
  wardManagement: '2/B(昼)1h/B(夜)',
  staffManagement: '2/B(昼)1h/B(夜)',
  physicalRehab: '自立度判定処理',
  independenceLevel: 'B.',
  dementiaCareLevel: '',
};

export const adlInfo: AdlInfo = {
  barthel: 'バーサリ: 記録値 AB30',
  gaf: '63点 (確定日) 2017/04/04 ─ 一言広島 63',
  gafDate: '2017/04/04',
  planDate: '2018年10月 6日 (水)',
};

export const medicalRecords: MedicalRecord[] = [
  {
    id: 'r1',
    date: '2017/06/27',
    dayOfWeek: '火',
    category: '医師記録',
    author: '医師 太郎',
    authorRole: '大原',
    content: '',
    tags: [],
    timestamp: '2017/06/27',
    likes: 0,
    comments: 0,
  },
  {
    id: 'r2',
    date: '2017/06/23',
    dayOfWeek: '金',
    category: '看護記録',
    author: '看護 花子',
    authorRole: '大原',
    content: 'クリニカルパス 作業療法士全30回',
    tags: ['看護記録', 'クリニカルパス'],
    orderNumber: undefined,
    timestamp: '2017/06/23',
    likes: 0,
    comments: 0,
  },
  {
    id: 'r3',
    date: '2017/06/21',
    dayOfWeek: '水',
    category: '看護記録',
    author: '看護 花子',
    authorRole: '',
    content: '作業療法なし',
    tags: ['看護記録'],
    orderNumber: 'NO.827',
    timestamp: '2017/06/21',
    likes: 0,
    comments: 0,
  },
  {
    id: 'r4',
    date: '2017/06/20',
    dayOfWeek: '火',
    category: '医師記録',
    author: '医師 太郎',
    authorRole: '',
    content: '09時 00 分 ～ 11時 00分',
    tags: [],
    orderNumber: 'NO.827',
    timestamp: '2017/06/20',
    likes: 0,
    comments: 0,
  },
  {
    id: 'r5',
    date: '2017/06/19',
    dayOfWeek: '月',
    category: '看護記録',
    author: '看護 花子',
    authorRole: '',
    content: '行動範囲 / 備考',
    tags: ['行動範囲'],
    timestamp: '2017/06/19',
    likes: 0,
    comments: 0,
  },
  {
    id: 'r6',
    date: '2017/06/11',
    dayOfWeek: '日',
    category: '医師記録',
    author: '医師 太郎',
    authorRole: '医師D',
    content: '医師D/医師 太郎',
    tags: [],
    timestamp: '2017/06/27 17:14:25',
    likes: 0,
    comments: 0,
  },
  {
    id: 'r7',
    date: '2017/06/06',
    dayOfWeek: '火',
    category: '看護記録',
    author: '看護 花子',
    authorRole: '',
    content: '正看護師: 看護 花子\n更新 正看護師: 看護 花子 2017/06/27 17:14:25',
    tags: [],
    timestamp: '2017/06/06',
    likes: 0,
    comments: 0,
  },
  {
    id: 'r8',
    date: '2017/06/06',
    dayOfWeek: '火',
    category: '看護サマリ',
    author: '看護 花子',
    authorRole: '',
    content: '退院後の生活状況を確認。\n13時 00 分 ～ 13時 30分',
    tags: ['退院支援', '看護師カンファ'],
    orderNumber: 'NO827',
    timestamp: '2017/06/06',
    likes: 0,
    comments: 0,
  },
  {
    id: 'r9',
    date: '2017/05/31',
    dayOfWeek: '水',
    category: '入退院記録',
    author: '看護 花子',
    authorRole: '',
    content: '【値段(税料)】\n2017/05/31(木)\n薬名/処置種別書',
    tags: [],
    orderNumber: 'NO641',
    timestamp: '2017/05/31',
    likes: 0,
    comments: 0,
  },
  {
    id: 'r10',
    date: '2017/05/21',
    dayOfWeek: '水',
    category: '医師記録',
    author: '医師 太郎',
    authorRole: '医師D',
    content:
      '【精神科】\n退院環境調整の指示\n [居場所]当院病棟\n [現在室]102\n [身長]167.8cm\n [体重]100.0kg\n [現在状態]全身倦怠感',
    tags: [],
    orderNumber: 'NO.837',
    timestamp: '2017/05/21 17:23:25',
    likes: 0,
    comments: 0,
  },
];

export const karteTabs: KarteTab[] = [
  { id: 'karte', label: 'カルテ', active: true },
  { id: 'medical-record', label: '医療記録' },
  { id: 'nursing-record', label: '看護記録' },
  { id: 'flowsheet', label: 'フローシート' },
  { id: 'nursing-info', label: '看護情報' },
  { id: 'patient-schedule', label: '患者スケジュール' },
];

export const subTabs = [
  '診断名',
  '基本情報',
  'GAF',
  '院外/状・診断書類',
  'ファミリ',
  'クリニカルパス',
  '指示/入室',
];

export const recordFilterTabs = [
  '全体カンファレンス',
  'NSTカンファレンス',
  '褥瘡カンファレンス',
  '臨床記録',
  '行動範囲',
  '外出/外泊',
  '日勤帯記録',
];

export const actionButtons = [
  'オーダ送信',
  '事後入力',
  'Rオーダ',
  '文字オーダ',
  '看護ケア',
  '医療先制',
  '患者予約',
  '記事作成',
];

// ===== ステータス設定 =====
export const STATUS_CONFIG: Record<PatientStatus, StatusConfig> = {
  stable:      { label: '安定',   color: '#22c55e', bgColor: '#f0fdf4', muiColor: 'success' },
  observation: { label: '観察中', color: '#f59e0b', bgColor: '#fffbeb', muiColor: 'warning' },
  isolation:   { label: '隔離',   color: '#b91c1c', bgColor: '#fef2f2', muiColor: 'error' },
  restraint:   { label: '拘束',   color: '#b91c1c', bgColor: '#fef2f2', muiColor: 'error' },
  outing:      { label: '外出中', color: '#6366f1', bgColor: '#eef2ff', muiColor: 'info' },
  empty:       { label: '空床',   color: '#94a3b8', bgColor: '#f8fafc', muiColor: 'default' },
};

// ===== ベッド運用フラグ（病棟マップ凡例・アイコン用） =====
export const BED_FLAG_CONFIG: Record<BedFlag, BedFlagConfig> = {
  isolation:      { key: 'isolation',      label: '隔離',   short: '隔', color: '#b91c1c' },
  restraint:      { key: 'restraint',      label: '拘束',   short: '拘', color: '#7c2d12' },
  outing:         { key: 'outing',         label: '外出',   short: '外', color: '#6366f1' },
  overnight:      { key: 'overnight',      label: '外泊',   short: '泊', color: '#4338ca' },
  reportRequired: { key: 'reportRequired', label: '要報告', short: '報', color: '#d97706' },
  deposit:        { key: 'deposit',        label: '預り金', short: '金', color: '#0f766e' },
};

export const BED_FLAG_ORDER: BedFlag[] = [
  'isolation', 'restraint', 'outing', 'overnight', 'reportRequired', 'deposit',
];

// ===== 病室データ =====
export const ROOMS: Room[] = [
  // 第１病棟（101〜109号室、各4床）
  { roomNumber: '101', wardId: 'ward1', beds: [
    { bed: 'A', patientId: 'P001', patientName: '山田 太郎',     status: 'stable',       gender: 'M', age: 52 },
    { bed: 'B', patientId: 'P002', patientName: '佐藤 花子',     status: 'observation',  gender: 'F', age: 67 },
    { bed: 'C', patientId: 'P021', patientName: '後藤 幸子',     status: 'stable',       gender: 'F', age: 46 },
    { bed: 'D', patientId: 'P022', patientName: '小川 浩',       status: 'stable',       gender: 'M', age: 39 },
  ]},
  { roomNumber: '102', wardId: 'ward1', beds: [
    { bed: 'A', patientId: 'P003', patientName: '鈴木 一郎',     status: 'isolation',    gender: 'M', age: 41, flags: ['isolation', 'reportRequired'] },
    { bed: 'B', patientId: 'P023', patientName: '中山 誠一',     status: 'stable',       gender: 'M', age: 62 },
    { bed: 'C', patientId: 'P024', patientName: '宮田 典子',     status: 'stable',       gender: 'F', age: 34, flags: ['deposit'] },
    { bed: 'D', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null, disabled: true },
  ]},
  { roomNumber: '103', wardId: 'ward1', beds: [
    { bed: 'A', patientId: 'P004', patientName: '高橋 美咲',     status: 'restraint',    gender: 'F', age: 35, flags: ['restraint', 'reportRequired'] },
    { bed: 'B', patientId: 'P005', patientName: '田中 健太',     status: 'stable',       gender: 'M', age: 29 },
    { bed: 'C', patientId: 'P025', patientName: '石川 裕二',     status: 'stable',       gender: 'M', age: 28 },
    { bed: 'D', patientId: 'P026', patientName: '原 由美子',     status: 'stable',       gender: 'F', age: 53 },
  ]},
  { roomNumber: '104', wardId: 'ward1', beds: [
    { bed: 'A', patientId: 'P006', patientName: '伊藤 幸子',     status: 'outing',       gender: 'F', age: 58, flags: ['outing', 'deposit'] },
    { bed: 'B', patientId: 'P007', patientName: '渡辺 大輔',     status: 'stable',       gender: 'M', age: 44, flags: ['overnight'], hasScheduledMove: true },
    { bed: 'C', patientId: 'P027', patientName: '内田 道子',     status: 'stable',       gender: 'F', age: 55 },
    { bed: 'D', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '105', wardId: 'ward1', beds: [
    { bed: 'A', patientId: 'P008', patientName: '中村 裕子',     status: 'observation',  gender: 'F', age: 73 },
    { bed: 'B', patientId: 'P028', patientName: '西川 雅之',     status: 'stable',       gender: 'M', age: 51 },
    { bed: 'C', patientId: 'P029', patientName: '坂本 千恵子',   status: 'stable',       gender: 'F', age: 43 },
    { bed: 'D', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '106', wardId: 'ward1', beds: [
    { bed: 'A', patientId: 'P009', patientName: '小林 誠',       status: 'stable',       gender: 'M', age: 38 },
    { bed: 'B', patientId: 'P010', patientName: '加藤 良子',     status: 'stable',       gender: 'F', age: 61 },
    { bed: 'C', patientId: 'P030', patientName: '安田 正人',     status: 'stable',       gender: 'M', age: 57 },
    { bed: 'D', patientId: 'P031', patientName: '谷口 沙織',     status: 'stable',       gender: 'F', age: 29 },
  ]},
  { roomNumber: '107', wardId: 'ward1', beds: [
    { bed: 'A', patientId: 'P019', patientName: '新井 太一',     status: 'stable',       gender: 'M', age: 22 },
    { bed: 'B', patientId: 'P032', patientName: '矢野 健一',     status: 'restraint',    gender: 'M', age: 36 },
    { bed: 'C', patientId: 'P033', patientName: '川崎 麻美',     status: 'stable',       gender: 'F', age: 27 },
    { bed: 'D', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '108', wardId: 'ward1', beds: [
    { bed: 'A', patientId: 'P034', patientName: '福本 美恵子',   status: 'stable',       gender: 'F', age: 69 },
    { bed: 'B', patientId: 'P035', patientName: '西田 智也',     status: 'stable',       gender: 'M', age: 25 },
    { bed: 'C', patientId: 'P036', patientName: '高瀬 久美子',   status: 'stable',       gender: 'F', age: 54 },
    { bed: 'D', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '109', wardId: 'ward1', beds: [
    { bed: 'A', patientId: 'P037', patientName: '杉本 健二',     status: 'stable',       gender: 'M', age: 33 },
    { bed: 'B', patientId: 'P038', patientName: '徳田 美代子',   status: 'stable',       gender: 'F', age: 60 },
    { bed: 'C', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'D', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  // 第２病棟（201〜204号室 各8床、205〜208号室 各6床）
  { roomNumber: '201', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P011', patientName: '吉田 浩二',     status: 'stable',       gender: 'M', age: 47 },
    { bed: 'B', patientId: 'P012', patientName: '山口 真理',     status: 'observation',  gender: 'F', age: 55 },
    { bed: 'C', patientId: 'P052', patientName: '中田 博之',     status: 'stable',       gender: 'M', age: 31 },
    { bed: 'D', patientId: 'P053', patientName: '福田 美智子',   status: 'stable',       gender: 'F', age: 59 },
    { bed: 'E', patientId: 'P054', patientName: '小野 剛',       status: 'stable',       gender: 'M', age: 45 },
    { bed: 'F', patientId: 'P055', patientName: '高田 幸恵',     status: 'stable',       gender: 'F', age: 38 },
    { bed: 'G', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'H', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '202', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P013', patientName: '松本 拓也',     status: 'restraint',    gender: 'M', age: 33, flags: ['restraint'] },
    { bed: 'B', patientId: 'P040', patientName: '島本 弥生',     status: 'stable',       gender: 'F', age: 46 },
    { bed: 'C', patientId: 'P056', patientName: '山崎 悟',       status: 'stable',       gender: 'M', age: 53 },
    { bed: 'D', patientId: 'P057', patientName: '中井 由紀',     status: 'stable',       gender: 'F', age: 41 },
    { bed: 'E', patientId: 'P058', patientName: '藤原 昌也',     status: 'observation',  gender: 'M', age: 27 },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'G', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'H', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '203', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P014', patientName: '井上 さくら',   status: 'stable',       gender: 'F', age: 28 },
    { bed: 'B', patientId: 'P015', patientName: '木村 正樹',     status: 'outing',       gender: 'M', age: 50, flags: ['overnight'] },
    { bed: 'C', patientId: 'P059', patientName: '橋本 みどり',   status: 'stable',       gender: 'F', age: 35 },
    { bed: 'D', patientId: 'P060', patientName: '上田 隆',       status: 'stable',       gender: 'M', age: 62 },
    { bed: 'E', patientId: 'P061', patientName: '金子 玲奈',     status: 'stable',       gender: 'F', age: 25 },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'G', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'H', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '204', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P016', patientName: '林 美穂',       status: 'stable',       gender: 'F', age: 42 },
    { bed: 'B', patientId: 'P017', patientName: '清水 翔太',     status: 'isolation',    gender: 'M', age: 36, flags: ['isolation', 'restraint'] },
    { bed: 'C', patientId: 'P062', patientName: '加藤 大介',     status: 'stable',       gender: 'M', age: 48 },
    { bed: 'D', patientId: 'P063', patientName: '渡部 千佳',     status: 'stable',       gender: 'F', age: 32 },
    { bed: 'E', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'G', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'H', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '205', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P018', patientName: '斎藤 恵',       status: 'stable',       gender: 'F', age: 64 },
    { bed: 'B', patientId: 'P020', patientName: '藤田 明日香',   status: 'stable',       gender: 'F', age: 28 },
    { bed: 'C', patientId: 'P064', patientName: '三浦 宏樹',     status: 'stable',       gender: 'M', age: 56 },
    { bed: 'D', patientId: 'P065', patientName: '豊田 里美',     status: 'stable',       gender: 'F', age: 44 },
    { bed: 'E', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '206', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P045', patientName: '岡崎 悠人',     status: 'stable',       gender: 'M', age: 26 },
    { bed: 'B', patientId: 'P047', patientName: '大村 徹',       status: 'stable',       gender: 'M', age: 40 },
    { bed: 'C', patientId: 'P066', patientName: '清野 明',       status: 'stable',       gender: 'M', age: 30 },
    { bed: 'D', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'E', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '207', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P050', patientName: '長田 直樹',     status: 'isolation',    gender: 'M', age: 37, flags: ['isolation'] },
    { bed: 'B', patientId: 'P067', patientName: '浜田 由美子',   status: 'stable',       gender: 'F', age: 49 },
    { bed: 'C', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'D', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'E', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null, disabled: true },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null, disabled: true },
  ]},
  { roomNumber: '208', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P051', patientName: '石井 礼子',     status: 'stable',       gender: 'F', age: 61 },
    { bed: 'B', patientId: 'P068', patientName: '武田 誠治',     status: 'stable',       gender: 'M', age: 58 },
    { bed: 'C', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'D', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'E', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
];

// ===== 未割当患者（病棟・病室・ベッドのいずれかが「仮」） =====
export const UNASSIGNED_PATIENTS: UnassignedPatient[] = [
  {
    id: 'U001',
    name: '河野 信一',
    age: 56,
    gender: 'M',
    designatedWardId: 'ward1',
    designatedRoomNumber: 'tentative',
    designatedBedLabel: 'tentative',
    scheduledAdmitAt: '2026-05-03 10:00',
    doctorName: '田村 医師',
    notes: '病棟のみ確定（病室・ベッド未定）',
  },
  {
    id: 'U002',
    name: '柴田 美香',
    age: 33,
    gender: 'F',
    designatedWardId: 'ward1',
    designatedRoomNumber: '105',
    designatedBedLabel: 'tentative',
    scheduledAdmitAt: '2026-05-04 13:30',
    doctorName: '岸本 医師',
    notes: '病室確定、ベッド未定',
  },
  {
    id: 'U003',
    name: '岩崎 拓海',
    age: 28,
    gender: 'M',
    designatedWardId: 'tentative',
    designatedRoomNumber: 'tentative',
    designatedBedLabel: 'tentative',
    scheduledAdmitAt: '2026-05-05 09:00',
    doctorName: '森田 医師',
    notes: '病棟未定',
  },
];

// ===== 患者マスタ =====
export const PATIENTS: Patient[] = [
  // 第１病棟
  { id: 'P001', name: '山田 太郎',     age: 52, gender: 'M', wardId: 'ward1', roomNumber: '101', bedLabel: 'A', status: 'stable',      admitDate: '2026-01-10', doctorName: '田村 医師', diagnosis: '統合失調症', primaryRecordType: 'nursing-record' },
  { id: 'P002', name: '佐藤 花子',     age: 67, gender: 'F', wardId: 'ward1', roomNumber: '101', bedLabel: 'B', status: 'observation',  admitDate: '2026-01-15', doctorName: '岸本 医師', diagnosis: 'うつ病' },
  { id: 'P021', name: '後藤 幸子',     age: 46, gender: 'F', wardId: 'ward1', roomNumber: '101', bedLabel: 'C', status: 'stable',       admitDate: '2026-01-18', doctorName: '岸本 医師', diagnosis: 'うつ病' },
  { id: 'P022', name: '小川 浩',       age: 39, gender: 'M', wardId: 'ward1', roomNumber: '101', bedLabel: 'D', status: 'stable',       admitDate: '2026-02-05', doctorName: '田村 医師', diagnosis: '適応障害' },
  { id: 'P003', name: '鈴木 一郎',     age: 41, gender: 'M', wardId: 'ward1', roomNumber: '102', bedLabel: 'A', status: 'isolation',    admitDate: '2026-02-01', doctorName: '森田 医師', diagnosis: '双極性障害' },
  { id: 'P023', name: '中山 誠一',     age: 62, gender: 'M', wardId: 'ward1', roomNumber: '102', bedLabel: 'B', status: 'stable',       admitDate: '2025-12-10', doctorName: '森田 医師', diagnosis: '統合失調症' },
  { id: 'P024', name: '宮田 典子',     age: 34, gender: 'F', wardId: 'ward1', roomNumber: '102', bedLabel: 'C', status: 'stable',       admitDate: '2026-01-30', doctorName: '岸本 医師', diagnosis: '双極性障害' },
  { id: 'P004', name: '高橋 美咲',     age: 35, gender: 'F', wardId: 'ward1', roomNumber: '103', bedLabel: 'A', status: 'restraint',    admitDate: '2026-02-05', doctorName: '田村 医師', diagnosis: '統合失調症' },
  { id: 'P005', name: '田中 健太',     age: 29, gender: 'M', wardId: 'ward1', roomNumber: '103', bedLabel: 'B', status: 'stable',       admitDate: '2026-01-20', doctorName: '岸本 医師', diagnosis: '適応障害' },
  { id: 'P025', name: '石川 裕二',     age: 28, gender: 'M', wardId: 'ward1', roomNumber: '103', bedLabel: 'C', status: 'stable',       admitDate: '2026-02-20', doctorName: '田村 医師', diagnosis: '適応障害' },
  { id: 'P026', name: '原 由美子',     age: 53, gender: 'F', wardId: 'ward1', roomNumber: '103', bedLabel: 'D', status: 'stable',       admitDate: '2026-01-12', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P006', name: '伊藤 幸子',     age: 58, gender: 'F', wardId: 'ward1', roomNumber: '104', bedLabel: 'A', status: 'outing',       admitDate: '2026-01-08', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P007', name: '渡辺 大輔',     age: 44, gender: 'M', wardId: 'ward1', roomNumber: '104', bedLabel: 'B', status: 'stable',       admitDate: '2026-02-10', doctorName: '田村 医師', diagnosis: 'アルコール依存症' },
  { id: 'P027', name: '内田 道子',     age: 55, gender: 'F', wardId: 'ward1', roomNumber: '104', bedLabel: 'C', status: 'stable',       admitDate: '2025-12-22', doctorName: '岸本 医師', diagnosis: '認知症' },
  { id: 'P008', name: '中村 裕子',     age: 73, gender: 'F', wardId: 'ward1', roomNumber: '105', bedLabel: 'A', status: 'observation',  admitDate: '2026-01-25', doctorName: '岸本 医師', diagnosis: '認知症' },
  { id: 'P028', name: '西川 雅之',     age: 51, gender: 'M', wardId: 'ward1', roomNumber: '105', bedLabel: 'B', status: 'stable',       admitDate: '2026-01-08', doctorName: '田村 医師', diagnosis: '統合失調症' },
  { id: 'P029', name: '坂本 千恵子',   age: 43, gender: 'F', wardId: 'ward1', roomNumber: '105', bedLabel: 'C', status: 'stable',       admitDate: '2026-02-03', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P009', name: '小林 誠',       age: 38, gender: 'M', wardId: 'ward1', roomNumber: '106', bedLabel: 'A', status: 'stable',       admitDate: '2026-02-12', doctorName: '森田 医師', diagnosis: '不安障害' },
  { id: 'P010', name: '加藤 良子',     age: 61, gender: 'F', wardId: 'ward1', roomNumber: '106', bedLabel: 'B', status: 'stable',       admitDate: '2026-01-30', doctorName: '田村 医師', diagnosis: 'うつ病' },
  { id: 'P030', name: '安田 正人',     age: 57, gender: 'M', wardId: 'ward1', roomNumber: '106', bedLabel: 'C', status: 'stable',       admitDate: '2026-01-19', doctorName: '岸本 医師', diagnosis: 'アルコール依存症' },
  { id: 'P031', name: '谷口 沙織',     age: 29, gender: 'F', wardId: 'ward1', roomNumber: '106', bedLabel: 'D', status: 'stable',       admitDate: '2026-02-11', doctorName: '田村 医師', diagnosis: '摂食障害' },
  { id: 'P019', name: '新井 太一',     age: 22, gender: 'M', wardId: 'ward1', roomNumber: '107', bedLabel: 'A', status: 'stable',       admitDate: '2026-02-24', doctorName: '田村 医師', diagnosis: '適応障害' },
  { id: 'P032', name: '矢野 健一',     age: 36, gender: 'M', wardId: 'ward1', roomNumber: '107', bedLabel: 'B', status: 'restraint',    admitDate: '2026-02-19', doctorName: '森田 医師', diagnosis: '双極性障害' },
  { id: 'P033', name: '川崎 麻美',     age: 27, gender: 'F', wardId: 'ward1', roomNumber: '107', bedLabel: 'C', status: 'stable',       admitDate: '2026-02-16', doctorName: '岸本 医師', diagnosis: '適応障害' },
  { id: 'P034', name: '福本 美恵子',   age: 69, gender: 'F', wardId: 'ward1', roomNumber: '108', bedLabel: 'A', status: 'stable',       admitDate: '2025-12-05', doctorName: '田村 医師', diagnosis: '認知症' },
  { id: 'P035', name: '西田 智也',     age: 25, gender: 'M', wardId: 'ward1', roomNumber: '108', bedLabel: 'B', status: 'stable',       admitDate: '2026-02-22', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P036', name: '高瀬 久美子',   age: 54, gender: 'F', wardId: 'ward1', roomNumber: '108', bedLabel: 'C', status: 'stable',       admitDate: '2026-01-25', doctorName: '岸本 医師', diagnosis: '統合失調症' },
  { id: 'P037', name: '杉本 健二',     age: 33, gender: 'M', wardId: 'ward1', roomNumber: '109', bedLabel: 'A', status: 'stable',       admitDate: '2026-02-14', doctorName: '田村 医師', diagnosis: '不安障害' },
  { id: 'P038', name: '徳田 美代子',   age: 60, gender: 'F', wardId: 'ward1', roomNumber: '109', bedLabel: 'B', status: 'stable',       admitDate: '2026-01-06', doctorName: '森田 医師', diagnosis: 'うつ病' },
  // 第２病棟（201〜204: 各8床、205〜208: 各6床）
  { id: 'P011', name: '吉田 浩二',     age: 47, gender: 'M', wardId: 'ward2', roomNumber: '201', bedLabel: 'A', status: 'stable',       admitDate: '2026-02-03', doctorName: '岸本 医師', diagnosis: '統合失調症' },
  { id: 'P012', name: '山口 真理',     age: 55, gender: 'F', wardId: 'ward2', roomNumber: '201', bedLabel: 'B', status: 'observation',  admitDate: '2026-01-18', doctorName: '森田 医師', diagnosis: '双極性障害' },
  { id: 'P013', name: '松本 拓也',     age: 33, gender: 'M', wardId: 'ward2', roomNumber: '202', bedLabel: 'A', status: 'restraint',    admitDate: '2026-02-08', doctorName: '田村 医師', diagnosis: '統合失調症' },
  { id: 'P040', name: '島本 弥生',     age: 46, gender: 'F', wardId: 'ward2', roomNumber: '202', bedLabel: 'B', status: 'stable',       admitDate: '2026-01-09', doctorName: '田村 医師', diagnosis: '不安障害' },
  { id: 'P014', name: '井上 さくら',   age: 28, gender: 'F', wardId: 'ward2', roomNumber: '203', bedLabel: 'A', status: 'stable',       admitDate: '2026-02-14', doctorName: '岸本 医師', diagnosis: '摂食障害' },
  { id: 'P015', name: '木村 正樹',     age: 50, gender: 'M', wardId: 'ward2', roomNumber: '203', bedLabel: 'B', status: 'outing',       admitDate: '2026-01-12', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P016', name: '林 美穂',       age: 42, gender: 'F', wardId: 'ward2', roomNumber: '204', bedLabel: 'A', status: 'stable',       admitDate: '2026-02-06', doctorName: '田村 医師', diagnosis: '不安障害' },
  { id: 'P017', name: '清水 翔太',     age: 36, gender: 'M', wardId: 'ward2', roomNumber: '204', bedLabel: 'B', status: 'isolation',    admitDate: '2026-02-11', doctorName: '岸本 医師', diagnosis: '双極性障害' },
  { id: 'P018', name: '斎藤 恵',       age: 64, gender: 'F', wardId: 'ward2', roomNumber: '205', bedLabel: 'A', status: 'stable',       admitDate: '2026-01-22', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P020', name: '藤田 明日香',   age: 28, gender: 'F', wardId: 'ward2', roomNumber: '205', bedLabel: 'B', status: 'stable',       admitDate: '2026-02-23', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P045', name: '岡崎 悠人',     age: 26, gender: 'M', wardId: 'ward2', roomNumber: '206', bedLabel: 'A', status: 'stable',       admitDate: '2026-02-21', doctorName: '岸本 医師', diagnosis: '適応障害' },
  { id: 'P047', name: '大村 徹',       age: 40, gender: 'M', wardId: 'ward2', roomNumber: '206', bedLabel: 'B', status: 'stable',       admitDate: '2026-01-13', doctorName: '森田 医師', diagnosis: 'アルコール依存症' },
  { id: 'P050', name: '長田 直樹',     age: 37, gender: 'M', wardId: 'ward2', roomNumber: '207', bedLabel: 'A', status: 'isolation',    admitDate: '2026-02-18', doctorName: '森田 医師', diagnosis: '双極性障害' },
  { id: 'P051', name: '石井 礼子',     age: 61, gender: 'F', wardId: 'ward2', roomNumber: '208', bedLabel: 'A', status: 'stable',       admitDate: '2026-01-04', doctorName: '岸本 医師', diagnosis: 'うつ病' },
  { id: 'P052', name: '中田 博之',     age: 31, gender: 'M', wardId: 'ward2', roomNumber: '201', bedLabel: 'C', status: 'stable',       admitDate: '2026-01-25', doctorName: '森田 医師', diagnosis: '統合失調症' },
  { id: 'P053', name: '福田 美智子',   age: 59, gender: 'F', wardId: 'ward2', roomNumber: '201', bedLabel: 'D', status: 'stable',       admitDate: '2026-02-01', doctorName: '岸本 医師', diagnosis: 'うつ病' },
  { id: 'P054', name: '小野 剛',       age: 45, gender: 'M', wardId: 'ward2', roomNumber: '201', bedLabel: 'E', status: 'stable',       admitDate: '2026-01-30', doctorName: '田村 医師', diagnosis: 'アルコール依存症' },
  { id: 'P055', name: '高田 幸恵',     age: 38, gender: 'F', wardId: 'ward2', roomNumber: '201', bedLabel: 'F', status: 'stable',       admitDate: '2026-02-15', doctorName: '森田 医師', diagnosis: '双極性障害' },
  { id: 'P056', name: '山崎 悟',       age: 53, gender: 'M', wardId: 'ward2', roomNumber: '202', bedLabel: 'C', status: 'stable',       admitDate: '2026-01-14', doctorName: '田村 医師', diagnosis: '統合失調症' },
  { id: 'P057', name: '中井 由紀',     age: 41, gender: 'F', wardId: 'ward2', roomNumber: '202', bedLabel: 'D', status: 'stable',       admitDate: '2026-02-08', doctorName: '岸本 医師', diagnosis: 'うつ病' },
  { id: 'P058', name: '藤原 昌也',     age: 27, gender: 'M', wardId: 'ward2', roomNumber: '202', bedLabel: 'E', status: 'observation',  admitDate: '2026-02-20', doctorName: '森田 医師', diagnosis: '双極性障害' },
  { id: 'P059', name: '橋本 みどり',   age: 35, gender: 'F', wardId: 'ward2', roomNumber: '203', bedLabel: 'C', status: 'stable',       admitDate: '2026-01-20', doctorName: '田村 医師', diagnosis: '不安障害' },
  { id: 'P060', name: '上田 隆',       age: 62, gender: 'M', wardId: 'ward2', roomNumber: '203', bedLabel: 'D', status: 'stable',       admitDate: '2025-12-15', doctorName: '岸本 医師', diagnosis: '認知症' },
  { id: 'P061', name: '金子 玲奈',     age: 25, gender: 'F', wardId: 'ward2', roomNumber: '203', bedLabel: 'E', status: 'stable',       admitDate: '2026-02-17', doctorName: '森田 医師', diagnosis: '摂食障害' },
  { id: 'P062', name: '加藤 大介',     age: 48, gender: 'M', wardId: 'ward2', roomNumber: '204', bedLabel: 'C', status: 'stable',       admitDate: '2026-01-28', doctorName: '田村 医師', diagnosis: '統合失調症' },
  { id: 'P063', name: '渡部 千佳',     age: 32, gender: 'F', wardId: 'ward2', roomNumber: '204', bedLabel: 'D', status: 'stable',       admitDate: '2026-02-13', doctorName: '岸本 医師', diagnosis: 'うつ病' },
  { id: 'P064', name: '三浦 宏樹',     age: 56, gender: 'M', wardId: 'ward2', roomNumber: '205', bedLabel: 'C', status: 'stable',       admitDate: '2026-01-06', doctorName: '森田 医師', diagnosis: '統合失調症' },
  { id: 'P065', name: '豊田 里美',     age: 44, gender: 'F', wardId: 'ward2', roomNumber: '205', bedLabel: 'D', status: 'stable',       admitDate: '2026-02-02', doctorName: '田村 医師', diagnosis: 'うつ病' },
  { id: 'P066', name: '清野 明',       age: 30, gender: 'M', wardId: 'ward2', roomNumber: '206', bedLabel: 'C', status: 'stable',       admitDate: '2026-02-10', doctorName: '岸本 医師', diagnosis: '適応障害' },
  { id: 'P067', name: '浜田 由美子',   age: 49, gender: 'F', wardId: 'ward2', roomNumber: '207', bedLabel: 'B', status: 'stable',       admitDate: '2026-01-17', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P068', name: '武田 誠治',     age: 58, gender: 'M', wardId: 'ward2', roomNumber: '208', bedLabel: 'B', status: 'stable',       admitDate: '2025-12-28', doctorName: '田村 医師', diagnosis: '統合失調症' },
];

// ===== オーダ =====
export const ORDERS: Order[] = [
  { id: 'ORD001', patientId: 'P001', patientName: '山田 太郎',   type: '処方',     content: 'リスパダール 2mg',              schedule: '朝・夕',          status: '実施中', startDate: '2026-02-20', days: 14, doctorName: '田村 医師' },
  { id: 'ORD002', patientId: 'P003', patientName: '鈴木 一郎',   type: '注射',     content: 'デカン酸フルフェナジン 25mg',   schedule: '隔週',            status: '指示済', startDate: '2026-02-24', days: 1,  doctorName: '森田 医師' },
  { id: 'ORD003', patientId: 'P004', patientName: '高橋 美咲',   type: '心理検査', content: 'WAIS-IV',                       schedule: '—',               status: '予定',   startDate: '2026-02-25', days: 1,  doctorName: '田村 医師' },
  { id: 'ORD004', patientId: 'P002', patientName: '佐藤 花子',   type: '処方',     content: 'デパケン 400mg',                schedule: '朝・昼・夕',      status: '実施中', startDate: '2026-02-18', days: 28, doctorName: '岸本 医師' },
  { id: 'ORD005', patientId: 'P005', patientName: '田中 健太',   type: 'ECT',      content: '修正型電気けいれん療法',        schedule: '—',               status: '予定',   startDate: '2026-02-26', days: 1,  doctorName: '岸本 医師' },
  { id: 'ORD006', patientId: 'P008', patientName: '中村 裕子',   type: '入院定時', content: 'バイタルサイン測定',            schedule: '6時・12時・18時', status: '実施中', startDate: '2026-02-01', days: 30, doctorName: '岸本 医師' },
  { id: 'ORD007', patientId: 'P011', patientName: '吉田 浩二',   type: '処方',     content: 'オランザピン 10mg',             schedule: '夕',              status: '実施中', startDate: '2026-02-15', days: 21, doctorName: '岸本 医師' },
  { id: 'ORD008', patientId: 'P013', patientName: '松本 拓也',   type: '処方',     content: 'ハロペリドール 5mg',            schedule: '朝・夕',          status: '実施中', startDate: '2026-02-10', days: 14, doctorName: '田村 医師' },
  { id: 'ORD009', patientId: 'P007', patientName: '渡辺 大輔',   type: 'IF',       content: '禁酒指導',                      schedule: '—',               status: '実施中', startDate: '2026-02-10', days: 0,  doctorName: '田村 医師' },
  { id: 'ORD010', patientId: 'P014', patientName: '井上 さくら', type: '文字',     content: '食事量の詳細記録を継続',        schedule: '毎食',            status: '実施中', startDate: '2026-02-14', days: 0,  doctorName: '岸本 医師' },
];

// ===== 看護記録 =====
export const NURSING_RECORDS: NursingRecord[] = [
  { id: 'NR001', patientId: 'P001', date: '2026-02-24', time: '09:00', author: '看護師 山本', content: '朝の検温実施。体温36.5℃、血圧128/82。食欲あり、朝食全量摂取。表情穏やか。服薬確認済み。' },
  { id: 'NR002', patientId: 'P001', date: '2026-02-24', time: '14:00', author: '看護師 中田', content: '午後の回診同行。主治医より薬剤変更の指示あり。患者に説明済み。理解良好。午後のレクリエーションに参加。' },
  { id: 'NR003', patientId: 'P001', date: '2026-02-23', time: '10:30', author: '看護師 山本', content: '面会あり（家族：妻）。面会後やや落ち着かない様子。見守り継続。30分後に落ち着きを取り戻す。' },
  { id: 'NR004', patientId: 'P001', date: '2026-02-23', time: '21:00', author: '看護師 佐々木', content: '夜間巡回。入眠確認。呼吸状態安定。体位変換不要。' },
  { id: 'NR005', patientId: 'P001', date: '2026-02-22', time: '08:00', author: '看護師 山本', content: '排便あり。水分摂取良好。リハビリ参加意欲あり。本日の作業療法に参加予定。' },
  { id: 'NR006', patientId: 'P003', date: '2026-02-24', time: '09:30', author: '看護師 中田', content: '隔離室巡回。落ち着いた様子。食事全量摂取。水分補給声掛け実施。排泄確認。' },
  { id: 'NR007', patientId: 'P004', date: '2026-02-24', time: '10:00', author: '看護師 佐々木', content: '身体拘束中。皮膚の状態確認。循環障害なし。体位変換実施。水分摂取介助。' },
];

// ===== バイタルサイン（サンプル） =====
export const generateVitalSigns = (patientId: string, days: number = 7): VitalSign[] => {
  const signs: VitalSign[] = [];
  const timeSlots = ['6時', '9時', '12時', '15時', '18時', '21時'];
  for (let d = 0; d < days; d++) {
    const date = new Date(2026, 1, 24 - (days - 1 - d));
    const dateStr = date.toISOString().split('T')[0];
    timeSlots.forEach((slot, si) => {
      signs.push({
        id: `VS-${patientId}-${d}-${si}`,
        patientId,
        date: dateStr,
        timeSlot: slot,
        bpSystolic: 110 + ((d * 7 + si * 3) % 30),
        bpDiastolic: 65 + ((d * 5 + si * 2) % 20),
        pulse: 60 + ((d * 3 + si * 4) % 25),
        temperature: parseFloat((36 + ((d * 4 + si) % 8) * 0.15).toFixed(1)),
        respiration: 14 + ((d * 2 + si) % 6),
        spo2: 95 + ((d + si) % 5),
        weight: parseFloat((55 + ((d * 3 + 2) % 6) * 0.4).toFixed(1)),
      });
    });
  }
  return signs;
};

// ===== フローシートデータ =====
export const generateFlowsheetDaily = (patientId: string, days: number = 7): FlowsheetDaily[] => {
  const meals = ['全量', '8割', '5割', '3割'];
  return Array.from({ length: days }, (_, d) => {
    const date = new Date(2026, 1, 24 - (days - 1 - d));
    return {
      date: date.toISOString().split('T')[0],
      patientId,
      mealBreakfast: meals[(d * 3 + 1) % 4],
      mealLunch: meals[(d * 2 + 3) % 3],
      mealDinner: meals[(d * 5 + 2) % 4],
      medMorning: (d * 3 % 10) > 1,
      medNoon: (d * 5 % 10) > 2,
      medEvening: (d * 7 % 10) > 1,
      medNight: (d * 2 % 10) > 2,
      bath: d % 2 === 0,
      sheetChange: d === 0 || d === 3,
    };
  });
};

// ===== 入退院関連 =====
export const ADMISSION_ORDERS: AdmissionOrder[] = [
  // 当月（2026-05）周辺：入院指示／退院指示が確定済・未確定で混在
  { id: 'ADM001', patientId: 'U001', patientName: '河野 信一',     type: '入院', status: '指示済',   scheduledDate: '2026-05-03', doctorName: '田村 医師', roomNumber: '—',   bedLabel: '—', wardId: 'ward1' },
  { id: 'ADM002', patientId: 'U002', patientName: '柴田 美香',     type: '入院', status: '指示済',   scheduledDate: '2026-05-04', doctorName: '岸本 医師', roomNumber: '105', bedLabel: '—', wardId: 'ward1' },
  { id: 'ADM003', patientId: 'P019', patientName: '新井 太一',     type: '入院', status: '手続完了', scheduledDate: '2026-05-02', doctorName: '田村 医師', roomNumber: '107', bedLabel: 'A', wardId: 'ward1' },
  { id: 'ADM004', patientId: 'P020', patientName: '藤田 明日香',   type: '入院', status: '手続完了', scheduledDate: '2026-05-01', doctorName: '森田 医師', roomNumber: '205', bedLabel: 'B', wardId: 'ward2' },
  { id: 'ADM005', patientId: 'P003', patientName: '鈴木 一郎',     type: '退院', status: '指示済',   scheduledDate: '2026-05-08', doctorName: '岸本 医師', roomNumber: '102', bedLabel: 'A', wardId: 'ward1' },
  { id: 'ADM006', patientId: 'P006', patientName: '伊藤 幸子',     type: '退院', status: '指示済',   scheduledDate: '2026-05-12', doctorName: '森田 医師', roomNumber: '104', bedLabel: 'A', wardId: 'ward1' },
  { id: 'ADM007', patientId: 'P007', patientName: '渡辺 大輔',     type: '退院', status: '手続完了', scheduledDate: '2026-05-02', doctorName: '田村 医師', roomNumber: '104', bedLabel: 'B', wardId: 'ward1' },
  { id: 'ADM008', patientId: 'U003', patientName: '岩崎 拓海',     type: '入院', status: '指示済',   scheduledDate: '',           doctorName: '森田 医師', roomNumber: '—',   bedLabel: '—', wardId: 'ward1' },
  { id: 'ADM009', patientId: 'P017', patientName: '清水 翔太',     type: '退院', status: '指示済',   scheduledDate: '',           doctorName: '岸本 医師', roomNumber: '204', bedLabel: 'B', wardId: 'ward2' },
  { id: 'ADM010', patientId: 'P013', patientName: '松本 拓也',     type: '退院', status: '指示済',   scheduledDate: '2026-05-20', doctorName: '森田 医師', roomNumber: '202', bedLabel: 'A', wardId: 'ward2' },
];

// ===========================================================================
// MASTER セクション
// ---------------------------------------------------------------------------
// 参考システムの各種マスタ（医療機関情報マスタ・期限管理マスタ・帳票定義情報
// マスタ等）に相当する固定値を集約。本来は別エピック（マスタメンテナンス）で
// 保守する想定の値だが、モックではここに集約して各ダイアログから参照する。
//
// 参照箇所がトレースしやすいよう、 `MASTER_` prefix で命名する。
// 既存の関連定義（医療機関一覧・紹介経路・入院形態など）は本セクション末尾の
// 「入退院指示用マスタ（ep-03）」配下にあるが、命名統一のためそちらも
// MASTER_ prefix を持つエクスポートを追加で公開する。
// ===========================================================================

/** 食事時間帯（マスタ：医療機関情報の食事時間設定の代替） */
export const MASTER_MEAL_TIMES = [
  { key: '0800', label: '朝食 (08:00)', hh: 8,  mm: 0 },
  { key: '1200', label: '昼食 (12:00)', hh: 12, mm: 0 },
  { key: '1800', label: '夕食 (18:00)', hh: 18, mm: 0 },
] as const;

/** 食事を伴う退院日かどうかの判定境界（マスタ：食事時間設定の代替）。
 *  この境界 [openHHMM, closeHHMM] 内の退院時刻は食事を伴う扱いとする。 */
export const MASTER_MEAL_WINDOW = { openHHMM: '08:00', closeHHMM: '18:00' } as const;

/** 食事締め時間（マスタ：医療機関情報／食事配膳の代替）。これを過ぎた変更は確認ダイアログを挟む。 */
export const MASTER_MEAL_CUTOFF_HHMM = '17:00' as const;

/** 入院定時オーダの中止日設定（マスタ：医療機関情報／処方の中止日設定の代替） */
export type StopDayPolicy = '当日以降' | '翌日以降';
export const MASTER_STOP_DAY_POLICY_OPTIONS: StopDayPolicy[] = ['当日以降', '翌日以降'];
/** 既定値（モック切替対象） */
export const MASTER_STOP_DAY_POLICY_DEFAULT: StopDayPolicy = '翌日以降';

/** 入院決定理由のテンプレ文例（マスタ：文例マスタの代替） */
export const MASTER_ADMIT_REASON_TEMPLATES = [
  '症状増悪のため入院加療が必要',
  '本人の同意のもと任意入院',
  '家族同意のもと医療保護入院',
  '措置入院対象として入院',
] as const;

/** 退院決定理由のテンプレ文例 */
export const MASTER_DISCHARGE_REASON_TEMPLATES = [
  '症状改善により退院可',
  '転院のため退院',
  '本人都合による退院',
  '社会復帰準備のため退院',
] as const;

/** 紹介経路（入院）のラインナップ（医療観察法オプション利用時の追加分は別配列） */
// MASTER_REFERRAL_ROUTES_ADMIT_BASE / _OPTIONAL は下記既存定義（REFERRAL_ROUTES_ADMIT_*）の別名として export する。
// これにより新規ファイルからは MASTER_ prefix で統一参照できる。

// ===== 入退院指示用マスタ（ep-03） =====
export interface MedicalInstitution {
  id: string;
  name: string;
  type: '病院' | '診療所' | 'クリニック';
  address: string;
}

export const MEDICAL_INSTITUTIONS: MedicalInstitution[] = [
  { id: 'MI001', name: '〇〇医院',           type: '診療所',   address: '東京都新宿区西新宿1-1-1' },
  { id: 'MI002', name: '△△クリニック',     type: 'クリニック', address: '東京都渋谷区道玄坂2-2-2' },
  { id: 'MI003', name: '□□総合病院',       type: '病院',     address: '東京都世田谷区三軒茶屋3-3-3' },
  { id: 'MI004', name: '中央メンタルクリニック', type: 'クリニック', address: '東京都中央区銀座4-4-4' },
  { id: 'MI005', name: '〜〜こころのクリニック', type: 'クリニック', address: '東京都千代田区神田5-5-5' },
  { id: 'MI006', name: '東京こころ病院',     type: '病院',     address: '東京都北区赤羽6-6-6' },
  { id: 'MI007', name: '◎◎メディカルセンター', type: '病院',     address: '東京都杉並区荻窪7-7-7' },
];

export const REFERRAL_ROUTES_ADMIT_BASE = [
  '直接入院',
  '自院通院からの入院',
  '自院入院からの入院',
  '他院通院からの転入院',
  '他院入院からの転入院',
] as const;

export const REFERRAL_ROUTES_ADMIT_OPTIONAL = '医療観察入院処遇中の転院';

export const REFERRAL_ROUTES_DISCHARGE_BASE = [
  '退院後通院なし',
  '退院後自院通院',
  '退院後自院入院',
  '退院後他院通院',
  '退院後他院入院',
] as const;

export const REFERRAL_ROUTES_DISCHARGE_OPTIONAL = '医療観察入院処遇中の転院';

export type AdmitFormType = '任意入院' | '医療保護入院' | '措置入院' | '応急入院' | '緊急措置入院';
export const ADMIT_FORM_TYPES: AdmitFormType[] = ['任意入院', '医療保護入院', '措置入院', '応急入院', '緊急措置入院'];

export const ADMIT_DOCS_BY_FORM: Record<AdmitFormType, string[]> = {
  '任意入院':       ['入院申込書', '同意書（治療）', '同意書（個人情報）', '保険証コピー', '入院案内書'],
  '医療保護入院':   ['医療保護入院書類', '家族同意書', '入院告知書', '入院案内書'],
  '措置入院':       ['措置入院通知書', '入院告知書', '指定書写し', '入院案内書'],
  '応急入院':       ['応急入院書類', '入院告知書', '入院案内書'],
  '緊急措置入院':   ['緊急措置入院書類', '入院告知書', '指定書写し', '入院案内書'],
};

export type DischargeCategory = '不要' | '通院' | '転院';
export const DISCHARGE_DOCS_BY_CATEGORY: Record<DischargeCategory, string[]> = {
  '不要': ['退院サマリ'],
  '通院': ['退院サマリ', '紹介状（通院）', '通院精神指示書'],
  '転院': ['退院サマリ', '紹介状（転院）', '転院連絡票', '訪問看護指示書'],
};

export const DELETE_REASON_CATEGORIES = [
  '入力誤り',
  '医師判断による中止',
  '患者意向による中止',
  'システム障害',
  'その他',
] as const;

export const REHAB_OUTCOME_OPTIONS = [
  { value: '治癒',   label: '治癒',   selectable: true },
  { value: '転院',   label: '転院',   selectable: true },
  { value: '中止',   label: '中止',   selectable: true },
  { value: '中断',   label: '中断',   selectable: true },
  { value: '継続',   label: '継続（選択不可）', selectable: false },
] as const;

export interface TherapyHistoryEntry {
  patientId: string;
  /** 直近入院の退院紹介医療機関ID（紹介元複写元の優先順1） */
  lastDischargeReferralId?: string;
  /** 入院時の紹介元医療機関ID（複写元の優先順2） */
  admitReferralId?: string;
}

export const THERAPY_HISTORY_SAMPLES: TherapyHistoryEntry[] = [
  { patientId: 'P001', lastDischargeReferralId: 'MI004', admitReferralId: 'MI001' },
  { patientId: 'P003', lastDischargeReferralId: 'MI003', admitReferralId: 'MI002' },
  { patientId: 'P006', admitReferralId: 'MI005' },
  { patientId: 'U001', admitReferralId: 'MI001' },
  { patientId: 'U002', admitReferralId: 'MI004' },
];

// ===== MASTER 別名（命名統一のため、上記既存定義を MASTER_ prefix で再 export） =====
export const MASTER_MEDICAL_INSTITUTIONS = MEDICAL_INSTITUTIONS;
export const MASTER_REFERRAL_ROUTES_ADMIT_BASE = REFERRAL_ROUTES_ADMIT_BASE;
export const MASTER_REFERRAL_ROUTES_ADMIT_OPTIONAL = REFERRAL_ROUTES_ADMIT_OPTIONAL;
export const MASTER_REFERRAL_ROUTES_DISCHARGE_BASE = REFERRAL_ROUTES_DISCHARGE_BASE;
export const MASTER_REFERRAL_ROUTES_DISCHARGE_OPTIONAL = REFERRAL_ROUTES_DISCHARGE_OPTIONAL;
export const MASTER_ADMIT_FORM_TYPES = ADMIT_FORM_TYPES;
export const MASTER_ADMIT_DOCS_BY_FORM = ADMIT_DOCS_BY_FORM;
export const MASTER_DISCHARGE_DOCS_BY_CATEGORY = DISCHARGE_DOCS_BY_CATEGORY;
export const MASTER_DELETE_REASON_CATEGORIES = DELETE_REASON_CATEGORIES;
export const MASTER_REHAB_OUTCOME_OPTIONS = REHAB_OUTCOME_OPTIONS;

// ===== 確定処理時に表示する未実施オーダのサンプル =====
export interface PendingOrderSample {
  id: string;
  patientId: string;
  category: '外来専用' | '入院専用' | '移動' | '給食' | 'リハビリ';
  content: string;
  scheduledAt: string;
}

export const PENDING_ORDERS_SAMPLES: PendingOrderSample[] = [
  // 入院確定時に出る外来専用オーダ
  { id: 'PO001', patientId: 'U001', category: '外来専用', content: '外来採血（HbA1c, CBC）',           scheduledAt: '2026-05-03 09:00' },
  { id: 'PO002', patientId: 'U001', category: '外来専用', content: '外来心電図',                       scheduledAt: '2026-05-03 10:00' },
  { id: 'PO003', patientId: 'U002', category: '外来専用', content: '外来胸部 X-P',                     scheduledAt: '2026-05-04 11:00' },
  // 退院確定時に出る入院専用オーダ + 移動・給食 + リハビリ
  { id: 'PO101', patientId: 'P003', category: '入院専用', content: '夜間血糖チェック',                 scheduledAt: '2026-05-08 22:00' },
  { id: 'PO102', patientId: 'P003', category: '給食',     content: '5/8 朝食（軟菜食）',               scheduledAt: '2026-05-08 08:00' },
  { id: 'PO103', patientId: 'P003', category: '移動',     content: '外来診察室への移送',               scheduledAt: '2026-05-08 13:00' },
  { id: 'PO104', patientId: 'P006', category: 'リハビリ', content: '作業療法（5/12 14:00 個別 30分）', scheduledAt: '2026-05-12 14:00' },
  { id: 'PO105', patientId: 'P006', category: '給食',     content: '5/12 昼食',                        scheduledAt: '2026-05-12 12:00' },
];

export const TRANSFER_HISTORY: TransferHistory[] = [
  { id: 'TH001', patientId: 'P004', patientName: '高橋 美咲', date: '2026-02-20', fromRoom: '101-B', toRoom: '103-A', reason: '隔離指示' },
  { id: 'TH002', patientId: 'P007', patientName: '渡辺 大輔', date: '2026-02-18', fromRoom: '201-A', toRoom: '104-B', reason: '本人希望' },
  { id: 'TH003', patientId: 'P010', patientName: '加藤 良子', date: '2026-02-15', fromRoom: '103-B', toRoom: '106-B', reason: '退院準備' },
];

export const ADMISSION_HISTORY: AdmissionHistory[] = [
  { id: 'AH001', patientId: 'P001', patientName: '山田 太郎', admitDate: '2026-01-10', wardId: 'ward1', roomNumber: '101', doctorName: '田村 医師', status: '入院中' },
  { id: 'AH002', patientId: 'P001', patientName: '山田 太郎', admitDate: '2025-06-15', dischargeDate: '2025-08-20', wardId: 'ward1', roomNumber: '103', doctorName: '田村 医師', status: '退院済' },
  { id: 'AH003', patientId: 'P003', patientName: '鈴木 一郎', admitDate: '2026-02-01', wardId: 'ward1', roomNumber: '102', doctorName: '森田 医師', status: '入院中' },
];

// ===== 隔離拘束 =====
export const ISOLATION_ORDERS: IsolationOrder[] = [
  { id: 'ISO001', patientId: 'P003', patientName: '鈴木 一郎', type: '隔離', startDatetime: '2026-02-22 14:00', wardId: 'ward1', roomNumber: '102-A', doctorName: '岸本 医師' },
  { id: 'ISO002', patientId: 'P004', patientName: '高橋 美咲', type: '拘束', startDatetime: '2026-02-23 09:30', wardId: 'ward1', roomNumber: '103-A', doctorName: '田村 医師' },
  { id: 'ISO003', patientId: 'P013', patientName: '松本 拓也', type: '拘束', startDatetime: '2026-02-21 20:00', endDatetime: '2026-02-23 08:00', wardId: 'ward2', roomNumber: '202-A', doctorName: '森田 医師' },
  { id: 'ISO004', patientId: 'P017', patientName: '清水 翔太', type: '隔離', startDatetime: '2026-02-20 10:00', wardId: 'ward2', roomNumber: '204-B', doctorName: '岸本 医師' },
];

export const generateObservationRecords = (isolationOrderId: string, patientId: string): ObservationRecord[] => {
  const states: Array<import('../types').ObservationState> = ['落ち着き', '浅眠', '睡眠', '不穏', '中途覚醒', '未記入'];
  const records: ObservationRecord[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const idx = (h * 4 + m / 15);
      const state = idx < 80 ? states[(h + m / 15) % 5] : '未記入';
      records.push({
        id: `OBS-${isolationOrderId}-${time}`,
        isolationOrderId,
        patientId,
        date: '2026-02-24',
        time,
        state,
      });
    }
  }
  return records;
};

// ===== 行動範囲 =====
export const BEHAVIOR_RANGES: BehaviorRange[] = [
  { id: 'BR001', patientId: 'P001', patientName: '山田 太郎',   level: '院内',         startDate: '2026-02-15', doctorName: '田村 医師', wardId: 'ward1' },
  { id: 'BR002', patientId: 'P005', patientName: '田中 健太',   level: '院外許可あり', startDate: '2026-02-10', doctorName: '岸本 医師', wardId: 'ward1' },
  { id: 'BR003', patientId: 'P003', patientName: '鈴木 一郎',   level: '病棟内',       startDate: '2026-02-22', doctorName: '森田 医師', wardId: 'ward1' },
  { id: 'BR004', patientId: 'P011', patientName: '吉田 浩二',   level: '院内',         startDate: '2026-02-08', doctorName: '岸本 医師', wardId: 'ward2' },
  { id: 'BR005', patientId: 'P014', patientName: '井上 さくら', level: '院外許可あり', startDate: '2026-02-18', doctorName: '岸本 医師', wardId: 'ward2' },
];

// ===== 外出外泊 =====
export const OUTING_RECORDS: OutingRecord[] = [
  { id: 'OUT001', patientId: 'P006', patientName: '伊藤 幸子', type: '外泊', status: '許可',   startDatetime: '2026-02-23 10:00', endDatetime: '2026-02-25 17:00', wardId: 'ward1', method: 'application', approvedBy: '森田 医師' },
  { id: 'OUT002', patientId: 'P015', patientName: '木村 正樹', type: '外出', status: '許可',   startDatetime: '2026-02-24 09:00', endDatetime: '2026-02-24 17:00', wardId: 'ward2', method: 'direct', approvedBy: '森田 医師' },
  { id: 'OUT003', patientId: 'P005', patientName: '田中 健太', type: '外出', status: '申請中', startDatetime: '2026-02-26 10:00', endDatetime: '2026-02-26 15:00', wardId: 'ward1', method: 'application' },
  { id: 'OUT004', patientId: 'P009', patientName: '小林 誠',   type: '外出', status: '許可',   startDatetime: '2026-02-22 10:00', endDatetime: '2026-02-22 16:00', wardId: 'ward1', method: 'application', approvedBy: '森田 医師', returnedAt: '2026-02-22 15:30' },
];

// ===== 患者スケジュール =====
export const SCHEDULE_EVENTS: PatientScheduleEvent[] = [
  { id: 'SE001', patientId: 'P001', title: 'バイタル測定',     date: '2026-02-24', startTime: '06:00', endTime: '06:15', category: 'order' },
  { id: 'SE002', patientId: 'P001', title: '作業療法',         date: '2026-02-24', startTime: '10:00', endTime: '11:00', category: 'rehab' },
  { id: 'SE003', patientId: 'P001', title: '回診',             date: '2026-02-24', startTime: '14:00', endTime: '14:30', category: 'other' },
  { id: 'SE004', patientId: 'P004', title: '心理検査(WAIS-IV)', date: '2026-02-25', startTime: '10:00', endTime: '12:00', category: 'order' },
  { id: 'SE005', patientId: 'P005', title: 'ECT施行',          date: '2026-02-26', startTime: '09:00', endTime: '10:00', category: 'order' },
  { id: 'SE006', patientId: 'P001', title: 'レクリエーション', date: '2026-02-24', startTime: '15:00', endTime: '16:00', category: 'rehab' },
  { id: 'SE007', patientId: 'P001', title: '面会（家族）',     date: '2026-02-25', startTime: '14:00', endTime: '15:00', category: 'meeting' },
];

// ===== リハビリ =====
export const REHAB_ORDERS: RehabOrder[] = [
  { id: 'RH001', patientId: 'P001', patientName: '山田 太郎',   content: '作業療法（集団プログラム）', doctorName: '田村 医師', startDate: '2026-01-15', frequency: '週3回', status: '実施中' },
  { id: 'RH002', patientId: 'P005', patientName: '田中 健太',   content: '作業療法（個別プログラム）', doctorName: '岸本 医師', startDate: '2026-02-01', frequency: '週2回', status: '実施中' },
  { id: 'RH003', patientId: 'P011', patientName: '吉田 浩二',   content: 'SST（社会技能訓練）',       doctorName: '岸本 医師', startDate: '2026-02-10', frequency: '週1回', status: '実施中' },
  { id: 'RH004', patientId: 'P014', patientName: '井上 さくら', content: '作業療法（調理活動）',       doctorName: '岸本 医師', startDate: '2026-02-18', frequency: '週2回', status: '指示済' },
];

export const REHAB_DAILY_REPORTS: RehabDailyReport[] = [
  { id: 'RDR001', rehabOrderId: 'RH001', patientId: 'P001', date: '2026-02-24', attendance: true, content: '集団プログラムに参加。革細工に取り組む。集中力良好。他患者との交流あり。', therapist: 'OT 高田' },
  { id: 'RDR002', rehabOrderId: 'RH001', patientId: 'P001', date: '2026-02-21', attendance: true, content: '陶芸活動に参加。作品完成。達成感を口にする。', therapist: 'OT 高田' },
  { id: 'RDR003', rehabOrderId: 'RH002', patientId: 'P005', date: '2026-02-24', attendance: false, content: '体調不良のため欠席。', therapist: 'OT 高田', notes: '主治医に報告済み' },
];

export const REHAB_EVALUATIONS: RehabEvaluation[] = [
  { id: 'RE001', rehabOrderId: 'RH001', patientId: 'P001', date: '2026-02-15', evaluator: 'OT 高田', content: '作業遂行能力：改善傾向。集中持続時間が30分→45分に延長。対人交流にも積極性が出てきている。', type: '定期' },
  { id: 'RE002', rehabOrderId: 'RH002', patientId: 'P005', date: '2026-02-01', evaluator: 'OT 高田', content: '初回評価。意欲は高いが疲労感強い。短時間での活動から開始。', type: '開始時' },
];

// ===== 看護ケア予定 =====
export const NURSING_CARE_SCHEDULES: NursingCareSchedule[] = [
  { id: 'NC001', patientId: 'P001', patientName: '山田 太郎', careType: '入浴介助',       scheduledDate: '2026-02-24', wardId: 'ward1', completed: true },
  { id: 'NC002', patientId: 'P002', patientName: '佐藤 花子', careType: '口腔ケア',       scheduledDate: '2026-02-24', wardId: 'ward1', completed: false },
  { id: 'NC003', patientId: 'P008', patientName: '中村 裕子', careType: '入浴介助',       scheduledDate: '2026-02-24', wardId: 'ward1', completed: false },
  { id: 'NC004', patientId: 'P008', patientName: '中村 裕子', careType: 'シーツ交換',     scheduledDate: '2026-02-24', wardId: 'ward1', completed: true },
  { id: 'NC005', patientId: 'P011', patientName: '吉田 浩二', careType: 'リネン交換',     scheduledDate: '2026-02-24', wardId: 'ward2', completed: false },
  { id: 'NC006', patientId: 'P013', patientName: '松本 拓也', careType: '体位変換',       scheduledDate: '2026-02-24', wardId: 'ward2', completed: true },
  { id: 'NC007', patientId: 'P013', patientName: '松本 拓也', careType: '皮膚状態確認',   scheduledDate: '2026-02-24', wardId: 'ward2', completed: true },
  { id: 'NC008', patientId: 'P018', patientName: '斎藤 恵',   careType: '服薬管理',       scheduledDate: '2026-02-24', wardId: 'ward2', completed: false },
];

// ===== 書類 =====
export const DOCUMENTS: Document[] = [
  { id: 'DOC001', patientId: 'P003', patientName: '鈴木 一郎', title: '入院診療計画書',                 type: '入院時',   createdAt: '2026-02-01', createdBy: '森田 医師', status: '登録済' },
  { id: 'DOC002', patientId: 'P003', patientName: '鈴木 一郎', title: '隔離開始時書類',                 type: '隔離拘束', createdAt: '2026-02-22', createdBy: '岸本 医師', status: '登録済' },
  { id: 'DOC003', patientId: 'P004', patientName: '高橋 美咲', title: '身体拘束に関する説明書・同意書', type: '隔離拘束', createdAt: '2026-02-23', createdBy: '田村 医師', status: '登録済' },
  { id: 'DOC004', patientId: 'P019', patientName: '新井 太一', title: '入院診療計画書',                 type: '入院時',   createdAt: '2026-02-24', createdBy: '田村 医師', status: '作成中' },
  { id: 'DOC005', patientId: 'P003', patientName: '鈴木 一郎', title: '退院療養計画書',                 type: '退院時',   createdAt: '2026-02-24', createdBy: '森田 医師', status: '作成中' },
];

// ===== 病棟管理 =====
export const NURSING_DIARY: NursingDiaryEntry[] = [
  { id: 'ND001', date: '2026-02-24', wardId: 'ward1', author: '師長 木下', content: '本日の入院患者数10名。新規入院1名予定（新井氏）。鈴木氏の退院手続き進行中。特記事項なし。', patientCount: 10, admissions: 1, discharges: 0 },
  { id: 'ND002', date: '2026-02-24', wardId: 'ward2', author: '師長 原田', content: '本日の入院患者数8名。松本氏の拘束解除について医師と協議予定。清水氏の隔離継続中。', patientCount: 8, admissions: 0, discharges: 0 },
  { id: 'ND003', date: '2026-02-23', wardId: 'ward1', author: '師長 木下', content: '入院患者数10名。高橋氏に対する身体拘束開始（9:30）。家族への説明実施済み。', patientCount: 10, admissions: 0, discharges: 0, incidents: '身体拘束開始' },
];

export const WARD_DIARY: WardDiaryEntry[] = [
  { id: 'WD001', date: '2026-02-24', wardId: 'ward1', author: '看護師 山本', content: '日勤帯：特記事項なし。各患者のバイタル安定。鈴木氏の隔離室巡回4回実施。高橋氏の拘束チェック2時間毎実施。' },
  { id: 'WD002', date: '2026-02-24', wardId: 'ward2', author: '看護師 田辺', content: '日勤帯：松本氏の拘束解除時期について主治医に確認。次回回診時に検討予定。清水氏は落ち着いている。' },
];

// ===== 外来受診 =====
export const OUTPATIENT_VISITS: OutpatientVisit[] = [
  { id: 'OV001', patientId: 'OP001', patientName: '田辺 正志',   age: 65, gender: 'M', department: '精神科',   doctorName: '田村 医師', visitType: '再診', appointmentTime: '09:00', receptionTime: '08:50', status: '完了' },
  { id: 'OV002', patientId: 'OP002', patientName: '松崎 由佳',   age: 42, gender: 'F', department: '精神科',   doctorName: '岸本 医師', visitType: '再診', appointmentTime: '09:30', receptionTime: '09:25', status: '完了' },
  { id: 'OV003', patientId: 'OP003', patientName: '大野 真由',   age: 44, gender: 'F', department: '心療内科', doctorName: '森田 医師', visitType: '再診', appointmentTime: '09:00', receptionTime: '08:55', status: '会計待ち' },
  { id: 'OV004', patientId: 'OP004', patientName: '浜田 光雄',   age: 72, gender: 'M', department: '精神科',   doctorName: '岸本 医師', visitType: '再診', appointmentTime: '09:30', receptionTime: '09:28', status: '会計待ち' },
  { id: 'OV005', patientId: 'OP005', patientName: '広瀬 誠',     age: 38, gender: 'M', department: '心療内科', doctorName: '森田 医師', visitType: '初診', appointmentTime: '10:00', receptionTime: '09:55', status: '診察中' },
  { id: 'OV006', patientId: 'OP006', patientName: '荻野 美穂',   age: 55, gender: 'F', department: '精神科',   doctorName: '田村 医師', visitType: '再診', appointmentTime: '10:00', receptionTime: '09:58', status: '診察中' },
  { id: 'OV007', patientId: 'OP007', patientName: '江口 拓海',   age: 29, gender: 'M', department: '心療内科', doctorName: '森田 医師', visitType: '再診', appointmentTime: '10:30', receptionTime: '10:35', status: '待機中' },
  { id: 'OV008', patientId: 'OP008', patientName: '石田 佳代',   age: 67, gender: 'F', department: '精神科',   doctorName: '岸本 医師', visitType: '再診', appointmentTime: '10:30', receptionTime: '10:28', status: '待機中' },
  { id: 'OV009', patientId: 'OP009', patientName: '村田 健一',   age: 51, gender: 'M', department: '精神科',   doctorName: '田村 医師', visitType: '再診', appointmentTime: '11:00', status: '待機中' },
  { id: 'OV010', patientId: 'OP010', patientName: '坂本 礼奈',   age: 33, gender: 'F', department: '心療内科', doctorName: '森田 医師', visitType: '初診', appointmentTime: '11:00', status: '待機中', notes: '初診のため問診票記入中' },
  { id: 'OV011', patientId: 'OP011', patientName: '木村 浩太郎', age: 48, gender: 'M', department: '精神科',   doctorName: '岸本 医師', visitType: '再診', appointmentTime: '11:30', status: '待機中' },
  { id: 'OV012', patientId: 'OP012', patientName: '福田 奈緒',   age: 36, gender: 'F', department: '心療内科', doctorName: '森田 医師', visitType: '再診', appointmentTime: '13:00', status: '待機中' },
];

// ===== 看護計画 =====
export const NURSING_PLANS: NursingPlan[] = [
  {
    patientId: 'P001',
    patientName: '山田 太郎',
    wardId: 'ward1',
    roomNumber: '101号室',
    doctorName: '上田 医師',
    periodStart: '2026/04/10',
    longTermGoal: '症状が安定し、服薬を自己管理して退院できる',
    nextEvaluationDue: '2026-04-20',
    problems: [
      {
        id: 'NP001-1',
        no: 1,
        problem: '統合失調症に関連した思考過程の混乱\n（幻覚・妄想・まとまりのない発言）',
        goal: '幻覚・妄想症状が軽減し、現実的な思考ができる',
        planDate: '2026/04/10',
        observation: '幻覚・妄想の有無、内容、頻度を観察する。言動・表情・睡眠状態を観察する',
        treatment: '薬物療法の確実な実施。安心できる環境の提供。刺激の少ない環境を整える',
        education: '服薬の重要性を説明する。症状への対処方法を一緒に考える',
      },
      {
        id: 'NP001-2',
        no: 2,
        problem: '服薬コンプライアンス不良に関連した\n再発リスクの増大',
        goal: '指示された薬を正確に内服できる',
        planDate: '2026/04/10',
        observation: '服薬状況・口腔内確認。副作用症状（EPS・過鎮静等）の観察',
        treatment: '服薬時の声かけ・確認。副作用出現時は医師に報告する',
        education: '薬の効果・副作用をわかりやすく説明する。自己中断のリスクを伝える',
      },
      {
        id: 'NP001-3',
        no: 3,
        problem: '疾患・入院に関連した\nセルフケア不足（清潔・整容）',
        goal: '日常的なセルフケアを援助のもとで実施できる',
        planDate: '2026/04/17',
        observation: '清潔保持状況・身だしなみの観察。入浴・洗面への参加状況を確認する',
        treatment: '入浴・整容への声かけ・援助。必要時は部分介助を行う',
        education: '清潔保持の重要性を説明する。退院後の生活に向けて自立を促す',
      },
    ],
  },
  {
    patientId: 'P002',
    patientName: '佐藤 花子',
    wardId: 'ward1',
    roomNumber: '101号室',
    doctorName: '上田 医師',
    periodStart: '2026/04/10',
    longTermGoal: '認知症症状と上手く付き合いながら安全に生活できる',
    nextEvaluationDue: '2026-04-10',
    problems: [
      {
        id: 'NP002-1',
        no: 1,
        problem: '認知機能低下に関連した\n転倒・転落リスク',
        goal: '転倒・転落なく安全に過ごせる',
        planDate: '2026/04/10',
        observation: '歩行状態・ADL・見当識の観察。環境の危険因子を確認する',
        treatment: 'ベッド柵の設置。センサー使用。転倒防止の環境整備',
        education: '離床時のナースコール使用を繰り返し説明する',
      },
      {
        id: 'NP002-2',
        no: 2,
        problem: '認知症に関連した\nBPSD（興奮・徘徊・暴言）',
        goal: 'BPSDが軽減し、穏やかに過ごせる時間が増える',
        planDate: '2026/04/10',
        observation: 'BPSD出現状況・誘因・時間帯を観察する。睡眠状態の観察',
        treatment: '穏やかな対応・傾聴。誘因除去。安心できる環境づくり',
        education: '家族へBPSDの対処方法を説明する',
      },
    ],
  },
  {
    patientId: 'P003',
    patientName: '鈴木 一郎',
    wardId: 'ward1',
    roomNumber: '102号室',
    doctorName: '上田 医師',
    periodStart: '2026/04/10',
    longTermGoal: '隔離が解除され、病棟内での生活を安全に送れる',
    nextEvaluationDue: '2026-04-15',
    problems: [
      {
        id: 'NP003-1',
        no: 1,
        problem: '興奮・攻撃性に関連した\n他者への暴力リスク',
        goal: '興奮が落ち着き、言語的なコミュニケーションがとれる',
        planDate: '2026/04/10',
        observation: '精神症状・興奮状態・表情・言動を観察する。隔離中の巡回（2時間毎）',
        treatment: '隔離室での安全管理。指示された頓服薬の確実な実施',
        education: '興奮時の対処方法を繰り返し伝える。感情を言葉で表現するよう促す',
      },
      {
        id: 'NP003-2',
        no: 2,
        problem: '隔離に関連した\n人権への配慮と苦痛の軽減',
        goal: '隔離の必要性を理解し、苦痛を最小限にできる',
        planDate: '2026/04/10',
        observation: '隔離に対する患者の反応・訴えを傾聴する',
        treatment: '隔離の必要性を毎日説明する。定期的な声かけ・訪問',
        education: '隔離解除の条件をわかりやすく説明する',
      },
      {
        id: 'NP003-3',
        no: 3,
        problem: '服薬拒否に関連した\n治療継続困難',
        goal: '指示された薬を内服できる',
        planDate: '2026/04/17',
        observation: '服薬の意思・拒否の理由を確認する。副作用の観察',
        treatment: '服薬時の丁寧な説明と声かけ。内服方法の工夫（液剤等）',
        education: '薬の必要性を繰り返し説明する',
      },
    ],
  },
  {
    patientId: 'P004',
    patientName: '高橋 美咲',
    wardId: 'ward1',
    roomNumber: '103号室',
    doctorName: '中村 医師',
    periodStart: '2026/04/10',
    longTermGoal: 'うつ症状が改善し、日常生活を自立して行える',
    nextEvaluationDue: '2026-04-25',
    problems: [
      {
        id: 'NP004-1',
        no: 1,
        problem: 'うつ病に関連した\n自殺企図・自傷リスク',
        goal: '希死念慮が消失し、安全に生活できる',
        planDate: '2026/04/10',
        observation: '希死念慮・自傷行為の有無を観察する。表情・発言・行動の変化を観察',
        treatment: '危険物の管理。定期的な訪問と傾聴。自傷・企図時の緊急対応',
        education: '気持ちが辛い時はスタッフに伝えるよう説明する',
      },
      {
        id: 'NP004-2',
        no: 2,
        problem: 'うつ病に関連した\n活動意欲低下・セルフケア不足',
        goal: '日常的なセルフケアを自分で行える',
        planDate: '2026/04/17',
        observation: '活動状況・食事摂取量・睡眠状態を観察する',
        treatment: '無理のない活動計画を一緒に立てる。小さな達成を肯定する',
        education: '回復のプロセスについて説明する',
      },
    ],
  },
  {
    patientId: 'P005',
    patientName: '田中 健太',
    wardId: 'ward1',
    roomNumber: '103号室',
    doctorName: '中村 医師',
    periodStart: '2026/04/10',
    longTermGoal: '気分の波をコントロールし、社会復帰できる',
    nextEvaluationDue: '2026-04-30',
    problems: [
      {
        id: 'NP005-1',
        no: 1,
        problem: '双極性障害（躁状態）に関連した\n衝動的行動・判断力低下',
        goal: '躁状態が落ち着き、適切な判断ができる',
        planDate: '2026/04/10',
        observation: '気分・睡眠・活動量・発言内容を観察する。気分の波の記録',
        treatment: '過活動を制限する環境設定。指示薬の確実な実施',
        education: '気分の波のパターンを一緒に振り返る。早期サインを把握させる',
      },
      {
        id: 'NP005-2',
        no: 2,
        problem: '入院環境に関連した\n社会的役割の変化への適応困難',
        goal: '入院生活に適応し、退院に向けた準備ができる',
        planDate: '2026/04/17',
        observation: '家族関係・退院後の生活への不安を傾聴する',
        treatment: '退院支援計画の立案。家族面談の調整',
        education: '社会資源（デイケア等）について情報提供する',
      },
    ],
  },
];

// ===== 定期評価 =====
export const PERIODIC_EVALUATIONS: PeriodicEvaluationRecord[] = [
  {
    patientId: 'P001',
    patientName: '山田 太郎',
    wardId: 'ward1',
    roomNumber: '101号室',
    doctorName: '上田 医師',
    periodStart: '2026/04/10',
    longTermGoal: '症状が安定し、服薬を自己管理して退院できる',
    displayStageCount: 3,
    nextEvaluationDue: '2026-04-20',
    stages: [
      { label: 'ステージ1', date: '2026/04/10', clinicalPathStage: '急性期', stageLabel: '入院初期' },
      { label: 'ステージ2', date: '2026/03/27', clinicalPathStage: '回復期', stageLabel: '安定期' },
      { label: 'ステージ3', date: '2026/03/13', clinicalPathStage: '回復期', stageLabel: '安定期' },
    ],
    evaluations: [
      { id: 'E001-1', problemId: 'NP001-1', stageIndex: 1, evaluationType: '評価', content: '幻覚症状は週2〜3回程度に軽減。妄想の訴えは減少傾向。睡眠5〜6時間確保できている。', evaluator: '中村 Ns', evaluatedAt: '2026/03/27' },
      { id: 'E001-2', problemId: 'NP001-1', stageIndex: 1, evaluationType: 'A評価', content: '目標に向けて改善が見られる。継続して観察・関わりを持つ。', evaluator: '中村 Ns', evaluatedAt: '2026/03/27' },
      { id: 'E001-3', problemId: 'NP001-2', stageIndex: 1, evaluationType: '評価', content: '服薬時の確認で内服できている。副作用の訴えなし。', evaluator: '中村 Ns', evaluatedAt: '2026/03/27' },
      { id: 'E001-4', problemId: 'NP001-1', stageIndex: 2, evaluationType: '評価', content: '入院時より症状が重篤。幻覚・妄想が顕著。', evaluator: '山本 Ns', evaluatedAt: '2026/03/13' },
      { id: 'E001-5', problemId: 'NP001-2', stageIndex: 2, evaluationType: '評価', content: '服薬拒否が見られた。内服方法の工夫が必要。', evaluator: '山本 Ns', evaluatedAt: '2026/03/13' },
    ],
  },
  {
    patientId: 'P002',
    patientName: '佐藤 花子',
    wardId: 'ward1',
    roomNumber: '101号室',
    doctorName: '上田 医師',
    periodStart: '2026/04/10',
    longTermGoal: '認知症症状と上手く付き合いながら安全に生活できる',
    displayStageCount: 3,
    nextEvaluationDue: '2026-04-10',
    stages: [
      { label: 'ステージ1', date: '2026/04/10', clinicalPathStage: '維持期', stageLabel: '入院継続' },
      { label: 'ステージ2', date: '2026/03/27', clinicalPathStage: '維持期', stageLabel: '入院継続' },
      { label: 'ステージ3', date: '2026/03/13', clinicalPathStage: '維持期', stageLabel: '入院継続' },
    ],
    evaluations: [
      { id: 'E002-1', problemId: 'NP002-1', stageIndex: 1, evaluationType: '評価', content: 'センサー使用で転倒なし。歩行状態は変わらず要注意。', evaluator: '田辺 Ns', evaluatedAt: '2026/03/27' },
      { id: 'E002-2', problemId: 'NP002-2', stageIndex: 1, evaluationType: '評価', content: '夕方の興奮が続いている。誘因は夕食前の空腹感か。', evaluator: '田辺 Ns', evaluatedAt: '2026/03/27' },
      { id: 'E002-3', problemId: 'NP002-2', stageIndex: 1, evaluationType: 'A評価', content: '誘因への対処として夕食時間の調整を検討中。', evaluator: '田辺 Ns', evaluatedAt: '2026/03/27' },
    ],
  },
  {
    patientId: 'P003',
    patientName: '鈴木 一郎',
    wardId: 'ward1',
    roomNumber: '102号室',
    doctorName: '上田 医師',
    periodStart: '2026/04/10',
    longTermGoal: '隔離が解除され、病棟内での生活を安全に送れる',
    displayStageCount: 3,
    nextEvaluationDue: '2026-04-15',
    stages: [
      { label: 'ステージ1', date: '2026/04/10', clinicalPathStage: '急性期', stageLabel: '隔離中' },
      { label: 'ステージ2', date: '2026/03/27', clinicalPathStage: '急性期', stageLabel: '隔離中' },
      { label: 'ステージ3', date: '2026/03/13', clinicalPathStage: '急性期', stageLabel: '入院初期' },
    ],
    evaluations: [
      { id: 'E003-1', problemId: 'NP003-1', stageIndex: 2, evaluationType: '評価', content: '興奮状態が持続。怒鳴り声が聞かれる。頓服使用1回。', evaluator: '山本 Ns', evaluatedAt: '2026/03/13' },
    ],
  },
  {
    patientId: 'P004',
    patientName: '高橋 美咲',
    wardId: 'ward1',
    roomNumber: '103号室',
    doctorName: '中村 医師',
    periodStart: '2026/04/10',
    longTermGoal: 'うつ症状が改善し、日常生活を自立して行える',
    displayStageCount: 3,
    nextEvaluationDue: '2026-04-25',
    stages: [
      { label: 'ステージ1', date: '2026/04/10', clinicalPathStage: '急性期', stageLabel: '入院初期' },
      { label: 'ステージ2', date: '2026/03/27', clinicalPathStage: '急性期', stageLabel: '入院初期' },
      { label: 'ステージ3', date: '2026/03/13', clinicalPathStage: '急性期', stageLabel: '入院初期' },
    ],
    evaluations: [
      { id: 'E004-1', problemId: 'NP004-1', stageIndex: 1, evaluationType: '評価', content: '希死念慮の訴えあり。自傷行為はなし。安全確認を継続。', evaluator: '鈴木 Ns', evaluatedAt: '2026/03/27' },
      { id: 'E004-2', problemId: 'NP004-1', stageIndex: 1, evaluationType: 'B評価', content: '目標未達。希死念慮が残存しており継続的な観察が必要。', evaluator: '鈴木 Ns', evaluatedAt: '2026/03/27' },
    ],
  },
  {
    patientId: 'P005',
    patientName: '田中 健太',
    wardId: 'ward1',
    roomNumber: '103号室',
    doctorName: '中村 医師',
    periodStart: '2026/04/10',
    longTermGoal: '気分の波をコントロールし、社会復帰できる',
    displayStageCount: 3,
    nextEvaluationDue: '2026-04-30',
    stages: [
      { label: 'ステージ1', date: '2026/04/10', clinicalPathStage: '回復期', stageLabel: '安定期' },
      { label: 'ステージ2', date: '2026/03/27', clinicalPathStage: '急性期', stageLabel: '躁状態' },
      { label: 'ステージ3', date: '2026/03/13', clinicalPathStage: '急性期', stageLabel: '躁状態' },
    ],
    evaluations: [
      { id: 'E005-1', problemId: 'NP005-1', stageIndex: 1, evaluationType: '評価', content: '過活動は軽減。睡眠6時間確保。発言は多弁だが会話成立。', evaluator: '佐々木 Ns', evaluatedAt: '2026/03/27' },
      { id: 'E005-2', problemId: 'NP005-1', stageIndex: 1, evaluationType: 'A評価', content: '改善傾向。引き続き気分の波を観察し薬物療法継続。', evaluator: '佐々木 Ns', evaluatedAt: '2026/03/27' },
      { id: 'E005-3', problemId: 'NP005-2', stageIndex: 1, evaluationType: '評価', content: '退院への不安を訴えている。家族面談を実施済み。', evaluator: '佐々木 Ns', evaluatedAt: '2026/03/27' },
    ],
  },
];
