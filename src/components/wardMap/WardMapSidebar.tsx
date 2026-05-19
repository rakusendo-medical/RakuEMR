import React from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import type { WardId } from '../../types';
import { WARD_LABELS } from '../../types';
import { ADMISSION_ORDERS, PATIENTS, ROOMS, UNASSIGNED_PATIENTS } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';

interface Props {
  ward: WardId;
  /** 未割当者の[詳細]クリック。id を渡して個別ダイアログ起動 */
  onOpenUnassigned: (unassignedId: string) => void;
  /** 入院予定の[詳細]クリック。AdmissionOrder.id を渡す */
  onOpenAdmissionSchedule: (orderId: string) => void;
  /** 不在者の[詳細]クリック。外出外泊画面へ */
  onOpenAbsent: () => void;
}

const SectionHeader: React.FC<{
  label: string;
  count: number;
  ward?: string;
}> = ({ label, count, ward }) => (
  <Stack direction="row" alignItems="baseline" sx={{ mb: 0.5 }}>
    <Typography
      sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e3a5f', flex: 1 }}
    >
      ■ {label}({count}名)
    </Typography>
    {ward && (
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>
        {ward}
      </Typography>
    )}
  </Stack>
);

const PersonRow: React.FC<{ name: string; onDetail?: () => void }> = ({ name, onDetail }) => (
  <Stack direction="row" alignItems="center" sx={{ py: 0.3 }}>
    <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
      {name}
    </Typography>
    <Button
      size="small" variant="outlined"
      onClick={onDetail}
      sx={{ fontSize: '0.65rem', minWidth: 0, px: 0.75, py: 0, lineHeight: 1.5 }}
    >
      詳細
    </Button>
  </Stack>
);

