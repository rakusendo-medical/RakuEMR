// ===== ep-10 看護実施 zustand store =====
// 本 feature 内に閉じた状態管理。共有 useAppStore には影響させない。

import { create } from 'zustand';
import {
  DEFAULT_LOGON_STAFF_ID,
  FLOWSHEET_DEFAULT_PROPERTY,
  FLOWSHEET_STAFFS,
  INITIAL_CARE_RECORDS,
  INITIAL_LAB_RESULTS,
  INITIAL_MOVEMENT_SEGMENTS,
  INITIAL_NURSING_RECORDS,
  INITIAL_PATTERN_APPLICATIONS,
  INITIAL_SCHEDULED_ORDERS,
  INITIAL_SIGNS,
  INITIAL_SLEEP_LOGS,
  INITIAL_VITALS,
  MASTER_CARE_ITEMS,
  MASTER_FLOWSHEET_PATTERNS,
  NURSING_RECORD_TEMPLATES,
} from './mockData';
import type {
  CareItemMaster,
  CareRecord,
  ChangeOpType,
  FlowsheetChangeLog,
  FlowsheetPatternApplication,
  FlowsheetPatternMaster,
  FlowsheetPropertyConfig,
  FlowsheetStaff,
  ISODate,
  ISODateTime,
  LabResultEntry,
  MovementSegment,
  NursingRecord,
  NursingRecordTemplate,
  ScheduledOrder,
  ShiftType,
  SignEntry,
  SleepLog,
  UUID,
  VitalEntry,
} from './types';

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
const now = (): ISODateTime => new Date().toISOString().slice(0, 19);

// 勤務帯判定（マスタ shiftStartTimes に依存）
export const resolveShift = (
  hhmm: string,
  cfg: FlowsheetPropertyConfig['shiftStartTimes'],
): ShiftType => {
  const m = (s: string) => Number(s.split(':')[0]) * 60 + Number(s.split(':')[1]);
  const t = m(hhmm);
  const day = m(cfg.day);
  const evening = m(cfg.evening);
  const night = m(cfg.night);
  // night は 0:30 のような早朝想定。day までを夜勤帯、day-evening を日勤、evening 以降を準夜
  if (t >= night && t < day) return 'night';
  if (t >= day && t < evening) return 'day';
  return 'evening';
};

interface FlowsheetState {
  // ----- マスタ／設定 -----
  staffs: FlowsheetStaff[];
  currentStaffId: UUID;
  property: FlowsheetPropertyConfig;
  careItemMaster: CareItemMaster[];
  patternMaster: FlowsheetPatternMaster[];
  recordTemplates: NursingRecordTemplate[];

  // ----- 患者ごとの記録データ -----
  patternApplications: FlowsheetPatternApplication[];
  vitals: VitalEntry[];
  careRecords: CareRecord[];
  signs: SignEntry[];
  scheduledOrders: ScheduledOrder[];
  labResults: LabResultEntry[];
  movementSegments: MovementSegment[];
  nursingRecords: NursingRecord[];
  sleepLogs: SleepLog[];

  // ----- 履歴 -----
  changeLogs: FlowsheetChangeLog[];

  // ----- アクション -----
  setLogonStaff: (id: UUID) => void;
  setProperty: (patch: Partial<FlowsheetPropertyConfig>) => void;

  addVital: (v: Omit<VitalEntry, 'id' | 'registeredAt' | 'recordedBy'>) => VitalEntry;
  updateVital: (id: UUID, patch: Partial<VitalEntry>) => void;
  deleteVital: (id: UUID) => void;

  addCareRecord: (cr: Omit<CareRecord, 'id' | 'registeredAt' | 'registeredBy'>) => CareRecord;
  updateCareRecord: (id: UUID, patch: Partial<CareRecord>) => void;
  deleteCareRecord: (id: UUID) => void;

  upsertSign: (date: ISODate, patientId: UUID, shift: ShiftType, signerId: UUID) => void;
  deleteSign: (id: UUID) => void;

  applyPattern: (
    patientId: UUID, startDate: ISODate, patternId: UUID | null,
  ) => FlowsheetPatternApplication;
  updatePatternApplication: (id: UUID, patch: Partial<FlowsheetPatternApplication>) => void;
  removePatternApplication: (id: UUID) => void;

