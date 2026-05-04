import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControlLabel, Stack, TextField, Typography,
} from '@mui/material';
import type { CarePlan } from '../types';

interface Props {
  open: boolean;
  carePlan: CarePlan;
  onClose: () => void;
  onSubmit: (patch: {
    longTermGoal: string;
    createdAt: string;
    periodStart?: string;
    /** 継続中に戻す場合は null。文字列で日付を設定。undefined で変更なし。 */
    periodEnd?: string | null;
  }) => void;
}

const CarePlanEditDialog: React.FC<Props> = ({ open, carePlan, onClose, onSubmit }) => {
  const [longTermGoal, setLongTermGoal] = useState(carePlan.longTermGoal);
  const [createdAt, setCreatedAt] = useState(carePlan.createdAt);
  const [periodStart, setPeriodStart] = useState(carePlan.periodStart ?? carePlan.createdAt);
  const [continuing, setContinuing] = useState(carePlan.periodEnd === undefined);
  const [periodEnd, setPeriodEnd] = useState(carePlan.periodEnd ?? '');

  useEffect(() => {
    if (open) {
      setLongTermGoal(carePlan.longTermGoal);
      setCreatedAt(carePlan.createdAt);
      setPeriodStart(carePlan.periodStart ?? carePlan.createdAt);
      setContinuing(carePlan.periodEnd === undefined);
      setPeriodEnd(carePlan.periodEnd ?? '');
    }
  }, [open, carePlan]);

  const goalChanged = longTermGoal.trim() !== carePlan.longTermGoal;
  const dateChanged = createdAt !== carePlan.createdAt;
  const periodStartChanged = periodStart !== (carePlan.periodStart ?? carePlan.createdAt);
  const periodEndChanged = continuing
    ? carePlan.periodEnd !== undefined  // 継続中に変える
    : (periodEnd !== (carePlan.periodEnd ?? ''));

  const periodEndValid = continuing
    || (periodEnd.length > 0 && periodEnd >= periodStart);
  const isValid = longTermGoal.trim().length > 0
    && createdAt.length > 0
    && periodStart.length > 0
    && periodEndValid;
  const anyChange = goalChanged || dateChanged || periodStartChanged || periodEndChanged;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>看護過程を編集</DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">立案日</Typography>
            <TextField
              type="date"
              fullWidth
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="誤入力を訂正する場合のみ変更してください"
            />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">期間開始日</Typography>
            <TextField
              type="date"
              fullWidth
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="計画期間の開始日。同患者の他計画と重複しないこと"
            />
          </Box>
          <Box>
            <FormControlLabel
              control={<Checkbox checked={continuing} onChange={(_, v) => setContinuing(v)} />}
              label="継続中（期間終了日は未設定）"
            />
            {!continuing && (
              <TextField
                type="date"
                fullWidth
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="期間終了日。期間開始日以降の日付"
                error={!!periodEnd && periodEnd < periodStart}
              />
            )}
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">長期目標</Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={longTermGoal}
              onChange={(e) => setLongTermGoal(e.target.value)}
              placeholder="例: 服薬自己管理ができ、自宅退院を目指す"
            />
          </Box>
          {goalChanged && (
            <Alert severity="info" variant="outlined" sx={{ py: 0.5 }}>
              長期目標の変更は評価期限・各看護計画には影響しません。
              次回評価のタイミングに関わらず即時反映されます。
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          disabled={!isValid || !anyChange}
          onClick={() =>
            onSubmit({
              longTermGoal: longTermGoal.trim(),
              createdAt,
              periodStart: periodStartChanged ? periodStart : undefined,
              periodEnd: periodEndChanged
                ? (continuing ? null : periodEnd)
                : undefined,
            })
          }
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CarePlanEditDialog;
