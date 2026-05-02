// ===== ep-07 観察記録 =====
// 連携設定ダイアログ
// 参考システムマニュアル: 02 看護支援オプション.pdf p.241-243
//
// 観察記録ダイアログ／一括ダイアログから起動。
// 看護記録連携 ON 時、登録時に S3 (ep-10) の useFlowsheetStore.addNursingRecord にもダブル書き込みする
// （実書き込みは呼び出し側で実施。本ダイアログは設定値の編集のみ）。
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, FormControlLabel, Checkbox, Typography, MenuItem, TextField,
} from '@mui/material';
import type { ObservationLinkSetting } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  initial: ObservationLinkSetting | undefined;
  onApply: (setting: ObservationLinkSetting) => void;
}

const REPORT_TO_OPTIONS: NonNullable<ObservationLinkSetting['reportTo']>[] = ['作成依頼', '確認依頼', '両方'];

const ObservationLinkSettingDialog: React.FC<Props> = ({ open, onClose, initial, onApply }) => {
  const [linkToNursingRecord, setLinkToNursingRecord] = React.useState(initial?.linkToNursingRecord ?? false);
  const [reportTo, setReportTo] = React.useState<ObservationLinkSetting['reportTo'] | ''>(initial?.reportTo ?? '');

  React.useEffect(() => {
    if (open) {
      setLinkToNursingRecord(initial?.linkToNursingRecord ?? false);
      setReportTo(initial?.reportTo ?? '');
    }
  }, [open, initial]);

  const handleApply = () => {
    onApply({
      linkToNursingRecord,
      reportTo: reportTo || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>連携設定</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <FormControlLabel
            control={
              <Checkbox
                checked={linkToNursingRecord}
                onChange={(e) => setLinkToNursingRecord(e.target.checked)}
              />
            }
            label={<Typography variant="body2">看護記録に連携する（部門記録簿で参照可）</Typography>}
          />
          <TextField
            select size="small" label="報告先"
            value={reportTo}
            onChange={(e) => setReportTo(e.target.value as ObservationLinkSetting['reportTo'])}
          >
            <MenuItem value="">指定なし</MenuItem>
            {REPORT_TO_OPTIONS.map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </TextField>
          <Typography variant="caption" color="text.secondary">
            ※ 看護記録連携 ON で登録すると、観察記録に加えて看護記録（タグ「隔離拘束観察」）が同時作成されます。
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={handleApply}>登録</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ObservationLinkSettingDialog;
