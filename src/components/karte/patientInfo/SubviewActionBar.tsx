import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import type { KarteMode } from '../KartePage';

interface SubviewActionBarProps {
  mode: KarteMode;
  isDirty: boolean;
  onSave: () => void;
  onCancel: () => void;
  /** 保存スナックバー文言（サブビュー名を含める） */
  saveLabel?: string;
}

export default function SubviewActionBar({
  mode,
  isDirty,
  onSave,
  onCancel,
  saveLabel,
}: SubviewActionBarProps) {
  const color = mode === 'outpatient' ? 'success' : 'primary';
  return (
    <Paper variant="outlined" sx={{ p: 1.25, position: 'sticky', bottom: 8, bgcolor: 'background.paper' }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        {isDirty ? (
          <Chip label="未保存" size="small" color="warning" variant="outlined" />
        ) : (
          <Typography variant="caption" color="text.secondary">
            変更はありません
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onCancel} disabled={!isDirty}>
          キャンセル
        </Button>
        <Button
          variant="contained"
          color={color}
          startIcon={<SaveIcon />}
          disabled={!isDirty}
          onClick={onSave}
        >
          {saveLabel ?? '保存'}
        </Button>
      </Stack>
    </Paper>
  );
}
