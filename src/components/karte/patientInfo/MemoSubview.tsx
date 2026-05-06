import { useCallback } from 'react';
import { Paper, Stack, TextField, Typography } from '@mui/material';
import { useAppStore } from '../../../stores/useAppStore';
import type { KarteMode } from '../KartePage';
import { useDirtyForm } from './useDirtyForm';
import SubviewActionBar from './SubviewActionBar';

interface MemoForm {
  memo: string;
}

const INITIAL_FORM: MemoForm = {
  memo: '',
};

interface MemoSubviewProps {
  mode: KarteMode;
  onDirtyChange: (dirty: boolean) => void;
  discardSignal: number;
}

export default function MemoSubview({ mode, onDirtyChange, discardSignal }: MemoSubviewProps) {
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  const onDirtyChangeStable = useCallback(onDirtyChange, [onDirtyChange]);
  const { form, setForm, isDirty, save, cancel } = useDirtyForm<MemoForm>(
    INITIAL_FORM,
    onDirtyChangeStable,
    discardSignal,
  );

  return (
    <Stack spacing={1.5}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          患者メモ
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={8}
          maxRows={20}
          placeholder="自由記述。基本情報サブタブの「基本情報メモ（補足）」とは別に、運用上の自由メモを残す枠。"
          value={form.memo}
          onChange={(e) => setForm({ memo: e.target.value })}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          基本情報の「基本情報メモ（補足）」と用途を分け、より長文の運用メモをここに記載する想定。
        </Typography>
      </Paper>

      <SubviewActionBar
        mode={mode}
        isDirty={isDirty}
        onSave={() => {
          save();
          showSnackbar('患者メモを保存しました（モック）', 'success');
        }}
        onCancel={cancel}
        saveLabel="メモを保存"
      />
    </Stack>
  );
}
