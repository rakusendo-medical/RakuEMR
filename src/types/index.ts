// ===== 共通型定義 =====

/** 病棟 */
export type WardId = "ward1" | "ward2";
export const WARD_LABELS: Record<WardId, string> = {
  ward1: "第１病棟",
  ward2: "第２病棟",
};

/** 患者ステータス */
export type PatientStatus =
  | "stable"
  | "observation"
  | "isolation"
  | "restraint"
  | "outing"
  | "empty";

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  muiColor: "success" | "warning" | "error" | "info" | "default";
}

/** 性別 */
export type Gender = "M" | "F";

// ===== エンティティ型 =====

/** ベッド情報 */
export interface Bed {
  bed: string;
  patientId: string | null;
  patientName: string | null;
  status: PatientStatus;
  gender: Gender | null;
  age: number | null;
}

/** 病室情報 */
export interface Room {
  roomNumber: string;
  wardId: WardId;
  beds: Bed[];
}

/** 患者情報 */
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  wardId: WardId;
  roomNumber: string;
  bedLabel: string;
  status: PatientStatus;
  admitDate: string;
  doctorName: string;
  diagnosis?: string;
  insuranceType?: string;
  // カルテ画面用の追加フィールド
  nameKana?: string;
  bloodType?: string;
  birthDate?: string;
  wardName?: string;
  nurse?: string;
  daycare?: string;
}

/** オーダ種別 */
export type OrderType =
  | "処方"
  | "注射"
  | "心理検査"
  | "ECT"
  | "入院定時"
  | "IF"
  | "文字";

/** オーダステータス */
export type OrderStatus = "指示済" | "実施中" | "予定" | "中止" | "実施済";

