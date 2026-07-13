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
import { REVISIONS, LATEST_VERSION } from '../../data/revisions';

// 既存の import 経路（`from '../components/designGuide/RevisionHistory'`）を維持するため、
// data 側の定数をそのまま再エクスポートする。データ本体（source of truth）は
// `src/data/revisions.ts` を参照。API JSON もこのデータを一元利用する。
export { REVISIONS, LATEST_VERSION };

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

/* ─── 改定バージョンごとの新旧デザイン比較（描画専用） ─── */
// designCompare は React ノードのため、JSON シリアライズ対象の REVISIONS データには含めず、
// 表示コンポーネント側でバージョンに紐付ける（API `/api/version/detail` の応答を汚さないため）。
const DESIGN_COMPARE: Record<string, React.ReactNode> = {
  'ver0.16': <AdmissionInfoDesignDiff />,
  'ver0.17': <AdmissionOrderBadgeLegend />,
};

/** 改定履歴のアコーディオン一覧。`/revision-history` ページとヘッダーから開くダイアログで共用する。 */
export const RevisionList: React.FC = () => (
  <>
    {REVISIONS.map((rev, idx) => {
      const designCompare = DESIGN_COMPARE[rev.version];
      return (
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
            <Typography variant="body2" sx={{ mb: (rev.commits || designCompare) ? 1.5 : 0 }}>
              {rev.summary}
            </Typography>

            {designCompare && (
              <Box sx={{ mb: rev.commits ? 1.5 : 0 }}>
                <Divider sx={{ mb: 1 }} />
                {designCompare}
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
      );
    })}
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
