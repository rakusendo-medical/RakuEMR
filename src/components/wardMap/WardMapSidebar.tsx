import React from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import {
  MeetingRoom as MeetingRoomIcon,
  HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material';
import type { WardId } from '../../types';
import { WARD_LABELS } from '../../types';
import { ADMISSION_ORDERS, PATIENTS, ROOMS } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';

interface Props {
  ward: WardId;
  /** 入院予定者の[詳細]クリック。AdmissionOrder.id を渡す（入院指示ダイアログ） */
  onOpenAdmissionSchedule: (orderId: string) => void;
  /** 入院予定者の[手続き]クリック。AdmissionOrder.id を渡す（入院手続きダイアログ）。病室確定済の行のみ */
  onOpenAdmissionProcedure: (orderId: string) => void;
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

/** 病室の決定状況バッジ。色＋アイコン＋文言で判別（色覚配慮） */
const RoomBadge: React.FC<{ decided: boolean; room: string }> = ({ decided, room }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={0.25}
    sx={{
      px: 0.5,
      py: 0.1,
      borderRadius: 0.75,
      fontSize: '0.62rem',
      fontWeight: 700,
      whiteSpace: 'nowrap',
      bgcolor: decided ? '#dcfce7' : '#fef3c7',
      color: decided ? '#166534' : '#92400e',
      border: '1px solid',
      borderColor: decided ? '#86efac' : '#fcd34d',
    }}
  >
    {decided ? (
      <MeetingRoomIcon sx={{ fontSize: '0.8rem' }} />
    ) : (
      <HelpOutlineIcon sx={{ fontSize: '0.8rem' }} />
    )}
    <span>{decided ? `${room}号室` : '病室未'}</span>
  </Stack>
);

const SmallButton: React.FC<{ label: string; onClick?: () => void }> = ({ label, onClick }) => (
  <Button
    size="small"
    variant="outlined"
    onClick={onClick}
    sx={{ fontSize: '0.62rem', minWidth: 0, px: 0.6, py: 0, lineHeight: 1.5 }}
  >
    {label}
  </Button>
);

const PersonRow: React.FC<{ name: string; onDetail?: () => void }> = ({ name, onDetail }) => (
  <Stack direction="row" alignItems="center" sx={{ py: 0.3 }}>
    <Typography variant="body2" sx={{ flex: 1, fontSize: '0.8rem' }}>
      {name}
    </Typography>
    <SmallButton label="詳細" onClick={onDetail} />
  </Stack>
);

const WardMapSidebar: React.FC<Props> = ({
  ward, onOpenAdmissionSchedule, onOpenAdmissionProcedure, onOpenAbsent,
}) => {
  const pendingOrders = useAppStore((s) => s.pendingOrders);
  const wardLabel = WARD_LABELS[ward];

  // 入院予定者: 入院オーダー済・入院手続き前（指示済／手続中）を当該病棟ぶん抽出。
  // 病棟は必須なので全件が病棟確定。病室は未定（'—'/空）の場合 [病室未] 表示。
  const scheduledAdmissions = React.useMemo(() => {
    const roomDecidedOf = (room: string) => !!room && room !== '—';
    const fromMaster = ADMISSION_ORDERS.filter(
      (o) => o.type === '入院'
        && o.wardId === ward
        && o.scheduledDate
        && o.status !== '手続完了'
        && o.status !== 'キャンセル',
    );
    const fromPending = pendingOrders.filter(
      (o) => o.type === '入院' && o.wardId === ward && o.scheduledDate,
    );
    return [...fromMaster, ...fromPending].map((o) => ({
      id: o.id,
      name: o.patientName,
      scheduledDate: o.scheduledDate,
      roomNumber: o.roomNumber,
      roomDecided: roomDecidedOf(o.roomNumber),
    }));
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
      {/* 入院予定者: 選択中病棟 / 予定日＋病室バッジ / [詳細]→入院指示, [手続き]→入院手続き(病室確定済のみ) */}
      <Paper variant="outlined" sx={{ p: 1.25 }}>
        <SectionHeader label="入院予定者" count={scheduledAdmissions.length} ward={wardLabel} />
        <Stack divider={<Box sx={{ borderBottom: '1px dashed #e2e8f0' }} />}>
          {scheduledAdmissions.slice(0, 5).map((p) => (
            <Stack key={p.id} spacing={0.25} sx={{ py: 0.4 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography sx={{ flex: 1, fontSize: '0.8rem' }} noWrap>{p.name}</Typography>
                <RoomBadge decided={p.roomDecided} room={p.roomNumber} />
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography sx={{ flex: 1, fontSize: '0.65rem', color: 'text.secondary' }}>
                  予定 {p.scheduledDate || '—'}
                </Typography>
                <SmallButton label="詳細" onClick={() => onOpenAdmissionSchedule(p.id)} />
                {p.roomDecided && (
                  <SmallButton label="手続き" onClick={() => onOpenAdmissionProcedure(p.id)} />
                )}
              </Stack>
            </Stack>
          ))}
          {scheduledAdmissions.length === 0 && (
            <Typography variant="caption" color="text.secondary">なし</Typography>
          )}
        </Stack>
      </Paper>

      {/* 不在者: 選択中病棟 / [詳細] → 外出外泊画面へ */}
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

      {/* 入院者情報: 選択中病棟 */}
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
