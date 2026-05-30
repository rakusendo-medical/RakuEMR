import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, TextField, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Checkbox, Alert, Chip, Grid, Divider,
} from '@mui/material';
import {
  EventAvailable as EventAvailableIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import type { AdmissionOrder, WardId } from '../../types';
import { ROOMS, PENDING_ORDERS_SAMPLES, patientNumberOf } from '../../data/mockData';
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

// 入院時文書 - 状態+作成医の各項目に紐づく
const ADMIT_DOCS = [
  { name: '告知・同意書', defaultChecked: true },
  { name: '入院診療計画書', defaultChecked: true },
  { name: 'テスト文書1', defaultChecked: false },
  { name: 'テスト文書2', defaultChecked: false },
];

const DOC_STATUS = ['未着手', '作成中', '作成済', '提出済'];
const DOCTORS = ['-', '医師 太郎', '医師 大吾', '医師 花子'];

const HOSPITALS = ['—', '〇〇医院', '△△クリニック', '□□総合病院'];

const MEAL_TIMINGS = ['朝', '昼', '夕'] as const;

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

// セクション見出し（DesignGuide 標準: Divider + subtitle2 でグループ分け）
const SectionHeading: React.FC<{ children: React.ReactNode; first?: boolean }> = ({ children, first }) => (
  <>
    {!first && <Divider sx={{ my: 2 }} />}
    <Typography variant="subtitle2" sx={{ mb: 1 }}>{children}</Typography>
  </>
);

// フォーム1項目（左ラベル caption + フィールド）
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Stack spacing={0.5}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    {children}
  </Stack>
);

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
  // 入院日(日付/時/分 を分離)
  const [admitDate, setAdmitDate] = React.useState<string>(initialAdmitAt.slice(0, 10));
  const [admitHour, setAdmitHour] = React.useState<string>(initialAdmitAt.slice(11, 13) || '11');
  const [admitMinute, setAdmitMinute] = React.useState<string>(initialAdmitAt.slice(14, 16) || '00');
  const admitAt = `${admitDate}T${admitHour}:${admitMinute}`;
  // 食事開始(日付/朝昼夕)
  const [mealDate, setMealDate] = React.useState<string>(initialAdmitAt.slice(0, 10));
  const [mealTiming, setMealTiming] = React.useState<typeof MEAL_TIMINGS[number]>('昼');
  const mealAt = `${mealDate}T${mealTiming === '朝' ? '07:00' : mealTiming === '昼' ? '12:00' : '18:00'}`;
  const [originalMealAt, setOriginalMealAt] = React.useState<string>(mealAt);
  const [toWard, setToWard] = React.useState<WardId>(order?.wardId ?? 'ward1');
  const [toRoom, setToRoom] = React.useState<string>(order && order.roomNumber !== '—' ? order.roomNumber : '');
  const [toBed, setToBed] = React.useState<string>(order && order.bedLabel !== '—' ? order.bedLabel : '');
  const [tentativeWard, setTentativeWard] = React.useState<boolean>(false);
  const [memo, setMemo] = React.useState('');
  // 入院時文書(各項目の状態+作成医)
  const [docs, setDocs] = React.useState<Record<string, { checked: boolean; status: string; doctor: string }>>(
    () => Object.fromEntries(ADMIT_DOCS.map((d) => [d.name, { checked: d.defaultChecked, status: '未着手', doctor: '-' }])),
  );
  const [hospital, setHospital] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [orderText, setOrderText] = React.useState('');
  const [orderDoctor, setOrderDoctor] = React.useState('-');
  const [article, setArticle] = React.useState('');
  const [printOrderSheet, setPrintOrderSheet] = React.useState(true);

  const [orderConfirmOpen, setOrderConfirmOpen] = React.useState(false);
  const [proxyAuthOpen, setProxyAuthOpen] = React.useState(false);
  const [pendingFinalize, setPendingFinalize] = React.useState(false);

  React.useEffect(() => {
    if (open && order) {
      const init = order.scheduledDate ? `${order.scheduledDate}T09:00` : formatDateTimeNow();
      setAdmitDate(init.slice(0, 10));
      setAdmitHour(init.slice(11, 13) || '11');
      setAdmitMinute(init.slice(14, 16) || '00');
      setMealDate(init.slice(0, 10));
      setMealTiming('昼');
      setOriginalMealAt(`${init.slice(0, 10)}T12:00`);
      setToWard(order.wardId);
      setToRoom(order.roomNumber !== '—' ? order.roomNumber : '');
      setToBed(order.bedLabel !== '—' ? order.bedLabel : '');
      setTentativeWard(false);
      setMemo('');
      setDocs(Object.fromEntries(ADMIT_DOCS.map((d) => [d.name, { checked: d.defaultChecked, status: '未着手', doctor: '-' }])));
      setHospital('');
      setReason('');
      setOrderText('');
      setOrderDoctor('-');
      setArticle('');
      setPrintOrderSheet(true);
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

  const toggleDoc = (name: string) =>
    setDocs((s) => ({ ...s, [name]: { ...s[name], checked: !s[name].checked } }));
  const updateDocField = (name: string, key: 'status' | 'doctor', value: string) =>
    setDocs((s) => ({ ...s, [name]: { ...s[name], [key]: value } }));

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
      `入院確定: ${order.patientName} ／ カルテ・医師指示簿に書込みました${printOrderSheet ? '(指示箋印刷あり)' : ''}`,
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
        <DialogTitle sx={{ pb: 0.5 }}>
          入院手続き
          <Typography variant="caption" color="text.secondary" component="div">
            {patientNumberOf(order.patientId)} {order.patientName} / 主治医 {order.doctorName}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {/* 状態 */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Chip label={order.status === '手続完了' ? '確定済' : '未確定'} size="small" color={order.status === '手続完了' ? 'success' : 'warning'} />
            <Chip label={`操作者: ${currentUserRole === 'doctor' ? '医師' : '事務'}`} size="small" />
            {futureDate && <Chip label="未来日時" size="small" color="error" />}
          </Stack>

          {/* 日時 */}
          <SectionHeading first>日時</SectionHeading>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6}>
              <Field label="入院日">
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small" type="date"
                    value={admitDate}
                    onChange={(e) => setAdmitDate(e.target.value)}
                    InputProps={{ endAdornment: <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} /> }}
                    sx={{ width: 170 }}
                  />
                  <FormControl size="small" sx={{ width: 70 }}>
                    <Select value={admitHour} onChange={(e) => setAdmitHour(e.target.value)}>
                      {HOURS.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <Typography>:</Typography>
                  <FormControl size="small" sx={{ width: 70 }}>
                    <Select value={admitMinute} onChange={(e) => setAdmitMinute(e.target.value)}>
                      {MINUTES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Stack>
              </Field>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Field label="食事開始日">
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small" type="date"
                    value={mealDate}
                    onChange={(e) => setMealDate(e.target.value)}
                    InputProps={{ endAdornment: <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} /> }}
                    sx={{ width: 170 }}
                  />
                  <FormControl size="small" sx={{ width: 80 }}>
                    <Select value={mealTiming} onChange={(e) => setMealTiming(e.target.value as typeof MEAL_TIMINGS[number])}>
                      {MEAL_TIMINGS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Stack>
              </Field>
            </Grid>
            <Grid item xs={12}>
              <Field label="食事内容">
                <TextField
                  size="small" fullWidth
                  value="朝: 普通食A 1800Kcal、昼: 普通食A 1800Kcal、…"
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', color: 'text.secondary' } }}
                />
              </Field>
            </Grid>
          </Grid>
          {mealAt > admitAt && (
            <Alert severity="info" sx={{ py: 0.5, mt: 1 }}>
              入院日時 → 食事開始日時の間に「食無し」指示(マスタ設定により「臨時欠食」)を自動生成します。
            </Alert>
          )}

          {/* 病室 */}
          <SectionHeading>病室</SectionHeading>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2">病棟</Typography>
            <FormControl size="small" sx={{ width: 130 }}>
              <Select value={toWard} onChange={(e) => { setToWard(e.target.value as WardId); setToRoom(''); setToBed(''); }}>
                <MenuItem value="ward1">第1病棟</MenuItem>
                <MenuItem value="ward2">第2病棟</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2">病室</Typography>
            <FormControl size="small" sx={{ width: 120 }} disabled={tentativeWard}>
              <Select value={toRoom} onChange={(e) => { setToRoom(e.target.value); setToBed(''); }}>
                {wardRooms.map((r) => (
                  <MenuItem key={r.roomNumber} value={r.roomNumber}>{r.roomNumber}号室</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2">ベッド</Typography>
            <FormControl size="small" sx={{ width: 140 }} disabled={!room || tentativeWard}>
              <Select value={toBed} onChange={(e) => setToBed(e.target.value)}>
                {availableBeds.map((b) => (
                  <MenuItem key={b.bed} value={b.bed}>{toRoom}号室 {b.bed}</MenuItem>
                ))}
                {availableBeds.length === 0 && <MenuItem value="" disabled>空きベッドなし</MenuItem>}
              </Select>
            </FormControl>
            <Button
              size="small" variant="outlined" color="primary"
              startIcon={<EventAvailableIcon />}
              onClick={onOpenVacancy}
            >
              空床照会
            </Button>
            <FormControlLabel
              control={<Checkbox size="small" checked={tentativeWard} onChange={(_, v) => setTentativeWard(v)} />}
              label={<Typography variant="caption">仮病棟のまま確定</Typography>}
            />
          </Stack>

          {/* メモ */}
          <SectionHeading>メモ</SectionHeading>
          <TextField fullWidth size="small" multiline minRows={3} value={memo} onChange={(e) => setMemo(e.target.value)} />

          {/* 入院時文書 */}
          <SectionHeading>入院時文書</SectionHeading>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              入院形態: [任意入院]
            </Typography>
            {ADMIT_DOCS.map((d) => {
              const state = docs[d.name];
              return (
                <Stack key={d.name} direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <FormControlLabel
                    control={<Checkbox size="small" checked={state.checked} onChange={() => toggleDoc(d.name)} />}
                    label={<Typography variant="body2">{d.name}</Typography>}
                    sx={{ minWidth: 200 }}
                  />
                  <Typography variant="caption" color="text.secondary">状態</Typography>
                  <FormControl size="small" sx={{ width: 110 }}>
                    <Select value={state.status} onChange={(e) => updateDocField(d.name, 'status', e.target.value)}>
                      {DOC_STATUS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary">作成医</Typography>
                  <FormControl size="small" sx={{ width: 130 }}>
                    <Select value={state.doctor} onChange={(e) => updateDocField(d.name, 'doctor', e.target.value)}>
                      {DOCTORS.map((doc) => <MenuItem key={doc} value={doc}>{doc}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Stack>
              );
            })}
          </Stack>

          {/* 紹介医療機関・入院決定の理由 */}
          <SectionHeading>紹介医療機関・入院決定の理由</SectionHeading>
          <Stack spacing={1.5}>
            <Field label="紹介医療機関">
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <TextField
                    size="small" sx={{ flex: 1, minWidth: 200 }}
                    value={hospital} onChange={(e) => setHospital(e.target.value)}
                  />
                  <Button size="small" variant="contained" color="primary">検索</Button>
                  <Button size="small" variant="outlined" color="primary">治療歴から複写</Button>
                  <Button size="small" variant="outlined" color="error">削除</Button>
                </Stack>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>選択リスト</InputLabel>
                  <Select label="選択リスト" value={hospital || '—'} onChange={(e) => setHospital(e.target.value === '—' ? '' : e.target.value)}>
                    {HOSPITALS.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                  </Select>
                </FormControl>
              </Stack>
            </Field>
            <Field label="入院決定の理由">
              <TextField fullWidth size="small" multiline minRows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
          </Stack>

          {/* 指示・記事 */}
          <SectionHeading>指示・記事</SectionHeading>
          <Stack spacing={1.5}>
            <Field label="指示内容(カルテ本文)">
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label="指示医" size="small" color="success" />
                  <FormControl size="small" sx={{ width: 160 }}>
                    <Select value={orderDoctor} onChange={(e) => setOrderDoctor(e.target.value)}>
                      {DOCTORS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Stack>
                <TextField fullWidth size="small" multiline minRows={3} value={orderText} onChange={(e) => setOrderText(e.target.value)} />
              </Stack>
            </Field>
            <Field label="入院確定時の記事">
              <TextField fullWidth size="small" value={article} onChange={(e) => setArticle(e.target.value)} />
            </Field>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
          <FormControlLabel
            control={<Checkbox size="small" checked={printOrderSheet} onChange={(_, v) => setPrintOrderSheet(v)} />}
            label={<Typography variant="body2">指示箋を印刷する</Typography>}
          />
          <Stack direction="row" spacing={1}>
            <Button variant="text" onClick={onClose}>戻る</Button>
            <Button variant="outlined" color="primary" onClick={handleUpdate}>
              更新
            </Button>
            <Button variant="contained" disabled={futureDate} onClick={startConfirmation}>
              入院確定
            </Button>
          </Stack>
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
