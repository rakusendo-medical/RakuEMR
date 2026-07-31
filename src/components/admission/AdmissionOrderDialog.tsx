import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, Box, TextField, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Checkbox, Divider, Alert, Chip,
} from '@mui/material';
import { EventAvailable as EventAvailableIcon, Search as SearchIcon, ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import type { Patient, WardId } from '../../types';
import {
  ROOMS, MEDICAL_INSTITUTIONS, REFERRAL_ROUTES_ADMIT_BASE, REFERRAL_ROUTES_ADMIT_OPTIONAL,
  ADMIT_FORM_TYPES, ADMIT_DOCS_BY_FORM, THERAPY_HISTORY_SAMPLES, PENDING_ORDERS_SAMPLES,
} from '../../data/mockData';
import type { AdmitFormType } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import OrderConfirmDialog from './OrderConfirmDialog';
import DeleteReasonDialog from './DeleteReasonDialog';
import MedicalInstitutionSearchDialog from './MedicalInstitutionSearchDialog';
import RelatedFeatureDialogs from '../wardMap/RelatedFeatureDialogs';

interface Props {
  open: boolean;
  patient: Patient | null;
  /** 既存指示の閲覧時のみ true（変更/中止ボタン表示） */
  editingOrderId?: string | null;
  onClose: () => void;
}

const formatDateTimeNow = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 食事時間帯（モック簡易セット。マスタの食事時間設定の代替） */
const MEAL_SLOTS = [
  { key: '0800', label: '朝食 (08:00)' },
  { key: '1200', label: '昼食 (12:00)' },
  { key: '1800', label: '夕食 (18:00)' },
];

const slotToHHMM = (key: string) => `${key.slice(0, 2)}:${key.slice(2)}`;

/** カルテ記事用の現在時刻スタンプ（YYYY/MM/DD・曜日・タイムスタンプ） */
const nowStamp = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ymd = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())}`;
  return {
    ymd,
    ts: `${ymd} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    dayOfWeek: ['日', '月', '火', '水', '木', '金', '土'][now.getDay()],
  };
};

const buildDateTime = (date: string, slotKey: string) => {
  const ds = date.split('T')[0];
  return `${ds}T${slotToHHMM(slotKey)}`;
};

