import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Description as MedicalRecordIcon,
  ShowChart as FlowsheetIcon,
  ListAlt as OrdersIcon,
  AssignmentTurnedIn as OrderStatusIcon,
  MedicalServices as CarePlanIcon,
  PersonOutline as PatientInfoIcon,
  EventNote as ScheduleIcon,
  ViewAgenda as LayoutStackIcon,
  ViewColumn as LayoutSideBySideIcon,
} from '@mui/icons-material';
import { PATIENTS } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import type { Patient } from '../../types';
import KartePatientHeader from './KartePatientHeader';
import KarteActionBar from './KarteActionBar';
import FlowsheetView from '../flowsheet/Flowsheet';
import PatientInfoTab from './PatientInfoTab';
import MedicalRecordTab from './MedicalRecordTab';
import ClinicalInfoPanel from './ClinicalInfoPanel';
import LifeHistoryTimeline from './LifeHistoryTimeline';
import OrdersTab from './OrdersTab';
import OrderStatusTab from './OrderStatusTab';
import NursingProcessTab from './NursingProcessTab';
import ScheduleTab from './ScheduleTab';
import AdmissionOrderDialog from '../admission/AdmissionOrderDialog';
import DischargeOrderDialog from '../admission/DischargeOrderDialog';
import RestraintOrderDialog from '../isolation/RestraintOrderDialog';
import NursingRecordDialog from '../../features/flowsheet/components/NursingRecordDialog';

export type KarteMode = 'outpatient' | 'inpatient';

export type KarteNavigationFrom = 'outpatient-list' | 'ward-map' | 'patient-list' | 'patient-search';

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
  /** URL ハッシュ（`#` 抜き）。AC-10 の対応表に準拠。看護過程のみ tabId（`care-plan`）と異なる */
  hash: string;
  icon: React.ReactElement;
  /** この mode のとき disabled */
  disabledIn?: KarteMode[];
  disabledTooltip?: string;
}

const TABS: TabDef[] = [
  { id: 'medical-record', label: '診療録', hash: 'medical-record', icon: <MedicalRecordIcon fontSize="small" /> },
  { id: 'flowsheet', label: 'フローシート・隔離拘束', hash: 'flowsheet', icon: <FlowsheetIcon fontSize="small" /> },
  { id: 'orders', label: '指示簿', hash: 'orders', icon: <OrdersIcon fontSize="small" /> },
  { id: 'order-status', label: '指示状況', hash: 'order-status', icon: <OrderStatusIcon fontSize="small" /> },
  {
    id: 'care-plan',
    label: '看護過程',
    hash: 'nursing-process',
    icon: <CarePlanIcon fontSize="small" />,
    disabledIn: ['outpatient'],
    disabledTooltip: '外来では利用しません',
  },
  { id: 'patient-info', label: '患者情報', hash: 'patient-info', icon: <PatientInfoIcon fontSize="small" /> },
  { id: 'schedule', label: 'スケジュール', hash: 'schedule', icon: <ScheduleIcon fontSize="small" /> },
];

const DEFAULT_TAB = 'medical-record';

/**
 * URL ハッシュから tabId を解決。
 * - 未対応／空ハッシュ、現 mode で disabled なタブ指定は既定タブにフォールバック
 */
function resolveTabFromHash(hashRaw: string, mode: KarteMode): string {
  const hash = hashRaw.startsWith('#') ? hashRaw.slice(1) : hashRaw;
  if (!hash) return DEFAULT_TAB;
  const def = TABS.find((t) => t.hash === hash);
  if (!def) return DEFAULT_TAB;
  if (def.disabledIn?.includes(mode)) return DEFAULT_TAB;
  return def.id;
}

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
    case 'patient-search':
      return '/patient-search';
    default:
      return args.mode === 'outpatient' ? '/outpatient' : '/';
  }
}

type PendingNav =
  | { type: 'tab'; tabId: string }
  | { type: 'back' }
  | null;

