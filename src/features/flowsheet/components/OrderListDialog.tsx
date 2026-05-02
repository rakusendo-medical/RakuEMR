import React, { useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Chip, Stack,
} from '@mui/material';
import { useFlowsheetStore } from '../store';
import type { ISODate } from '../types';

interface Props {
  open: boolean;
  patientId: string;
  /** 操作日（この日を含む 1 ヶ月分を表示） */
  baseDate: ISODate;
  onClose: () => void;
}

const monthAgo = (iso: ISODate): ISODate => {
  const d = new Date(iso);
  d.setDate(d.getDate() - 29);
  return d.toISOString().slice(0, 10);
};

const OrderListDialog: React.FC<Props> = ({ open, patientId, baseDate, onClose }) => {
  const orders = useFlowsheetStore((s) => s.scheduledOrders);

  const list = useMemo(() => {
    const from = monthAgo(baseDate);
    return orders
      .filter((o) => o.patientId === patientId && o.date >= from && o.date <= baseDate)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }, [orders, patientId, baseDate]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography variant="h6">指示状況（{monthAgo(baseDate)} 〜 {baseDate}）</Typography>
          <Typography variant="caption" color="text.disabled">参照のみ</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {list.length === 0 ? (
          <Typography variant="body2" color="text.disabled">該当期間のオーダはありません。</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 110 }}>日付</TableCell>
                <TableCell sx={{ width: 60 }}>種類</TableCell>
                <TableCell>オーダ</TableCell>
                <TableCell sx={{ width: 90 }}>状態</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{o.date}</TableCell>
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

export default OrderListDialog;
