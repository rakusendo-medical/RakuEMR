import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Stack } from '@mui/material';
import type { Patient } from '../../types';
import type { KarteMode } from './KartePage';
import BasicInfoSubview from './patientInfo/BasicInfoSubview';
import AttributesSubview from './patientInfo/AttributesSubview';
import InsuranceSubview from './patientInfo/InsuranceSubview';
import ContactsSubview from './patientInfo/ContactsSubview';
import DiagnosesSubview from './patientInfo/DiagnosesSubview';
import EpisodesSubview from './patientInfo/EpisodesSubview';
import MemoSubview from './patientInfo/MemoSubview';

type SubviewId =
  | 'basic'
  | 'attributes'
  | 'insurance'
  | 'contacts'
  | 'diagnoses'
  | 'episodes'
  | 'memo';

const SUBTABS: { id: SubviewId; label: string }[] = [
  { id: 'basic', label: '基本情報' },
  { id: 'attributes', label: '属性' },
  { id: 'insurance', label: '保険' },
  { id: 'contacts', label: '連絡先' },
  { id: 'diagnoses', label: '病名' },
  { id: 'episodes', label: 'エピソード' },
  { id: 'memo', label: 'メモ' },
];

interface PatientInfoTabProps {
  patient: Patient;
  mode: KarteMode;
  /** いずれかのサブビューに未保存変更があるかを親（KartePage）へ通知 */
  onDirtyChange: (dirty: boolean) => void;
  /** 親が「破棄して進む」を確定したときに inc される。各サブビューを初期値にリセット */
  discardSignal: number;
}

type DirtyMap = Record<SubviewId, boolean>;

const EMPTY_DIRTY: DirtyMap = {
  basic: false,
  attributes: false,
  insurance: false,
  contacts: false,
  diagnoses: false,
  episodes: false,
  memo: false,
};

export default function PatientInfoTab({
  patient,
  mode,
  onDirtyChange,
  discardSignal,
}: PatientInfoTabProps) {
  const [activeSub, setActiveSub] = useState<SubviewId>('basic');
  const [dirtyMap, setDirtyMap] = useState<DirtyMap>(EMPTY_DIRTY);

  // 各サブビュー用の onDirtyChange callback を初回のみ生成（参照安定化）
  const dirtyHandlers = useMemo<Record<SubviewId, (d: boolean) => void>>(
    () => ({
      basic: (d) => setDirtyMap((m) => (m.basic === d ? m : { ...m, basic: d })),
      attributes: (d) => setDirtyMap((m) => (m.attributes === d ? m : { ...m, attributes: d })),
      insurance: (d) => setDirtyMap((m) => (m.insurance === d ? m : { ...m, insurance: d })),
      contacts: (d) => setDirtyMap((m) => (m.contacts === d ? m : { ...m, contacts: d })),
      diagnoses: (d) => setDirtyMap((m) => (m.diagnoses === d ? m : { ...m, diagnoses: d })),
      episodes: (d) => setDirtyMap((m) => (m.episodes === d ? m : { ...m, episodes: d })),
      memo: (d) => setDirtyMap((m) => (m.memo === d ? m : { ...m, memo: d })),
    }),
    [],
  );

  const anyDirty = useMemo(
    () => SUBTABS.some((s) => dirtyMap[s.id]),
    [dirtyMap],
  );

  useEffect(() => {
    onDirtyChange(anyDirty);
  }, [anyDirty, onDirtyChange]);

  // discardSignal が変化したら dirtyMap も初期化（サブビューの reset と整合）
  useEffect(() => {
    if (discardSignal === 0) return;
    setDirtyMap(EMPTY_DIRTY);
  }, [discardSignal]);

  const activeColor = mode === 'outpatient' ? 'success' : 'primary';

  return (
    <Box>
      <Stack
        direction="row"
        spacing={0.75}
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 1.5, position: 'sticky', top: 0, bgcolor: 'background.default', py: 0.5, zIndex: 1 }}
      >
        {SUBTABS.map((s) => {
          const active = activeSub === s.id;
          const dirty = dirtyMap[s.id];
          const label = dirty ? `${s.label} *` : s.label;
          return (
            <Chip
              key={s.id}
              label={label}
              size="small"
              variant={active ? 'filled' : 'outlined'}
              color={active ? activeColor : dirty ? 'warning' : 'default'}
              onClick={() => setActiveSub(s.id)}
              sx={{ fontWeight: active ? 700 : 400 }}
            />
          );
        })}
      </Stack>

      {/* 全サブビューを常時マウント（display: none で切替）してサブタブ切替時の未保存変更を保持 */}
      <Box sx={{ display: activeSub === 'basic' ? 'block' : 'none' }}>
        <BasicInfoSubview
          mode={mode}
          onDirtyChange={dirtyHandlers.basic}
          discardSignal={discardSignal}
        />
      </Box>
      <Box sx={{ display: activeSub === 'attributes' ? 'block' : 'none' }}>
        <AttributesSubview
          patient={patient}
          mode={mode}
          onDirtyChange={dirtyHandlers.attributes}
          discardSignal={discardSignal}
        />
      </Box>
      <Box sx={{ display: activeSub === 'insurance' ? 'block' : 'none' }}>
        <InsuranceSubview
          mode={mode}
          onDirtyChange={dirtyHandlers.insurance}
          discardSignal={discardSignal}
        />
      </Box>
      <Box sx={{ display: activeSub === 'contacts' ? 'block' : 'none' }}>
        <ContactsSubview
          mode={mode}
          onDirtyChange={dirtyHandlers.contacts}
          discardSignal={discardSignal}
        />
      </Box>
      <Box sx={{ display: activeSub === 'diagnoses' ? 'block' : 'none' }}>
        <DiagnosesSubview
          mode={mode}
          onDirtyChange={dirtyHandlers.diagnoses}
          discardSignal={discardSignal}
        />
      </Box>
      <Box sx={{ display: activeSub === 'episodes' ? 'block' : 'none' }}>
        <EpisodesSubview
          mode={mode}
          onDirtyChange={dirtyHandlers.episodes}
          discardSignal={discardSignal}
        />
      </Box>
      <Box sx={{ display: activeSub === 'memo' ? 'block' : 'none' }}>
        <MemoSubview
          mode={mode}
          onDirtyChange={dirtyHandlers.memo}
          discardSignal={discardSignal}
        />
      </Box>
    </Box>
  );
}
