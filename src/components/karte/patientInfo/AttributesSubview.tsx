import { useCallback } from 'react';
import {
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAppStore } from '../../../stores/useAppStore';
import { WARD_LABELS } from '../../../types';
import type { Patient } from '../../../types';
import type { KarteMode } from '../KartePage';
import { useDirtyForm } from './useDirtyForm';
import SubviewActionBar from './SubviewActionBar';

interface AttributesForm {
  nickname: string;
  occupation: string;
  firstVisitDate: string;
  height: string;
  weight: string;
  bloodType: string;
  deceased: 'no' | 'yes';
}

const BLOOD_TYPES = ['A', 'B', 'O', 'AB', '不明'];

interface AttributesSubviewProps {
  patient: Patient;
  mode: KarteMode;
  onDirtyChange: (dirty: boolean) => void;
  discardSignal: number;
}

export default function AttributesSubview({
  patient,
  mode,
  onDirtyChange,
  discardSignal,
}: AttributesSubviewProps) {
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  const initial: AttributesForm = {
    nickname: '',
    occupation: '会社員',
    firstVisitDate: '2020-04-01',
    height: '',
    weight: '',
    bloodType: patient.bloodType ?? '不明',
    deceased: 'no',
  };

  const onDirtyChangeStable = useCallback(onDirtyChange, [onDirtyChange]);
  const { form, setForm, isDirty, save, cancel } = useDirtyForm<AttributesForm>(
    initial,
    onDirtyChangeStable,
    discardSignal,
  );

  const update = <K extends keyof AttributesForm>(key: K, v: AttributesForm[K]) => {
    setForm((f) => ({ ...f, [key]: v }));
  };

  const handleSave = () => {
    save();
    showSnackbar('属性を保存しました（モック）', 'success');
  };

  const wardLabel = patient.wardId ? WARD_LABELS[patient.wardId] : undefined;

  return (
    <Stack spacing={1.5}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          個人情報
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              fullWidth
              label="ニックネーム"
              value={form.nickname}
              onChange={(e) => update('nickname', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              fullWidth
              label="職業"
              value={form.occupation}
              onChange={(e) => update('occupation', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              fullWidth
              type="date"
              label="初診日"
              InputLabelProps={{ shrink: true }}
              value={form.firstVisitDate}
              onChange={(e) => update('firstVisitDate', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              size="small"
              fullWidth
              label="身長 (cm)"
              value={form.height}
              onChange={(e) => update('height', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              size="small"
              fullWidth
              label="体重 (kg)"
              value={form.weight}
              onChange={(e) => update('weight', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              size="small"
              fullWidth
              select
              label="血液型"
              value={form.bloodType}
              onChange={(e) => update('bloodType', e.target.value)}
            >
              {BLOOD_TYPES.map((b) => (
                <MenuItem key={b} value={b}>
                  {b}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              size="small"
              fullWidth
              select
              label="死亡フラグ"
              value={form.deceased}
              onChange={(e) => update('deceased', e.target.value as 'no' | 'yes')}
            >
              <MenuItem value="no">該当なし</MenuItem>
              <MenuItem value="yes">死亡</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          担当スタッフ
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              fullWidth
              label="主治医"
              value={patient.doctorName ?? ''}
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              fullWidth
              label="担当看護師"
              value={patient.nurse ?? '（未設定）'}
              InputProps={{ readOnly: true }}
            />
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          紹介医／SW／心理士／スタッフ 1〜6 などの細粒度割当は段階 2 以降で対応予定。
        </Typography>
      </Paper>

      {mode === 'inpatient' && (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            入院専用情報
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                size="small"
                fullWidth
                label="入院日"
                value={patient.admitDate ?? ''}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                size="small"
                fullWidth
                label="病棟"
                value={wardLabel ?? ''}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                size="small"
                fullWidth
                label="病室"
                value={patient.roomNumber ?? ''}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                size="small"
                fullWidth
                label="受け持ち看護師"
                value={patient.nurse ?? '（未設定）'}
                InputProps={{ readOnly: true }}
              />
            </Grid>
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            既存 Patient フィールド（admitDate / wardId → wardLabel / roomNumber / nurse）から read-only 表示。担当看護師の編集 UI（複数割当・受け持ち変更履歴 等）は将来拡張予定。
          </Typography>
        </Paper>
      )}

      <SubviewActionBar
        mode={mode}
        isDirty={isDirty}
        onSave={handleSave}
        onCancel={cancel}
        saveLabel="属性を保存"
      />
    </Stack>
  );
}
