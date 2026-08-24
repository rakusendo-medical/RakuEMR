// ===== ep-10 看護実施（フローシート）型定義 =====
// 本 feature 内に閉じた型定義。共有 types/index.ts には影響させない。

export type UUID = string;
export type ISODate = string;       // YYYY-MM-DD
export type ISODateTime = string;   // YYYY-MM-DDTHH:mm:ss
export type HHmm = string;          // HH:mm

export type ShiftType = 'night' | 'day' | 'evening'; // 深夜 / 日勤 / 準夜

// 記録形式は SOAP／経時記録の 2 形式（2026-08-24 確定。旧 focus/free は廃止）
export type RecordFormType = 'soap' | 'chronological';

export type ChangeOpType = 'register' | 'update';

export type OrderKindCode = '薬' | '注' | '検' | '処' | '画' | '心' | 'E';
export type OrderStatus = 'pending' | 'done';

export type LabResultStatus = 'pending' | 'available';

export type MovementSegmentKind = 'room' | 'isolation' | 'restraint' | 'restriction' | 'outing' | 'leave';

export type CareItemType = 'text' | 'radio' | 'combo' | 'check' | 'check-multi';

export type FlowsheetTab = 'flowsheet' | 'isolation' | 'sleep' | 'observation';

export type ConnectionTarget = 'flowsheet' | 'handover' | 'wardJournal' | 'interview' | 'reportTo';

export type ReportRoleCode = '作' | '確' | '両';

// ----- マスタ -----

export interface CareItemMaster {
  id: UUID;
  name: string;
  type: CareItemType;
  unit?: string;
  options?: string[];        // radio / combo / check で使用
  inputWindow?: { from: HHmm; to: HHmm }; // 入力可能時間
  standardMinutes?: number;  // 標準所要時間（ADL 等。表示は「名称(N分)」）
}

export interface FlowsheetPatternMaster {
  id: UUID;
  name: string;
  careItemIds: UUID[];       // このパターンで表示／入力可能なケア項目
}

export interface NursingRecordTemplate {
  id: UUID;
  name: string;
  formType: RecordFormType;
  body: NursingRecordBody;
}

// ----- 適用情報 -----

export interface FlowsheetPatternApplication {
  id: UUID;
  patientId: UUID;
  startDate: ISODate;
  patternId: UUID | null;     // null = 「パターンなし」
  appliedAt: ISODateTime;
  appliedBy: UUID;
}

// ----- バイタル -----

export interface VitalEntry {
  id: UUID;
  patientId: UUID;
  date: ISODate;
  time: HHmm;                 // 必須
  bpSys?: number;             // BP（上）
  bpDia?: number;             // BP（下）
  resp?: number;              // R
  pulse?: number;             // P
  temp?: number;              // T
  spo2?: number;              // S
  weight?: number;            // W
  recordedBy: UUID;
  registeredAt: ISODateTime;
  updatedAt?: ISODateTime;
}

// ----- ケア記録（フローシート編集ダイアログから登録） -----

export interface CareRecord {
  id: UUID;
  patientId: UUID;
  date: ISODate;
  careItemId: UUID;
  value: string | number | string[] | boolean;
  // 服薬等で投薬者を持つ項目用
  administeredBy?: UUID;
  registeredAt: ISODateTime;
  updatedAt?: ISODateTime;
  registeredBy: UUID;
}

// ----- サイン -----

export interface SignEntry {
  id: UUID;
  patientId: UUID;
  date: ISODate;
  shift: ShiftType;
  signerId: UUID;
  registeredAt: ISODateTime;
  updatedAt?: ISODateTime;
}

// ----- 看護記録（個別 / 一括 共通モデル） -----

export interface NursingRecordSoapBody {
  s: string;
  o: string;
  a: string;
  p: string;
}
// 経時記録: 行頭に時刻（HH:mm）を付けた平文。
// 「時刻＋本文」の行構造による構造化入力は現時点スコープ外（将来、看護記録に限らず
// 多職種の部門診療録全てを対象にした共通の仕組みとして検討余地を残すため、
// body は formType 別 union のまま拡張できる形にしておく）。
export interface NursingRecordChronologicalBody {
  text: string;
}

