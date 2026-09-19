import { useCallback } from 'react';
import type { MedicalRecord, PatientStatus } from '../types';
import { PATIENTS } from '../data/mockData';
import { useAppStore } from './useAppStore';

/**
 * 患者の今のステータス（安定／観察中／不安定／重症）を返す（issue #399・2026-09-15）。
 *
 * ステータスは診療録作成で入力する。ステータスを選んで保存した最新の診療録（取消を除く）の値を
 * 今のステータスとし、一度も入力していない患者は初期データ（`Patient.status`）を使う。
 * 同じ記載日時の記事が複数あるときは、後から追加した記事を優先する。
 */
export function currentPatientStatusOf(
  patientId: string,
  recordsByPatient: Record<string, MedicalRecord[]>,
  fallback?: PatientStatus,
): PatientStatus {
  const latest = (recordsByPatient[patientId] ?? [])
    .filter((r) => r.patientStatus && !r.cancelled)
    .reduce<MedicalRecord | undefined>((acc, r) => (!acc || r.timestamp >= acc.timestamp ? r : acc), undefined);
  return latest?.patientStatus
    ?? fallback
    ?? PATIENTS.find((p) => p.id === patientId)?.status
    ?? 'stable';
}

/** 一覧表示向け: 患者 ID から今のステータスを引く関数を返す（診療録の追加・取消に追従する） */
export function usePatientStatusOf() {
  const records = useAppStore((s) => s.dynamicMedicalRecords);
  return useCallback(
    (patientId: string, fallback?: PatientStatus) => currentPatientStatusOf(patientId, records, fallback),
    [records],
  );
}