const AdmissionOrderDialog: React.FC<Props> = ({ open, patient, editingOrderId, onClose }) => {
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const optionalFeatures = useAppStore((s) => s.optionalFeatures);
  const addPendingOrder = useAppStore((s) => s.addPendingOrder);
  const updatePendingOrder = useAppStore((s) => s.updatePendingOrder);
  const storePendingOrders = useAppStore((s) => s.pendingOrders);
  const removePendingOrder = useAppStore((s) => s.removePendingOrder);
  const confirmAdmission = useAppStore((s) => s.confirmAdmission);
  const appendMedicalRecord = useAppStore((s) => s.appendMedicalRecord);
  const appendMedicalRecordContent = useAppStore((s) => s.appendMedicalRecordContent);
  const cancelMedicalRecord = useAppStore((s) => s.cancelMedicalRecord);

  // 変更モード対象の指示（us-08: 更新・確定・中止は指示時のカルテ記事へ追記／取消する）
  const editingOrder = editingOrderId ? storePendingOrders.find((o) => o.id === editingOrderId) : undefined;

  const [admitAt, setAdmitAt] = React.useState<string>(formatDateTimeNow());
  const [mealSlot, setMealSlot] = React.useState<string>('0800');
  const [autoMealSlot, setAutoMealSlot] = React.useState<string>('0800');
  const [toWard, setToWard] = React.useState<WardId>(patient?.wardId ?? 'ward1');
  const [toRoom, setToRoom] = React.useState<string>('');
  const [toBed, setToBed] = React.useState<string>('');
  // 病室未定（病棟は必須・確定だが病室/ベッドは後で看護師が決める）。旧称「仮病棟」。
  const [roomUndecided, setRoomUndecided] = React.useState<boolean>(false);
  const [memo, setMemo] = React.useState('');
  const [admitForm, setAdmitForm] = React.useState<AdmitFormType>('任意入院');
  const [docs, setDocs] = React.useState<Set<string>>(new Set());
  const [referralId, setReferralId] = React.useState<string>('');
  const [route, setRoute] = React.useState<string>('直接入院');
  const [reason, setReason] = React.useState('');
  const [postCare, setPostCare] = React.useState('');
  const [orderText, setOrderText] = React.useState('');
  const [psychiatricAdmit, setPsychiatricAdmit] = React.useState<'有' | '無' | '不明'>('不明');
  const [printMealSheet, setPrintMealSheet] = React.useState(false);
  const [printMoveSheet, setPrintMoveSheet] = React.useState(false);

  const [orderConfirmOpen, setOrderConfirmOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [vacancyOpen, setVacancyOpen] = React.useState(false);
  const [deleteReasonOpen, setDeleteReasonOpen] = React.useState(false);

  React.useEffect(() => {
    if (open && patient) {
      // 変更モードでは登録済み指示の入院予定日を初期表示する（時刻は現在時刻。当日指示なら確定可能なまま）
      const editing = editingOrderId ? useAppStore.getState().pendingOrders.find((o) => o.id === editingOrderId) : undefined;
      const init = editing?.scheduledDate
        ? `${editing.scheduledDate}T${formatDateTimeNow().split('T')[1]}`
        : formatDateTimeNow();
      setAdmitAt(init);
      setMealSlot('0800');
      setAutoMealSlot('0800');
      // 変更モードでは登録済み指示の病棟・病室・ベッドを復元する（'—' は病室未定として扱う）。
      //   復元しないと [変更（更新）] 時にフォームの空値で病室情報が '—' に上書きされてしまう。
      //   ※ 入院形態・紹介経路等は PendingOrderEntry が保持しないため復元できず既定値に戻る（モック割り切り）
      const editWard = editing?.wardId ?? patient.wardId;
      const editRoom = editing && editing.roomNumber !== '—' ? editing.roomNumber : '';
      const editBed = editing && editing.bedLabel !== '—' ? editing.bedLabel : '';
      const editRoomBeds = ROOMS.find((r) => r.wardId === editWard && r.roomNumber === editRoom)?.beds ?? [];
      setToWard(editWard);
      setToRoom(editRoom);
      setToBed(editRoomBeds.some((b) => b.bed === editBed && !b.disabled && !b.patientId) ? editBed : '');
      setRoomUndecided(editing ? editing.roomNumber === '—' : false);
      setMemo('');
      setAdmitForm('任意入院');
      setDocs(new Set(ADMIT_DOCS_BY_FORM['任意入院'].slice(0, 3)));
      // 治療歴から複写の優先順: 直近退院の紹介医療機関 → 入院時の紹介元
      const th = THERAPY_HISTORY_SAMPLES.find((t) => t.patientId === patient.id);
      setReferralId(th?.lastDischargeReferralId ?? th?.admitReferralId ?? '');
      setRoute('直接入院');
      setReason('');
      setPostCare('');
      setOrderText('');
      setPsychiatricAdmit('不明');
      setPrintMealSheet(false);
      setPrintMoveSheet(false);
      setOrderConfirmOpen(false);
      setSearchOpen(false);
      setVacancyOpen(false);
      setDeleteReasonOpen(false);
    }
  }, [open, patient, editingOrderId]);

  // 入院形態が変わったら入院時文書チェックリストを差し替え
  React.useEffect(() => {
    setDocs(new Set(ADMIT_DOCS_BY_FORM[admitForm].slice(0, 2)));
  }, [admitForm]);

  // 入院日が変わったら自動食事開始時間帯を再設定（モック: 当日入院は次の利用可能スロット、翌日以降は朝食）
  React.useEffect(() => {
    if (!admitAt) return;
    const d = new Date(admitAt);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const isFuture = d > today;
    if (isFuture && !isToday) {
      setAutoMealSlot('0800');
      setMealSlot('0800');
      return;
    }
    // 当日の場合: 現在時刻以降の最初のスロット
    const hhmm = `${String(today.getHours()).padStart(2, '0')}${String(today.getMinutes()).padStart(2, '0')}`;
    const next = MEAL_SLOTS.find((s) => s.key > hhmm) ?? MEAL_SLOTS[MEAL_SLOTS.length - 1];
    setAutoMealSlot(next.key);
    setMealSlot(next.key);
  }, [admitAt]);

  if (!patient) return null;

  const wardRooms = ROOMS.filter((r) => r.wardId === toWard);
  const room = wardRooms.find((r) => r.roomNumber === toRoom);
  const availableBeds = room ? room.beds.filter((b) => !b.disabled && !b.patientId) : [];
  const futureDate = new Date(admitAt) > new Date();
  const todayHHMM = (() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  })();
  const admitIsToday = (() => {
    const d = new Date(admitAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  })();
  const mealChanged = mealSlot !== autoMealSlot;
  const mealEffectiveDateTime = buildDateTime(admitAt, mealSlot);
  const generatesNoMeal = mealEffectiveDateTime > admitAt;
  const pendingOrders = PENDING_ORDERS_SAMPLES.filter((p) => p.patientId === patient.id && p.category === '外来専用');

  const referralName = referralId ? MEDICAL_INSTITUTIONS.find((m) => m.id === referralId)?.name ?? '' : '';

  const referralRoutes = optionalFeatures.medicalProtection
    ? [...REFERRAL_ROUTES_ADMIT_BASE, REFERRAL_ROUTES_ADMIT_OPTIONAL]
    : [...REFERRAL_ROUTES_ADMIT_BASE];

  const toggleDoc = (d: string) =>
    setDocs((s) => {
      const n = new Set(s);
      if (n.has(d)) n.delete(d);
      else n.add(d);
      return n;
    });

  const handleCopyFromTherapy = () => {
    const th = THERAPY_HISTORY_SAMPLES.find((t) => t.patientId === patient.id);
    const id = th?.lastDischargeReferralId ?? th?.admitReferralId ?? '';
    if (id) {
      setReferralId(id);
      showSnackbar(`治療歴から複写しました（${MEDICAL_INSTITUTIONS.find((m) => m.id === id)?.name}）`, 'info');
    } else {
      showSnackbar('治療歴に紹介元医療機関の登録がありません', 'warning');
    }
  };

  const buildOrderEntry = () => ({
    id: `OD-${Date.now()}`,
    type: '入院' as const,
    patientId: patient.id,
    patientName: patient.name,
    scheduledDate: admitAt.split('T')[0],
    doctorName: patient.doctorName,
    wardId: toWard,
    roomNumber: roomUndecided || !toRoom ? '—' : toRoom,
    bedLabel: roomUndecided || !toBed ? '—' : toBed,
  });

  // us-08: 指示時のカルテ記事本文。病棟・病室は記載しない（指示が出た事実と指示内容のみ）。
  const buildOrderKarteBody = () =>
    `${admitAt.replace('T', ' ')} 入院予定 ／ 入院形態: ${admitForm} ／ 紹介元: ${referralName || '(未選択)'} ／ 紹介経路: ${route}\n入院決定理由: ${reason || '(未入力)'} ／ 指示内容: ${orderText || '(未入力)'}`;

  const handleRegisterOrder = () => {
    if (editingOrderId && editingOrder) {
      // us-08: 更新はカルテ記事を新規作成せず、指示時の記事へ追記する
      updatePendingOrder(editingOrderId, {
        scheduledDate: admitAt.split('T')[0],
        wardId: toWard,
        roomNumber: roomUndecided || !toRoom ? '—' : toRoom,
        bedLabel: roomUndecided || !toBed ? '—' : toBed,
      });
      if (editingOrder.karteRecordId) {
        appendMedicalRecordContent(
          patient.id,
          editingOrder.karteRecordId,
          `指示変更（${nowStamp().ts}）／ ${buildOrderKarteBody()}`,
        );
      }
      // 旧永続データ等で karteRecordId が無い場合は追記されないため、文言を分岐する
      showSnackbar(
        editingOrder.karteRecordId
          ? `入院指示を更新しました（${patient.name}）／ カルテ記事へ追記しました`
          : `入院指示を更新しました（${patient.name}）`,
        'success',
      );
      onClose();
      return;
    }
    const { ymd, ts, dayOfWeek } = nowStamp();
    const recordId = `MR-ORD-A-${Date.now()}`;
    appendMedicalRecord(patient.id, {
      id: recordId,
      date: ymd,
      dayOfWeek,
      category: '入退院記録',
      author: patient.doctorName,
      authorRole: '医師',
      content: `【入院指示】${buildOrderKarteBody()}`,
      tags: ['入院指示'],
      timestamp: ts,
      likes: 0,
      comments: 0,
    });
    addPendingOrder({ ...buildOrderEntry(), karteRecordId: recordId });
    showSnackbar(
      `入院指示を登録しました（${patient.name}）／ カルテ記事を作成しました ／ 入退院情報カレンダーに赤字（未確定）で表示されます`,
      'success',
    );
    onClose();
  };

  const startConfirmation = () => {
    if (futureDate) {
      showSnackbar('未来日時のため確定できません（指示登録は可能です）', 'warning');
      return;
    }
    if (pendingOrders.length > 0) {
      setOrderConfirmOpen(true);
    } else {
      finalizeAdmission();
    }
  };

  const finalizeAdmission = () => {
    const { ymd, ts, dayOfWeek } = nowStamp();
    if (editingOrderId && editingOrder?.karteRecordId) {
      // us-08: 指示段階の記事がある場合は同一記事へ確定内容を追記（新規記事は作成しない）
      appendMedicalRecordContent(
        patient.id,
        editingOrder.karteRecordId,
        `入院確定（${ts}）／ ${admitAt.replace('T', ' ')} 入院 ／ 入院形態: ${admitForm}`,
      );
    } else {
      // 指示なしで直接確定した場合はこのとき記事を作成する
      appendMedicalRecord(patient.id, {
        id: `MR-ORD-A-${Date.now()}`,
        date: ymd,
        dayOfWeek,
        category: '入退院記録',
        author: patient.doctorName,
        authorRole: '医師',
        content: `入院確定（指示発行同時） ／ ${admitAt.replace('T', ' ')} 入院 ／ 入院形態: ${admitForm}\n紹介元: ${referralName || '(未選択)'} ／ 紹介経路: ${route} ／ 入院決定理由: ${reason || '(未入力)'}`,
        tags: ['入院確定', admitForm],
        timestamp: ts,
        likes: 0,
        comments: 0,
      });
    }
    // 変更モードで確定した場合は、記事の有無に関わらず指示を確定扱いにして pendingOrders から除去する
    // （旧永続データで karteRecordId が無い指示でも確定漏れが起きないように、記事処理と分離している）
    if (editingOrderId && editingOrder) {
      confirmAdmission(editingOrderId);
    }
    showSnackbar(
      `入院確定: ${patient.name} ／ カルテ記事・医師指示簿・入院歴・治療歴に書込みました${printMealSheet || printMoveSheet ? '（指示箋印刷あり）' : ''}`,
      'success',
    );
    onClose();
  };

  const handleOrderConfirmDone = () => {
    setOrderConfirmOpen(false);
    finalizeAdmission();
  };

  // 引数型は DeleteReasonDialog の onConfirm 定義に合わせる（印刷フラグはモックのため未使用）
  const handleDeleteConfirmed = (params: {
    category: string;
    reason: string;
    printDeleteOrderSheet: boolean;
    printMoveDeleteSheet?: boolean;
    printMealDeleteSheet?: boolean;
  }) => {
    setDeleteReasonOpen(false);
    if (editingOrderId) {
      // us-08: 中止時はカルテ記事を削除せず、中止内容を追記した上で取消表示にする
      if (editingOrder?.karteRecordId) {
        appendMedicalRecordContent(
          patient.id,
          editingOrder.karteRecordId,
          `指示中止（${nowStamp().ts}）／ 分類: ${params.category} ／ 理由: ${params.reason || '(未入力)'}`,
        );
        cancelMedicalRecord(patient.id, editingOrder.karteRecordId);
      }
      removePendingOrder(editingOrderId);
    }
    showSnackbar(`入院指示を中止しました（${patient.name}）／ カルテ記事は取消表示で残ります`, 'info');
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          入院指示
          <Typography variant="caption" color="text.secondary" component="div">
            {patient.patientNumber ?? patient.id} {patient.name} ({patient.age}歳{patient.gender === 'M' ? '男性' : '女性'}) / 主治医 {patient.doctorName}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip label={editingOrderId ? '変更モード' : '新規'} size="small" color={editingOrderId ? 'info' : 'primary'} />
              {futureDate && <Chip label="未来日時（指示のみ可）" size="small" color="warning" />}
              {optionalFeatures.medicalProtection && <Chip label="医療観察法 ON" size="small" />}
              {optionalFeatures.psychiatricLink && <Chip label="精神科連携 ON" size="small" />}
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
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>食事開始 時間帯</InputLabel>
                <Select label="食事開始 時間帯" value={mealSlot} onChange={(e) => setMealSlot(e.target.value)}>
                  {MEAL_SLOTS.map((s) => {
                    const disabled = admitIsToday && s.key < todayHHMM;
                    return (
                      <MenuItem
                        key={s.key}
                        value={s.key}
                        disabled={disabled}
                        sx={disabled ? { color: '#b91c1c' } : undefined}
                      >
                        {s.label}{disabled ? '（過去時間帯）' : ''}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Stack>
            {generatesNoMeal && mealChanged && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                入院日時 → 食事開始日時の間に「食無し」指示（マスタ切替で「臨時欠食」）を自動生成します。
              </Alert>
            )}

            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* 病棟は必須（病棟未指定は不可）。空値を取れない Select で構造的に担保し、required で明示。 */}
              <FormControl size="small" required sx={{ minWidth: 140 }}>
                <InputLabel>病棟</InputLabel>
                <Select label="病棟" value={toWard} onChange={(e) => { setToWard(e.target.value as WardId); setToRoom(''); setToBed(''); }}>
                  <MenuItem value="ward1">第１病棟</MenuItem>
                  <MenuItem value="ward2">第２病棟</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }} disabled={roomUndecided}>
                <InputLabel>病室</InputLabel>
                <Select label="病室" value={toRoom} onChange={(e) => { setToRoom(e.target.value); setToBed(''); }}>
                  {wardRooms.map((r) => (<MenuItem key={r.roomNumber} value={r.roomNumber}>{r.roomNumber}号室</MenuItem>))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }} disabled={!room || roomUndecided}>
                <InputLabel>ベッド</InputLabel>
                <Select label="ベッド" value={toBed} onChange={(e) => setToBed(e.target.value)}>
                  {availableBeds.map((b) => (<MenuItem key={b.bed} value={b.bed}>{b.bed}</MenuItem>))}
                  {availableBeds.length === 0 && <MenuItem value="" disabled>空きベッドなし</MenuItem>}
                </Select>
              </FormControl>
              <FormControlLabel control={<Checkbox checked={roomUndecided} onChange={(_, v) => setRoomUndecided(v)} />} label="病室未定" />
              <Button size="small" variant="outlined" startIcon={<EventAvailableIcon />} onClick={() => setVacancyOpen(true)}>
                空床照会
              </Button>
            </Stack>

            <TextField size="small" label="備考" multiline rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} />

            <Stack direction="row" spacing={1.5}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>入院形態</InputLabel>
                <Select label="入院形態" value={admitForm} onChange={(e) => setAdmitForm(e.target.value as AdmitFormType)}>
                  {ADMIT_FORM_TYPES.map((f) => (<MenuItem key={f} value={f}>{f}</MenuItem>))}
                </Select>
              </FormControl>
              {optionalFeatures.psychiatricLink && (
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>精神科入院有無</InputLabel>
                  <Select label="精神科入院有無" value={psychiatricAdmit} onChange={(e) => setPsychiatricAdmit(e.target.value as '有' | '無' | '不明')}>
                    <MenuItem value="有">有</MenuItem>
                    <MenuItem value="無">無</MenuItem>
                    <MenuItem value="不明">不明</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Stack>

            <Box>
              <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                入院時文書（入院形態「{admitForm}」に紐づくチェック）
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                {ADMIT_DOCS_BY_FORM[admitForm].map((d) => (
                  <FormControlLabel
                    key={d}
                    control={<Checkbox checked={docs.has(d)} onChange={() => toggleDoc(d)} />}
                    label={d}
                  />
                ))}
              </Stack>
            </Box>

            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                紹介元医療機関 / 紹介経路
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                <TextField
                  size="small"
                  label="紹介元医療機関"
                  value={referralName}
                  InputProps={{ readOnly: true }}
                  sx={{ flex: 1, minWidth: 220 }}
                />
                <Button size="small" variant="outlined" startIcon={<SearchIcon />} onClick={() => setSearchOpen(true)}>検索</Button>
                <Button size="small" variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleCopyFromTherapy}>治療歴から複写</Button>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel>紹介経路</InputLabel>
                  <Select label="紹介経路" value={route} onChange={(e) => setRoute(e.target.value)}>
                    {referralRoutes.map((r) => (<MenuItem key={r} value={r}>{r}</MenuItem>))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            <TextField size="small" label="入院決定理由" multiline rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            <TextField size="small" label="入院後の診療" multiline rows={2} value={postCare} onChange={(e) => setPostCare(e.target.value)} />
            <TextField size="small" label="指示内容（カルテ記載）" multiline rows={2} value={orderText} onChange={(e) => setOrderText(e.target.value)} />

            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                指示箋印刷
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <FormControlLabel control={<Checkbox checked={printMealSheet} onChange={(_, v) => setPrintMealSheet(v)} />} label="食事指示箋" />
                <FormControlLabel control={<Checkbox checked={printMoveSheet} onChange={(_, v) => setPrintMoveSheet(v)} />} label="移動指示箋" />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          {editingOrderId && (
            <Button color="error" onClick={() => setDeleteReasonOpen(true)}>中止</Button>
          )}
          <Button onClick={handleRegisterOrder}>{editingOrderId ? '変更（更新）' : '指示'}</Button>
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

      <MedicalInstitutionSearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(inst) => { setReferralId(inst.id); setSearchOpen(false); showSnackbar(`紹介元医療機関を選択: ${inst.name}`, 'info'); }}
      />

      <DeleteReasonDialog
        open={deleteReasonOpen}
        variant="admit"
        onClose={() => setDeleteReasonOpen(false)}
        onConfirm={handleDeleteConfirmed}
      />

      <RelatedFeatureDialogs
        open={vacancyOpen}
        feature={vacancyOpen ? 'vacancy' : null}
        ward={toWard}
        onClose={() => setVacancyOpen(false)}
      />
    </>
  );
};

export default AdmissionOrderDialog;
