import React, { useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Button, Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import { useFlowsheetStore } from '../store';

interface Props {
  open: boolean;
  patientId: string;
  onClose: () => void;
}

const PatternHistoryDialog: React.FC<Props> = ({ open, patientId, onClose }) => {
  const changeLogs = useFlowsheetStore((s) => s.changeLogs);
  const patternMaster = useFlowsheetStore((s) => s.patternMaster);
  const staffs = useFlowsheetStore((s) => s.staffs);

  const history = useMemo(
    () => changeLogs
      .filter((l) => l.targetType === 'pattern' && l.patientId === patientId)
      .sort((a, b) => (a.at < b.at ? 1 : -1)),
    [changeLogs, patientId],
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>フローシートパターン編集履歴</DialogTitle>
      <DialogContent dividers>
        {history.length === 0 ? (
          <Typography variant="body2" color="text.disabled">履歴はありません。</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 180 }}>日時</TableCell>
                <TableCell sx={{ width: 110 }}>開始日</TableCell>
                <TableCell sx={{ width: 160 }}>パターン</TableCell>
                <TableCell sx={{ width: 80 }}>区分</TableCell>
                <TableCell sx={{ width: 140 }}>職員</TableCell>
                <TableCell>内容</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((h) => {
                const pname = h.patternId
                  ? patternMaster.find((p) => p.id === h.patternId)?.name ?? 'パターンなし'
                  : 'パターンなし';
                return (
                  <TableRow key={h.id}>
                    <TableCell>{h.at.replace('T', ' ')}</TableCell>
                    <TableCell>{h.date ?? '—'}</TableCell>
                    <TableCell>{pname}</TableCell>
                    <TableCell>{h.op === 'register' ? '適用' : '変更/削除'}</TableCell>
                    <TableCell>{staffs.find((s) => s.id === h.actorId)?.name ?? h.actorId}</TableCell>
                    <TableCell>{h.summary}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PatternHistoryDialog;
