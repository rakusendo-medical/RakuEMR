import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, Box, TextField, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Checkbox, Divider, Alert, Chip,
} from '@mui/material';
import type { AdmissionOrder } from '../../types';
import { PENDING_ORDERS_SAMPLES, patientNumberOf, PATIENTS, bedFlagsOf, absenceLabel, isAbsent } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import OrderConfirmDialog from './OrderConfirmDialog';
import ProxyAuthDialog from './ProxyAuthDialog';

interface Props {
  open: boolean;
  order: AdmissionOrder | null;
  onClose: () => void;
  onConfirmed: (orderId: string) => void;
}

// 退院時文書は現時点では電子カルテで取り扱わないため削除（2026-08-17）。

const HOSPITALS = ['—', '〇〇医院', '△△クリニック', '□□総合病院'];
const OUTCOMES = ['治癒', '軽快', '転院', '死亡', '中止'];

const formatDateTime = (date: string, hh = '10', mm = '00') => `${date}T${hh}:${mm}`;

const formatDateTimeNow = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 食事を伴うかどうかをモック判定（モックでは時間帯で判断） */
const hasMealOnDay = (dateTime: string): boolean => {
  const t = dateTime.split('T')[1] ?? '00:00';
  // 8:00-18:00 の間のみ食事を伴うとみなす（モック簡易判定）
  return t >= '08:00' && t <= '18:00';
};