const WardMapSidebar: React.FC<Props> = ({
  ward, onOpenUnassigned, onOpenAdmissionSchedule, onOpenAbsent,
}) => {
  const pendingOrders = useAppStore((s) => s.pendingOrders);
  const wardLabel = WARD_LABELS[ward];

  // 未割当者(病棟切替に影響されない・全患者対象)
  const unassigned = UNASSIGNED_PATIENTS;

  // 入院予定: ADMISSION_ORDERS + pendingOrders(store) から、当該病棟の入院予定を抽出
  const scheduledAdmissions = React.useMemo(() => {
    const fromMaster = ADMISSION_ORDERS
      .filter((o) => o.type === '入院' && o.wardId === ward && o.scheduledDate);
    const fromPending = pendingOrders
      .filter((o) => o.type === '入院' && o.wardId === ward && o.scheduledDate);
    return [
      ...fromMaster.map((o) => ({ id: o.id, name: o.patientName })),
      ...fromPending.map((o) => ({ id: o.id, name: o.patientName })),
    ];
  }, [ward, pendingOrders]);

  // 不在者
  const absent = PATIENTS.filter((p) => p.wardId === ward && p.status === 'outing');

  // 入院者情報(病棟集計)
  const wardPatients = PATIENTS.filter((p) => p.wardId === ward);
  const wardRooms = ROOMS.filter((r) => r.wardId === ward);
  const totalBeds = wardRooms.reduce((sum, r) => sum + r.beds.filter((b) => !b.disabled).length, 0);
  const occupiedBeds = wardRooms.reduce(
    (sum, r) => sum + r.beds.filter((b) => b.patientId).length, 0,
  );
  const males = wardPatients.filter((p) => p.gender === 'M').length;
  const females = wardPatients.filter((p) => p.gender === 'F').length;
  const others = wardPatients.length - males - females;
  const absentMale = absent.filter((p) => p.gender === 'M').length;
  const absentFemale = absent.filter((p) => p.gender === 'F').length;
  const stayMale = males - absentMale;
  const stayFemale = females - absentFemale;
  const avgAge = (list: typeof wardPatients) =>
    list.length === 0 ? 0 : Math.round((list.reduce((s, p) => s + p.age, 0) / list.length) * 10) / 10;
  const avgAgeM = avgAge(wardPatients.filter((p) => p.gender === 'M'));
  const avgAgeF = avgAge(wardPatients.filter((p) => p.gender === 'F'));
  const avgAgeAll = avgAge(wardPatients);

  return (
    <Stack spacing={1.5}>
      {/* 未割当者: 病棟横断 / [詳細] → 入院手続き */}
      <Paper variant="outlined" sx={{ p: 1.25 }}>
        <SectionHeader label="未割当者" count={unassigned.length} ward="全体" />
        <Stack>
          {unassigned.slice(0, 4).map((p) => (
            <PersonRow key={p.id} name={p.name} onDetail={() => onOpenUnassigned(p.id)} />
          ))}
          {unassigned.length === 0 && (
            <Typography variant="caption" color="text.secondary">なし</Typography>
          )}
        </Stack>
      </Paper>

      {/* 入院予定: 病棟別 / [詳細] → 入院指示 */}
      <Paper variant="outlined" sx={{ p: 1.25 }}>
        <SectionHeader label="入院予定" count={scheduledAdmissions.length} ward={wardLabel} />
        <Stack>
          {scheduledAdmissions.slice(0, 4).map((p) => (
            <PersonRow key={p.id} name={p.name} onDetail={() => onOpenAdmissionSchedule(p.id)} />
          ))}
          {scheduledAdmissions.length === 0 && (
            <Typography variant="caption" color="text.secondary">なし</Typography>
          )}
        </Stack>
      </Paper>

      {/* 不在者: 病棟別 / [詳細] → 外出外泊画面へ */}
      <Paper variant="outlined" sx={{ p: 1.25 }}>
        <SectionHeader label="不在者" count={absent.length} ward={wardLabel} />
        <Stack>
          {absent.slice(0, 4).map((p) => (
            <PersonRow key={p.id} name={p.name} onDetail={onOpenAbsent} />
          ))}
          {absent.length === 0 && (
            <Typography variant="caption" color="text.secondary">なし</Typography>
          )}
        </Stack>
      </Paper>

      {/* 入院者情報: 病棟別 */}
      <Paper
        variant="outlined"
        sx={{ p: 1.25, border: '1px solid #d97706', bgcolor: '#fffbeb' }}
      >
        <Stack direction="row" alignItems="baseline" sx={{ mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e3a5f', flex: 1 }}>
            ■ 入院者情報
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>
            {wardLabel}
          </Typography>
        </Stack>
        <Typography sx={{ textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', mb: 0.5 }}>
          病床 {occupiedBeds} / {totalBeds}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr 0.6fr 0.6fr', columnGap: 0.5, fontSize: '0.7rem' }}>
          <Box />
          <Box sx={{ textAlign: 'right', color: 'text.secondary' }}>男</Box>
          <Box sx={{ textAlign: 'right', color: 'text.secondary' }}>女</Box>
          <Box sx={{ textAlign: 'right', color: 'text.secondary' }}>他</Box>
          <Box>患者</Box>
          <Box sx={{ textAlign: 'right', fontWeight: 600 }}>{males}</Box>
          <Box sx={{ textAlign: 'right', fontWeight: 600 }}>{females}</Box>
          <Box sx={{ textAlign: 'right', fontWeight: 600 }}>{others}</Box>
          <Box>不在者</Box>
          <Box sx={{ textAlign: 'right' }}>{absentMale}</Box>
          <Box sx={{ textAlign: 'right' }}>{absentFemale}</Box>
          <Box sx={{ textAlign: 'right' }}>0</Box>
          <Box>在院者</Box>
          <Box sx={{ textAlign: 'right' }}>{stayMale}</Box>
          <Box sx={{ textAlign: 'right' }}>{stayFemale}</Box>
          <Box sx={{ textAlign: 'right' }}>0</Box>
        </Box>
        <Box sx={{ mt: 0.75, fontSize: '0.7rem' }}>
          <Box>平均年齢(男) <strong>{avgAgeM}歳</strong></Box>
          <Box>平均年齢(女) <strong>{avgAgeF}歳</strong></Box>
          <Box>平均年齢(全) <strong>{avgAgeAll}歳</strong></Box>
        </Box>
      </Paper>
    </Stack>
  );
};

export default WardMapSidebar;