/** オーダ */
export interface Order {
  id: string;
  patientId: string;
  patientName: string;
  type: OrderType;
  content: string;
  schedule: string;
  status: OrderStatus;
  startDate: string;
  days: number;
  timeSlots?: string[];
  doctorName: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

/** 看護記録 */
export interface NursingRecord {
  id: string;
  patientId: string;
  date: string;
  time: string;
  author: string;
  content: string;
  editHistory?: {
    editedAt: string;
    editedBy: string;
    previousContent: string;
  }[];
}

/** バイタルサイン */
export interface VitalSign {
  id: string;
  patientId: string;
  date: string;
  timeSlot: string;
  bpSystolic?: number;
  bpDiastolic?: number;
  pulse?: number;
  temperature?: number;
  respiration?: number;
  spo2?: number;
  weight?: number;
}

/** フローシートデータ（日次） */
export interface FlowsheetDaily {
  date: string;
  patientId: string;
  mealBreakfast?: string;
  mealLunch?: string;
  mealDinner?: string;
  medMorning?: boolean;
  medNoon?: boolean;
  medEvening?: boolean;
  medNight?: boolean;
  bath?: boolean;
  sheetChange?: boolean;
  remarks?: string;
}

/** 入退院指示ステータス */
export type AdmissionStatus = "指示済" | "手続中" | "手続完了" | "キャンセル";

/** 入退院指示 */
export interface AdmissionOrder {
  id: string;
  patientId: string;
  patientName: string;
  type: "入院" | "退院";
  status: AdmissionStatus;
  scheduledDate: string;
  doctorName: string;
  roomNumber: string;
  bedLabel: string;
  wardId: WardId;
  notes?: string;
}

/** 移動歴 */
export interface TransferHistory {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  fromRoom: string;
  toRoom: string;
  reason: string;
}

/** 入院歴 */
export interface AdmissionHistory {
  id: string;
  patientId: string;
  patientName: string;
  admitDate: string;
  dischargeDate?: string;
  wardId: WardId;
  roomNumber: string;
  doctorName: string;
  status: "入院中" | "退院済" | "キャンセル";
}

/** 隔離拘束種別 */
export type IsolationType = "隔離" | "拘束";

/** 隔離拘束指示 */
export interface IsolationOrder {
  id: string;
  patientId: string;
  patientName: string;
  type: IsolationType;
  startDatetime: string;
  endDatetime?: string;
  wardId: WardId;
  roomNumber: string;
  doctorName: string;
  primaryConfirmedBy?: string;
  secondaryConfirmedBy?: string;
  linkedNursingRecordId?: string;
  linkedMedicalRecordId?: string;
}

/** 観察記録 */
export type ObservationState =
  | "未記入"
  | "浅眠"
  | "落ち着き"
  | "不穏"
  | "睡眠"
  | "中途覚醒";

export interface ObservationRecord {
  id: string;
  isolationOrderId: string;
  patientId: string;
  date: string;
  time: string;
  state: ObservationState;
  note?: string;
}

/** 行動範囲 */
export type BehaviorRangeLevel =
  | "病棟内"
  | "院内"
  | "院外許可あり"
  | "開放病棟";

export interface BehaviorRange {
  id: string;
  patientId: string;
  patientName: string;
  level: BehaviorRangeLevel;
  startDate: string;
  endDate?: string;
  doctorName: string;
  wardId: WardId;
  notes?: string;
}

/** 外出外泊種別 */
export type OutingType = "外出" | "外泊";

/** 外出外泊申請ステータス */
export type OutingStatus = "申請中" | "許可" | "不許可";

/** 外出外泊 */
export interface OutingRecord {
  id: string;
  patientId: string;
  patientName: string;
  type: OutingType;
  status: OutingStatus;
  startDatetime: string;
  endDatetime: string;
  wardId: WardId;
  returnedAt?: string;
  approvedBy?: string;
  method: "application" | "direct";
}

/** 患者スケジュール */
export interface PatientScheduleEvent {
  id: string;
  patientId: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  category: "order" | "rehab" | "meeting" | "outing" | "other";
  notes?: string;
}

/** リハビリ（作業療法）指示 */
export interface RehabOrder {
  id: string;
  patientId: string;
  patientName: string;
  content: string;
  doctorName: string;
  startDate: string;
  frequency: string;
  status: "指示済" | "実施中" | "終了";
}

/** リハビリ日報 */
export interface RehabDailyReport {
  id: string;
  rehabOrderId: string;
  patientId: string;
  date: string;
  attendance: boolean;
  content: string;
  therapist: string;
  notes?: string;
}

/** リハビリ評価 */
export interface RehabEvaluation {
  id: string;
  rehabOrderId: string;
  patientId: string;
  date: string;
  evaluator: string;
  content: string;
  type: "定期" | "開始時" | "終了時";
}

/** 看護ケア予定 */
export interface NursingCareSchedule {
  id: string;
  patientId: string;
  patientName: string;
  careType: string;
  scheduledDate: string;
  wardId: WardId;
  completed: boolean;
  notes?: string;
}

/** 書類 */
export interface Document {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  type: "入院時" | "退院時" | "隔離拘束" | "行動制限" | "その他";
  createdAt: string;
  createdBy: string;
  status: "作成中" | "完成" | "登録済";
}

/** 看護管理日誌 */
export interface NursingDiaryEntry {
  id: string;
  date: string;
  wardId: WardId;
  author: string;
  content: string;
  patientCount: number;
  admissions: number;
  discharges: number;
  incidents?: string;
}

/** 病棟日誌 */
export interface WardDiaryEntry {
  id: string;
  date: string;
  wardId: WardId;
  author: string;
  content: string;
  editHistory?: { editedAt: string; editedBy: string }[];
}

/** 外来受診ステータス */
export type OutpatientStatus = "待機中" | "診察中" | "会計待ち" | "完了";

/** 外来受診 */
export interface OutpatientVisit {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: Gender;
  department: string;
  doctorName: string;
  visitType: "初診" | "再診";
  appointmentTime: string;
  receptionTime?: string;
  status: OutpatientStatus;
  notes?: string;
}

// ===== ナビゲーション =====

export interface NavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
}

// ===== カルテ画面用型定義 =====

export interface InsuranceInfo {
  type: string;
  validPeriod: string;
  insurerNumber: string;
  recordNumber: string;
  insuredNumber: string;
  copay: string;
}

export interface DiagnosisInfo {
  mainDiagnosis: string;
  mainDiagnosisCode: string;
  mainDiagnosisDate: string;
  subDiagnosis: string;
  subDiagnosisCode: string;
  subDiagnosisDate: string;
}

export interface AllergyInfo {
  drug: string[];
  food: string[];
  other: string[];
}

export interface StaffInfo {
  responsibleTeam: string;
  wardManagement: string;
  staffManagement: string;
  physicalRehab: string;
  independenceLevel: string;
  dementiaCareLevel: string;
}

export interface AdlInfo {
  barthel: string;
  gaf: string;
  gafDate: string;
  planDate: string;
}

export type RecordCategory =
  | "医師記録"
  | "看護記録"
  | "看護サマリ"
  | "クリニカルパス"
  | "作業療法記録"
  | "栄養指導記録"
  | "入退院記録";

export interface MedicalRecord {
  id: string;
  date: string;
  dayOfWeek: string;
  category: RecordCategory;
  author: string;
  authorRole: string;
  content: string;
  tags: string[];
  orderNumber?: string;
  timestamp: string;
  likes: number;
  comments: number;
}

export interface LifeEvent {
  date: string;
  type: "治療歴" | "デイケア" | "学歴・経歴" | "エピソード" | "生活歴・現病歴";
  label: string;
}

export interface KarteTab {
  id: string;
  label: string;
  active?: boolean;
}
