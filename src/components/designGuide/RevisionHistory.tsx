import React from 'react';
import {
  Box, Typography, Paper, Chip, Divider,
  Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

/* ─── 改定履歴データ ─── */
type Commit = { hash: string; time: string; subject: string };
type Revision = {
  version: string;
  date: string;       // 表示用（M/D）
  fullDate: string;   // YYYY-MM-DD
  context: string;    // 合意・改修の相手／場
  summary: string;    // 改定概要
  commits?: Commit[]; // 当日のコミット履歴
};

export const REVISIONS: Revision[] = [
  {
    version: 'ver0.15',
    date: '6/11',
    fullDate: '2026-06-11',
    context: '病棟マップ再設計',
    summary: '病棟マップ右サイドバーを再設計。入院オーダー時の病棟指定を必須化し（「仮病棟」チェックを「病室未定」に是正）、「病棟未割当」状態を解消。これに伴い未割当者パネルを廃止し、「入院予定者／不在者／入院者情報」の3パネルをいずれも選択中病棟スコープに統一。入院予定者には入院予定日と病室バッジ（病室未／確定を色＋アイコンで判別）を表示し、入院手続き导线を病室確定済の行へ移設（病室確定が手続きの前提であることをUIで表現）。あわせて入院ライフサイクルのフローチャート・状態モデルを画面設計書（docs/design/screens/ep-01-bed-map/ward-map.md）に整備。',
  },
  {
    version: 'ver0.14',
    date: '6/11',
    fullDate: '2026-06-11',
    context: '梶井改修',
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
    context: '梶井改修',
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
    context: '梶井改修',
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
          <Typography variant="body2" sx={{ mb: rev.commits ? 1.5 : 0 }}>
            {rev.summary}
          </Typography>

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
