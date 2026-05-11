import { useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Chip, Button, Paper, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { EventAvailable as BookingIcon } from '@mui/icons-material';
import type { Patient } from '../../types';
import type { KarteMode } from './KartePage';

// ===== スケジュール型 =====

type ScheduleKind = '来院予約' | '入退院予定' | '検査予定' | 'その他';

interface ScheduleEntry {
  id: string;
  date: string;       // YYYY-MM-DD
  time?: string;      // HH:mm
  kind: ScheduleKind;
  title: string;
  doctor?: string;
  memo?: string;
}

const KIND_COLOR: Record<ScheduleKind, 'primary' | 'success' | 'warning' | 'default'> = {
  '来院予約':     'primary',
  '入退院予定':   'success',
  '検査予定':     'warning',
  'その他':       'default',
};

// PM 指示（2026-05-11）: P001-P003 は患者像に沿った専用データに差し替え、
// それ以外はハッシュベースのサブセット表示。
const PATIENT_SCHEDULES: Record<string, ScheduleEntry[]> = {
  // ===== P001 山田 太郎（52 歳 男・田村 医師・退院近い慢性期）=====
  P001: [
    { id: 'P001-s1',  date: '2026-02-01', time: '10:00', kind: '入退院予定', title: '入院（精神科）',                    doctor: '田村 医師', memo: '統合失調症 急性増悪' },
    { id: 'P001-s2',  date: '2026-02-05', time: '14:30', kind: '検査予定',   title: '血液検査・心電図',                  doctor: '田村 医師', memo: '入院時定期評価' },
    { id: 'P001-s3',  date: '2026-02-19', time: '11:00', kind: '検査予定',   title: 'WAIS-IV 検査',                      doctor: '田村 医師', memo: '初回評価・心理士同席' },
    { id: 'P001-s4',  date: '2026-03-01',                kind: 'その他',     title: '退院支援多職種カンファ',            doctor: '田村 医師', memo: 'PSW・看護師・OT 参加' },
    { id: 'P001-s5',  date: '2026-03-08', time: '14:00', kind: '来院予約',   title: '面会（家族・妻）',                                                       memo: '面会室 A' },
    { id: 'P001-s6',  date: '2026-03-15', time: '11:00', kind: '検査予定',   title: 'WAIS-IV 再評価',                    doctor: '田村 医師', memo: 'ORD104 連動' },
    { id: 'P001-s7',  date: '2026-03-22',                kind: 'その他',     title: '退院前外泊（試験）',                doctor: '田村 医師', memo: '2 泊 3 日・自宅' },
    { id: 'P001-s8',  date: '2026-03-28', time: '10:00', kind: '入退院予定', title: '退院予定',                          doctor: '田村 医師', memo: '訪問看護導入後' },
    { id: 'P001-s9',  date: '2026-04-04', time: '10:30', kind: '来院予約',   title: '退院後 初回外来',                   doctor: '田村 医師', memo: '採血 + 服薬指導' },
    { id: 'P001-s10', date: '2026-04-18', time: '10:30', kind: '来院予約',   title: '外来フォロー',                      doctor: '田村 医師' },
    { id: 'P001-s11', date: '2026-05-02', time: '10:30', kind: '来院予約',   title: '外来フォロー',                      doctor: '田村 医師' },
    { id: 'P001-s12', date: '2026-05-16', time: '10:30', kind: '来院予約',   title: '外来フォロー',                      doctor: '田村 医師' },
  ],
  // ===== P002 佐藤 花子(67 歳 女・岸本 医師・認知機能評価中) =====
  P002: [
    { id: 'P002-s1',  date: '2026-02-15', time: '09:30', kind: '入退院予定', title: '入院(精神科)',                      doctor: '岸本 医師', memo: '双極性障害 + 認知機能低下疑い' },
    { id: 'P002-s2',  date: '2026-02-19', time: '13:00', kind: '検査予定',   title: 'HDS-R 認知機能評価',                doctor: '岸本 医師', memo: 'ORD204 連動・実施済' },
    { id: 'P002-s3',  date: '2026-02-25', time: '14:00', kind: 'その他',     title: '家族説明(長男)',                    doctor: '岸本 医師', memo: '治療方針・退院後体制' },
    { id: 'P002-s4',  date: '2026-03-04', time: '14:30', kind: '検査予定',   title: 'MRI(頭部)',                         doctor: '岸本 医師', memo: '器質性除外目的・院内放射線科' },
    { id: 'P002-s5',  date: '2026-03-11', time: '09:00', kind: '検査予定',   title: '血液生化学(リチウム血中濃度)',      doctor: '岸本 医師', memo: 'リーマス 600mg 効果確認' },
    { id: 'P002-s6',  date: '2026-03-20', time: '13:00', kind: '検査予定',   title: 'MMSE 再評価',                       doctor: '岸本 医師', memo: 'ORD205 連動・心理士同席' },
    { id: 'P002-s7',  date: '2026-03-27',                kind: 'その他',     title: 'ケアマネ面談',                      doctor: '岸本 医師', memo: '退院後の介護保険サービス調整' },
    { id: 'P002-s8',  date: '2026-04-10', time: '11:30', kind: '入退院予定', title: '退院予定',                          doctor: '岸本 医師', memo: 'デイケア + 訪問看護導入' },
    { id: 'P002-s9',  date: '2026-04-24', time: '11:00', kind: '来院予約',   title: '退院後 初回外来',                   doctor: '岸本 医師' },
    { id: 'P002-s10', date: '2026-05-22', time: '11:00', kind: '来院予約',   title: '外来フォロー',                      doctor: '岸本 医師', memo: '血液検査同時実施' },
  ],
  // ===== P003 鈴木 一郎(41 歳 男・森田 医師・隔離下急性期) =====
  P003: [
    { id: 'P003-s1',  date: '2026-02-10', time: '02:30', kind: '入退院予定', title: '緊急入院(精神科)',                  doctor: '森田 医師', memo: '措置入院・隔離指示同時' },
    { id: 'P003-s2',  date: '2026-02-12', time: '10:00', kind: 'その他',     title: '入院時カンファ',                    doctor: '森田 医師', memo: '主治医・病棟看護師・PSW' },
    { id: 'P003-s3',  date: '2026-02-24', time: '14:00', kind: 'その他',     title: 'デカン酸フルフェナジン 投与',       doctor: '森田 医師', memo: 'ORD002 連動・隔週' },
    { id: 'P003-s4',  date: '2026-03-01', time: '11:00', kind: '検査予定',   title: 'GAF 評価',                          doctor: '森田 医師', memo: 'ORD305 連動・実施済' },
    { id: 'P003-s5',  date: '2026-03-09', time: '13:45', kind: 'その他',     title: 'リスパダール 増量検討',             doctor: '森田 医師', memo: '2mg → 3mg・ORD301 連動' },
    { id: 'P003-s6',  date: '2026-03-18', time: '15:00', kind: 'その他',     title: '家族面談(妻)',                      doctor: '森田 医師', memo: '退院環境調整・ORD308 連動' },
    { id: 'P003-s7',  date: '2026-03-25', time: '10:00', kind: '検査予定',   title: '隔離解除判定',                      doctor: '森田 医師', memo: '医師 2 名同席で判定' },
    { id: 'P003-s8',  date: '2026-04-08',                kind: 'その他',     title: '退院支援カンファ',                  doctor: '森田 医師', memo: 'グループホーム見学調整' },
    { id: 'P003-s9',  date: '2026-04-22', time: '10:00', kind: '来院予約',   title: 'ACT 訪問(試行)',                                                           memo: '退院前訪問・ACT チーム' },
    { id: 'P003-s10', date: '2026-05-13', time: '11:30', kind: '入退院予定', title: '退院予定',                          doctor: '森田 医師', memo: 'グループホーム入居同時' },
    { id: 'P003-s11', date: '2026-05-27', time: '14:00', kind: '来院予約',   title: '退院後 初回外来',                   doctor: '森田 医師' },
  ],
};

// 患者ごとに固定の mock スケジュール（P001-P003 は専用データ、それ以外はハッシュベース fallback）
function buildSchedule(patientId: string): ScheduleEntry[] {
  if (PATIENT_SCHEDULES[patientId]) return PATIENT_SCHEDULES[patientId];
  // P001-P003 以外: 既存ハッシュベース fallback
  const seed = patientId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const base: ScheduleEntry[] = [
    { id: `${patientId}-s1`, date: '2026-05-15', time: '10:30', kind: '来院予約',   title: '次回外来予約',           doctor: '田村 医師', memo: '採血 + 診察' },
    { id: `${patientId}-s2`, date: '2026-04-30', time: '14:00', kind: '入退院予定', title: '退院予定（暫定）',       doctor: '森田 医師', memo: '退院時カンファ後' },
    { id: `${patientId}-s3`, date: '2026-04-22', time: '09:00', kind: '検査予定',   title: '採血・心電図',           doctor: '田村 医師', memo: '定期検査' },
    { id: `${patientId}-s4`, date: '2026-05-08', time: '15:30', kind: '来院予約',   title: 'フォローアップ来院',     doctor: '田村 医師' },
    { id: `${patientId}-s5`, date: '2026-03-28', time: '11:00', kind: '検査予定',   title: 'WAIS-IV 再評価',         doctor: '田村 医師' },
    { id: `${patientId}-s6`, date: '2026-03-15',                kind: 'その他',     title: '退院支援多職種カンファ', memo: '家族同席予定' },
    { id: `${patientId}-s7`, date: '2026-02-25', time: '10:00', kind: '入退院予定', title: '入院',                   doctor: '森田 医師' },
  ];
  // 患者によってサブセットを変える（ハッシュ % 2 == 0 で奇偶選択）
  return base.filter((_, i) => (seed + i) % 3 !== 0);
}

// 期間フィルタ
type PeriodKey = 'future' | 'past' | 'all';
const PERIOD_LABELS: Record<PeriodKey, string> = {
  future: '今後',
  past:   '過去',
  all:    '全期間',
};

const KIND_FILTERS: { key: ScheduleKind | 'all'; label: string }[] = [
  { key: 'all',         label: '全て' },
  { key: '来院予約',     label: '来院予約' },
  { key: '入退院予定',   label: '入退院予定' },
  { key: '検査予定',     label: '検査予定' },
  { key: 'その他',       label: 'その他' },
];

// ===== Component =====

interface ScheduleTabProps {
  patient: Patient;
  mode: KarteMode;
}

export default function ScheduleTab({ patient, mode }: ScheduleTabProps) {
  const all = useMemo(() => buildSchedule(patient.id), [patient.id]);
  const [period, setPeriod] = useState<PeriodKey>('future');
  const [kindFilter, setKindFilter] = useState<ScheduleKind | 'all'>('all');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // 現在日（mock 上では今日 = 2026-05-08 想定だが、JS 実行時の Date を使う）
  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let list = all;
    if (period === 'future') list = list.filter((e) => e.date >= today);
    else if (period === 'past') list = list.filter((e) => e.date < today);
    if (kindFilter !== 'all') list = list.filter((e) => e.kind === kindFilter);
    // 日付昇順（古い → 新しい）
    return [...list].sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));
  }, [all, period, kindFilter, today]);

  const accent: 'success' | 'primary' = mode === 'outpatient' ? 'success' : 'primary';

  return (
    <Stack spacing={1.5}>
      {/* 期間切替 + 件数 + 予約登録 */}
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
          期間:
        </Typography>
        {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((p) => (
          <Chip
            key={p}
            label={PERIOD_LABELS[p]}
            size="small"
            color={period === p ? accent : 'default'}
            variant={period === p ? 'filled' : 'outlined'}
            onClick={() => setPeriod(p)}
            sx={{ fontSize: '0.7rem', height: 22 }}
          />
        ))}
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {filtered.length} 件
        </Typography>
        <Button
          size="small"
          variant="outlined"
          color={accent}
          startIcon={<BookingIcon />}
          onClick={() => setBookingOpen(true)}
        >
          予約登録
        </Button>
      </Stack>

      {/* 種別フィルタ */}
      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>
          種別:
        </Typography>
        {KIND_FILTERS.map((k) => (
          <Chip
            key={k.key}
            label={k.label}
            size="small"
            color={kindFilter === k.key ? 'primary' : 'default'}
            variant={kindFilter === k.key ? 'filled' : 'outlined'}
            onClick={() => setKindFilter(k.key)}
            sx={{ fontSize: '0.65rem', height: 22 }}
          />
        ))}
      </Stack>

      {/* スケジュール一覧 */}
      {filtered.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            該当するスケジュールはありません（{PERIOD_LABELS[period]}
            {kindFilter !== 'all' ? ` / ${kindFilter}` : ''}）。
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={0.5}>
          {filtered.map((e) => {
            const isPast = e.date < today;
            return (
              <Paper
                key={e.id}
                variant="outlined"
                sx={{
                  px: 1.25,
                  py: 0.75,
                  bgcolor: isPast ? 'grey.100' : 'background.paper',
                  opacity: isPast ? 0.85 : 1,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ minWidth: 96 }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', fontWeight: 700 }}>
                      {e.date}
                    </Typography>
                    {e.time && (
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                        {e.time}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={e.kind}
                    size="small"
                    color={KIND_COLOR[e.kind]}
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.title}
                    </Typography>
                    {e.memo && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {e.memo}
                      </Typography>
                    )}
                  </Box>
                  {e.doctor && (
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                      {e.doctor}
                    </Typography>
                  )}
                  <Chip
                    label={isPast ? '実績' : '予定'}
                    size="small"
                    variant="outlined"
                    color={isPast ? 'default' : accent}
                    sx={{ height: 20, fontSize: '0.6rem', minWidth: 48 }}
                  />
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* 予約登録プレースホルダ */}
      <Dialog open={bookingOpen} onClose={() => setBookingOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>予約登録</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            予約登録ダイアログは別ストーリーで実装予定です（予約システム連携 / gairai medical-records spec のアクション一覧参照）。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" onClose={() => setSnackbar({ open: false, message: '' })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
