import React, { useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Button, Box, Stack, Chip,
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useFlowsheetStore } from '../store';

interface Props {
  open: boolean;
  patientId: string;
  ticketName: string | null;
  onClose: () => void;
}

const COLORS = ['#0ea5e9', '#16a34a', '#dc2626', '#a855f7', '#f59e0b', '#0891b2'];

const LabResultGraphDialog: React.FC<Props> = ({ open, patientId, ticketName, onClose }) => {
  const labResults = useFlowsheetStore((s) => s.labResults);

  const series = useMemo(() => {
    if (!ticketName) return { rows: [], itemNames: [] as string[] };
    const matched = labResults
      .filter((r) => r.patientId === patientId && r.ticketName === ticketName && r.status === 'available')
      .sort((a, b) => (a.date < b.date ? -1 : 1));
    const itemSet = new Set<string>();
    matched.forEach((r) => r.items.forEach((it) => itemSet.add(it.name)));
    const itemNames = Array.from(itemSet);
    const rows = matched.map((r) => {
      const row: Record<string, string | number> = { date: r.date };
      itemNames.forEach((n) => {
        const it = r.items.find((x) => x.name === n);
        if (it) row[n] = it.value;
      });
      return row;
    });
    return { rows, itemNames };
  }, [labResults, patientId, ticketName]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography variant="h6">検査結果グラフ表示</Typography>
          {ticketName && <Chip size="small" label={ticketName} />}
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: 360 }}>
        {!ticketName ? (
          <Typography variant="body2" color="text.disabled">伝票が選択されていません。</Typography>
        ) : series.rows.length === 0 ? (
          <Typography variant="body2" color="text.disabled">「{ticketName}」の検査結果がありません。</Typography>
        ) : (
          <Box sx={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series.rows} margin={{ top: 10, right: 16, bottom: 16, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {series.itemNames.map((n, i) => (
                  <Line
                    key={n} type="monotone" dataKey={n}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2} dot
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LabResultGraphDialog;
