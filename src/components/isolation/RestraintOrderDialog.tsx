// ===== ep-05 隔離拘束指示 =====
// 隔離拘束指示ダイアログ（カルテ記事作成ダイアログ／隔離拘束指示）
// 参考システムマニュアル: 01 基本システム.pdf p.2182-2210
//
// タイトルセレクトで 12 種（隔離/拘束/隔離拘束 × 開始/解除/継続/変更）に切替し、
// 表示項目（開始日時/終了日時/拘束部位）が動的に連動する。
// 「告知書を印刷する」ON で作成完了時に RestraintNoticePrintDialog を起動する。
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, MenuItem, Typography, Box, Chip,
  FormControlLabel, Checkbox, Divider, Alert,
  FormControl, InputLabel, Select,
} from '@mui/material';
import {
  Print as PrintIcon,
} from '@mui/icons-material';
import type {
  IsolationOrder, IsolationSubtype, IsolationOperation, Patient, WardId,
} from '../../types';
import { WARD_LABELS } from '../../types';
import {
  MASTER_RESTRAINT_PARTS,
  ISOLATION_ORDERS,
  ROOMS,
} from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import RestraintNoticePrintDialog from './RestraintNoticePrintDialog';

const SUBTYPES: IsolationSubtype[] = ['隔離', '拘束', '隔離拘束'];
const OPERATIONS: IsolationOperation[] = ['開始', '解除', '継続', '変更'];

/** タイトルから { subtype, operation } を導出 */
function parseTitle(title: string): { subtype: IsolationSubtype; operation: IsolationOperation } | null {
  for (const sub of SUBTYPES) {
    for (const op of OPERATIONS) {
      if (title === `${sub}${op}`) return { subtype: sub, operation: op };
    }
  }
  return null;
}

