import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, Box, Checkbox, FormControlLabel,
  FormControl, Select, MenuItem, Link as MuiLink,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
} from '@mui/material';
import { Block as BlockIcon } from '@mui/icons-material';
import type { PendingOrderSample } from '../../data/mockData';
import { REHAB_OUTCOME_OPTIONS } from '../../data/mockData';

export type OrderConfirmKind = 'admission' | 'discharge';

interface Props {
  open: boolean;
  kind: OrderConfirmKind;
  orders: PendingOrderSample[];
  onClose: () => void;
  onConfirm: (cancelIds: string[], rehabOutcomes: Record<string, string>) => void;
}

const REHAB_OUTCOMES = REHAB_OUTCOME_OPTIONS;

const formatCancelTimestamp = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const OrderConfirmDialog: React.FC<Props> = ({ open, kind, orders, onClose, onConfirm }) => {
  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  const [rehabOutcome, setRehabOutcome] = React.useState<string>('');
  const [printCancellationSheet, setPrintCancellationSheet] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setChecked(new Set());
      setRehabOutcome('');
      setPrintCancellationSheet(false);
    }
  }, [open]);

  const toggle = (id: string) =>
    setChecked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const selectAll = () => setChecked(new Set(orders.map((o) => o.id)));
  const clearAll = () => setChecked(new Set());

  const hasRehabChecked = orders.some((o) => o.category === 'リハビリ' && checked.has(o.id));
  const needsRehabOutcome = hasRehabChecked && !rehabOutcome;
  const canSubmit = !needsRehabOutcome;

  const submit = () => {
    if (!canSubmit) return;
    const outcomes: Record<string, string> = {};
    if (hasRehabChecked && rehabOutcome) {
      orders.forEach((o) => {
        if (o.category === 'リハビリ' && checked.has(o.id)) outcomes[o.id] = rehabOutcome;
      });
    }
    onConfirm(Array.from(checked), outcomes);
  };

  const title = kind === 'admission' ? '入院確定時のオーダ確認' : '退院確定時のオーダ確認';

  // 内容と次回実施日のモック整形(指示医・伝票名はカテゴリから推定)
  const detailFor = (o: PendingOrderSample) => {
    const billLabel = o.content.split(/[（(]/)[0].trim();
    const doctor = '医師 大吾';
    const nextDate = o.scheduledAt.slice(0, 10).replace(/-/g, '/');
    const orderKind = o.category === 'リハビリ' || o.category === '外来専用' || o.category === '入院専用' ? '定期' : '臨時';
    return { billLabel, doctor, nextDate, orderKind };
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 700, mb: 1.5 }}>
          ※ 選択された指示は中止されます(中止日時: {formatCancelTimestamp()})
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: 60 }}>選択</TableCell>
                <TableCell sx={{ width: 80 }}>オーダ</TableCell>
                <TableCell>内容</TableCell>
                <TableCell>伝票(指示医)</TableCell>
                <TableCell sx={{ width: 110 }}>次回実施日</TableCell>
                <TableCell align="center" sx={{ width: 60 }}>中止</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      未実施オーダはありません。
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => {
                  const d = detailFor(o);
                  const isChecked = checked.has(o.id);
                  return (
                    <TableRow key={o.id} hover>
                      <TableCell align="center">
                        <Checkbox size="small" checked={isChecked} onChange={() => toggle(o.id)} />
                      </TableCell>
                      <TableCell>{d.orderKind}</TableCell>
                      <TableCell>{o.content}</TableCell>
                      <TableCell>
                        {d.billLabel}<br />
                        <Typography variant="caption" color="text.secondary">({d.doctor})</Typography>
                      </TableCell>
                      <TableCell>
                        <MuiLink underline="always" sx={{ color: '#1e40af', cursor: 'pointer' }}>
                          {d.nextDate}
                        </MuiLink>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => toggle(o.id)} sx={{ color: isChecked ? '#dc2626' : '#94a3b8' }}>
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack direction="row" spacing={1}>
          <MuiLink
            component="button"
            underline="always"
            sx={{ fontSize: '0.75rem', color: '#1e40af' }}
            onClick={selectAll}
          >
            全選択
          </MuiLink>
          <Typography variant="caption" color="text.secondary">|</Typography>
          <MuiLink
            component="button"
            underline="always"
            sx={{ fontSize: '0.75rem', color: '#1e40af' }}
            onClick={clearAll}
          >
            クリア
          </MuiLink>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={printCancellationSheet}
              onChange={(_, v) => setPrintCancellationSheet(v)}
            />
          }
          label={<Typography variant="body2">中止箋・削除箋を印刷する</Typography>}
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2">リハビリ転帰区分:</Typography>
          <FormControl size="small" sx={{ width: 110 }} error={needsRehabOutcome}>
            <Select
              value={rehabOutcome}
              onChange={(e) => setRehabOutcome(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">-</MenuItem>
              {REHAB_OUTCOMES.map((v) => (
                <MenuItem key={v.value} value={v.value} disabled={!v.selectable}>
                  {v.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="success"
            disabled={!canSubmit}
            onClick={submit}
          >
            {kind === 'admission' ? '入院確定' : '退院確定'}
          </Button>
          <Button variant="outlined" onClick={onClose}>閉じる</Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default OrderConfirmDialog;
