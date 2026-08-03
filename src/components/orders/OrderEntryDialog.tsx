import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box,
  FormControl, InputLabel, Select, MenuItem, TextField, Typography,
  FormControlLabel, Checkbox, Table, TableHead, TableBody, TableRow, TableCell, IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { Order, OrderType, Patient } from '../../types';
import DrugAddDialog, { type DrugSelection } from './DrugAddDialog';
import { todayStr } from './orderDate';

/** オーダ種別の選択肢（値と表示ラベル）。表示は OrdersTab の ORDER_TYPE_LABEL に合わせる（文字→テキスト）。 */
const TYPE_OPTIONS: { value: OrderType; label: string }[] = [
  { value: '入院定時', label: '入院定時' },
  { value: '処方', label: '処方' },
  { value: '注射', label: '注射' },
  { value: '検査', label: '検査' },
  { value: '画像', label: '画像' },
  { value: '心理検査', label: '心理検査' },
  { value: 'ECT', label: 'ECT' },
  { value: 'リハビリ', label: 'リハビリ' },
  { value: 'IF', label: 'IF' },
  { value: '文字', label: 'テキスト' },
];

const isPrescriptionType = (t: OrderType | '') => t === '入院定時' || t === '処方';

/** Rp テーブルの 1 行（処方追加で選んだ薬剤＋Rp番号）。 */
type RpRow = DrugSelection & { rpNo: number };

/** ローカル日付を YYYY-MM-DD で返す（date input 初期値用）。 */

interface Props {
  open: boolean;
  patient: Patient;
  /** ログイン医師名（担当医として固定表示・登録される）。 */
  doctorName: string;
  onClose: () => void;
  /** 登録された Order を親へ渡す（親が store の addOrder 等へ流す）。 */
  onSubmit: (order: Order) => void;
}

/**
 * ep-11: 新規オーダ作成ダイアログ。共通枠（種別・開始日・日数・担当医）＋種別ごとの入力で構成。
 *   - 定時処方／処方（us-54）: 処方内容（Rp テーブル）＋処方追加ダイアログで薬剤を登録
 *   - それ以外（us-53）: 汎用フィールド（内容・スケジュール）
 */
