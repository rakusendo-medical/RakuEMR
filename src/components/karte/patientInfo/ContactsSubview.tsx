import { useCallback } from 'react';
import { Box, Button, Grid, Paper, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAppStore } from '../../../stores/useAppStore';
import type { KarteMode } from '../KartePage';
import { useDirtyForm } from './useDirtyForm';
import SubviewActionBar from './SubviewActionBar';

interface EmergencyContact {
  name: string;
  relation: string;
  phoneDay: string;
  phoneNight: string;
  mobile: string;
}

interface Workplace {
  name: string;
  phone: string;
}

interface MailingAddress {
  recipient: string;
  postalCode: string;
  address: string;
}

interface ContactsForm {
  emergency: EmergencyContact;
  workplace: Workplace;
  mailing: MailingAddress;
}

const INITIAL_FORM: ContactsForm = {
  emergency: {
    name: '田辺 由美子',
    relation: '配偶者',
    phoneDay: '03-1234-5678',
    phoneNight: '',
    mobile: '090-1234-5678',
  },
  workplace: {
    name: '株式会社サンプル',
    phone: '03-9876-5432',
  },
  mailing: {
    recipient: '田辺 正志',
    postalCode: '100-0001',
    address: '東京都千代田区 サンプル町 1-2-3',
  },
};

interface ContactsSubviewProps {
  mode: KarteMode;
  onDirtyChange: (dirty: boolean) => void;
  discardSignal: number;
}

export default function ContactsSubview({ mode, onDirtyChange, discardSignal }: ContactsSubviewProps) {
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  const onDirtyChangeStable = useCallback(onDirtyChange, [onDirtyChange]);
  const { form, setForm, isDirty, save, cancel } = useDirtyForm<ContactsForm>(
    INITIAL_FORM,
    onDirtyChangeStable,
    discardSignal,
  );

  const updateEmergency = <K extends keyof EmergencyContact>(key: K, v: EmergencyContact[K]) =>
    setForm((f) => ({ ...f, emergency: { ...f.emergency, [key]: v } }));
  const updateWorkplace = <K extends keyof Workplace>(key: K, v: Workplace[K]) =>
    setForm((f) => ({ ...f, workplace: { ...f.workplace, [key]: v } }));
  const updateMailing = <K extends keyof MailingAddress>(key: K, v: MailingAddress[K]) =>
    setForm((f) => ({ ...f, mailing: { ...f.mailing, [key]: v } }));

  const handleAddMock = (label: string) => {
    showSnackbar(`${label}の追加（段階 1 ではモック動作）`, 'info');
  };

  return (
    <Stack spacing={1.5}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
            連絡先（緊急連絡先）
          </Typography>
          <Button
            size="small"
            variant="text"
            startIcon={<AddIcon />}
            onClick={() => handleAddMock('連絡先')}
          >
            追加
          </Button>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              fullWidth
              label="連絡先氏名"
              value={form.emergency.name}
              onChange={(e) => updateEmergency('name', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              fullWidth
              label="続柄"
              value={form.emergency.relation}
              onChange={(e) => updateEmergency('relation', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              fullWidth
              label="日中電話"
              value={form.emergency.phoneDay}
              onChange={(e) => updateEmergency('phoneDay', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              fullWidth
              label="夜間電話"
              value={form.emergency.phoneNight}
              onChange={(e) => updateEmergency('phoneNight', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              fullWidth
              label="携帯"
              value={form.emergency.mobile}
              onChange={(e) => updateEmergency('mobile', e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
            勤務先
          </Typography>
          <Button
            size="small"
            variant="text"
            startIcon={<AddIcon />}
            onClick={() => handleAddMock('勤務先')}
          >
            追加
          </Button>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              size="small"
              fullWidth
              label="勤務先名"
              value={form.workplace.name}
              onChange={(e) => updateWorkplace('name', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              fullWidth
              label="電話"
              value={form.workplace.phone}
              onChange={(e) => updateWorkplace('phone', e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
            郵送先
          </Typography>
          <Button
            size="small"
            variant="text"
            startIcon={<AddIcon />}
            onClick={() => handleAddMock('郵送先')}
          >
            追加
          </Button>
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              size="small"
              fullWidth
              label="宛名"
              value={form.mailing.recipient}
              onChange={(e) => updateMailing('recipient', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              size="small"
              fullWidth
              label="郵便番号"
              value={form.mailing.postalCode}
              onChange={(e) => updateMailing('postalCode', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              size="small"
              fullWidth
              label="住所"
              value={form.mailing.address}
              onChange={(e) => updateMailing('address', e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      <Box>
        <Typography variant="caption" color="text.secondary">
          複数の連絡先・勤務先・郵送先の追加 UI は段階 2 以降で対応予定。
        </Typography>
      </Box>

      <SubviewActionBar
        mode={mode}
        isDirty={isDirty}
        onSave={() => {
          save();
          showSnackbar('連絡先を保存しました（モック）', 'success');
        }}
        onCancel={cancel}
        saveLabel="連絡先を保存"
      />
    </Stack>
  );
}
