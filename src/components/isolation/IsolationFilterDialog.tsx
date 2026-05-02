// ===== ep-06 隔離拘束一覧 =====
// 条件設定ダイアログ（入院形態フィルタ）
// 参考システムマニュアル: 02 看護支援オプション.pdf p.245
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, FormControlLabel, Checkbox, Typography,
} from '@mui/material';
import { MASTER_ADMIT_FORM_TYPES, type AdmitFormType } from '../../data/mockData';

interface Props {
  open: boolean;
  onClose: () => void;
  /** 現在選択中の入院形態 */
  selected: AdmitFormType[];
  onApply: (selected: AdmitFormType[]) => void;
}

const IsolationFilterDialog: React.FC<Props> = ({ open, onClose, selected, onApply }) => {
  const [draft, setDraft] = React.useState<AdmitFormType[]>(selected);

  React.useEffect(() => {
    if (open) setDraft(selected);
  }, [open, selected]);

  const toggle = (form: AdmitFormType) => {
    setDraft((prev) => (prev.includes(form) ? prev.filter((f) => f !== form) : [...prev, form]));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>条件設定</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
            入院形態（その他区分の絞り込み）
          </Typography>
          {MASTER_ADMIT_FORM_TYPES.map((f) => (
            <FormControlLabel
              key={f}
              control={<Checkbox size="small" checked={draft.includes(f)} onChange={() => toggle(f)} />}
              label={<Typography variant="body2">{f}</Typography>}
            />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={() => { onApply(draft); onClose(); }}>OK</Button>
      </DialogActions>
    </Dialog>
  );
};

export default IsolationFilterDialog;
