// ===== ep-07 観察記録 =====
// フローシート（ep-10 FlowsheetPage）の「隔離拘束」タブから呼び出される観察マトリクス。
// S3 (ep-10) との契約シグネチャ: { patientId: string; dates: ISODate[] }
// 7 日 × 24 時間 × 区分（隔離 / 拘束 / その他）の観察マトリクスを表示し、
// セルクリックで個別観察記録ダイアログ（ObservationRecordDialog）を起動する。
//
// 同時間帯で隔離と拘束が重複する場合は **拘束を優先表示**（spec us-13 AC-8）。
// 開放時間に該当する時間枠には開放時間アイコンを重畳表示（spec AC-9）。
//
// 連携先メモ:
// - 配置: FlowsheetPage の isolation タブから直接 import される
import React from 'react';
import { Box, Stack, Typography, Tooltip, Chip, Paper } from '@mui/material';
import {
  LockClock as LockClockIcon,
} from '@mui/icons-material';
import type { IsolationOrder, IsolationSubtype, ObservationRecord, Patient } from '../../types';
import {
  ISOLATION_ORDERS, MASTER_OBSERVATION_STATES, MASTER_OBSERVATION_FREQUENCY, PATIENTS,
} from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import ObservationRecordDialog from './ObservationRecordDialog';

interface Props {
  /** 患者 ID */
  patientId: string;
  /** 表示対象日（YYYY-MM-DD、降順または昇順、最大 7 日想定） */
  dates: string[];
}

/** subtype 取り出し（後方互換: `type` から導出） */
function getSubtype(o: IsolationOrder): IsolationSubtype {
  return o.subtype ?? (o.type === '隔離' ? '隔離' : '拘束');
}

