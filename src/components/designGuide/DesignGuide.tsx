import React from 'react';
import {
  Box, Typography, Paper, Grid, Button, Chip, TextField, Alert, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, Divider, Avatar, IconButton, Tooltip, Switch,
  FormControlLabel, Tab, Tabs, Badge,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Checkbox,
} from '@mui/material';
import {
  LocalHospital, People, Search, Description, Lock, Home,
  Add, Edit, Delete, Save, Check, Close, Warning, Info,
} from '@mui/icons-material';

/* ─── カラーパレット定義 ─── */
const PALETTE = {
  primary: [
    { label: 'Primary Main', value: '#1e40af', textColor: '#fff' },
    { label: 'Primary Light', value: '#3b82f6', textColor: '#fff' },
    { label: 'Primary Dark', value: '#1e3a5f', textColor: '#fff' },
  ],
  secondary: [
    { label: 'Secondary Main', value: '#059669', textColor: '#fff' },
    { label: 'Secondary Light', value: '#34d399', textColor: '#1e293b' },
    { label: 'Secondary Dark', value: '#047857', textColor: '#fff' },
  ],
  status: [
    { label: 'Error', value: '#dc2626', textColor: '#fff' },
    { label: 'Warning', value: '#d97706', textColor: '#fff' },
    { label: 'Success', value: '#16a34a', textColor: '#fff' },
    { label: 'Info', value: '#6366f1', textColor: '#fff' },
  ],
  neutral: [
    { label: 'Text Primary', value: '#1e293b', textColor: '#fff' },
    { label: 'Text Secondary', value: '#64748b', textColor: '#fff' },
    { label: 'Divider', value: '#e2e8f0', textColor: '#1e293b' },
    { label: 'Background', value: '#f0f2f5', textColor: '#1e293b' },
    { label: 'Paper', value: '#ffffff', textColor: '#1e293b' },
  ],
  sidebar: [
    { label: 'Sidebar BG', value: '#0f172a', textColor: '#e2e8f0' },
    { label: 'Sidebar Border', value: '#1e293b', textColor: '#e2e8f0' },
    { label: 'Sidebar Active', value: '#1e3a5f', textColor: '#fff' },
    { label: 'Sidebar Text', value: '#94a3b8', textColor: '#0f172a' },
  ],
};

const ColorSwatch: React.FC<{ label: string; value: string; textColor: string }> = ({ label, value, textColor }) => (
  <Box sx={{ textAlign: 'center' }}>
    <Box
      sx={{
        width: '100%', height: 56, bgcolor: value, borderRadius: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid #e2e8f0', mb: 0.5,
      }}
    >
      <Typography sx={{ fontSize: '0.6875rem', color: textColor, fontFamily: 'monospace' }}>
        {value}
      </Typography>
    </Box>
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem' }}>
      {label}
    </Typography>
  </Box>
);

/* ─── セクションラッパー ─── */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
    <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: '2px solid #1e40af', display: 'inline-block' }}>
      {title}
    </Typography>
    {children}
  </Paper>
);

