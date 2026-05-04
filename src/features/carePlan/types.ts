export type UUID = string;
export type ISODate = string;
export type ISODateTime = string;

export type Sex = 'M' | 'F' | 'Other';
export type Priority = 'high' | 'medium' | 'low';
export type ProblemDomain =
  | '安全'
  | '身体'
  | '精神'
  | '社会'
  | '日常生活'
  | '服薬'
  | 'セルフケア';

export const PROBLEM_DOMAINS: ProblemDomain[] = [
  '安全',
  '身体',
  '精神',
  '社会',
  '日常生活',
  '服薬',
  'セルフケア',
];

export type CarePlanStatus = 'draft' | 'active' | 'closed';

export type ProblemItemStatus =
  | 'draft'
  | 'active'
  | 'evaluating'
  | 'closed_resolved'
  | 'closed_cancelled'
  | 'closed_changed';

export type EvaluationAchievement = 'not_achieved' | 'partial' | 'achieved';

export interface Nurse {
  id: UUID;
  name: string;
}

export interface Patient {
  id: UUID;
  name: string;
  age: number;
  sex: Sex;
  roomNo: string;
  admissionDate: ISODate;
  primaryDiagnosis: string;
  primaryNurseId: UUID;
}

export interface NandaDiagnosis {
  code: string;
  name: string;
  domain: ProblemDomain;
  frequentlyUsed: boolean;
}

export interface OteContent {
  observation: string[];
  therapy: string[];
  education: string[];
}

export interface ProblemItem {
  id: UUID;
  carePlanId: UUID;
  domain: ProblemDomain;
  priority: Priority;
  nandaCode: string;
  /** 問題点（手入力テキスト）。NANDA 診断名をベースに患者個別の事情を加味して記述する。
   *  未設定の既存データは NANDA マスタ名にフォールバック表示。新規/編集時は必須。 */
  problemStatement?: string;
  shortTermGoal: string;
  ote: OteContent;
  status: ProblemItemStatus;
  /** 立案日 = 計画明細レコード作成日。適用日も同義として運用。 */
  createdAt: ISODate;
  createdBy: UUID;
  /** 看護診断として確定した日。未設定時は createdAt にフォールバック。
   *  運用上、立案より後に確定するケースで別管理可能（mock 改修フェーズ 1 で追加）。 */
  diagnosedAt?: ISODate;
  lastEvaluatedAt?: ISODate;
  nextEvaluationDueAt?: ISODate;
  closedAt?: ISODate;
  closeReason?: string;
  copiedFrom?: {
    sourceType: 'template' | 'other_patient' | 'past_plan';
    sourceId: UUID;
  };
}

export interface Evaluation {
  id: UUID;
  problemItemId: UUID;
  evaluatedAt: ISODate;
  evaluatedBy: UUID;
  achievement: EvaluationAchievement;
  findings: string;
  nextStatus: ProblemItemStatus;
}

export interface CarePlan {
  id: UUID;
  patientId: UUID;
  longTermGoal: string;
  status: CarePlanStatus;
  createdAt: ISODate;
  createdBy: UUID;
  /** 計画期間の開始日。立案時に必須。未補完の既存データは createdAt にフォールバック扱い。 */
  periodStart?: ISODate;
  /** 計画期間の終了日。継続中なら undefined。終了時（次期間立案 or 明示クローズ）に設定。 */
  periodEnd?: ISODate;
  closedAt?: ISODate;
  supersededByCarePlanId?: UUID;
}

export interface TemplateProblemItem {
  domain: ProblemDomain;
  priority: Priority;
  nandaCode: string;
  shortTermGoal: string;
  ote: OteContent;
}

export interface Template {
  id: UUID;
  name: string;
  longTermGoal: string;
  problemItems: TemplateProblemItem[];
}

export interface ChangeLog {
  id: UUID;
  targetType: 'care_plan' | 'problem_item' | 'evaluation';
  targetId: UUID;
  action: 'create' | 'update' | 'close' | 'evaluate';
  actorId: UUID;
  actorName: string;
  at: ISODateTime;
  summary: string;
}

export type DashboardCategory = 'overdue' | 'dueThisMonth' | 'notPlanned' | 'evaluating';