const DischargeConfirmDialog: React.FC<Props> = ({ open, order, onClose, onConfirmed }) => {
  const currentUserRole = useAppStore((s) => s.currentUserRole);
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const confirmDischarge = useAppStore((s) => s.confirmDischarge);
  const appendMedicalRecord = useAppStore((s) => s.appendMedicalRecord);
  const appendMedicalRecordContent = useAppStore((s) => s.appendMedicalRecordContent);

  const initialDischarge = order?.scheduledDate ? formatDateTime(order.scheduledDate, '10') : formatDateTimeNow();
  const [dischargeAt, setDischargeAt] = React.useState<string>(initialDischarge);
  const [mealEndAt, setMealEndAt] = React.useState<string>(initialDischarge);
  const [originalMealEndAt, setOriginalMealEndAt] = React.useState<string>(initialDischarge);
  const [outcome, setOutcome] = React.useState<string>('治癒');
  const [memo, setMemo] = React.useState('');
  const [hospital, setHospital] = React.useState('—');
  const [reason, setReason] = React.useState('');
  const [orderText, setOrderText] = React.useState('');
  const [article, setArticle] = React.useState('');
  const [returnTo, setReturnTo] = React.useState('自宅');
  const [printMealSheet, setPrintMealSheet] = React.useState(false);
  const [printMoveSheet, setPrintMoveSheet] = React.useState(false);

  const [orderConfirmOpen, setOrderConfirmOpen] = React.useState(false);
  const [proxyAuthOpen, setProxyAuthOpen] = React.useState(false);
  const [pendingFinalize, setPendingFinalize] = React.useState(false);

  React.useEffect(() => {
    if (open && order) {
      const init = order.scheduledDate ? formatDateTime(order.scheduledDate, '10') : formatDateTimeNow();
      setDischargeAt(init);
      setMealEndAt(init);
      setOriginalMealEndAt(init);
      setOutcome('治癒');
      setMemo('');
      setHospital('—');
      setReason('');
      setOrderText('');
      setArticle('');
      setReturnTo('自宅');
      setPrintMealSheet(false);
      setPrintMoveSheet(false);
      setOrderConfirmOpen(false);
      setProxyAuthOpen(false);
      setPendingFinalize(false);
    }
  }, [open, order]);

  // 退院日変更時、食事時間設定（モック: 退院日と同じ時刻）に従って食事終了日を自動連動
  React.useEffect(() => {
    if (!open) return;
    setMealEndAt(dischargeAt);
    setOriginalMealEndAt(dischargeAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dischargeAt]);

  if (!order) return null;

  const futureDate = new Date(dischargeAt) > new Date();
  // 不在（外出／外泊）中は退院確定不可。判定は②バッジ＝ベッド由来 flags（isAbsent(bedFlagsOf)）。
  // 退院指示ダイアログ（DischargeOrderDialog）と同じガードを、病棟マップ操作メニュー起点のこちらにも適用する。
  const patient = PATIENTS.find((p) => p.id === order.patientId);
  const bedFlags = patient ? bedFlagsOf(patient) : [];
  const isOuting = isAbsent(bedFlags);
  const absLabel = absenceLabel(bedFlags);
  const mealChanged = mealEndAt !== originalMealEndAt;
  const mealEditable = hasMealOnDay(dischargeAt);
  const pendingOrders = PENDING_ORDERS_SAMPLES.filter(
    (p) => p.patientId === order.patientId && (p.category === '入院専用' || p.category === '移動' || p.category === '給食' || p.category === 'リハビリ'),
  );

  const startConfirmation = () => {
    if (futureDate) {
      showSnackbar('未来日時のため確定できません（更新は可能です）', 'warning');
      return;
    }
    if (isOuting) {
      showSnackbar(`${absLabel}の患者は退院確定できません（病床管理画面で帰院処理が必要）`, 'warning');
      return;
    }
    if (pendingOrders.length > 0) {
      setOrderConfirmOpen(true);
    } else {
      checkProxyAndFinalize(false);
    }
  };

  const checkProxyAndFinalize = (cancelingOrders: boolean) => {
    if (mealChanged && currentUserRole !== 'doctor' && cancelingOrders) {
      setProxyAuthOpen(true);
      setPendingFinalize(true);
    } else {
      finalize();
    }
  };

  const finalize = () => {
    confirmDischarge(order.id);
    const now = new Date();
    const ymd = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    const ts = `${ymd} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (order.karteRecordId) {
      // us-09: 指示段階の記事がある場合は同一記事へ確定内容を追記（新規記事は作成しない・病棟・病室は記載しない）
      appendMedicalRecordContent(
        order.patientId,
        order.karteRecordId,
        `退院確定（${ts}）／ ${dischargeAt.replace('T', ' ')} 退院 ／ 転帰: ${outcome}`,
      );
    } else {
      // カルテ記事に「入退院記録」エントリを動的追加
      appendMedicalRecord(order.patientId, {
        id: `MR-CONF-D-${order.id}-${Date.now()}`,
        date: ymd,
        dayOfWeek: ['日', '月', '火', '水', '木', '金', '土'][now.getDay()],
        category: '入退院記録',
        author: order.doctorName,
        authorRole: '医師',
        content: `退院確定 ／ ${dischargeAt.replace('T', ' ')} 退院 ／ 転帰: ${outcome} ／ 帰住先: ${returnTo}\n紹介医療機関: ${hospital} ／ 退院決定理由: ${reason || '(未入力)'}`,
        tags: ['退院確定'],
        timestamp: ts,
        likes: 0,
        comments: 0,
      });
    }
    onConfirmed(order.id);
    showSnackbar(
      `退院確定: ${order.patientName} ／ 未実施の移動・給食オーダを削除しました`,
      'success',
    );
    onClose();
  };

  const handleUpdate = () => {
    showSnackbar('退院手続きを更新しました（未確定）', 'info');
    onClose();
  };

  const handleOrderConfirmDone = (cancelIds: string[]) => {
    setOrderConfirmOpen(false);
    checkProxyAndFinalize(cancelIds.length > 0);
  };

  const handleProxyConfirmed = (proxyDoctor: string) => {
    setProxyAuthOpen(false);
    showSnackbar(`代行依頼医: ${proxyDoctor} で登録しました`, 'info');
    if (pendingFinalize) {
      setPendingFinalize(false);
      finalize();
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          退院手続き
          <Typography variant="caption" color="text.secondary" component="div">
            {patientNumberOf(order.patientId)} {order.patientName} / 主治医 {order.doctorName} / {order.roomNumber}号室 {order.bedLabel}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip label={order.status === '手続完了' ? '確定済' : '未確定'} size="small" color={order.status === '手続完了' ? 'success' : 'warning'} />
              <Chip label={`操作者: ${currentUserRole === 'doctor' ? '医師' : '事務'}`} size="small" />
              {futureDate && <Chip label="未来日時" size="small" color="error" />}
              {isOuting && <Chip label={`${absLabel}（確定不可）`} size="small" color="error" />}
            </Stack>

            <Stack direction="row" spacing={1.5}>
              <TextField
                size="small"
                label="退院日時"
                type="datetime-local"
                value={dischargeAt}
                onChange={(e) => setDischargeAt(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>転帰</InputLabel>
                <Select label="転帰" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                  {OUTCOMES.map((o) => (<MenuItem key={o} value={o}>{o}</MenuItem>))}
                </Select>
              </FormControl>
            </Stack>

            <TextField
              size="small"
              label="食事終了日時"
              type="datetime-local"
              value={mealEndAt}
              onChange={(e) => setMealEndAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!mealEditable}
              helperText={!mealEditable ? '食事を伴わない退院日のため編集不可です' : '退院日時より前にすると、その間に「食無し」指示が自動生成されます'}
            />
            {mealChanged && mealEndAt < dischargeAt && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                食事終了日時 → 退院日時の間に「食無し」指示（マスタ設定により「臨時欠食」）を自動生成します。
              </Alert>
            )}

            <TextField size="small" label="メモ" multiline rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} />

            {/* 退院時文書は現時点では電子カルテで取り扱わないため削除（2026-08-17） */}

            <Stack direction="row" spacing={1.5}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>紹介医療機関</InputLabel>
                <Select label="紹介医療機関" value={hospital} onChange={(e) => setHospital(e.target.value)}>
                  {HOSPITALS.map((h) => (<MenuItem key={h} value={h}>{h}</MenuItem>))}
                </Select>
              </FormControl>
              <TextField size="small" label="退院決定理由" value={reason} onChange={(e) => setReason(e.target.value)} sx={{ flex: 1 }} />
            </Stack>

            <TextField size="small" label="指示内容" multiline rows={2} value={orderText} onChange={(e) => setOrderText(e.target.value)} />
            <TextField size="small" label="退院確定時の記事" multiline rows={2} value={article} onChange={(e) => setArticle(e.target.value)} />
            <TextField size="small" label="帰住先" value={returnTo} onChange={(e) => setReturnTo(e.target.value)} />

            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                指示箋印刷
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <FormControlLabel control={<Checkbox checked={printMealSheet} onChange={(_, v) => setPrintMealSheet(v)} />} label="食事箋" />
                <FormControlLabel control={<Checkbox checked={printMoveSheet} onChange={(_, v) => setPrintMoveSheet(v)} />} label="移動箋" />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button onClick={handleUpdate}>更新</Button>
          <Button variant="contained" color="primary" disabled={futureDate || isOuting} onClick={startConfirmation}>
            退院確定
          </Button>
        </DialogActions>
      </Dialog>

      <OrderConfirmDialog
        open={orderConfirmOpen}
        kind="discharge"
        orders={pendingOrders}
        onClose={() => setOrderConfirmOpen(false)}
        onConfirm={handleOrderConfirmDone}
      />

      <ProxyAuthDialog
        open={proxyAuthOpen}
        onClose={() => { setProxyAuthOpen(false); setPendingFinalize(false); }}
        onConfirm={handleProxyConfirmed}
      />
    </>
  );
};

export default DischargeConfirmDialog;