export default function KartePage({ modeOverride }: KartePageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientId = '' } = useParams<{ patientId: string }>();
  const navState = (location.state as KartePageLocationState | null)?.from;
  const storeNavSource = useAppStore((s) => s.navigationSource);
  const selectedPatient = useAppStore((s) => s.selectedPatient);

  // 患者解決の優先順:
  //  1) PATIENTS（入院マスタ）に同 ID があればそれ
  //  2) useAppStore.selectedPatient（OutpatientList 等が `setSelectedPatient` で渡した合成 Patient）
  //     -> 外来 visit（`OUTPATIENT_VISITS`）の patientId は PATIENTS に居ないため、ここで受ける
  const patient = useMemo(() => {
    const fromMaster = PATIENTS.find((p) => p.id === patientId);
    if (fromMaster) return fromMaster;
    if (selectedPatient && selectedPatient.id === patientId) return selectedPatient;
    return undefined;
  }, [patientId, selectedPatient]);

  const mode = useMemo(
    () => determineMode({ override: modeOverride, navState, storeNavSource, patient }),
    [modeOverride, navState, storeNavSource, patient],
  );

  // 初期 currentTab は URL ハッシュ → mode で解決（無効・空・disabled なら既定タブ）
  const [currentTab, setCurrentTab] = useState<string>(() =>
    resolveTabFromHash(location.hash, mode),
  );
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // URL ハッシュ変化（戻る／進む／外部からの URL 直打ち変更）に追従
  useEffect(() => {
    const resolved = resolveTabFromHash(location.hash, mode);
    if (resolved !== currentTab) {
      setCurrentTab(resolved);
    }
    // currentTab を依存に入れるとループするため除外
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash, mode]);

  /**
   * タブ確定時に currentTab を更新し、URL ハッシュを `#<hash>` で揃える。
   * - `replace=false`（既定）: ユーザー操作（タブクリック等）の場合。履歴に積み、ブラウザバックで前タブに戻れる
   * - `replace=true`: 初期化時の URL 自動補正（無効ハッシュ → 既定タブ等の内部書換）。履歴に積まない
   */
  const commitTab = useCallback(
    (nextTab: string, opts: { replace?: boolean } = {}) => {
      setCurrentTab(nextTab);
      const def = TABS.find((t) => t.id === nextTab);
      if (!def) return;
      const targetHash = `#${def.hash}`;
      if (location.hash !== targetHash) {
        navigate(
          { pathname: location.pathname, search: location.search, hash: targetHash },
          { replace: opts.replace ?? false, state: location.state },
        );
      }
    },
    [navigate, location.pathname, location.search, location.hash, location.state],
  );

  // ===== us-34 患者情報タブ用：未保存検知 =====
  const [patientInfoDirty, setPatientInfoDirty] = useState(false);
  const [discardSignal, setDiscardSignal] = useState(0);
  const [pendingNav, setPendingNav] = useState<PendingNav>(null);

  const onPatientInfoDirty = useCallback((d: boolean) => setPatientInfoDirty(d), []);

  // ===== us-36 サブ A: 入退院指示（2 ボタン分割・案 2） =====
  const [admissionOrderOpen, setAdmissionOrderOpen] = useState(false);
  const [dischargeOrderOpen, setDischargeOrderOpen] = useState(false);

  // ===== us-36 サブ B: 隔離拘束指示 =====
  // ActionBar 経由起動（既定タイトル「隔離開始」）と RestraintOrderLinks 経由起動（タイトル指定）の両経路を
  // 同一 state で管理する。
  const [restraintDialog, setRestraintDialog] = useState<{
    open: boolean;
    title: string;
    editId?: string;
  }>({ open: false, title: '' });
  const openRestraintDialog = useCallback((title: string, editOrderId?: string) => {
    setRestraintDialog({ open: true, title, editId: editOrderId });
  }, []);
  const closeRestraintDialog = useCallback(() => {
    setRestraintDialog({ open: false, title: '' });
  }, []);

  // ===== us-36 サブ C: 看護記録（案 b: ep-10 流用）=====
  // ActionBar クリックで ep-10 既存 `NursingRecordDialog` を `initialMode='new'` で起動する。
  // 既存記録の閲覧は診療録タブ（MedicalRecordTab）の集約タイムラインで行う運用。
  const [nursingRecordOpen, setNursingRecordOpen] = useState(false);

  // 診療録タブの上部パネル配置: 'A' = 縦並び(従来) / 'B' = 横並び(生活歴 2fr : 診療情報 1fr)
  const [recordLayout, setRecordLayout] = useState<'A' | 'B'>('A');

  // 診療録作成ダイアログのトリガー(KarteActionBar からインクリメントで MedicalRecordTab に通知)
  const [newRecordTrigger, setNewRecordTrigger] = useState(0);

  if (!patient) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">患者が見つかりません: {patientId}</Alert>
      </Box>
    );
  }

  const performBack = () => {
    const path = determineBackPath({ navState, mode });
    navigate(path);
  };

  const handleBack = () => {
    if (patientInfoDirty) {
      setPendingNav({ type: 'back' });
      return;
    }
    performBack();
  };

  const attemptTabChange = (nextTab: string) => {
    if (nextTab === currentTab) return;
    if (patientInfoDirty && currentTab === 'patient-info') {
      setPendingNav({ type: 'tab', tabId: nextTab });
      return;
    }
    commitTab(nextTab);
  };

  const handleConfirmDiscard = () => {
    const target = pendingNav;
    setDiscardSignal((n) => n + 1);
    setPatientInfoDirty(false);
    setPendingNav(null);
    if (target?.type === 'tab') {
      commitTab(target.tabId);
    } else if (target?.type === 'back') {
      performBack();
    }
  };

  const handleCancelDiscard = () => {
    setPendingNav(null);
  };

  const handleAction = (actionId: string) => {
    if (actionId === 'close') {
      handleBack();
      return;
    }
    if (actionId === 'admission-order') {
      setAdmissionOrderOpen(true);
      return;
    }
    if (actionId === 'discharge-order') {
      setDischargeOrderOpen(true);
      return;
    }
    if (actionId === 'isolation-order') {
      // 既定タイトル「隔離開始」で起動。RestraintOrderLinks 経由のときはリンクのタイトルが渡る
      openRestraintDialog('隔離開始');
      return;
    }
    if (actionId === 'nursing-record') {
      // ep-10 既存 NursingRecordDialog を新規入力モードで開く（案 b: 流用）
      setNursingRecordOpen(true);
      return;
    }
    if (actionId === 'new-record') {
      // 診療録(SOAP/フリー)の診療録作成ダイアログを開く
      // 現在のタブが診療録でなければ自動で切替
      if (currentTab !== 'medical-record') {
        attemptTabChange('medical-record');
      }
      setNewRecordTrigger((n) => n + 1);
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
          bgcolor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          px: 1,
          pt: 0.5,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
        }}
      >
        <Tabs
          value={currentTab}
          onChange={(_, v) => attemptTabChange(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            flex: 1,
            minHeight: 40,
            '& .MuiTabs-scrollButtons': { color: '#64748b' },
            '& .MuiTab-root': {
              minHeight: 40,
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'none',
              px: 1.5,
              gap: 0.5,
              minWidth: 'auto',
              color: '#64748b',
              '&:hover': {
                color: mode === 'outpatient' ? '#16a34a' : '#1e3a5f',
                bgcolor: '#f1f5f9',
              },
            },
            '& .MuiTab-iconWrapper': {
              marginBottom: '0 !important',
              marginRight: '4px',
            },
            '& .MuiTab-root.Mui-disabled': {
              color: '#cbd5e1',
            },
            '& .MuiTab-root.Mui-selected': {
              fontWeight: 700,
              color: mode === 'outpatient' ? '#16a34a' : '#1e3a5f',
            },
            // インジケーター: アクティブタブ下に強調バー
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '2px 2px 0 0',
              backgroundColor: mode === 'outpatient' ? '#16a34a' : '#1e3a5f',
            },
          }}
        >
          {TABS.map((t) => {
            const disabled = !!t.disabledIn?.includes(mode);
            const tab = (
              <Tab
                key={t.id}
                value={t.id}
                label={t.label}
                icon={t.icon}
                iconPosition="start"
                disabled={disabled}
              />
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
        {/* 診療録タブのときだけ、生活歴・診療情報の配置切替トグルを表示 */}
        {currentTab === 'medical-record' && (
          <ToggleButtonGroup
            size="small"
            exclusive
            value={recordLayout}
            onChange={(_, v) => v && setRecordLayout(v)}
            aria-label="生活歴・診療情報の配置"
            sx={{
              mb: 0.5,
              bgcolor: '#f1f5f9',
              borderRadius: 1,
              '& .MuiToggleButton-root': {
                color: '#64748b',
                border: 'none',
                px: 1,
                py: 0.5,
                '&:hover': { bgcolor: '#e2e8f0' },
                '&.Mui-selected': {
                  bgcolor: mode === 'outpatient' ? '#16a34a' : '#1e3a5f',
                  color: '#fff',
                  '&:hover': { bgcolor: mode === 'outpatient' ? '#15803d' : '#172554' },
                },
              },
            }}
          >
            <Tooltip title="縦並び(見た目A)" disableInteractive>
              <ToggleButton value="A" aria-label="縦並び">
                <LayoutStackIcon fontSize="small" />
              </ToggleButton>
            </Tooltip>
            <Tooltip title="横並び(見た目B)" disableInteractive>
              <ToggleButton value="B" aria-label="横並び">
                <LayoutSideBySideIcon fontSize="small" />
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
        )}
      </Box>

      {/*
        フローシートタブはスティッキーヘッダがあり padding-top が「タブ直下の隙間」として
        見えてしまうため、当タブのみ pt: 0 にしてヘッダがタブ直下にぴたりと貼り付くようにする。
        他タブは padding を維持して読みやすさを保つ。
      */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          bgcolor: 'background.default',
          p: 2,
          ...(currentTab === 'flowsheet' && { pt: 0 }),
        }}
      >
        <KarteTabContent
          tabId={currentTab}
          mode={mode}
          patient={patient}
          onPatientInfoDirty={onPatientInfoDirty}
          discardSignal={discardSignal}
          onOpenOrdersTab={() => attemptTabChange('orders')}
          onOpenOrderStatusTab={() => attemptTabChange('order-status')}
          onRequestRestraintOrder={openRestraintDialog}
          recordLayout={recordLayout}
          newRecordTrigger={newRecordTrigger}
        />
      </Box>

      <KarteActionBar
        mode={mode}
        admissionState={patient.admissionState}
        onAction={handleAction}
      />

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

      {/* us-36 サブ A: 入退院指示ダイアログ（既存ダイアログを直接起動・API 変更なし） */}
      <AdmissionOrderDialog
        open={admissionOrderOpen}
        patient={patient}
        onClose={() => setAdmissionOrderOpen(false)}
      />
      <DischargeOrderDialog
        open={dischargeOrderOpen}
        patient={patient}
        onClose={() => setDischargeOrderOpen(false)}
      />

      {/* us-36 サブ B: 隔離拘束指示ダイアログ。ActionBar / 診療録カードの RestraintOrderLinks 双方の起動先 */}
      <RestraintOrderDialog
        open={restraintDialog.open}
        patient={patient}
        initialTitle={restraintDialog.title}
        editOrderId={restraintDialog.editId}
        onClose={closeRestraintDialog}
      />

      {/* us-36 サブ C: 看護記録ダイアログ（案 b: ep-10 流用）。ActionBar クリックで新規入力モードで起動 */}
      <NursingRecordDialog
        open={nursingRecordOpen}
        patientId={patient.id}
        initialMode="new"
        onClose={() => setNursingRecordOpen(false)}
      />

      {/* §10 破壊的：患者情報タブの未保存変更を破棄して離脱する確認 */}
      <Dialog
        open={!!pendingNav}
        onClose={handleCancelDiscard}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>保存していない変更があります</DialogTitle>
        <DialogContent>
          <DialogContentText>
            患者情報タブに未保存の変更があります。
            {pendingNav?.type === 'back'
              ? 'このまま戻ると変更内容は失われます。'
              : 'このまま別タブに切り替えると変更内容は失われます。'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDiscard}>編集に戻る</Button>
          <Button onClick={handleConfirmDiscard} variant="contained" color="warning">
            破棄して{pendingNav?.type === 'back' ? '戻る' : '進む'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function KarteTabContent({
  tabId,
  mode,
  patient,
  onPatientInfoDirty,
  discardSignal,
  onOpenOrdersTab,
  onOpenOrderStatusTab,
  onRequestRestraintOrder,
  recordLayout,
  newRecordTrigger,
}: {
  tabId: string;
  mode: KarteMode;
  patient: Patient;
  onPatientInfoDirty: (d: boolean) => void;
  discardSignal: number;
  onOpenOrdersTab: () => void;
  onOpenOrderStatusTab: () => void;
  onRequestRestraintOrder: (title: string, editOrderId?: string) => void;
  recordLayout: 'A' | 'B';
  newRecordTrigger: number;
}) {
  if (tabId === 'flowsheet') {
    return <FlowsheetView patientId={patient.id} />;
  }

  if (tabId === 'patient-info') {
    return (
      <PatientInfoTab
        patient={patient}
        mode={mode}
        onDirtyChange={onPatientInfoDirty}
        discardSignal={discardSignal}
      />
    );
  }

  if (tabId === 'medical-record') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* 上部パネル(生活歴 + 診療情報): A=縦、B=横(2:1)。トグルはタブバー右端 */}
        <Box
          sx={
            recordLayout === 'B'
              ? {
                  display: 'grid',
                  gap: 1.5,
                  gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, // 1280px 未満で自動的に縦並び
                  alignItems: 'stretch',
                  // 子の Paper が grid セルの高さに合わせて伸びるよう、孫要素まで高さを伝搬
                  '& > *': { height: '100%', display: 'flex', flexDirection: 'column' },
                }
              : {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }
          }
        >
          <LifeHistoryTimeline patient={patient} mode={mode} />
          <ClinicalInfoPanel patient={patient} mode={mode} />
        </Box>

        <MedicalRecordTab
          patient={patient}
          mode={mode}
          onOpenOrdersTab={onOpenOrdersTab}
          onRequestRestraintOrder={onRequestRestraintOrder}
          newRecordTrigger={newRecordTrigger}
        />
      </Box>
    );
  }

  if (tabId === 'orders') {
    return (
      <OrdersTab
        patient={patient}
        mode={mode}
        onOpenOrderStatusTab={onOpenOrderStatusTab}
      />
    );
  }

  if (tabId === 'order-status') {
    return (
      <OrderStatusTab
        patient={patient}
        mode={mode}
        onOpenOrdersTab={onOpenOrdersTab}
      />
    );
  }

  if (tabId === 'care-plan') {
    return <NursingProcessTab patient={patient} mode={mode} />;
  }

  if (tabId === 'schedule') {
    return <ScheduleTab patient={patient} mode={mode} />;
  }

  // すべての tabId が上記分岐で処理されるが、念のため未実装タブのフォールバック
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>{tabId}</Typography>
      <Typography variant="body2" color="text.secondary">未実装タブです。</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        現在 mode: <code>{mode}</code> / patientId: <code>{patient.id}</code>
      </Typography>
    </Paper>
  );
}
