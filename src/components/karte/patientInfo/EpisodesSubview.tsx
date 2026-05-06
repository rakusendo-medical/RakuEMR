import { useCallback } from 'react';
import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAppStore } from '../../../stores/useAppStore';
import type { KarteMode } from '../KartePage';
import { useDirtyForm } from './useDirtyForm';
import SubviewActionBar from './SubviewActionBar';

interface EpisodeItem {
  id: string;
  yearMonth: string;
  content: string;
  author: string;
  createdAt: string;
}

interface EpisodesForm {
  list: EpisodeItem[];
  selectedId: string | null;
  draftYearMonth: string;
  draftContent: string;
}

const INITIAL_LIST: EpisodeItem[] = [
  {
    id: 'EP001',
    yearMonth: '2017-02',
    content: '初回受診。不眠と倦怠感の主訴で来院。家族同伴。',
    author: '田村 医師',
    createdAt: '2017-02-08 10:30',
  },
  {
    id: 'EP002',
    yearMonth: '2018-04',
    content: '転居に伴い通院間隔を 2 週間ごとに変更。服薬コンプライアンス良好。',
    author: '田村 医師',
    createdAt: '2018-04-12 14:15',
  },
  {
    id: 'EP003',
    yearMonth: '2024-09',
    content: '職場ストレス増加で再診。睡眠導入剤の調整を検討。',
    author: '田村 医師',
    createdAt: '2024-09-03 11:00',
  },
];

const INITIAL_FORM: EpisodesForm = {
  list: INITIAL_LIST,
  selectedId: 'EP003',
  draftYearMonth: '2024-09',
  draftContent: INITIAL_LIST[2].content,
};

interface EpisodesSubviewProps {
  mode: KarteMode;
  onDirtyChange: (dirty: boolean) => void;
  discardSignal: number;
}

export default function EpisodesSubview({ mode, onDirtyChange, discardSignal }: EpisodesSubviewProps) {
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  const onDirtyChangeStable = useCallback(onDirtyChange, [onDirtyChange]);
  const { form, setForm, isDirty, save, cancel } = useDirtyForm<EpisodesForm>(
    INITIAL_FORM,
    onDirtyChangeStable,
    discardSignal,
  );

  const selectEpisode = (id: string) => {
    const e = form.list.find((x) => x.id === id);
    if (!e) return;
    setForm((f) => ({
      ...f,
      selectedId: id,
      draftYearMonth: e.yearMonth,
      draftContent: e.content,
    }));
  };

  const handleAdd = () => {
    showSnackbar('エピソードの新規作成（段階 1 ではモック動作）', 'info');
  };

  return (
    <Stack spacing={1.5}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
            エピソード一覧
          </Typography>
          <Button size="small" variant="text" startIcon={<AddIcon />} onClick={handleAdd}>
            新規
          </Button>
        </Stack>
        <List dense disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
          {form.list.map((e) => (
            <ListItemButton
              key={e.id}
              selected={form.selectedId === e.id}
              onClick={() => selectEpisode(e.id)}
            >
              <ListItemText
                primary={`${e.yearMonth}　${e.content.slice(0, 40)}${e.content.length > 40 ? '…' : ''}`}
                secondary={`${e.author} / ${e.createdAt}`}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItemButton>
          ))}
        </List>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          編集
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            size="small"
            type="month"
            label="年月"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 200 }}
            value={form.draftYearMonth}
            onChange={(e) => setForm((f) => ({ ...f, draftYearMonth: e.target.value }))}
          />
          <TextField
            fullWidth
            multiline
            minRows={4}
            maxRows={8}
            label="内容"
            placeholder="経過記録の自由記述（最大 4000 文字相当）"
            value={form.draftContent}
            onChange={(e) => setForm((f) => ({ ...f, draftContent: e.target.value }))}
          />
        </Stack>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            エピソードの追加・削除フローと 4000 文字バリデーションは段階 2 以降で対応予定。段階 1 では選択中エピソードの編集と保存のみ。
          </Typography>
        </Box>
      </Paper>

      <SubviewActionBar
        mode={mode}
        isDirty={isDirty}
        onSave={() => {
          save();
          showSnackbar('エピソードを保存しました（モック）', 'success');
        }}
        onCancel={cancel}
        saveLabel="エピソードを保存"
      />
    </Stack>
  );
}
