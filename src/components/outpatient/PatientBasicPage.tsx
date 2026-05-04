import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, Chip, Container, Divider, Grid, IconButton, Paper, Stack,
  TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Close as CloseIcon,
  WarningAmberOutlined as WarningIcon,
  CoronavirusOutlined as CoronavirusIcon,
  HealingOutlined as HealingIcon,
  PsychologyOutlined as PsychologyIcon,
  StickyNote2Outlined as StickyNote2Icon,
  Payments as PaymentsIcon,
} from '@mui/icons-material';
import { OUTPATIENT_VISITS, allergyInfo } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';

/**
 * 患者基本情報（v1.1 デザインルール準拠）
 *
 * ルール参照: docs/design-rules.md
 * - §1.1 maxWidth="lg"（フォーム中心）
 * - §1.3 Paper variant="outlined" + SectionHeader
 * - §3.2 アクションバー右寄せ（Cancel → Primary）
 * - §10 破壊的操作（離脱時の未保存確認ダイアログ）
 *
 * 仕様参照: docs/gairai/features/patient.html § 患者基本情報
 * - 主訴・アレルギー・感染症・既往・状態・その他のセクション構成
 * - SelectToggleButton: なし/あり/不明 + 詳細 TextField パターンの再利用
 */

type TriState = 'none' | 'yes' | 'unknown';

const TRI_STATES: { value: TriState; label: string; color: 'default' | 'warning' | 'info' }[] = [
  { value: 'none',    label: 'なし', color: 'default' },
  { value: 'yes',     label: 'あり', color: 'warning' },
  { value: 'unknown', label: '不明', color: 'info' },
];

interface BasicForm {
  chiefComplaint: string;
  allergyState: TriState;
  allergyDetail: string;
  drugTaboo: string[];
  foodAllergy: string[];
  infectionState: TriState;
  infectionDetail: string;
  hepatitisState: TriState;
  hepatitisDetail: string;
  syphilisState: TriState;
  syphilisDetail: string;
  hivState: TriState;
  hivDetail: string;
  otherDeptDrugState: TriState;
  otherDeptDrugDetail: string;
  asthmaState: TriState;
  asthmaDetail: string;
  otherNoteState: TriState;
  otherNoteDetail: string;
  interview: string;
  lactationState: TriState;
  pregnancyState: TriState;
  frailtyState: TriState;
  religion: string;
  memo: string;
  depositManaged: TriState;
  depositMemo: string;
}

const INITIAL_FORM: BasicForm = {
  chiefComplaint: '不眠と倦怠感の訴え',
  allergyState: 'yes',
  allergyDetail: allergyInfo.drug.join('、'),
  drugTaboo: ['ペニシリン系'],
  foodAllergy: allergyInfo.food.slice(),
  infectionState: 'none',
  infectionDetail: '',
  hepatitisState: 'none',
  hepatitisDetail: '',
  syphilisState: 'none',
  syphilisDetail: '',
  hivState: 'none',
  hivDetail: '',
  otherDeptDrugState: 'unknown',
  otherDeptDrugDetail: '',
  asthmaState: 'none',
  asthmaDetail: '',
  otherNoteState: 'none',
  otherNoteDetail: '',
  interview: '',
  lactationState: 'none',
  pregnancyState: 'none',
  frailtyState: 'none',
  religion: '',
  memo: '',
  depositManaged: 'none',
  depositMemo: '',
};

// ===== サブコンポーネント =====

const SectionHeader: React.FC<{
  title: string;
  icon?: React.ReactElement;
  description?: string;
}> = ({ title, icon, description }) => (
  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
    {icon && <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>}
    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
    {description && (
      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
        {description}
      </Typography>
    )}
  </Stack>
);

