import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MedicalRecord, Patient, WardId } from '../types';

/** 操作者ロール（ep-02 代行入力認証フローの分岐用） */
export type UserRole = 'doctor' | 'staff';

/** ep-03 オプション機能トグル */
export interface OptionalFeatures {
  /** 医療観察法（紹介経路に「医療観察入院処遇中の転院」を追加） */
  medicalProtection: boolean;
  /** 地域連携（退院指示時に逆紹介設定を表示） */
  regionalCooperation: boolean;
  /** 外部精神科システム連携（入院指示に「精神科入院有無」項目を追加） */
  psychiatricLink: boolean;
}

/** 病床移動の予定（ep-01 us-02 用） */
export interface ScheduledMove {
  id: string;
  patientId: string;
  /** ISO 8601-like: YYYY-MM-DDTHH:mm */
  scheduledAt: string;
  fromWardId: WardId;
  fromRoom: string;
  fromBed: string;
  toWardId: WardId;
  toRoom: string;
  toBed: string;
}

/** 「指示」段階で登録された入退院指示（ep-03 が登録、ep-02 カレンダーが参照） */
export interface PendingOrderEntry {
  id: string;
  type: '入院' | '退院';
  patientId: string;
  patientName: string;
  /** YYYY-MM-DD（未定なら空文字） */
  scheduledDate: string;
  doctorName: string;
  wardId: WardId;
  roomNumber: string;
  bedLabel: string;
}

interface AppState {
  // 選択中の病棟フィルタ
  wardFilter: WardId | 'all';
  setWardFilter: (ward: WardId | 'all') => void;

  // 選択中の患者
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;

  // 病棟マップで選択された病室
  selectedRooms: Set<string>;
  toggleRoom: (roomNumber: string) => void;
  clearSelectedRooms: () => void;

  // 病棟マップで操作メニュー対象として選択中の患者ID
  bedMenuPatientId: string | null;
  setBedMenuPatientId: (id: string | null) => void;

  // 病棟マップ表示順（カルテ画面の隣接ナビ用）
  wardMapPatientOrder: string[];
  navigationSource: 'ward-map' | 'other' | null;
  setWardMapNavigation: (order: string[]) => void;
  clearWardMapNavigation: () => void;

  // 入退院手続き：確定済の入院・退院指示 ID（永続化対象）
  confirmedAdmissionIds: string[];
  confirmAdmission: (id: string) => void;
  confirmDischarge: (id: string) => void;

  // 操作者ロール（医師 / 事務）（永続化対象）
  currentUserRole: UserRole;
  setUserRole: (role: UserRole) => void;

  // ep-03 オプション機能トグル（永続化対象）
  optionalFeatures: OptionalFeatures;
  toggleOptionalFeature: (key: keyof OptionalFeatures) => void;

  // ep-03: 「指示」段階で登録された入退院指示（永続化対象、確定で自動除去）
  pendingOrders: PendingOrderEntry[];
  addPendingOrder: (o: PendingOrderEntry) => void;
  removePendingOrder: (id: string) => void;

  // ep-01 us-02: 病床移動の予定（永続化対象）
  scheduledMoves: ScheduledMove[];
  addScheduledMove: (m: ScheduledMove) => void;
  removeScheduledMove: (id: string) => void;

  // ep-02/ep-03: カルテ記事への動的書込（永続化対象）
  // patientId をキーに、確定時に追記された MedicalRecord 配列を保持。
  // KarteAlphaPage では PATIENTS 由来の静的 records と、ここの動的 records をマージして表示する想定。
  dynamicMedicalRecords: Record<string, MedicalRecord[]>;
  appendMedicalRecord: (patientId: string, record: MedicalRecord) => void;