const DesignGuide: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const [dialogOpen, setDialogOpen] = React.useState(false);          // 中（標準フォーム）
  const [dialogLargeOpen, setDialogLargeOpen] = React.useState(false); // 大（多項目・複数セクション）
  const [dialogConfirmOpen, setDialogConfirmOpen] = React.useState(false); // 確認のみ

  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" gutterBottom>デザインガイドライン</Typography>
        <Typography variant="body2" color="text.secondary">
          RakuEMR で使用しているカラー・タイポグラフィ・コンポーネントの一覧です。画面を実装する際の参照としてご利用ください。
        </Typography>
      </Box>

      {/* ━━━ カラーパレット ━━━ */}
      <Section title="カラーパレット">
        {Object.entries(PALETTE).map(([group, colors]) => (
          <Box key={group} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'capitalize' }}>{group}</Typography>
            <Grid container spacing={1}>
              {colors.map((c) => (
                <Grid item xs={6} sm={4} md={2} key={c.value + c.label}>
                  <ColorSwatch {...c} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Section>

      {/* ━━━ タイポグラフィ ━━━ */}
      <Section title="タイポグラフィ">
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          フォント: Noto Sans JP / Hiragino Kaku Gothic ProN / Yu Gothic &nbsp;|&nbsp; ベースサイズ: 14px
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Variant</TableCell>
                <TableCell>サンプル</TableCell>
                <TableCell>サイズ / ウェイト</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {([
                { variant: 'h5' as const, desc: '1.625rem / 700' },
                { variant: 'h6' as const, desc: '1.125rem / 700' },
                { variant: 'subtitle1' as const, desc: '1.0625rem / 600' },
                { variant: 'subtitle2' as const, desc: '0.9375rem / 600' },
                { variant: 'body1' as const, desc: '1rem / 400' },
                { variant: 'body2' as const, desc: '0.9375rem / 400' },
                { variant: 'caption' as const, desc: '0.8125rem / 400' },
              ]).map(({ variant, desc }) => (
                <TableRow key={variant}>
                  <TableCell><code>{variant}</code></TableCell>
                  <TableCell><Typography variant={variant}>精神科電子カルテシステム</Typography></TableCell>
                  <TableCell><Typography variant="caption">{desc}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Section>

      {/* ━━━ ボタン ━━━ */}
      <Section title="ボタン">
        <Typography variant="subtitle2" sx={{ mb: 1 }}>バリエーション</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Button variant="contained">保存</Button>
          <Button variant="contained" color="secondary">承認</Button>
          <Button variant="contained" color="error">削除</Button>
          <Button variant="contained" color="warning">一時保存</Button>
          <Button variant="contained" color="success">完了</Button>
          <Button variant="contained" color="info">詳細</Button>
          <Button variant="outlined">キャンセル</Button>
          <Button variant="text">リセット</Button>
          <Button variant="contained" disabled>無効</Button>
        </Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>アイコン付き</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Button variant="contained" startIcon={<Add />}>新規追加</Button>
          <Button variant="contained" startIcon={<Save />} color="secondary">保存</Button>
          <Button variant="outlined" startIcon={<Edit />}>編集</Button>
          <Button variant="outlined" color="error" startIcon={<Delete />}>削除</Button>
        </Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>アイコンボタン</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="追加"><IconButton color="primary"><Add /></IconButton></Tooltip>
          <Tooltip title="編集"><IconButton color="primary"><Edit /></IconButton></Tooltip>
          <Tooltip title="削除"><IconButton color="error"><Delete /></IconButton></Tooltip>
          <Tooltip title="検索"><IconButton><Search /></IconButton></Tooltip>
        </Box>
      </Section>

      {/* ━━━ Chip / Badge ━━━ */}
      <Section title="チップ・バッジ">
        <Typography variant="subtitle2" sx={{ mb: 1 }}>ステータスチップ</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip label="入院中" color="primary" />
          <Chip label="退院済" color="default" />
          <Chip label="外泊中" color="warning" />
          <Chip label="隔離中" color="error" />
          <Chip label="通院中" color="success" />
          <Chip label="要注意" color="info" />
        </Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>バリエーション</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip label="Filled" color="primary" />
          <Chip label="Outlined" color="primary" variant="outlined" />
          <Chip label="削除可" color="secondary" onDelete={() => {}} />
          <Chip label="アイコン付き" icon={<LocalHospital />} color="primary" variant="outlined" />
        </Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>バッジ</Typography>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Badge badgeContent={4} color="primary"><Description /></Badge>
          <Badge badgeContent={12} color="error"><People /></Badge>
          <Badge badgeContent="!" color="warning"><Warning /></Badge>
        </Box>
      </Section>

      {/* ━━━ フォーム ━━━ */}
      <Section title="フォーム要素">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField label="患者氏名" fullWidth placeholder="山田 太郎" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="患者番号" fullWidth placeholder="P-001" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="検索" fullWidth placeholder="キーワード入力" InputProps={{ startAdornment: <Search sx={{ color: '#94a3b8', mr: 0.5 }} /> }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="必須項目" fullWidth required error helperText="この項目は必須です" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="無効" fullWidth disabled value="編集不可" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="複数行" fullWidth multiline rows={2} placeholder="メモ入力..." />
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel control={<Switch defaultChecked />} label="有効" />
          <FormControlLabel control={<Switch />} label="無効" />
        </Box>
      </Section>

      {/* ━━━ テーブル ━━━ */}
      <Section title="テーブル">
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>患者番号</TableCell>
                <TableCell>患者氏名</TableCell>
                <TableCell>年齢</TableCell>
                <TableCell>病棟</TableCell>
                <TableCell>状態</TableCell>
                <TableCell>主治医</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { id: 'P-001', name: '山田 太郎', age: 45, ward: '1病棟', status: '入院中', doctor: '佐藤 医師' },
                { id: 'P-002', name: '鈴木 花子', age: 32, ward: '2病棟', status: '外泊中', doctor: '田中 医師' },
                { id: 'P-003', name: '高橋 次郎', age: 58, ward: '1病棟', status: '隔離中', doctor: '佐藤 医師' },
              ].map((row) => (
                <TableRow key={row.id} hover sx={{ cursor: 'pointer' }}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                  <TableCell>{row.age}歳</TableCell>
                  <TableCell>{row.ward}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      size="small"
                      color={row.status === '入院中' ? 'primary' : row.status === '外泊中' ? 'warning' : 'error'}
                    />
                  </TableCell>
                  <TableCell>{row.doctor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Section>

      {/* ━━━ カード ━━━ */}
      <Section title="カード">
        <Grid container spacing={2}>
          {[
            { title: '入院患者数', value: '124', sub: '1病棟: 68 / 2病棟: 56', color: '#1e40af' },
            { title: '本日退院予定', value: '3', sub: '山田・鈴木・高橋', color: '#059669' },
            { title: '隔離拘束中', value: '5', sub: '隔離: 3 / 拘束: 2', color: '#dc2626' },
            { title: '外泊中', value: '8', sub: '本日帰院予定: 2', color: '#d97706' },
          ].map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.title}>
              <Card>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">{card.title}</Typography>
                  <Typography variant="h5" sx={{ color: card.color, my: 0.5 }}>{card.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{card.sub}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Section>

      {/* ━━━ アラート ━━━ */}
      <Section title="アラート">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Alert severity="success">患者情報を保存しました。</Alert>
          <Alert severity="info">本日の回診予定が更新されました。</Alert>
          <Alert severity="warning">外泊期限が近づいている患者がいます。</Alert>
          <Alert severity="error">必須項目が入力されていません。</Alert>
          <Alert severity="info" variant="outlined">Outlined スタイル — 軽い通知に使用</Alert>
          <Alert severity="warning" variant="filled">Filled スタイル — 強調が必要な場合に使用</Alert>
        </Box>
      </Section>

      {/* ━━━ タブ ━━━ */}
      <Section title="タブ">
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 1 }}>
          <Tab label="基本情報" />
          <Tab label="カルテ" />
          <Tab label="オーダ" />
          <Tab label="看護記録" />
        </Tabs>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {['基本情報タブの内容がここに表示されます。', 'カルテタブの内容がここに表示されます。', 'オーダタブの内容がここに表示されます。', '看護記録タブの内容がここに表示されます。'][tabValue]}
          </Typography>
        </Paper>
      </Section>

      {/* ━━━ ダイアログ ━━━ */}
      <Section title="ダイアログ">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          登録・編集を伴う操作はモーダルダイアログで行います。用途に応じて 3 つのサイズパターンを使い分けます。下のボタンから各サンプルを開けます。
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5, mb: 1, '& li': { mb: 0.5 } }}>
          <Typography component="li" variant="body2" color="text.secondary">
            <strong>大（<code>maxWidth="md"</code>）</strong>: 多項目・複数セクションを伴う登録手続き（例：入院指示／入院手続き）。<code>Divider</code> + <code>subtitle2</code> でセクション分け
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            <strong>中（<code>maxWidth="sm"</code>）</strong>: 標準的な単一フォーム（例：転棟・転室）。<code>Grid</code> 整列が基本
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            <strong>確認のみ（<code>maxWidth="xs"</code>）</strong>: 破棄・取消・実行可否などメッセージ＋2ボタンだけ。フォーム無し・<code>dividers</code> 不要
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Button variant="contained" onClick={() => setDialogLargeOpen(true)}>大：入院指示（md）</Button>
          <Button variant="contained" onClick={() => setDialogOpen(true)}>中：転棟・転室（sm）</Button>
          <Button variant="contained" onClick={() => setDialogConfirmOpen(true)}>確認のみ（xs）</Button>
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>構成要素</Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5, mb: 1, '& li': { mb: 0.5 } }}>
          <Typography component="li" variant="body2" color="text.secondary">
            <strong>ヘッダー</strong>: タイトル＋対象のコンテキスト行（患者名・年齢・性別・現在地など）を <code>caption</code> で添える
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            <strong>ボディ</strong>: <code>DialogContent dividers</code> で枠線。フォームは <code>Grid</code> で整列し、区切り線（<code>Divider</code>）でグループ分け（入力 / 印刷オプション / 履歴 など）
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            <strong>フッター</strong>: 右寄せ。キャンセル＝<code>variant="text"</code>、主アクション＝<code>variant="contained"</code>。必須未入力時は主アクションを <code>disabled</code>
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            <strong>サイズ</strong>: <code>maxWidth="sm"</code> ＋ <code>fullWidth</code> を標準とし、項目が多い場合のみ <code>"md"</code>
          </Typography>
        </Box>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ pb: 0.5 }}>
            転棟・転室
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              田村 洋子 29歳 女性 / 現在 第1病棟 101号室 6床
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Chip label="移動" color="primary" size="small" sx={{ mb: 2 }} />
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>移動先 病棟</InputLabel>
                  <Select label="移動先 病棟" value="ward1">
                    <MenuItem value="ward1">第1病棟</MenuItem>
                    <MenuItem value="ward2">第2病棟</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel shrink>移動先 病室</InputLabel>
                  <Select label="移動先 病室" value="" displayEmpty notched>
                    <MenuItem value=""><em>移動先 病室</em></MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth disabled>
                  <InputLabel shrink>移動先 ベッド</InputLabel>
                  <Select label="移動先 ベッド" value="" displayEmpty notched>
                    <MenuItem value=""><em>移動先 ベッド</em></MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="移動日時" type="datetime-local" size="small" fullWidth
                  defaultValue="2026-05-30T14:03" InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControlLabel control={<Checkbox size="small" />} label="隔離" />
                <FormControlLabel control={<Checkbox size="small" />} label="拘束" />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="配膳先変更日時" type="datetime-local" size="small" fullWidth
                  defaultValue="2026-05-30T14:03" InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>印刷オプション</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel control={<Checkbox size="small" />} label="移動箋" />
              <FormControlLabel control={<Checkbox size="small" />} label="食事箋" />
            </Box>

            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary">履歴</Typography>
            <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                この患者の登録済み移動はありません。
              </Typography>
            </Paper>
          </DialogContent>
          <DialogActions>
            <Button variant="text" onClick={() => setDialogOpen(false)}>キャンセル</Button>
            <Tooltip title="必須項目（移動先など）が未入力のため無効">
              <span>
                <Button variant="contained" disabled>登録</Button>
              </span>
            </Tooltip>
          </DialogActions>
        </Dialog>

        {/* 大: 入院指示（md・多項目・複数セクション） */}
        <Dialog open={dialogLargeOpen} onClose={() => setDialogLargeOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 0.5 }}>
            入院指示
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              00010001 山田 太郎 52歳 男性 / 主治医 田村 医師
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip label="未確定" size="small" color="warning" />
              <Chip label="操作者: 医師" size="small" />
            </Stack>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>日時</Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <TextField label="入院日" type="date" size="small" fullWidth defaultValue="2026-05-30" InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="食事開始" type="datetime-local" size="small" fullWidth defaultValue="2026-05-30T12:00" InputLabelProps={{ shrink: true }} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>病室</Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>病棟</InputLabel>
                  <Select label="病棟" value="ward1">
                    <MenuItem value="ward1">第1病棟</MenuItem>
                    <MenuItem value="ward2">第2病棟</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel shrink>病室</InputLabel>
                  <Select label="病室" value="" displayEmpty notched><MenuItem value=""><em>病室</em></MenuItem></Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth disabled>
                  <InputLabel shrink>ベッド</InputLabel>
                  <Select label="ベッド" value="" displayEmpty notched><MenuItem value=""><em>ベッド</em></MenuItem></Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* 入院時文書サンプルは現時点では電子カルテで取り扱わないため削除（2026-08-17） */}

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>入院決定の理由</Typography>
            <TextField fullWidth size="small" multiline minRows={2} placeholder="メモ入力..." />
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
            <FormControlLabel
              control={<Checkbox size="small" defaultChecked />}
              label={<Typography variant="body2">指示箋を印刷する</Typography>}
            />
            <Stack direction="row" spacing={1}>
              <Button variant="text" onClick={() => setDialogLargeOpen(false)}>キャンセル</Button>
              <Button variant="outlined">更新</Button>
              <Tooltip title="必須項目（病室など）が未入力のため無効">
                <span><Button variant="contained" disabled>入院確定</Button></span>
              </Tooltip>
            </Stack>
          </DialogActions>
        </Dialog>

        {/* 確認のみ: xs・メッセージ＋2ボタン */}
        <Dialog open={dialogConfirmOpen} onClose={() => setDialogConfirmOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>保存していない変更があります</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              編集中の内容は保存されていません。破棄して画面を移動しますか？
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button variant="text" onClick={() => setDialogConfirmOpen(false)}>キャンセル</Button>
            <Button variant="contained" color="warning" onClick={() => setDialogConfirmOpen(false)}>破棄して移動</Button>
          </DialogActions>
        </Dialog>
      </Section>

      {/* ━━━ アイコン ━━━ */}
      <Section title="アイコン（使用中）">
        <Grid container spacing={2}>
          {[
            { icon: <LocalHospital />, label: '病棟' },
            { icon: <People />, label: '患者一覧' },
            { icon: <Search />, label: '検索' },
            { icon: <Description />, label: '記録' },
            { icon: <Lock />, label: '隔離' },
            { icon: <Home />, label: '外出' },
            { icon: <Add />, label: '追加' },
            { icon: <Edit />, label: '編集' },
            { icon: <Delete />, label: '削除' },
            { icon: <Save />, label: '保存' },
            { icon: <Check />, label: '確認' },
            { icon: <Close />, label: '閉じる' },
            { icon: <Warning />, label: '警告' },
            { icon: <Info />, label: '情報' },
          ].map(({ icon, label }) => (
            <Grid item key={label} sx={{ textAlign: 'center', minWidth: 72 }}>
              <Avatar sx={{ bgcolor: '#f0f2f5', color: '#1e293b', width: 40, height: 40, mx: 'auto', mb: 0.5 }}>
                {icon}
              </Avatar>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Grid>
          ))}
        </Grid>
      </Section>

      {/* ━━━ スペーシング ━━━ */}
      <Section title="スペーシング・角丸">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          MUI のデフォルトスペーシング (8px 単位) を使用。角丸: borderRadius = 8px（テーマ設定）
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[0.5, 1, 1.5, 2, 3, 4].map((sp) => (
            <Box key={sp} sx={{ textAlign: 'center' }}>
              <Box sx={{ width: 48, height: sp * 8, bgcolor: '#3b82f6', borderRadius: 0.5, mx: 'auto', mb: 0.5, minHeight: 4 }} />
              <Typography variant="caption" color="text.secondary">{sp * 8}px (sp={sp})</Typography>
            </Box>
          ))}
        </Box>
      </Section>
    </Box>
  );
};

export default DesignGuide;
