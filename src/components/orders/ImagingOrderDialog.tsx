import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box,
  TextField, Typography, List, ListItemButton, ListItemText, MenuItem,
  FormControlLabel, Checkbox, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { Order, OrderType, Patient } from '../../types';
import {
  IMAGING_GROUPS, IMAGING_MASTER_OF,
  type ImagingCategory, type ImagingSet,
} from '../../data/imagingMaster';
import ConfirmDiscardDialog from './ConfirmDiscardDialog';
import OrderDialogTitle from './OrderDialogTitle';
import { todayStr } from './orderDate';

/** 部位・手技の行（チェックのみ）。 */
interface ItemRow { id: string; code?: number; name: string; checked: boolean; }
/** 薬剤の行（チェック＋用量・単位）。 */
interface DrugRow extends ItemRow { dose: string; unit: string; }
/** フィルムの行（チェック＋分画・撮影回数）。 */
interface FilmRow extends ItemRow { bunkatsu: string; kaisu: string; }

let rowSeq = 0;
const nextId = () => `imgrow-${rowSeq++}`;

interface Props {
  open: boolean;
  orderType: OrderType; // '画像'
  patient: Patient;
  doctorName: string;
  onClose: () => void;
  onRegister: (order: Order) => void;
}

/**
 * ep-11: 画像オーダ（放射線）。参考システム実機（画像オーダ画面）に準拠。
 * 左＝セット名グループ（プルダウン）＋セット名一覧、右＝内容（部位／手技／薬剤／フィルムの4区分）。
 * セット名を選ぶと右の内容がロードされ、各区分は[追加]で項目検索から追加できる。
 */
