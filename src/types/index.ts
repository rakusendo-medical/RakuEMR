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

/** ベッド/患者付与の運用フラグ（複数同時付与可） */
export type BedFlag =
  | "isolation"      // 隔離
  | "restraint"      // 拘束
  | "outing"         // 外出
  | "overnight"      // 外泊
  | "reportRequired" // 要報告
  | "deposit";       // 預り金

export interface BedFlagConfig {
  key: BedFlag;
  label: string;
  short: string; // 1文字略号
  color: string;
}

/** 標準診療種類（カルテ初期表示分岐用） */
export type PrimaryRecordType = "karte" | "nursing-record";

/** 入院ステータス（入院／外来／退院の判定用） */
export type AdmissionState = "inpatient" | "outpatient" | "discharged";

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
  /** 運用フラグ（隔離・拘束・外出・外泊・要報告・預り金 など、複数付与可） */
  flags?: BedFlag[];
  /** マスタで使用不可指定されたベッド（網掛け表示・操作不可） */
  disabled?: boolean;
  /** 移動予定が登録されている場合 */
  hasScheduledMove?: boolean;
}

/** 未割当患者（病棟・病室・ベッドのいずれかが「仮」） */
export interface UnassignedPatient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  /** 指定病棟（'tentative' = 仮） */
  designatedWardId: WardId | "tentative";
  /** 指定病室（'tentative' = 仮） */
  designatedRoomNumber: string | "tentative";
  /** 指定ベッド（'tentative' = 仮） */
  designatedBedLabel: string | "tentative";
  scheduledAdmitAt: string;
  doctorName: string;
  notes?: string;
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
  /** カルテ初期表示の標準診療種類。未設定時は 'karte' とみなす */
  primaryRecordType?: PrimaryRecordType;
  /** 入院ステータス。未設定時は 'inpatient' とみなす（PATIENTS は基本入院中なため） */
  admissionState?: AdmissionState;
  // ===== ep-09 患者情報 Phase 2 =====
  /** 担当職員1〜10 のID列（職員マスタ参照、最大10名）。空配列または未設定で「担当なし」 */
  assignedStaffIds?: string[];
  /** 責任レベル（区分マスタ）。一覧画面の責任レベル列で表示 */
  responsibilityLevel?: string;
  /** 診察医ID列（主治医とは別）。「診察医登録分も表示」フィルタで利用 */
  examinerIds?: string[];
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

/** 入院歴（ep-04） */
export interface AdmissionHistory {
  id: string;
  patientId: string;
  patientName: string;
  /** 入院期間の識別子。同一期間内の形態変更レコードは同じ periodId を持つ */
  periodId: string;
  /** この形態の開始日時（最初の形態 = 入院日、形態変更レコード = 形態変更日時） */
  admitDate: string;
  /** この形態の終了日時。退院済または形態変更前なら値あり、現在の形態なら undefined */
  dischargeDate?: string;
  wardId: WardId;
  roomNumber: string;
  doctorName: string;
  status: "入院中" | "退院済" | "キャンセル";
  /** 形態変更レコードか（false/undefined = initial 入院レコード） */
  isAdmitFormChange?: boolean;
  /** 入院形態（任意入院／医療保護入院 等） */
  admitForm?: string;
  /** 入院決定理由（最大 3000 文字） */
  admitReason?: string;
  /** 退院決定理由（最大 3000 文字、退院済のみ） */
  dischargeReason?: string;
  /** 退院区分 */
  dischargeCategory?: "退院" | "退院後通院" | "退院後転院";
  /** 転帰 */
  outcome?: string;
  /** 退院後処置（最大 1000 文字） */
  postDischargeAction?: string;
  /** 帰住先（住居区分マスタから選択） */
  returnTo?: string;
}

// ===== ep-05 隔離拘束指示 =====

/** 隔離拘束種別（旧表現、後方互換）
 *  @deprecated 将来削除予定。新コードは `IsolationOrder.subtype` を参照すること。 */
export type IsolationType = "隔離" | "拘束";

/** 隔離拘束区分（隔離・拘束の併用「隔離拘束」も表現） */
export type IsolationSubtype = "隔離" | "拘束" | "隔離拘束";

/** 隔離拘束指示の操作種別 */
export type IsolationOperation = "開始" | "解除" | "継続" | "変更";

/** 開放時間 1 件分（最大 9 件入力） */
export interface ReleaseTimeEntry {
  /** HH:mm */
  start: string;
  /** HH:mm */
  end: string;
}

/** 告知書（隔離拘束指示箋）印刷情報 */
export interface IsolationNoticePrint {
  printedAt?: string;
  /** 印刷時の編集後内容（カルテ所見の写し） */
  content?: string;
  /** 面接書式（マスタ） */
  interviewForm?: string;
}

/** 隔離拘束指示 */
export interface IsolationOrder {
  id: string;
  patientId: string;
  patientName: string;
  /** 隔離 or 拘束（旧表現、後方互換）
   *  @deprecated 将来削除予定。新コードは `subtype` を参照。
   *  併用「隔離拘束」を表現できないため、ep-05 以降は `subtype` を併記する。 */
  type: IsolationType;
  /** 区分（隔離拘束併用も表現可。未設定の既存レコードは `type` から導出） */
  subtype?: IsolationSubtype;
  /** 操作種別（開始／解除／継続／変更） */
  operation?: IsolationOperation;
  startDatetime: string;
  endDatetime?: string;
  wardId: WardId;
  roomNumber: string;
  doctorName: string;
  /** 拘束部位（拘束系・隔離拘束系の開始／継続／変更指示時のみ。解除指示には記載されない） */
  restraintParts?: string[];
  /** 開放時間（最大 9 件、開始／継続／変更指示時のみ） */
  releaseTimes?: ReleaseTimeEntry[];
  /** 期限管理対象として登録された隔離拘束時文書 */
  linkedDocumentChecks?: string[];
  /** 告知書（隔離拘束指示箋）印刷状態 */
  noticePrint?: IsolationNoticePrint;
  /** 「指示」段階（即時確定でない）フラグ */
  isPending?: boolean;
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

// ===== 看護計画・定期評価 =====

/** 看護問題 */
export interface NursingProblem {
  id: string;
  no: number;
  problem: string;      // 問題点
  goal: string;         // 目標
  planDate: string;     // 立案日
  observation: string;  // O: 観察
  treatment: string;    // T: 治療的ケア
  education: string;    // E: 教育
}

/** 看護計画 */
export interface NursingPlan {
  patientId: string;
  patientName: string;
  wardId: WardId;
  roomNumber: string;
  doctorName: string;
  periodStart: string;
  longTermGoal: string;
  problems: NursingProblem[];
  nextEvaluationDue: string;
}

/** 定期評価エントリ */
export interface EvaluationEntry {
  id: string;
  problemId: string;
  stageIndex: number;
  evaluationType: '評価' | 'A評価' | 'B評価';
  content: string;
  evaluator: string;
  evaluatedAt: string;
}

/** 評価ステージ（列） */
export interface EvaluationStage {
  label: string;           // 列ヘッダラベル
  date: string;            // 評価日
  clinicalPathStage: string; // クリニカルパスステージ名
  stageLabel: string;      // ステージ名
}

/** 定期評価レコード */
export interface PeriodicEvaluationRecord {
  patientId: string;
  patientName: string;
  wardId: WardId;
  roomNumber: string;
  doctorName: string;
  periodStart: string;
  longTermGoal: string;
  displayStageCount: number;
  stages: EvaluationStage[];
  evaluations: EvaluationEntry[];
  nextEvaluationDue: string;
}
