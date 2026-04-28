import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Stack, TextField, Typography,
} from '@mui/material';
import type { CarePlan } from '../types';

interface Props {
  open: boolean;
  carePlan: CarePlan;
  onClose: () => void;
  onSubmit: (patch: { longTermGoal: string; createdAt: string }) => void;
}

const CarePlanEditDialog: React.FC<Props> = ({ open, carePlan, onClose, onSubmit }) => {
  const [longTermGoal, setLongTermGoal] = useState(carePlan.longTermGoal);
  const [createdAt, setCreatedAt] = useState(carePlan.createdAt);

  useEffect(() => {
    if (open) {
      setLongTermGoal(carePlan.longTermGoal);
      setCreatedAt(carePlan.createdAt);
    }
  }, [open, carePlan]);

  const goalChanged = longTermGoal.trim() !== carePlan.longTermGoal;
  const dateChanged = createdAt !== carePlan.createdAt;
  const isValid = longTermGoal.trim().length > 0 && createdAt.length > 0;

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
          disabled={!isValid || (!goalChanged && !dateChanged)}
          onClick={() => onSubmit({ longTermGoal: longTermGoal.trim(), createdAt })}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CarePlanEditDialog;