/** 表示項目の有無 */
function fieldsForTitle(title: string) {
  const parsed = parseTitle(title);
  if (!parsed) return { hasStart: true, hasEnd: false, hasParts: false };
  const { subtype, operation } = parsed;
  const isRelease = operation === '解除';
  const isRestraintLike = subtype === '拘束' || subtype === '隔離拘束';
  return {
    hasStart: !isRelease,
    hasEnd: isRelease,
    hasParts: isRestraintLike && !isRelease,
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  patient: Patient | null;
  /** 起動時のタイトル固定（指示リンクから渡される。例: '隔離開始'） */
  initialTitle: string;
  /** 編集モード時の元指示 ID（未指定なら新規） */
  editOrderId?: string;
}

const RestraintOrderDialog: React.FC<Props> = ({ open, onClose, patient, initialTitle, editOrderId }) => {
  const isEdit = !!editOrderId;
  const dynamicOrders = useAppStore((s) => s.dynamicIsolationOrders);
  const addIsolationOrder = useAppStore((s) => s.addIsolationOrder);
  const updateIsolationOrder = useAppStore((s) => s.updateIsolationOrder);
  const releaseIsolationOrder = useAppStore((s) => s.releaseIsolationOrder);
  const appendMedicalRecord = useAppStore((s) => s.appendMedicalRecord);
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  const sourceOrder = React.useMemo<IsolationOrder | null>(() => {
    if (!editOrderId) return null;
    return (
      dynamicOrders.find((o) => o.id === editOrderId) ??
      ISOLATION_ORDERS.find((o) => o.id === editOrderId) ??
      null
    );
  }, [editOrderId, dynamicOrders]);

  const [title, setTitle] = React.useState(initialTitle);
  const [startDatetime, setStartDatetime] = React.useState('');
  const [endDatetime, setEndDatetime] = React.useState('');
  const [restraintParts, setRestraintParts] = React.useState<string[]>([]);
  const [mealChangeDatetime, setMealChangeDatetime] = React.useState('');
  const [toWard, setToWard] = React.useState<WardId>('ward1');
  const [toRoom, setToRoom] = React.useState('');
  const [toBed, setToBed] = React.useState('');
  const [printNotice, setPrintNotice] = React.useState(false);

  // 移動先セレクト用
  const wardRooms = ROOMS.filter((r) => r.wardId === toWard);
  const selectedRoom = wardRooms.find((r) => r.roomNumber === toRoom);
  const availableBeds = selectedRoom
    ? selectedRoom.beds.filter((b) => b.bedStatus !== 'unavailable' && !b.patientId)
    : [];
  const [errors, setErrors] = React.useState<string[]>([]);
  const [noticeOpen, setNoticeOpen] = React.useState(false);
  const [pendingNoticePayload, setPendingNoticePayload] = React.useState<{ orderId: string; orderDate: string; startDatetime: string } | null>(null);

  // 初期化（open or initialTitle 変化時）
  React.useEffect(() => {
    if (!open) return;
    setTitle(initialTitle);
    if (sourceOrder) {
      setStartDatetime(sourceOrder.startDatetime ?? '');
      setEndDatetime(sourceOrder.endDatetime ?? '');
      setRestraintParts(sourceOrder.restraintParts ?? []);
    } else {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      setStartDatetime(iso);
      setEndDatetime(iso);
      setMealChangeDatetime(iso);
      setRestraintParts([]);
    }
    setToWard('ward1');
    setToRoom('');
    setToBed('');
    setPrintNotice(false);
    setErrors([]);
  }, [open, initialTitle, sourceOrder]);

  const fields = fieldsForTitle(title);
  const parsed = parseTitle(title);

  const toggleRestraintPart = (part: string) => {
    setRestraintParts((prev) => (prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]));
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!parsed) {
      errs.push('タイトルを選択してください');
      return errs;
    }
    if (fields.hasStart && !startDatetime) errs.push('開始日時を入力してください');
    if (fields.hasEnd && !endDatetime) errs.push('終了日時を入力してください');
    if (fields.hasParts && restraintParts.length === 0) errs.push('拘束部位を 1 件以上選択してください');
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0 || !parsed || !patient) return;

    const orderDate = startDatetime.slice(0, 10).replace(/-/g, '/') || endDatetime.slice(0, 10).replace(/-/g, '/');
    const orderId = sourceOrder?.id ?? `ISO-${Date.now()}`;
    const dt = startDatetime || endDatetime;

    if (parsed.operation === '解除' && sourceOrder) {
      releaseIsolationOrder(sourceOrder.id, endDatetime);
    } else if (sourceOrder) {
      updateIsolationOrder(sourceOrder.id, {
        subtype: parsed.subtype,
        operation: parsed.operation,
        startDatetime: fields.hasStart ? startDatetime : sourceOrder.startDatetime,
        endDatetime: fields.hasEnd ? endDatetime : undefined,
        restraintParts: fields.hasParts ? restraintParts : undefined,
      });
    } else {
      // 新規
      const newOrder: IsolationOrder = {
        id: orderId,
        patientId: patient.id,
        patientName: patient.name,
        type: parsed.subtype === '隔離拘束' ? '拘束' : parsed.subtype, // 後方互換: 旧 type は隔離 or 拘束
        subtype: parsed.subtype,
        operation: parsed.operation,
        startDatetime: fields.hasStart ? startDatetime : '',
        endDatetime: fields.hasEnd ? endDatetime : undefined,
        wardId: patient.wardId,
        roomNumber: `${patient.roomNumber}-${patient.bedLabel}`,
        doctorName: patient.doctorName,
        restraintParts: fields.hasParts ? restraintParts : undefined,
        isPending: false,
      };
      addIsolationOrder(newOrder);
    }

    // カルテ記事追加（解除指示には拘束部位を載せない）
    const tagBody: string[] = [];
    if (fields.hasStart) tagBody.push(`開始: ${startDatetime}`);
    if (fields.hasEnd) tagBody.push(`終了: ${endDatetime}`);
    if (fields.hasParts && restraintParts.length > 0) tagBody.push(`拘束部位: ${restraintParts.join('・')}`);

    appendMedicalRecord(patient.id, {
      id: `MR-${orderId}`,
      date: orderDate.replace(/\//g, '-'),
      dayOfWeek: '—',
      category: '医師記録',
      author: patient.doctorName,
      authorRole: '医師',
      content: `【${title}】\n${tagBody.join('\n')}`,
      tags: ['隔離拘束'],
      timestamp: dt,
      likes: 0,
      comments: 0,
    });

    showSnackbar(`${title} を登録しました`, 'success');

    if (printNotice) {
      // 告知書印刷ダイアログを起動
      setPendingNoticePayload({ orderId, orderDate, startDatetime: dt });
      setNoticeOpen(true);
    } else {
      onClose();
    }
  };

  const handleNoticePrint = (payload: { content: string; interviewForm: string }) => {
    if (pendingNoticePayload) {
      updateIsolationOrder(pendingNoticePayload.orderId, {
        noticePrint: { printedAt: new Date().toISOString(), content: payload.content, interviewForm: payload.interviewForm },
      });
      showSnackbar('告知書を印刷しました（モック）', 'success');
    }
    setNoticeOpen(false);
    setPendingNoticePayload(null);
    onClose();
  };

  const handleNoticeClose = () => {
    setNoticeOpen(false);
    setPendingNoticePayload(null);
    onClose();
  };

  const titleOptions = React.useMemo(() => {
    const opts: string[] = [];
    SUBTYPES.forEach((s) => OPERATIONS.forEach((op) => opts.push(`${s}${op}`)));
    return opts;
  }, []);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          隔離拘束指示
          {patient && (
            <Typography variant="body2" color="text.secondary">
              [{patient.patientNumber ?? patient.id}] {patient.name}（{patient.gender === 'M' ? '男' : '女'} {patient.age}歳）
            </Typography>
          )}
          {isEdit && <Chip label="編集" size="small" color="info" variant="outlined" sx={{ ml: 'auto' }} />}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            {errors.length > 0 && (
              <Alert severity="error" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                <Stack spacing={0.3}>
                  {errors.map((e, i) => <Typography key={i} variant="caption">{e}</Typography>)}
                </Stack>
              </Alert>
            )}

            <TextField
              select size="small" label="タイトル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            >
              {titleOptions.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>

            <Stack direction="row" spacing={1.5}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>移動先 病棟</InputLabel>
                <Select
                  label="移動先 病棟"
                  value={toWard}
                  onChange={(e) => { setToWard(e.target.value as WardId); setToRoom(''); setToBed(''); }}
                >
                  {(Object.keys(WARD_LABELS) as WardId[]).map((w) => (
                    <MenuItem key={w} value={w}>{WARD_LABELS[w]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>移動先 病室</InputLabel>
                <Select
                  label="移動先 病室"
                  value={toRoom}
                  onChange={(e) => { setToRoom(e.target.value); setToBed(''); }}
                >
                  {wardRooms.map((r) => (
                    <MenuItem key={r.roomNumber} value={r.roomNumber}>{r.roomNumber}号室</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }} disabled={!selectedRoom}>
                <InputLabel>移動先 ベッド</InputLabel>
                <Select
                  label="移動先 ベッド"
                  value={toBed}
                  onChange={(e) => setToBed(e.target.value)}
                >
                  {availableBeds.map((b) => (
                    <MenuItem key={b.bed} value={b.bed}>{b.bed}</MenuItem>
                  ))}
                  {availableBeds.length === 0 && (
                    <MenuItem value="" disabled>空きベッドなし</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Stack>

            {fields.hasStart && (
              <Stack spacing={1.5}>
                <TextField
                  size="small"
                  label="開始日時"
                  type="datetime-local"
                  value={startDatetime}
                  onChange={(e) => setStartDatetime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  size="small"
                  label="配膳先変更日時"
                  type="datetime-local"
                  value={mealChangeDatetime}
                  onChange={(e) => setMealChangeDatetime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
            )}
            {fields.hasEnd && (
              <TextField
                size="small"
                label="終了日時"
                type="datetime-local"
                value={endDatetime}
                onChange={(e) => setEndDatetime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            )}

            {fields.hasParts && (
              <Box>
                <Typography variant="caption" color="text.secondary">拘束部位（複数選択可）</Typography>
                <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 0.5 }}>
                  {MASTER_RESTRAINT_PARTS.map((p) => (
                    <Chip
                      key={p} label={p} size="small"
                      color={restraintParts.includes(p) ? 'primary' : 'default'}
                      variant={restraintParts.includes(p) ? 'filled' : 'outlined'}
                      onClick={() => toggleRestraintPart(p)}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <Divider />

            <FormControlLabel
              control={<Checkbox checked={printNotice} onChange={(e) => setPrintNotice(e.target.checked)} />}
              label={
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PrintIcon fontSize="small" />
                  <Typography variant="body2">告知書を印刷する（隔離拘束指示箋）</Typography>
                </Stack>
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!toRoom || !toBed}
          >
            {isEdit ? '更新' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>

      <RestraintNoticePrintDialog
        open={noticeOpen}
        onClose={handleNoticeClose}
        mode="new"
        orderDate={pendingNoticePayload?.orderDate ?? ''}
        startDatetime={pendingNoticePayload?.startDatetime ?? ''}
        initialContent=""
        onPrint={handleNoticePrint}
      />
    </>
  );
};

export default RestraintOrderDialog;
