// ===== ep-08 隔離拘束歴 =====
// 隔離・拘束歴ダイアログ（殻）
// 参考システムマニュアル: 01 基本システム.pdf p.2232-2237
//
// 起動経路:
// - 入院歴画面（AdmissionHistoryView）の「隔離歴」リンク
// - 病床管理画面（WardMap）のフッター「隔離歴」メニュー
// - 患者情報画面（ep-09 完成後に追加予定）
//
// 中身は IsolationHistoryView を再利用（IsolationRestraint tab=2 inline と同一コア）。
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography,
} from '@mui/material';
import IsolationHistoryView from './IsolationHistoryView';
import { PATIENTS } from '../../data/mockData';

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string | null;
}

const IsolationHistoryDialog: React.FC<Props> = ({ open, onClose, patientId }) => {
  const patient = patientId ? PATIENTS.find((p) => p.id === patientId) : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography variant="h6">隔離・拘束歴</Typography>
          {patient && (
            <Typography variant="body2" color="text.secondary">
              [{patient.patientNumber ?? patient.id}] {patient.name}（{patient.gender === 'M' ? '男' : '女'} {patient.age}歳）
            </Typography>
          )}
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {patientId ? (
          <IsolationHistoryView patientId={patientId} />
        ) : (
          <Typography variant="body2" color="text.secondary">患者が選択されていません</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
};

export default IsolationHistoryDialog;
