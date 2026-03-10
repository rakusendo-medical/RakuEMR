export interface Patient {
  id: string;
  name: string;
  nameKana: string;
  gender: '男' | '女';
  bloodType: string;
  age: number;
  birthDate: string;
  roomNumber: string;
  wardName: string;
  doctor: string;
  nurse: string;
  daycare: string;
}

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
  | '医師記録'
  | '看護記録'
  | '看護サマリ'
  | 'クリニカルパス'
  | '作業療法記録'
  | '栄養指導記録'
  | '入退院記録';

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
  type: '治療区' | 'デイケア' | 'エピソード';
  label: string;
}

export interface KarteTab {
  id: string;
  label: string;
  active?: boolean;
}
