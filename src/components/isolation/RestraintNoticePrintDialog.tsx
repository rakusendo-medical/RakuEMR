// ===== ep-05 隔離拘束指示 =====
// 隔離拘束指示箋（告知書）印刷ダイアログ
// 参考システムマニュアル: 01 基本システム.pdf p.2193
//
// 新規モード: ダイアログで「告知書を印刷する」チェック ON 後の作成完了時に起動。
//             指示日／開始日時／面接フォーム／所見（編集可）を入力して [印刷] or [閉じる]。
// 再印刷モード: 既存指示記事から開く。内容欄は表示のみ（編集不可）。
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, MenuItem, Typography, Box, Chip,
} from '@mui/material';
import { Print as PrintIcon, Close as CloseIcon } from '@mui/icons-material';
import { MASTER_INTERVIEW_FORMS, MASTER_NOTICE_TEMPLATES } from '../../data/mockData';

interface Props {
  open: boolean;
  onClose: () => void;
  /** モード（再印刷時は内容編集不可） */
  mode?: 'new' | 'reprint';
  /** 指示日（カルテ記載日） YYYY-MM-DD */
  orderDate: string;
  /** 隔離拘束開始日時 */
  startDatetime: string;
  /** 初期内容（カルテ所見） */
  initialContent: string;
  /** 初期面接書式 */
  initialInterviewForm?: string;
  /** [印刷] 確定時のコールバック */
  onPrint: (payload: { content: string; interviewForm: string }) => void;
}

const RestraintNoticePrintDialog: React.FC<Props> = ({
  open, onClose, mode = 'new', orderDate, startDatetime, initialContent, initialInterviewForm, onPrint,
}) => {
  const reprint = mode === 'reprint';
  const [interviewForm, setInterviewForm] = React.useState(initialInterviewForm ?? MASTER_INTERVIEW_FORMS[0]);
  const [content, setContent] = React.useState(initialContent);

  React.useEffect(() => {
    if (open) {
      setInterviewForm(initialInterviewForm ?? MASTER_INTERVIEW_FORMS[0]);
      setContent(initialContent);
    }
  }, [open, initialInterviewForm, initialContent]);

  const insertTemplate = (tmpl: string) => {
    if (reprint) return;
    setContent((prev) => (prev ? `${prev}\n${tmpl}` : tmpl));
  };

  const handlePrint = () => {
    onPrint({ content, interviewForm });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        隔離拘束指示箋印刷
        {reprint && <Chip label="再印刷" size="small" color="warning" variant="outlined" />}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">指示日</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{orderDate}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">開始日時</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{startDatetime}</Typography>
            </Box>
          </Box>

          <TextField
            select size="small" label="面接書式"
            value={interviewForm}
            onChange={(e) => setInterviewForm(e.target.value)}
            disabled={reprint}
          >
            {MASTER_INTERVIEW_FORMS.map((f) => (
              <MenuItem key={f} value={f}>{f}</MenuItem>
            ))}
          </TextField>

          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">内容</Typography>
              {!reprint && (
                <>
                  <Box sx={{ flex: 1 }} />
                  <Typography variant="caption" color="text.secondary">文例:</Typography>
                  {MASTER_NOTICE_TEMPLATES.map((t, i) => (
                    <Button
                      key={i} size="small" variant="outlined"
                      onClick={() => insertTemplate(t)}
                      sx={{ fontSize: '0.65rem', px: 0.8, py: 0.1, minWidth: 0 }}
                    >
                      {`文例${i + 1}`}
                    </Button>
                  ))}
                </>
              )}
            </Stack>
            <TextField
              multiline minRows={6} fullWidth size="small"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={reprint}
              placeholder="告知書本文（カルテ所見を初期表示）"
            />
            {reprint && (
              <Typography variant="caption" color="text.secondary">
                再印刷時は内容を変更できません
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button startIcon={<CloseIcon />} onClick={onClose}>閉じる</Button>
        <Button startIcon={<PrintIcon />} variant="contained" color="primary" onClick={handlePrint}>
          印刷
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RestraintNoticePrintDialog;
