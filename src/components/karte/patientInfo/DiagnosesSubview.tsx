import { useCallback } from 'react';
import { Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { diagnosisInfo } from '../../../data/mockData';
import { useAppStore } from '../../../stores/useAppStore';
import type { KarteMode } from '../KartePage';
import { useDirtyForm } from './useDirtyForm';
import SubviewActionBar from './SubviewActionBar';

interface DiagnosesForm {
  mainDiagnosis: string;
  mainDiagnosisCode: string;
  mainDiagnosisDate: string;
  subDiagnosis: string;
  subDiagnosisCode: string;
  subDiagnosisDate: string;
  outcome: '治療中' | '軽快' | '治癒' | '転院' | '中止';
}

const INITIAL_FORM: DiagnosesForm = {
  mainDiagnosis: diagnosisInfo.mainDiagnosis,
  mainDiagnosisCode: diagnosisInfo.mainDiagnosisCode,
  mainDiagnosisDate: '2017-02-08',
  subDiagnosis: diagnosisInfo.subDiagnosis,
  subDiagnosisCode: diagnosisInfo.subDiagnosisCode,
  subDiagnosisDate: '2017-04-05',
  outcome: '治療中',
};

const OUTCOMES: DiagnosesForm['outcome'][] = ['治療中', '軽快', '治癒', '転院', '中止'];

interface DiagnosesSubviewProps {
  mode: KarteMode;
  onDirtyChange: (dirty: boolean) => void;
  discardSignal: number;
}

export default function DiagnosesSubview({ mode, onDirtyChange, discardSignal }: DiagnosesSubviewProps) {
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  const onDirtyChangeStable = useCallback(onDirtyChange, [onDirtyChange]);
  const { form, setForm, isDirty, save, cancel } = useDirtyForm<DiagnosesForm>(
    INITIAL_FORM,
    onDirtyChangeStable,
    discardSignal,
  );

  const update = <K extends keyof DiagnosesForm>(key: K, v: DiagnosesForm[K]) => {
    setForm((f) => ({ ...f, [key]: v }));
  };

  return (
    <Stack spacing={1.5}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          主病名
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              fullWidth
              label="主病名"
              value={form.mainDiagnosis}
              onChange={(e) => update('mainDiagnosis', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              size="small"
              fullWidth
              label="ICD10 コード"
              value={form.mainDiagnosisCode}
              onChange={(e) => update('mainDiagnosisCode', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              size="small"
              fullWidth
              type="date"
              label="開始日"
              InputLabelProps={{ shrink: true }}
              value={form.mainDiagnosisDate}
              onChange={(e) => update('mainDiagnosisDate', e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          副病名
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              fullWidth
              label="副病名"
              value={form.subDiagnosis}
              onChange={(e) => update('subDiagnosis', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              size="small"
              fullWidth
              label="ICD10 コード"
              value={form.subDiagnosisCode}
              onChange={(e) => update('subDiagnosisCode', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              size="small"
              fullWidth
              type="date"
              label="開始日"
              InputLabelProps={{ shrink: true }}
              value={form.subDiagnosisDate}
              onChange={(e) => update('subDiagnosisDate', e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          転帰
        </Typography>
        <TextField
          size="small"
          select
          sx={{ width: 200 }}
          label="現在の転帰"
          value={form.outcome}
          onChange={(e) => update('outcome', e.target.value as DiagnosesForm['outcome'])}
        >
          {OUTCOMES.map((o) => (
            <MenuItem key={o} value={o}>
              {o}
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          ICD10 マスタ検索 UI、副病名の複数行登録、病名一覧の履歴管理は段階 2 以降で対応予定。
        </Typography>
      </Paper>

      <SubviewActionBar
        mode={mode}
        isDirty={isDirty}
        onSave={() => {
          save();
          showSnackbar('病名を保存しました（モック）', 'success');
        }}
        onCancel={cancel}
        saveLabel="病名を保存"
      />
    </Stack>
  );
}
