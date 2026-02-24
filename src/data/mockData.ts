import {
  Room, Patient, Order, NursingRecord, VitalSign, FlowsheetDaily,
  AdmissionOrder, TransferHistory, AdmissionHistory, IsolationOrder,
  ObservationRecord, BehaviorRange, OutingRecord, PatientScheduleEvent,
  RehabOrder, RehabDailyReport, RehabEvaluation, NursingCareSchedule,
  Document, NursingDiaryEntry, WardDiaryEntry, StatusConfig, PatientStatus,
  OutpatientVisit,
} from '../types';

// ===== ステータス設定 =====
export const STATUS_CONFIG: Record<PatientStatus, StatusConfig> = {
  stable:      { label: '安定',   color: '#22c55e', bgColor: '#f0fdf4', muiColor: 'success' },
  observation: { label: '観察中', color: '#f59e0b', bgColor: '#fffbeb', muiColor: 'warning' },
  isolation:   { label: '隔離',   color: '#ef4444', bgColor: '#fef2f2', muiColor: 'error' },
  restraint:   { label: '拘束',   color: '#dc2626', bgColor: '#fef2f2', muiColor: 'error' },
  outing:      { label: '外出中', color: '#6366f1', bgColor: '#eef2ff', muiColor: 'info' },
  empty:       { label: '空床',   color: '#94a3b8', bgColor: '#f8fafc', muiColor: 'default' },
};

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
    { bed: 'A', patientId: 'P003', patientName: '鈴木 一郎',     status: 'isolation',    gender: 'M', age: 41 },
    { bed: 'B', patientId: 'P023', patientName: '中山 誠一',     status: 'stable',       gender: 'M', age: 62 },
    { bed: 'C', patientId: 'P024', patientName: '宮田 典子',     status: 'stable',       gender: 'F', age: 34 },
    { bed: 'D', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '103', wardId: 'ward1', beds: [
    { bed: 'A', patientId: 'P004', patientName: '高橋 美咲',     status: 'restraint',    gender: 'F', age: 35 },
    { bed: 'B', patientId: 'P005', patientName: '田中 健太',     status: 'stable',       gender: 'M', age: 29 },
    { bed: 'C', patientId: 'P025', patientName: '石川 裕二',     status: 'stable',       gender: 'M', age: 28 },
    { bed: 'D', patientId: 'P026', patientName: '原 由美子',     status: 'stable',       gender: 'F', age: 53 },
  ]},
  { roomNumber: '104', wardId: 'ward1', beds: [
    { bed: 'A', patientId: 'P006', patientName: '伊藤 幸子',     status: 'outing',       gender: 'F', age: 58 },
    { bed: 'B', patientId: 'P007', patientName: '渡辺 大輔',     status: 'stable',       gender: 'M', age: 44 },
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
    { bed: 'A', patientId: 'P013', patientName: '松本 拓也',     status: 'restraint',    gender: 'M', age: 33 },
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
    { bed: 'B', patientId: 'P015', patientName: '木村 正樹',     status: 'outing',       gender: 'M', age: 50 },
    { bed: 'C', patientId: 'P059', patientName: '橋本 みどり',   status: 'stable',       gender: 'F', age: 35 },
    { bed: 'D', patientId: 'P060', patientName: '上田 隆',       status: 'stable',       gender: 'M', age: 62 },
    { bed: 'E', patientId: 'P061', patientName: '金子 玲奈',     status: 'stable',       gender: 'F', age: 25 },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'G', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'H', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
  ]},
  { roomNumber: '204', wardId: 'ward2', beds: [
    { bed: 'A', patientId: 'P016', patientName: '林 美穂',       status: 'stable',       gender: 'F', age: 42 },
    { bed: 'B', patientId: 'P017', patientName: '清水 翔太',     status: 'isolation',    gender: 'M', age: 36 },
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
    { bed: 'A', patientId: 'P050', patientName: '長田 直樹',     status: 'isolation',    gender: 'M', age: 37 },
    { bed: 'B', patientId: 'P067', patientName: '浜田 由美子',   status: 'stable',       gender: 'F', age: 49 },
    { bed: 'C', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'D', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'E', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
    { bed: 'F', patientId: null,   patientName: null,            status: 'empty',        gender: null, age: null },
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

// ===== 患者マスタ =====
export const PATIENTS: Patient[] = [
  // 第１病棟
  { id: 'P001', name: '山田 太郎',     age: 52, gender: 'M', wardId: 'ward1', roomNumber: '101', bedLabel: 'A', status: 'stable',      admitDate: '2026-01-10', doctorName: '田村 医師', diagnosis: '統合失調症' },
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
  { id: 'ADM001', patientId: 'P019', patientName: '新井 太一',     type: '入院', status: '指示済',   scheduledDate: '2026-02-24', doctorName: '田村 医師', roomNumber: '—',   bedLabel: '—', wardId: 'ward1' },
  { id: 'ADM002', patientId: 'P003', patientName: '鈴木 一郎',     type: '退院', status: '手続中',   scheduledDate: '2026-02-25', doctorName: '岸本 医師', roomNumber: '102', bedLabel: 'A', wardId: 'ward1' },
  { id: 'ADM003', patientId: 'P020', patientName: '藤田 明日香',   type: '入院', status: '手続完了', scheduledDate: '2026-02-23', doctorName: '森田 医師', roomNumber: '201', bedLabel: 'B', wardId: 'ward2' },
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
