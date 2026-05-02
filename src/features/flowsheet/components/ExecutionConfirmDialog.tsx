import React, { useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Button, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, Stack,
} from '@mui/material';
import { useFlowsheetStore } from '../store';
import type { ISODate } from '../types';

interface Props {
  open: boolean;
  patientId: string;
  date: ISODate;
  onClose: () => void;
}

const ExecutionConfirmDialog: React.FC<Props> = ({ open, patientId, date, onClose }) => {
  const orders = useFlowsheetStore((s) => s.scheduledOrders);
  const completeOrder = useFlowsheetStore((s) => s.completeOrder);

  const list = useMemo(
    () => orders
      .filter((o) => o.patientId === patientId && o.date === date)
      .sort((a, b) => a.kind.localeCompare(b.kind)),
    [orders, patientId, date],
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography variant="h6">実施確認表</Typography>
          <Typography variant="body2" color="text.secondary">{date}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {list.length === 0 ? (
          <Typography variant="body2" color="text.disabled">この日の予定オーダはありません。</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 60 }}>種類</TableCell>
                <TableCell>オーダ</TableCell>
                <TableCell sx={{ width: 110 }}>状態</TableCell>
                <TableCell sx={{ width: 110 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((o) => (
                <TableRow key={o.id}>
                  <TableCell><Chip size="small" label={o.kind} /></TableCell>
                  <TableCell>{o.name}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={o.status === 'done' ? '実施済' : '未実施'}
                      color={o.status === 'done' ? 'default' : 'error'}
                      variant={o.status === 'done' ? 'outlined' : 'filled'}
                    />
                  </TableCell>
                  <TableCell>
                    {o.status === 'pending' && (
                      <Button size="small" variant="contained" onClick={() => completeOrder(o.id)}>
                        実施
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
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

export default ExecutionConfirmDialog;
