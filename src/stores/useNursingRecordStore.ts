import { create } from 'zustand';
import type { NursingRecord } from '../types';
import { NURSING_RECORDS } from '../data/mockData';

interface NursingRecordState {
  records: NursingRecord[];
  addRecord: (record: Omit<NursingRecord, 'id'>) => void;
}

let seq = NURSING_RECORDS.length + 1;

export const useNursingRecordStore = create<NursingRecordState>((set) => ({
  records: [...NURSING_RECORDS],
  addRecord: (record) =>
    set((s) => ({
      records: [
        { ...record, id: `NR${String(seq++).padStart(3, '0')}` },
        ...s.records,
      ],
    })),
}));
