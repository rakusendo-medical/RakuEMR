import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box,
  TextField, Typography, FormControl, Select, MenuItem, FormControlLabel,
  Checkbox, Radio, RadioGroup, Divider, List, ListItemButton, ListItemText,
} from '@mui/material';
import type { Order, OrderType, Patient } from '../../types';
import { WARD_LABELS } from '../../types';
import {
  REHA_TREATMENTS, REHA_DIAGNOSES, OT_PURPOSES, OT_SYMPTOMS, OT_CAUTIONS,
  MED_REQUESTS, NUTRI_TOPICS, NUTRI_LABS, NUTRI_DIETS, NUTRI_ENERGY,
  NUTRI_PROTEIN, NUTRI_FAT, NUTRI_CARB, NUTRI_SALT,
  emptyRehaForm, rehaFormSummary, type RehaTreatment, type RehaForm,
} from '../../data/rehaMaster';
import { useAppStore } from '../../stores/useAppStore';
import ConfirmDiscardDialog from './ConfirmDiscardDialog';
import { todayStr } from './orderDate';

interface Props {
  open: boolean;
  orderType: OrderType; // 'リハビリ'
  patient: Patient;
  doctorName: string;
  onClose: () => void;
  onRegister: (order: Order) => void;
}

// 行ラベル（左見出し）の共通スタイル。
const labelCell = { width: 120, flexShrink: 0, bgcolor: '#eaf2fa', px: 1, py: 0.75, fontWeight: 600 } as const;

/**
 * ep-11 us-61: リハビリ（治療形態）オーダ。参考システム実機（リハビリオーダ画面）に準拠。
 * 上部に 作業療法／服薬指導／栄養指導 の 3 ボタン（初期＝作業療法）で入力内容が切替わる。
 * 左に過去の指示履歴（クリックで内容を復元）。[指示] で作成中のオーダへ積む。
 */
