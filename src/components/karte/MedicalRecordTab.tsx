import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Box, Paper, Stack, Typography, Chip, TextField, Button, IconButton,
  Tooltip, MenuItem, Select, FormControl, InputLabel, Snackbar, Alert,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Save, Print, AttachFile, AccountTree, Brush,
  ExitToApp, History as HistoryIcon, NoteAdd, Close as CloseIcon,
  CloudUpload, Assignment, Search as SearchIcon, ContentCopy,
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
  '入退院記録': '#b91c1c',
  'オーダー': '#0891b2',
};

const MOCK_RECORDS: TimelineRecord[] = [
  { id: 'kr1',  date: '2026/03/10', dayOfWeek: '月', category: '医師記録',  categoryColor: CATEGORY_COLORS['医師記録'],  author: '田村 医師',     authorRole: '医師D', content: '定期回診。状態安定。処方継続。',                                                                          tags: [],                          timestamp: '2026/03/10 10:30' },
  { id: 'kr2',  date: '2026/03/10', dayOfWeek: '月', category: '看護記録',  categoryColor: CATEGORY_COLORS['看護記録'],  author: '山本 看護師',   authorRole: '',     content: '朝の検温実施。体温36.5℃、血圧128/82。食欲あり、朝食全量摂取。表情穏やか。服薬確認済み。',                tags: ['看護記録'],                timestamp: '2026/03/10 09:00' },
  { id: 'kr3',  date: '2026/03/09', dayOfWeek: '日', category: '医師記録',  categoryColor: CATEGORY_COLORS['医師記録'],  author: '田村 医師',     authorRole: '医師D', content: 'リスパダール 2mg → 3mg に増量指示。経過観察継続。',                                                          tags: [],                          orderNumber: 'NO.827', timestamp: '2026/03/09 13:45' },
  { id: 'kr4',  date: '2026/03/09', dayOfWeek: '日', category: '看護記録',  categoryColor: CATEGORY_COLORS['看護記録'],  author: '中田 看護師',   authorRole: '',     content: '午後の回診同行。主治医より薬剤変更の指示あり。患者に説明済み。理解良好。',                                  tags: ['看護記録', 'クリニカルパス'], orderNumber: 'NO.827', timestamp: '2026/03/09 14:00' },
  { id: 'kr6',  date: '2026/03/07', dayOfWeek: '金', category: '医師記録',  categoryColor: CATEGORY_COLORS['医師記録'],  author: '田村 医師',     authorRole: '医師D', content: '血液検査結果確認。CRP 0.2、WBC 5800。炎症所見なし。現行治療継続。',                                          tags: [],                          timestamp: '2026/03/07 15:00' },
  { id: 'kr7',  date: '2026/03/06', dayOfWeek: '木', category: '入退院記録', categoryColor: CATEGORY_COLORS['入退院記録'], author: '田村 医師',     authorRole: '医師D', content: '【精神科】退院環境調整の指示。当院病棟・101号室・身長167.8cm・体重72.0kg。',                                tags: [],                          orderNumber: 'NO.837', timestamp: '2026/03/06 17:23' },
  { id: 'kr8',  date: '2026/03/05', dayOfWeek: '水', category: '医師記録',  categoryColor: CATEGORY_COLORS['医師記録'],  author: '田村 医師',     authorRole: '医師D', content: 'カンファレンス実施。退院に向けた環境調整について多職種で検討。訪問看護導入を検討中。',                      tags: ['カンファ'],                timestamp: '2026/03/05 16:00' },
  { id: 'kr9',  date: '2026/03/04', dayOfWeek: '火', category: '看護記録',  categoryColor: CATEGORY_COLORS['看護記録'],  author: '佐々木 看護師', authorRole: '',     content: '作業療法参加。革細工に取り組む。集中力30分程度持続。本人より「楽しい」との発言あり。',                      tags: ['看護記録'],                timestamp: '2026/03/04 14:00' },
];

// ===== オーダーをタイムラインレコードへ変換 =====

const ORDER_TYPE_DESCRIPTION: Record<Order['type'], string> = {
  '処方': '処方',
  '注射': '注射',
  '心理検査': '心理検査',
  'ECT': 'ECT',
  'リハ': 'リハ',
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
  { key: '入退院記録',  label: '入退院記録' },
  { key: 'オーダー',    label: 'オーダー' },
];

// ===== us-47: タグベースフィルタ Chip =====

const TAG_FILTERS = [
  'カンファ',
  '看護記録',
  '行動範囲',
  '外出/外泊',
];

