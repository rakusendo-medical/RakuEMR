import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, Box, TextField, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Checkbox, Divider, Alert, Chip,
} from '@mui/material';
import { Search as SearchIcon, ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import type { Patient } from '../../types';
import {
  MEDICAL_INSTITUTIONS, REFERRAL_ROUTES_DISCHARGE_BASE, REFERRAL_ROUTES_DISCHARGE_OPTIONAL,
  DISCHARGE_DOCS_BY_CATEGORY, THERAPY_HISTORY_SAMPLES, PENDING_ORDERS_SAMPLES,
} from '../../data/mockData';
import type { DischargeCategory } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import OrderConfirmDialog from './OrderConfirmDialog';
import DeleteReasonDialog from './DeleteReasonDialog';
import MedicalInstitutionSearchDialog from './MedicalInstitutionSearchDialog';

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

/** 食事を伴うかどうかをモック判定（時間帯で判断） */
const hasMealOnDay = (dateTime: string): boolean => {
  const t = dateTime.split('T')[1] ?? '00:00';
  return t >= '08:00' && t <= '18:00';
};

const DischargeOrderDialog: React.FC<Props> = ({ open, patient, editingOrderId, onClose }) => {
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const optionalFeatures = useAppStore((s) => s.optionalFeatures);
  const addPendingOrder = useAppStore((s) => s.addPendingOrder);
  const appendMedicalRecord = useAppStore((s) => s.appendMedicalRecord);

  const [dischargeAt, setDischargeAt] = React.useState<string>(formatDateTimeNow());
  const [outcome, setOutcome] = React.useState<string>('治癒');
  const [mealEndAt, setMealEndAt] = React.useState<string>(formatDateTimeNow());
  const [originalMealEndAt, setOriginalMealEndAt] = React.useState<string>(formatDateTimeNow());
  const [memo, setMemo] = React.useState('');
  const [category, setCategory] = React.useState<DischargeCategory>('通院');
  const [docs, setDocs] = React.useState<Set<string>>(new Set());
  const [referralId, setReferralId] = React.useState<string>('');
  const [route, setRoute] = React.useState<string>('退院後通院なし');
  const [reason, setReason] = React.useState('');
  const [postCare, setPostCare] = React.useState('');
  const [karteNote, setKarteNote] = React.useState('');
  // 入院定時オーダ中止日設定（マスタ代替: モック切替）
  const [stopDayPolicy, setStopDayPolicy] = React.useState<'当日以降' | '翌日以降'>('翌日以降');
  const [printMealSheet, setPrintMealSheet] = React.useState(false);
  const [printMoveSheet, setPrintMoveSheet] = React.useState(false);

  const [orderConfirmOpen, setOrderConfirmOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [deleteReasonOpen, setDeleteReasonOpen] = React.useState(false);

  React.useEffect(() => {
    if (open && patient) {
      const init = formatDateTimeNow();
      setDischargeAt(init);
      setOutcome('治癒');
      setMealEndAt(init);
      setOriginalMealEndAt(init);
      setMemo('');
      setCategory('通院');
      setDocs(new Set(DISCHARGE_DOCS_BY_CATEGORY['通院']));
      const th = THERAPY_HISTORY_SAMPLES.find((t) => t.patientId === patient.id);
      setReferralId(th?.admitReferralId ?? '');
      setRoute(REFERRAL_ROUTES_DISCHARGE_BASE[3]); // 退院後他院通院
      setReason('');
      setPostCare('');
      setKarteNote('');
      setStopDayPolicy('翌日以降');
      setPrintMealSheet(false);
      setPrintMoveSheet(false);
      setOrderConfirmOpen(false);
      setSearchOpen(false);
      setDeleteReasonOpen(false);
    }
  }, [open, patient]);

  // 退院後診療区分が変わったら退院時文書を切替
  React.useEffect(() => {
    setDocs(new Set(DISCHARGE_DOCS_BY_CATEGORY[category]));
  }, [category]);

  // 退院日変更で食事終了日が自動連動
  React.useEffect(() => {
    setMealEndAt(dischargeAt);
    setOriginalMealEndAt(dischargeAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dischargeAt]);

  if (!patient) return null;

  const futureDate = new Date(dischargeAt) > new Date();
  const isOuting = patient.status === 'outing';
  const mealChanged = mealEndAt !== originalMealEndAt;
  const mealEditable = hasMealOnDay(dischargeAt);
  const pendingOrders = PENDING_ORDERS_SAMPLES.filter(
    (p) => p.patientId === patient.id && (p.category === '入院専用' || p.category === '移動' || p.category === '給食' || p.category === 'リハビリ'),
  );
  const referralName = referralId ? MEDICAL_INSTITUTIONS.find((m) => m.id === referralId)?.name ?? '' : '';

  const referralRoutes = optionalFeatures.medicalProtection
    ? [...REFERRAL_ROUTES_DISCHARGE_BASE, REFERRAL_ROUTES_DISCHARGE_OPTIONAL]
    : [...REFERRAL_ROUTES_DISCHARGE_BASE];

  const toggleDoc = (d: string) =>
    setDocs((s) => {
      const n = new Set(s);
      if (n.has(d)) n.delete(d);
      else n.add(d);
      return n;
    });

  const handleCopyFromTherapy = () => {
    const th = THERAPY_HISTORY_SAMPLES.find((t) => t.patientId === patient.id);
    const id = th?.admitReferralId ?? '';
    if (id) {
      setReferralId(id);
      showSnackbar(`治療歴から複写しました（${MEDICAL_INSTITUTIONS.find((m) => m.id === id)?.name}）`, 'info');
    } else {
      showSnackbar('治療歴に紹介元医療機関の登録がありません', 'warning');
    }
  };

  const handleRegisterOrder = () => {
    addPendingOrder({
      id: `OD-${Date.now()}`,
      type: '退院',
      patientId: patient.id,
      patientName: patient.name,
      scheduledDate: dischargeAt.split('T')[0],
      doctorName: patient.doctorName,
      wardId: patient.wardId,
      roomNumber: patient.roomNumber,
      bedLabel: patient.bedLabel,
    });
    showSnackbar(
      `退院指示を登録しました（${patient.name}）／ 入退院情報カレンダーに赤字（未確定）で表示されます`,
      'success',
    );
    onClose();
  };

  const startConfirmation = () => {
    if (futureDate) {
      showSnackbar('未来日時のため確定できません（指示登録は可能です）', 'warning');
      return;
    }
    if (isOuting) {
      showSnackbar('外出中の患者は退院確定できません（病床管理画面で帰院処理が必要）', 'warning');
      return;
    }
    if (pendingOrders.length > 0) {
      setOrderConfirmOpen(true);
    } else {
      finalizeDischarge();
    }
  };

  const finalizeDischarge = () => {
    const stopDayInfo = stopDayPolicy === '当日以降' ? '退院日当日' : '退院日翌日';
    // カルテ記事に「入退院記録」エントリを動的追加
    const now = new Date();
    const ymd = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    const ts = `${ymd} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    appendMedicalRecord(patient.id, {
      id: `MR-ORD-D-${Date.now()}`,
      date: ymd,
      dayOfWeek: ['日', '月', '火', '水', '木', '金', '土'][now.getDay()],
      category: '入退院記録',
      author: patient.doctorName,
      authorRole: '医師',
      content: `退院確定（指示発行同時） ／ ${dischargeAt.replace('T', ' ')} 退院 ／ 転帰: ${outcome}\n紹介先: ${referralName || '(未選択)'} ／ 紹介経路: ${route} ／ 入院定時オーダ中止日: ${stopDayInfo}\n退院決定理由: ${reason || '(未入力)'}`,
      tags: ['退院確定', category],
      timestamp: ts,
      likes: 0,
      comments: 0,
    });
    showSnackbar(
      `退院確定: ${patient.name} ／ 入院専用オーダ自動削除、入院定時オーダ中止日: ${stopDayInfo}${printMealSheet || printMoveSheet ? '（指示箋印刷あり）' : ''}`,
      'success',
    );
    onClose();
  };

  const handleOrderConfirmDone = () => {
    setOrderConfirmOpen(false);
    finalizeDischarge();
  };

  const handleDeleteConfirmed = () => {
    setDeleteReasonOpen(false);
    showSnackbar(`退院指示を中止しました（${patient.name}）`, 'info');
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          退院指示
          <Typography variant="caption" color="text.secondary" component="div">
            {patient.patientNumber ?? patient.id} {patient.name} ({patient.age}歳{patient.gender === 'M' ? '男性' : '女性'}) / 主治医 {patient.doctorName} / {patient.roomNumber}号室 {patient.bedLabel}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip label={editingOrderId ? '変更モード' : '新規'} size="small" color={editingOrderId ? 'info' : 'primary'} />
              {futureDate && <Chip label="未来日時（指示のみ可）" size="small" color="warning" />}
              {isOuting && <Chip label="外出中（確定不可）" size="small" color="error" />}
              {optionalFeatures.medicalProtection && <Chip label="医療観察法 ON" size="small" />}
            </Stack>

            {isOuting && (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                外出中の患者は退院確定できません。病床管理画面で帰院処理を実施してから確定してください。
              </Alert>
            )}

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
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>転帰</InputLabel>
                <Select label="転帰" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                  {['治癒', '軽快', '転院', '死亡', 'その他'].map((o) => (<MenuItem key={o} value={o}>{o}</MenuItem>))}
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
                食事終了日時 → 退院日時の間に「食無し」指示（マスタ切替で「臨時欠食」）を自動生成します。
              </Alert>
            )}

            <TextField size="small" label="備考" multiline rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} />

            <Stack direction="row" spacing={1.5} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>退院後診療区分</InputLabel>
                <Select label="退院後診療区分" value={category} onChange={(e) => setCategory(e.target.value as DischargeCategory)}>
                  <MenuItem value="不要">不要</MenuItem>
                  <MenuItem value="通院">通院</MenuItem>
                  <MenuItem value="転院">転院</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                区分は退院区分に反映: 不要→退院、通院→退院後通院、転院→退院後転院
              </Typography>
            </Stack>

            <Box>
              <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                退院時文書（区分「{category}」）
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                {DISCHARGE_DOCS_BY_CATEGORY[category].map((d) => (
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
                紹介先医療機関 / 紹介経路
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                <TextField
                  size="small"
                  label="紹介先医療機関"
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

            {/* 地域連携（逆紹介）オプションは不要のため削除 */}

            <TextField size="small" label="退院決定理由" multiline rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            <TextField size="small" label="退院後の診療" multiline rows={2} value={postCare} onChange={(e) => setPostCare(e.target.value)} />
            <TextField size="small" label="カルテ記載" multiline rows={2} value={karteNote} onChange={(e) => setKarteNote(e.target.value)} />

            <Divider />
            <Stack direction="row" spacing={1.5}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>入院定時オーダ中止日設定</InputLabel>
                <Select label="入院定時オーダ中止日設定" value={stopDayPolicy} onChange={(e) => setStopDayPolicy(e.target.value as '当日以降' | '翌日以降')}>
                  <MenuItem value="当日以降">当日以降（前日まで実施）</MenuItem>
                  <MenuItem value="翌日以降">翌日以降（退院日まで実施）</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                マスタ保守／医療機関情報／処方の中止日設定（モック切替）
              </Typography>
            </Stack>

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

      <MedicalInstitutionSearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(inst) => { setReferralId(inst.id); setSearchOpen(false); showSnackbar(`紹介先医療機関を選択: ${inst.name}`, 'info'); }}
      />

      <DeleteReasonDialog
        open={deleteReasonOpen}
        variant="discharge"
        onClose={() => setDeleteReasonOpen(false)}
        onConfirm={handleDeleteConfirmed}
      />
    </>
  );
};

export default DischargeOrderDialog;
