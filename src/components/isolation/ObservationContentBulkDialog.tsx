// ===== ep-07 観察記録 =====
// 内容一括入力ダイアログ
// 参考システムマニュアル: 02 看護支援オプション.pdf p.239-240, p.262
//
// 観察記録ダイアログ／一括ダイアログから「内容欄タイトル横の [入力]」で起動。
// 内容（最大3000文字）＋タグを設定すると、表示中の入力欄全てに同一内容・タグが反映される。
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, Chip, Typography,
} from '@mui/material';
import { MASTER_OBSERVATION_TEMPLATES, MASTER_OBSERVATION_TAGS } from '../../data/mockData';

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (payload: { content: string; tags: string[] }) => void;
}

const ObservationContentBulkDialog: React.FC<Props> = ({ open, onClose, onApply }) => {
  const [content, setContent] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (open) {
      setContent('');
      setTags([]);
    }
  }, [open]);

  const insertTemplate = (tmpl: string) => {
    setContent((prev) => (prev ? `${prev}\n${tmpl}` : tmpl));
  };
  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>内容一括入力</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Typography variant="caption" color="text.secondary">
            設定すると、起動元ダイアログで表示中の全ての入力欄に同じ内容・タグが反映されます（最大 3000 文字）。
          </Typography>
          <TextField
            multiline minRows={4} fullWidth size="small" label="内容"
            value={content}
            inputProps={{ maxLength: 3000 }}
            onChange={(e) => setContent(e.target.value)}
          />
          <Stack direction="row" spacing={0.3} flexWrap="wrap" useFlexGap>
            <Typography variant="caption" color="text.secondary" sx={{ width: '100%' }}>文例:</Typography>
            {MASTER_OBSERVATION_TEMPLATES.map((t, i) => (
              <Button key={i} size="small" variant="outlined"
                onClick={() => insertTemplate(t)}
                sx={{ fontSize: '0.65rem', textTransform: 'none', py: 0.1 }}
              >
                文例{i + 1}
              </Button>
            ))}
          </Stack>
          <Stack direction="row" spacing={0.3} flexWrap="wrap" useFlexGap>
            <Typography variant="caption" color="text.secondary" sx={{ width: '100%' }}>記事タグ:</Typography>
            {MASTER_OBSERVATION_TAGS.map((t) => (
              <Chip
                key={t}
                label={t}
                size="small"
                variant={tags.includes(t) ? 'filled' : 'outlined'}
                color={tags.includes(t) ? 'primary' : 'default'}
                onClick={() => toggleTag(t)}
              />
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={() => { onApply({ content, tags }); onClose(); }}>
          設定
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ObservationContentBulkDialog;
