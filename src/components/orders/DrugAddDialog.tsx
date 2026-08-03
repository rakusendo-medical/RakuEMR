import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box,
  TextField, List, ListItemButton, ListItemText, Table, TableHead, TableBody,
  TableRow, TableCell, Select, MenuItem, IconButton, Typography,
  Divider, Tabs, Tab, Checkbox, Tooltip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { MEDICATIONS, UNIT_OPTIONS, USAGE_PATTERNS, type Medication } from '../../data/prescriptionMaster';
import { PRESCRIPTION_SETS, resolveSetDrugs } from '../../data/prescriptionSetMaster';
import ConfirmDiscardDialog from './ConfirmDiscardDialog';

/** 処方追加ダイアログで選択・編集中の薬剤 1 行。 */
export interface DrugSelection {
  id: string;
  name: string;
  dose: string;
  unit: string;
  usage: string;
  /** 後発品変更不可（入院定時/処方の拡張列）。 */
  noGeneric?: boolean;
  /** 公費認定外（入院定時/処方の拡張列）。 */
  publicExpense?: boolean;
  /** 別袋（入院定時/処方の拡張列）。 */
  separateBag?: boolean;
  /** 処方日数（入院定時/処方の拡張列）。 */
  days?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** 登録された薬剤（1 つ以上）を親へ渡す。親が新しい Rp として追加する。 */
  onRegister: (drugs: DrugSelection[]) => void;
  /** ダイアログ見出し（既定「処方追加」）。 */
  title?: string;
  /** かな検索対象の医薬品／注射マスタ（既定＝処方の医薬品マスタ）。 */
  medications?: Medication[];
  /** セットの一覧（既定＝処方セット）。 */
  sets?: { code: number; name: string }[];
  /** セット選択時に薬剤へ解決する関数（既定＝処方セット解決）。 */
  resolveSet?: (code: number) => { name: string; dose: string; unit: string; usage: string }[];
  /** セット選択欄のラベル（既定「処方セット」）。 */
  setLabel?: string;
  /** 過去のオーダー（前回どおり）。選ぶと含まれる薬剤を選択欄へ一括追加する。空なら選択欄を出さない。 */
  pastGroups?: { key: string; label: string; drugs: Omit<DrugSelection, 'id'>[] }[];
  /** 拡張列（後発品変更不可・公費認定外・別袋）を表示するか（入院定時/処方＝true・注射＝false）。既定 false。 */
  extended?: boolean;
  /** 処方日数列（薬剤単位）を表示するか（処方＝true。入院定時は末尾一括のため false）。既定 false。 */
  showDays?: boolean;
}

// 左で選択中（[>] で右へ追加する対象）の種別。
type Pending =
  | { kind: 'drug'; name: string; unit: string }
  | { kind: 'set'; code: number }
  | { kind: 'past'; key: string }
  | null;

/**
 * ep-11 us-54/us-56: 薬剤／注射の追加ダイアログ（モック）。参考システム実機に準拠。
 * 左＝検索欄（医師セット / 過去処方 / 医薬品名 の 3 タブ）。項目を選び [>] で右の「処方」表へ追加する。
 * 入院定時/処方は拡張列（後発品変更不可・公費認定外・別袋・処方日数）を表示する。
 */
