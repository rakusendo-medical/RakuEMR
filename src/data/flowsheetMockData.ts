export interface FlowsheetDay {
  date: string;
  dayOfWeek: string;
  hospitalDay: number;
  room: string;
  schedule?: string;
}

export interface VitalRecord {
  date: string;
  time: 'morning' | 'afternoon' | 'evening';
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  temperature?: number;
  spo2?: number;
  weight?: number;
}

export interface MealRecord {
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface ExcretionRecord {
  date: string;
  urine: string;
  stool: string;
}

export interface BathRecord {
  date: string;
  type: string;
}

export interface NurseStaffRecord {
  date: string;
  dayShift: string[];
  nightShift: string[];
}

export const flowsheetDays: FlowsheetDay[] = [
  { date: '2016/12/09', dayOfWeek: '金', hospitalDay: 514, room: 'E10号室' },
  { date: '2016/12/10', dayOfWeek: '土', hospitalDay: 515, room: 'E10号室' },
  { date: '2016/12/11', dayOfWeek: '日', hospitalDay: 516, room: 'E10号室' },
  { date: '2016/12/12', dayOfWeek: '月', hospitalDay: 517, room: 'E10号室' },
  { date: '2016/12/13', dayOfWeek: '火', hospitalDay: 518, room: 'E10号室' },
  { date: '2016/12/14', dayOfWeek: '水', hospitalDay: 519, room: 'E10号室' },
  { date: '2016/12/15', dayOfWeek: '木', hospitalDay: 520, room: 'E10号室' },
  { date: '2016/12/16', dayOfWeek: '金', hospitalDay: 521, room: 'E10号室' },
];

export const vitalRecords: VitalRecord[] = [
  { date: '2016/12/09', time: 'morning', systolic: 128, diastolic: 78, pulse: 72, temperature: 36.4, spo2: 98 },
  { date: '2016/12/09', time: 'afternoon', systolic: 132, diastolic: 82, pulse: 76, temperature: 36.6 },
  { date: '2016/12/10', time: 'morning', systolic: 122, diastolic: 74, pulse: 68, temperature: 36.2, spo2: 97 },
  { date: '2016/12/10', time: 'afternoon', systolic: 136, diastolic: 86, pulse: 80, temperature: 36.8 },
  { date: '2016/12/11', time: 'morning', systolic: 118, diastolic: 72, pulse: 70, temperature: 36.3, spo2: 98 },
  { date: '2016/12/11', time: 'afternoon', systolic: 140, diastolic: 88, pulse: 78, temperature: 37.0 },
  { date: '2016/12/12', time: 'morning', systolic: 125, diastolic: 76, pulse: 74, temperature: 36.5, spo2: 97 },
  { date: '2016/12/12', time: 'afternoon', systolic: 130, diastolic: 80, pulse: 72, temperature: 36.7 },
  { date: '2016/12/13', time: 'morning', systolic: 120, diastolic: 70, pulse: 66, temperature: 36.1, spo2: 99 },
  { date: '2016/12/13', time: 'afternoon', systolic: 134, diastolic: 84, pulse: 78, temperature: 36.9 },
  { date: '2016/12/14', time: 'morning', systolic: 126, diastolic: 76, pulse: 70, temperature: 36.4, spo2: 98 },
  { date: '2016/12/14', time: 'afternoon', systolic: 138, diastolic: 86, pulse: 82, temperature: 37.1 },
  { date: '2016/12/15', time: 'morning', systolic: 124, diastolic: 74, pulse: 68, temperature: 36.3, spo2: 97 },
  { date: '2016/12/15', time: 'afternoon', systolic: 130, diastolic: 80, pulse: 74, temperature: 36.6 },
  { date: '2016/12/16', time: 'morning', systolic: 120, diastolic: 72, pulse: 70, temperature: 36.2, spo2: 98 },
  { date: '2016/12/16', time: 'afternoon', systolic: 128, diastolic: 78, pulse: 76, temperature: 36.5 },
];

export const mealRecords: MealRecord[] = [
  { date: '2016/12/09', breakfast: '○', lunch: '○', dinner: '○' },
  { date: '2016/12/10', breakfast: '○', lunch: '○', dinner: '○' },
  { date: '2016/12/11', breakfast: '○', lunch: '○', dinner: '○' },
  { date: '2016/12/12', breakfast: '○', lunch: '△', dinner: '○' },
  { date: '2016/12/13', breakfast: '○', lunch: '○', dinner: '○' },
  { date: '2016/12/14', breakfast: '○', lunch: '○', dinner: '○' },
  { date: '2016/12/15', breakfast: '○', lunch: '○', dinner: '○' },
  { date: '2016/12/16', breakfast: '○', lunch: '○', dinner: '○' },
];

export const excretionRecords: ExcretionRecord[] = [
  { date: '2016/12/09', urine: '全量', stool: '1/4' },
  { date: '2016/12/10', urine: '全量', stool: '2/3' },
  { date: '2016/12/11', urine: '全量', stool: '少量' },
  { date: '2016/12/12', urine: '全量', stool: '2/3' },
  { date: '2016/12/13', urine: '全量', stool: '少量' },
  { date: '2016/12/14', urine: '全量', stool: '1/3' },
  { date: '2016/12/15', urine: '全量', stool: '2/3' },
  { date: '2016/12/16', urine: '全量', stool: '1/4' },
];

export const bathRecords: BathRecord[] = [
  { date: '2016/12/09', type: 'シャワー浴' },
  { date: '2016/12/10', type: '' },
  { date: '2016/12/11', type: '入浴' },
  { date: '2016/12/12', type: '' },
  { date: '2016/12/13', type: '入浴' },
  { date: '2016/12/14', type: '' },
  { date: '2016/12/15', type: 'シャワー浴' },
  { date: '2016/12/16', type: '入浴' },
];

export const nurseStaffRecords: NurseStaffRecord[] = [
  { date: '2016/12/09', dayShift: ['看護花', '看護太'], nightShift: ['看護花'] },
  { date: '2016/12/10', dayShift: ['看護花'], nightShift: ['看護太'] },
  { date: '2016/12/11', dayShift: ['看護花', '看護太'], nightShift: ['看護花'] },
  { date: '2016/12/12', dayShift: ['看護花'], nightShift: ['看護太'] },
  { date: '2016/12/13', dayShift: ['看護花', '看護太'], nightShift: ['看護花'] },
  { date: '2016/12/14', dayShift: ['看護花'], nightShift: ['看護太'] },
  { date: '2016/12/15', dayShift: ['看護花', '看護太'], nightShift: ['看護花'] },
  { date: '2016/12/16', dayShift: ['看護花'], nightShift: ['看護太'] },
];

export const orderCategories = [
  { label: '予定オーダ', color: '#e3f2fd' },
  { label: '臨時処方', color: '#fff3e0' },
  { label: '検査', color: '#e8f5e9' },
];

export const observationRows = [
  { label: '体温(税料)', values: ['有熱度', '有熱度', '有熱度', '有熱度', '有熱度', '有熱度', '有熱度', '有熱度'] },
  { label: '部門/別他設', values: ['新規/介/仙', '新規/介/仙', '新規/介/仙', '新規/介/仙', '新規/介/仙', '新規/介/仙', '新規/介/仙', '新規/介/仙'] },
];

export const patternOptions = ['全パターン'];

export const flowsheetSubTabs = [
  { label: 'フローシート', active: true },
  { label: '関連観察' },
  { label: '結期動計' },
];
