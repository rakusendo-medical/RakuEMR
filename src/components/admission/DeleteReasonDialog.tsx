import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, FormControl, InputLabel, Select, MenuItem,
  TextField, Alert,
} from '@mui/material';
import { DELETE_REASON_CATEGORIES } from '../../data/mockData';

interface Props {
  open: boolean;
  /** 退院指示中止時は「削除コメント」表記、入院指示中止時は「削除理由」表記 */
  variant?: 'admit' | 'discharge';
  onClose: () => void;
  // 中止箋・削除箋（削除指示箋／移動削除箋／食事指示削除箋）の印刷機能は不要のため削除（2026-08-18）。
  onConfirm: (params: {
    category: string;
    reason: string;
  }) => void;
}

const DeleteReasonDialog: React.FC<Props> = ({ open, variant = 'admit', onClose, onConfirm }) => {
  const [category, setCategory] = React.useState<string>('');
  const [reason, setReason] = React.useState<string>('');

  React.useEffect(() => {
    if (open) {
      setCategory('');
      setReason('');
    }
  }, [open]);

  const title = variant === 'discharge' ? '削除コメント' : '削除理由';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Alert severity="warning" sx={{ py: 0.5 }}>
            分類は必須です。診療録に表示されます。
          </Alert>
          <FormControl size="small" fullWidth required>
            <InputLabel>分類</InputLabel>
            <Select label="分類" value={category} onChange={(e) => setCategory(e.target.value)}>
              {DELETE_REASON_CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="理由（任意）"
            multiline
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {/* 削除指示箋／移動削除箋／食事指示削除箋の印刷機能は不要のため削除（2026-08-18） */}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          color="error"
          disabled={!category}
          onClick={() => onConfirm({ category, reason })}
        >
          中止する
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteReasonDialog;