/** 隔離拘束指示が指定日時で active か（解除済の場合は終了日時より前のみ） */
function isActiveAt(o: IsolationOrder, dateStr: string, hour: number): boolean {
  const target = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00`).getTime();
  const start = new Date(o.startDatetime.replace(' ', 'T')).getTime();
  if (target < start) return false;
  if (o.endDatetime) {
    const end = new Date(o.endDatetime.replace(' ', 'T')).getTime();
    if (target > end) return false;
  }
  return true;
}

/** 開放時間に該当するか（HH:mm の比較） */
function isInRelease(o: IsolationOrder, hour: number): boolean {
  if (!o.releaseTimes || o.releaseTimes.length === 0) return false;
  const hh = `${String(hour).padStart(2, '0')}:00`;
  return o.releaseTimes.some((r) => r.start <= hh && hh < r.end);
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const RestraintObservationMatrix: React.FC<Props> = ({ patientId, dates }) => {
  const dynamicOrders = useAppStore((s) => s.dynamicIsolationOrders);
  const dynamicObservations = useAppStore((s) => s.dynamicObservationRecords);
  const futureBlock = useAppStore((s) => s.optionalFeatures.observationFutureBlock);

  const patient: Patient | undefined = React.useMemo(
    () => PATIENTS.find((p) => p.id === patientId),
    [patientId],
  );

  // 患者の指示集合（マスタ + dynamic マージ、同 id は dynamic 優先）
  const orders = React.useMemo<IsolationOrder[]>(() => {
    const merged = new Map<string, IsolationOrder>();
    [...ISOLATION_ORDERS, ...dynamicOrders].forEach((o) => {
      if (o.patientId === patientId) merged.set(o.id, o);
    });
    return Array.from(merged.values());
  }, [patientId, dynamicOrders]);

  // 患者の観察記録
  const observations = React.useMemo(
    () => dynamicObservations.filter((r) => r.patientId === patientId),
    [dynamicObservations, patientId],
  );

  const [dialog, setDialog] = React.useState<{
    open: boolean; date: string; hour: number; subtype: IsolationSubtype | 'その他'; isolationOrderId?: string;
  } | null>(null);

  const onCellClick = (date: string, hour: number, subtype: IsolationSubtype | 'その他', orderId?: string) => {
    setDialog({ open: true, date, hour, subtype, isolationOrderId: orderId });
  };

  const renderCell = (date: string, hour: number) => {
    const target = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`).getTime();
    const isFuture = target > Date.now();
    // 当時間帯で active な指示
    const activeOrders = orders.filter((o) => isActiveAt(o, date, hour));
    if (activeOrders.length === 0) {
      return (
        <Box
          sx={{
            height: 28, bgcolor: '#f8fafc', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0',
          }}
          aria-label="入力対象外"
        />
      );
    }
    // 拘束優先
    const restraint = activeOrders.find((o) => getSubtype(o) === '拘束' || getSubtype(o) === '隔離拘束');
    const isolation = activeOrders.find((o) => getSubtype(o) === '隔離');
    const primary = restraint ?? isolation!;
    const subtype = getSubtype(primary);
    const matchedRelease = primary.releaseTimes && isInRelease(primary, hour);

    // 該当時間帯の観察記録（複数回数分）
    const recordsInHour = observations.filter((r) => r.date === date && r.time.startsWith(`${String(hour).padStart(2, '0')}:`));
    const lastState = recordsInHour.length > 0 ? recordsInHour[recordsInHour.length - 1].state : '未記入';
    const stateConf = MASTER_OBSERVATION_STATES.find((s) => s.state === lastState);

    const disabled = futureBlock && isFuture;

    return (
      <Tooltip
        title={
          disabled
            ? '未来日入力不可（マスタ設定）'
            : `${date} ${String(hour).padStart(2, '0')}:00 / ${subtype} / ${MASTER_OBSERVATION_FREQUENCY[subtype === '隔離拘束' ? '拘束' : (subtype as '隔離' | '拘束')] ?? 1}回${matchedRelease ? ' / 開放時間' : ''}`
        }
        arrow
      >
        <Box
          onClick={disabled ? undefined : () => onCellClick(date, hour, subtype, primary.id)}
          sx={{
            position: 'relative',
            height: 28,
            bgcolor: disabled ? '#e2e8f0' : (stateConf?.bgColor ?? '#fff'),
            borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6rem', color: stateConf?.color,
            '&:hover': disabled ? {} : { boxShadow: 'inset 0 0 0 2px #2563eb' },
          }}
        >
          {recordsInHour.length > 0 && lastState !== '未記入' ? lastState.substring(0, 2) : ''}
          {matchedRelease && (
            <LockClockIcon sx={{ position: 'absolute', top: 1, right: 1, fontSize: 10, color: '#dc2626' }} />
          )}
        </Box>
      </Tooltip>
    );
  };

  if (!patient) {
    return <Typography variant="caption" color="text.secondary">患者が見つかりません</Typography>;
  }

  return (
    <>
      <Paper variant="outlined" sx={{ p: 1, overflow: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            隔離拘束観察マトリクス（{patient.name}）
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1} alignItems="center">
            {MASTER_OBSERVATION_STATES.filter((s) => s.state !== '未記入').map((s) => (
              <Stack key={s.state} direction="row" spacing={0.3} alignItems="center">
                <Box sx={{ width: 10, height: 10, bgcolor: s.bgColor, border: '1px solid #cbd5e1' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                  {s.state}
                </Typography>
              </Stack>
            ))}
            <Tooltip title="開放時間アイコン">
              <LockClockIcon sx={{ fontSize: 14, color: '#dc2626' }} />
            </Tooltip>
          </Stack>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: `90px repeat(${HOURS.length}, 1fr)`, minWidth: 600 }}>
          <Box sx={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', bgcolor: '#f1f5f9', p: 0.3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem' }}>日付 / 時刻</Typography>
          </Box>
          {HOURS.map((h) => (
            <Box key={h} sx={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', bgcolor: '#f1f5f9', textAlign: 'center', p: 0.2 }}>
              <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>{h}</Typography>
            </Box>
          ))}
          {dates.map((d) => (
            <React.Fragment key={d}>
              <Box sx={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', p: 0.3 }}>
                <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{d.slice(5)}</Typography>
              </Box>
              {HOURS.map((h) => (
                <React.Fragment key={`${d}-${h}`}>{renderCell(d, h)}</React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </Box>
        {orders.length === 0 && (
          <Box sx={{ mt: 1 }}>
            <Chip label="この患者には active な隔離・拘束指示がありません" size="small" />
          </Box>
        )}
      </Paper>

      {dialog && patient && (
        <ObservationRecordDialog
          open={dialog.open}
          onClose={() => setDialog(null)}
          patient={{ id: patient.id, name: patient.name, age: patient.age, wardId: patient.wardId }}
          date={dialog.date}
          hour={dialog.hour}
          subtype={dialog.subtype}
          isolationOrderId={dialog.isolationOrderId}
        />
      )}
    </>
  );
};

export default RestraintObservationMatrix;
