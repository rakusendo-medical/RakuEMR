// ===== ep-06 隔離拘束一覧 =====
// 看護記録ダイアログのモック簡易版（隔離拘束一覧の「看護(開始/終了)」セルから起動）
//
// TODO(ep-10): S3 担当の NursingRecordDialog（ep-10 us-22/23）完成後、本コンポーネントは
// 置き換え予定。型・データモデルが NursingRecord (types/index.ts) に揃うことを期待。
// 差し替え時は本コンポーネントの呼出箇所（IsolationRestraint.tsx）の import を
// 切り替えるだけで済むよう、props の型は ep-10 側完成後に揃えること。
//
// 参考システムマニュアル: 該当ページは ep-10（フローシート／看護記録）側で参照
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, MenuItem, Typography, Chip,
} from '@mui/material';

type RecordKind = 'FOCUS' | 'SOAP' | 'フリー';
const RECORD_KINDS: RecordKind[] = ['FOCUS', 'SOAP', 'フリー'];

interface Props {
  open: boolean;
  onClose: () => void;
  /** ラベル（開始 / 終了） */
  phase: '開始' | '終了';
  /** 既存記録があれば編集モード（モックでは内容文字列のみ） */
  existing?: string;
  patientName?: string;
  onSubmit: (payload: { kind: RecordKind; content: string }) => void;
}

const RestraintNursingRecordStub: React.FC<Props> = ({ open, onClose, phase, existing, patientName, onSubmit }) => {
  const [kind, setKind] = React.useState<RecordKind>('SOAP');
  const [content, setContent] = React.useState(existing ?? '');

  React.useEffect(() => {
    if (open) {
      setKind('SOAP');
      setContent(existing ?? '');
    }
  }, [open, existing]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        看護記録（隔離拘束）
        <Chip label={phase} size="small" color="warning" variant="outlined" />
        {patientName && <Typography variant="body2" color="text.secondary">{patientName}</Typography>}
        <Chip label="モック" size="small" sx={{ ml: 'auto' }} />
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Typography variant="caption" color="text.secondary">
            ※ 本ダイアログは ep-06 用の簡易モックです。本実装は ep-10（看護記録基盤）側で統合予定。
          </Typography>
          <TextField
            select size="small" label="形式"
            value={kind}
            onChange={(e) => setKind(e.target.value as RecordKind)}
          >
            {RECORD_KINDS.map((k) => (
              <MenuItem key={k} value={k}>{k}</MenuItem>
            ))}
          </TextField>
          <TextField
            multiline minRows={5} fullWidth size="small" label="本文"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={kind === 'FOCUS' ? 'F:\nD:\nA:' : kind === 'SOAP' ? 'S:\nO:\nA:\nP:' : '本文を入力'}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          disabled={!content.trim()}
          onClick={() => { onSubmit({ kind, content }); }}
        >
          登録
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RestraintNursingRecordStub;
