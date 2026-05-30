import { useState } from 'react';
import {
  Box, Stack, Typography, Chip, Divider,
  Table, TableBody, TableRow, TableCell, LinearProgress,
} from '@mui/material';
import {
  LocalHospital as DiagnosisIcon,
  Healing as ComplicationIcon,
  Vaccines as AllergyIcon,
  ContactPhone as InsuranceIcon,
  AccessibilityNew as ResponsibilityIcon,
  Accessibility as AdlIcon,
  StarRate as GafIcon,
  Description as DocIcon,
  PeopleOutline as FamilyIcon,
  Route as ClinicalPathIcon,
  AssignmentInd as OrderAdmissionIcon,
} from '@mui/icons-material';
import type { Patient } from '../../types';
import SectionHeader from '../common/SectionHeader';
import type { KarteMode } from './KartePage';

// ===== サブタブ定義 =====

type SubTabKey =
  | 'diagnosis'
  | 'basic'
  | 'gaf'
  | 'documents'
  | 'family'
  | 'clinical-path'
  | 'orders-admission';

const SUB_TABS: { key: SubTabKey; label: string }[] = [
  { key: 'diagnosis',         label: '診断名' },
  { key: 'basic',             label: '基本情報' },
  // GAF・クリニカルパスは一旦非表示（PM 判断）。コンテンツ実装は残置し、再表示はこの配列に戻すだけ
  { key: 'documents',         label: '院外/状・診断書類' },
  { key: 'family',            label: 'ファミリ' },
  { key: 'orders-admission',  label: '指示/入室' },
];

// ===== ICD コード対応 mock =====

const ICD_MAP: Record<string, string> = {
  '統合失調症':       'F20.9',
  '双極性障害':       'F31.0',
  'うつ病':           'F32.0',
  '認知症':           'F03',
  'アルコール依存症': 'F10.2',
  'パニック障害':     'F41.0',
  '不安障害':         'F41.9',
  '適応障害':         'F43.2',
};

function diagnosisToIcd(name?: string): string {
  if (!name) return '?';
  return ICD_MAP[name] ?? 'F99';
}

// ===== Component =====

interface ClinicalInfoPanelProps {
  patient: Patient;
  mode: KarteMode;
}

export default function ClinicalInfoPanel({ patient, mode }: ClinicalInfoPanelProps) {
  const [open, setOpen] = useState(true);
  const [subTab, setSubTab] = useState<SubTabKey>('diagnosis');

  const headerColor =
    patient.admissionState === 'discharged' ? '#6b7280'
      : mode === 'outpatient' ? '#16a34a'
      : '#1e3a5f';

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <SectionHeader
        title="診療情報"
        color={headerColor}
        open={open}
        onToggle={() => setOpen(!open)}
        rightSlot={
          <Stack direction="row" spacing={0.25} alignItems="center" onClick={(e) => e.stopPropagation()} sx={{ flexWrap: 'wrap', rowGap: 0.25 }}>
            {SUB_TABS.map((t) => {
              const active = subTab === t.key;
              return (
                <Chip
                  key={t.key}
                  label={t.label}
                  size="small"
                  variant={active ? 'filled' : 'outlined'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSubTab(t.key);
                    if (!open) setOpen(true);
                  }}
                  sx={{
                    height: 22, fontSize: '0.65rem', borderRadius: 0.5,
                    // SectionHeader 上で確実に視認できる配色を sx で明示
                    bgcolor: active ? '#fff' : 'rgba(255,255,255,0.1)',
                    color: active ? headerColor : '#fff',
                    border: '1px solid rgba(255,255,255,0.7)',
                    fontWeight: active ? 700 : 500,
                    '&:hover': {
                      bgcolor: active ? '#fff' : 'rgba(255,255,255,0.25)',
                    },
                  }}
                />
              );
            })}
          </Stack>
        }
      />
      {open && (
        // PM 指示（2026-05-11）: サブタブ切替時に高さがガチャつくのを防ぐため、
        // 暫定固定高さ 140px + 必要時スクロール。今後コンテンツボリュームに応じて見直し。
        <Box sx={{ px: 2, py: 1, height: 140, overflowY: 'auto' }}>
          {subTab === 'diagnosis' && <DiagnosisContent patient={patient} />}
          {subTab === 'basic' && <BasicInfoContent patient={patient} />}
          {subTab === 'gaf' && <GafContent />}
          {subTab === 'documents' && <DocumentsContent />}
          {subTab === 'family' && <FamilyContent />}
          {subTab === 'clinical-path' && <ClinicalPathContent />}
          {subTab === 'orders-admission' && <OrdersAdmissionContent patient={patient} />}
        </Box>
      )}
    </Box>
  );
}

