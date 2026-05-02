import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, Box, TextField, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Checkbox, Alert,
} from '@mui/material';
import {
  MASTER_ADMIT_FORM_TYPES, MASTER_ADMIT_DOCS_BY_FORM,
} from '../../data/mockData';
import type { AdmitFormType } from '../../data/mockData';

export interface AdmitFormChangeParams {
  newAdmitForm: AdmitFormType;
  changedAt: string; // YYYY-MM-DDTHH:mm
  documents: string[];
}

interface Props {
  open: boolean;
  /** 変更前の形態（参照用、選択肢から除外） */
  currentForm?: AdmitFormType;
  patientName: string;
  onClose: () => void;
  onConfirm: (params: AdmitFormChangeParams) => void;
}

const formatDateTimeNow = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const AdmitFormChangeDialog: React.FC<Props> = ({ open, currentForm, patientName, onClose, onConfirm }) => {
  const initialForm: AdmitFormType =
    MASTER_ADMIT_FORM_TYPES.find((f) => f !== currentForm) ?? MASTER_ADMIT_FORM_TYPES[0];

  const [newForm, setNewForm] = React.useState<AdmitFormType>(initialForm);
  const [changedAt, setChangedAt] = React.useState<string>(formatDateTimeNow());
  const [docs, setDocs] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (open) {
      setNewForm(initialForm);
      setChangedAt(formatDateTimeNow());
      setDocs(new Set(MASTER_ADMIT_DOCS_BY_FORM[initialForm].slice(0, 2)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 形態変更時に文書チェックを差し替え
  React.useEffect(() => {
    setDocs(new Set(MASTER_ADMIT_DOCS_BY_FORM[newForm].slice(0, 2)));
  }, [newForm]);

  const toggleDoc = (d: string) =>
    setDocs((s) => {
      const n = new Set(s);
      if (n.has(d)) n.delete(d);
      else n.add(d);
      return n;
    });

  const handleSubmit = () => {
    onConfirm({ newAdmitForm: newForm, changedAt, documents: Array.from(docs) });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        入院形態変更
        <Typography variant="caption" color="text.secondary" component="div">
          {patientName} {currentForm && `／ 現形態: ${currentForm}`}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info" sx={{ py: 0.5 }}>
            形態変更日時より前に「{currentForm ?? '前形態'}」が終了し、新形態が開始する記録として登録されます。
            前形態の最終日は形態変更日時の 1 分前が自動設定されます。
          </Alert>

          <Stack direction="row" spacing={1.5}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>新しい入院形態</InputLabel>
              <Select label="新しい入院形態" value={newForm} onChange={(e) => setNewForm(e.target.value as AdmitFormType)}>
                {MASTER_ADMIT_FORM_TYPES.filter((f) => f !== currentForm).map((f) => (
                  <MenuItem key={f} value={f}>{f}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="形態変更日時"
              type="datetime-local"
              value={changedAt}
              onChange={(e) => setChangedAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Stack>

          <Box>
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
              入院時文書（新形態「{newForm}」に紐づく）
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
              {MASTER_ADMIT_DOCS_BY_FORM[newForm].map((d) => (
                <FormControlLabel
                  key={d}
                  control={<Checkbox checked={docs.has(d)} onChange={() => toggleDoc(d)} />}
                  label={d}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={handleSubmit}>登録</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdmitFormChangeDialog;
