import { create } from 'zustand';
import type {
  CarePlan,
  ChangeLog,
  Evaluation,
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
  createCarePlan: (patientId: UUID, longTermGoal: string) => CarePlan;
  activateCarePlan: (carePlanId: UUID) => void;
  updateLongTermGoal: (carePlanId: UUID, longTermGoal: string) => void;
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

  createCarePlan: (patientId, longTermGoal) => {
    const now = new Date().toISOString();
    const plan: CarePlan = {
      id: uid('cp'),
      patientId,
      longTermGoal,
      status: 'draft',
      createdAt: TODAY,
      createdBy: get().currentNurseId,
    };
    const a = actor(get());
    set((s) => ({
      carePlans: [...s.carePlans, plan],
      changeLogs: [
        ...s.changeLogs,
        {
          id: uid('log'),
          targetType: 'care_plan',
          targetId: plan.id,
          action: 'create',
          actorId: get().currentNurseId,
          actorName: a?.name || '',
          at: now,
          summary: '看護計画を新規作成(下書き)',
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
      shortTermGoal: item.shortTermGoal,
      ote: item.ote,
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
          summary: '問題点を追加',
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
          summary: '問題点を編集',
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
          summary: `問題点をクローズ(${reason})`,
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
