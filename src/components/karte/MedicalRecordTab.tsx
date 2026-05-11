import { useState, useMemo, useCallback, useRef } from 'react';
import {
  Box, Paper, Stack, Typography, Chip, TextField, Button, IconButton,
  Tooltip, MenuItem, Select, FormControl, InputLabel, Snackbar, Alert,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Save, Print, AttachFile, AccountTree, Brush,
  ExitToApp, History as HistoryIcon, NoteAdd, Close as CloseIcon,
  CloudUpload, Assignment,
  ThumbUpAltOutlined, ChatBubbleOutline,
} from '@mui/icons-material';
import type { Patient, Order } from '../../types';
import { ORDERS } from '../../data/mockData';
import RestraintOrderLinks from '../isolation/RestraintOrderLinks';
import type { KarteMode } from './KartePage';

// ===== 集約タイムラインのレコード型 =====

type RecordCategory =
  | '医師記録'
  | '看護記録'
  | '看護サマリ'
  | '入退院記録'
  | 'オーダー';

interface TimelineRecord {
  id: string;
  date: string;        // YYYY/MM/DD
  dayOfWeek: string;
  category: RecordCategory;
  categoryColor: string;
  author: string;
  authorRole: string;
  content: string;
  tags: string[];
  orderNumber?: string;
  timestamp: string;   // YYYY/MM/DD HH:mm
}

const CATEGORY_COLORS: Record<RecordCategory, string> = {
  '医師記録': '#1e40af',
  '看護記録': '#c2410c',
  '看護サマリ': '#7c3aed',
  '入退院記録': '#b91c1c',
  'オーダー': '#0891b2',
};

const MOCK_RECORDS: TimelineRecord[] = [
  { id: 'kr1',  date: '2026/03/10', dayOfWeek: '月', category: '医師記録',  categoryColor: CATEGORY_COLORS['医師記録'],  author: '田村 医師',     authorRole: '医師D', content: '定期回診。状態安定。処方継続。',                                                                          tags: [],                          timestamp: '2026/03/10 10:30' },
  { id: 'kr2',  date: '2026/03/10', dayOfWeek: '月', category: '看護記録',  categoryColor: CATEGORY_COLORS['看護記録'],  author: '山本 看護師',   authorRole: '',     content: '朝の検温実施。体温36.5℃、血圧128/82。食欲あり、朝食全量摂取。表情穏やか。服薬確認済み。',                tags: ['看護記録'],                timestamp: '2026/03/10 09:00' },
  { id: 'kr3',  date: '2026/03/09', dayOfWeek: '日', category: '医師記録',  categoryColor: CATEGORY_COLORS['医師記録'],  author: '田村 医師',     authorRole: '医師D', content: 'リスパダール 2mg → 3mg に増量指示。経過観察継続。',                                                          tags: [],                          orderNumber: 'NO.827', timestamp: '2026/03/09 13:45' },
  { id: 'kr4',  date: '2026/03/09', dayOfWeek: '日', category: '看護記録',  categoryColor: CATEGORY_COLORS['看護記録'],  author: '中田 看護師',   authorRole: '',     content: '午後の回診同行。主治医より薬剤変更の指示あり。患者に説明済み。理解良好。',                                  tags: ['看護記録', 'クリニカルパス'], orderNumber: 'NO.827', timestamp: '2026/03/09 14:00' },
  { id: 'kr5',  date: '2026/03/08', dayOfWeek: '土', category: '看護サマリ', categoryColor: CATEGORY_COLORS['看護サマリ'], author: '山本 看護師',   authorRole: '',     content: '面会あり（家族：妻）。面会後やや落ち着かない様子。見守り継続。30分後に落ち着きを取り戻す。',                tags: ['退院支援'],                orderNumber: 'NO.827', timestamp: '2026/03/08 10:30' },
  { id: 'kr6',  date: '2026/03/07', dayOfWeek: '金', category: '医師記録',  categoryColor: CATEGORY_COLORS['医師記録'],  author: '田村 医師',     authorRole: '医師D', content: '血液検査結果確認。CRP 0.2、WBC 5800。炎症所見なし。現行治療継続。',                                          tags: [],                          timestamp: '2026/03/07 15:00' },
  { id: 'kr7',  date: '2026/03/06', dayOfWeek: '木', category: '入退院記録', categoryColor: CATEGORY_COLORS['入退院記録'], author: '田村 医師',     authorRole: '医師D', content: '【精神科】退院環境調整の指示。当院病棟・101号室・身長167.8cm・体重72.0kg。',                                tags: [],                          orderNumber: 'NO.837', timestamp: '2026/03/06 17:23' },
  { id: 'kr8',  date: '2026/03/05', dayOfWeek: '水', category: '医師記録',  categoryColor: CATEGORY_COLORS['医師記録'],  author: '田村 医師',     authorRole: '医師D', content: 'カンファレンス実施。退院に向けた環境調整について多職種で検討。訪問看護導入を検討中。',                      tags: ['全体カンファレンス'],      timestamp: '2026/03/05 16:00' },
  { id: 'kr9',  date: '2026/03/04', dayOfWeek: '火', category: '看護記録',  categoryColor: CATEGORY_COLORS['看護記録'],  author: '佐々木 看護師', authorRole: '',     content: '作業療法参加。革細工に取り組む。集中力30分程度持続。本人より「楽しい」との発言あり。',                      tags: ['看護記録'],                timestamp: '2026/03/04 14:00' },
  { id: 'kr10', date: '2026/03/03', dayOfWeek: '月', category: '看護サマリ', categoryColor: CATEGORY_COLORS['看護サマリ'], author: '山本 看護師',   authorRole: '',     content: '週間看護サマリ。全体的に状態安定。ADL自立度向上傾向。退院支援計画に沿って進行中。家族との面会も良好。',     tags: ['看護サマリ', '退院支援'],  timestamp: '2026/03/03 16:00' },
];

