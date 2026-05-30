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
  IsolationSubtype,
  ObservationRecord, ObservationState, BehaviorRange, OutingRecord, PatientScheduleEvent,
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
  roomNumber: '101',
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
  '医療先制',
  '患者予約',
  '記事作成',
];

// ===== ステータス設定 =====
export const STATUS_CONFIG: Record<PatientStatus, StatusConfig> = {
  stable:      { label: '安定',   color: '#22c55e', bgColor: '#f0fdf4', muiColor: 'success' },
  observation: { label: '観察中', color: '#f59e0b', bgColor: '#fffbeb', muiColor: 'warning' },
  unstable:    { label: '不安定', color: '#ea580c', bgColor: '#fff7ed', muiColor: 'warning' },
  critical:    { label: '重症',   color: '#dc2626', bgColor: '#fef2f2', muiColor: 'error' },
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
  // 第１病棟（女性のみ。100=2床/2番使用不可, 101/102/103/105/106=各7床, 107/108=各4床。番号は 4 欠番）
  { roomNumber: '100', wardId: 'ward1', beds: [
    { bed: '1', patientId: 'P002', patientName: '佐藤 花子', status: 'observation', gender: 'F', age: 67 },
    { bed: '2', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null, disabled: true },
  ]},
  { roomNumber: '101', wardId: 'ward1', beds: [
    { bed: '1', patientId: 'P021', patientName: '後藤 幸子', status: 'stable', gender: 'F', age: 46 },
    { bed: '2', patientId: 'P024', patientName: '宮田 典子', status: 'stable', gender: 'F', age: 34, flags: ['deposit'] },
    { bed: '3', patientId: 'P004', patientName: '高橋 美咲', status: 'critical', gender: 'F', age: 35, flags: ['restraint', 'reportRequired'] },
    { bed: '5', patientId: 'P026', patientName: '原 由美子', status: 'stable', gender: 'F', age: 53 },
    { bed: '6', patientId: 'P006', patientName: '伊藤 幸子', status: 'outing', gender: 'F', age: 58, flags: ['outing', 'deposit'] },
    { bed: '7', patientId: 'P027', patientName: '内田 道子', status: 'stable', gender: 'F', age: 55 },
    { bed: '8', patientId: 'P008', patientName: '中村 裕子', status: 'observation', gender: 'F', age: 73 },
  ]},
  { roomNumber: '102', wardId: 'ward1', beds: [
    { bed: '1', patientId: 'P029', patientName: '坂本 千恵子', status: 'stable', gender: 'F', age: 43 },
    { bed: '2', patientId: 'P010', patientName: '加藤 良子', status: 'stable', gender: 'F', age: 61 },
    { bed: '3', patientId: 'P031', patientName: '谷口 沙織', status: 'stable', gender: 'F', age: 29 },
    { bed: '5', patientId: 'P033', patientName: '川崎 麻美', status: 'stable', gender: 'F', age: 27 },
    { bed: '6', patientId: 'P034', patientName: '福本 美恵子', status: 'stable', gender: 'F', age: 69 },
    { bed: '7', patientId: 'P036', patientName: '高瀬 久美子', status: 'stable', gender: 'F', age: 54 },
    { bed: '8', patientId: 'P038', patientName: '徳田 美代子', status: 'stable', gender: 'F', age: 60 },
  ]},
  { roomNumber: '103', wardId: 'ward1', beds: [
    { bed: '1', patientId: 'P070', patientName: '岡田 早苗', status: 'stable', gender: 'F', age: 55 },
    { bed: '2', patientId: 'P072', patientName: '森下 真由美', status: 'observation', gender: 'F', age: 37 },
    { bed: '3', patientId: 'P074', patientName: '武田 さゆり', status: 'stable', gender: 'F', age: 31 },
    { bed: '5', patientId: 'P076', patientName: '池田 雅美', status: 'stable', gender: 'F', age: 40 },
    { bed: '6', patientId: 'P078', patientName: '岡本 久美', status: 'stable', gender: 'F', age: 49 },
    { bed: '7', patientId: 'P080', patientName: '森本 京子', status: 'stable', gender: 'F', age: 58 },
    { bed: '8', patientId: 'P082', patientName: '河野 友美', status: 'stable', gender: 'F', age: 32 },
  ]},
  { roomNumber: '105', wardId: 'ward1', beds: [
    { bed: '1', patientId: 'P084', patientName: '南 真理子', status: 'stable', gender: 'F', age: 44 },
    { bed: '2', patientId: 'P086', patientName: '佐野 恵', status: 'observation', gender: 'F', age: 52 },
    { bed: '3', patientId: 'P012', patientName: '山口 真理', status: 'observation', gender: 'F', age: 55 },
    { bed: '5', patientId: 'P040', patientName: '島本 弥生', status: 'stable', gender: 'F', age: 46 },
    { bed: '6', patientId: 'P014', patientName: '井上 さくら', status: 'stable', gender: 'F', age: 28 },
    { bed: '7', patientId: 'P016', patientName: '林 美穂', status: 'stable', gender: 'F', age: 42 },
    { bed: '8', patientId: 'P018', patientName: '斎藤 恵', status: 'stable', gender: 'F', age: 64 },
  ]},
  { roomNumber: '106', wardId: 'ward1', beds: [
    { bed: '1', patientId: 'P020', patientName: '藤田 明日香', status: 'stable', gender: 'F', age: 28 },
    { bed: '2', patientId: 'P051', patientName: '石井 礼子', status: 'stable', gender: 'F', age: 61 },
    { bed: '3', patientId: 'P053', patientName: '福田 美智子', status: 'stable', gender: 'F', age: 59 },
    { bed: '5', patientId: 'P055', patientName: '高田 幸恵', status: 'stable', gender: 'F', age: 38 },
    { bed: '6', patientId: 'P057', patientName: '中井 由紀', status: 'stable', gender: 'F', age: 41 },
    { bed: '7', patientId: 'P059', patientName: '橋本 みどり', status: 'stable', gender: 'F', age: 35 },
    { bed: '8', patientId: 'P061', patientName: '金子 玲奈', status: 'stable', gender: 'F', age: 25 },
  ]},
  { roomNumber: '107', wardId: 'ward1', beds: [
    { bed: '1', patientId: 'P063', patientName: '渡部 千佳', status: 'stable', gender: 'F', age: 32 },
    { bed: '2', patientId: 'P065', patientName: '豊田 里美', status: 'stable', gender: 'F', age: 44 },
    { bed: '3', patientId: 'P067', patientName: '浜田 由美子', status: 'stable', gender: 'F', age: 49 },
    { bed: '5', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '108', wardId: 'ward1', beds: [
    { bed: '1', patientId: 'P087', patientName: '遠藤 彩', status: 'stable', gender: 'F', age: 26 },
    { bed: '2', patientId: 'P088', patientName: '近藤 麻衣', status: 'stable', gender: 'F', age: 33 },
    { bed: '3', patientId: 'P089', patientName: '斉藤 咲', status: 'stable', gender: 'F', age: 40 },
    { bed: '5', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  // 第２病棟（男性のみ。ただし 201 は女性室。201=5床, 202/203/205/206/210-213=各6床, 208/215/216=各4床）
  { roomNumber: '201', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P090', patientName: '本田 裕美', status: 'stable', gender: 'F', age: 47 },
    { bed: 'B', patientId: 'P091', patientName: '村上 香織', status: 'stable', gender: 'F', age: 54 },
    { bed: 'C', patientId: 'P092', patientName: '藤井 直美', status: 'stable', gender: 'F', age: 61 },
    { bed: 'D', patientId: 'P093', patientName: '大野 智子', status: 'stable', gender: 'F', age: 68 },
    { bed: 'E', patientId: 'P094', patientName: '横山 友香', status: 'stable', gender: 'F', age: 31 },
  ]},
  { roomNumber: '202', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P001', patientName: '山田 太郎', status: 'stable', gender: 'M', age: 52 },
    { bed: 'B', patientId: 'P022', patientName: '小川 浩', status: 'stable', gender: 'M', age: 39 },
    { bed: 'C', patientId: 'P003', patientName: '鈴木 一郎', status: 'unstable', gender: 'M', age: 41, flags: ['isolation', 'reportRequired'] },
    { bed: 'D', patientId: 'P023', patientName: '中山 誠一', status: 'stable', gender: 'M', age: 62 },
    { bed: 'E', patientId: 'P005', patientName: '田中 健太', status: 'stable', gender: 'M', age: 29 },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '203', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P025', patientName: '石川 裕二', status: 'stable', gender: 'M', age: 28 },
    { bed: 'B', patientId: 'P007', patientName: '渡辺 大輔', status: 'stable', gender: 'M', age: 44, flags: ['overnight'], hasScheduledMove: true },
    { bed: 'C', patientId: 'P028', patientName: '西川 雅之', status: 'stable', gender: 'M', age: 51 },
    { bed: 'D', patientId: 'P009', patientName: '小林 誠', status: 'stable', gender: 'M', age: 38 },
    { bed: 'E', patientId: 'P030', patientName: '安田 正人', status: 'stable', gender: 'M', age: 57 },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '205', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P019', patientName: '新井 太一', status: 'stable', gender: 'M', age: 22 },
    { bed: 'B', patientId: 'P032', patientName: '矢野 健一', status: 'critical', gender: 'M', age: 36 },
    { bed: 'C', patientId: 'P035', patientName: '西田 智也', status: 'stable', gender: 'M', age: 25 },
    { bed: 'D', patientId: 'P037', patientName: '杉本 健二', status: 'stable', gender: 'M', age: 33 },
    { bed: 'E', patientId: 'P069', patientName: '柴田 直樹', status: 'stable', gender: 'M', age: 42 },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '206', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P071', patientName: '橋本 隆', status: 'stable', gender: 'M', age: 48 },
    { bed: 'B', patientId: 'P073', patientName: '小野寺 浩', status: 'stable', gender: 'M', age: 64 },
    { bed: 'C', patientId: 'P075', patientName: '長谷川 慎', status: 'observation', gender: 'M', age: 53 },
    { bed: 'D', patientId: 'P077', patientName: '青木 浩司', status: 'stable', gender: 'M', age: 70 },
    { bed: 'E', patientId: 'P079', patientName: '飯田 弘', status: 'stable', gender: 'M', age: 36 },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '208', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P081', patientName: '関口 健一', status: 'observation', gender: 'M', age: 45 },
    { bed: 'B', patientId: 'P083', patientName: '吉川 修', status: 'stable', gender: 'M', age: 61 },
    { bed: 'C', patientId: 'P085', patientName: '中島 大輔', status: 'stable', gender: 'M', age: 27 },
    { bed: 'D', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '210', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P011', patientName: '吉田 浩二', status: 'stable', gender: 'M', age: 47 },
    { bed: 'B', patientId: 'P013', patientName: '松本 拓也', status: 'unstable', gender: 'M', age: 33, flags: ['restraint'] },
    { bed: 'C', patientId: 'P015', patientName: '木村 正樹', status: 'outing', gender: 'M', age: 50, flags: ['overnight'] },
    { bed: 'D', patientId: 'P017', patientName: '清水 翔太', status: 'critical', gender: 'M', age: 36, flags: ['isolation', 'restraint'] },
    { bed: 'E', patientId: 'P045', patientName: '岡崎 悠人', status: 'stable', gender: 'M', age: 26 },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '211', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P047', patientName: '大村 徹', status: 'stable', gender: 'M', age: 40 },
    { bed: 'B', patientId: 'P050', patientName: '長田 直樹', status: 'unstable', gender: 'M', age: 37, flags: ['isolation'] },
    { bed: 'C', patientId: 'P052', patientName: '中田 博之', status: 'stable', gender: 'M', age: 31 },
    { bed: 'D', patientId: 'P054', patientName: '小野 剛', status: 'stable', gender: 'M', age: 45 },
    { bed: 'E', patientId: 'P056', patientName: '山崎 悟', status: 'stable', gender: 'M', age: 53 },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '212', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P058', patientName: '藤原 昌也', status: 'observation', gender: 'M', age: 27 },
    { bed: 'B', patientId: 'P060', patientName: '上田 隆', status: 'stable', gender: 'M', age: 62 },
    { bed: 'C', patientId: 'P062', patientName: '加藤 大介', status: 'stable', gender: 'M', age: 48 },
    { bed: 'D', patientId: 'P064', patientName: '三浦 宏樹', status: 'stable', gender: 'M', age: 56 },
    { bed: 'E', patientId: 'P066', patientName: '清野 明', status: 'stable', gender: 'M', age: 30 },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '213', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P068', patientName: '武田 誠治', status: 'stable', gender: 'M', age: 58 },
    { bed: 'B', patientId: 'P095', patientName: '石田 修平', status: 'stable', gender: 'M', age: 38 },
    { bed: 'C', patientId: 'P096', patientName: '前田 翔', status: 'stable', gender: 'M', age: 45 },
    { bed: 'D', patientId: 'P097', patientName: '岡部 健', status: 'stable', gender: 'M', age: 52 },
    { bed: 'E', patientId: 'P098', patientName: '広瀬 亮', status: 'stable', gender: 'M', age: 59 },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '215', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P099', patientName: '今井 誠司', status: 'stable', gender: 'M', age: 66 },
    { bed: 'B', patientId: 'P100', patientName: '菅原 直人', status: 'stable', gender: 'M', age: 29 },
    { bed: 'C', patientId: 'P101', patientName: '千葉 隆司', status: 'stable', gender: 'M', age: 36 },
    { bed: 'D', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '216', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P102', patientName: '須藤 和也', status: 'stable', gender: 'M', age: 43 },
    { bed: 'B', patientId: 'P103', patientName: '黒田 康平', status: 'stable', gender: 'M', age: 50 },
    { bed: 'C', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'D', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
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
  // 第１病棟（女性のみ）
  { id: 'P002', patientNumber: '00010001', name: '佐藤 花子', age: 67, gender: 'F', wardId: 'ward1', roomNumber: '100', bedLabel: '1', status: 'observation', admitDate: '2026-01-15', doctorName: '岸本 医師', diagnosis: 'うつ病' },
  { id: 'P021', patientNumber: '00010002', name: '後藤 幸子', age: 46, gender: 'F', wardId: 'ward1', roomNumber: '101', bedLabel: '1', status: 'stable', admitDate: '2026-01-18', doctorName: '岸本 医師', diagnosis: 'うつ病' },
  { id: 'P024', patientNumber: '00010003', name: '宮田 典子', age: 34, gender: 'F', wardId: 'ward1', roomNumber: '101', bedLabel: '2', status: 'stable', admitDate: '2026-01-30', doctorName: '岸本 医師', diagnosis: '双極性障害' },
  { id: 'P004', patientNumber: '00010004', name: '高橋 美咲', age: 35, gender: 'F', wardId: 'ward1', roomNumber: '101', bedLabel: '3', status: 'critical', admitDate: '2026-02-05', doctorName: '田村 医師', diagnosis: '統合失調症' },
  { id: 'P026', patientNumber: '00010005', name: '原 由美子', age: 53, gender: 'F', wardId: 'ward1', roomNumber: '101', bedLabel: '5', status: 'stable', admitDate: '2026-01-12', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P006', patientNumber: '00010006', name: '伊藤 幸子', age: 58, gender: 'F', wardId: 'ward1', roomNumber: '101', bedLabel: '6', status: 'outing', admitDate: '2026-01-08', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P027', patientNumber: '00010007', name: '内田 道子', age: 55, gender: 'F', wardId: 'ward1', roomNumber: '101', bedLabel: '7', status: 'stable', admitDate: '2025-12-22', doctorName: '岸本 医師', diagnosis: '認知症' },
  { id: 'P008', patientNumber: '00010008', name: '中村 裕子', age: 73, gender: 'F', wardId: 'ward1', roomNumber: '101', bedLabel: '8', status: 'observation', admitDate: '2026-01-25', doctorName: '岸本 医師', diagnosis: '認知症' },
  { id: 'P029', patientNumber: '00010009', name: '坂本 千恵子', age: 43, gender: 'F', wardId: 'ward1', roomNumber: '102', bedLabel: '1', status: 'stable', admitDate: '2026-02-03', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P010', patientNumber: '00010010', name: '加藤 良子', age: 61, gender: 'F', wardId: 'ward1', roomNumber: '102', bedLabel: '2', status: 'stable', admitDate: '2026-01-30', doctorName: '田村 医師', diagnosis: 'うつ病' },
  { id: 'P031', patientNumber: '00010011', name: '谷口 沙織', age: 29, gender: 'F', wardId: 'ward1', roomNumber: '102', bedLabel: '3', status: 'stable', admitDate: '2026-02-11', doctorName: '田村 医師', diagnosis: '摂食障害' },
  { id: 'P033', patientNumber: '00010012', name: '川崎 麻美', age: 27, gender: 'F', wardId: 'ward1', roomNumber: '102', bedLabel: '5', status: 'stable', admitDate: '2026-02-16', doctorName: '岸本 医師', diagnosis: '適応障害' },
  { id: 'P034', patientNumber: '00010013', name: '福本 美恵子', age: 69, gender: 'F', wardId: 'ward1', roomNumber: '102', bedLabel: '6', status: 'stable', admitDate: '2025-12-05', doctorName: '田村 医師', diagnosis: '認知症' },
  { id: 'P036', patientNumber: '00010014', name: '高瀬 久美子', age: 54, gender: 'F', wardId: 'ward1', roomNumber: '102', bedLabel: '7', status: 'stable', admitDate: '2026-01-25', doctorName: '岸本 医師', diagnosis: '統合失調症' },
  { id: 'P038', patientNumber: '00010015', name: '徳田 美代子', age: 60, gender: 'F', wardId: 'ward1', roomNumber: '102', bedLabel: '8', status: 'stable', admitDate: '2026-01-06', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P070', patientNumber: '00010016', name: '岡田 早苗', age: 55, gender: 'F', wardId: 'ward1', roomNumber: '103', bedLabel: '1', status: 'stable', admitDate: '2026-03-10', doctorName: '岸本 医師', diagnosis: 'うつ病' },
  { id: 'P072', patientNumber: '00010017', name: '森下 真由美', age: 37, gender: 'F', wardId: 'ward1', roomNumber: '103', bedLabel: '2', status: 'observation', admitDate: '2026-03-20', doctorName: '岸本 医師', diagnosis: '適応障害' },
  { id: 'P074', patientNumber: '00010018', name: '武田 さゆり', age: 31, gender: 'F', wardId: 'ward1', roomNumber: '103', bedLabel: '3', status: 'stable', admitDate: '2026-03-05', doctorName: '岸本 医師', diagnosis: 'うつ病' },
  { id: 'P076', patientNumber: '00010019', name: '池田 雅美', age: 40, gender: 'F', wardId: 'ward1', roomNumber: '103', bedLabel: '5', status: 'stable', admitDate: '2026-03-22', doctorName: '森田 医師', diagnosis: '不安障害' },
  { id: 'P078', patientNumber: '00010020', name: '岡本 久美', age: 49, gender: 'F', wardId: 'ward1', roomNumber: '103', bedLabel: '6', status: 'stable', admitDate: '2026-03-08', doctorName: '岸本 医師', diagnosis: '統合失調症' },
  { id: 'P080', patientNumber: '00010021', name: '森本 京子', age: 58, gender: 'F', wardId: 'ward1', roomNumber: '103', bedLabel: '7', status: 'stable', admitDate: '2026-02-25', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P082', patientNumber: '00010022', name: '河野 友美', age: 32, gender: 'F', wardId: 'ward1', roomNumber: '103', bedLabel: '8', status: 'stable', admitDate: '2026-03-01', doctorName: '岸本 医師', diagnosis: '不安障害' },
  { id: 'P084', patientNumber: '00010023', name: '南 真理子', age: 44, gender: 'F', wardId: 'ward1', roomNumber: '105', bedLabel: '1', status: 'stable', admitDate: '2026-03-04', doctorName: '森田 医師', diagnosis: '統合失調症' },
  { id: 'P086', patientNumber: '00010024', name: '佐野 恵', age: 52, gender: 'F', wardId: 'ward1', roomNumber: '105', bedLabel: '2', status: 'observation', admitDate: '2026-03-25', doctorName: '田村 医師', diagnosis: 'うつ病' },
  { id: 'P012', patientNumber: '00010025', name: '山口 真理', age: 55, gender: 'F', wardId: 'ward1', roomNumber: '105', bedLabel: '3', status: 'observation', admitDate: '2026-01-18', doctorName: '森田 医師', diagnosis: '双極性障害' },
  { id: 'P040', patientNumber: '00010026', name: '島本 弥生', age: 46, gender: 'F', wardId: 'ward1', roomNumber: '105', bedLabel: '5', status: 'stable', admitDate: '2026-01-09', doctorName: '田村 医師', diagnosis: '不安障害' },
  { id: 'P014', patientNumber: '00010027', name: '井上 さくら', age: 28, gender: 'F', wardId: 'ward1', roomNumber: '105', bedLabel: '6', status: 'stable', admitDate: '2026-02-14', doctorName: '岸本 医師', diagnosis: '摂食障害' },
  { id: 'P016', patientNumber: '00010028', name: '林 美穂', age: 42, gender: 'F', wardId: 'ward1', roomNumber: '105', bedLabel: '7', status: 'stable', admitDate: '2026-02-06', doctorName: '田村 医師', diagnosis: '不安障害' },
  { id: 'P018', patientNumber: '00010029', name: '斎藤 恵', age: 64, gender: 'F', wardId: 'ward1', roomNumber: '105', bedLabel: '8', status: 'stable', admitDate: '2026-01-22', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P020', patientNumber: '00010030', name: '藤田 明日香', age: 28, gender: 'F', wardId: 'ward1', roomNumber: '106', bedLabel: '1', status: 'stable', admitDate: '2026-02-23', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P051', patientNumber: '00010031', name: '石井 礼子', age: 61, gender: 'F', wardId: 'ward1', roomNumber: '106', bedLabel: '2', status: 'stable', admitDate: '2026-01-04', doctorName: '岸本 医師', diagnosis: 'うつ病' },
  { id: 'P053', patientNumber: '00010032', name: '福田 美智子', age: 59, gender: 'F', wardId: 'ward1', roomNumber: '106', bedLabel: '3', status: 'stable', admitDate: '2026-02-01', doctorName: '岸本 医師', diagnosis: 'うつ病' },
  { id: 'P055', patientNumber: '00010033', name: '高田 幸恵', age: 38, gender: 'F', wardId: 'ward1', roomNumber: '106', bedLabel: '5', status: 'stable', admitDate: '2026-02-15', doctorName: '森田 医師', diagnosis: '双極性障害' },
  { id: 'P057', patientNumber: '00010034', name: '中井 由紀', age: 41, gender: 'F', wardId: 'ward1', roomNumber: '106', bedLabel: '6', status: 'stable', admitDate: '2026-02-08', doctorName: '岸本 医師', diagnosis: 'うつ病' },
  { id: 'P059', patientNumber: '00010035', name: '橋本 みどり', age: 35, gender: 'F', wardId: 'ward1', roomNumber: '106', bedLabel: '7', status: 'stable', admitDate: '2026-01-20', doctorName: '田村 医師', diagnosis: '不安障害' },
  { id: 'P061', patientNumber: '00010036', name: '金子 玲奈', age: 25, gender: 'F', wardId: 'ward1', roomNumber: '106', bedLabel: '8', status: 'stable', admitDate: '2026-02-17', doctorName: '森田 医師', diagnosis: '摂食障害' },
  { id: 'P063', patientNumber: '00010037', name: '渡部 千佳', age: 32, gender: 'F', wardId: 'ward1', roomNumber: '107', bedLabel: '1', status: 'stable', admitDate: '2026-02-13', doctorName: '岸本 医師', diagnosis: 'うつ病' },
  { id: 'P065', patientNumber: '00010038', name: '豊田 里美', age: 44, gender: 'F', wardId: 'ward1', roomNumber: '107', bedLabel: '2', status: 'stable', admitDate: '2026-02-02', doctorName: '田村 医師', diagnosis: 'うつ病' },
  { id: 'P067', patientNumber: '00010039', name: '浜田 由美子', age: 49, gender: 'F', wardId: 'ward1', roomNumber: '107', bedLabel: '3', status: 'stable', admitDate: '2026-01-17', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P087', patientNumber: '00010040', name: '遠藤 彩', age: 26, gender: 'F', wardId: 'ward1', roomNumber: '108', bedLabel: '1', status: 'stable', admitDate: '2026-04-01', doctorName: '田村 医師', diagnosis: '統合失調症' },
  { id: 'P088', patientNumber: '00010041', name: '近藤 麻衣', age: 33, gender: 'F', wardId: 'ward1', roomNumber: '108', bedLabel: '2', status: 'stable', admitDate: '2026-05-04', doctorName: '岸本 医師', diagnosis: 'うつ病' },
  { id: 'P089', patientNumber: '00010042', name: '斉藤 咲', age: 40, gender: 'F', wardId: 'ward1', roomNumber: '108', bedLabel: '3', status: 'stable', admitDate: '2026-04-07', doctorName: '森田 医師', diagnosis: '双極性障害' },
  // 第２病棟（男性のみ。201 は女性室）
  { id: 'P090', patientNumber: '00010043', name: '本田 裕美', age: 47, gender: 'F', wardId: 'ward2', roomNumber: '201', bedLabel: 'A', status: 'stable', admitDate: '2026-05-10', doctorName: '田村 医師', diagnosis: '適応障害' },
  { id: 'P091', patientNumber: '00010044', name: '村上 香織', age: 54, gender: 'F', wardId: 'ward2', roomNumber: '201', bedLabel: 'B', status: 'stable', admitDate: '2026-04-13', doctorName: '岸本 医師', diagnosis: '不安障害' },
  { id: 'P092', patientNumber: '00010045', name: '藤井 直美', age: 61, gender: 'F', wardId: 'ward2', roomNumber: '201', bedLabel: 'C', status: 'stable', admitDate: '2026-05-16', doctorName: '森田 医師', diagnosis: '認知症' },
  { id: 'P093', patientNumber: '00010046', name: '大野 智子', age: 68, gender: 'F', wardId: 'ward2', roomNumber: '201', bedLabel: 'D', status: 'stable', admitDate: '2026-04-19', doctorName: '田村 医師', diagnosis: 'アルコール依存症' },
  { id: 'P094', patientNumber: '00010047', name: '横山 友香', age: 31, gender: 'F', wardId: 'ward2', roomNumber: '201', bedLabel: 'E', status: 'stable', admitDate: '2026-05-22', doctorName: '岸本 医師', diagnosis: '統合失調症' },
  { id: 'P001', patientNumber: '00010048', name: '山田 太郎', age: 52, gender: 'M', wardId: 'ward2', roomNumber: '202', bedLabel: 'A', status: 'stable', admitDate: '2026-01-10', doctorName: '田村 医師', diagnosis: '統合失調症', primaryRecordType: 'nursing-record' },
  { id: 'P022', patientNumber: '00010049', name: '小川 浩', age: 39, gender: 'M', wardId: 'ward2', roomNumber: '202', bedLabel: 'B', status: 'stable', admitDate: '2026-02-05', doctorName: '田村 医師', diagnosis: '適応障害' },
  { id: 'P003', patientNumber: '00010050', name: '鈴木 一郎', age: 41, gender: 'M', wardId: 'ward2', roomNumber: '202', bedLabel: 'C', status: 'unstable', admitDate: '2026-02-01', doctorName: '森田 医師', diagnosis: '双極性障害' },
  { id: 'P023', patientNumber: '00010051', name: '中山 誠一', age: 62, gender: 'M', wardId: 'ward2', roomNumber: '202', bedLabel: 'D', status: 'stable', admitDate: '2025-12-10', doctorName: '森田 医師', diagnosis: '統合失調症' },
  { id: 'P005', patientNumber: '00010052', name: '田中 健太', age: 29, gender: 'M', wardId: 'ward2', roomNumber: '202', bedLabel: 'E', status: 'stable', admitDate: '2026-01-20', doctorName: '岸本 医師', diagnosis: '適応障害' },
  { id: 'P025', patientNumber: '00010053', name: '石川 裕二', age: 28, gender: 'M', wardId: 'ward2', roomNumber: '203', bedLabel: 'A', status: 'stable', admitDate: '2026-02-20', doctorName: '田村 医師', diagnosis: '適応障害' },
  { id: 'P007', patientNumber: '00010054', name: '渡辺 大輔', age: 44, gender: 'M', wardId: 'ward2', roomNumber: '203', bedLabel: 'B', status: 'stable', admitDate: '2026-02-10', doctorName: '田村 医師', diagnosis: 'アルコール依存症' },
  { id: 'P028', patientNumber: '00010055', name: '西川 雅之', age: 51, gender: 'M', wardId: 'ward2', roomNumber: '203', bedLabel: 'C', status: 'stable', admitDate: '2026-01-08', doctorName: '田村 医師', diagnosis: '統合失調症' },
  { id: 'P009', patientNumber: '00010056', name: '小林 誠', age: 38, gender: 'M', wardId: 'ward2', roomNumber: '203', bedLabel: 'D', status: 'stable', admitDate: '2026-02-12', doctorName: '森田 医師', diagnosis: '不安障害' },
  { id: 'P030', patientNumber: '00010057', name: '安田 正人', age: 57, gender: 'M', wardId: 'ward2', roomNumber: '203', bedLabel: 'E', status: 'stable', admitDate: '2026-01-19', doctorName: '岸本 医師', diagnosis: 'アルコール依存症' },
  { id: 'P019', patientNumber: '00010058', name: '新井 太一', age: 22, gender: 'M', wardId: 'ward2', roomNumber: '205', bedLabel: 'A', status: 'stable', admitDate: '2026-02-24', doctorName: '田村 医師', diagnosis: '適応障害' },
  { id: 'P032', patientNumber: '00010059', name: '矢野 健一', age: 36, gender: 'M', wardId: 'ward2', roomNumber: '205', bedLabel: 'B', status: 'critical', admitDate: '2026-02-19', doctorName: '森田 医師', diagnosis: '双極性障害' },
  { id: 'P035', patientNumber: '00010060', name: '西田 智也', age: 25, gender: 'M', wardId: 'ward2', roomNumber: '205', bedLabel: 'C', status: 'stable', admitDate: '2026-02-22', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P037', patientNumber: '00010061', name: '杉本 健二', age: 33, gender: 'M', wardId: 'ward2', roomNumber: '205', bedLabel: 'D', status: 'stable', admitDate: '2026-02-14', doctorName: '田村 医師', diagnosis: '不安障害' },
  { id: 'P069', patientNumber: '00010062', name: '柴田 直樹', age: 42, gender: 'M', wardId: 'ward2', roomNumber: '205', bedLabel: 'E', status: 'stable', admitDate: '2026-03-02', doctorName: '田村 医師', diagnosis: '統合失調症' },
  { id: 'P071', patientNumber: '00010063', name: '橋本 隆', age: 48, gender: 'M', wardId: 'ward2', roomNumber: '206', bedLabel: 'A', status: 'stable', admitDate: '2026-03-15', doctorName: '森田 医師', diagnosis: '双極性障害' },
  { id: 'P073', patientNumber: '00010064', name: '小野寺 浩', age: 64, gender: 'M', wardId: 'ward2', roomNumber: '206', bedLabel: 'B', status: 'stable', admitDate: '2026-02-28', doctorName: '田村 医師', diagnosis: '認知症' },
  { id: 'P075', patientNumber: '00010065', name: '長谷川 慎', age: 53, gender: 'M', wardId: 'ward2', roomNumber: '206', bedLabel: 'C', status: 'observation', admitDate: '2026-03-12', doctorName: '田村 医師', diagnosis: 'アルコール依存症' },
  { id: 'P077', patientNumber: '00010066', name: '青木 浩司', age: 70, gender: 'M', wardId: 'ward2', roomNumber: '206', bedLabel: 'D', status: 'stable', admitDate: '2026-02-26', doctorName: '田村 医師', diagnosis: '認知症' },
  { id: 'P079', patientNumber: '00010067', name: '飯田 弘', age: 36, gender: 'M', wardId: 'ward2', roomNumber: '206', bedLabel: 'E', status: 'stable', admitDate: '2026-03-18', doctorName: '森田 医師', diagnosis: '適応障害' },
  { id: 'P081', patientNumber: '00010068', name: '関口 健一', age: 45, gender: 'M', wardId: 'ward2', roomNumber: '208', bedLabel: 'A', status: 'observation', admitDate: '2026-03-09', doctorName: '田村 医師', diagnosis: '双極性障害' },
  { id: 'P083', patientNumber: '00010069', name: '吉川 修', age: 61, gender: 'M', wardId: 'ward2', roomNumber: '208', bedLabel: 'B', status: 'stable', admitDate: '2026-03-14', doctorName: '田村 医師', diagnosis: '認知症' },
  { id: 'P085', patientNumber: '00010070', name: '中島 大輔', age: 27, gender: 'M', wardId: 'ward2', roomNumber: '208', bedLabel: 'C', status: 'stable', admitDate: '2026-03-19', doctorName: '岸本 医師', diagnosis: '適応障害' },
  { id: 'P011', patientNumber: '00010071', name: '吉田 浩二', age: 47, gender: 'M', wardId: 'ward2', roomNumber: '210', bedLabel: 'A', status: 'stable', admitDate: '2026-02-03', doctorName: '岸本 医師', diagnosis: '統合失調症' },
  { id: 'P013', patientNumber: '00010072', name: '松本 拓也', age: 33, gender: 'M', wardId: 'ward2', roomNumber: '210', bedLabel: 'B', status: 'unstable', admitDate: '2026-02-08', doctorName: '田村 医師', diagnosis: '統合失調症' },
  { id: 'P015', patientNumber: '00010073', name: '木村 正樹', age: 50, gender: 'M', wardId: 'ward2', roomNumber: '210', bedLabel: 'C', status: 'outing', admitDate: '2026-01-12', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P017', patientNumber: '00010074', name: '清水 翔太', age: 36, gender: 'M', wardId: 'ward2', roomNumber: '210', bedLabel: 'D', status: 'critical', admitDate: '2026-02-11', doctorName: '岸本 医師', diagnosis: '双極性障害' },
  { id: 'P045', patientNumber: '00010075', name: '岡崎 悠人', age: 26, gender: 'M', wardId: 'ward2', roomNumber: '210', bedLabel: 'E', status: 'stable', admitDate: '2026-02-21', doctorName: '岸本 医師', diagnosis: '適応障害' },
  { id: 'P047', patientNumber: '00010076', name: '大村 徹', age: 40, gender: 'M', wardId: 'ward2', roomNumber: '211', bedLabel: 'A', status: 'stable', admitDate: '2026-01-13', doctorName: '森田 医師', diagnosis: 'アルコール依存症' },
  { id: 'P050', patientNumber: '00010077', name: '長田 直樹', age: 37, gender: 'M', wardId: 'ward2', roomNumber: '211', bedLabel: 'B', status: 'unstable', admitDate: '2026-02-18', doctorName: '森田 医師', diagnosis: '双極性障害' },
  { id: 'P052', patientNumber: '00010078', name: '中田 博之', age: 31, gender: 'M', wardId: 'ward2', roomNumber: '211', bedLabel: 'C', status: 'stable', admitDate: '2026-01-25', doctorName: '森田 医師', diagnosis: '統合失調症' },
  { id: 'P054', patientNumber: '00010079', name: '小野 剛', age: 45, gender: 'M', wardId: 'ward2', roomNumber: '211', bedLabel: 'D', status: 'stable', admitDate: '2026-01-30', doctorName: '田村 医師', diagnosis: 'アルコール依存症' },
  { id: 'P056', patientNumber: '00010080', name: '山崎 悟', age: 53, gender: 'M', wardId: 'ward2', roomNumber: '211', bedLabel: 'E', status: 'stable', admitDate: '2026-01-14', doctorName: '田村 医師', diagnosis: '統合失調症' },
  { id: 'P058', patientNumber: '00010081', name: '藤原 昌也', age: 27, gender: 'M', wardId: 'ward2', roomNumber: '212', bedLabel: 'A', status: 'observation', admitDate: '2026-02-20', doctorName: '森田 医師', diagnosis: '双極性障害' },
  { id: 'P060', patientNumber: '00010082', name: '上田 隆', age: 62, gender: 'M', wardId: 'ward2', roomNumber: '212', bedLabel: 'B', status: 'stable', admitDate: '2025-12-15', doctorName: '岸本 医師', diagnosis: '認知症' },
  { id: 'P062', patientNumber: '00010083', name: '加藤 大介', age: 48, gender: 'M', wardId: 'ward2', roomNumber: '212', bedLabel: 'C', status: 'stable', admitDate: '2026-01-28', doctorName: '田村 医師', diagnosis: '統合失調症' },
  { id: 'P064', patientNumber: '00010084', name: '三浦 宏樹', age: 56, gender: 'M', wardId: 'ward2', roomNumber: '212', bedLabel: 'D', status: 'stable', admitDate: '2026-01-06', doctorName: '森田 医師', diagnosis: '統合失調症' },
  { id: 'P066', patientNumber: '00010085', name: '清野 明', age: 30, gender: 'M', wardId: 'ward2', roomNumber: '212', bedLabel: 'E', status: 'stable', admitDate: '2026-02-10', doctorName: '岸本 医師', diagnosis: '適応障害' },
  { id: 'P068', patientNumber: '00010086', name: '武田 誠治', age: 58, gender: 'M', wardId: 'ward2', roomNumber: '213', bedLabel: 'A', status: 'stable', admitDate: '2025-12-28', doctorName: '田村 医師', diagnosis: '統合失調症' },
  { id: 'P095', patientNumber: '00010087', name: '石田 修平', age: 38, gender: 'M', wardId: 'ward2', roomNumber: '213', bedLabel: 'B', status: 'stable', admitDate: '2026-04-25', doctorName: '森田 医師', diagnosis: 'うつ病' },
  { id: 'P096', patientNumber: '00010088', name: '前田 翔', age: 45, gender: 'M', wardId: 'ward2', roomNumber: '213', bedLabel: 'C', status: 'stable', admitDate: '2026-05-01', doctorName: '田村 医師', diagnosis: '双極性障害' },
  { id: 'P097', patientNumber: '00010089', name: '岡部 健', age: 52, gender: 'M', wardId: 'ward2', roomNumber: '213', bedLabel: 'D', status: 'stable', admitDate: '2026-04-04', doctorName: '岸本 医師', diagnosis: '適応障害' },
  { id: 'P098', patientNumber: '00010090', name: '広瀬 亮', age: 59, gender: 'M', wardId: 'ward2', roomNumber: '213', bedLabel: 'E', status: 'stable', admitDate: '2026-05-07', doctorName: '森田 医師', diagnosis: '不安障害' },
  { id: 'P099', patientNumber: '00010091', name: '今井 誠司', age: 66, gender: 'M', wardId: 'ward2', roomNumber: '215', bedLabel: 'A', status: 'stable', admitDate: '2026-04-10', doctorName: '田村 医師', diagnosis: '認知症' },
  { id: 'P100', patientNumber: '00010092', name: '菅原 直人', age: 29, gender: 'M', wardId: 'ward2', roomNumber: '215', bedLabel: 'B', status: 'stable', admitDate: '2026-05-13', doctorName: '岸本 医師', diagnosis: 'アルコール依存症' },
  { id: 'P101', patientNumber: '00010093', name: '千葉 隆司', age: 36, gender: 'M', wardId: 'ward2', roomNumber: '215', bedLabel: 'C', status: 'stable', admitDate: '2026-04-16', doctorName: '森田 医師', diagnosis: '統合失調症' },
  { id: 'P102', patientNumber: '00010094', name: '須藤 和也', age: 43, gender: 'M', wardId: 'ward2', roomNumber: '216', bedLabel: 'A', status: 'stable', admitDate: '2026-05-19', doctorName: '田村 医師', diagnosis: 'うつ病' },
  { id: 'P103', patientNumber: '00010095', name: '黒田 康平', age: 50, gender: 'M', wardId: 'ward2', roomNumber: '216', bedLabel: 'B', status: 'stable', admitDate: '2026-04-22', doctorName: '岸本 医師', diagnosis: '双極性障害' },
];


/** 内部患者ID → 表示用患者番号(8桁) の対応。一覧・記録系で patientId しか持たない箇所の表示に使う。 */
const PATIENT_NUMBER_BY_ID: Record<string, string> = PATIENTS.reduce((acc, p) => {
  if (p.patientNumber) acc[p.id] = p.patientNumber;
  return acc;
}, {} as Record<string, string>);

/** 内部患者IDから表示用の患者番号(8桁)を引く。未登録IDは内部IDをそのまま返す。 */
export const patientNumberOf = (patientId: string): string =>
  PATIENT_NUMBER_BY_ID[patientId] ?? patientId;

// ===== オーダ =====
export const ORDERS: Order[] = [
  // ===== P001 山田 太郎（52 歳 男・田村 医師）=====
  { id: 'ORD001',  patientId: 'P001', patientName: '山田 太郎',   type: '処方',     content: 'リスパダール 2mg',              schedule: '朝・夕',          status: '実施中', startDate: '2026-02-20', days: 14, doctorName: '田村 医師' },
  { id: 'ORD101',  patientId: 'P001', patientName: '山田 太郎',   type: '処方',     content: 'ロゼレム 8mg',                  schedule: '就寝前',          status: '実施中', startDate: '2026-03-01', days: 14, doctorName: '田村 医師' },
  { id: 'ORD102',  patientId: 'P001', patientName: '山田 太郎',   type: '処方',     content: 'エビリファイ 6mg',              schedule: '朝',              status: '実施中', startDate: '2026-03-05', days: 14, doctorName: '田村 医師' },
  { id: 'ORD103',  patientId: 'P001', patientName: '山田 太郎',   type: '注射',     content: 'ハロペリドール デポ筋注 50mg',  schedule: '隔週',            status: '実施中', startDate: '2026-02-25', days: 1,  doctorName: '田村 医師' },
  { id: 'ORD104',  patientId: 'P001', patientName: '山田 太郎',   type: '心理検査', content: 'WAIS-IV 再評価',                schedule: '—',               status: '予定',   startDate: '2026-03-15', days: 1,  doctorName: '田村 医師' },
  { id: 'ORD105',  patientId: 'P001', patientName: '山田 太郎',   type: '入院定時', content: 'バイタルサイン測定',            schedule: '6時・14時・22時', status: '実施中', startDate: '2026-02-01', days: 30, doctorName: '田村 医師' },
  { id: 'ORD106',  patientId: 'P001', patientName: '山田 太郎',   type: 'IF',       content: '服薬管理指導（自己管理移行）',  schedule: '週 2 回',         status: '実施中', startDate: '2026-03-02', days: 0,  doctorName: '田村 医師' },
  { id: 'ORD107',  patientId: 'P001', patientName: '山田 太郎',   type: '文字',     content: '退院支援カンファ実施依頼',      schedule: '—',               status: '指示済', startDate: '2026-03-12', days: 1,  doctorName: '田村 医師' },
  { id: 'ORD108',  patientId: 'P001', patientName: '山田 太郎',   type: '処方',     content: 'ベンゾジアゼピン（頓服）',      schedule: '不眠時',          status: '中止',   startDate: '2026-02-15', days: 14, doctorName: '田村 医師' },

  // ===== P002 佐藤 花子（67 歳 女・岸本 医師）=====
  { id: 'ORD004',  patientId: 'P002', patientName: '佐藤 花子',   type: '処方',     content: 'デパケン 400mg',                schedule: '朝・昼・夕',      status: '実施中', startDate: '2026-02-18', days: 28, doctorName: '岸本 医師' },
  { id: 'ORD201',  patientId: 'P002', patientName: '佐藤 花子',   type: '処方',     content: 'リーマス（炭酸リチウム）600mg', schedule: '朝・夕',          status: '実施中', startDate: '2026-02-22', days: 21, doctorName: '岸本 医師' },
  { id: 'ORD202',  patientId: 'P002', patientName: '佐藤 花子',   type: '処方',     content: 'マイスリー 10mg',               schedule: '就寝前',          status: '実施中', startDate: '2026-02-18', days: 14, doctorName: '岸本 医師' },
  { id: 'ORD203',  patientId: 'P002', patientName: '佐藤 花子',   type: '注射',     content: 'ビタミン B 群（B1・B12）',      schedule: '週 1 回',         status: '実施中', startDate: '2026-02-20', days: 1,  doctorName: '岸本 医師' },
  { id: 'ORD204',  patientId: 'P002', patientName: '佐藤 花子',   type: '心理検査', content: 'HDS-R（認知機能評価）',         schedule: '—',               status: '実施済', startDate: '2026-02-19', days: 1,  doctorName: '岸本 医師' },
  { id: 'ORD205',  patientId: 'P002', patientName: '佐藤 花子',   type: '心理検査', content: 'MMSE（再評価）',                schedule: '—',               status: '予定',   startDate: '2026-03-20', days: 1,  doctorName: '岸本 医師' },
  { id: 'ORD206',  patientId: 'P002', patientName: '佐藤 花子',   type: '入院定時', content: '血糖測定（食前・食後）',        schedule: '毎食前後',        status: '実施中', startDate: '2026-02-18', days: 30, doctorName: '岸本 医師' },
  { id: 'ORD207',  patientId: 'P002', patientName: '佐藤 花子',   type: 'IF',       content: '転倒予防指導',                  schedule: '—',               status: '実施中', startDate: '2026-02-19', days: 0,  doctorName: '岸本 医師' },
  { id: 'ORD208',  patientId: 'P002', patientName: '佐藤 花子',   type: '文字',     content: '排便管理（毎日記録）',          schedule: '毎日',            status: '実施中', startDate: '2026-02-18', days: 0,  doctorName: '岸本 医師' },

  // ===== P003 鈴木 一郎（41 歳 男・森田 医師・隔離・要報告）=====
  { id: 'ORD002',  patientId: 'P003', patientName: '鈴木 一郎',   type: '注射',     content: 'デカン酸フルフェナジン 25mg',   schedule: '隔週',            status: '指示済', startDate: '2026-02-24', days: 1,  doctorName: '森田 医師' },
  { id: 'ORD301',  patientId: 'P003', patientName: '鈴木 一郎',   type: '処方',     content: 'リスパダール 3mg（増量後）',    schedule: '朝・夕',          status: '実施中', startDate: '2026-03-09', days: 14, doctorName: '森田 医師' },
  { id: 'ORD302',  patientId: 'P003', patientName: '鈴木 一郎',   type: '処方',     content: 'バルプロ酸 400mg',              schedule: '朝・夕',          status: '実施中', startDate: '2026-02-10', days: 28, doctorName: '森田 医師' },
  { id: 'ORD303',  patientId: 'P003', patientName: '鈴木 一郎',   type: '処方',     content: 'レンドルミン 0.25mg',           schedule: '就寝前（頓服）',  status: '実施中', startDate: '2026-02-15', days: 14, doctorName: '森田 医師' },
  { id: 'ORD304',  patientId: 'P003', patientName: '鈴木 一郎',   type: '注射',     content: 'メチコバール（ビタミン B12）',  schedule: '週 1 回',         status: '実施中', startDate: '2026-02-20', days: 1,  doctorName: '森田 医師' },
  { id: 'ORD305',  patientId: 'P003', patientName: '鈴木 一郎',   type: '心理検査', content: 'GAF 評価',                      schedule: '—',               status: '実施済', startDate: '2026-03-01', days: 1,  doctorName: '森田 医師' },
  { id: 'ORD306',  patientId: 'P003', patientName: '鈴木 一郎',   type: '入院定時', content: '隔離下バイタル測定（4 時間毎）',schedule: '6時・10時・14時・18時・22時', status: '実施中', startDate: '2026-02-10', days: 30, doctorName: '森田 医師' },
  { id: 'ORD307',  patientId: 'P003', patientName: '鈴木 一郎',   type: '文字',     content: '隔離室観察記録（15 分毎）',     schedule: '15 分毎',         status: '実施中', startDate: '2026-02-10', days: 0,  doctorName: '森田 医師' },
  { id: 'ORD308',  patientId: 'P003', patientName: '鈴木 一郎',   type: 'IF',       content: '退院環境調整（家族同席）',      schedule: '—',               status: '予定',   startDate: '2026-03-18', days: 1,  doctorName: '森田 医師' },
  { id: 'ORD309',  patientId: 'P003', patientName: '鈴木 一郎',   type: 'ECT',      content: '修正型電気けいれん療法（評価）',schedule: '—',               status: '中止',   startDate: '2026-02-08', days: 1,  doctorName: '森田 医師' },

  // ===== その他患者（既存）=====
  { id: 'ORD003', patientId: 'P004', patientName: '高橋 美咲',   type: '心理検査', content: 'WAIS-IV',                       schedule: '—',               status: '予定',   startDate: '2026-02-25', days: 1,  doctorName: '田村 医師' },
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
  { id: 'ADM003', patientId: 'P019', patientName: '新井 太一',     type: '入院', status: '手続完了', scheduledDate: '2026-05-02', doctorName: '田村 医師', roomNumber: '205', bedLabel: 'A', wardId: 'ward1' },
  { id: 'ADM004', patientId: 'P020', patientName: '藤田 明日香',   type: '入院', status: '手続完了', scheduledDate: '2026-05-01', doctorName: '森田 医師', roomNumber: '106', bedLabel: 'B', wardId: 'ward2' },
  { id: 'ADM005', patientId: 'P003', patientName: '鈴木 一郎',     type: '退院', status: '指示済',   scheduledDate: '2026-05-08', doctorName: '岸本 医師', roomNumber: '202', bedLabel: 'A', wardId: 'ward1' },
  { id: 'ADM006', patientId: 'P006', patientName: '伊藤 幸子',     type: '退院', status: '指示済',   scheduledDate: '2026-05-12', doctorName: '森田 医師', roomNumber: '101', bedLabel: 'A', wardId: 'ward1' },
  { id: 'ADM007', patientId: 'P007', patientName: '渡辺 大輔',     type: '退院', status: '手続完了', scheduledDate: '2026-05-02', doctorName: '田村 医師', roomNumber: '203', bedLabel: 'B', wardId: 'ward1' },
  { id: 'ADM008', patientId: 'U003', patientName: '岩崎 拓海',     type: '入院', status: '指示済',   scheduledDate: '',           doctorName: '森田 医師', roomNumber: '—',   bedLabel: '—', wardId: 'ward1' },
  { id: 'ADM009', patientId: 'P017', patientName: '清水 翔太',     type: '退院', status: '指示済',   scheduledDate: '',           doctorName: '岸本 医師', roomNumber: '210', bedLabel: 'B', wardId: 'ward2' },
  { id: 'ADM010', patientId: 'P013', patientName: '松本 拓也',     type: '退院', status: '指示済',   scheduledDate: '2026-05-20', doctorName: '森田 医師', roomNumber: '210', bedLabel: 'A', wardId: 'ward2' },
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

// ===== ep-05 隔離拘束指示 マスタ =====
// 拘束部位マスタ（区分マスタの代替）
export const MASTER_RESTRAINT_PARTS = [
  '右手首', '左手首', '右足首', '左足首', '体幹', '右肩', '左肩', 'ミトン（右）', 'ミトン（左）',
] as const;

// 開放時間テンプレート（マスタ：開放時間テンプレートマスタの代替）
export interface ReleaseTimeTemplate {
  name: string;
  entries: Array<{ start: string; end: string }>;
}
export const MASTER_RELEASE_TIME_TEMPLATES: ReleaseTimeTemplate[] = [
  {
    name: '日中3回',
    entries: [
      { start: '10:00', end: '10:30' },
      { start: '13:00', end: '13:30' },
      { start: '16:00', end: '16:30' },
    ],
  },
  {
    name: '食事時のみ',
    entries: [
      { start: '07:30', end: '08:30' },
      { start: '11:30', end: '12:30' },
      { start: '17:30', end: '18:30' },
    ],
  },
];

// 入院形態 × 区分 → 隔離拘束時文書マスタ（期限管理マスタの代替）
// タイトル「開始」時の文書チェック群を入院形態と区分から引く
export const MASTER_ISOLATION_DOCS_BY_CONTEXT: Record<AdmitFormType, Partial<Record<IsolationSubtype, string[]>>> = {
  '任意入院': {
    '隔離':     ['隔離開始時告知書', '隔離開始書類'],
    '拘束':     ['身体拘束に関する説明書・同意書', '拘束開始時記録'],
    '隔離拘束': ['隔離拘束併用書類', '身体拘束に関する説明書・同意書'],
  },
  '医療保護入院': {
    '隔離':     ['隔離告知書', '隔離開始書類', '行動制限実施記録'],
    '拘束':     ['身体拘束に関する説明書・同意書', '行動制限実施記録'],
    '隔離拘束': ['隔離拘束併用書類', '行動制限実施記録'],
  },
  '措置入院': {
    '隔離':     ['隔離告知書', '措置時隔離記録'],
    '拘束':     ['身体拘束に関する説明書・同意書', '措置時拘束記録'],
    '隔離拘束': ['措置時隔離拘束記録'],
  },
  '応急入院': {
    '隔離':     ['隔離告知書'],
    '拘束':     ['身体拘束に関する説明書・同意書'],
    '隔離拘束': ['応急時隔離拘束記録'],
  },
  '緊急措置入院': {
    '隔離':     ['隔離告知書'],
    '拘束':     ['身体拘束に関する説明書・同意書'],
    '隔離拘束': ['緊急措置時隔離拘束記録'],
  },
};

// 面接書式マスタ（隔離拘束指示箋印刷ダイアログの面接フォーム）
export const MASTER_INTERVIEW_FORMS = [
  '標準（精神科）', '措置入院告知用', '医療保護入院告知用',
] as const;

// 隔離拘束指示箋の文例（マスタ：文例マスタの代替）
export const MASTER_NOTICE_TEMPLATES = [
  '医師の判断により隔離を開始します。安全確保のため必要な期間、隔離室にて療養いただきます。',
  '医師の判断により拘束を開始します。離床による転倒・自己抜去のリスクが高いため必要な部位を一時的に拘束します。',
  '症状改善に伴い隔離・拘束を解除します。今後も定期的な観察を継続します。',
] as const;

// ===== ep-06 隔離拘束一覧 マスタ =====
// 指示受けサイン用の職員マスタ（精神保健指定医フラグ付き）
export interface StaffForSign {
  id: string;
  name: string;
  /** 精神保健指定医か（true=精神保健指定医、false=指定医以外＝ガバナンス警告対象） */
  isPsychiatristCertified: boolean;
}
export const MASTER_STAFF_FOR_SIGN: StaffForSign[] = [
  // 医師（精神保健指定医）
  { id: 'D001', name: '田村 医師', isPsychiatristCertified: true },
  { id: 'D002', name: '森田 医師', isPsychiatristCertified: true },
  // 医師（精神保健指定医以外＝ガバナンス警告対象）
  { id: 'D003', name: '岸本 医師', isPsychiatristCertified: false },
  // 看護師長・看護師（指示受けサイン用）
  { id: 'N001', name: '山本 看護師',   isPsychiatristCertified: false },
  { id: 'N002', name: '佐々木 看護師', isPsychiatristCertified: false },
  { id: 'N003', name: '中田 看護師',   isPsychiatristCertified: false },
  { id: 'N004', name: '原田 師長',     isPsychiatristCertified: false },
  { id: 'N005', name: '木下 師長',     isPsychiatristCertified: false },
  { id: 'N006', name: '田辺 看護師',   isPsychiatristCertified: false },
];

// 病床管理マスタの「行動制限判定対象」相当（その他区分の判定用）。
// ここに含まれる病棟の在棟患者は、隔離拘束指示なしでも一覧の「その他」区分で表示される。
export const MASTER_BEHAVIOR_RESTRICT_WARDS = ['ward1', 'ward2'] as const;

// ===== ep-07 観察記録 マスタ =====
// 隔離拘束状態マスタ（状態色＋自動記載定型文）
export interface ObservationStateConfig {
  state: ObservationState;
  color: string;       // 文字色（ラベル用）
  bgColor: string;     // セル背景色
  prescriptionText: string;  // 状態選択時に処方処置欄へ自動記載される定型文
}
export const MASTER_OBSERVATION_STATES: ObservationStateConfig[] = [
  { state: '未記入',   color: '#475569', bgColor: '#f1f5f9', prescriptionText: '' },
  { state: '浅眠',     color: '#92400e', bgColor: '#fef3c7', prescriptionText: '浅眠状態。傾眠傾向あり。' },
  { state: '落ち着き', color: '#166534', bgColor: '#dcfce7', prescriptionText: '落ち着いて過ごしている。バイタル安定。' },
  { state: '不穏',     color: '#991b1b', bgColor: '#fef2f2', prescriptionText: '不穏状態を観察。声かけ・傾聴対応中。' },
  { state: '睡眠',     color: '#1e40af', bgColor: '#dbeafe', prescriptionText: '入眠中。呼吸状態安定。' },
  { state: '中途覚醒', color: '#9d174d', bgColor: '#fce7f3', prescriptionText: '中途覚醒あり。再入眠を促す。' },
];

/** 区分別観察回数（1時間あたりの記録回数。マスタ：医療機関情報マスタの観察回数代替） */
export const MASTER_OBSERVATION_FREQUENCY: Record<'隔離' | '拘束' | 'その他', number> = {
  '隔離':   2,  // 30分毎
  '拘束':   4,  // 15分毎
  'その他': 1,  // 60分毎
};

/** 観察記録の文例（マスタ：文例マスタの代替） */
export const MASTER_OBSERVATION_TEMPLATES = [
  '室内で穏やかに過ごしている。バイタル安定。',
  '自力体位変換可。皮膚状態異常なし。循環障害なし。',
  '不穏あり。傾聴対応。30分後に落ち着く。',
  '入眠中。呼吸状態安定。',
  '声かけに反応あり。意思疎通可能。',
] as const;

/** 観察記録の記事タグ（マスタ：記事タグマスタの代替） */
export const MASTER_OBSERVATION_TAGS = [
  '巡回', '声かけ', '傾聴', '体位変換', 'バイタル測定',
  '排泄介助', '食事介助', '清拭', '内服確認', '皮膚観察',
] as const;

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

// ===== 住居区分マスタ（ep-04 帰住先用） =====
export const MASTER_RESIDENCE_TYPES = [
  '自宅',
  'グループホーム',
  '老人ホーム',
  '転院先',
  '不明',
  'その他',
] as const;

export const ADMISSION_HISTORY: AdmissionHistory[] = [
  // P001 山田 太郎: 過去の退院済み入院期間（任意入院）
  {
    id: 'AH001-P001-1', patientId: 'P001', patientName: '山田 太郎',
    periodId: 'AHP-P001-1', admitDate: '2025-06-15', dischargeDate: '2025-08-20',
    wardId: 'ward1', roomNumber: '103', doctorName: '田村 医師', status: '退院済',
    admitForm: '任意入院',
    admitReason: '症状増悪のため任意入院。家族の理解と同意あり。',
    dischargeReason: '症状改善により退院可。',
    dischargeCategory: '退院後通院', outcome: '軽快',
    postDischargeAction: '当院外来にて 2 週ごとに通院。服薬継続。',
    returnTo: '自宅',
  },
  // P001 山田 太郎: 現在の入院期間（任意入院、形態変更なし）
  {
    id: 'AH002-P001-current', patientId: 'P001', patientName: '山田 太郎',
    periodId: 'AHP-P001-2', admitDate: '2026-01-10', wardId: 'ward1', roomNumber: '101',
    doctorName: '田村 医師', status: '入院中',
    admitForm: '任意入院',
    admitReason: '不眠と幻聴の訴えあり、本人同意のもと任意入院。',
  },
  // P003 鈴木 一郎: 現在の入院期間（任意入院 → 医療保護入院 → 措置入院 の形態変更チェーン）
  {
    id: 'AH003-P003-1', patientId: 'P003', patientName: '鈴木 一郎',
    periodId: 'AHP-P003-1', admitDate: '2026-02-01T10:00', dischargeDate: '2026-02-15T15:59',
    wardId: 'ward1', roomNumber: '102', doctorName: '森田 医師', status: '入院中',
    admitForm: '任意入院',
    admitReason: '症状増悪により任意入院。',
  },
  {
    id: 'AH003-P003-2', patientId: 'P003', patientName: '鈴木 一郎',
    periodId: 'AHP-P003-1', admitDate: '2026-02-15T16:00', dischargeDate: '2026-03-01T08:59',
    wardId: 'ward1', roomNumber: '102', doctorName: '森田 医師', status: '入院中',
    admitForm: '医療保護入院', isAdmitFormChange: true,
    admitReason: '本人同意撤回のため家族同意による医療保護入院に切替。',
  },
  {
    id: 'AH003-P003-3', patientId: 'P003', patientName: '鈴木 一郎',
    periodId: 'AHP-P003-1', admitDate: '2026-03-01T09:00',
    wardId: 'ward1', roomNumber: '102', doctorName: '森田 医師', status: '入院中',
    admitForm: '措置入院', isAdmitFormChange: true,
    admitReason: '自傷他害のおそれが強まったため措置入院に切替。',
  },
  // P006 伊藤 幸子: 現在の入院期間（医療保護入院、退院指示済）
  {
    id: 'AH006-P006-current', patientId: 'P006', patientName: '伊藤 幸子',
    periodId: 'AHP-P006-1', admitDate: '2026-01-08', wardId: 'ward1', roomNumber: '104',
    doctorName: '森田 医師', status: '入院中',
    admitForm: '医療保護入院',
    admitReason: '抑うつ症状重度。家族同意のもと医療保護入院。',
  },
];

// ===== 隔離拘束 =====
// ===== ep-05 隔離拘束指示 =====
// IsolationOrder には ep-05 で subtype/operation/restraintParts/releaseTimes/linkedDocumentChecks
// 等のオプショナルフィールドが追加されている。既存サンプルにも順次付与する。
// ===== ep-06 隔離拘束一覧 =====
// confirmSigns（指示受けサイン）サンプルも一部付与。ガバナンス警告検証用に
// ISO004 は精神保健指定医ではない指示医（岸本）＋サイン未登録のままにしてある。
export const ISOLATION_ORDERS: IsolationOrder[] = [
  {
    id: 'ISO001', patientId: 'P003', patientName: '鈴木 一郎',
    type: '隔離', subtype: '隔離', operation: '開始',
    startDatetime: '2026-02-22 14:00',
    wardId: 'ward2', roomNumber: '202-C', doctorName: '岸本 医師',
    linkedDocumentChecks: ['隔離告知書', '隔離開始書類', '行動制限実施記録'],
    confirmSigns: {
      startPrimary: { staffId: 'N001', staffName: '山本 看護師', signedAt: '2026-02-22T14:30' },
    },
  },
  {
    id: 'ISO002', patientId: 'P004', patientName: '高橋 美咲',
    type: '拘束', subtype: '拘束', operation: '開始',
    startDatetime: '2026-02-23 09:30',
    wardId: 'ward1', roomNumber: '101-3', doctorName: '田村 医師',
    restraintParts: ['右手首', '左手首'],
    releaseTimes: [
      { start: '10:00', end: '10:30' },
      { start: '13:00', end: '13:30' },
      { start: '16:00', end: '16:30' },
    ],
    linkedDocumentChecks: ['身体拘束に関する説明書・同意書', '行動制限実施記録'],
    confirmSigns: {
      startPrimary:   { staffId: 'N002', staffName: '佐々木 看護師', signedAt: '2026-02-23T09:45' },
      startSecondary: { staffId: 'N003', staffName: '中田 看護師',   signedAt: '2026-02-23T10:00' },
    },
  },
  {
    id: 'ISO003', patientId: 'P013', patientName: '松本 拓也',
    type: '拘束', subtype: '拘束', operation: '開始',
    startDatetime: '2026-02-21 20:00', endDatetime: '2026-02-23 08:00',
    wardId: 'ward2', roomNumber: '210-B', doctorName: '森田 医師',
    restraintParts: ['右手首', '左手首', '右足首', '左足首'],
    confirmSigns: {
      startPrimary:   { staffId: 'N004', staffName: '原田 師長',     signedAt: '2026-02-21T20:15' },
      startSecondary: { staffId: 'N002', staffName: '佐々木 看護師', signedAt: '2026-02-21T20:30' },
      endPrimary:     { staffId: 'N001', staffName: '山本 看護師',   signedAt: '2026-02-23T08:10' },
    },
  },
  {
    id: 'ISO004', patientId: 'P017', patientName: '清水 翔太',
    type: '隔離', subtype: '隔離', operation: '開始',
    startDatetime: '2026-02-20 10:00',
    wardId: 'ward2', roomNumber: '210-D', doctorName: '岸本 医師',
  },

  // ===== P001〜P005 隔離拘束履歴の拡充 =====

  // --- P001 山田 太郎(統合失調症) ---
  {
    id: 'ISO005', patientId: 'P001', patientName: '山田 太郎',
    type: '拘束', subtype: '拘束', operation: '開始',
    startDatetime: '2025-12-15 22:00', endDatetime: '2025-12-17 09:00',
    wardId: 'ward2', roomNumber: '202-A', doctorName: '田村 医師',
    restraintParts: ['右手首', '左手首'],
    linkedDocumentChecks: ['身体拘束に関する説明書・同意書', '行動制限実施記録'],
    confirmSigns: {
      startPrimary:   { staffId: 'N001', staffName: '山本 看護師',   signedAt: '2025-12-15T22:15' },
      startSecondary: { staffId: 'N003', staffName: '中田 看護師',   signedAt: '2025-12-15T22:30' },
      endPrimary:     { staffId: 'N002', staffName: '佐々木 看護師', signedAt: '2025-12-17T09:10' },
    },
  },
  {
    id: 'ISO006', patientId: 'P001', patientName: '山田 太郎',
    type: '隔離', subtype: '隔離', operation: '開始',
    startDatetime: '2026-01-22 14:00', endDatetime: '2026-01-25 11:00',
    wardId: 'ward2', roomNumber: '202-A', doctorName: '田村 医師',
    linkedDocumentChecks: ['隔離告知書', '隔離開始書類', '行動制限実施記録'],
    confirmSigns: {
      startPrimary: { staffId: 'N001', staffName: '山本 看護師',   signedAt: '2026-01-22T14:20' },
      endPrimary:   { staffId: 'N003', staffName: '中田 看護師',   signedAt: '2026-01-25T11:05' },
    },
  },
  {
    id: 'ISO007', patientId: 'P001', patientName: '山田 太郎',
    type: '拘束', subtype: '拘束', operation: '開始',
    startDatetime: '2026-03-10 21:30', endDatetime: '2026-03-11 06:00',
    wardId: 'ward2', roomNumber: '202-A', doctorName: '田村 医師',
    restraintParts: ['体幹'],
    releaseTimes: [{ start: '23:00', end: '23:15' }, { start: '02:00', end: '02:15' }],
    linkedDocumentChecks: ['身体拘束に関する説明書・同意書', '行動制限実施記録'],
    confirmSigns: {
      startPrimary:   { staffId: 'N002', staffName: '佐々木 看護師', signedAt: '2026-03-10T21:40' },
      startSecondary: { staffId: 'N004', staffName: '原田 師長',     signedAt: '2026-03-10T21:55' },
      endPrimary:     { staffId: 'N001', staffName: '山本 看護師',   signedAt: '2026-03-11T06:10' },
    },
  },

  // --- P002 佐藤 花子(うつ病・観察中) ---
  {
    id: 'ISO008', patientId: 'P002', patientName: '佐藤 花子',
    type: '隔離', subtype: '隔離', operation: '開始',
    startDatetime: '2026-02-05 18:00', endDatetime: '2026-02-06 10:00',
    wardId: 'ward1', roomNumber: '100-1', doctorName: '岸本 医師',
    linkedDocumentChecks: ['隔離告知書', '行動制限実施記録'],
    confirmSigns: {
      startPrimary: { staffId: 'N003', staffName: '中田 看護師',   signedAt: '2026-02-05T18:10' },
      endPrimary:   { staffId: 'N001', staffName: '山本 看護師',   signedAt: '2026-02-06T10:05' },
    },
  },
  {
    id: 'ISO009', patientId: 'P002', patientName: '佐藤 花子',
    type: '隔離', subtype: '隔離拘束', operation: '開始',
    startDatetime: '2026-04-12 16:30', endDatetime: '2026-04-15 09:00',
    wardId: 'ward1', roomNumber: '100-1', doctorName: '岸本 医師',
    restraintParts: ['右手首', '左手首'],
    releaseTimes: [
      { start: '10:00', end: '10:30' },
      { start: '13:00', end: '13:30' },
      { start: '16:00', end: '16:30' },
    ],
    linkedDocumentChecks: ['隔離告知書', '身体拘束に関する説明書・同意書', '行動制限実施記録'],
    confirmSigns: {
      startPrimary:   { staffId: 'N002', staffName: '佐々木 看護師', signedAt: '2026-04-12T16:45' },
      startSecondary: { staffId: 'N004', staffName: '原田 師長',     signedAt: '2026-04-12T17:00' },
      endPrimary:     { staffId: 'N003', staffName: '中田 看護師',   signedAt: '2026-04-15T09:10' },
    },
  },

  // --- P003 鈴木 一郎(双極性障害) ---
  // 既存の ISO001 が現行(2026-02-22 から継続中)
  {
    id: 'ISO010', patientId: 'P003', patientName: '鈴木 一郎',
    type: '拘束', subtype: '拘束', operation: '開始',
    startDatetime: '2025-11-08 03:00', endDatetime: '2025-11-10 11:00',
    wardId: 'ward2', roomNumber: '202-C', doctorName: '森田 医師',
    restraintParts: ['右手首', '左手首', '体幹'],
    releaseTimes: [{ start: '08:00', end: '08:30' }, { start: '14:00', end: '14:30' }],
    linkedDocumentChecks: ['身体拘束に関する説明書・同意書', '行動制限実施記録'],
    confirmSigns: {
      startPrimary:   { staffId: 'N001', staffName: '山本 看護師',   signedAt: '2025-11-08T03:15' },
      startSecondary: { staffId: 'N002', staffName: '佐々木 看護師', signedAt: '2025-11-08T03:30' },
      endPrimary:     { staffId: 'N003', staffName: '中田 看護師',   signedAt: '2025-11-10T11:10' },
    },
  },
  {
    id: 'ISO011', patientId: 'P003', patientName: '鈴木 一郎',
    type: '隔離', subtype: '隔離', operation: '開始',
    startDatetime: '2026-01-15 19:00', endDatetime: '2026-01-18 12:00',
    wardId: 'ward2', roomNumber: '202-C', doctorName: '森田 医師',
    linkedDocumentChecks: ['隔離告知書', '隔離開始書類', '行動制限実施記録'],
    confirmSigns: {
      startPrimary: { staffId: 'N002', staffName: '佐々木 看護師', signedAt: '2026-01-15T19:15' },
      endPrimary:   { staffId: 'N001', staffName: '山本 看護師',   signedAt: '2026-01-18T12:05' },
    },
  },

  // --- P004 高橋 美咲(統合失調症) ---
  // 既存の ISO002 が現行(2026-02-23 から継続中)
  {
    id: 'ISO012', patientId: 'P004', patientName: '高橋 美咲',
    type: '隔離', subtype: '隔離', operation: '開始',
    startDatetime: '2025-12-20 07:30', endDatetime: '2025-12-22 14:00',
    wardId: 'ward1', roomNumber: '101-3', doctorName: '田村 医師',
    linkedDocumentChecks: ['隔離告知書', '行動制限実施記録'],
    confirmSigns: {
      startPrimary: { staffId: 'N003', staffName: '中田 看護師',   signedAt: '2025-12-20T07:45' },
      endPrimary:   { staffId: 'N002', staffName: '佐々木 看護師', signedAt: '2025-12-22T14:10' },
    },
  },
  {
    id: 'ISO013', patientId: 'P004', patientName: '高橋 美咲',
    type: '拘束', subtype: '拘束', operation: '開始',
    startDatetime: '2026-01-30 13:00', endDatetime: '2026-02-02 10:00',
    wardId: 'ward1', roomNumber: '101-3', doctorName: '田村 医師',
    restraintParts: ['右手首', '左手首'],
    releaseTimes: [
      { start: '07:30', end: '08:30' },
      { start: '11:30', end: '12:30' },
      { start: '17:30', end: '18:30' },
    ],
    linkedDocumentChecks: ['身体拘束に関する説明書・同意書', '行動制限実施記録'],
    confirmSigns: {
      startPrimary:   { staffId: 'N004', staffName: '原田 師長',     signedAt: '2026-01-30T13:15' },
      startSecondary: { staffId: 'N001', staffName: '山本 看護師',   signedAt: '2026-01-30T13:30' },
      endPrimary:     { staffId: 'N002', staffName: '佐々木 看護師', signedAt: '2026-02-02T10:10' },
    },
  },

  // --- P005 田中 健太(適応障害) ---
  {
    id: 'ISO014', patientId: 'P005', patientName: '田中 健太',
    type: '拘束', subtype: '拘束', operation: '開始',
    startDatetime: '2026-02-28 23:00', endDatetime: '2026-03-01 06:30',
    wardId: 'ward2', roomNumber: '202-E', doctorName: '岸本 医師',
    restraintParts: ['体幹'],
    releaseTimes: [{ start: '02:00', end: '02:15' }, { start: '05:00', end: '05:15' }],
    linkedDocumentChecks: ['身体拘束に関する説明書・同意書', '行動制限実施記録'],
    confirmSigns: {
      startPrimary:   { staffId: 'N002', staffName: '佐々木 看護師', signedAt: '2026-02-28T23:15' },
      startSecondary: { staffId: 'N004', staffName: '原田 師長',     signedAt: '2026-02-28T23:30' },
      endPrimary:     { staffId: 'N001', staffName: '山本 看護師',   signedAt: '2026-03-01T06:40' },
    },
  },
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

// ===== 看護予定 =====
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

// ===== ep-09 患者情報 マスタ =====
// 職員マスタ（担当職員1〜10、職員選択ダイアログの選択肢）
export interface StaffMember {
  id: string;
  name: string;
  role: '看護師' | '看護師長' | '主任' | '准看護師' | '看護助手';
}
export const MASTER_STAFF: StaffMember[] = [
  { id: 'STF001', name: '山田 看護師長', role: '看護師長' },
  { id: 'STF002', name: '佐藤 主任', role: '主任' },
  { id: 'STF003', name: '鈴木 Ns', role: '看護師' },
  { id: 'STF004', name: '高橋 Ns', role: '看護師' },
  { id: 'STF005', name: '田中 Ns', role: '看護師' },
  { id: 'STF006', name: '伊藤 Ns', role: '看護師' },
  { id: 'STF007', name: '渡辺 Ns', role: '看護師' },
  { id: 'STF008', name: '中村 准Ns', role: '准看護師' },
  { id: 'STF009', name: '小林 准Ns', role: '准看護師' },
  { id: 'STF010', name: '加藤 助手', role: '看護助手' },
];

// 責任レベルマスタ（区分マスタ）
export const MASTER_RESPONSIBILITY_LEVELS = ['L1（軽度）', 'L2（中度）', 'L3（重度）', 'L4（特定）'] as const;
export type ResponsibilityLevel = typeof MASTER_RESPONSIBILITY_LEVELS[number];

/**
 * PATIENTS の Phase 2 拡張データ。
 * 既存の PATIENTS 各レコードに `assignedStaffIds` / `responsibilityLevel` / `examinerIds` を
 * 別マップで提供し、PatientList Phase 2 では PATIENTS と本マップを合成して扱う。
 *
 * 既存 PATIENTS 配列を直接書き換えない理由:
 * - 既存配列は ep-01〜ep-04 など複数エピックから参照されているため、追加フィールドを
 *   既存ファイルの全行に書き加えると差分が大きくなり、他セッションとの干渉が増える
 * - Patient 型自体には optional として追加し、PatientList 側で本マップから上書き合成する
 */
export interface PatientPhase2Extras {
  assignedStaffIds?: string[];
  responsibilityLevel?: ResponsibilityLevel;
  /** 診察医ID（主治医とは別。「診察医登録分も表示」で利用） */
  examinerIds?: string[];
}
export const PATIENT_PHASE2_EXTRAS: Record<string, PatientPhase2Extras> = {
  P001: { assignedStaffIds: ['STF001', 'STF003'], responsibilityLevel: 'L2（中度）', examinerIds: ['STF002'] },
  P002: { assignedStaffIds: ['STF003', 'STF004'], responsibilityLevel: 'L1（軽度）' },
  P003: { assignedStaffIds: ['STF005'], responsibilityLevel: 'L3（重度）', examinerIds: ['STF002'] },
  P004: { assignedStaffIds: ['STF003'], responsibilityLevel: 'L3（重度）' },
  P005: { assignedStaffIds: ['STF006', 'STF007'], responsibilityLevel: 'L1（軽度）' },
  P006: { assignedStaffIds: ['STF004'], responsibilityLevel: 'L2（中度）' },
  P007: { assignedStaffIds: ['STF005', 'STF008'], responsibilityLevel: 'L1（軽度）' },
  P008: { assignedStaffIds: ['STF001', 'STF002', 'STF004'], responsibilityLevel: 'L2（中度）' },
  P009: { assignedStaffIds: ['STF006'], responsibilityLevel: 'L1（軽度）' },
  P010: { assignedStaffIds: ['STF007'], responsibilityLevel: 'L1（軽度）' },
  P011: { assignedStaffIds: ['STF008', 'STF009'], responsibilityLevel: 'L4（特定）' },
  P012: { assignedStaffIds: ['STF005'], responsibilityLevel: 'L2（中度）' },
  P013: { assignedStaffIds: ['STF003'], responsibilityLevel: 'L3（重度）', examinerIds: ['STF002'] },
  P014: { assignedStaffIds: ['STF004'], responsibilityLevel: 'L1（軽度）' },
  P015: { assignedStaffIds: ['STF006'], responsibilityLevel: 'L2（中度）' },
};

export const MASTER_STAFF_BY_ID = MASTER_STAFF.reduce<Record<string, StaffMember>>(
  (acc, s) => { acc[s.id] = s; return acc; }, {},
);

