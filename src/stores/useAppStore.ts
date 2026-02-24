import { create } from 'zustand';
import type { Patient, WardId } from '../types';

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

  // サイドバー
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // スナックバー通知
  snackbar: { open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' };
  showSnackbar: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void;
  hideSnackbar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
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

  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  snackbar: { open: false, message: '', severity: 'info' },
  showSnackbar: (message, severity = 'info') =>
    set({ snackbar: { open: true, message, severity } }),
  hideSnackbar: () =>
    set((state) => ({ snackbar: { ...state.snackbar, open: false } })),
}));
