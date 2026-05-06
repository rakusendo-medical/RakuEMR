import { Box, Button, Stack, Tooltip } from '@mui/material';
import type { KarteMode } from './KartePage';

interface KarteActionBarProps {
  mode: KarteMode;
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

const INPATIENT_ACTIONS: ActionDef[] = [
  {
    id: 'admission-order',
    label: '入退院指示',
    disabled: true,
    disabledTooltip: '段階 2 で実装予定',
  },
  {
    id: 'isolation-order',
    label: '隔離拘束指示',
    disabled: true,
    disabledTooltip: '段階 2 で実装予定',
  },
  {
    id: 'nursing-care',
    label: '看護ケア記録',
    disabled: true,
    disabledTooltip: '段階 2 で実装予定',
  },
  { id: 'order-input', label: 'オーダー入力' },
  { id: 'print', label: '印刷', alignEnd: true },
  { id: 'close', label: '終了', variant: 'contained', color: 'error', alignEnd: true },
];

export default function KarteActionBar({ mode, onAction }: KarteActionBarProps) {
  const actions = mode === 'outpatient' ? OUTPATIENT_ACTIONS : INPATIENT_ACTIONS;
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