// ===== サブタブ本体 =====

function InfoRow({
  icon, label, children, accent,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.4, borderBottom: '1px dashed', borderColor: 'grey.200' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', color: accent ?? 'text.secondary', minWidth: 18 }}>
        {icon}
      </Box>
      <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 80, color: accent ?? 'text.secondary' }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, fontSize: '0.75rem' }}>{children}</Box>
    </Stack>
  );
}

function IcdBadge({ code }: { code: string }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        bgcolor: '#1e40af', color: '#fff',
        fontWeight: 700, fontSize: '0.65rem',
        px: 0.75, py: 0.1, borderRadius: 0.5,
        mr: 0.75, fontFamily: 'monospace',
      }}
    >
      {code}
    </Box>
  );
}

// ----- 診断名 -----
function DiagnosisContent({ patient }: { patient: Patient }) {
  const primaryDiag = patient.diagnosis ?? '未登録';
  const primaryIcd = diagnosisToIcd(patient.diagnosis);
  // mock: 合併症
  const complications = patient.diagnosis === '双極性障害'
    ? [{ name: '不安障害', icd: 'F41.9', onset: '2025-08' }]
    : patient.diagnosis === '統合失調症'
    ? [{ name: 'うつ病', icd: 'F32.0', onset: '2024-11' }]
    : [];

  // mock: アレルギー（patient.id ハッシュで決定）
  const idHash = patient.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const drugs = idHash % 3 === 0 ? ['ペニシリン系'] : [];
  const foods = idHash % 4 === 0 ? ['卵アレルギー[鶏卵]'] : [];

  // 病名一覧（主病名 + その他病名）。主病名フラグで主たる病名を識別する
  const diagnoses = [
    {
      name: primaryDiag,
      icd: primaryIcd,
      onset: patient.admitDate ? `${patient.admitDate}（推定）` : undefined,
      isPrimary: true,
    },
    ...complications.map((c) => ({ name: c.name, icd: c.icd, onset: c.onset, isPrimary: false })),
  ];

  return (
    <Stack spacing={0.25}>
      <InfoRow icon={<DiagnosisIcon sx={{ fontSize: 16 }} />} label="病名一覧">
        <Stack spacing={0.5}>
          {diagnoses.map((d, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 0.5, rowGap: 0.25 }}>
              {d.isPrimary ? (
                <Chip
                  label="主病名"
                  size="small"
                  color="primary"
                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, mr: 0.25 }}
                />
              ) : (
                <Chip
                  label="副病名"
                  size="small"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.65rem', mr: 0.25, color: 'text.secondary' }}
                />
              )}
              <IcdBadge code={d.icd} />
              <Box component="span" sx={{ fontWeight: 600 }}>{d.name}</Box>
              {d.onset && (
                <Box component="span" sx={{ ml: 0.5, color: 'text.secondary' }}>発症: {d.onset}</Box>
              )}
            </Box>
          ))}
        </Stack>
      </InfoRow>
      <InfoRow icon={<AllergyIcon sx={{ fontSize: 16 }} />} label="アレルギー" accent="#dc2626">
        {drugs.length === 0 && foods.length === 0 ? (
          <Box component="span" sx={{ color: 'text.disabled' }}>登録なし</Box>
        ) : (
          <Box component="span" sx={{ color: '#dc2626', fontWeight: 600 }}>
            {[...drugs, ...foods].join(' / ')}
          </Box>
        )}
      </InfoRow>
    </Stack>
  );
}

