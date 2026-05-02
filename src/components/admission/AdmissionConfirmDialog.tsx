import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, Box, TextField, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Checkbox, Divider, Alert, Chip,
} from '@mui/material';
import { EventAvailable as EventAvailableIcon } from '@mui/icons-material';
import type { AdmissionOrder, WardId } from '../../types';
import { ROOMS, PENDING_ORDERS_SAMPLES } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import OrderConfirmDialog from './OrderConfirmDialog';
import ProxyAuthDialog from './ProxyAuthDialog';

interface Props {
  open: boolean;
  order: AdmissionOrder | null;
  onClose: () => void;
  onConfirmed: (orderId: string) => void;
  onOpenVacancy: () => void;
}

const ADMIT_DOCS = [
  '入院申込書', '同意書（治療）', '同意書（個人情報）', '保険証コピー', '入院案内書',
];

const HOSPITALS = ['—', '〇〇医院', '△△クリニック', '□□総合病院'];

const formatDateTimeNow = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const AdmissionConfirmDialog: React.FC<Props> = ({ open, order, onClose, onConfirmed, onOpenVacancy }) => {
  const currentUserRole = useAppStore((s) => s.currentUserRole);
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const confirmAdmission = useAppStore((s) => s.confirmAdmission);
  const appendMedicalRecord = useAppStore((s) => s.appendMedicalRecord);

  const initialAdmitAt = order?.scheduledDate ? `${order.scheduledDate}T09:00` : formatDateTimeNow();
  const [admitAt, setAdmitAt] = React.useState<string>(initialAdmitAt);
  const initialMealAt = initialAdmitAt;
  const [mealAt, setMealAt] = React.useState<string>(initialMealAt);
  const [originalMealAt, setOriginalMealAt] = React.useState<string>(initialMealAt);
  const [toWard, setToWard] = React.useState<WardId>(order?.wardId ?? 'ward1');
  const [toRoom, setToRoom] = React.useState<string>(order && order.roomNumber !== '—' ? order.roomNumber : '');
  const [toBed, setToBed] = React.useState<string>(order && order.bedLabel !== '—' ? order.bedLabel : '');
  const [tentativeWard, setTentativeWard] = React.useState<boolean>(false);
  const [memo, setMemo] = React.useState('');
  const [docs, setDocs] = React.useState<Set<string>>(new Set(ADMIT_DOCS.slice(0, 3)));
  const [hospital, setHospital] = React.useState('—');
  const [reason, setReason] = React.useState('');
  const [orderText, setOrderText] = React.useState('');
  const [article, setArticle] = React.useState('');
  const [printMealSheet, setPrintMealSheet] = React.useState(false);
  const [printMoveSheet, setPrintMoveSheet] = React.useState(false);

  const [orderConfirmOpen, setOrderConfirmOpen] = React.useState(false);
  const [proxyAuthOpen, setProxyAuthOpen] = React.useState(false);
  const [pendingFinalize, setPendingFinalize] = React.useState(false);

  React.useEffect(() => {
    if (open && order) {
      const init = order.scheduledDate ? `${order.scheduledDate}T09:00` : formatDateTimeNow();
      setAdmitAt(init);
      setMealAt(init);
      setOriginalMealAt(init);
      setToWard(order.wardId);
      setToRoom(order.roomNumber !== '—' ? order.roomNumber : '');
      setToBed(order.bedLabel !== '—' ? order.bedLabel : '');
      setTentativeWard(false);
      setMemo('');
      setDocs(new Set(ADMIT_DOCS.slice(0, 3)));
      setHospital('—');
      setReason('');
      setOrderText('');
      setArticle('');
      setPrintMealSheet(false);
      setPrintMoveSheet(false);
      setOrderConfirmOpen(false);
      setProxyAuthOpen(false);
      setPendingFinalize(false);
    }
  }, [open, order]);

  if (!order) return null;

  const wardRooms = ROOMS.filter((r) => r.wardId === toWard);
  const room = wardRooms.find((r) => r.roomNumber === toRoom);
  const availableBeds = room ? room.beds.filter((b) => !b.disabled && !b.patientId) : [];

  const futureDate = new Date(admitAt) > new Date();
  const mealChanged = mealAt !== originalMealAt;
  const pendingOrders = PENDING_ORDERS_SAMPLES.filter((p) => p.patientId === order.patientId && p.category === '外来専用');

  const toggleDoc = (d: string) =>
    setDocs((s) => {
      const n = new Set(s);
      if (n.has(d)) n.delete(d);
      else n.add(d);
      return n;
    });

  const startConfirmation = () => {
    if (futureDate) {
      showSnackbar('未来日時のため確定できません（更新は可能です）', 'warning');
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
    confirmAdmission(order.id);
    // カルテ記事に「入退院記録」エントリを動的追加
    const now = new Date();
    const ymd = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    const ts = `${ymd} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    appendMedicalRecord(order.patientId, {
      id: `MR-CONF-A-${order.id}-${Date.now()}`,
      date: ymd,
      dayOfWeek: ['日', '月', '火', '水', '木', '金', '土'][now.getDay()],
      category: '入退院記録',
      author: order.doctorName,
      authorRole: '医師',
      content: `入院確定 ／ ${admitAt.replace('T', ' ')} 入院 ／ 病室 ${tentativeWard ? '仮病棟' : `${toWard === 'ward1' ? '第１病棟' : '第２病棟'} ${toRoom}号室 ${toBed}`}\n紹介医療機関: ${hospital} ／ 入院決定理由: ${reason || '(未入力)'}`,
      tags: ['入院確定'],
      timestamp: ts,
      likes: 0,
      comments: 0,
    });
    onConfirmed(order.id);
    showSnackbar(
      `入院確定: ${order.patientName} ／ カルテ・医師指示簿に書込みました${printMealSheet || printMoveSheet ? '（指示箋印刷あり）' : ''}`,
      'success',
    );
    onClose();
  };

  const handleUpdate = () => {
    showSnackbar('入院手続きを更新しました（未確定）', 'info');
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
          入院手続き
          <Typography variant="caption" color="text.secondary" component="div">
            {order.patientId} {order.patientName} / 主治医 {order.doctorName}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip label={order.status === '手続完了' ? '確定済' : '未確定'} size="small" color={order.status === '手続完了' ? 'success' : 'warning'} />
              <Chip label={`操作者: ${currentUserRole === 'doctor' ? '医師' : '事務'}`} size="small" />
              {futureDate && <Chip label="未来日時" size="small" color="error" />}
            </Stack>

            <Stack direction="row" spacing={1.5}>
              <TextField
                size="small"
                label="入院日時"
                type="datetime-local"
                value={admitAt}
                onChange={(e) => setAdmitAt(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="食事開始日時"
                type="datetime-local"
                value={mealAt}
                onChange={(e) => setMealAt(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
            </Stack>
            {mealAt > admitAt && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                入院日時 → 食事開始日時の間に「食無し」指示（マスタ設定により「臨時欠食」）を自動生成します。
              </Alert>
            )}

            <Stack direction="row" spacing={1.5} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>病棟</InputLabel>
                <Select label="病棟" value={toWard} onChange={(e) => { setToWard(e.target.value as WardId); setToRoom(''); setToBed(''); }}>
                  <MenuItem value="ward1">第１病棟</MenuItem>
                  <MenuItem value="ward2">第２病棟</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }} disabled={tentativeWard}>
                <InputLabel>病室</InputLabel>
                <Select label="病室" value={toRoom} onChange={(e) => { setToRoom(e.target.value); setToBed(''); }}>
                  {wardRooms.map((r) => (
                    <MenuItem key={r.roomNumber} value={r.roomNumber}>{r.roomNumber}号室</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }} disabled={!room || tentativeWard}>
                <InputLabel>ベッド</InputLabel>
                <Select label="ベッド" value={toBed} onChange={(e) => setToBed(e.target.value)}>
                  {availableBeds.map((b) => (
                    <MenuItem key={b.bed} value={b.bed}>{b.bed}</MenuItem>
                  ))}
                  {availableBeds.length === 0 && <MenuItem value="" disabled>空きベッドなし</MenuItem>}
                </Select>
              </FormControl>
              <FormControlLabel
                control={<Checkbox checked={tentativeWard} onChange={(_, v) => setTentativeWard(v)} />}
                label="仮病棟のまま確定"
              />
              <Button size="small" variant="outlined" startIcon={<EventAvailableIcon />} onClick={onOpenVacancy}>
                空床照会
              </Button>
            </Stack>

            <TextField size="small" label="メモ" multiline rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} />

            <Box>
              <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                入院時文書（期限管理マスタ設定）
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                {ADMIT_DOCS.map((d) => (
                  <FormControlLabel
                    key={d}
                    control={<Checkbox checked={docs.has(d)} onChange={() => toggleDoc(d)} />}
                    label={d}
                  />
                ))}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1.5}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>紹介医療機関</InputLabel>
                <Select label="紹介医療機関" value={hospital} onChange={(e) => setHospital(e.target.value)}>
                  {HOSPITALS.map((h) => (<MenuItem key={h} value={h}>{h}</MenuItem>))}
                </Select>
              </FormControl>
              <TextField size="small" label="入院決定理由" value={reason} onChange={(e) => setReason(e.target.value)} sx={{ flex: 1 }} />
            </Stack>

            <TextField size="small" label="指示内容" multiline rows={2} value={orderText} onChange={(e) => setOrderText(e.target.value)} />
            <TextField size="small" label="入院確定時の記事" multiline rows={2} value={article} onChange={(e) => setArticle(e.target.value)} />

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
          <Button variant="contained" color="primary" disabled={futureDate} onClick={startConfirmation}>
            入院確定
          </Button>
        </DialogActions>
      </Dialog>

      <OrderConfirmDialog
        open={orderConfirmOpen}
        kind="admission"
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

export default AdmissionConfirmDialog;
