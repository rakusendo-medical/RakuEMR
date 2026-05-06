import { useCallback } from 'react';
import { Chip, Paper, Stack, TextField, Typography } from '@mui/material';
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
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            患者メモ
          </Typography>
          <Chip
            size="small"
            variant="outlined"
            label="このタブのみ表示"
            sx={{ height: 20, fontSize: 11 }}
          />
          <Typography variant="caption" color="text.secondary">
            運用上の長文自由メモ（基本情報サブタブの「基本情報メモ（補足）」とは用途を分ける）
          </Typography>
        </Stack>
        <TextField
          fullWidth
          multiline
          minRows={8}
          maxRows={20}
          placeholder="運用上の自由メモを記載する枠。基本情報の補足は基本情報サブタブのメモへ。"
          value={form.memo}
          onChange={(e) => setForm({ memo: e.target.value })}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          表示位置: 患者情報タブ &gt; メモサブタブ。カルテ画面トップに常時表示する運用は将来拡張（現在は本タブ内のみ）。
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
