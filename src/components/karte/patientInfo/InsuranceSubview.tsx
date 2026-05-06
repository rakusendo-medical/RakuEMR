import { useCallback } from 'react';
import { Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAppStore } from '../../../stores/useAppStore';
import type { KarteMode } from '../KartePage';
import { useDirtyForm } from './useDirtyForm';
import SubviewActionBar from './SubviewActionBar';

interface InsuranceForm {
  lawCategory: string;
  selfFamily: '本人' | '家族';
  copay: string;
  validFrom: string;
  validTo: string;
  insurerNumber: string;
  recordNumber: string;
  insuredNumber: string;
  branchNumber: string;
}

const INITIAL_FORM: InsuranceForm = {
  lawCategory: '01（協会けんぽ）',
  selfFamily: '本人',
  copay: '30',
  validFrom: '2024-04-01',
  validTo: '2027-03-31',
  insurerNumber: '01130012',
  recordNumber: '健保 1234',
  insuredNumber: '5678',
  branchNumber: '00',
};

const LAW_CATEGORIES = [
  '01（協会けんぽ）',
  '02（船員保険）',
  '06（組合管掌健保）',
  '67（後期高齢者医療）',
  '社国（国保）',
];

interface InsuranceSubviewProps {
  mode: KarteMode;
  onDirtyChange: (dirty: boolean) => void;
  discardSignal: number;
}

export default function InsuranceSubview({ mode, onDirtyChange, discardSignal }: InsuranceSubviewProps) {
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  const onDirtyChangeStable = useCallback(onDirtyChange, [onDirtyChange]);
  const { form, setForm, isDirty, save, cancel } = useDirtyForm<InsuranceForm>(
    INITIAL_FORM,
    onDirtyChangeStable,
    discardSignal,
  );

  const update = <K extends keyof InsuranceForm>(key: K, v: InsuranceForm[K]) => {
    setForm((f) => ({ ...f, [key]: v }));
  };

  return (
    <Stack spacing={1.5}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          保険情報
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              fullWidth
              select
              label="法別番号"
              value={form.lawCategory}
              onChange={(e) => update('lawCategory', e.target.value)}
            >
              {LAW_CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              size="small"
              fullWidth
              select
              label="本人/家族"
              value={form.selfFamily}
              onChange={(e) => update('selfFamily', e.target.value as '本人' | '家族')}
            >
              <MenuItem value="本人">本人</MenuItem>
              <MenuItem value="家族">家族</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              size="small"
              fullWidth
              label="自己負担割合 (%)"
              value={form.copay}
              onChange={(e) => update('copay', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              size="small"
              fullWidth
              type="date"
              label="有効開始日"
              InputLabelProps={{ shrink: true }}
              value={form.validFrom}
              onChange={(e) => update('validFrom', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              size="small"
              fullWidth
              type="date"
              label="有効終了日"
              InputLabelProps={{ shrink: true }}
              value={form.validTo}
              onChange={(e) => update('validTo', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              size="small"
              fullWidth
              label="保険者番号"
              value={form.insurerNumber}
              onChange={(e) => update('insurerNumber', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              size="small"
              fullWidth
              label="被保険者記号"
              value={form.recordNumber}
              onChange={(e) => update('recordNumber', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              size="small"
              fullWidth
              label="被保険者番号"
              value={form.insuredNumber}
              onChange={(e) => update('insuredNumber', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              size="small"
              fullWidth
              label="枝番"
              value={form.branchNumber}
              onChange={(e) => update('branchNumber', e.target.value)}
            />
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          編集権限による read-only 制御は別ストーリー（権限系）で扱います。継続区分・入外区分などの追加項目は段階 2 以降。
        </Typography>
      </Paper>

      <SubviewActionBar
        mode={mode}
        isDirty={isDirty}
        onSave={() => {
          save();
          showSnackbar('保険情報を保存しました（モック）', 'success');
        }}
        onCancel={cancel}
        saveLabel="保険を保存"
      />
    </Stack>
  );
}
