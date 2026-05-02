import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, Alert, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';

interface Props {
  open: boolean;
  /** 認証医候補（モックは固定リスト） */
  doctors?: string[];
  onClose: () => void;
  onConfirm: (proxyDoctor: string) => void;
}

const DEFAULT_DOCTORS = ['田村 医師', '岸本 医師', '森田 医師'];

const ProxyAuthDialog: React.FC<Props> = ({ open, doctors = DEFAULT_DOCTORS, onClose, onConfirm }) => {
  const [proxy, setProxy] = React.useState<string>('');

  React.useEffect(() => {
    if (open) setProxy('');
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>代行入力認証</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Alert severity="warning" sx={{ py: 0.5 }}>
            食事日時の変更とオーダ中止操作が伴うため、代行依頼医の認証が必要です。
            複数認証時は最後の認証医が代行依頼医となります。
          </Alert>
          <FormControl size="small" fullWidth>
            <InputLabel>認証医</InputLabel>
            <Select
              label="認証医"
              value={proxy}
              onChange={(e) => setProxy(e.target.value)}
            >
              {doctors.map((d) => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            選択した医師が代行依頼医として登録されます。
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" disabled={!proxy} onClick={() => onConfirm(proxy)}>確認</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProxyAuthDialog;