const OrderEntryDialog: React.FC<Props> = ({ open, patient, doctorName, onClose, onSubmit }) => {
  const [type, setType] = React.useState<OrderType | ''>('');
  const [startDate, setStartDate] = React.useState(todayStr());
  const [days, setDays] = React.useState('1');
  // 汎用フォーム
  const [content, setContent] = React.useState('');
  const [schedule, setSchedule] = React.useState('');
  // 処方フォーム
  const [rpList, setRpList] = React.useState<RpRow[]>([]);
  const [ippouka, setIppouka] = React.useState(true);
  const [genericBlockedAll, setGenericBlockedAll] = React.useState(false);
  const [drugDialogOpen, setDrugDialogOpen] = React.useState(false);

  // open のたびに初期化する。
  React.useEffect(() => {
    if (open) {
      setType('');
      setStartDate(todayStr());
      setDays('1');
      setContent('');
      setSchedule('');
      setRpList([]);
      setIppouka(true);
      setGenericBlockedAll(false);
      setDrugDialogOpen(false);
    }
  }, [open]);

  const daysNum = Number(days);
  const daysInvalid = days.trim() === '' || Number.isNaN(daysNum) || daysNum < 0 || !Number.isInteger(daysNum);
  const prescription = isPrescriptionType(type);

  const detailValid = prescription ? rpList.length > 0 : content.trim().length > 0;
  const canSubmit = type !== '' && startDate !== '' && !daysInvalid && detailValid;

  /** 処方追加ダイアログで登録された薬剤を Rp テーブルへ追加。用法が異なれば別 Rp として採番する。 */
  const handleDrugRegister = (drugs: DrugSelection[]) => {
    setRpList((prev) => {
      let maxRpNo = prev.reduce((m, r) => Math.max(m, r.rpNo), 0);
      const rpNoByUsage = new Map<string, number>();
      const added = drugs.map((d) => {
        let rpNo = rpNoByUsage.get(d.usage);
        if (rpNo === undefined) {
          maxRpNo += 1;
          rpNo = maxRpNo;
          rpNoByUsage.set(d.usage, rpNo);
        }
        return { ...d, rpNo };
      });
      // 同じ Rp 番号の行が隣接するよう Rp 番号順に並べる（安定ソートで同一 Rp 内は追加順を維持）。
      return [...prev, ...added].sort((a, b) => a.rpNo - b.rpNo);
    });
    setDrugDialogOpen(false);
  };
  const removeRp = (id: string) => setRpList((prev) => prev.filter((r) => r.id !== id));

  /** 種別ごとに Order の content / schedule を合成する。 */
  const composeContentSchedule = (): { content: string; schedule: string } => {
    if (prescription) {
      const body = rpList
        .map((r) => `${r.name}${r.dose ? ` ${r.dose}${r.unit}` : ''}（${r.usage}）`)
        .join(' ／ ');
      const flags = [ippouka ? '一包化' : null, genericBlockedAll ? '後発不可(全)' : null].filter(Boolean);
      const c = flags.length ? `${body}［${flags.join('・')}］` : body;
      return { content: c, schedule: rpList[0]?.usage ?? '' };
    }
    return { content: content.trim(), schedule: schedule.trim() };
  };

  const handleSubmit = () => {
    if (!canSubmit) return; // canSubmit が true のとき type は OrderType に絞り込まれる
    const { content: c, schedule: s } = composeContentSchedule();
    onSubmit({
      id: `ORD-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      type,
      content: c,
      schedule: s,
      status: '指示済',
      startDate,
      days: daysNum,
      doctorName,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>新規オーダ作成</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            対象患者: {patient.patientNumber ?? patient.id}　{patient.name}
          </Typography>

          <FormControl size="small" fullWidth required>
            <InputLabel>オーダ種別</InputLabel>
            <Select
              label="オーダ種別"
              value={type}
              onChange={(e) => setType(e.target.value as OrderType)}
            >
              {TYPE_OPTIONS.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {prescription ? (
            // ===== 処方内容（Rp テーブル） =====
            <Box>
              <Typography variant="caption" color="text.secondary">処方内容</Typography>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mt: 0.5 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 40 }}>Rp</TableCell>
                      <TableCell>名称（最大用量）</TableCell>
                      <TableCell sx={{ width: 70 }}>用量</TableCell>
                      <TableCell sx={{ width: 150 }}>用法</TableCell>
                      <TableCell sx={{ width: 44 }}>削除</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rpList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Typography variant="caption" color="text.secondary">
                            「新しい Rp として薬剤を追加」から薬剤を登録してください
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      rpList.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.rpNo}</TableCell>
                          <TableCell>{r.name}</TableCell>
                          <TableCell>{r.dose ? `${r.dose}${r.unit}` : '—'}</TableCell>
                          <TableCell>{r.usage}</TableCell>
                          <TableCell>
                            <IconButton size="small" aria-label={`削除 ${r.name}`} onClick={() => removeRp(r.id)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setDrugDialogOpen(true)}
                sx={{ mt: 0.5 }}
              >
                新しい Rp として薬剤を追加
              </Button>
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={<Checkbox size="small" checked={ippouka} onChange={(_, v) => setIppouka(v)} />}
                  label="一包化"
                />
                <FormControlLabel
                  control={<Checkbox size="small" checked={genericBlockedAll} onChange={(_, v) => setGenericBlockedAll(v)} />}
                  label="後発品変更不可（全）"
                />
              </Stack>
            </Box>
          ) : (
            // ===== 汎用フォーム（処方以外） =====
            <>
              <TextField
                label="内容"
                required
                multiline
                minRows={2}
                fullWidth
                size="small"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="検査名・実施内容など"
              />
              <TextField
                label="スケジュール"
                size="small"
                fullWidth
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="例: 1日3回、隔日 など"
              />
            </>
          )}

          <Stack direction="row" spacing={1.5}>
            <TextField
              label="開始日"
              type="date"
              required
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 170 }}
            />
            <TextField
              label="日数"
              type="number"
              size="small"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              helperText="0 で継続"
              error={daysInvalid}
              inputProps={{ min: 0, step: 1 }}
              sx={{ width: 120 }}
            />
          </Stack>

          <Typography variant="caption" color="text.secondary">
            担当医: {doctorName}（ログイン医師）
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
          登録
        </Button>
      </DialogActions>

      <DrugAddDialog
        open={drugDialogOpen}
        onClose={() => setDrugDialogOpen(false)}
        onRegister={handleDrugRegister}
      />
    </Dialog>
  );
};

export default OrderEntryDialog;