  // サイドバー
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // スナックバー通知
  snackbar: { open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' };
  showSnackbar: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void;
  hideSnackbar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      wardFilter: 'all',
      setWardFilter: (ward) => set({ wardFilter: ward }),

      selectedPatient: null,
      setSelectedPatient: (patient) => set({ selectedPatient: patient }),

      selectedRooms: new Set(),
      toggleRoom: (roomNumber) =>
        set((state) => {
          const next = new Set(state.selectedRooms);
          if (next.has(roomNumber)) {
            next.delete(roomNumber);
          } else {
            next.add(roomNumber);
          }
          return { selectedRooms: next };
        }),
      clearSelectedRooms: () => set({ selectedRooms: new Set() }),

      bedMenuPatientId: null,
      setBedMenuPatientId: (id) => set({ bedMenuPatientId: id }),

      wardMapPatientOrder: [],
      navigationSource: null,
      setWardMapNavigation: (order) => set({ wardMapPatientOrder: order, navigationSource: 'ward-map' }),
      clearWardMapNavigation: () => set({ wardMapPatientOrder: [], navigationSource: null }),

      confirmedAdmissionIds: [],
      // 入院／退院確定時に呼び出す。pendingOrders から該当 ID を自動除去する。
      confirmAdmission: (id) =>
        set((state) => ({
          confirmedAdmissionIds: state.confirmedAdmissionIds.includes(id)
            ? state.confirmedAdmissionIds
            : [...state.confirmedAdmissionIds, id],
          pendingOrders: state.pendingOrders.filter((p) => p.id !== id),
        })),
      confirmDischarge: (id) =>
        set((state) => ({
          confirmedAdmissionIds: state.confirmedAdmissionIds.includes(id)
            ? state.confirmedAdmissionIds
            : [...state.confirmedAdmissionIds, id],
          pendingOrders: state.pendingOrders.filter((p) => p.id !== id),
        })),

      currentUserRole: 'staff',
      setUserRole: (role) => set({ currentUserRole: role }),

      optionalFeatures: {
        medicalProtection: false,
        regionalCooperation: false,
        psychiatricLink: false,
      },
      toggleOptionalFeature: (key) =>
        set((state) => ({
          optionalFeatures: { ...state.optionalFeatures, [key]: !state.optionalFeatures[key] },
        })),

      pendingOrders: [],
      addPendingOrder: (o) => set((state) => ({ pendingOrders: [...state.pendingOrders, o] })),
      removePendingOrder: (id) => set((state) => ({ pendingOrders: state.pendingOrders.filter((x) => x.id !== id) })),

      scheduledMoves: [],
      addScheduledMove: (m) => set((state) => ({ scheduledMoves: [...state.scheduledMoves, m] })),
      removeScheduledMove: (id) => set((state) => ({ scheduledMoves: state.scheduledMoves.filter((x) => x.id !== id) })),

      dynamicMedicalRecords: {},
      // カルテ記事追加: 入退院確定や指示登録時に呼び出される。KarteAlphaPage が表示時にマージする。
      appendMedicalRecord: (patientId, record) =>
        set((state) => ({
          dynamicMedicalRecords: {
            ...state.dynamicMedicalRecords,
            [patientId]: [...(state.dynamicMedicalRecords[patientId] ?? []), record],
          },
        })),

      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      snackbar: { open: false, message: '', severity: 'info' },
      showSnackbar: (message, severity = 'info') =>
        set({ snackbar: { open: true, message, severity } }),
      hideSnackbar: () =>
        set((state) => ({ snackbar: { ...state.snackbar, open: false } })),
    }),
    {
      name: 'rakuemr-app-store',
      storage: createJSONStorage(() => localStorage),
      // セッション UI（選択状態・スナックバーなど）は永続化しない。
      // 永続化対象: pendingOrders / scheduledMoves / dynamicMedicalRecords / confirmedAdmissionIds /
      //            currentUserRole / optionalFeatures
      partialize: (state) => ({
        pendingOrders: state.pendingOrders,
        scheduledMoves: state.scheduledMoves,
        dynamicMedicalRecords: state.dynamicMedicalRecords,
        confirmedAdmissionIds: state.confirmedAdmissionIds,
        currentUserRole: state.currentUserRole,
        optionalFeatures: state.optionalFeatures,
      }),
      version: 1,
    },
  ),
);