// ===== オーダーをタイムラインレコードへ変換 =====

const ORDER_TYPE_DESCRIPTION: Record<Order['type'], string> = {
  '処方': '処方',
  '注射': '注射',
  '心理検査': '心理検査',
  'ECT': 'ECT',
  '入院定時': '入院定時',
  'IF': 'IF',
  '文字': 'テキスト',
};

function ordersToTimeline(patientId: string): TimelineRecord[] {
  return ORDERS
    .filter((o) => o.patientId === patientId)
    .map<TimelineRecord>((o) => {
      const dateStr = o.startDate.replace(/-/g, '/');
      const dt = new Date(o.startDate);
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dt.getDay()];
      return {
        id: `ord-${o.id}`,
        date: dateStr,
        dayOfWeek,
        category: 'オーダー',
        categoryColor: CATEGORY_COLORS['オーダー'],
        author: o.doctorName,
        authorRole: '医師',
        content: `[${ORDER_TYPE_DESCRIPTION[o.type]}] ${o.content}（${o.schedule}・${o.days}日分）`,
        tags: [o.status],
        orderNumber: o.id,
        timestamp: `${dateStr} 09:00`,
      };
    });
}

// ===== カテゴリ別フィルタ Chip =====

const FILTER_TABS: { key: RecordCategory | 'all'; label: string }[] = [
  { key: 'all',         label: '全て' },
  { key: '医師記録',    label: '医師記録' },
  { key: '看護記録',    label: '看護記録' },
  { key: '看護サマリ',  label: '看護サマリ' },
  { key: '入退院記録',  label: '入退院記録' },
  { key: 'オーダー',    label: 'オーダー' },
];

// ===== us-47: タグベースフィルタ Chip（KarteAlphaPage 旧版踏襲） =====

const TAG_FILTERS = [
  '全体カンファレンス',
  'NSTカンファレンス',
  '褥瘡カンファレンス',
  '臨床記録',
  '行動範囲',
  '外出/外泊',
  '日勤帯記録',
];

// ===== us-47: 期間切替 =====

type PeriodKey = '6days' | '30days' | 'all';

const PERIOD_LABELS: Record<PeriodKey, string> = {
  '6days': '最近の6日分',
  '30days': '最近の30日分',
  'all': '全件',
};

