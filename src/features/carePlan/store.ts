import { create } from 'zustand';
import type {
  CarePlan,
  ChangeLog,
  Evaluation,
  ISODate,
  NandaDiagnosis,
  Nurse,
  Patient,
  ProblemItem,
  ProblemItemStatus,
  Template,
  UUID,
} from './types';
import {
  CARE_PLANS,
  DEFAULT_NURSE_ID,
  EVALUATIONS,
  INITIAL_CHANGE_LOGS,
  NANDA_MASTER,
  NURSES,
  PATIENTS,
  PROBLEM_ITEMS,
  TEMPLATES,
  TODAY,
} from './mockData';

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const addMonthISO = (iso: string, months: number) => {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

const addDayISO = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

/** 計画の有効期間を取得（periodStart 未設定なら createdAt で代用、periodEnd 未設定なら継続中） */
const planPeriod = (p: CarePlan): { start: string; end?: string } => ({
  start: p.periodStart ?? p.createdAt,
  end: p.periodEnd,
});

/** 2 区間が重複するか（end が undefined は無限大とみなす） */
const periodsOverlap = (
  a: { start: string; end?: string },
  b: { start: string; end?: string },
): boolean => {
  // a.end < b.start なら離れている、b.end < a.start なら離れている、それ以外は重複
  if (a.end !== undefined && a.end < b.start) return false;
  if (b.end !== undefined && b.end < a.start) return false;
  return true;
};

interface CarePlanState {
  nurses: Nurse[];
  currentNurseId: UUID;
  patients: Patient[];
  carePlans: CarePlan[];
  problemItems: ProblemItem[];
  evaluations: Evaluation[];
  templates: Template[];
  nandaMaster: NandaDiagnosis[];
  changeLogs: ChangeLog[];

  switchNurse: (nurseId: UUID) => void;
  /** 計画を新規作成。periodStart 省略時は TODAY。
   *  同患者に「継続中（periodEnd 未設定）の active 計画」があれば、その計画の
   *  periodEnd を「新計画 periodStart - 1日」、status を 'closed' に自動更新する（案 A）。 */
  createCarePlan: (patientId: UUID, longTermGoal: string, periodStart?: ISODate) => CarePlan;
  activateCarePlan: (carePlanId: UUID) => void;
  updateLongTermGoal: (carePlanId: UUID, longTermGoal: string) => void;
  /** 立案日・長期目標・期間情報の編集。評価期限などには影響させない。
   *  期間情報の編集は同患者の他計画と重複しないこと（重複時は何もせずエラーをログに出して return）。 */
  updateCarePlanMeta: (carePlanId: UUID, patch: { longTermGoal?: string; createdAt?: string; periodStart?: ISODate; periodEnd?: ISODate | null }) => void;
  addProblemItem: (
    carePlanId: UUID,
    item: Omit<ProblemItem, 'id' | 'carePlanId' | 'createdAt' | 'createdBy' | 'status'> & {
      status?: ProblemItemStatus;
    }
  ) => ProblemItem;
  updateProblemItem: (itemId: UUID, patch: Partial<ProblemItem>) => void;
  closeProblemItem: (itemId: UUID, reason: string, status: ProblemItemStatus) => void;
  createEvaluation: (
    problemItemId: UUID,
    data: Omit<Evaluation, 'id' | 'problemItemId' | 'evaluatedBy'>
  ) => Evaluation;
  copyFromTemplate: (templateId: UUID, targetCarePlanId: UUID, includeLongTermGoal: boolean, selectedItemIndexes: number[]) => void;
  copyProblemItemsFrom: (sourceProblemItemIds: UUID[], targetCarePlanId: UUID, sourceType: 'other_patient' | 'past_plan') => void;
}

const actor = (state: CarePlanState) => state.nurses.find((n) => n.id === state.currentNurseId);

export const useCarePlanStore = create<CarePlanState>((set, get) => ({
  nurses: NURSES,
  currentNurseId: DEFAULT_NURSE_ID,
  patients: PATIENTS,
  carePlans: CARE_PLANS,
  problemItems: PROBLEM_ITEMS,
  evaluations: EVALUATIONS,
  templates: TEMPLATES,
  nandaMaster: NANDA_MASTER,
  changeLogs: INITIAL_CHANGE_LOGS,

  switchNurse: (nurseId) => set({ currentNurseId: nurseId }),

  createCarePlan: (patientId, longTermGoal, periodStart) => {
    const now = new Date().toISOString();
    const start = periodStart ?? TODAY;
    const plan: CarePlan = {
      id: uid('cp'),
      patientId,
      longTermGoal,
      status: 'draft',
      createdAt: TODAY,
      createdBy: get().currentNurseId,
      periodStart: start,
    };
    const a = actor(get());
    // 案 A: 同患者の継続中（periodEnd 未設定の active）計画があれば、自動で periodEnd / status を設定
    const existing = get().carePlans.find((p) =>
      p.patientId === patientId
      && p.status === 'active'
      && (p.periodEnd === undefined)
    );
    set((s) => ({
      carePlans: [
        ...s.carePlans.map((p) =>
          existing && p.id === existing.id
            ? { ...p, status: 'closed' as const, periodEnd: addDayISO(start, -1), closedAt: addDayISO(start, -1) }
            : p,
        ),
        plan,
      ],
      changeLogs: [
        ...s.changeLogs,
        ...(existing
          ? [{
              id: uid('log'),
              targetType: 'care_plan' as const,
              targetId: existing.id,
              action: 'close' as const,
              actorId: get().currentNurseId,
              actorName: a?.name || '',
              at: now,
              summary: `新期間立案により前計画を自動クローズ（periodEnd=${addDayISO(start, -1)}）`,
            }]
          : []),
        {
          id: uid('log'),
          targetType: 'care_plan' as const,
          targetId: plan.id,
          action: 'create' as const,
          actorId: get().currentNurseId,
          actorName: a?.name || '',
          at: now,
          summary: `看護過程を新規作成(下書き) 期間=${start}〜継続中`,
        },
      ],
    }));
    return plan;
  },

  activateCarePlan: (carePlanId) => {
    const now = new Date().toISOString();
    const a = actor(get());
    set((s) => ({
      carePlans: s.carePlans.map((p) =>
        p.id === carePlanId ? { ...p, status: 'active', createdAt: p.createdAt ?? TODAY } : p
      ),
      problemItems: s.problemItems.map((pi) =>
        pi.carePlanId === carePlanId && pi.status === 'draft'
          ? {
              ...pi,
              status: 'active',
              nextEvaluationDueAt: addMonthISO(TODAY, 1),
            }
          : pi
      ),
      changeLogs: [
        ...s.changeLogs,
        {
          id: uid('log'),
          targetType: 'care_plan',
          targetId: carePlanId,
          action: 'update',
          actorId: get().currentNurseId,
          actorName: a?.name || '',
          at: now,
          summary: '計画を立案確定(有効化)',
        },
      ],
    }));
  },

  updateLongTermGoal: (carePlanId, longTermGoal) => {
    const now = new Date().toISOString();
    const a = actor(get());
    set((s) => ({
      carePlans: s.carePlans.map((p) =>
        p.id === carePlanId ? { ...p, longTermGoal } : p
      ),
      changeLogs: [
        ...s.changeLogs,
        {
          id: uid('log'),
          targetType: 'care_plan',
          targetId: carePlanId,
          action: 'update',
          actorId: get().currentNurseId,
          actorName: a?.name || '',
          at: now,
          summary: '長期目標を更新',
        },
      ],
    }));
  },

  updateCarePlanMeta: (carePlanId, patch) => {
    const now = new Date().toISOString();
    const a = actor(get());
    const before = get().carePlans.find((p) => p.id === carePlanId);
    if (!before) return;
    const fields: string[] = [];
    if (patch.longTermGoal !== undefined && patch.longTermGoal !== before.longTermGoal) {
      fields.push('長期目標');
    }
    if (patch.createdAt !== undefined && patch.createdAt !== before.createdAt) {
      fields.push('立案日');
    }
    if (patch.periodStart !== undefined && patch.periodStart !== before.periodStart) {
      fields.push('期間開始日');
    }
    // periodEnd の patch 値: undefined = 変更なし、null = 継続中に戻す（クリア）、文字列 = 設定
    const periodEndChanging = patch.periodEnd !== undefined
      && (patch.periodEnd === null ? before.periodEnd !== undefined : patch.periodEnd !== before.periodEnd);
    if (periodEndChanging) fields.push('期間終了日');
    if (fields.length === 0) return;

    // 期間バリデーション: 同患者の他計画と重複しないこと
    const newStart = patch.periodStart ?? before.periodStart ?? before.createdAt;
    const newEnd = patch.periodEnd === null
      ? undefined
      : (patch.periodEnd ?? before.periodEnd);
    if (patch.periodStart !== undefined || periodEndChanging) {
      if (newEnd !== undefined && newEnd < newStart) {
        // eslint-disable-next-line no-console
        console.error(`[updateCarePlanMeta] periodEnd (${newEnd}) は periodStart (${newStart}) より前に設定できません`);
        return;
      }
      const conflict = get().carePlans.find((p) => {
        if (p.id === carePlanId) return false;
        if (p.patientId !== before.patientId) return false;
        return periodsOverlap(planPeriod(p), { start: newStart, end: newEnd });
      });
      if (conflict) {
        // eslint-disable-next-line no-console
        console.error(`[updateCarePlanMeta] 期間が他計画 (${conflict.id}) と重複しています`);
        return;
      }
    }

    set((s) => ({
      carePlans: s.carePlans.map((p) =>
        p.id === carePlanId
          ? {
              ...p,
              ...(patch.longTermGoal !== undefined ? { longTermGoal: patch.longTermGoal } : {}),
              ...(patch.createdAt !== undefined ? { createdAt: patch.createdAt } : {}),
              ...(patch.periodStart !== undefined ? { periodStart: patch.periodStart } : {}),
              ...(periodEndChanging
                ? { periodEnd: patch.periodEnd === null ? undefined : patch.periodEnd }
                : {}),
            }
          : p
      ),
      changeLogs: [
        ...s.changeLogs,
        {
          id: uid('log'),
          targetType: 'care_plan',
          targetId: carePlanId,
          action: 'update',
          actorId: get().currentNurseId,
          actorName: a?.name || '',
          at: now,
          summary: `${fields.join('・')}を更新`,
        },
      ],
    }));
  },

  addProblemItem: (carePlanId, item) => {
    const now = new Date().toISOString();
    const a = actor(get());
    const plan = get().carePlans.find((p) => p.id === carePlanId);
    const isActive = plan?.status === 'active';
    const newItem: ProblemItem = {
      id: uid('pi'),
      carePlanId,
      createdAt: TODAY,
      createdBy: get().currentNurseId,
      status: item.status ?? (isActive ? 'active' : 'draft'),
      nextEvaluationDueAt: isActive ? addMonthISO(TODAY, 1) : undefined,
      domain: item.domain,
      priority: item.priority,
      nandaCode: item.nandaCode,
      problemStatement: item.problemStatement,
      shortTermGoal: item.shortTermGoal,
      ote: item.ote,
      diagnosedAt: item.diagnosedAt,
      copiedFrom: item.copiedFrom,
    };
    set((s) => ({
      problemItems: [...s.problemItems, newItem],
      changeLogs: [
        ...s.changeLogs,
        {
          id: uid('log'),
          targetType: 'problem_item',
          targetId: newItem.id,
          action: 'create',
          actorId: get().currentNurseId,
          actorName: a?.name || '',
          at: now,
          summary: '看護計画を追加',
        },
      ],
    }));
    return newItem;
  },

  updateProblemItem: (itemId, patch) => {
    const now = new Date().toISOString();
    const a = actor(get());
    set((s) => ({
      problemItems: s.problemItems.map((pi) =>
        pi.id === itemId ? { ...pi, ...patch } : pi
      ),
      changeLogs: [
        ...s.changeLogs,
        {
          id: uid('log'),
          targetType: 'problem_item',
          targetId: itemId,
          action: 'update',
          actorId: get().currentNurseId,
          actorName: a?.name || '',
          at: now,
          summary: '看護計画を編集',
        },
      ],
    }));
  },

  closeProblemItem: (itemId, reason, status) => {
    const now = new Date().toISOString();
    const a = actor(get());
    set((s) => ({
      problemItems: s.problemItems.map((pi) =>
        pi.id === itemId
          ? { ...pi, status, closedAt: TODAY, closeReason: reason }
          : pi
      ),
      changeLogs: [
        ...s.changeLogs,
        {
          id: uid('log'),
          targetType: 'problem_item',
          targetId: itemId,
          action: 'close',
          actorId: get().currentNurseId,
          actorName: a?.name || '',
          at: now,
          summary: `看護計画をクローズ(${reason})`,
        },
      ],
    }));
  },

  createEvaluation: (problemItemId, data) => {
    const now = new Date().toISOString();
    const a = actor(get());
    const ev: Evaluation = {
      id: uid('ev'),
      problemItemId,
      evaluatedBy: get().currentNurseId,
      ...data,
    };
    set((s) => ({
      evaluations: [...s.evaluations, ev],
      problemItems: s.problemItems.map((pi) =>
        pi.id === problemItemId
          ? {
              ...pi,
              status: data.nextStatus,
              lastEvaluatedAt: data.evaluatedAt,
              nextEvaluationDueAt: addMonthISO(data.evaluatedAt, 1),
              ...(data.nextStatus.startsWith('closed')
                ? { closedAt: data.evaluatedAt }
                : {}),
            }
          : pi
      ),
      changeLogs: [
        ...s.changeLogs,
        {
          id: uid('log'),
          targetType: 'evaluation',
          targetId: ev.id,
          action: 'evaluate',
          actorId: get().currentNurseId,
          actorName: a?.name || '',
          at: now,
          summary: '月次評価を記録',
        },
      ],
    }));
    return ev;
  },

  copyFromTemplate: (templateId, targetCarePlanId, includeLongTermGoal, selectedItemIndexes) => {
    const tpl = get().templates.find((t) => t.id === templateId);
    if (!tpl) return;
    if (includeLongTermGoal) {
      get().updateLongTermGoal(targetCarePlanId, tpl.longTermGoal);
    }
    selectedItemIndexes.forEach((idx) => {
      const it = tpl.problemItems[idx];
      if (!it) return;
      get().addProblemItem(targetCarePlanId, {
        domain: it.domain,
        priority: it.priority,
        nandaCode: it.nandaCode,
        shortTermGoal: it.shortTermGoal,
        ote: it.ote,
        status: 'draft',
        copiedFrom: { sourceType: 'template', sourceId: templateId },
      });
    });
  },

  copyProblemItemsFrom: (sourceProblemItemIds, targetCarePlanId, sourceType) => {
    sourceProblemItemIds.forEach((srcId) => {
      const src = get().problemItems.find((pi) => pi.id === srcId);
      if (!src) return;
      get().addProblemItem(targetCarePlanId, {
        domain: src.domain,
        priority: src.priority,
        nandaCode: src.nandaCode,
        shortTermGoal: src.shortTermGoal,
        ote: src.ote,
        status: 'draft',
        copiedFrom: { sourceType, sourceId: srcId },
      });
    });
  },
}));

export const daysUntil = (iso?: string, today: string = TODAY): number | null => {
  if (!iso) return null;
  const a = new Date(iso);
  const b = new Date(today);
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
};

export const formatJPDate = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

export const formatShortDate = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};