// ===== us-47: 期間切替 =====

type PeriodKey = '6days' | '30days' | 'all';

const PERIOD_LABELS: Record<PeriodKey, string> = {
  '6days': '最近の6日分',
  '30days': '最近の30日分',
  'all': '全件',
};

const TAG_BG_COLOR_MAP: Record<string, string> = {
  '退院支援': 'error.light',
  'カンファ': 'success.light',
};

// ===== Component =====

interface MedicalRecordTabProps {
  patient: Patient;
  mode: KarteMode;
  /** 「指示簿タブを開く」リンク用 */
  onOpenOrdersTab: () => void;
  /** us-36 サブ B: 隔離拘束指示リンクのクリックハンドラ（mode='inpatient' のみ表示） */
  onRequestRestraintOrder: (title: string, editOrderId?: string) => void;
  /**
   * 親(KartePage)から「診療録作成」ダイアログを開くためのトリガー。
   * インクリメントされた値が渡されると診療録作成ダイアログが開く。
   */
  newRecordTrigger?: number;
}

export default function MedicalRecordTab({
  patient,
  mode,
  onOpenOrdersTab,
  onRequestRestraintOrder,
  newRecordTrigger,
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

  // 親(KartePage)からのトリガーで診療録作成ダイアログを開く。
  // setState を render 内で呼ぶ ref パターンは React 18 / StrictMode で
  // 二重実行で値が一致してしまうケースがあり不安定だったので useEffect 化。
  useEffect(() => {
    if (newRecordTrigger !== undefined && newRecordTrigger > 0) {
      setNewRecordOpen(true);
    }
  }, [newRecordTrigger]);

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

      {/* ===== タグフィルタ Chip 行（us-47・OR 条件 1 つ選択） ===== */}
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

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              {/* 日付サイドバー(ページスクロールに追従しつつ可視に保つため sticky) */}
              <Box sx={{
                width: 110, flexShrink: 0,
                borderRight: '1px solid', borderColor: 'divider', pr: 0.5,
                position: 'sticky',
                top: 0,
                alignSelf: 'flex-start',
              }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.6rem', display: 'block', mb: 0.5 }}>
                  【最近の{Object.keys(groupedRecords).length}日分】
                </Typography>
                {Object.entries(groupedRecords).map(([date, records]) => {
                  const d = date.split('/');
                  const dayStr = `${d[2]}日(${records[0].dayOfWeek})`;
                  const hasDoctor = records.some((r) => r.category === '医師記録');
                  const hasNursing = records.some((r) => r.category === '看護記録');
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

              {/* レコード本体(ページ全体スクロールに追従) */}
              <Box ref={timelineBodyRef} sx={{ flex: 1, minWidth: 0 }}>
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

      {/* ===== 診療録作成ダイアログ(KarteActionBar 等の外部トリガーから起動可能なまま保持) ===== */}
      <NewRecordDialog
        open={newRecordOpen}
        mode={mode}
        patientId={patient.id}
        onClose={() => setNewRecordOpen(false)}
        onSaved={(message) => showSnackbar(message, 'success')}
      />

      {/* ===== Snackbar ===== */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Stack>
  );
}

// ===== 診療録作成ダイアログ（フリーテキスト形式）=====

// 患者状態の 5 段階色（部門記録簿の患者状態色と整合）
const STATUS_COLORS = [
  { id: 'good',      label: '良好', color: '#10b981' },
  { id: 'stable',    label: '安定', color: '#3b82f6' },
  { id: 'attention', label: '注意', color: '#f59e0b' },
  { id: 'alert',     label: '警戒', color: '#f97316' },
  { id: 'critical',  label: '重要', color: '#dc2626' },
] as const;
type StatusId = typeof STATUS_COLORS[number]['id'] | '';

// 記載テンプレート
const RECORD_TEMPLATES = [
  {
    id: 'soap',
    label: 'SOAP',
    body: 'S（主観的所見）：\n\nO（客観的所見）：\n\nA（評価・診断）：\n\nP（計画・処置）：\n',
  },
  {
    id: 'hds-r',
    label: '長谷川式（HDS-R）',
    body:
      '長谷川式簡易知能評価スケール（HDS-R）\n\n' +
      '1. お年はおいくつですか？ （±2 年まで正解）：\n' +
      '2. 今日は何年何月何日何曜日ですか？（年/月/日/曜日 各 1 点）：\n' +
      '3. 私たちが今いる場所はどこですか？（5 秒後 ヒント無し 2 点 / ヒント有り 1 点）：\n' +
      '4. これから言う 3 つの言葉を言ってみてください（桜・猫・電車 / 梅・犬・自動車）：\n' +
      '5. 100 から 7 を順番に引いてください（93・86 各 1 点、誤答時打ち切り）：\n' +
      '6. これから言う数字を逆から言ってください（6-8-2 / 3-5-2-9）：\n' +
      '7. 先ほど覚えた言葉をもう 1 度言ってみてください（自発正解 2 点 / ヒント正解 1 点）：\n' +
      '8. これから 5 つの品物を見せ、隠した後 何があったか言ってください：\n' +
      '9. 知っている野菜の名前をできるだけ多く言ってください（10 個まで）：\n' +
      '\n合計点：____ / 30 点\n（20 点以下：認知症の疑い）\n',
  },
] as const;

// 面接フォーム選択肢
const INTERVIEW_FORMS = [
  { id: 'admission',    label: '入院面接' },
  { id: 'outpatient',   label: '外来診療' },
  { id: 'interview-1',  label: '外来面接 1' },
  { id: 'interview-2',  label: '外来面接 2' },
  { id: 'interview-3',  label: '外来面接 3' },
  { id: 'conference',   label: 'カンファ' },
  { id: 'family',       label: '家族面接' },
] as const;

// 当日 / 直近日時の datetime-local 既定値（ローカルタイム）
function nowAsLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ===== 左パネル: DO引用検索（部門診療録 / 過去カルテ / オーダー）=====

interface DoItemEntry {
  id: string;
  date: string;     // 2026/05/27
  title: string;    // 看護記録 / 診療録 / 注射オーダ ...
  summary: string;  // 1行プレビュー
  body: string;     // [DO] 押下で本文末尾に追記される本文
}

// モック: 部門診療録（看護・リハ・栄養 etc.）
const MOCK_DEPT_RECORDS: DoItemEntry[] = [
  { id: 'd-1', date: '2026/05/27', title: '看護記録', summary: '日勤 鈴木 / バイタル安定、内服確認OK',
    body: '【部門診療録 引用】2026/05/27 看護記録（鈴木）\nバイタル安定。内服確認 OK。日中傾眠傾向あり夜間睡眠時間と要対比。\n' },
  { id: 'd-2', date: '2026/05/26', title: '看護記録', summary: '準夜 高橋 / 入眠困難、頓服使用',
    body: '【部門診療録 引用】2026/05/26 看護記録（高橋）\n22:30 入眠困難の訴え。指示通り頓服使用。23:40 入眠確認。\n' },
  { id: 'd-3', date: '2026/05/25', title: 'リハ記録', summary: 'PT 山田 / ROM 改善、歩行訓練継続',
    body: '【部門診療録 引用】2026/05/25 リハ記録（PT 山田）\n肩関節 ROM 前回比 +10°。歩行訓練 50m × 3 セット。疲労なし。\n' },
  { id: 'd-4', date: '2026/05/23', title: '栄養記録', summary: 'NST 田中 / 食事摂取 7-8 割で経過',
    body: '【部門診療録 引用】2026/05/23 栄養記録（NST 田中）\n食事摂取 7-8 割で安定。BMI 19.8 → 20.2。経腸栄養剤追加不要と判断。\n' },
];

// モック: 過去カルテ（医師記載）
const MOCK_PAST_CHARTS: DoItemEntry[] = [
  { id: 'p-1', date: '2026/05/22', title: '診療録（再診）', summary: 'Dr 田村 / 状態安定、薬剤継続',
    body: '【過去カルテ 引用】2026/05/22 診療録（Dr 田村）\nS: 自覚症状なし、よく眠れている。\nO: バイタル安定、表情穏やか。\nA: 状態安定。\nP: 現行処方継続、2週間後再診。\n' },
  { id: 'p-2', date: '2026/05/15', title: '診療録（再診）', summary: 'Dr 田村 / 睡眠改善、減薬検討',
    body: '【過去カルテ 引用】2026/05/15 診療録（Dr 田村）\nS: 入眠改善、中途覚醒減少。\nO: バイタル安定。\nA: 睡眠改善傾向。\nP: 次回より減薬検討。\n' },
  { id: 'p-3', date: '2026/05/08', title: '診療録（カンファ）', summary: '多職種カンファ / 退院支援検討開始',
    body: '【過去カルテ 引用】2026/05/08 診療録（カンファレンス）\n参加: 医師・看護・PSW・PT。\n議題: 退院支援。\n結論: 6 月初旬退院を目処に MSW 介入開始。\n' },
];

// オーダーをモックから filter（ORDERS の型は別ファイルに定義）
function buildOrderEntries(patientId?: string): DoItemEntry[] {
  const list = (ORDERS as unknown as Array<{
    id: string; patientId: string; type: string; name?: string; date?: string;
    detail?: string; status?: string;
  }>).filter((o) => (patientId ? o.patientId === patientId : true));
  return list.slice(0, 30).map((o) => ({
    id: `o-${o.id}`,
    date: o.date ?? '—',
    title: `オーダ:${o.type}`,
    summary: `${o.name ?? ''} ${o.status ? `(${o.status})` : ''}`.trim(),
    body: `【オーダ 引用】${o.date ?? '—'} ${o.type} / ${o.name ?? ''}\n${o.detail ?? ''}\n`,
  }));
}

const DO_SECTIONS = [
  { id: 'dept',   label: '部門診療録' },
  { id: 'past',   label: '過去カルテ' },
  { id: 'orders', label: 'オーダー' },
] as const;
type DoSectionId = typeof DO_SECTIONS[number]['id'];

function NewRecordDialog({
  open,
  mode,
  patientId,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: KarteMode;
  patientId?: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [recordedAt, setRecordedAt] = useState<string>(nowAsLocalInput());
  const [title, setTitle] = useState<string>('');
  const [status, setStatus] = useState<StatusId>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [interviewForm, setInterviewForm] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [innerSnackbar, setInnerSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // ===== DO引用パネル =====
  const [doSection, setDoSection] = useState<DoSectionId>('dept');
  const [doSearch, setDoSearch] = useState<string>('');

  const doItems = useMemo<DoItemEntry[]>(() => {
    const src =
      doSection === 'dept' ? MOCK_DEPT_RECORDS :
      doSection === 'past' ? MOCK_PAST_CHARTS :
      buildOrderEntries(patientId);
    const q = doSearch.trim().toLowerCase();
    if (!q) return src;
    return src.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q) ||
      e.date.toLowerCase().includes(q)
    );
  }, [doSection, doSearch, patientId]);

  const handleDo = (entry: DoItemEntry) => {
    setBody((prev) => (prev ? prev + '\n' : '') + entry.body);
    setInnerSnackbar({ open: true, message: `[${entry.title}] を本文に引用しました` });
  };

  const isDirty =
    title !== '' || status !== '' || templateId !== '' || interviewForm !== '' ||
    tags.length > 0 || body !== '';

  const insertTemplate = useCallback(() => {
    if (!templateId) return;
    const tpl = RECORD_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setBody((prev) => (prev ? prev + '\n' : '') + tpl.body);
  }, [templateId]);

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (tags.includes(t)) {
      setTagInput('');
      return;
    }
    setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => {
    setTags((prev) => prev.filter((x) => x !== t));
  };

  const importPrevious = () => {
    // モック: 前回カルテの本文を取り込む（実データ連携は別ストーリー）
    setBody((prev) => {
      const stub = '【前回カルテ取り込み（mock）】\n前回記載日: 2026/05/22\n本文：状態安定、内服継続。\n\n';
      return stub + prev;
    });
    setInnerSnackbar({ open: true, message: '前回カルテを取り込みました（mock）' });
  };

  const reset = () => {
    setRecordedAt(nowAsLocalInput());
    setTitle('');
    setStatus('');
    setTemplateId('');
    setInterviewForm('');
    setTags([]);
    setTagInput('');
    setBody('');
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
      <Dialog open={open} onClose={handleCancel} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <NoteAdd fontSize="small" />
            <span>診療録作成</span>
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
        <DialogContent dividers sx={{ display: 'flex', gap: 1.5, p: 1.5 }}>
          {/* ===== 左パネル: DO引用検索 ===== */}
          <Paper variant="outlined" sx={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', p: 1, gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              DO引用
            </Typography>
            {/* セクション切替 */}
            <Stack direction="row" spacing={0.5}>
              {DO_SECTIONS.map((s) => (
                <Button
                  key={s.id}
                  size="small"
                  variant={doSection === s.id ? 'contained' : 'outlined'}
                  onClick={() => setDoSection(s.id)}
                  sx={{ flex: 1, fontSize: '0.65rem', px: 0.5, py: 0.25 }}
                >
                  {s.label}
                </Button>
              ))}
            </Stack>
            {/* 検索 */}
            <TextField
              size="small"
              placeholder="タイトル・概要・日付で絞り込み"
              value={doSearch}
              onChange={(e) => setDoSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />,
              }}
            />
            {/* 結果リスト */}
            <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <Stack spacing={0.5}>
                {doItems.length === 0 ? (
                  <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
                    該当データなし
                  </Typography>
                ) : (
                  doItems.map((e) => (
                    <Paper
                      key={e.id}
                      variant="outlined"
                      sx={{ p: 0.75, '&:hover': { bgcolor: '#f8fafc' } }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700 }} noWrap>
                            {e.date} {e.title}
                          </Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }} noWrap>
                            {e.summary}
                          </Typography>
                        </Box>
                        <Tooltip title="本文末尾に引用">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleDo(e)}
                            sx={{ fontSize: '0.65rem', minWidth: 0, px: 0.75, py: 0 }}
                            startIcon={<ContentCopy sx={{ fontSize: 12 }} />}
                          >
                            DO
                          </Button>
                        </Tooltip>
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>
            </Box>
          </Paper>

          {/* ===== 右パネル: フォーム ===== */}
          <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
            {/* ===== 記載日 + タイトル + 状態 ===== */}
            <Stack direction="row" spacing={1.5} alignItems="flex-end" flexWrap="wrap">
              <TextField
                size="small"
                type="datetime-local"
                label="記載日時"
                value={recordedAt}
                onChange={(e) => setRecordedAt(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 200 }}
              />
              <TextField
                size="small"
                label="タイトル"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ flex: 1, minWidth: 240 }}
              />
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.25, color: 'text.secondary' }}>
                  状態
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  {STATUS_COLORS.map((s) => {
                    const selected = status === s.id;
                    return (
                      <Tooltip key={s.id} title={s.label}>
                        <IconButton
                          size="small"
                          onClick={() => setStatus(selected ? '' : s.id)}
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: s.color,
                            border: selected ? '2px solid #1e3a5f' : '2px solid transparent',
                            '&:hover': { bgcolor: s.color, opacity: 0.85 },
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Stack>
              </Box>
            </Stack>

            {/* ===== テンプレート + 面接フォーム ===== */}
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="tpl-label">テンプレート</InputLabel>
                <Select
                  labelId="tpl-label"
                  label="テンプレート"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  <MenuItem value=""><em>選択してください</em></MenuItem>
                  {RECORD_TEMPLATES.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button size="small" variant="outlined" disabled={!templateId} onClick={insertTemplate}>
                テンプレート挿入
              </Button>
              <Box sx={{ width: 8 }} />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="interview-label">面接フォーム</InputLabel>
                <Select
                  labelId="interview-label"
                  label="面接フォーム"
                  value={interviewForm}
                  onChange={(e) => setInterviewForm(e.target.value)}
                >
                  <MenuItem value=""><em>選択してください</em></MenuItem>
                  {INTERVIEW_FORMS.map((f) => (
                    <MenuItem key={f.id} value={f.id}>{f.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* ===== タグ ===== */}
            <Box>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: 'text.secondary', fontWeight: 600 }}>
                タグ
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                {tags.map((t) => (
                  <Chip key={t} label={t} size="small" onDelete={() => removeTag(t)} />
                ))}
                <TextField
                  size="small"
                  variant="outlined"
                  placeholder="タグを入力して Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  sx={{ minWidth: 180 }}
                />
              </Stack>
            </Box>

            {/* ===== フリーテキスト本文 + 前回カルテ取り込み ===== */}
            <Box>
              <Stack direction="row" alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary', fontWeight: 600 }}>
                  本文
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<HistoryIcon sx={{ fontSize: 14 }} />}
                  onClick={importPrevious}
                  sx={{ fontSize: '0.7rem' }}
                >
                  前回カルテ取り込み
                </Button>
              </Stack>
              <TextField
                fullWidth
                multiline
                minRows={10}
                maxRows={20}
                size="small"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="フリーテキストで記載してください"
              />
            </Box>

            {/* ===== シェーマボタン（起動未実装） ===== */}
            <Box>
              <Tooltip title="シェーマ描画は別ストーリーで実装予定">
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<Brush sx={{ fontSize: 16 }} />}
                    disabled
                    sx={{ fontSize: '0.75rem' }}
                  >
                    シェーマ起動（未実装）
                  </Button>
                </span>
              </Tooltip>
            </Box>
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

      {/* ダイアログ内 snackbar */}
      <Snackbar
        open={innerSnackbar.open}
        autoHideDuration={3500}
        onClose={() => setInnerSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="info" variant="filled" onClose={() => setInnerSnackbar({ open: false, message: '' })}>
          {innerSnackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