// ----- 基本情報 -----
function BasicInfoContent({ patient }: { patient: Patient }) {
  // mock: 保険・責任範囲・ADL/GAF・自立度
  const insurance = {
    name: '社保（協会けんぽ）',
    expire: '2027-03-31',
    payer: '01130012',
    selfPay: 30,
  };
  const responsibility = patient.admissionState === 'inpatient' ? '病棟内' : '外来通院';
  const adl = { barthel: 95, fixedAt: '2026-02-15' };
  const independence = { rank: 'B', day: '介助 (一部)', night: '見守り' };

  return (
    <Stack spacing={0.25}>
      <InfoRow icon={<InsuranceIcon sx={{ fontSize: 16 }} />} label="保険">
        <Box component="span" sx={{ fontWeight: 600 }}>{insurance.name}</Box>
        <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>有効期限 {insurance.expire}</Box>
        <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>保険者番号 {insurance.payer}</Box>
        <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>自己負担 {insurance.selfPay}%</Box>
      </InfoRow>
      <InfoRow icon={<ResponsibilityIcon sx={{ fontSize: 16 }} />} label="責任範囲">
        <Box component="span" sx={{ fontWeight: 600 }}>{responsibility}</Box>
        <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>（外出・外泊は別途指示）</Box>
      </InfoRow>
      <InfoRow icon={<AdlIcon sx={{ fontSize: 16 }} />} label="ADL">
        <Box component="span" sx={{ mr: 1 }}>
          バーセル指数: <Box component="span" sx={{ fontWeight: 600 }}>{adl.barthel}</Box>
        </Box>
        <Box component="span" sx={{ color: 'text.secondary' }}>確定日: {adl.fixedAt}</Box>
      </InfoRow>
      <InfoRow icon={<AdlIcon sx={{ fontSize: 16 }} />} label="自立度">
        <Box component="span" sx={{ mr: 1 }}>
          病棟管理ランク: <Box component="span" sx={{ fontWeight: 600 }}>{independence.rank}</Box>
        </Box>
        <Box component="span" sx={{ mr: 1, color: 'text.secondary' }}>昼: {independence.day}</Box>
        <Box component="span" sx={{ color: 'text.secondary' }}>夜: {independence.night}</Box>
      </InfoRow>
    </Stack>
  );
}

// ----- GAF -----
function GafContent() {
  const recent = [
    { date: '2026-02-15', score: 65 },
    { date: '2026-01-15', score: 60 },
    { date: '2025-12-10', score: 58 },
    { date: '2025-11-12', score: 52 },
  ];
  const latest = recent[0];
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Box sx={{ minWidth: 120, textAlign: 'center', p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">直近 GAF</Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e40af' }}>{latest.score}</Typography>
        <Typography variant="caption" color="text.secondary">{latest.date}</Typography>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
          GAF 推移（mock）
        </Typography>
        <Table size="small">
          <TableBody>
            {recent.map((r) => (
              <TableRow key={r.date}>
                <TableCell sx={{ py: 0.25, fontSize: '0.7rem', borderBottom: '1px dashed', borderColor: 'grey.200' }}>{r.date}</TableCell>
                <TableCell sx={{ py: 0.25, fontSize: '0.75rem', fontWeight: 600, borderBottom: '1px dashed', borderColor: 'grey.200', width: 60 }}>{r.score}</TableCell>
                <TableCell sx={{ py: 0.25, borderBottom: '1px dashed', borderColor: 'grey.200' }}>
                  <LinearProgress variant="determinate" value={Math.min(r.score, 100)} sx={{ height: 6, borderRadius: 0.5 }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Stack>
  );
}

// ----- 院外/状・診断書類 -----
function DocumentsContent() {
  const docs = [
    { date: '2026-02-20', kind: '紹介状（返書）', title: '〇〇クリニック → 当院（精神科）', author: '田村 医師' },
    { date: '2026-02-05', kind: '診断書',         title: '自立支援医療意見書',                   author: '田村 医師' },
    { date: '2026-01-15', kind: '院外文書',       title: '訪問看護指示書',                       author: '森田 医師' },
  ];
  return (
    <Stack spacing={0.25}>
      {docs.map((d, i) => (
        <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ py: 0.4, borderBottom: '1px dashed', borderColor: 'grey.200' }}>
          <DocIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontFamily: 'monospace', minWidth: 88 }}>{d.date}</Typography>
          <Chip size="small" label={d.kind} sx={{ height: 18, fontSize: '0.6rem', borderRadius: 0.5, bgcolor: 'info.light', color: '#fff' }} />
          <Typography variant="body2" sx={{ flex: 1, fontSize: '0.75rem', fontWeight: 600 }}>{d.title}</Typography>
          <Typography variant="caption" color="text.secondary">{d.author}</Typography>
        </Stack>
      ))}
      <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, fontStyle: 'italic' }}>
        ※ ファイルダウンロード・アップロードは別ストーリーで実装予定（gairai spec §8 整合）
      </Typography>
    </Stack>
  );
}