const ImagingOrderDialog: React.FC<Props> = ({ open, orderType, patient, doctorName, onClose, onRegister }) => {
  const [startDate, setStartDate] = React.useState(todayStr());
  const [groupName, setGroupName] = React.useState(IMAGING_GROUPS[0].name);
  const [setName, setSetName] = React.useState('');
  const [bui, setBui] = React.useState<ItemRow[]>([]);
  const [gijutsu, setGijutsu] = React.useState<ItemRow[]>([]);
  const [yakuzai, setYakuzai] = React.useState<DrugRow[]>([]);
  const [film, setFilm] = React.useState<FilmRow[]>([]);
  const [addTarget, setAddTarget] = React.useState<ImagingCategory | null>(null);
  const [addQuery, setAddQuery] = React.useState('');
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setStartDate(todayStr());
      setGroupName(IMAGING_GROUPS[0].name);
      setSetName('');
      setBui([]); setGijutsu([]); setYakuzai([]); setFilm([]);
      setAddTarget(null); setAddQuery(''); setConfirmDiscard(false);
    }
  }, [open]);

  const group = React.useMemo(
    () => IMAGING_GROUPS.find((g) => g.name === groupName) ?? IMAGING_GROUPS[0],
    [groupName],
  );

  /** セット名を選択：部位・手技・薬剤・フィルムをテンプレートからロード（前の内容は置き換え）。 */
  const applySet = (set: ImagingSet) => {
    setSetName(set.name);
    setBui(set.bui.map((b) => ({ id: nextId(), code: b.code, name: b.name, checked: b.checked ?? false })));
    setGijutsu(set.gijutsu.map((g) => ({ id: nextId(), code: g.code, name: g.name, checked: g.checked ?? false })));
    setYakuzai(set.yakuzai.map((y) => ({ id: nextId(), code: y.code, name: y.name, checked: y.checked ?? false, dose: '', unit: '' })));
    setFilm(set.film.map((f) => ({ id: nextId(), code: f.code, name: f.name, checked: f.checked ?? false, bunkatsu: f.bunkatsu ?? '', kaisu: f.kaisu ?? '1' })));
  };
  // グループを変えたらセット選択をリセット（内容も空に）。
  const changeGroup = (name: string) => {
    setGroupName(name); setSetName('');
    setBui([]); setGijutsu([]); setYakuzai([]); setFilm([]);
  };

  /** [追加]（項目検索）で選んだ項目を該当区分へ追加（チェック付き）。 */
  const addItem = (code: number) => {
    if (!addTarget) return;
    const it = IMAGING_MASTER_OF[addTarget].find((m) => m.code === code);
    if (!it) return;
    const base = { id: nextId(), code: it.code, name: it.name, checked: true };
    if (addTarget === '部位') setBui((prev) => [...prev, base]);
    else if (addTarget === '手技') setGijutsu((prev) => [...prev, base]);
    else if (addTarget === '薬剤') setYakuzai((prev) => [...prev, { ...base, dose: '', unit: it.unit ?? '' }]);
    else setFilm((prev) => [...prev, { ...base, bunkatsu: '', kaisu: '1' }]);
    setAddTarget(null); setAddQuery('');
  };

  // 追加ダイアログの候補。全区分とも初期表示（検索前も全件）＋かな/名称で絞り込み。
  const addCandidates = React.useMemo(() => {
    if (!addTarget) return [];
    const q = addQuery.trim();
    return IMAGING_MASTER_OF[addTarget].filter((i) => (q ? i.name.includes(q) || i.kana.includes(q) : true));
  }, [addTarget, addQuery]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<any[]>>, id: string) =>
    setter((prev) => prev.map((r) => (r.id === id ? { ...r, checked: !r.checked } : r)));
  const patch = (setter: React.Dispatch<React.SetStateAction<any[]>>, id: string, p: object) =>
    setter((prev) => prev.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const remove = (setter: React.Dispatch<React.SetStateAction<any[]>>, id: string) =>
    setter((prev) => prev.filter((r) => r.id !== id));

  const anyChecked =
    bui.some((r) => r.checked) || gijutsu.some((r) => r.checked) ||
    yakuzai.some((r) => r.checked) || film.some((r) => r.checked);
  const canRegister = anyChecked && startDate !== '';

  const dirty = setName !== '' || bui.length > 0 || gijutsu.length > 0 || yakuzai.length > 0 || film.length > 0;
  const requestClose = () => { if (dirty) setConfirmDiscard(true); else onClose(); };

  const handleRegister = () => {
    if (!canRegister) return;
    const lines: string[] = [setName ? `［${groupName}］-［${setName}］` : `［${groupName}］`];
    const buiList = bui.filter((r) => r.checked).map((r) => r.name);
    if (buiList.length) lines.push(`部位: ${buiList.join('、')}`);
    const gijutsuList = gijutsu.filter((r) => r.checked).map((r) => r.name);
    if (gijutsuList.length) lines.push(`手技: ${gijutsuList.join('、')}`);
    const yakuzaiList = yakuzai.filter((r) => r.checked).map((r) => (r.dose ? `${r.name} ${r.dose}${r.unit}` : r.name));
    if (yakuzaiList.length) lines.push(`薬剤: ${yakuzaiList.join('、')}`);
    const filmList = film.filter((r) => r.checked).map((r) => {
      const parts = [r.name];
      if (r.bunkatsu) parts.push(`${r.bunkatsu}分画`);
      if (r.kaisu) parts.push(`${r.kaisu}回`);
      return parts.join(' ');
    });
    if (filmList.length) lines.push(`フィルム: ${filmList.join('、')}`);
    onRegister({
      id: `ORD-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      type: orderType,
      content: lines.join('\n'),
      schedule: '',
      status: '指示済',
      startDate,
      days: 0,
      doctorName,
    });
  };

  // 区分見出し＋[追加]ボタン（ECTオーダに合わせ、見出し直後にインライン配置）。
  const sectionHead = (title: ImagingCategory) => (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
      <Typography variant="subtitle2">{title}</Typography>
      <Button size="small" startIcon={<AddIcon />} onClick={() => { setAddTarget(title); setAddQuery(''); }} aria-label={`${title} 追加`}>追加</Button>
    </Stack>
  );
  const checkRow = (r: ItemRow, setter: React.Dispatch<React.SetStateAction<any[]>>, cat: ImagingCategory) => (
    <Stack key={r.id} direction="row" alignItems="center" sx={{ px: 1, borderBottom: '1px dashed', borderColor: 'divider' }}>
      <FormControlLabel sx={{ m: 0, flex: 1 }}
        control={<Checkbox size="small" sx={{ p: 0.5 }} checked={r.checked} onChange={() => toggle(setter, r.id)} inputProps={{ 'aria-label': `${cat} ${r.name}` }} />}
        label={<Typography variant="body2">{r.name}</Typography>} />
      <IconButton size="small" aria-label={`削除 ${r.name}`} onClick={() => remove(setter, r.id)}>
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </Stack>
  );

  return (
    <Dialog open={open} onClose={requestClose} maxWidth="lg" fullWidth PaperProps={{ sx: { height: '88vh' } }}>
      <OrderDialogTitle title="画像オーダ" patient={patient} />
      <DialogContent dividers sx={{ p: 0, display: 'flex', minHeight: 0 }}>
        {/* 左: セット名グループ（プルダウン）→ セット名一覧 */}
        <Box sx={{ width: 260, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ px: 1, py: 0.75, bgcolor: '#f1f5f9' }}>
            <Typography variant="caption" fontWeight={700}>セット名称</Typography>
          </Box>
          <Box sx={{ p: 1 }}>
            <TextField select size="small" fullWidth value={groupName}
              onChange={(e) => changeGroup(e.target.value)}
              inputProps={{ 'aria-label': 'セット名グループ' }}>
              {IMAGING_GROUPS.map((g) => <MenuItem key={g.name} value={g.name}>{g.name}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <List dense disablePadding>
              {group.sets.map((s) => (
                <ListItemButton key={s.name} selected={s.name === setName} onClick={() => applySet(s)}>
                  <ListItemText primary={s.name} primaryTypographyProps={{ variant: 'body2' }} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Box>

        {/* 右: 内容（実施予定日・[追加]の配置は ECTオーダに準拠） */}
        <Box sx={{ flex: 1, overflow: 'auto', minWidth: 0, p: 1.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
            <TextField label="実施予定日" type="date" required size="small" value={startDate}
              onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 180 }} />
            <Typography variant="caption" color="text.secondary">担当医: {doctorName}</Typography>
          </Stack>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            内容　{setName ? `［${groupName}］-［${setName}］` : '（セット名を選択してください）'}
          </Typography>

              {/* 部位 */}
              <Box sx={{ mb: 1.5 }}>
              {sectionHead('部位')}
              {bui.length === 0
                ? <Typography variant="caption" color="text.secondary">なし（[追加]で登録）</Typography>
                : bui.map((r) => checkRow(r, setBui, '部位'))}
              </Box>

              {/* 手技 */}
              <Box sx={{ mb: 1.5 }}>
              {sectionHead('手技')}
              {gijutsu.length === 0
                ? <Typography variant="caption" color="text.secondary">なし（[追加]で登録）</Typography>
                : gijutsu.map((r) => checkRow(r, setGijutsu, '手技'))}
              </Box>

              {/* 薬剤（造影剤等・用量入力可） */}
              <Box sx={{ mb: 1.5 }}>
              {sectionHead('薬剤')}
              {yakuzai.length === 0
                ? <Typography variant="caption" color="text.secondary">なし（[追加]で登録）</Typography>
                : yakuzai.map((r) => (
                  <Stack key={r.id} direction="row" alignItems="center" spacing={1} sx={{ px: 1, borderBottom: '1px dashed', borderColor: 'divider' }}>
                    <FormControlLabel sx={{ m: 0, flex: 1 }}
                      control={<Checkbox size="small" sx={{ p: 0.5 }} checked={r.checked} onChange={() => toggle(setYakuzai, r.id)} inputProps={{ 'aria-label': `薬剤 ${r.name}` }} />}
                      label={<Typography variant="body2">{r.name}</Typography>} />
                    <TextField type="number" size="small" variant="standard" value={r.dose}
                      onChange={(e) => patch(setYakuzai, r.id, { dose: e.target.value })}
                      placeholder="用量" inputProps={{ min: 0, step: 'any', 'aria-label': `用量 ${r.name}` }} sx={{ width: 80 }} />
                    <Typography variant="caption" sx={{ width: 32 }}>{r.unit}</Typography>
                    <IconButton size="small" aria-label={`削除 ${r.name}`} onClick={() => remove(setYakuzai, r.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Box>

              {/* フィルム（撮影回数＝分画・回） */}
              <Box sx={{ mb: 1.5 }}>
              {sectionHead('フィルム')}
              {film.length === 0
                ? <Typography variant="caption" color="text.secondary">なし（[追加]で登録）</Typography>
                : film.map((r) => (
                  <Stack key={r.id} direction="row" alignItems="center" spacing={1} sx={{ px: 1, borderBottom: '1px dashed', borderColor: 'divider' }}>
                    <FormControlLabel sx={{ m: 0, flex: 1 }}
                      control={<Checkbox size="small" sx={{ p: 0.5 }} checked={r.checked} onChange={() => toggle(setFilm, r.id)} inputProps={{ 'aria-label': `フィルム ${r.name}` }} />}
                      label={<Typography variant="body2">{r.name}</Typography>} />
                    <TextField size="small" variant="standard" value={r.bunkatsu}
                      onChange={(e) => patch(setFilm, r.id, { bunkatsu: e.target.value })}
                      inputProps={{ 'aria-label': `分画 ${r.name}` }} sx={{ width: 56 }} />
                    <Typography variant="caption">分画</Typography>
                    <TextField type="number" size="small" variant="standard" value={r.kaisu}
                      onChange={(e) => patch(setFilm, r.id, { kaisu: e.target.value })}
                      inputProps={{ min: 0, step: 1, 'aria-label': `撮影回数 ${r.name}` }} sx={{ width: 56 }} />
                    <Typography variant="caption">回</Typography>
                    <IconButton size="small" aria-label={`削除 ${r.name}`} onClick={() => remove(setFilm, r.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={requestClose}>閉じる</Button>
        <Button variant="contained" onClick={handleRegister} disabled={!canRegister}>登録</Button>
      </DialogActions>

      {/* 項目検索（追加）ダイアログ。参考システム実機に準拠（かな名称検索＋コード｜名称の一覧）。 */}
      <Dialog open={addTarget !== null} onClose={() => setAddTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ py: 1 }}>{addTarget} の追加</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>かな名称:</Typography>
            <TextField autoFocus fullWidth size="small" placeholder="かな検索" value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)} inputProps={{ 'aria-label': '画像項目 かな検索' }} />
            <Button variant="outlined" size="small" sx={{ whiteSpace: 'nowrap' }}>検索</Button>
          </Stack>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ bgcolor: '#eaf2fa' }}>
                <TableCell align="center" sx={{ width: 90, fontWeight: 700, bgcolor: '#eaf2fa' }}>コード</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: '#eaf2fa' }}>名称</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {addCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2}>
                    <Typography variant="caption" color="text.secondary">該当なし</Typography>
                  </TableCell>
                </TableRow>
              ) : addCandidates.map((i) => (
                <TableRow key={i.code} hover sx={{ cursor: 'pointer' }} onClick={() => addItem(i.code)}>
                  <TableCell align="center">{i.code}</TableCell>
                  <TableCell>{i.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTarget(null)}>閉じる</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDiscardDialog open={confirmDiscard} onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => { setConfirmDiscard(false); onClose(); }} />
    </Dialog>
  );
};

export default ImagingOrderDialog;
