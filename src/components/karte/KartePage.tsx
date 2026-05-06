import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { PATIENTS } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import type { Patient } from '../../types';
import KartePatientHeader from './KartePatientHeader';
import KarteActionBar from './KarteActionBar';
import FlowsheetPage from '../../features/flowsheet/pages/FlowsheetPage';

export type KarteMode = 'outpatient' | 'inpatient';

export type KarteNavigationFrom = 'outpatient-list' | 'ward-map' | 'patient-list';

export interface KartePageLocationState {
  from?: KarteNavigationFrom;
}

interface KartePageProps {
  /**
   * mode を強制指定する（テスト・将来の埋込用エスケープハッチ）。
   * 通常は内部判定に任せる。
   */
  modeOverride?: KarteMode;
}

interface TabDef {
  id: string;
  label: string;
  /** この mode のとき disabled */
  disabledIn?: KarteMode[];
  disabledTooltip?: string;
}

const TABS: TabDef[] = [
  { id: 'medical-record', label: '診療録' },
  { id: 'flowsheet', label: 'フローシート' },
  { id: 'orders', label: '指示簿' },
  { id: 'order-status', label: '指示状況' },
  {
    id: 'care-plan',
    label: '看護過程',
    disabledIn: ['outpatient'],
    disabledTooltip: '外来では利用しません',
  },
  { id: 'patient-info', label: '患者情報' },
  { id: 'schedule', label: 'スケジュール' },
];

const DEFAULT_TAB = 'medical-record';

function determineMode(args: {
  override?: KarteMode;
  navState?: KarteNavigationFrom;
  storeNavSource: 'ward-map' | 'other' | null;
  patient?: Patient;
}): KarteMode {
  if (args.override) return args.override;
  if (args.navState === 'outpatient-list') return 'outpatient';
  if (args.navState === 'ward-map' || args.navState === 'patient-list') return 'inpatient';
  if (args.storeNavSource === 'ward-map') return 'inpatient';
  if (args.patient?.admissionState === 'outpatient') return 'outpatient';
  return 'inpatient';
}

function determineBackPath(args: {
  navState?: KarteNavigationFrom;
  mode: KarteMode;
}): string {
  switch (args.navState) {
    case 'outpatient-list':
      return '/outpatient';
    case 'ward-map':
      return '/';
    case 'patient-list':
      return '/patients';
    default:
      return args.mode === 'outpatient' ? '/outpatient' : '/';
  }
}

export default function KartePage({ modeOverride }: KartePageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId = '' } = useParams<{ patientId: string }>();
  const navState = (location.state as KartePageLocationState | null)?.from;
  const storeNavSource = useAppStore((s) => s.navigationSource);

  const patient = useMemo(() => PATIENTS.find((p) => p.id === patientId), [patientId]);

  const mode = useMemo(
    () => determineMode({ override: modeOverride, navState, storeNavSource, patient }),
    [modeOverride, navState, storeNavSource, patient],
  );

  const [currentTab, setCurrentTab] = useState<string>(DEFAULT_TAB);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  if (!patient) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">患者が見つかりません: {patientId}</Alert>
      </Box>
    );
  }

  const handleBack = () => {
    const path = determineBackPath({ navState, mode });
    navigate(path);
  };

  const handleAction = (actionId: string) => {
    if (actionId === 'close') {
      handleBack();
      return;
    }
    setToast({
      open: true,
      message: `[${actionId}] は段階 1 ではモック動作です（mode=${mode}）`,
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <KartePatientHeader patient={patient} mode={mode} onBack={handleBack} />

      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Tabs
          value={currentTab}
          onChange={(_, v) => setCurrentTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          textColor={mode === 'outpatient' ? 'inherit' : 'primary'}
        >
          {TABS.map((t) => {
            const disabled = !!t.disabledIn?.includes(mode);
            const tab = (
              <Tab key={t.id} value={t.id} label={t.label} disabled={disabled} />
            );
            if (disabled && t.disabledTooltip) {
              return (
                <Tooltip
                  key={t.id}
                  title={t.disabledTooltip}
                  placement="bottom"
                  disableInteractive
                >
                  <span style={{ display: 'inline-flex' }}>{tab}</span>
                </Tooltip>
              );
            }
            return tab;
          })}
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', bgcolor: 'background.default', p: 2 }}>
        <KarteTabContent tabId={currentTab} mode={mode} patientId={patient.id} />
      </Box>

      <KarteActionBar mode={mode} onAction={handleAction} />

      <Snackbar
        open={toast.open}
        autoHideDuration={2400}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity="info"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function KarteTabContent({
  tabId,
  mode,
  patientId,
}: {
  tabId: string;
  mode: KarteMode;
  patientId: string;
}) {
  if (tabId === 'flowsheet') {
    return <FlowsheetPage embedded patientId={patientId} />;
  }

  const meta: Record<string, { title: string; note: string }> = {
    'medical-record': {
      title: '診療録',
      note: '段階 1 ではタブ枠のみ。診療録ビューは別ストーリーで実装予定。',
    },
    orders: {
      title: '指示簿',
      note: '段階 1 ではタブ枠のみ。オーダー一覧の埋込は別エピックで対応。',
    },
    'order-status': {
      title: '指示状況',
      note: '段階 1 ではタブ枠のみ。実施状況・受け持ち情報は別エピックで対応。',
    },
    'care-plan': {
      title: '看護過程',
      note: 'mode=inpatient 時の中身は ep-12〜14 で別途実装予定。',
    },
    'patient-info': {
      title: '患者情報',
      note: 'us-34 で 7 サブタブ（基本情報／属性／保険／連絡先／病名／エピソード／メモ）として S3 が実装予定。',
    },
    schedule: {
      title: 'スケジュール',
      note: '段階 1 ではタブ枠のみ。予約・受診計画は別ストーリーで実装予定。',
    },
  };

  const m = meta[tabId];
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {m?.title ?? tabId}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {m?.note ?? '未実装タブです。'}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        現在 mode: <code>{mode}</code> / patientId: <code>{patientId}</code>
      </Typography>
    </Paper>
  );
}