/** なし/あり/不明 + 詳細 TextField の複合フィールド */
const TriStateField: React.FC<{
  label: string;
  state: TriState;
  detail: string;
  onStateChange: (s: TriState) => void;
  onDetailChange: (d: string) => void;
  detailPlaceholder?: string;
}> = ({ label, state, detail, onStateChange, onDetailChange, detailPlaceholder }) => (
  <Stack spacing={1}>
    <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
      <Typography variant="body2" sx={{ width: 110, flexShrink: 0, fontWeight: 600 }}>
        {label}
      </Typography>
      <ToggleButtonGroup
        value={state}
        exclusive
        size="small"
        onChange={(_, v) => v && onStateChange(v)}
      >
        {TRI_STATES.map((s) => (
          <ToggleButton key={s.value} value={s.value} sx={{ px: 1.5, py: 0.25 }}>
            {s.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
    {state === 'yes' && (
      <TextField
        size="small"
        fullWidth
        multiline
        minRows={1}
        maxRows={3}
        placeholder={detailPlaceholder ?? '詳細を入力'}
        value={detail}
        onChange={(e) => onDetailChange(e.target.value)}
      />
    )}
  </Stack>
);

/** Chip 入力（Tab/Enter で追加、× で削除） */
const ChipInput: React.FC<{
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}> = ({ label, values, onChange, placeholder }) => {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (values.includes(v)) return;
    onChange([...values, v]);
    setDraft('');
  };
  const remove = (v: string) => onChange(values.filter((x) => x !== v));
  return (
    <Stack spacing={1}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {values.map((v) => (
          <Chip
            key={v}
            label={v}
            size="small"
            onDelete={() => remove(v)}
            deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
          />
        ))}
        {values.length === 0 && (
          <Typography variant="caption" color="text.disabled">未登録</Typography>
        )}
      </Stack>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          fullWidth
          placeholder={placeholder ?? '入力して「追加」'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={add}>
          追加
        </Button>
      </Stack>
    </Stack>
  );
};

// ===== メインコンポーネント =====

const PatientBasicPage: React.FC = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  const visit = OUTPATIENT_VISITS.find((v) => v.patientId === patientId) ?? OUTPATIENT_VISITS[0];

  const [form, setForm] = useState<BasicForm>(INITIAL_FORM);
  const [pristine, setPristine] = useState<BasicForm>(INITIAL_FORM);
  const [discardOpen, setDiscardOpen] = useState(false);

  const isDirty = JSON.stringify(form) !== JSON.stringify(pristine);

  const update = <K extends keyof BasicForm>(key: K, value: BasicForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleBack = () => {
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    navigate(`/karte-outpatient/${visit.patientId}`);
  };

  const confirmDiscard = () => {
    setDiscardOpen(false);
    navigate(`/karte-outpatient/${visit.patientId}`);
  };

  const handleSave = () => {
    setPristine(form);
    showSnackbar('患者基本情報を保存しました（モック）', 'success');
  };

  if (!visit) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">患者が見つかりません</Typography>
        <Button onClick={() => navigate('/outpatient')} sx={{ mt: 2 }}>外来一覧へ戻る</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      {/* §2.1 戻るボタン + パンくず的位置 */}
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ color: 'text.secondary' }}
        >
          カルテ画面へ戻る
        </Button>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">
          患者基本情報
        </Typography>
      </Stack>

      {/* 患者ヘッダー（簡略版）*/}
      <Paper variant="outlined" sx={{ p: 1.25, mb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Chip label="外来" size="small" color="success" sx={{ fontWeight: 700 }} />
          <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 700 }}>
            {visit.patientId}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {visit.patientName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {visit.gender === 'M' ? '男' : '女'}　{visit.age}歳
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {visit.department}　主治医: {visit.doctorName}
          </Typography>
          <Box sx={{ flex: 1 }} />
          {isDirty && (
            <Chip label="未保存" size="small" color="warning" variant="outlined" />
          )}
        </Stack>
      </Paper>

      {/* 主訴 */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
        <SectionHeader title="主訴" icon={<PsychologyIcon />} />
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          placeholder="患者の主訴を入力"
          value={form.chiefComplaint}
          onChange={(e) => update('chiefComplaint', e.target.value)}
        />
      </Paper>

      {/* アレルギー */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
        <SectionHeader title="アレルギー" icon={<WarningIcon />} description="薬剤・食物・その他" />
        <Stack spacing={2}>
          <TriStateField
            label="アレルギー状態"
            state={form.allergyState}
            detail={form.allergyDetail}
            onStateChange={(s) => update('allergyState', s)}
            onDetailChange={(d) => update('allergyDetail', d)}
            detailPlaceholder="アレルギーの内容を記載"
          />
          <Divider />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <ChipInput
                label="禁忌薬剤"
                values={form.drugTaboo}
                onChange={(v) => update('drugTaboo', v)}
                placeholder="例: ペニシリン系"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <ChipInput
                label="食物アレルギー"
                values={form.foodAllergy}
                onChange={(v) => update('foodAllergy', v)}
                placeholder="例: 卵"
              />
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      {/* 感染症・既往 */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
        <SectionHeader title="感染症・既往" icon={<CoronavirusIcon />} />
        <Stack spacing={2}>
          <TriStateField
            label="感染症状態"
            state={form.infectionState}
            detail={form.infectionDetail}
            onStateChange={(s) => update('infectionState', s)}
            onDetailChange={(d) => update('infectionDetail', d)}
          />
          <Divider />
          <TriStateField
            label="ウイルス性肝炎"
            state={form.hepatitisState}
            detail={form.hepatitisDetail}
            onStateChange={(s) => update('hepatitisState', s)}
            onDetailChange={(d) => update('hepatitisDetail', d)}
          />
          <TriStateField
            label="梅毒既往"
            state={form.syphilisState}
            detail={form.syphilisDetail}
            onStateChange={(s) => update('syphilisState', s)}
            onDetailChange={(d) => update('syphilisDetail', d)}
          />
          <TriStateField
            label="HIV"
            state={form.hivState}
            detail={form.hivDetail}
            onStateChange={(s) => update('hivState', s)}
            onDetailChange={(d) => update('hivDetail', d)}
          />
        </Stack>
      </Paper>

      {/* 服薬・基礎疾患 */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
        <SectionHeader title="服薬・基礎疾患" icon={<HealingIcon />} />
        <Stack spacing={2}>
          <TriStateField
            label="他科薬"
            state={form.otherDeptDrugState}
            detail={form.otherDeptDrugDetail}
            onStateChange={(s) => update('otherDeptDrugState', s)}
            onDetailChange={(d) => update('otherDeptDrugDetail', d)}
            detailPlaceholder="他科で処方されている薬剤"
          />
          <TriStateField
            label="喘息"
            state={form.asthmaState}
            detail={form.asthmaDetail}
            onStateChange={(s) => update('asthmaState', s)}
            onDetailChange={(d) => update('asthmaDetail', d)}
          />
          <TriStateField
            label="その他備考"
            state={form.otherNoteState}
            detail={form.otherNoteDetail}
            onStateChange={(s) => update('otherNoteState', s)}
            onDetailChange={(d) => update('otherNoteDetail', d)}
          />
        </Stack>
      </Paper>

      {/* 問診表 */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
        <SectionHeader title="問診表" />
        <TextField
          fullWidth
          multiline
          minRows={3}
          maxRows={6}
          placeholder="問診の自由記述"
          value={form.interview}
          onChange={(e) => update('interview', e.target.value)}
        />
      </Paper>

      {/* 状態 */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
        <SectionHeader title="現在の状態" />
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="body2" sx={{ width: 90, fontWeight: 600 }}>授乳状態</Typography>
              <ToggleButtonGroup
                value={form.lactationState}
                exclusive
                size="small"
                onChange={(_, v) => v && update('lactationState', v)}
              >
                {TRI_STATES.map((s) => (
                  <ToggleButton key={s.value} value={s.value} sx={{ px: 1.5, py: 0.25 }}>{s.label}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="body2" sx={{ width: 90, fontWeight: 600 }}>妊娠状態</Typography>
              <ToggleButtonGroup
                value={form.pregnancyState}
                exclusive
                size="small"
                onChange={(_, v) => v && update('pregnancyState', v)}
              >
                {TRI_STATES.map((s) => (
                  <ToggleButton key={s.value} value={s.value} sx={{ px: 1.5, py: 0.25 }}>{s.label}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="body2" sx={{ width: 90, fontWeight: 600 }}>フレイル</Typography>
              <ToggleButtonGroup
                value={form.frailtyState}
                exclusive
                size="small"
                onChange={(_, v) => v && update('frailtyState', v)}
              >
                {TRI_STATES.map((s) => (
                  <ToggleButton key={s.value} value={s.value} sx={{ px: 1.5, py: 0.25 }}>{s.label}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* その他 */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
        <SectionHeader title="その他" icon={<StickyNote2Icon />} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>宗教</Typography>
            <TextField
              fullWidth multiline minRows={2} maxRows={4}
              placeholder="信仰・宗派など"
              value={form.religion}
              onChange={(e) => update('religion', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>患者メモ</Typography>
            <TextField
              fullWidth multiline minRows={2} maxRows={4}
              placeholder="自由記述"
              value={form.memo}
              onChange={(e) => update('memo', e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 預かり金 */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
        <SectionHeader title="預かり金" icon={<PaymentsIcon />} />
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="body2" sx={{ width: 110, fontWeight: 600 }}>預かり金管理</Typography>
            <ToggleButtonGroup
              value={form.depositManaged}
              exclusive
              size="small"
              onChange={(_, v) => v && update('depositManaged', v)}
            >
              {TRI_STATES.map((s) => (
                <ToggleButton key={s.value} value={s.value} sx={{ px: 1.5, py: 0.25 }}>{s.label}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
          {form.depositManaged === 'yes' && (
            <TextField
              fullWidth multiline minRows={2}
              placeholder="預かり金に関するメモ"
              value={form.depositMemo}
              onChange={(e) => update('depositMemo', e.target.value)}
            />
          )}
        </Stack>
      </Paper>

      {/* §3.2 アクションバー（MUI 標準: 右寄せ Cancel → Primary）*/}
      <Paper variant="outlined" sx={{ p: 1.25, position: 'sticky', bottom: 8, bgcolor: 'background.paper' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="caption" color="text.secondary">
            {isDirty ? '変更が保存されていません' : '変更はありません'}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleBack}>キャンセル</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!isDirty}
            onClick={handleSave}
          >
            保存
          </Button>
        </Stack>
      </Paper>

      {/* §10 破壊的: 未保存変更の離脱確認 */}
      <Dialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>変更を破棄しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            保存していない変更があります。このまま戻ると変更内容は失われます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscardOpen(false)}>編集に戻る</Button>
          <Button onClick={confirmDiscard} variant="contained" color="warning">
            破棄して戻る
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PatientBasicPage;
