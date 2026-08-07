import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box,
  TextField, Typography, List, ListItemButton, ListItemText,
  Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Checkbox,
  Table, TableHead, TableBody, TableRow, TableCell, IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { Order, OrderType, Patient } from '../../types';
import {
  ECT_ITEMS, ECT_SETS, findEctItem,
  type EctCategory, type EctSet, type EctSubset,
} from '../../data/ectMaster';
import ConfirmDiscardDialog from './ConfirmDiscardDialog';
import OrderDialogTitle from './OrderDialogTitle';
import { todayStr } from './orderDate';

/** 手技行（チェックのみ）。 */
interface ProcRow { id: string; code: number; name: string; checked: boolean; }
/** 前処置／後処置行（チェック＋用量・単位）。 */
interface DrugRow { id: string; code: number; name: string; dose: string; unit: string; checked: boolean; }

let rowSeq = 0;
const nextId = () => `ectrow-${rowSeq++}`;

interface Props {
  open: boolean;
  /** 起動元のボタンで確定するオーダ種別（本モックでは「ECT」）。 */
  orderType: OrderType;
  patient: Patient;
  doctorName: string;
  onClose: () => void;
  onRegister: (order: Order) => void;
}

/**
 * ep-11 us-58: ECT（修正型電気けいれん療法・m-ECT）オーダ。
 * 参考システムマニュアル（第5章 第8部 ECT オーダ）に準拠。
 * 左＝ECT セット／サブセット、右＝手技・前処置・通電時間・後処置（実施項目にチェック＋用量入力）＋理由/所見/承諾。
 * サブセットを選ぶと内容がチェック付きでロードされる。
 */
