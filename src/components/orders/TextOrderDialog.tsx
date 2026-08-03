import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box,
  TextField, Typography, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Checkbox,
} from '@mui/material';
import type { Order, OrderType, Patient } from '../../types';
import { TEXT_ORDER_TITLES } from '../../data/textOrderMaster';
import ConfirmDiscardDialog from './ConfirmDiscardDialog';
import { todayStr } from './orderDate';

interface Props {
  open: boolean;
  /** 起動元のボタンで確定するオーダ種別（内部値「文字」。表示は「テキスト」）。 */
  orderType: OrderType;
  patient: Patient;
  doctorName: string;
  onClose: () => void;
  onRegister: (order: Order) => void;
}

/**
 * ep-11 us-62: 文字オーダ（テキスト）。
 * 参考システムマニュアル（第5章 第10部 文字オーダ）に準拠。
 * 直接文章を入力してオーダする。タイトル・状態・内容・指示日・継続フラグ を持ち、指示簿・カルテ記事に反映する。
 * （受信オーダ表示・指示箋出力は対象外＝マニュアル通り）
 */
const TextOrderDialog: React.FC<Props> = ({ open, orderType, patient, doctorName, onClose, onRegister }) => {
  const [startDate, setStartDate] = React.useState(todayStr());
  const [title, setTitle] = React.useState('');
  const [state, setState] = React.useState('');
  const [content, setContent] = React.useState('');
  const [keepOpen, setKeepOpen] = React.useState(false); // 継続する
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setStartDate(todayStr());
      setTitle(''); setState(''); setContent(''); setKeepOpen(false); setConfirmDiscard(false);
    }
  }, [open]);

  const dirty = title !== '' || state !== '' || content !== '';
  const requestClose = () => { if (dirty) setConfirmDiscard(true); else onClose(); };

  // タイトルと内容は必須。
  const canRegister = title !== '' && content.trim() !== '' && startDate !== '';

  const handleRegister = () => {
    if (!canRegister) return;
    const parts = [`【${title}】${content.trim()}`];
    if (state.trim() !== '') parts.push(`状態: ${state.trim()}`);
    onRegister({
      id: `ORD-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      type: orderType,
      content: parts.join(' ／ '),
      schedule: keepOpen ? '継続' : '',
      status: '指示済',
      startDate,
      // 継続する＝手動終了まで（継続オーダ）→ 0（継続）。継続なし＝指示日のみ→ 1 日。
      days: keepOpen ? 0 : 1,
      doctorName,
    });
  };

  return (
    <Dialog open={open} onClose={requestClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ py: 1 }}>
        テキストオーダ作成
        <Typography component="span" variant="body2" color="text.secondary">
          　対象患者: {patient.patientNumber ?? patient.id}　{patient.name}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <Stack direction="row" spacing={1.5}>
            <FormControl size="small" sx={{ minWidth: 180 }} required>
              <InputLabel>タイトル</InputLabel>
              <Select label="タイトル" value={title} onChange={(e) => setTitle(e.target.value)}>
                {TEXT_ORDER_TITLES.map((t) => (<MenuItem key={t} value={t}>{t}</MenuItem>))}
              </Select>
            </FormControl>
            <TextField label="指示日" type="date" size="small" value={startDate}
              onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
          </Stack>

          <TextField label="状態（任意）" size="small" fullWidth value={state}
            onChange={(e) => setState(e.target.value)} placeholder="患者の状態" />

          <TextField label="内容" required multiline minRows={4} fullWidth value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="オーダ内容を直接入力"
            inputProps={{ 'aria-label': '内容' }} />

          <FormControlLabel
            control={<Checkbox size="small" checked={keepOpen} onChange={(_, v) => setKeepOpen(v)} />}
            label={<Typography variant="body2">継続する（中止するまで指示簿に表示。無しは指示日のみ）</Typography>}
          />
          <Typography variant="caption" color="text.secondary">担当医: {doctorName}（ログイン医師）</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={requestClose}>閉じる</Button>
        <Button variant="contained" onClick={handleRegister} disabled={!canRegister}>登録</Button>
      </DialogActions>

      <ConfirmDiscardDialog
        open={confirmDiscard}
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => { setConfirmDiscard(false); onClose(); }}
      />
    </Dialog>
  );
};

export default TextOrderDialog;
