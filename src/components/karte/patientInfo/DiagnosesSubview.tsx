import { useCallback } from 'react';
import {
  Box, Button, Checkbox, FormControlLabel, Grid, IconButton, MenuItem,
  Paper, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { Add as AddIcon, DeleteOutline } from '@mui/icons-material';
import { diagnosisInfo } from '../../../data/mockData';
import { useAppStore } from '../../../stores/useAppStore';
import type { KarteMode } from '../KartePage';
import { useDirtyForm } from './useDirtyForm';
import SubviewActionBar from './SubviewActionBar';

interface DiagnosisEntry {
  id: string;
  name: string;
  code: string;
  date: string; // YYYY-MM-DD
  /** 主病名フラグ（一覧内で 1 件のみ true） */
  isPrimary: boolean;
}

interface DiagnosesForm {
  diagnoses: DiagnosisEntry[];
  outcome: '治療中' | '軽快' | '治癒' | '転院' | '中止';
}

const INITIAL_FORM: DiagnosesForm = {
  diagnoses: [
    { id: 'dx1', name: diagnosisInfo.mainDiagnosis, code: diagnosisInfo.mainDiagnosisCode, date: '2017-02-08', isPrimary: true },
    { id: 'dx2', name: diagnosisInfo.subDiagnosis,  code: diagnosisInfo.subDiagnosisCode,  date: '2017-04-05', isPrimary: false },
  ],
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

  const updateEntry = (id: string, patch: Partial<DiagnosisEntry>) =>
    setForm((f) => ({ ...f, diagnoses: f.diagnoses.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));

  // 主病名フラグは排他（1 件のみ）。チェックした行を主病名にし、他は解除
  const setPrimary = (id: string) =>
    setForm((f) => ({ ...f, diagnoses: f.diagnoses.map((d) => ({ ...d, isPrimary: d.id === id })) }));

  const addEntry = () =>
    setForm((f) => ({
      ...f,
      diagnoses: [
        ...f.diagnoses,
        { id: `dx${Date.now()}`, name: '', code: '', date: '', isPrimary: f.diagnoses.length === 0 },
      ],
    }));

  const removeEntry = (id: string) =>
    setForm((f) => {
      const next = f.diagnoses.filter((d) => d.id !== id);
      // 主病名が削除された場合は先頭を主病名に繰り上げ
      if (next.length > 0 && !next.some((d) => d.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return { ...f, diagnoses: next };
    });

  return (
    <Stack spacing={1.5}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            病名一覧
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={addEntry}>
            病名を追加
          </Button>
        </Stack>

        <Stack spacing={1}>
          {form.diagnoses.map((d) => (
            <Grid container spacing={1.5} key={d.id} alignItems="center">
              <Grid item xs={6} sm={2}>
                <FormControlLabel
                  sx={{ ml: 0 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={d.isPrimary}
                      onChange={() => setPrimary(d.id)}
                    />
                  }
                  label={<Typography variant="caption" sx={{ fontWeight: 700 }}>主病名</Typography>}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  size="small" fullWidth label="病名"
                  value={d.name}
                  onChange={(e) => updateEntry(d.id, { name: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField
                  size="small" fullWidth label="ICD10 コード"
                  value={d.code}
                  onChange={(e) => updateEntry(d.id, { code: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  size="small" fullWidth type="date" label="開始日"
                  InputLabelProps={{ shrink: true }}
                  value={d.date}
                  onChange={(e) => updateEntry(d.id, { date: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={1} sx={{ textAlign: 'right' }}>
                <Tooltip title="この病名を削除">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => removeEntry(d.id)}
                      disabled={form.diagnoses.length <= 1}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Grid>
            </Grid>
          ))}
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          主病名フラグは一覧内で 1 件のみ設定できます。ICD10 マスタ検索 UI、病名一覧の履歴管理は段階 2 以降で対応予定。
        </Typography>
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
