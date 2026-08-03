import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Stack,
  Typography, Checkbox, FormControlLabel, TextField,
} from '@mui/material';
import type { Order, OrderType, Patient } from '../../types';
import {
  PSYCH_PURPOSES, PSYCH_TEST_GROUPS, PSYCH_TEST_OMAKASE, PSYCH_TEST_ADMISSION_SET,
} from '../../data/psychTestMaster';
import ConfirmDiscardDialog from './ConfirmDiscardDialog';
import { todayStr } from './orderDate';

interface Props {
  open: boolean;
  orderType: OrderType; // '心理検査'
  patient: Patient;
  doctorName: string;
  onClose: () => void;
  onRegister: (order: Order) => void;
}

const labelCell = { width: 96, flexShrink: 0, bgcolor: '#eaf2fa', px: 1, py: 0.75, fontWeight: 600 } as const;

/**
 * ep-11: 心理検査（心理－指示箋）オーダ。参考システム実機に準拠。
 * 現在の状態像／検査目的／検査項目（グループ別チェック）／実施時期／注意事項 を選び指示する。
 */
const PsychTestOrderDialog: React.FC<Props> = ({ open, orderType, patient, doctorName, onClose, onRegister }) => {
  const [stateImageOn, setStateImageOn] = React.useState(false);
  const [stateImageText, setStateImageText] = React.useState('');
  const [purposes, setPurposes] = React.useState<Set<string>>(new Set());
  const [purposeOtherOn, setPurposeOtherOn] = React.useState(false);
  const [purposeOtherText, setPurposeOtherText] = React.useState('');
  const [items, setItems] = React.useState<Set<string>>(new Set());
  const [itemOtherOn, setItemOtherOn] = React.useState(false);
  const [itemOtherText, setItemOtherText] = React.useState('');
  const [timing, setTiming] = React.useState<Set<string>>(new Set());
  const [urgentText, setUrgentText] = React.useState('');
  const [cautionOn, setCautionOn] = React.useState(false);
  const [cautionText, setCautionText] = React.useState('');
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setStateImageOn(false); setStateImageText('');
      setPurposes(new Set()); setPurposeOtherOn(false); setPurposeOtherText('');
      setItems(new Set()); setItemOtherOn(false); setItemOtherText('');
      setTiming(new Set()); setUrgentText('');
      setCautionOn(false); setCautionText(''); setConfirmDiscard(false);
    }
  }, [open]);

  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, v: string) =>
    set((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v); else next.add(v);
      return next;
    });

  const dirty = purposes.size > 0 || items.size > 0 || timing.size > 0 || stateImageOn || cautionOn;
  const requestClose = () => { if (dirty) setConfirmDiscard(true); else onClose(); };

  // いずれかのチェックボックスにチェックが入っていれば登録できる。
  const canRegister =
    stateImageOn || purposes.size > 0 || purposeOtherOn ||
    items.size > 0 || itemOtherOn || timing.size > 0 || cautionOn;

  const handleRegister = () => {
    if (!canRegister) return;
    const lines: string[] = [];
    if (stateImageOn && stateImageText.trim()) lines.push(`状態像: ${stateImageText.trim()}`);
    const purposeList = [...purposes, ...(purposeOtherOn && purposeOtherText.trim() ? [purposeOtherText.trim()] : [])];
    if (purposeList.length) lines.push(`検査目的: ${purposeList.join('・')}`);
    const itemList = [...items, ...(itemOtherOn && itemOtherText.trim() ? [itemOtherText.trim()] : [])];
    if (itemList.length) lines.push(`検査項目: ${itemList.join('・')}`);
    if (timing.size) {
      const t = [...timing].map((x) => (x === '急ぎの実施' && urgentText.trim() ? `急ぎの実施（${urgentText.trim()}）` : x));
      lines.push(`実施時期: ${t.join('・')}`);
    }
    if (cautionOn && cautionText.trim()) lines.push(`注意事項: ${cautionText.trim()}`);
    onRegister({
      id: `ORD-${Date.now()}`,
      patientId: patient.id, patientName: patient.name,
      type: orderType, content: lines.length ? lines.join('\n') : '心理検査',
      schedule: timing.has('急ぎの実施') ? '急ぎ' : '通常',
      status: '指示済', startDate: todayStr(), days: 0, doctorName,
    });
  };

  // チェックボックス（インライン）。
  const cb = (set: React.Dispatch<React.SetStateAction<Set<string>>>, current: Set<string>, label: string, indent = 0) => (
    <FormControlLabel key={label} sx={{ m: 0, ml: indent, display: 'flex', alignItems: 'flex-start' }}
      control={<Checkbox size="small" sx={{ p: 0.25, mt: 0.1 }} checked={current.has(label)}
        onChange={() => toggle(set, label)} inputProps={{ 'aria-label': label }} />}
      label={<Typography variant="body2">{label}</Typography>} />
  );

  const sectionLabel = (t: string) => <Typography variant="body2" sx={{ ...labelCell }}>{t}</Typography>;

  return (
    <Dialog open={open} onClose={requestClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: '90vh' } }}>
      <DialogTitle sx={{ py: 1, bgcolor: '#2f6ca6', color: '#fff', fontSize: '1rem' }}>
        心理－指示箋　{patient.patientNumber ?? patient.id}：{patient.name}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {/* 現在の状態像 */}
        <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          {sectionLabel('現在の状態像')}
          <Box sx={{ flex: 1, p: 0.5 }}>
            <FormControlLabel sx={{ m: 0 }}
              control={<Checkbox size="small" sx={{ p: 0.25 }} checked={stateImageOn} onChange={(_, v) => setStateImageOn(v)} inputProps={{ 'aria-label': '現在の状態像' }} />}
              label={<Typography variant="body2">現在の状態像</Typography>} />
            <TextField size="small" fullWidth multiline minRows={2} value={stateImageText}
              onChange={(e) => setStateImageText(e.target.value)} disabled={!stateImageOn}
              inputProps={{ 'aria-label': '現在の状態像 内容' }} />
          </Box>
        </Stack>

        {/* 検査目的 */}
        <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          {sectionLabel('検査目的')}
          <Box sx={{ flex: 1, p: 0.5 }}>
            {PSYCH_PURPOSES.map((p) => cb(setPurposes, purposes, p))}
            <FormControlLabel sx={{ m: 0, display: 'flex', alignItems: 'center' }}
              control={<Checkbox size="small" sx={{ p: 0.25 }} checked={purposeOtherOn} onChange={(_, v) => setPurposeOtherOn(v)} inputProps={{ 'aria-label': 'その他、または補足事項' }} />}
              label={<Typography variant="body2">その他、または補足事項</Typography>} />
            <TextField size="small" fullWidth multiline minRows={2} value={purposeOtherText}
              onChange={(e) => setPurposeOtherText(e.target.value)} disabled={!purposeOtherOn}
              inputProps={{ 'aria-label': '検査目的 補足' }} />
          </Box>
        </Stack>

        {/* 検査項目 */}
        <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          {sectionLabel('検査項目')}
          <Box sx={{ flex: 1, p: 0.5 }}>
            {cb(setItems, items, PSYCH_TEST_OMAKASE)}
            {PSYCH_TEST_GROUPS.map((g) => (
              <Box key={g.name}>
                {cb(setItems, items, g.name)}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  {g.items.map((it) => cb(setItems, items, it, 2))}
                </Box>
              </Box>
            ))}
            {cb(setItems, items, PSYCH_TEST_ADMISSION_SET)}
            <FormControlLabel sx={{ m: 0, display: 'flex', alignItems: 'center' }}
              control={<Checkbox size="small" sx={{ p: 0.25 }} checked={itemOtherOn} onChange={(_, v) => setItemOtherOn(v)} inputProps={{ 'aria-label': 'その他・備考' }} />}
              label={<Typography variant="body2">その他・備考</Typography>} />
            <TextField size="small" fullWidth multiline minRows={2} value={itemOtherText}
              onChange={(e) => setItemOtherText(e.target.value)} disabled={!itemOtherOn}
              inputProps={{ 'aria-label': '検査項目 備考' }} />
          </Box>
        </Stack>

        {/* 実施時期 */}
        <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          {sectionLabel('実施時期')}
          <Box sx={{ flex: 1, p: 0.5 }}>
            {cb(setTiming, timing, '通常実施')}
            {cb(setTiming, timing, '急ぎの実施')}
            <TextField size="small" fullWidth multiline minRows={1} value={urgentText}
              onChange={(e) => setUrgentText(e.target.value)} disabled={!timing.has('急ぎの実施')}
              placeholder="急ぎの事情・指定期日" inputProps={{ 'aria-label': '急ぎの事情' }} />
          </Box>
        </Stack>

        {/* 注意事項 */}
        <Stack direction="row">
          {sectionLabel('注意事項')}
          <Box sx={{ flex: 1, p: 0.5 }}>
            <FormControlLabel sx={{ m: 0, display: 'flex', alignItems: 'center' }}
              control={<Checkbox size="small" sx={{ p: 0.25 }} checked={cautionOn} onChange={(_, v) => setCautionOn(v)} inputProps={{ 'aria-label': '注意事項' }} />}
              label={<Typography variant="body2">注意事項</Typography>} />
            <TextField size="small" fullWidth multiline minRows={2} value={cautionText}
              onChange={(e) => setCautionText(e.target.value)} disabled={!cautionOn}
              inputProps={{ 'aria-label': '注意事項 内容' }} />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={requestClose}>閉じる</Button>
        <Button variant="contained" onClick={handleRegister} disabled={!canRegister}>登録</Button>
      </DialogActions>

      <ConfirmDiscardDialog open={confirmDiscard} onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => { setConfirmDiscard(false); onClose(); }} />
    </Dialog>
  );
};

export default PsychTestOrderDialog;
