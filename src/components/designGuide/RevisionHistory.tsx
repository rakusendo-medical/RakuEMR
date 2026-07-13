import React from 'react';
import {
  Box, Stack, Typography, Paper, Chip, Divider,
  Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText,
} from '@mui/material';
import {
  ExpandMore,
  MeetingRoom as MeetingRoomIcon,
  HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material';

/* ─── 改定履歴データ ─── */
type Commit = { hash: string; time: string; subject: string };
type Revision = {
  version: string;
  date: string;       // 表示用（M/D）
  fullDate: string;   // YYYY-MM-DD
  context: string;    // 改定の要点（ヘッダーに1行表示されるため簡潔に）
  summary: string;    // 改定概要
  commits?: Commit[]; // 当日のコミット履歴
  designCompare?: React.ReactNode; // 新旧デザイン比較（任意）
};

/* ─── ver0.16: 「入院者情報」パネルの新旧デザイン比較 ─── */
// 旧「入退院情報」ボタン（廃止）のダイアログ集計を右サイドバー「入院者情報」パネルへ統合し、
// あわせてパネルをダッシュボード型に再設計。数値は第1病棟のモック値を代表として表示する。

// 旧デザインの内訳表（男 / 女 / 他 × 患者 / 不在者 / 在院者）
const AiInner: React.FC = () => (
  <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', rowGap: 0.2, fontSize: '0.7rem', px: 0.25 }}>
    <Box />
    <Box sx={{ textAlign: 'right', color: '#334155' }}>男</Box>
    <Box sx={{ textAlign: 'right', color: '#334155' }}>女</Box>
    <Box sx={{ textAlign: 'right', color: '#334155' }}>他</Box>
    <Box sx={{ color: '#334155' }}>患者</Box><Box sx={{ textAlign: 'right', fontWeight: 600 }}>0</Box><Box sx={{ textAlign: 'right', fontWeight: 600 }}>42</Box><Box sx={{ textAlign: 'right', fontWeight: 600 }}>0</Box>
    <Box sx={{ color: '#334155' }}>不在者</Box><Box sx={{ textAlign: 'right' }}>0</Box><Box sx={{ textAlign: 'right' }}>1</Box><Box sx={{ textAlign: 'right' }}>0</Box>
    <Box sx={{ color: '#334155' }}>在院者</Box><Box sx={{ textAlign: 'right' }}>0</Box><Box sx={{ textAlign: 'right' }}>41</Box><Box sx={{ textAlign: 'right' }}>0</Box>
  </Box>
);

const DiffTag: React.FC<{ tag: '旧' | '新' }> = ({ tag }) => (
  <Chip
    label={tag === '旧' ? '旧デザイン' : '新デザイン'}
    size="small"
    color={tag === '旧' ? 'default' : 'primary'}
    sx={{ fontWeight: 700, height: 20 }}
  />
);

const AdmissionInfoDesignDiff: React.FC = () => {
  const cols: [string, number, string, string][] = [
    ['患者', 42, '男0・女42・他0', '#23324d'],
    ['在院者', 41, '男0・女41・他0', '#23324d'],
    ['不在者', 1, '男0・女1・他0', '#e08a00'],
  ];
  const chips: [string, number, string, string][] = [
    ['隔離', 0, '#f3f5f8', '#6b7688'],
    ['拘束', 1, '#fdeef0', '#b0384a'],
    ['観察', 5, '#fdf3e3', '#b06e00'],
  ];
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        デザイン新旧比較 — 病棟マップ右サイドバー「入院者情報」パネル。淡色1枚の縦積みパネルを、
        白背景のダッシュボード型（稼働バー／患者・在院者・不在者の3列／状態別チップ／稼働率＋本日日付）に再設計しました。
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* 旧: 淡いアンバー1枚パネル（病床 → 内訳 → 平均年齢3行） */}
        <Paper variant="outlined" sx={{ p: 1.25, width: 236, border: '1px solid #d97706', bgcolor: '#fffbeb' }}>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75 }}>
            <DiffTag tag="旧" />
            <Typography sx={{ ml: 'auto', fontSize: '0.72rem', fontWeight: 700, color: '#1e3a5f' }}>■ 入院者情報</Typography>
          </Stack>
          <Typography sx={{ textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', mb: 0.5 }}>病床 42 / 44</Typography>
          <AiInner />
          <Box sx={{ mt: 0.75, fontSize: '0.7rem' }}>
            <Box>平均年齢(男) <strong>0歳</strong></Box>
            <Box>平均年齢(女) <strong>45.4歳</strong></Box>
            <Box>平均年齢(全) <strong>45.4歳</strong></Box>
          </Box>
        </Paper>

        {/* 新: 白背景ダッシュボード（ヘッダーバー／稼働バー／3列／状態別チップ／平均年齢） */}
        <Paper variant="outlined" sx={{ width: 236, borderRadius: 2, border: '1px solid #d9dee6', overflow: 'hidden', bgcolor: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: '#f3f5f8', borderBottom: '1px solid #e3e7ee', px: 1.25, py: 0.75 }}>
            <DiffTag tag="新" />
            <Typography sx={{ ml: 'auto', fontSize: '0.72rem', fontWeight: 700, color: '#23324d' }}>■ 入院者情報</Typography>
          </Box>
          {/* 稼働バー */}
          <Box sx={{ p: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.7rem', color: '#6b7688' }}>病床稼働</Typography>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#23324d' }}>
                42<Box component="span" sx={{ fontSize: '0.7rem', fontWeight: 500, color: '#8a93a3' }}> / 44 床</Box>
              </Typography>
            </Box>
            <Box sx={{ mt: 0.5, height: 8, bgcolor: '#edf0f4', borderRadius: 1, overflow: 'hidden' }}>
              <Box sx={{ width: '95%', height: '100%', bgcolor: '#2f6fd6' }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4, fontSize: '0.6rem' }}>
              <Box component="span" sx={{ color: '#8a93a3' }}>本日 7/6 時点</Box>
              <Box component="span" sx={{ color: '#2f6fd6', fontWeight: 700 }}>稼働率 95%</Box>
            </Box>
          </Box>
          {/* 患者 / 在院者 / 不在者 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid #edf0f4', borderBottom: '1px solid #edf0f4' }}>
            {cols.map(([label, n, sub, c], i) => (
              <Box key={label} sx={{ py: 0.75, px: 0.25, textAlign: 'center', borderRight: i < 2 ? '1px solid #edf0f4' : 'none' }}>
                <Typography sx={{ fontSize: '0.6rem', color: '#8a93a3' }}>{label}</Typography>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: c }}>{n}</Typography>
                <Typography sx={{ fontSize: '0.52rem', color: '#8a93a3', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>{sub}</Typography>
              </Box>
            ))}
          </Box>
          {/* 状態別チップ（3等分で均等配置） */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75, p: 1.25 }}>
            {chips.map(([label, v, bg, fg]) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, bgcolor: bg, color: fg, fontSize: '0.66rem', borderRadius: 999, py: 0.3 }}>
                {label} <Box component="b" sx={{ color: fg }}>{v}</Box>
              </Box>
            ))}
          </Box>
          {/* 平均年齢 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #edf0f4', px: 1.25, py: 0.75, fontSize: '0.66rem' }}>
            <Box component="span" sx={{ color: '#6b7688' }}>平均年齢</Box>
            <Box component="span" sx={{ color: '#23324d' }}>男 <b>0</b> ／ 女 <b>45.4</b> ／ 全 <b>45.4</b> 歳</Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

/* ─── ver0.17: 入院予定者「病室割当状況」バッジの凡例 ─── */
const RoomBadgeMini: React.FC<{ decided: boolean }> = ({ decided }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.25, borderRadius: 999,
      px: 0.75, py: 0.25, fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', border: '1px solid',
      ...(decided
        ? { bgcolor: '#e9f2fd', color: '#2f6fd6', borderColor: '#c7d5ec' }
        : { bgcolor: '#fdf3e3', color: '#b06e00', borderColor: '#f2c879' }),
    }}
  >
    {decided ? <MeetingRoomIcon sx={{ fontSize: '1rem' }} /> : <HelpOutlineIcon sx={{ fontSize: '1rem' }} />}
    {decided ? '305号室' : '病室未割当'}
  </Box>
);

