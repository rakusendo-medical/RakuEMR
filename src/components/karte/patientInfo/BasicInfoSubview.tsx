import { useCallback, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  CoronavirusOutlined as CoronavirusIcon,
  HealingOutlined as HealingIcon,
  Payments as PaymentsIcon,
  PsychologyOutlined as PsychologyIcon,
  StickyNote2Outlined as StickyNote2Icon,
  WarningAmberOutlined as WarningIcon,
} from '@mui/icons-material';
import { allergyInfo } from '../../../data/mockData';
import { useAppStore } from '../../../stores/useAppStore';
import type { KarteMode } from '../KartePage';
import { useDirtyForm } from './useDirtyForm';
import SubviewActionBar from './SubviewActionBar';

type TriState = 'none' | 'yes' | 'unknown';

const TRI_STATES: { value: TriState; label: string }[] = [
  { value: 'none', label: 'なし' },
  { value: 'yes', label: 'あり' },
  { value: 'unknown', label: '不明' },
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

const SectionHeader: React.FC<{
  title: string;
  icon?: React.ReactElement;
  description?: string;
}> = ({ title, icon, description }) => (
  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
    {icon && <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>}
    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
      {title}
    </Typography>
    {description && (
      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
        {description}
      </Typography>
    )}
  </Stack>
);

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

const ChipInput: React.FC<{
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}> = ({ label, values, onChange, placeholder }) => {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setDraft('');
  };
  const remove = (v: string) => onChange(values.filter((x) => x !== v));
  return (
    <Stack spacing={1}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
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
          <Typography variant="caption" color="text.disabled">
            未登録
          </Typography>
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

interface BasicInfoSubviewProps {
  mode: KarteMode;
  onDirtyChange: (dirty: boolean) => void;
  discardSignal: number;
}

export default function BasicInfoSubview({ mode, onDirtyChange, discardSignal }: BasicInfoSubviewProps) {
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  const onDirtyChangeStable = useCallback(onDirtyChange, [onDirtyChange]);
  const { form, setForm, isDirty, save, cancel } = useDirtyForm<BasicForm>(
    INITIAL_FORM,
    onDirtyChangeStable,
    discardSignal,
  );

  const update = <K extends keyof BasicForm>(key: K, value: BasicForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = () => {
    save();
    showSnackbar('基本情報を保存しました（モック）', 'success');
  };

  return (
    <Stack spacing={1.5}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
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

      <Paper variant="outlined" sx={{ p: 1.5 }}>
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

      <Paper variant="outlined" sx={{ p: 1.5 }}>
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

      <Paper variant="outlined" sx={{ p: 1.5 }}>
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

      <Paper variant="outlined" sx={{ p: 1.5 }}>
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

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <SectionHeader title="現在の状態" />
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="body2" sx={{ width: 90, fontWeight: 600 }}>
                授乳状態
              </Typography>
              <ToggleButtonGroup
                value={form.lactationState}
                exclusive
                size="small"
                onChange={(_, v) => v && update('lactationState', v)}
              >
                {TRI_STATES.map((s) => (
                  <ToggleButton key={s.value} value={s.value} sx={{ px: 1.5, py: 0.25 }}>
                    {s.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="body2" sx={{ width: 90, fontWeight: 600 }}>
                妊娠状態
              </Typography>
              <ToggleButtonGroup
                value={form.pregnancyState}
                exclusive
                size="small"
                onChange={(_, v) => v && update('pregnancyState', v)}
              >
                {TRI_STATES.map((s) => (
                  <ToggleButton key={s.value} value={s.value} sx={{ px: 1.5, py: 0.25 }}>
                    {s.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="body2" sx={{ width: 90, fontWeight: 600 }}>
                フレイル
              </Typography>
              <ToggleButtonGroup
                value={form.frailtyState}
                exclusive
                size="small"
                onChange={(_, v) => v && update('frailtyState', v)}
              >
                {TRI_STATES.map((s) => (
                  <ToggleButton key={s.value} value={s.value} sx={{ px: 1.5, py: 0.25 }}>
                    {s.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <SectionHeader title="その他" icon={<StickyNote2Icon />} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              宗教
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              placeholder="信仰・宗派など"
              value={form.religion}
              onChange={(e) => update('religion', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                基本情報メモ（補足）
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                label="このタブのみ表示"
                sx={{ height: 20, fontSize: 11 }}
              />
            </Stack>
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              placeholder="基本情報サブタブの中だけで参照する補足メモ。長文の運用メモはメモサブタブに記載。"
              value={form.memo}
              onChange={(e) => update('memo', e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/*
        預かり金セクション: PM 判断 #1（2026-05-06）により ep-16 us-35 で **非表示化**。
        将来別システム連携で「預かり金管理」が実装される際に復活予定（連携先・項目スキーマは未確定）。
        BasicForm.depositManaged / depositMemo の state は連携時の復活を見越して温存。
        AC-5（預かり金セクションが非表示）の根拠コメント。
      */}

      <SubviewActionBar
        mode={mode}
        isDirty={isDirty}
        onSave={handleSave}
        onCancel={cancel}
        saveLabel="基本情報を保存"
      />
    </Stack>
  );
}
