import { Box, Button, Stack, Tooltip } from '@mui/material';
import type { AdmissionState } from '../../types';
import type { KarteMode } from './KartePage';

interface KarteActionBarProps {
  mode: KarteMode;
  /** mode='inpatient' のとき、入院/退院指示ボタンの活性を `admissionState` で動的に決める */
  admissionState?: AdmissionState;
  onAction: (actionId: string) => void;
}

interface ActionDef {
  id: string;
  label: string;
  variant?: 'contained' | 'outlined';
  color?: 'inherit' | 'primary' | 'success' | 'error';
  disabled?: boolean;
  disabledTooltip?: string;
  alignEnd?: boolean;
}

const OUTPATIENT_ACTIONS: ActionDef[] = [
  { id: 'order-input', label: 'オーダー入力' },
  { id: 'patient-booking', label: '患者予約' },
  { id: 'print', label: '印刷', alignEnd: true },
  { id: 'close', label: '終了', variant: 'contained', color: 'error', alignEnd: true },
];

// admissionState ごとに「入院指示／退院指示」の活性を決める。
// 'discharged' は両方 disabled、'inpatient' は退院指示のみ活性、'outpatient' は入院指示のみ活性。
// 未指定は 'inpatient' 扱い。
function buildInpatientActions(admissionState?: AdmissionState): ActionDef[] {
  const state = admissionState ?? 'inpatient';
  const admissionDisabled = state !== 'outpatient';
  const dischargeDisabled = state !== 'inpatient';
  const admissionTooltip =
    state === 'inpatient' ? '既に入院中です' : state === 'discharged' ? '既に退院済です' : undefined;
  const dischargeTooltip =
    state === 'outpatient' ? '入院していません' : state === 'discharged' ? '既に退院済です' : undefined;

  return [
    {
      id: 'admission-order',
      label: '入院指示',
      disabled: admissionDisabled,
      disabledTooltip: admissionTooltip,
    },
    {
      id: 'discharge-order',
      label: '退院指示',
      disabled: dischargeDisabled,
      disabledTooltip: dischargeTooltip,
    },
    { id: 'isolation-order', label: '隔離拘束指示' },
    {
      id: 'nursing-care',
      label: '看護ケア記録',
      disabled: true,
      disabledTooltip: '段階 2 で実装予定（サブ C）',
    },
    { id: 'order-input', label: 'オーダー入力' },
    { id: 'print', label: '印刷', alignEnd: true },
    { id: 'close', label: '終了', variant: 'contained', color: 'error', alignEnd: true },
  ];
}

export default function KarteActionBar({ mode, admissionState, onAction }: KarteActionBarProps) {
  const actions =
    mode === 'outpatient' ? OUTPATIENT_ACTIONS : buildInpatientActions(admissionState);
  const left = actions.filter((a) => !a.alignEnd);
  const right = actions.filter((a) => a.alignEnd);

  const renderButton = (a: ActionDef) => {
    const button = (
      <Button
        size="small"
        variant={a.variant ?? 'outlined'}
        color={a.color ?? 'inherit'}
        disabled={a.disabled}
        onClick={() => onAction(a.id)}
      >
        {a.label}
      </Button>
    );
    if (a.disabled && a.disabledTooltip) {
      return (
        <Tooltip key={a.id} title={a.disabledTooltip} placement="top">
          <span>{button}</span>
        </Tooltip>
      );
    }
    return <Box key={a.id}>{button}</Box>;
  };

  return (
    <Box
      sx={{
        px: 2,
        py: 1,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        {left.map(renderButton)}
        <Box sx={{ flex: 1 }} />
        {right.map(renderButton)}
      </Stack>
    </Box>
  );
}