export type NursingRecordBody =
  | { formType: 'soap'; body: NursingRecordSoapBody }
  | { formType: 'chronological'; body: NursingRecordChronologicalBody };

export interface NursingRecordReportTarget {
  staffId: UUID;
  role: ReportRoleCode;
}

export interface NursingRecord {
  id: UUID;
  patientId: UUID;
  title: string;              // 最大 20 文字
  recordedAt: ISODateTime;    // 記載日時（勤務帯はここから自動判定）
  shift: ShiftType;
  formType: RecordFormType;
  body: NursingRecordBody;
  connections: ConnectionTarget[];
  reportTargets: NursingRecordReportTarget[];
  tags: string[];
  // 公開/非公開（isPublished）は 2026-08-24 に削除（使い方が定まらないため。必要になれば再検討）
  recordedBy: UUID;
  registeredAt: ISODateTime;
  updatedAt?: ISODateTime;
  updatedBy?: UUID;
  // 関連付け
  relatedRecordIds?: UUID[];
  // 削除（論理）
  deletedAt?: ISODateTime;
  deletedBy?: UUID;
}

// ----- 予定オーダ／検査結果（フローシート表示用、本 feature 内モック） -----

export interface ScheduledOrder {
  id: UUID;
  patientId: UUID;
  date: ISODate;
  kind: OrderKindCode;
  name: string;
  status: OrderStatus;
}

export interface LabResultEntry {
  id: UUID;
  patientId: UUID;
  date: ISODate;
  ticketName: string;
  status: LabResultStatus;
  // 簡易グラフ用に複数項目を保持
  items: { name: string; value: number; unit: string }[];
}

// ----- 移動状況（フローシート上部の帯表示用） -----

export interface MovementSegment {
  id: UUID;
  patientId: UUID;
  kind: MovementSegmentKind;
  startAt: ISODateTime;
  endAt?: ISODateTime;
  label?: string; // 病室番号など補助
}

// ----- 睡眠・活動 -----

export interface SleepLog {
  id: UUID;
  patientId: UUID;
  startAt: ISODateTime;
  endAt: ISODateTime;
  state: string;              // 睡眠状態（マスタ管理。例: 入眠 / 覚醒 / 離床）
  registeredAt: ISODateTime;
  registeredBy: UUID;
}

// ----- 履歴 / 監査 -----

export interface FlowsheetChangeLog {
  id: UUID;
  targetType: 'vital' | 'care_record' | 'sign' | 'pattern' | 'nursing_record' | 'sleep_log';
  targetId: UUID;
  op: ChangeOpType;
  patientId: UUID;
  date?: ISODate;
  patternId?: UUID | null;     // ケア記録履歴のパターン名表示用
  actorId: UUID;
  at: ISODateTime;
  summary: string;
}

// ----- スタッフ（最小限、本 feature 内モック） -----

export interface FlowsheetStaff {
  id: UUID;
  name: string;
  role: string; // 看護師 / 主治医 / 看護師長 等
  affiliation?: string; // 所属区分（ログオン者の病棟初期表示用）
}

// ----- マスタ設定（プロパティ） -----

export interface FlowsheetPropertyConfig {
  // 未来日入力は常に不可（固定）。マスタによる制御（旧 validateFuture / confirmFuture）は 2026-08-17 に廃止。
  medicationInitialOperator: 'blank' | 'logon';  // 投薬者初期表示
  signRoleLock: 'logonOnly' | 'allowOthers';     // 実施者ロック
  defaultRecordForm: RecordFormType;             // 部門側記事形式の初期値
  bulkSignDefault: boolean;                      // [フローシートへサインする] 初期チェック
  inputTargetOnlyDefault: boolean;               // [入力対象患者のみ] 初期チェック
  shiftStartTimes: { day: HHmm; evening: HHmm; night: HHmm }; // 勤務帯開始時間
  recordsPerPage: number;                         // 部門記録簿のページ件数
  forbiddenChars: string[];                       // フローシート編集の禁則文字
}