const DrugAddDialog: React.FC<Props> = ({
  open, onClose, onRegister,
  title = '処方追加',
  medications = MEDICATIONS,
  sets = PRESCRIPTION_SETS,
  resolveSet = resolveSetDrugs,
  pastGroups = [],
  extended = false,
  showDays = false,
}) => {
  // 左検索欄のタブ（0=医師セット / 1=過去処方 / 2=医薬品名）。
  const [tab, setTab] = React.useState(0);
  const [setNameQuery, setSetNameQuery] = React.useState(''); // 医師セットのセット名検索
  const [query, setQuery] = React.useState('');               // 医薬品名のかな検索
  const [submitted, setSubmitted] = React.useState('');
  const [pending, setPending] = React.useState<Pending>(null); // 左で選択中の項目（[>] で追加）
  const [selected, setSelected] = React.useState<DrugSelection[]>([]);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTab(0);
      setSetNameQuery('');
      setQuery('');
      setSubmitted('');
      setPending(null);
      setSelected([]);
      setConfirmDiscard(false);
    }
  }, [open]);

  // 初期状態から変化しているか（検索文字・選択薬剤のいずれか）。
  const dirty = selected.length > 0 || query.trim() !== '' || submitted.trim() !== '' || setNameQuery.trim() !== '';
  const requestClose = () => {
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  // 医薬品名タブは常に医薬品名一覧を表示する（検索前も全件表示・かな検索で絞り込み）。
  const results = React.useMemo(() => {
    const q = query.trim();
    if (!q) return medications;
    return medications.filter((m) => m.name.includes(q) || m.kana.includes(q));
  }, [query, medications]);

  const addDrug = (name: string, defaultUnit: string) => {
    setSelected((prev) => [
      ...prev,
      { id: `DRG-${Date.now()}-${prev.length}`, name, dose: '', unit: defaultUnit, usage: '', noGeneric: false, publicExpense: false, separateBag: false, days: '' },
    ]);
  };
  /** 処方セットマスタのセットを選択し、含まれる薬剤を選択欄へ一括追加する。 */
  const addSet = (setCode: number) => {
    const drugs = resolveSet(setCode);
    if (drugs.length === 0) return;
    setSelected((prev) => [
      ...prev,
      ...drugs.map((d, i) => ({
        id: `DRG-${Date.now()}-${prev.length + i}`,
        name: d.name, dose: d.dose, unit: d.unit, usage: d.usage,
        noGeneric: false, publicExpense: false, separateBag: false, days: '',
      })),
    ]);
  };
  /** 過去のオーダー（前回どおり）を選択し、含まれる薬剤を選択欄へ一括追加する。 */
  const addPast = (key: string) => {
    const g = pastGroups.find((p) => p.key === key);
    if (!g || g.drugs.length === 0) return;
    setSelected((prev) => [
      ...prev,
      ...g.drugs.map((d, i) => ({ noGeneric: false, publicExpense: false, separateBag: false, days: '', ...d, id: `DRG-${Date.now()}-${prev.length + i}` })),
    ]);
  };

  // [>] で左の選択中項目を右の処方表へ追加する。
  const applyPending = () => {
    if (!pending) return;
    if (pending.kind === 'drug') addDrug(pending.name, pending.unit);
    else if (pending.kind === 'set') addSet(pending.code);
    else addPast(pending.key);
    setPending(null);
  };

  const patch = (id: string, p: Partial<DrugSelection>) =>
    setSelected((prev) => prev.map((d) => (d.id === id ? { ...d, ...p } : d)));
  const remove = (id: string) => setSelected((prev) => prev.filter((d) => d.id !== id));

  // 各行に用法が設定されていれば登録可（用量は任意）。
  const canRegister = selected.length > 0 && selected.every((d) => d.usage !== '');

  const handleRegister = () => {
    if (!canRegister) return;
    onRegister(selected);
  };

  const filteredSets = sets.filter((s) => s.name.includes(setNameQuery.trim()));
  const colCount = 5 + (extended ? 3 : 0) + (showDays ? 1 : 0);

  return (
    <Dialog open={open} onClose={requestClose} maxWidth="lg" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
          {/* 左: 検索欄（医師セット / 過去処方 / 医薬品名 の 3 タブ。参考システム実機準拠） */}
          <Box sx={{ width: 280, flexShrink: 0, border: '1px solid', borderColor: 'divider', borderRadius: 1, display: 'flex', flexDirection: 'column', minHeight: 360, maxHeight: 460 }}>
            <Tabs value={tab} onChange={(_, v) => { setTab(v); setPending(null); }} variant="fullWidth"
              sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0, fontSize: 13 } }}>
              <Tab label="医師セット" />
              <Tab label="過去処方" />
              <Tab label="医薬品名" />
            </Tabs>
            <Divider />
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {/* 医師セット: セット名検索 + セット一覧（選択して [>] で一括追加） */}
              {tab === 0 && (
                <>
                  <Box sx={{ p: 1 }}>
                    <TextField fullWidth size="small" label="セット名検索" value={setNameQuery}
                      onChange={(e) => setSetNameQuery(e.target.value)}
                      inputProps={{ 'aria-label': 'セット名検索' }} />
                  </Box>
                  <List dense>
                    {filteredSets.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
                        セットがありません
                      </Typography>
                    ) : (
                      filteredSets.map((s) => (
                        <ListItemButton key={s.code}
                          selected={pending?.kind === 'set' && pending.code === s.code}
                          onClick={() => setPending({ kind: 'set', code: s.code })}
                          onDoubleClick={() => { addSet(s.code); setPending(null); }}>
                          <ListItemText primary={s.name} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItemButton>
                      ))
                    )}
                  </List>
                </>
              )}
              {/* 過去処方: この患者の同種別オーダ履歴（選択して [>] で復元） */}
              {tab === 1 && (
                pastGroups.length === 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block' }}>
                    過去のオーダーはありません
                  </Typography>
                ) : (
                  <List dense>
                    {pastGroups.map((g) => (
                      <ListItemButton key={g.key}
                        selected={pending?.kind === 'past' && pending.key === g.key}
                        onClick={() => setPending({ kind: 'past', key: g.key })}
                        onDoubleClick={() => { addPast(g.key); setPending(null); }}>
                        <ListItemText primary={g.label}
                          primaryTypographyProps={{ variant: 'body2', sx: { whiteSpace: 'normal' } }} />
                      </ListItemButton>
                    ))}
                  </List>
                )
              )}
              {/* 医薬品名: かな検索 + 候補（選択して [>] で追加） */}
              {tab === 2 && (
                <>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1 }}>
                    <TextField label="かな検索" size="small" fullWidth value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') setSubmitted(query); }}
                      placeholder="例: あきねとん" />
                    <Button variant="outlined" size="small" onClick={() => setSubmitted(query)}>検索</Button>
                  </Stack>
                  <List dense>
                    {results.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
                        該当する薬剤がありません
                      </Typography>
                    ) : (
                      results.map((m) => (
                        <ListItemButton key={m.name}
                          selected={pending?.kind === 'drug' && pending.name === m.name}
                          onClick={() => setPending({ kind: 'drug', name: m.name, unit: m.defaultUnit })}
                          onDoubleClick={() => { addDrug(m.name, m.defaultUnit); setPending(null); }}>
                          <ListItemText primary={m.name} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItemButton>
                      ))
                    )}
                  </List>
                </>
              )}
            </Box>
          </Box>

          {/* 中央: [>] で左の選択項目を右の処方表へ追加 */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="選択した項目を処方へ追加">
              <span>
                <IconButton color="primary" aria-label="選択項目を追加" disabled={!pending}
                  onClick={applyPending}
                  sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <ChevronRightIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* 右: 処方（選択薬剤） */}
          <Box sx={{ flex: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'auto', minWidth: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {extended && <TableCell sx={{ width: 64 }}>後発品変更不可</TableCell>}
                  <TableCell sx={{ minWidth: 150 }}>名称（最大用量）</TableCell>
                  {extended && <TableCell sx={{ width: 56 }}>公費認定外</TableCell>}
                  {extended && <TableCell sx={{ width: 44 }}>別袋</TableCell>}
                  <TableCell sx={{ width: 80 }}>用量</TableCell>
                  <TableCell sx={{ width: 80 }}>単位</TableCell>
                  <TableCell sx={{ width: 160 }}>用法</TableCell>
                  {showDays && <TableCell sx={{ width: 72 }}>処方日数</TableCell>}
                  <TableCell sx={{ width: 44 }}>削除</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selected.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colCount}>
                      <Typography variant="caption" color="text.secondary">
                        左で項目を選び [&gt;] で処方へ追加してください
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  selected.map((d) => (
                    <TableRow key={d.id}>
                      {extended && (
                        <TableCell align="center">
                          <Checkbox size="small" checked={!!d.noGeneric}
                            onChange={(_, v) => patch(d.id, { noGeneric: v })}
                            inputProps={{ 'aria-label': `後発品変更不可 ${d.name}` }} />
                        </TableCell>
                      )}
                      <TableCell sx={{ minWidth: 150, whiteSpace: 'normal', wordBreak: 'break-word' }}>{d.name}</TableCell>
                      {extended && (
                        <TableCell align="center">
                          <Checkbox size="small" checked={!!d.publicExpense}
                            onChange={(_, v) => patch(d.id, { publicExpense: v })}
                            inputProps={{ 'aria-label': `公費認定外 ${d.name}` }} />
                        </TableCell>
                      )}
                      {extended && (
                        <TableCell align="center">
                          <Checkbox size="small" checked={!!d.separateBag}
                            onChange={(_, v) => patch(d.id, { separateBag: v })}
                            inputProps={{ 'aria-label': `別袋 ${d.name}` }} />
                        </TableCell>
                      )}
                      <TableCell>
                        <TextField
                          type="number" size="small" variant="standard" value={d.dose}
                          onChange={(e) => patch(d.id, { dose: e.target.value })}
                          inputProps={{ min: 0, step: 1, 'aria-label': `用量 ${d.name}` }}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          size="small" variant="standard" value={d.unit}
                          onChange={(e) => patch(d.id, { unit: e.target.value })}
                          inputProps={{ 'aria-label': `単位 ${d.name}` }}
                        >
                          {(UNIT_OPTIONS.includes(d.unit) || d.unit === '' ? UNIT_OPTIONS : [d.unit, ...UNIT_OPTIONS]).map((u) => (
                            <MenuItem key={u} value={u}>{u}</MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          size="small" variant="standard" displayEmpty value={d.usage}
                          onChange={(e) => patch(d.id, { usage: e.target.value })}
                          inputProps={{ 'aria-label': `用法 ${d.name}` }}
                          sx={{ minWidth: 140, color: d.usage ? 'inherit' : 'error.main' }}
                        >
                          <MenuItem value=""><em>未設定</em></MenuItem>
                          {d.usage !== '' && !USAGE_PATTERNS.some((u) => u.label === d.usage) && (
                            <MenuItem value={d.usage}>{d.usage}</MenuItem>
                          )}
                          {USAGE_PATTERNS.map((u) => (
                            <MenuItem key={u.label} value={u.label}>{u.label}</MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      {showDays && (
                        <TableCell>
                          <TextField
                            type="number" size="small" variant="standard" value={d.days ?? ''}
                            onChange={(e) => patch(d.id, { days: e.target.value })}
                            inputProps={{ min: 0, step: 1, 'aria-label': `処方日数 ${d.name}` }}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <IconButton size="small" aria-label={`削除 ${d.name}`} onClick={() => remove(d.id)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={requestClose}>閉じる</Button>
        <Button variant="contained" onClick={handleRegister} disabled={!canRegister}>
          登録
        </Button>
      </DialogActions>
      <ConfirmDiscardDialog
        open={confirmDiscard}
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => { setConfirmDiscard(false); onClose(); }}
      />
    </Dialog>
  );
};

export default DrugAddDialog;