const TAG_BG_COLOR_MAP: Record<string, string> = {
  '退院支援':       'error.light',
  '看護師カンファ': 'success.light',
  '全体カンファレンス': 'success.light',
};

// ===== Component =====

interface MedicalRecordTabProps {
  patient: Patient;
  mode: KarteMode;
  /** 「指示簿タブを開く」リンク用 */
  onOpenOrdersTab: () => void;
  /** us-36 サブ B: 隔離拘束指示リンクのクリックハンドラ（mode='inpatient' のみ表示） */
  onRequestRestraintOrder: (title: string, editOrderId?: string) => void;
}

export default function MedicalRecordTab({
  patient,
  mode,
  onOpenOrdersTab,
  onRequestRestraintOrder,
}: MedicalRecordTabProps) {
  // ----- 集約タイムライン -----
  const timeline = useMemo<TimelineRecord[]>(() => {
    const merged = [...MOCK_RECORDS, ...ordersToTimeline(patient.id)];
    return merged.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [patient.id]);

  const [activeFilter, setActiveFilter] = useState<RecordCategory | 'all'>('all');
  // us-47: 期間切替（既定 6 日分）
  const [period, setPeriod] = useState<PeriodKey>('6days');
  // us-47: タグフィルタ（null = 全件）
  const [activeTag, setActiveTag] = useState<string | null>(null);
  // us-47: 「最初へ ▲」スクロール用
  const timelineBodyRef = useRef<HTMLDivElement | null>(null);

  const groupedRecords = useMemo<Record<string, TimelineRecord[]>>(() => {
    // category + tag フィルタを AND 条件で適用
    let filtered = activeFilter === 'all' ? timeline : timeline.filter((r) => r.category === activeFilter);
    if (activeTag) {
      filtered = filtered.filter((r) => r.tags.includes(activeTag));
    }
    // 期間フィルタ: 最新の日付グループから N 個まで（6days / 30days / all）
    const result: Record<string, TimelineRecord[]> = {};
    filtered.forEach((r) => {
      if (!result[r.date]) result[r.date] = [];
      result[r.date].push(r);
    });
    if (period === 'all') return result;
    const dateKeys = Object.keys(result); // timestamp 降順ソート済 → date も降順
    const keep = period === '6days' ? 6 : 30;
    const sliced = dateKeys.slice(0, keep);
    const periodFiltered: Record<string, TimelineRecord[]> = {};
    sliced.forEach((d) => { periodFiltered[d] = result[d]; });
    return periodFiltered;
  }, [timeline, activeFilter, activeTag, period]);

  // us-47: 「最初へ ▲」スクロールトップ
  const scrollToTop = useCallback(() => {
    if (timelineBodyRef.current) {
      timelineBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // ----- ダイアログ群 -----
  const [newRecordOpen, setNewRecordOpen] = useState(false);

  // ----- スナックバー -----
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' }>({
    open: false, message: '', severity: 'info',
  });
  const showSnackbar = (message: string, severity: 'success' | 'info' | 'warning' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handlePrint = () => {
    window.print();
  };

  // ===== Render =====

  return (
    <Stack spacing={1}>
      {/* ===== タブ上部ツールバー: 隔離拘束指示リンク（入院 mode のみ）+ 指示簿タブへの導線 ===== */}
      <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap">
        {mode === 'inpatient' && (
          <RestraintOrderLinks
            patient={patient}
            onRequestOrder={onRequestRestraintOrder}
          />
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          variant="text"
          onClick={() => onOpenOrdersTab()}
          startIcon={<Assignment fontSize="inherit" />}
          sx={{ fontSize: '0.65rem', minWidth: 0 }}
        >
          指示簿タブ
        </Button>
      </Stack>

      {/* ===== 期間切替 + ページング操作（us-47） ===== */}
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
          期間:
        </Typography>
        {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((p) => (
          <Chip
            key={p}
            label={PERIOD_LABELS[p]}
            size="small"
            color={period === p ? 'primary' : 'default'}
            variant={period === p ? 'filled' : 'outlined'}
            onClick={() => setPeriod(p)}
            sx={{ fontSize: '0.65rem', height: 22 }}
          />
        ))}
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {Object.keys(groupedRecords).length} 日分 / {Object.values(groupedRecords).reduce((s, arr) => s + arr.length, 0)} 件
        </Typography>
        <Button
          size="small"
          variant="text"
          sx={{ fontSize: '0.65rem' }}
          onClick={scrollToTop}
        >
          最初へ ▲
        </Button>
        <Button
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.65rem' }}
          onClick={() => showSnackbar('これ以上のレコードはありません（mock）', 'info')}
        >
          続き ▼
        </Button>
      </Stack>

      {/* ===== タグフィルタ Chip 行（us-47・KarteAlphaPage 踏襲・OR 条件 1 つ選択） ===== */}
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ overflowX: 'auto', pb: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.5, flexShrink: 0 }}>
          タグ:
        </Typography>
        <Chip
          label="全て"
          size="small"
          color={activeTag === null ? 'primary' : 'default'}
          variant={activeTag === null ? 'filled' : 'outlined'}
          onClick={() => setActiveTag(null)}
          sx={{ fontSize: '0.65rem', height: 22, flexShrink: 0 }}
        />
        {TAG_FILTERS.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            color={activeTag === tag ? 'primary' : 'default'}
            variant={activeTag === tag ? 'filled' : 'outlined'}
            onClick={() => setActiveTag(tag)}
            sx={{ fontSize: '0.65rem', height: 22, flexShrink: 0 }}
          />
        ))}
      </Stack>

      {/* ===== タイムライン本体（フィルタ Chip + 日付サイドバー + レコード一覧） ===== */}

            <Stack direction="row" spacing={0.5} sx={{ mb: 1, overflowX: 'auto', pb: 0.5 }}>
              <Chip
                label={FILTER_TABS[0].label}
                size="small"
                color={activeFilter === 'all' ? 'primary' : 'default'}
                variant={activeFilter === 'all' ? 'filled' : 'outlined'}
                onClick={() => setActiveFilter('all')}
                sx={{ fontSize: '0.65rem', height: 22 }}
              />
              <Divider orientation="vertical" flexItem />
              {FILTER_TABS.slice(1).map((tab) => (
                <Chip
                  key={tab.key}
                  label={tab.label}
                  size="small"
                  color={activeFilter === tab.key ? 'primary' : 'default'}
                  variant={activeFilter === tab.key ? 'filled' : 'outlined'}
                  onClick={() => setActiveFilter(tab.key as RecordCategory)}
                  sx={{ fontSize: '0.65rem', height: 22 }}
                />
              ))}
            </Stack>

            <Box sx={{ display: 'flex', gap: 1, maxHeight: 480, minHeight: 240 }}>
              {/* 日付サイドバー */}
              <Box sx={{ width: 110, flexShrink: 0, overflowY: 'auto', borderRight: '1px solid', borderColor: 'divider', pr: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.6rem', display: 'block', mb: 0.5 }}>
                  【最近の{Object.keys(groupedRecords).length}日分】
                </Typography>
                {Object.entries(groupedRecords).map(([date, records]) => {
                  const d = date.split('/');
                  const dayStr = `${d[2]}日(${records[0].dayOfWeek})`;
                  const hasDoctor = records.some((r) => r.category === '医師記録');
                  const hasNursing = records.some((r) => r.category === '看護記録' || r.category === '看護サマリ');
                  const hasAdmission = records.some((r) => r.category === '入退院記録');
                  const hasOrder = records.some((r) => r.category === 'オーダー');
                  return (
                    <Box
                      key={date}
                      onClick={() => {
                        const el = document.getElementById(`mr-record-date-${date.replace(/\//g, '-')}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 0.5,
                        py: 0.3, px: 0.5, cursor: 'pointer', borderRadius: 0.5,
                        '&:hover': { bgcolor: '#e3f2fd' },
                      }}
                    >
                      <Typography sx={{ fontSize: '0.65rem', color: 'primary.main', fontWeight: 600 }}>※</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.primary', fontWeight: 500 }}>
                        {dayStr}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.2, ml: 'auto' }}>
                        {hasDoctor && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: CATEGORY_COLORS['医師記録'] }} />}
                        {hasNursing && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: CATEGORY_COLORS['看護記録'] }} />}
                        {hasAdmission && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: CATEGORY_COLORS['入退院記録'] }} />}
                        {hasOrder && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: CATEGORY_COLORS['オーダー'] }} />}
                      </Box>
                    </Box>
                  );
                })}
                {Object.keys(groupedRecords).length === 0 && (
                  <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', py: 1, textAlign: 'center' }}>
                    該当なし
                  </Typography>
                )}
              </Box>

              {/* レコード本体 */}
              <Box ref={timelineBodyRef} sx={{ flex: 1, overflowY: 'auto' }}>
                {Object.entries(groupedRecords).map(([date, records], gi) => (
                  <Box key={date} id={`mr-record-date-${date.replace(/\//g, '-')}`}>
                    <Box
                      sx={{
                        bgcolor: 'grey.50',
                        borderBottom: 1,
                        borderTop: gi > 0 ? 1 : 0,
                        borderColor: 'divider',
                        px: 1,
                        py: 0.3,
                        mt: gi > 0 ? 1 : 0,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {date}({records[0].dayOfWeek})
                      </Typography>
                    </Box>

                    {records.map((record) => (
                      <Box
                        key={record.id}
                        sx={{
                          display: 'flex',
                          py: 0.8, px: 1,
                          borderBottom: '1px solid',
                          borderColor: 'grey.100',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <Box sx={{ width: 50, flexShrink: 0 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                            {record.timestamp.split(' ')[1]}
                          </Typography>
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.3 }} flexWrap="wrap">
                            {record.tags.map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.6rem',
                                  bgcolor: TAG_BG_COLOR_MAP[tag] ?? 'info.light',
                                  color: '#fff',
                                }}
                              />
                            ))}
                            <Typography variant="caption" sx={{ fontWeight: 700, color: record.categoryColor }}>
                              {record.category}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {record.author}
                            </Typography>
                            {record.orderNumber && (
                              <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                                {record.orderNumber}
                              </Typography>
                            )}
                          </Stack>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                            {record.content}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3 }}>
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                              {record.authorRole && `${record.authorRole}/`}
                              {record.author}　{record.timestamp}
                            </Typography>
                            <Box sx={{ flex: 1 }} />
                            <Tooltip title="リビジョン履歴（別ストーリー予定）">
                              <IconButton size="small" sx={{ p: 0.2 }} onClick={() => showSnackbar('リビジョン履歴は別ストーリーで実装予定', 'info')}>
                                <HistoryIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="いいね">
                              <IconButton size="small" sx={{ p: 0.2 }}>
                                <ThumbUpAltOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="コメント">
                              <IconButton size="small" sx={{ p: 0.2 }}>
                                <ChatBubbleOutline sx={{ fontSize: 14, color: 'text.disabled' }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ))}
                {Object.keys(groupedRecords).length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                    該当する記録がありません
                  </Typography>
                )}
              </Box>
            </Box>

      {/* ===== 参照画面用アクションバー（編集はダイアログで） ===== */}
      <Paper elevation={2} sx={{ p: 0.75, position: 'sticky', bottom: 0, zIndex: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap alignItems="center">
          <Button
            size="small"
            variant="contained"
            color={mode === 'outpatient' ? 'success' : 'primary'}
            startIcon={<NoteAdd />}
            onClick={() => setNewRecordOpen(true)}
          >
            新規記載
          </Button>
          <Button size="small" variant="outlined" startIcon={<Print />} onClick={handlePrint}>
            印刷
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button size="small" variant="outlined" startIcon={<ExitToApp />} onClick={() => showSnackbar('診療録を閉じました（mock）', 'info')}>
            閉じる
          </Button>
        </Stack>
      </Paper>

      {/* ===== 新規記載ダイアログ（編集はここで完結） ===== */}
      <NewRecordDialog
        open={newRecordOpen}
        mode={mode}
        onClose={() => setNewRecordOpen(false)}
        onSaved={(message) => showSnackbar(message, 'success')}
      />

      {/* ===== Snackbar ===== */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Stack>
  );
}

// ===== 新規記載ダイアログ =====

const SOAP_TEMPLATES = [
  { id: 'init',       label: '初診 SOAP', s: '主訴：\n現病歴：\n', o: '身体所見：\nバイタル：\n', a: '診断：\n', p: '治療方針：\n処方：\n' },
  { id: 'revisit',    label: '再診 SOAP', s: '前回からの変化：\n', o: '所見：\n', a: '評価：\n', p: '計画：\n' },
  { id: 'observation',label: '経過観察',   s: '症状経過：\n',         o: '客観的所見：\n', a: '経過評価：\n', p: '継続観察項目：\n' },
  { id: 'conference', label: 'カンファ記録',s: '参加職種：\n議題：\n', o: '検討内容：\n', a: '結論：\n', p: '次回までのアクション：\n' },
];

interface SoapForm {
  s: string;
  o: string;
  a: string;
  p: string;
}

const EMPTY_SOAP: SoapForm = { s: '', o: '', a: '', p: '' };

function NewRecordDialog({
  open,
  mode,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: KarteMode;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [soap, setSoap] = useState<SoapForm>(EMPTY_SOAP);
  const [templateId, setTemplateId] = useState<string>('');
  const [drawingDialog, setDrawingDialog] = useState<{ open: boolean; kind: '家系図' | 'シェーマ' | null }>({ open: false, kind: null });
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [innerSnackbar, setInnerSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  const isDirty = soap.s !== '' || soap.o !== '' || soap.a !== '' || soap.p !== '';

  const updateSoap = useCallback((key: keyof SoapForm, value: string) => {
    setSoap((prev) => ({ ...prev, [key]: value }));
  }, []);

  const insertTemplate = useCallback(() => {
    if (!templateId) return;
    const tpl = SOAP_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setSoap((prev) => ({
      s: prev.s + tpl.s,
      o: prev.o + tpl.o,
      a: prev.a + tpl.a,
      p: prev.p + tpl.p,
    }));
  }, [templateId]);

  const reset = () => {
    setSoap(EMPTY_SOAP);
    setTemplateId('');
  };

  const handleSave = () => {
    if (!isDirty) {
      setInnerSnackbar({ open: true, message: '入力内容がありません' });
      return;
    }
    onSaved('カルテを保存しました（mock・実永続化は未実装）');
    reset();
    onClose();
  };

  const handleFinishExam = () => {
    if (isDirty) {
      onSaved('保存して診察終了しました（mock）');
      reset();
    } else {
      onSaved('診察終了処理（mock・別ストーリーで実装予定）');
    }
    onClose();
  };

  const handleCancel = () => {
    if (isDirty) {
      setConfirmCancel(true);
      return;
    }
    onClose();
  };

  const handleConfirmDiscard = () => {
    setConfirmCancel(false);
    reset();
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <NoteAdd fontSize="small" />
            <span>新規記載（SOAP）</span>
            <Chip
              size="small"
              label={mode === 'outpatient' ? '外来診療録' : '入院診療録'}
              color={mode === 'outpatient' ? 'success' : 'primary'}
              sx={{ height: 22, fontSize: '0.65rem' }}
            />
            {isDirty && (
              <Chip size="small" label="未保存" color="warning" sx={{ height: 22, fontSize: '0.65rem' }} />
            )}
          </Stack>
          <Box sx={{ flex: 1 }} />
          <IconButton size="small" onClick={handleCancel}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="tpl-label">テンプレート</InputLabel>
                <Select
                  labelId="tpl-label"
                  label="テンプレート"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  <MenuItem value=""><em>選択してください</em></MenuItem>
                  {SOAP_TEMPLATES.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button size="small" variant="outlined" disabled={!templateId} onClick={insertTemplate}>
                テンプレート挿入
              </Button>
            </Stack>

            <SoapField label="S（主観的所見）"  helper="主訴・症状・既往の聴取内容など"   value={soap.s} onChange={(v) => updateSoap('s', v)} />
            <SoapField label="O（客観的所見）"  helper="身体所見・バイタル・検査結果など" value={soap.o} onChange={(v) => updateSoap('o', v)} />
            <SoapField label="A（評価・診断）"  helper="所見の評価・診断・鑑別"          value={soap.a} onChange={(v) => updateSoap('a', v)} />
            <SoapField label="P（計画・処置）"  helper="治療方針・処方・指示・次回計画"  value={soap.p} onChange={(v) => updateSoap('p', v)} />

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Paper variant="outlined" sx={{ p: 1, flex: 1, minWidth: 240 }}>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                  <AttachFile sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>添付ファイル</Typography>
                  <Box sx={{ flex: 1 }} />
                  <Button size="small" variant="outlined" startIcon={<CloudUpload sx={{ fontSize: 14 }} />} sx={{ fontSize: '0.65rem' }} onClick={() => setInnerSnackbar({ open: true, message: 'ファイルアップロード（mock・別ストーリーで実装予定）' })}>
                    アップロード
                  </Button>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  対応形式: PDF / JPG / PNG（mock・gairai spec §8 整合）
                </Typography>
              </Paper>

              <Paper variant="outlined" sx={{ p: 1, flex: 1, minWidth: 240 }}>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                  <Brush sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>描画ツール</Typography>
                </Stack>
                <Stack direction="row" spacing={0.5}>
                  <Button size="small" variant="outlined" startIcon={<AccountTree sx={{ fontSize: 14 }} />} sx={{ fontSize: '0.65rem' }} onClick={() => setDrawingDialog({ open: true, kind: '家系図' })}>
                    家系図
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<Brush sx={{ fontSize: 14 }} />} sx={{ fontSize: '0.65rem' }} onClick={() => setDrawingDialog({ open: true, kind: 'シェーマ' })}>
                    シェーマ
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1 }}>
          <Button onClick={handleCancel} startIcon={<CloseIcon />}>キャンセル</Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleFinishExam} variant="outlined" startIcon={<ExitToApp />}>
            診察終了
          </Button>
          <Button onClick={handleSave} variant="contained" color={mode === 'outpatient' ? 'success' : 'primary'} startIcon={<Save />}>
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* キャンセル時の破棄確認 */}
      <Dialog open={confirmCancel} onClose={() => setConfirmCancel(false)} maxWidth="xs" fullWidth>
        <DialogTitle>保存していない変更があります</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            ここで閉じると入力内容は失われます。よろしいですか？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCancel(false)}>編集に戻る</Button>
          <Button onClick={handleConfirmDiscard} variant="contained" color="warning">
            破棄して閉じる
          </Button>
        </DialogActions>
      </Dialog>

      {/* 描画プレースホルダ */}
      <Dialog open={drawingDialog.open} onClose={() => setDrawingDialog({ open: false, kind: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{drawingDialog.kind} 描画</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Fabric.js キャンバスによる{drawingDialog.kind}描画は別ストーリーで実装予定です（gairai spec §9 参照）。
          </Typography>
          <Typography variant="caption" color="text.secondary">
            描画データは JSON でシリアライズ保存、編集時は SchemaDrawer / 読み取り表示は CanvasRenderer を想定。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDrawingDialog({ open: false, kind: null })}>閉じる</Button>
        </DialogActions>
      </Dialog>

      {/* ダイアログ内 snackbar */}
      <Snackbar
        open={innerSnackbar.open}
        autoHideDuration={3500}
        onClose={() => setInnerSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" onClose={() => setInnerSnackbar({ open: false, message: '' })}>
          {innerSnackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

// ===== SOAP セクション TextField =====

function SoapField({ label, helper, value, onChange }: { label: string; helper: string; value: string; onChange: (v: string) => void }) {
  return (
    <TextField
      fullWidth
      multiline
      minRows={3}
      maxRows={10}
      size="small"
      label={label}
      helperText={helper}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
