import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
} from '@mui/material';

interface Props {
  open: boolean;
  /** 確認をやめて元のダイアログに戻る。 */
  onCancel: () => void;
  /** 変更を破棄して閉じる。 */
  onConfirm: () => void;
  message?: string;
}

/**
 * 入力途中のダイアログを閉じようとしたときの破棄確認（注意文）。
 * window.confirm は使わず MUI ダイアログで表示する。
 */
const ConfirmDiscardDialog: React.FC<Props> = ({ open, onCancel, onConfirm, message }) => (
  <Dialog open={open} onClose={onCancel} maxWidth="xs">
    <DialogTitle>確認</DialogTitle>
    <DialogContent>
      <DialogContentText>
        {message ?? '入力内容が破棄されます。閉じてもよろしいですか？'}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>キャンセル</Button>
      <Button color="error" variant="contained" onClick={onConfirm}>破棄して閉じる</Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDiscardDialog;
