import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Typography, Select, MenuItem, FormControl, InputLabel, Button, Alert,
} from '@mui/material';
import { useFlowsheetStore } from '../store';
import type { ISODate, ShiftType } from '../types';

interface Props {
  open: boolean;
  patientId: string;
  date: ISODate;
  shift: ShiftType;
  onClose: () => void;
}

const SHIFT_LABEL: Record<ShiftType, string> = { night: '深夜', day: '日勤', evening: '準夜' };

const SignInputDialog: React.FC<Props> = ({ open, patientId, date, shift, onClose }) => {
  const property = useFlowsheetStore((s) => s.property);
  const staffs = useFlowsheetStore((s) => s.staffs);
  const currentStaffId = useFlowsheetStore((s) => s.currentStaffId);
  const signs = useFlowsheetStore((s) => s.signs);
  const upsertSign = useFlowsheetStore((s) => s.upsertSign);
  const deleteSign = useFlowsheetStore((s) => s.deleteSign);

  const existing = useMemo(
    () => signs.find((s) => s.patientId === patientId && s.date === date && s.shift === shift),
    [signs, patientId, date, shift],
  );

  const [signerId, setSignerId] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setSignerId(existing?.signerId ?? currentStaffId);
      setConfirmDelete(false);
    }
  }, [open, existing, currentStaffId]);

  // 候補スタッフ（マスタ実施者ロック）
  const candidateStaffs = property.signRoleLock === 'logonOnly'
    ? staffs.filter((s) => s.id === currentStaffId)
    : staffs;

  const handleSubmit = () => {
    if (!signerId) return;
    upsertSign(date, patientId, shift, signerId);
    onClose();
  };

  const handleDelete = () => {
    if (!existing) return;
    deleteSign(existing.id);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>
        サイン入力（{SHIFT_LABEL[shift]}）
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            対象日: {date}
          </Typography>

          <FormControl size="small" fullWidth>
            <InputLabel id="signer-label">サイン入力者</InputLabel>
            <Select
              labelId="signer-label"
              label="サイン入力者"
              value={signerId}
              onChange={(e) => setSignerId(e.target.value)}
            >
              {candidateStaffs.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}（{s.role}）</MenuItem>
              ))}
            </Select>
          </FormControl>

          {property.signRoleLock === 'logonOnly' && (
            <Alert severity="info">
              マスタ「実施者ロック」=「ログオン者のみ」のため、自分のみ選択可能です。
            </Alert>
          )}

          {existing && !confirmDelete && (
            <Alert severity="warning">
              既に「{staffs.find((s) => s.id === existing.signerId)?.name ?? existing.signerId}」のサインが登録されています。変更は [更新]、削除は [削除] を押してください。
            </Alert>
          )}

          {confirmDelete && (
            <Alert severity="error"
              action={
                <Stack direction="row" spacing={1}>
                  <Button color="inherit" size="small" onClick={() => setConfirmDelete(false)}>戻る</Button>
                  <Button color="error" size="small" variant="contained" onClick={handleDelete}>削除する</Button>
                </Stack>
              }>
              サインを削除します。よろしいですか？
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        {existing && (
          <Button color="error" onClick={() => setConfirmDelete(true)}>削除</Button>
        )}
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!signerId}>
          {existing ? '更新' : '登録'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignInputDialog;
