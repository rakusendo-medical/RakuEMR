import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, Box, Checkbox, FormControlLabel,
  FormControl, Select, MenuItem, InputLabel, Alert,
} from '@mui/material';
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

const OrderConfirmDialog: React.FC<Props> = ({ open, kind, orders, onClose, onConfirm }) => {
  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  const [rehabOutcomes, setRehabOutcomes] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      setChecked(new Set());
      setRehabOutcomes({});
    }
  }, [open]);

  const toggle = (id: string) =>
    setChecked((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  /** リハビリオーダで中止対象のうち転帰区分未設定のもの */
  const missingRehab = orders.filter((o) => o.category === 'リハビリ' && checked.has(o.id) && !rehabOutcomes[o.id]);
  const canSubmit = missingRehab.length === 0;

  const submit = () => {
    if (!canSubmit) return;
    onConfirm(Array.from(checked), rehabOutcomes);
  };

  const title = kind === 'admission'
    ? '入院確定時のオーダ確認'
    : '退院確定時のオーダ確認';

  const description = kind === 'admission'
    ? '未実施の外来専用オーダがあります。中止対象にチェックを付けてください。'
    : '未実施の入院専用オーダ／移動・給食オーダがあります。中止対象にチェックを付けてください。リハビリオーダは転帰区分も指定します。';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Alert severity="info" sx={{ py: 0.5 }}>{description}</Alert>
          {orders.length === 0 ? (
            <Typography variant="body2" color="text.secondary">未実施オーダはありません。</Typography>
          ) : (
            <Stack spacing={1}>
              {orders.map((o) => {
                const isRehab = o.category === 'リハビリ';
                return (
                  <Box
                    key={o.id}
                    sx={{
                      p: 1.25,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: checked.has(o.id) ? '#fef3c7' : 'transparent',
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <FormControlLabel
                        control={<Checkbox checked={checked.has(o.id)} onChange={() => toggle(o.id)} />}
                        label={<Typography variant="body2" fontWeight={600}>中止</Typography>}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          [{o.category}] {o.content}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          予定日時: {o.scheduledAt}
                        </Typography>
                      </Box>
                      {isRehab && checked.has(o.id) && (
                        <FormControl size="small" sx={{ minWidth: 180 }} required>
                          <InputLabel>転帰区分（必須）</InputLabel>
                          <Select
                            label="転帰区分（必須）"
                            value={rehabOutcomes[o.id] ?? ''}
                            onChange={(e) => setRehabOutcomes((r) => ({ ...r, [o.id]: e.target.value }))}
                          >
                            {REHAB_OUTCOMES.map((v) => (
                              <MenuItem key={v.value} value={v.value} disabled={!v.selectable}>
                                {v.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={() => onConfirm([], {})}>スキップ</Button>
        <Button variant="contained" onClick={submit} disabled={!canSubmit}>
          {canSubmit ? `中止確定（${checked.size}件）` : `リハビリ転帰区分を入力してください`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderConfirmDialog;