const AdmissionOrderBadgeLegend: React.FC = () => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
      入院予定者パネルの「病室割当状況」バッジ。色＋アイコン＋文言で判別します（色覚配慮）。
    </Typography>
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <RoomBadgeMini decided={false} />
        <Typography variant="body2">未割当 — 入院オーダーはあるが病室未決定（看護師が病室を決めるまで）</Typography>
      </Stack>
      <Stack direction="row" alignItems="center" spacing={1}>
        <RoomBadgeMini decided />
        <Typography variant="body2">割当済み — オーダー時に病室決定済み（N号室）</Typography>
      </Stack>
    </Stack>
  </Box>
);

export const REVISIONS: Revision[] = [
  {
    version: 'ver0.21',
    date: '7/13',
    fullDate: '2026-07-13',
    context: '通院退院で外来化・退院区分反映',
    summary: '退院指示で退院後診療区分＝通院を選んで退院確定した時、① 対象患者を外来化（実効 admissionState を outpatient に上書き＝カルテ表示の外来化・入院患者一覧から除外）、② 入院歴の当該入院を退院済・退院区分「退院後通院」に反映する（いずれもモックのためセッション限定＝リロードで戻る）。物理病床整合・不要／転院区分・通院精神の指示発行は対象外。あわせて退院指示 SPEC（us-09）の完了通知から、実在しない「医師指示簿への書込」記述を削除。',
  },
  {
    version: 'ver0.17',
    date: '7/6',
    fullDate: '2026-07-06',
    context: '入院オーダー・病室割当整理',
    summary: '入院オーダー・病室割当のライフサイクルを整理。入院オーダー時は病棟を必須（validation）とし、病室の割当状況は入院予定者パネルの「病室割当状況」バッジで色＋アイコン＋文言により判別する（割当済み＝青＋病室アイコン＋「N号室」／未割当＝アンバー＋？＋「病室未割当」）。病棟必須化により「病棟未割当」は発生しなくなったため、未割当の用語は「病室未割当」に統一し、未割当者パネル／導線（残存していた死にコード）を撤去。右サイドバーは入院予定者・不在者・入院者情報の3パネル（いずれも選択中病棟スコープ）に一本化した。参考システムは病室割当まで踏み込まない運用のため、本画面は参考システムに準拠せず当院運用に合わせる。',
    designCompare: <AdmissionOrderBadgeLegend />,
  },
  {
    version: 'ver0.16',
    date: '7/6',
    fullDate: '2026-07-06',
    context: '右サイドバー3パネル刷新',
    summary: '旧「入退院情報」ボタン（ver0.15 の右サイドバー再設計以降、導線が外れオーファン化していた）を廃止し、ダイアログで表示していたサマリ（稼働率・隔離・拘束・観察）を右サイドバー「入院者情報」パネルへ統合。あわせて右サイドバー3パネルを白背景カードに刷新した。入院者情報はダッシュボード型（病床稼働バー＋稼働率／本日日付、患者・在院者・不在者の3列内訳、状態別チップ、平均年齢）に再設計。入院予定者・不在者は氏名＋バッジ＋操作ボタンのカード行に整理。稼働率は本日日付（M/D 時点）を併記。外出は「不在者」列と重複するため状態別チップからは除外した。淡色背景の低コントラストを是正し文字色を濃く調整。オーファンなダイアログ本体（AdmissionInfoContent）も撤去。',
    designCompare: <AdmissionInfoDesignDiff />,
  },
  {
    version: 'ver0.15',
    date: '6/30',
    fullDate: '2026-06-30',
    context: '病棟マップ再設計',
    summary: '病棟マップ右サイドバーを再設計。入院オーダー時の病棟指定を必須化し（「仮病棟」チェックを「病室未定」に是正）、「病棟未割当」状態を解消。これに伴い未割当者パネルを廃止し、「入院予定者／不在者／入院者情報」の3パネルをいずれも選択中病棟スコープに統一。入院予定者には入院予定日と病室バッジ（病室未／確定を色＋アイコンで判別）を表示し、入院手続き导线を病室確定済の行へ移設（病室確定が手続きの前提であることをUIで表現）。あわせて入院ライフサイクルのフローチャート・状態モデルを画面設計書（docs/design/screens/ep-01-bed-map/ward-map.md）に整備。',
  },
  {
    version: 'ver0.14',
    date: '6/11',
    fullDate: '2026-06-11',
    context: '観察グリッド勤務帯切替',
    summary: '隔離拘束観察グリッドに勤務帯切替（24時間／日勤9〜16時／夜勤17〜翌8時）を追加。あわせて観察グリッドの e2e テストを拡充（最大9行・最小1行での登録反映、既存セルへの上書きで状態が正しく書き換わること、勤務帯切替後の入力反映、行の追加削除・上限9件、絞込設定の全チェック・クローズなど）。',
    commits: [
      { hash: 'e157d20', time: '11:22', subject: 'test/flowsheet: 隔離拘束観察グリッドの e2e を補強（最大9行/上書き書換え/勤務帯切替後の入力反映）' },
      { hash: '236ce98', time: '11:13', subject: 'test/flowsheet: 隔離拘束観察グリッドの e2e カバレッジを追加（行追加削除・上限・トースト・絞込・勤務帯ほか）' },
      { hash: 'f55c00a', time: '09:59', subject: 'flowsheet: 隔離拘束観察グリッドに勤務帯切替（24時間/日勤/夜勤）を追加' },
    ],
  },
  {
    version: 'ver0.13',
    date: '6/10',
    fullDate: '2026-06-10',
    context: '隔離拘束観察グリッド追加',
    summary: 'カルテのフローシートタブを「フローシート・隔離拘束」に改称。サブタブ（フローシート／隔離拘束）で外出・外泊行から下を切り替え可能にし、隔離拘束サブタブに 24時間×7日の観察グリッドを追加。セルクリックで観察記録ダイアログ（00分/30分の2行を既定、15分/30分単位の切替）を起動し、各記録を色セグメントで均等分割表示。診察記録の[未診察]セルから診療録作成ダイアログ、[絞込設定]から絞込ダイアログを起動。ヘッドレス CI 用の Playwright 設定を追加。',
    commits: [
      { hash: '2ca1477', time: '22:14', subject: 'e2e: ヘッドレスCI用の Playwright 設定とスクリプトを追加' },
      { hash: '436600b', time: '22:04', subject: 'test/flowsheet: 観察記録ダイアログ系 e2e の検証手法を修正' },
      { hash: '2b3eb53', time: '18:10', subject: 'flowsheet: フローシートタブに隔離拘束サブタブ（24h観察グリッド）を追加' },
    ],
  },
  {
    version: 'ver0.12',
    date: '6/2',
    fullDate: '2026-06-02',
    context: '隔離拘束指示ダイアログ改修',
    summary: '隔離拘束指示ダイアログを改修。開放時間・文書チェック・所見を削除。開始日時・終了日時の入力をdatetime-local形式に統一。配膳先変更日時を追加。移動先病棟・病室・ベッドのセレクトを追加。病室・ベッド未選択時は作成ボタンを非活性化。',
    commits: [
      { hash: '—', time: '—', subject: 'isolation: 隔離拘束指示ダイアログから開放時間・文書チェック・所見を削除' },
      { hash: '—', time: '—', subject: 'isolation: 開始日時・終了日時の入力をdatetime-local形式に統一' },
      { hash: '—', time: '—', subject: 'isolation: 配膳先変更日時フィールドを追加' },
      { hash: '—', time: '—', subject: 'isolation: 移動先病棟・病室・ベッドのセレクトを追加' },
      { hash: '—', time: '—', subject: 'isolation: 病室・ベッド未選択時に作成ボタンを非活性化' },
    ],
  },
  {
    version: 'ver0.11',
    date: '5/30',
    fullDate: '2026-05-30',
    context: '楽仙堂と改修',
    summary: 'アコーディオン形式で改定履歴ページを追加。フローシート（排便系項目の再構成・日列クリック入力・看護記録の新規登録）、オーダ管理、隔離拘束まわりを中心に調整。',
    commits: [
      { hash: '65ae582', time: '15:35', subject: 'karte/flowsheet: 看護記録の新規登録ダイアログを追加' },
      { hash: 'fd6f946', time: '15:10', subject: 'karte/flowsheet: 日列クリックで当日項目を入力できる編集ダイアログを追加' },
      { hash: '0b5403e', time: '14:54', subject: 'karte/flowsheet: 便(性状)セルに番号＋性状名を併記' },
      { hash: '9030ee5', time: '14:49', subject: 'karte/flowsheet: 排便系項目を再構成（便回数/性状/下剤/尿量）＋睡眠非表示' },
      { hash: '2167484', time: '14:35', subject: 'flowsheet: 排便系項目の再構成（便の回数/性状/下剤/尿量）＋睡眠タブ非表示' },
      { hash: '5556580', time: '14:20', subject: 'orders: オーダー管理に「調整中・仮実装」の注意書きを追加' },
      { hash: 'ada758f', time: '13:45', subject: 'isolation/ledger: 行動制限台帳に月・病棟指定UIとダミーデータ表示を実装' },
      { hash: '0a3d7cb', time: '13:41', subject: 'orders: オーダ管理に患者/種類フィルター追加＋リハオーダー種別を新設' },
      { hash: '4ae52ea', time: '12:49', subject: 'flowsheet/bulk-vitals: 病棟マップで選択した複数病室を一括入力へ引き継ぎ' },
      { hash: '36ad4bb', time: '12:47', subject: 'layout: サイドナビ再編（外来セクション新設・共通運用を病床管理へ統合）' },
      { hash: '941ec30', time: '12:39', subject: 'flowsheet/bulk: 一括バイタル・看護経過記録のUI統一＋保存トースト右上化' },
      { hash: '305aa6a', time: '12:24', subject: 'layout: サイドナビから睡眠表項目を一旦除外' },
      { hash: 'e2f03a9', time: '12:19', subject: 'flowsheet/bulk-vitals: 設定ボタンを画面下部固定の保存バーに変更' },
      { hash: 'a739aae', time: '11:57', subject: 'ward-map: 病室/床数の見直し＋患者番号8桁化＋status新モデル統合' },
    ],
  },
  {
    version: 'ver0.10',
    date: '5/29',
    fullDate: '2026-05-29',
    context: 'AMTC側で合意',
    summary: '初版を作成。',
  },
];