// ----- ファミリ -----
function FamilyContent() {
  const family = [
    { rel: '妻',   name: '鈴木 ◯子', age: 38, contact: '090-XXXX-XXXX', main: true },
    { rel: '長男', name: '鈴木 ◯太', age: 12, contact: '—' },
    { rel: '父',   name: '鈴木 ◯次', age: 72, contact: '03-XXXX-XXXX' },
  ];
  return (
    <Stack spacing={0.25}>
      {family.map((f, i) => (
        <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ py: 0.4, borderBottom: '1px dashed', borderColor: 'grey.200' }}>
          <FamilyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Chip size="small" label={f.rel} sx={{ height: 18, fontSize: '0.6rem', borderRadius: 0.5, minWidth: 32 }} />
          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 96 }}>{f.name}</Typography>
          <Typography variant="caption" color="text.secondary">{f.age} 歳</Typography>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary">{f.contact}</Typography>
          {f.main && <Chip size="small" label="主" color="primary" sx={{ height: 18, fontSize: '0.6rem', borderRadius: 0.5 }} />}
        </Stack>
      ))}
      <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, fontStyle: 'italic' }}>
        ※ 家系図描画は診療録タブ「診療録作成」ダイアログ内 Fabric.js キャンバス（別ストーリー）で対応予定
      </Typography>
    </Stack>
  );
}

// ----- クリニカルパス -----
function ClinicalPathContent() {
  const path = {
    name: '統合失調症 急性期 4 週パス',
    progress: 65,
    phases: [
      { label: '初期評価',     status: 'done' as const,  range: 'Day 1-3' },
      { label: '急性症状管理', status: 'done' as const,  range: 'Day 4-10' },
      { label: '亜急性',       status: 'doing' as const, range: 'Day 11-21' },
      { label: '退院準備',     status: 'todo' as const,  range: 'Day 22-28' },
    ],
  };
  const colorMap: Record<'done' | 'doing' | 'todo', string> = { done: '#16a34a', doing: '#1e40af', todo: '#9ca3af' };
  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} alignItems="center">
        <ClinicalPathIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{path.name}</Typography>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" sx={{ fontWeight: 700 }}>進捗 {path.progress}%</Typography>
      </Stack>
      <LinearProgress variant="determinate" value={path.progress} sx={{ height: 8, borderRadius: 0.5 }} />
      <Stack direction="row" spacing={0.5}>
        {path.phases.map((p, i) => (
          <Box key={i} sx={{ flex: 1, p: 0.5, border: '1px solid', borderColor: colorMap[p.status], borderRadius: 0.5, bgcolor: `${colorMap[p.status]}1a` }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: colorMap[p.status], display: 'block' }}>{p.label}</Typography>
            <Typography variant="caption" color="text.secondary">{p.range}</Typography>
          </Box>
        ))}
      </Stack>
      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
        ※ パス選択・編集は別ストーリーで実装予定
      </Typography>
    </Stack>
  );
}

// ----- 指示/入室 -----
function OrdersAdmissionContent({ patient }: { patient: Patient }) {
  const orders = [
    { date: '2026-02-25', title: '入院指示', detail: '第１病棟 102 号室 A 床への入室指示', status: '実施済' },
    { date: '2026-02-20', title: '入院オーダ', detail: '点滴指示・処方継続', status: '実施中' },
  ];
  // 入室予定（mock）
  const upcoming = patient.admissionState === 'inpatient'
    ? [{ date: '2026-04-15', title: '退院予定', detail: '退院時カンファレンス予定' }]
    : [];

  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block' }}>
        指示
      </Typography>
      {orders.map((o, i) => (
        <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ py: 0.4, borderBottom: '1px dashed', borderColor: 'grey.200' }}>
          <OrderAdmissionIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontFamily: 'monospace', minWidth: 88 }}>{o.date}</Typography>
          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 120 }}>{o.title}</Typography>
          <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary' }}>{o.detail}</Typography>
          <Chip size="small" label={o.status} sx={{ height: 18, fontSize: '0.6rem', borderRadius: 0.5, bgcolor: o.status === '実施済' ? 'success.light' : 'info.light', color: '#fff' }} />
        </Stack>
      ))}
      <Divider sx={{ my: 0.5 }} />
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block' }}>
        入室予定
      </Typography>
      {upcoming.length === 0 ? (
        <Typography variant="caption" color="text.disabled">登録なし</Typography>
      ) : (
        upcoming.map((u, i) => (
          <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ py: 0.4 }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', minWidth: 88 }}>{u.date}</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, minWidth: 120 }}>{u.title}</Typography>
            <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary' }}>{u.detail}</Typography>
          </Stack>
        ))
      )}
    </Stack>
  );
}
