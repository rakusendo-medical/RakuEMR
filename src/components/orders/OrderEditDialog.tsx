import React from 'react';
import {
  Dialog, DialogContent, DialogActions, Button, Box, Stack, Typography, TextField,
} from '@mui/material';
import type { Order, Patient, PrescriptionRpRow } from '../../types';
import type { OrderOverride } from '../../stores/useAppStore';
import {
  buildRxContent, rxOrderDays, rxRenderConfig, rxMarks, isRxType, orderToPendingRx,
} from '../../data/prescriptionContent';
import OrderDialogTitle from './OrderDialogTitle';

interface Props {
  open: boolean;
  patient: Patient;
  /** 表示中（オーバーレイ適用済み）のオーダ。 */
  order: Order | null;
  /** 既存のオーバーレイ（あれば rows を優先的に復元に使う）。 */
  override?: OrderOverride;
  onClose: () => void;
  onSave: (patch: OrderOverride) => void;
}

/**
 * ep-11: 指示簿の臨時オーダを閲覧画面から確認・変更するダイアログ。
 * 表示・変更の仕方は「作成中のオーダ」と同じ（処方系は 2 行表示で用量/用法コメント・日数、
 * 全種別で予定日・備考を編集できる）。保存はオーバーレイ（非永続）へ書き込む。
 */
const OrderEditDialog: React.FC<Props> = ({ open, patient, order, override, onClose, onSave }) => {
  const rx = order ? isRxType(order.type) : false;
  const [rows, setRows] = React.useState<PrescriptionRpRow[]>([]);
  const [dialogDays, setDialogDays] = React.useState(0);
  const [startDate, setStartDate] = React.useState('');
  const [remark, setRemark] = React.useState('');

  React.useEffect(() => {
    if (!open || !order) return;
    setStartDate(order.startDate);
    setRemark(order.remark ?? '');
    if (isRxType(order.type)) {
      // 既存オーバーレイの rows を優先。無ければ content から復元。
      const restored = override?.rows
        ? { rows: override.rows, dialogDays: override.dialogDays ?? 0 }
        : orderToPendingRx(order, order.id);
      setRows(restored?.rows ?? []);
      setDialogDays(restored?.dialogDays ?? 0);
    } else {
      setRows([]);
      setDialogDays(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!order) return null;
  const cfg = rxRenderConfig(order.type);

  const updateRow = (i: number, patch: Partial<PrescriptionRpRow>) =>
    setRows((prev) => prev.map((r, xi) => (xi === i ? { ...r, ...patch } : r)));
  const updateRpDays = (rpNo: number, val: string) =>
    setRows((prev) => prev.map((r) => (r.rpNo === rpNo ? { ...r, days: val } : r)));

  const handleSave = () => {
    if (rx && rows.length > 0) {
      const content = buildRxContent(rows, order.type, dialogDays);
      const days = rxOrderDays(rows, order.type, dialogDays);
      onSave({ startDate, remark, content, days, rows, dialogDays });
    } else {
      // 非処方系（検査/画像/心理検査/ECT）は予定日・備考のみ編集。
      onSave({ startDate, remark });
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <OrderDialogTitle title={`${order.type}オーダ（編集）`} patient={patient} />
      <DialogContent dividers>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          {/* 見出し行 */}
          <Stack direction="row" alignItems="center" sx={{ bgcolor: '#fce7f3', px: 1, py: 0.5 }}>
            <Typography variant="body2" sx={{ color: '#be185d', fontWeight: 700, flex: 1 }}>
              ［{order.type}］
            </Typography>
            <Typography variant="caption" sx={{ color: '#be185d', width: 150, textAlign: 'center' }}>予定日</Typography>
          </Stack>

          <Stack direction="row" alignItems="flex-start" sx={{ px: 1, py: 0.75 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {rx && rows.length > 0 ? (
                <Stack spacing={0.75}>
                  {rows.map((r, i) => {
                    const firstOfRp = i === 0 || rows[i - 1].rpNo !== r.rpNo;
                    const lastOfRp = i === rows.length - 1 || rows[i + 1].rpNo !== r.rpNo;
                    const marks = rxMarks(r, cfg.showPackaging);
                    return (
                      <Box
                        key={r.id}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '3.4em minmax(0, 1fr) 76px 200px',
                          columnGap: 1, rowGap: 0.25, alignItems: 'baseline',
                        }}
                      >
                        {/* 1行目: Rp番号 / 名称（包装） / 用量 / 用量コメント */}
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{firstOfRp ? `Rp${r.rpNo}` : ''}</Typography>
                        <Typography variant="body2" sx={{ minWidth: 0, wordBreak: 'break-all' }}>
                          {r.name}{marks.length ? `（${marks.join('・')}）` : ''}
                        </Typography>
                        <Typography variant="body2" sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {r.dose ? `${r.dose}${r.unit}` : ''}
                        </Typography>
                        <TextField
                          size="small" variant="standard" value={r.doseComment ?? ''}
                          onChange={(e) => updateRow(i, { doseComment: e.target.value })}
                          placeholder="用量コメント"
                          inputProps={{ 'aria-label': `用量コメント ${order.type} ${r.name}` }}
                          sx={{ width: '100%' }}
                        />
                        {/* 2行目: 空 / 用法 / 日数 / 用法コメント */}
                        <span />
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0 }}>
                          {r.usage || '（用法未設定）'}
                        </Typography>
                        {cfg.perRowDays && lastOfRp ? (
                          <TextField
                            type="number" size="small" variant="standard"
                            label={order.type === '注射' ? '回数' : '日数'}
                            value={r.days ?? ''}
                            onChange={(e) => updateRpDays(r.rpNo, e.target.value)}
                            inputProps={{ min: 0, step: 1, 'aria-label': `${order.type === '注射' ? '回数' : '日数'} ${order.type} Rp${r.rpNo}` }}
                            sx={{ width: '100%' }}
                          />
                        ) : <span />}
                        <TextField
                          size="small" variant="standard" value={r.usageComment ?? ''}
                          onChange={(e) => updateRow(i, { usageComment: e.target.value })}
                          placeholder="用法コメント"
                          inputProps={{ 'aria-label': `用法コメント ${order.type} ${r.name}` }}
                          sx={{ width: '100%' }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                // 非処方系は内容をそのまま表示（予定日・備考のみ編集）。
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{order.content}</Typography>
              )}
            </Box>
            {/* 予定日（＋入院定時は日数） */}
            <Box sx={{ width: 150, px: 0.5, flexShrink: 0 }}>
              <TextField
                type="date" size="small" variant="standard" value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                inputProps={{ 'aria-label': `予定日 ${order.type}` }} sx={{ width: '100%' }}
              />
              {rx && rows.length > 0 && !cfg.perRowDays && (
                <TextField
                  type="number" size="small" variant="standard" label="日数"
                  value={dialogDays}
                  onChange={(e) => setDialogDays(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                  inputProps={{ min: 0, step: 1, 'aria-label': `日数 ${order.type}` }}
                  sx={{ width: 84, mt: 0.5 }}
                />
              )}
            </Box>
          </Stack>

          {/* 備考 */}
          <Stack direction="row" spacing={1} alignItems="baseline" sx={{ px: 1, pb: 0.75 }}>
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', minWidth: '3.4em' }}>備考</Typography>
            <TextField
              size="small" variant="standard" fullWidth value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="備考"
              inputProps={{ 'aria-label': `備考 ${order.type}` }}
            />
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={handleSave}>保存</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderEditDialog;