const EctOrderDialog: React.FC<Props> = ({ open, orderType, patient, doctorName, onClose, onRegister }) => {
  const [startDate, setStartDate] = React.useState(todayStr());
  const [procedures, setProcedures] = React.useState<ProcRow[]>([]);
  const [premeds, setPremeds] = React.useState<DrugRow[]>([]);
  const [postmeds, setPostmeds] = React.useState<DrugRow[]>([]);
  const [stimSeconds, setStimSeconds] = React.useState('');
  const [addTarget, setAddTarget] = React.useState<EctCategory | null>(null);
  const [addQuery, setAddQuery] = React.useState('');
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setStartDate(todayStr());
      setProcedures([]); setPremeds([]); setPostmeds([]); setStimSeconds('');
      setAddTarget(null); setAddQuery(''); setConfirmDiscard(false);
    }
  }, [open]);

  const dirty =
    procedures.length > 0 || premeds.length > 0 || postmeds.length > 0 || stimSeconds !== '';
  const requestClose = () => { if (dirty) setConfirmDiscard(true); else onClose(); };

  /** サブセットを選択：手技・前処置・通電時間・後処置をチェック付きでロード（前の内容は置き換え）。 */
  const applySubset = (subset: EctSubset) => {
    setProcedures(subset.procedureCodes.map((c) => {
      const it = findEctItem(c);
      return { id: nextId(), code: c, name: it?.name ?? `未設定(${c})`, checked: true };
    }));
    const toDrug = (d: { code: number; dose: string }): DrugRow => {
      const it = findEctItem(d.code);
      return { id: nextId(), code: d.code, name: it?.name ?? `未設定(${d.code})`, dose: d.dose, unit: it?.unit ?? '', checked: true };
    };
    setPremeds(subset.premeds.map(toDrug));
    setPostmeds(subset.postmeds.map(toDrug));
    setStimSeconds(subset.stimSeconds);
  };

  const toggleProc = (id: string) =>
    setProcedures((prev) => prev.map((p) => (p.id === id ? { ...p, checked: !p.checked } : p)));
  const patchDrug = (setter: React.Dispatch<React.SetStateAction<DrugRow[]>>, id: string, patch: Partial<DrugRow>) =>
    setter((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const removeProc = (id: string) => setProcedures((prev) => prev.filter((p) => p.id !== id));
  const removeDrug = (setter: React.Dispatch<React.SetStateAction<DrugRow[]>>, id: string) =>
    setter((prev) => prev.filter((d) => d.id !== id));

  /** [追加]（ECT 項目検索）で選んだ項目を該当区分へ追加（チェック付き）。 */
  const addItem = (code: number) => {
    const it = findEctItem(code);
    if (!it) return;
    if (it.category === '手技') {
      setProcedures((prev) => [...prev, { id: nextId(), code, name: it.name, checked: true }]);
    } else {
      const row: DrugRow = { id: nextId(), code, name: it.name, dose: '', unit: it.unit ?? '', checked: true };
      (it.category === '前処置' ? setPremeds : setPostmeds)((prev) => [...prev, row]);
    }
    setAddTarget(null); setAddQuery('');
  };

  const addCandidates = React.useMemo(() => {
    if (!addTarget) return [];
    const q = addQuery.trim();
    return ECT_ITEMS.filter((i) => i.category === addTarget)
      .filter((i) => (q ? i.name.includes(q) || i.kana.includes(q) : true));
  }, [addTarget, addQuery]);

  const anyChecked =
    procedures.some((p) => p.checked) || premeds.some((d) => d.checked) || postmeds.some((d) => d.checked);
  const canRegister = anyChecked && startDate !== '';

  const handleRegister = () => {
    if (!canRegister) return;
    const parts: string[] = [];
    parts.push(...procedures.filter((p) => p.checked).map((p) => p.name));
    const drugStr = (d: DrugRow) => (d.dose !== '' ? `${d.name} ${d.dose}${d.unit}` : d.name);
    parts.push(...premeds.filter((d) => d.checked).map(drugStr));
    if (stimSeconds !== '') parts.push(`通電 ${stimSeconds}秒`);
    parts.push(...postmeds.filter((d) => d.checked).map(drugStr));
    onRegister({
      id: `ORD-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      type: orderType,
      content: parts.join(' ／ '),
      schedule: '',
      status: '指示済',
      startDate,
      days: 0,
      doctorName,
    });
  };

  const drugTable = (
    title: EctCategory,
    rows: DrugRow[],
    setter: React.Dispatch<React.SetStateAction<DrugRow[]>>,
  ) => (
    <Box sx={{ mb: 1.5 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <Typography variant="subtitle2">{title}</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={() => { setAddTarget(title); setAddQuery(''); }}>
          追加
        </Button>
      </Stack>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 44 }}>実施</TableCell>
              <TableCell>名称</TableCell>
              <TableCell sx={{ width: 90 }}>用量</TableCell>
              <TableCell sx={{ width: 60 }}>単位</TableCell>
              <TableCell sx={{ width: 44 }}>削除</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={5}><Typography variant="caption" color="text.secondary">なし（サブセット選択か[追加]で登録）</Typography></TableCell></TableRow>
            ) : rows.map((d) => (
              <TableRow key={d.id}>
                <TableCell align="center">
                  <Checkbox size="small" checked={d.checked} onChange={() => patchDrug(setter, d.id, { checked: !d.checked })} inputProps={{ 'aria-label': `${title} ${d.name}` }} />
                </TableCell>
                <TableCell>{d.name}</TableCell>
                <TableCell>
                  <TextField type="number" size="small" variant="standard" value={d.dose}
                    onChange={(e) => patchDrug(setter, d.id, { dose: e.target.value })}
                    inputProps={{ min: 0, step: 'any', 'aria-label': `用量 ${d.name}` }} />
                </TableCell>
                <TableCell>{d.unit}</TableCell>
                <TableCell>
                  <IconButton size="small" aria-label={`削除 ${d.name}`} onClick={() => removeDrug(setter, d.id)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );

  return (
    <Dialog open={open} onClose={requestClose} maxWidth="lg" fullWidth PaperProps={{ sx: { height: '88vh' } }}>
      <OrderDialogTitle title={`${orderType}オーダ`} patient={patient} />
      <DialogContent dividers sx={{ p: 0, display: 'flex', minHeight: 0 }}>
        {/* 左: ECT セット → サブセット */}
        <Box sx={{ width: 240, borderRight: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
          <Box sx={{ px: 1.5, py: 1, bgcolor: '#f1f5f9' }}>
            <Typography variant="caption" fontWeight={700}>ECT セット</Typography>
          </Box>
          {ECT_SETS.map((set: EctSet) => (
            <Accordion key={set.code} defaultExpanded disableGutters sx={{ '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 36, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                <Typography variant="body2" fontWeight={700}>{set.name}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <List dense disablePadding>
                  {set.subsets.map((sub) => (
                    <ListItemButton key={sub.code} sx={{ pl: 3 }} onClick={() => applySubset(sub)}>
                      <ListItemText primary={sub.name} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItemButton>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* 右: 実施内容 */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, minWidth: 0 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
            <TextField label="実施予定日" type="date" required size="small" value={startDate}
              onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 180 }} />
            <Typography variant="caption" color="text.secondary">担当医: {doctorName}</Typography>
          </Stack>

          {/* 手技 */}
          <Box sx={{ mb: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography variant="subtitle2">手技</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={() => { setAddTarget('手技'); setAddQuery(''); }}>追加</Button>
            </Stack>
            {procedures.length === 0 ? (
              <Typography variant="caption" color="text.secondary">なし（サブセット選択か[追加]で登録）</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {procedures.map((p) => (
                  <Stack key={p.id} direction="row" alignItems="center" sx={{ width: 320 }}>
                    <FormControlLabel
                      sx={{ m: 0 }}
                      control={<Checkbox size="small" checked={p.checked} onChange={() => toggleProc(p.id)} inputProps={{ 'aria-label': `手技 ${p.name}` }} />}
                      label={<Typography variant="body2">{p.name}</Typography>}
                    />
                    <IconButton size="small" aria-label={`削除 ${p.name}`} onClick={() => removeProc(p.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Box>
            )}
          </Box>

          {drugTable('前処置', premeds, setPremeds)}

          {/* 通電時間 */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>通電時間</Typography>
            <TextField type="number" size="small" value={stimSeconds}
              onChange={(e) => setStimSeconds(e.target.value)}
              InputProps={{ endAdornment: <Typography variant="caption" sx={{ ml: 0.5 }}>秒</Typography> }}
              inputProps={{ min: 0, step: 'any', 'aria-label': '通電時間' }} sx={{ width: 140 }} />
          </Box>

          {drugTable('後処置', postmeds, setPostmeds)}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={requestClose}>閉じる</Button>
        <Button variant="contained" onClick={handleRegister} disabled={!canRegister}>登録</Button>
      </DialogActions>

      {/* ECT 項目検索（追加）ダイアログ。参考システム実機に準拠（かな名称検索＋コード｜名称の一覧）。 */}
      <Dialog open={addTarget !== null} onClose={() => setAddTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ py: 1 }}>{addTarget} 項目検索</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>かな名称:</Typography>
            <TextField autoFocus fullWidth size="small" placeholder="かな検索" value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)} inputProps={{ 'aria-label': 'ECT項目 かな検索' }} />
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
                    <Typography variant="caption" color="text.secondary">該当する項目がありません</Typography>
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

      <ConfirmDiscardDialog
        open={confirmDiscard}
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => { setConfirmDiscard(false); onClose(); }}
      />
    </Dialog>
  );
};

export default EctOrderDialog;
