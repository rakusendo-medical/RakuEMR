// ===== ep-06 隔離拘束一覧 =====
// 指示受けサイン入力ダイアログ
// 参考システムマニュアル: 02 看護支援オプション.pdf p.249-250
//
// 一次／二次サイン × 開始／終了 の 4 区分を引数で切り替え。
// 既存サインがあれば更新／削除可。なければ登録のみ可。
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, MenuItem, Typography, Chip,
} from '@mui/material';
import type { IsolationConfirmSignKind, OrderConfirmSign } from '../../types';
import { MASTER_STAFF_FOR_SIGN } from '../../data/mockData';

const KIND_LABEL: Record<IsolationConfirmSignKind, { phase: '開始' | '終了'; rank: '一次' | '二次' }> = {
  startPrimary:   { phase: '開始', rank: '一次' },
  startSecondary: { phase: '開始', rank: '二次' },
  endPrimary:     { phase: '終了', rank: '一次' },
  endSecondary:   { phase: '終了', rank: '二次' },
};

interface Props {
  open: boolean;
  onClose: () => void;
  kind: IsolationConfirmSignKind;
  /** 既存サイン（あれば更新／削除モード） */
  existing?: OrderConfirmSign;
  /** ログオン職員のデフォルト ID（モック）。あれば初期選択 */
  defaultStaffId?: string;
  onUpsert: (sign: OrderConfirmSign) => void;
  onRemove: () => void;
}

const SignInputDialog: React.FC<Props> = ({ open, onClose, kind, existing, defaultStaffId, onUpsert, onRemove }) => {
  const label = KIND_LABEL[kind];
  const initialId = existing?.staffId ?? defaultStaffId ?? MASTER_STAFF_FOR_SIGN[0].id;
  const [staffId, setStaffId] = React.useState<string>(initialId);

  React.useEffect(() => {
    if (open) {
      setStaffId(existing?.staffId ?? defaultStaffId ?? MASTER_STAFF_FOR_SIGN[0].id);
    }
  }, [open, existing, defaultStaffId]);

  const isUpdate = !!existing;
  const handleSubmit = () => {
    const staff = MASTER_STAFF_FOR_SIGN.find((s) => s.id === staffId);
    if (!staff) return;
    onUpsert({
      staffId: staff.id,
      staffName: staff.name,
      signedAt: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        指示受けサイン入力
        <Chip
          label={`${label.phase}・${label.rank}`}
          size="small"
          color={label.phase === '開始' ? 'primary' : 'default'}
          variant="outlined"
        />
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          {existing && (
            <Typography variant="caption" color="text.secondary">
              現在: {existing.staffName} ({new Date(existing.signedAt).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' })})
            </Typography>
          )}
          <TextField
            select size="small" label="職員"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
          >
            {MASTER_STAFF_FOR_SIGN.map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        {existing && (
          <Button color="error" onClick={() => { onRemove(); }}>削除</Button>
        )}
        <Button variant="contained" onClick={handleSubmit}>
          {isUpdate ? '更新' : '登録'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignInputDialog;