  addNursingRecord: (n: Omit<NursingRecord, 'id' | 'registeredAt' | 'recordedBy'>) => NursingRecord;
  updateNursingRecord: (id: UUID, patch: Partial<NursingRecord>) => void;
  deleteNursingRecord: (id: UUID) => void;

  addSleepLog: (s: Omit<SleepLog, 'id' | 'registeredAt' | 'registeredBy'>) => SleepLog;
  updateSleepLog: (id: UUID, patch: Partial<SleepLog>) => void;
  deleteSleepLog: (id: UUID) => void;

  completeOrder: (orderId: UUID) => void;
}

const log = (
  state: FlowsheetState,
  entry: Omit<FlowsheetChangeLog, 'id' | 'at' | 'actorId'>,
): FlowsheetChangeLog => ({
  ...entry,
  id: uid('log'),
  at: now(),
  actorId: state.currentStaffId,
});

export const useFlowsheetStore = create<FlowsheetState>((set, get) => ({
  staffs: FLOWSHEET_STAFFS,
  currentStaffId: DEFAULT_LOGON_STAFF_ID,
  property: FLOWSHEET_DEFAULT_PROPERTY,
  careItemMaster: MASTER_CARE_ITEMS,
  patternMaster: MASTER_FLOWSHEET_PATTERNS,
  recordTemplates: NURSING_RECORD_TEMPLATES,

  patternApplications: INITIAL_PATTERN_APPLICATIONS,
  vitals: INITIAL_VITALS,
  careRecords: INITIAL_CARE_RECORDS,
  signs: INITIAL_SIGNS,
  scheduledOrders: INITIAL_SCHEDULED_ORDERS,
  labResults: INITIAL_LAB_RESULTS,
  movementSegments: INITIAL_MOVEMENT_SEGMENTS,
  nursingRecords: INITIAL_NURSING_RECORDS,
  sleepLogs: INITIAL_SLEEP_LOGS,
  changeLogs: [],

  setLogonStaff: (id) => set({ currentStaffId: id }),
  setProperty: (patch) => set((s) => ({ property: { ...s.property, ...patch } })),

  // ----- バイタル -----
  addVital: (v) => {
    const entry: VitalEntry = {
      ...v,
      id: uid('vt'),
      recordedBy: get().currentStaffId,
      registeredAt: now(),
    };
    set((s) => ({
      vitals: [...s.vitals, entry],
      changeLogs: [...s.changeLogs, log(s, {
        targetType: 'vital', targetId: entry.id, op: 'register',
        patientId: entry.patientId, date: entry.date,
        summary: `バイタル登録 ${entry.time}`,
      })],
    }));
    return entry;
  },

  updateVital: (id, patch) => {
    set((s) => {
      const next = s.vitals.map((v) => (v.id === id ? { ...v, ...patch, updatedAt: now() } : v));
      const target = next.find((v) => v.id === id);
      if (!target) return {};
      return {
        vitals: next,
        changeLogs: [...s.changeLogs, log(s, {
          targetType: 'vital', targetId: id, op: 'update',
          patientId: target.patientId, date: target.date,
          summary: `バイタル更新 ${target.time}`,
        })],
      };
    });
  },

  deleteVital: (id) => {
    set((s) => {
      const target = s.vitals.find((v) => v.id === id);
      if (!target) return {};
      return {
        vitals: s.vitals.filter((v) => v.id !== id),
        changeLogs: [...s.changeLogs, log(s, {
          targetType: 'vital', targetId: id, op: 'update',
          patientId: target.patientId, date: target.date,
          summary: `バイタル削除 ${target.time}`,
        })],
      };
    });
  },

  // ----- ケア記録 -----
  addCareRecord: (cr) => {
    const entry: CareRecord = {
      ...cr,
      id: uid('cr'),
      registeredBy: get().currentStaffId,
      registeredAt: now(),
    };
    set((s) => ({
      careRecords: [...s.careRecords, entry],
      changeLogs: [...s.changeLogs, log(s, {
        targetType: 'care_record', targetId: entry.id, op: 'register',
        patientId: entry.patientId, date: entry.date,
        summary: `ケア記録登録 (${cr.careItemId})`,
      })],
    }));
    return entry;
  },

  updateCareRecord: (id, patch) => {
    set((s) => {
      const next = s.careRecords.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: now() } : c));
      const target = next.find((c) => c.id === id);
      if (!target) return {};
      return {
        careRecords: next,
        changeLogs: [...s.changeLogs, log(s, {
          targetType: 'care_record', targetId: id, op: 'update',
          patientId: target.patientId, date: target.date,
          summary: `ケア記録更新 (${target.careItemId})`,
        })],
      };
    });
  },

  deleteCareRecord: (id) => {
    set((s) => {
      const target = s.careRecords.find((c) => c.id === id);
      if (!target) return {};
      return {
        careRecords: s.careRecords.filter((c) => c.id !== id),
        changeLogs: [...s.changeLogs, log(s, {
          targetType: 'care_record', targetId: id, op: 'update',
          patientId: target.patientId, date: target.date,
          summary: `ケア記録削除 (${target.careItemId})`,
        })],
      };
    });
  },

  // ----- サイン -----
  upsertSign: (date, patientId, shift, signerId) => {
    set((s) => {
      const existing = s.signs.find(
        (sg) => sg.patientId === patientId && sg.date === date && sg.shift === shift,
      );
      const op: ChangeOpType = existing ? 'update' : 'register';
      const updated: SignEntry = existing
        ? { ...existing, signerId, updatedAt: now() }
        : {
            id: uid('sg'), patientId, date, shift, signerId,
            registeredAt: now(),
          };
      const signs = existing
        ? s.signs.map((sg) => (sg.id === existing.id ? updated : sg))
        : [...s.signs, updated];
      return {
        signs,
        changeLogs: [...s.changeLogs, log(s, {
          targetType: 'sign', targetId: updated.id, op,
          patientId, date,
          summary: `サイン${op === 'register' ? '登録' : '更新'} (${shift})`,
        })],
      };
    });
  },

  deleteSign: (id) => {
    set((s) => {
      const target = s.signs.find((sg) => sg.id === id);
      if (!target) return {};
      return {
        signs: s.signs.filter((sg) => sg.id !== id),
        changeLogs: [...s.changeLogs, log(s, {
          targetType: 'sign', targetId: id, op: 'update',
          patientId: target.patientId, date: target.date,
          summary: `サイン削除 (${target.shift})`,
        })],
      };
    });
  },

  // ----- パターン適用 -----
  applyPattern: (patientId, startDate, patternId) => {
    const entry: FlowsheetPatternApplication = {
      id: uid('fpa'),
      patientId, startDate, patternId,
      appliedAt: now(),
      appliedBy: get().currentStaffId,
    };
    set((s) => {
      // 適用日以降のケアメニューデータを物理削除（spec の不可逆挙動）
      const careRecords = s.careRecords.filter(
        (c) => !(c.patientId === patientId && c.date >= startDate),
      );
      return {
        patternApplications: [...s.patternApplications, entry],
        careRecords,
        changeLogs: [...s.changeLogs, log(s, {
          targetType: 'pattern', targetId: entry.id, op: 'register',
          patientId, date: startDate, patternId,
          summary: `パターン適用 (${startDate}〜)`,
        })],
      };
    });
    return entry;
  },

  updatePatternApplication: (id, patch) => {
    set((s) => {
      const next = s.patternApplications.map((a) =>
        a.id === id ? { ...a, ...patch } : a,
      );
      const target = next.find((a) => a.id === id);
      if (!target) return {};
      return {
        patternApplications: next,
        changeLogs: [...s.changeLogs, log(s, {
          targetType: 'pattern', targetId: id, op: 'update',
          patientId: target.patientId, date: target.startDate, patternId: target.patternId,
          summary: 'パターン変更',
        })],
      };
    });
  },

  removePatternApplication: (id) => {
    set((s) => {
      const target = s.patternApplications.find((a) => a.id === id);
      if (!target) return {};
      return {
        patternApplications: s.patternApplications.filter((a) => a.id !== id),
        changeLogs: [...s.changeLogs, log(s, {
          targetType: 'pattern', targetId: id, op: 'update',
          patientId: target.patientId, date: target.startDate, patternId: target.patternId,
          summary: 'パターン削除',
        })],
      };
    });
  },

  // ----- 看護記録 -----
  addNursingRecord: (n) => {
    const entry: NursingRecord = {
      ...n,
      id: uid('nr'),
      recordedBy: get().currentStaffId,
      registeredAt: now(),
    };
    set((s) => ({
      nursingRecords: [...s.nursingRecords, entry],
      changeLogs: [...s.changeLogs, log(s, {
        targetType: 'nursing_record', targetId: entry.id, op: 'register',
        patientId: entry.patientId, date: entry.recordedAt.slice(0, 10),
        summary: `看護記録登録「${entry.title}」`,
      })],
    }));
    return entry;
  },

  updateNursingRecord: (id, patch) => {
    set((s) => {
      const next = s.nursingRecords.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: now(), updatedBy: s.currentStaffId } : n,
      );
      const target = next.find((n) => n.id === id);
      if (!target) return {};
      return {
        nursingRecords: next,
        changeLogs: [...s.changeLogs, log(s, {
          targetType: 'nursing_record', targetId: id, op: 'update',
          patientId: target.patientId, date: target.recordedAt.slice(0, 10),
          summary: `看護記録更新「${target.title}」`,
        })],
      };
    });
  },

  deleteNursingRecord: (id) => {
    // 論理削除
    set((s) => {
      const next = s.nursingRecords.map((n) =>
        n.id === id
          ? { ...n, deletedAt: now(), deletedBy: s.currentStaffId }
          : n,
      );
      const target = next.find((n) => n.id === id);
      if (!target) return {};
      return {
        nursingRecords: next,
        changeLogs: [...s.changeLogs, log(s, {
          targetType: 'nursing_record', targetId: id, op: 'update',
          patientId: target.patientId, date: target.recordedAt.slice(0, 10),
          summary: `看護記録削除「${target.title}」`,
        })],
      };
    });
  },

  // ----- 睡眠ログ -----
  addSleepLog: (sleep) => {
    const entry: SleepLog = {
      ...sleep,
      id: uid('sl'),
      registeredBy: get().currentStaffId,
      registeredAt: now(),
    };
    set((s) => ({
      sleepLogs: [...s.sleepLogs, entry],
      changeLogs: [...s.changeLogs, log(s, {
        targetType: 'sleep_log', targetId: entry.id, op: 'register',
        patientId: entry.patientId, date: entry.startAt.slice(0, 10),
        summary: `睡眠登録 (${entry.state})`,
      })],
    }));
    return entry;
  },

  updateSleepLog: (id, patch) => {
    set((s) => {
      const next = s.sleepLogs.map((sl) => (sl.id === id ? { ...sl, ...patch } : sl));
      const target = next.find((sl) => sl.id === id);
      if (!target) return {};
      return {
        sleepLogs: next,
        changeLogs: [...s.changeLogs, log(s, {
          targetType: 'sleep_log', targetId: id, op: 'update',
          patientId: target.patientId, date: target.startAt.slice(0, 10),
          summary: `睡眠更新 (${target.state})`,
        })],
      };
    });
  },

  deleteSleepLog: (id) => {
    set((s) => {
      const target = s.sleepLogs.find((sl) => sl.id === id);
      if (!target) return {};
      return {
        sleepLogs: s.sleepLogs.filter((sl) => sl.id !== id),
        changeLogs: [...s.changeLogs, log(s, {
          targetType: 'sleep_log', targetId: id, op: 'update',
          patientId: target.patientId, date: target.startAt.slice(0, 10),
          summary: `睡眠削除 (${target.state})`,
        })],
      };
    });
  },

  // ----- オーダ実施 -----
  completeOrder: (orderId) => {
    set((s) => ({
      scheduledOrders: s.scheduledOrders.map((o) =>
        o.id === orderId ? { ...o, status: 'done' } : o,
      ),
    }));
  },
}));

// ----- セレクタユーティリティ -----

export const getActivePatternForDate = (
  applications: FlowsheetPatternApplication[],
  patientId: UUID,
  date: ISODate,
): FlowsheetPatternApplication | undefined => {
  return applications
    .filter((a) => a.patientId === patientId && a.startDate <= date)
    .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0];
};

export const formatJPDate = (iso: ISODate): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

export const last7Dates = (endDate: ISODate): ISODate[] => {
  const end = new Date(endDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
};