/** 最新バージョン（サイドメニュー等の ver 表記はここを参照する） */
export const LATEST_VERSION = REVISIONS[0].version;

/** 改定履歴のアコーディオン一覧。`/revision-history` ページとヘッダーから開くダイアログで共用する。 */
export const RevisionList: React.FC = () => (
  <>
    {REVISIONS.map((rev, idx) => (
      <Accordion
        key={rev.version}
        defaultExpanded={idx === 0}
        disableGutters
        variant="outlined"
        sx={{ mb: 1, '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', width: '100%' }}>
            <Chip
              label={rev.version}
              color="primary"
              size="small"
              variant={idx === 0 ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600, fontFamily: 'monospace' }}
            />
            <Typography variant="subtitle2">{rev.date}　{rev.context}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {rev.fullDate}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Typography variant="body2" sx={{ mb: (rev.commits || rev.designCompare) ? 1.5 : 0 }}>
            {rev.summary}
          </Typography>

          {rev.designCompare && (
            <Box sx={{ mb: rev.commits ? 1.5 : 0 }}>
              <Divider sx={{ mb: 1 }} />
              {rev.designCompare}
            </Box>
          )}

          {rev.commits && (
            <>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                当日のコミット履歴（JST・{rev.commits.length} 件）
              </Typography>
              <List dense disablePadding>
                {rev.commits.map((c) => (
                  <ListItem key={c.hash} disableGutters sx={{ py: 0.25, alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: 'monospace', color: '#1e40af', flexShrink: 0 }}
                      >
                        {c.hash}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontFamily: 'monospace', flexShrink: 0 }}
                      >
                        {c.time}
                      </Typography>
                      <ListItemText
                        primary={c.subject}
                        primaryTypographyProps={{ variant: 'body2' }}
                        sx={{ m: 0 }}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </AccordionDetails>
      </Accordion>
    ))}
  </>
);

const RevisionHistory: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" gutterBottom>改定履歴</Typography>
        <Typography variant="body2" color="text.secondary">
          RakuEMR ワイヤーフレームのバージョンごとの改定履歴です。各バージョンを開くと、合意・改修の内容と当日のコミット履歴を確認できます。
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: '2px solid #1e40af', display: 'inline-block' }}>
          バージョン一覧
        </Typography>

        <RevisionList />
      </Paper>
    </Box>
  );
};

export default RevisionHistory;