const RehaOrderDialog: React.FC<Props> = ({ open, orderType, patient, doctorName, onClose, onRegister }) => {
  const history = useAppStore((s) => s.rehaCompositions[patient.id]) ?? [];
  const addRehaComposition = useAppStore((s) => s.addRehaComposition);

  // 病棟・病室・身長・体重は患者情報から初期化。病名の下段は主病名（patient.diagnosis）を初期表示。
  const patientDefaults = React.useMemo(() => ({
    ward: patient.wardName ?? WARD_LABELS[patient.wardId] ?? '',
    room: patient.roomNumber ?? '',
    height: patient.height != null ? String(patient.height) : '',
    weight: patient.weight != null ? String(patient.weight) : '',
    diseaseName: patient.diagnosis ?? '',
  }), [patient]);

  const [form, setForm] = React.useState<RehaForm>(() => emptyRehaForm('作業療法', todayStr(), patientDefaults));
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  // 診断病名／病名の上段プルダウン選択値（[プレビュー] で下段編集欄へ転記する一時値）。
  const [dxPick, setDxPick] = React.useState('');
  const [pnPick, setPnPick] = React.useState(patient.diagnosis ?? '');
  // 上段プルダウンの候補（カルテ「診断名」相当のモック。主病名を先頭に）。
  const nameOptions = React.useMemo(
    () => Array.from(new Set([patient.diagnosis, ...REHA_DIAGNOSES].filter(Boolean) as string[])),
    [patient],
  );

  React.useEffect(() => {
    if (open) {
      setForm(emptyRehaForm('作業療法', todayStr(), patientDefaults));
      setDxPick(''); setPnPick(patient.diagnosis ?? ''); setConfirmDiscard(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // [プレビュー]: 上段選択値を下段編集欄へ転記（既に内容があれば読点で追記）。
  const preview = (pick: string, key: 'diagnosis' | 'diseaseName') => {
    if (!pick) return;
    setForm((f) => ({ ...f, [key]: f[key] ? `${f[key]}、${pick}` : pick }));
  };

  const set = <K extends keyof RehaForm>(k: K, v: RehaForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k: keyof RehaForm, v: string) =>
    setForm((f) => {
      const arr = f[k] as string[];
      return { ...f, [k]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });

  // 治療形態切替：共通項目（病棟/病室/身長/体重/診断病名/病名/指示日）は引き継ぐ。
  const switchTo = (t: RehaTreatment) =>
    setForm((f) => ({
      ...emptyRehaForm(t, f.orderDate, { ward: f.ward, room: f.room, height: f.height, weight: f.weight }),
      diagnosis: f.diagnosis, diseaseName: f.diseaseName,
    }));

  const dirty =
    form.otPurposes.length > 0 || form.otSymptoms.length > 0 || form.medRequests.length > 0 ||
    form.nutriTopics.length > 0 || form.diets.length > 0 || form.diagnosis !== '' || form.pharmacistNote !== '';
  const requestClose = () => { if (dirty) setConfirmDiscard(true); else onClose(); };

  // 指示日が入っていれば指示可能。
  const canRegister = form.orderDate !== '';

  const handleRegister = () => {
    if (!canRegister) return;
    addRehaComposition(patient.id, {
      id: `REHA-${Date.now()}`, treatment: form.treatment, registeredAt: form.orderDate, doctorName, form,
    });
    onRegister({
      id: `ORD-${Date.now()}`,
      patientId: patient.id, patientName: patient.name,
      type: orderType, content: rehaFormSummary(form), schedule: form.treatment,
      status: '指示済', startDate: form.orderDate, days: 0, doctorName,
    });
  };

  // 複数選択チェック行（オプション配列＋その他）。
  const checkRow = (
    label: string, options: string[], key: keyof RehaForm,
    otherKey?: keyof RehaForm, cols = 3,
  ) => (
    <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" sx={{ ...labelCell }}>{label}</Typography>
      <Box sx={{ flex: 1, p: 0.5, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, alignItems: 'start' }}>
        {options.map((o) => (
          <FormControlLabel key={o} sx={{ m: 0 }}
            control={<Checkbox size="small" sx={{ p: 0.25 }} checked={(form[key] as string[]).includes(o)}
              onChange={() => toggle(key, o)} inputProps={{ 'aria-label': `${label} ${o}` }} />}
            label={<Typography variant="body2">{o}</Typography>} />
        ))}
        {otherKey && (
          <Box sx={{ gridColumn: `1 / ${cols + 1}`, mt: 0.5 }}>
            <TextField size="small" fullWidth label="その他" value={form[otherKey] as string}
              onChange={(e) => set(otherKey, e.target.value as RehaForm[typeof otherKey])} />
          </Box>
        )}
      </Box>
    </Stack>
  );

  // ラジオボタン行（無/有 等の単一選択・必ずいずれか選択）。
  const radioRow = (label: string, options: string[], key: keyof RehaForm) => (
    <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" sx={{ ...labelCell }}>{label}</Typography>
      <Box sx={{ flex: 1, p: 0.5 }}>
        <RadioGroup row value={form[key] as string} onChange={(e) => set(key, e.target.value as RehaForm[typeof key])}>
          {options.map((o) => (
            <FormControlLabel key={o} value={o}
              control={<Radio size="small" inputProps={{ 'aria-label': `${label} ${o}` }} />}
              label={<Typography variant="body2">{o}</Typography>} />
          ))}
        </RadioGroup>
      </Box>
    </Stack>
  );

  // 単一選択（値チェック群）行。
  const radioValueRow = (label: string, options: string[], key: keyof RehaForm) => (
    <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" sx={{ ...labelCell }}>{label}</Typography>
      <Box sx={{ flex: 1, p: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {options.map((o) => (
          <FormControlLabel key={o} sx={{ m: 0, mr: 1 }}
            control={<Checkbox size="small" sx={{ p: 0.25 }} checked={form[key] === o}
              onChange={() => set(key, (form[key] === o ? '' : o) as RehaForm[typeof key])}
              inputProps={{ 'aria-label': `${label} ${o}` }} />}
            label={<Typography variant="body2">{o}</Typography>} />
        ))}
      </Box>
    </Stack>
  );

  return (
    <Dialog open={open} onClose={requestClose} maxWidth="lg" fullWidth PaperProps={{ sx: { height: '90vh' } }}>
      <DialogTitle sx={{ py: 1, bgcolor: '#2f6ca6', color: '#fff', fontSize: '1rem' }}>
        治療形態　{patient.patientNumber ?? patient.id}：{patient.name}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* 上部: 治療形態の切替ボタン（作業療法／服薬指導／栄養指導） */}
        <Stack direction="row" spacing={1} sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          {REHA_TREATMENTS.map((t) => (
            <Button key={t} size="small" variant={form.treatment === t ? 'contained' : 'outlined'}
              onClick={() => switchTo(t)}>{t}</Button>
          ))}
        </Stack>

        <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* 左: 履歴（新規＋過去の指示。クリックで復元） */}
          <Box sx={{ width: 200, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
            <Button fullWidth size="small" variant="outlined" sx={{ m: 1, width: 'auto' }}
              onClick={() => setForm(emptyRehaForm(form.treatment, todayStr(), patientDefaults))}>新規</Button>
            <Divider />
            {history.length === 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ p: 1.5, display: 'block' }}>履歴はありません</Typography>
            ) : (
              <List dense disablePadding>
                {history.map((h) => (
                  <ListItemButton key={h.id} divider onClick={() => setForm(h.form)}>
                    <ListItemText primary={h.treatment} secondary={`${h.registeredAt}　${h.doctorName}`}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: 'caption' }} />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>

          {/* 右: 選択中の治療形態の入力フォーム */}
          <Box sx={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ px: 1, py: 0.75, bgcolor: '#dce9f5' }}>{form.treatment}指示</Typography>

            {/* 共通項目（病棟・病室・身長・体重は患者情報から取得・初期表示） */}
            <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ ...labelCell }}>病棟</Typography>
              <Box sx={{ flex: 1, p: 0.5 }}><Typography variant="body2">{form.ward || '—'}</Typography></Box>
              <Typography variant="body2" sx={{ ...labelCell }}>病室</Typography>
              <Box sx={{ flex: 1, p: 0.5 }}><Typography variant="body2">{form.room || '—'}</Typography></Box>
            </Stack>
            <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ ...labelCell }}>身長</Typography>
              <Box sx={{ flex: 1, p: 0.5 }}>
                <TextField size="small" type="number" value={form.height} onChange={(e) => set('height', e.target.value)}
                  InputProps={{ endAdornment: <Typography variant="caption">cm</Typography> }} inputProps={{ 'aria-label': '身長' }} sx={{ width: 140 }} />
              </Box>
              <Typography variant="body2" sx={{ ...labelCell }}>体重</Typography>
              <Box sx={{ flex: 1, p: 0.5 }}>
                <TextField size="small" type="number" value={form.weight} onChange={(e) => set('weight', e.target.value)}
                  InputProps={{ endAdornment: <Typography variant="caption">kg</Typography> }} inputProps={{ 'aria-label': '体重' }} sx={{ width: 140 }} />
              </Box>
            </Stack>
            {/* 診断病名: 上段プルダウン（カルテ診断名）＋[プレビュー]で下段編集欄へ転記（マニュアル準拠） */}
            <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ ...labelCell }}>診断病名</Typography>
              <Box sx={{ flex: 1, p: 0.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <FormControl size="small" sx={{ minWidth: 260 }}>
                    <Select displayEmpty value={dxPick} onChange={(e) => setDxPick(e.target.value)}
                      inputProps={{ 'aria-label': '診断病名 選択' }}>
                      <MenuItem value=""><em>未選択</em></MenuItem>
                      {nameOptions.map((d) => (<MenuItem key={d} value={d}>{d}</MenuItem>))}
                    </Select>
                  </FormControl>
                  <Button size="small" variant="outlined" disabled={!dxPick}
                    onClick={() => preview(dxPick, 'diagnosis')}>プレビュー</Button>
                </Stack>
                <TextField size="small" fullWidth value={form.diagnosis} onChange={(e) => set('diagnosis', e.target.value)}
                  inputProps={{ 'aria-label': '診断病名', maxLength: 100 }} placeholder="全角100文字まで（直接入力可）" />
              </Box>
            </Stack>
            {/* 病名: 上段プルダウン（初期＝主病名）＋[プレビュー]。下段は主病名を初期表示。給食/リハビリ連携は病名を送信 */}
            <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ ...labelCell }}>病名</Typography>
              <Box sx={{ flex: 1, p: 0.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <FormControl size="small" sx={{ minWidth: 260 }}>
                    <Select displayEmpty value={pnPick} onChange={(e) => setPnPick(e.target.value)}
                      inputProps={{ 'aria-label': '病名 選択' }}>
                      <MenuItem value=""><em>未選択</em></MenuItem>
                      {nameOptions.map((d) => (<MenuItem key={d} value={d}>{d}</MenuItem>))}
                    </Select>
                  </FormControl>
                  <Button size="small" variant="outlined" disabled={!pnPick}
                    onClick={() => preview(pnPick, 'diseaseName')}>プレビュー</Button>
                </Stack>
                <TextField size="small" fullWidth value={form.diseaseName} onChange={(e) => set('diseaseName', e.target.value)}
                  inputProps={{ 'aria-label': '病名', maxLength: 100 }} placeholder="全角100文字まで（直接入力可）" />
              </Box>
            </Stack>
            <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" sx={{ ...labelCell }}>指示日</Typography>
              <Box sx={{ flex: 1, p: 0.5 }}>
                <TextField size="small" type="date" value={form.orderDate} onChange={(e) => set('orderDate', e.target.value)}
                  InputLabelProps={{ shrink: true }} inputProps={{ 'aria-label': '指示日' }} />
              </Box>
              <Typography variant="body2" sx={{ ...labelCell }}>通達先</Typography>
              <Box sx={{ flex: 1, p: 0.5 }}><Typography variant="body2">{form.destination}</Typography></Box>
            </Stack>

            {/* 作業療法 */}
            {form.treatment === '作業療法' && (
              <>
                {checkRow('依頼目的', OT_PURPOSES, 'otPurposes', 'otPurposeOther', 2)}
                {checkRow('主症状', OT_SYMPTOMS, 'otSymptoms', 'otSymptomOther', 3)}
                {checkRow('注意事項', OT_CAUTIONS, 'otCautions', 'otCautionOther', 3)}
                {radioRow('自殺企図歴', ['無', '有'], 'suicideHistory')}
                {radioRow('希死念慮', ['無', '有'], 'deathWish')}
              </>
            )}

            {/* 服薬指導 */}
            {form.treatment === '服薬指導' && (
              <>
                {checkRow('依頼内容', MED_REQUESTS, 'medRequests', 'medRequestOther', 1)}
                <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ ...labelCell }}>薬剤師に伝えて<br />おきたい事項</Typography>
                  <Box sx={{ flex: 1, p: 0.5 }}>
                    <TextField size="small" fullWidth multiline minRows={2} value={form.pharmacistNote}
                      onChange={(e) => set('pharmacistNote', e.target.value)} inputProps={{ 'aria-label': '薬剤師に伝えておきたい事項' }} />
                  </Box>
                </Stack>
              </>
            )}

            {/* 栄養指導 */}
            {form.treatment === '栄養指導' && (
              <>
                {checkRow('指導内容', NUTRI_TOPICS, 'nutriTopics', 'nutriFreeComment', 2)}
                <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ ...labelCell }}>BMI測定日</Typography>
                  <Box sx={{ flex: 1, p: 0.5 }}>
                    <TextField size="small" type="date" value={form.bmiDate} onChange={(e) => set('bmiDate', e.target.value)}
                      InputLabelProps={{ shrink: true }} inputProps={{ 'aria-label': 'BMI測定日' }} />
                  </Box>
                </Stack>
                <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ ...labelCell }}>検査結果</Typography>
                  <Box sx={{ flex: 1, p: 0.5, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5 }}>
                    {NUTRI_LABS.map((lab) => (
                      <Stack key={lab} direction="row" alignItems="center" spacing={0.5}>
                        <Checkbox size="small" sx={{ p: 0.25 }} checked={form.labChecked.includes(lab)}
                          onChange={() => toggle('labChecked', lab)} inputProps={{ 'aria-label': `検査 ${lab}` }} />
                        <Typography variant="body2" sx={{ width: 84 }}>{lab}</Typography>
                        <TextField size="small" variant="standard" value={form.labValues[lab] ?? ''}
                          onChange={(e) => set('labValues', { ...form.labValues, [lab]: e.target.value })}
                          inputProps={{ 'aria-label': `検査値 ${lab}` }} sx={{ width: 64 }} />
                      </Stack>
                    ))}
                  </Box>
                </Stack>
                {checkRow('指示食種', NUTRI_DIETS, 'diets', undefined, 3)}
                {radioValueRow('エネルギー', NUTRI_ENERGY, 'energy')}
                {radioValueRow('蛋白質', NUTRI_PROTEIN, 'protein')}
                {radioValueRow('脂質', NUTRI_FAT, 'fat')}
                {radioValueRow('炭水化物', NUTRI_CARB, 'carb')}
                {radioValueRow('塩分', NUTRI_SALT, 'salt')}
                <Stack direction="row" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ ...labelCell }}>指示栄養量<br />（水分）</Typography>
                  <Box sx={{ flex: 1, p: 0.5 }}>
                    <RadioGroup row value={form.waterKind} onChange={(e) => set('waterKind', e.target.value as RehaForm['waterKind'])}>
                      <FormControlLabel value="なし" control={<Radio size="small" />} label={<Typography variant="body2">なし</Typography>} />
                      <FormControlLabel value="あり" control={<Radio size="small" />} label={<Typography variant="body2">あり</Typography>} />
                    </RadioGroup>
                    {form.waterKind === 'あり' && (
                      <TextField size="small" type="number" value={form.water} onChange={(e) => set('water', e.target.value)}
                        InputProps={{ endAdornment: <Typography variant="caption">ml</Typography> }} inputProps={{ 'aria-label': '水分' }} sx={{ width: 140 }} />
                    )}
                  </Box>
                </Stack>
              </>
            )}

            <Box sx={{ px: 1, py: 0.75 }}>
              <Typography variant="caption" color="text.secondary">担当医: {doctorName}（ログイン医師）</Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={requestClose}>閉じる</Button>
        <Button variant="contained" onClick={handleRegister} disabled={!canRegister}>指示</Button>
      </DialogActions>

      <ConfirmDiscardDialog
        open={confirmDiscard}
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => { setConfirmDiscard(false); onClose(); }}
      />
    </Dialog>
  );
};

export default RehaOrderDialog;
