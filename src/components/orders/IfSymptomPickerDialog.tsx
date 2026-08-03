import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
  List, ListItemButton, ListItemText, Typography,
} from '@mui/material';
import { IF_SYMPTOMS } from '../../data/ifMaster';

interface Props {
  open: boolean;
  onClose: () => void;
  /** [登録] で選択した症状（コメント）を確定する。 */
  onSelect: (symptom: string) => void;
}

/**
 * ep-11 us-60: IF症状条件選択画面（症状テンプレート選択）。
 * 参考システム実機に準拠。左＝分類、右＝コメント。分類を選ぶとコメント一覧が出て、
 * コメントを選んで [登録] すると症状欄に反映する。「フリーコメント」は自由入力用。
 */
const IfSymptomPickerDialog: React.FC<Props> = ({ open, onClose, onSelect }) => {
  const [category, setCategory] = React.useState('');
  const [comment, setComment] = React.useState('');

  React.useEffect(() => { if (open) { setCategory(''); setComment(''); } }, [open]);

  const comments = React.useMemo(
    () => IF_SYMPTOMS.find((s) => s.category === category)?.comments ?? [],
    [category],
  );

  const handleRegister = () => {
    // 「フリーコメント」は自由入力（症状欄を空にして手入力させる）。それ以外はコメント確定。
    if (category === 'フリーコメント') { onSelect(''); return; }
    if (comment) onSelect(comment);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { height: '70vh' } }}>
      <DialogTitle sx={{ py: 1 }}>IF症状条件選択画面</DialogTitle>
      <DialogContent dividers sx={{ p: 0, display: 'flex', minHeight: 0 }}>
        {/* 左: 分類 */}
        <Box sx={{ width: 200, borderRight: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
          <Typography variant="caption" fontWeight={700} sx={{ px: 1.5, py: 0.5, display: 'block' }}>分類</Typography>
          <List dense>
            {IF_SYMPTOMS.map((s) => (
              <ListItemButton
                key={s.category}
                selected={category === s.category}
                onClick={() => { setCategory(s.category); setComment(''); }}
              >
                <ListItemText primary={s.category} />
              </ListItemButton>
            ))}
          </List>
        </Box>
        {/* 右: コメント */}
        <Box sx={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          <Typography variant="caption" fontWeight={700} sx={{ px: 1.5, py: 0.5, display: 'block' }}>コメント:</Typography>
          {category === 'フリーコメント' ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              自由入力です。[登録] 後、症状欄に直接入力してください。
            </Typography>
          ) : comments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>分類を選択してください。</Typography>
          ) : (
            <List dense>
              {comments.map((c) => (
                <ListItemButton key={c} selected={comment === c} onClick={() => setComment(c)}>
                  <ListItemText primary={c} />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
        <Button
          variant="contained"
          onClick={handleRegister}
          disabled={category === '' || (category !== 'フリーコメント' && comment === '')}
        >
          登録
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IfSymptomPickerDialog;
