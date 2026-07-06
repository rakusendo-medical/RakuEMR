import React from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
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

// パネル共通の外枠（白背景・ヘッダーバー付きカード）
const PanelPaper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Paper
    variant="outlined"
    sx={{
      overflow: 'hidden', borderRadius: 2, border: '1px solid #d9dee6',
      bgcolor: '#fff', boxShadow: '0 1px 3px rgba(30,45,80,0.06)',
    }}
  >
    {children}
  </Paper>
);

// パネル見出し（左: ■ ラベル（N名） / 右: 病棟名）。ヘッダーバー背景付き。
const PanelHeader: React.FC<{ label: string; count?: number; ward: string }> = ({ label, count, ward }) => (
  <Box
    sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      bgcolor: '#f3f5f8', borderBottom: '1px solid #e3e7ee', px: 1.5, py: 1,
    }}
  >
    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#23324d' }}>
      ■ {label}
      {count !== undefined && (
        <Box component="span" sx={{ fontWeight: 500, color: '#6b7688' }}>（{count}名）</Box>
      )}
    </Typography>
    <Typography sx={{ fontSize: '0.68rem', color: '#6b7688', fontWeight: 600 }}>{ward}</Typography>
  </Box>
);

/** 病室の決定状況バッジ。色＋文言で判別（色覚配慮: 「病室未」/「N号室」で文言が異なる） */
const RoomBadge: React.FC<{ decided: boolean; room: string }> = ({ decided, room }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex', alignItems: 'center', borderRadius: 999,
      px: 1, py: 0.25, fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap',
      bgcolor: decided ? '#e9f2fd' : '#fdf3e3',
      color: decided ? '#2f6fd6' : '#b06e00',
    }}
  >
    {decided ? `${room}号室` : '病室未'}
  </Box>
);

// ピルボタン（outline: 詳細・参照 / filled: 手続き等の主導線）
const PillButton: React.FC<{ label: string; filled?: boolean; onClick?: () => void }> = ({ label, filled, onClick }) => (
  <Button
    onClick={onClick}
    disableElevation
    sx={{
      minWidth: 0, px: 1.25, py: 0.25, borderRadius: 999,
      fontSize: '0.68rem', fontWeight: 700, lineHeight: 1.6,
      ...(filled
        ? { bgcolor: '#2f6fd6', color: '#fff', '&:hover': { bgcolor: '#2560bd' } }
        : { border: '1px solid #c7d5ec', color: '#2f6fd6', bgcolor: '#fff', '&:hover': { bgcolor: '#f0f6ff' } }),
    }}
  >
    {label}
  </Button>
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
  const absentOther = absent.length - absentMale - absentFemale;
  const stayMale = males - absentMale;
  const stayFemale = females - absentFemale;
  const stayOther = others - absentOther;
  const total = wardPatients.length;
  const stayTotal = total - absent.length;
  const avgAge = (list: typeof wardPatients) =>
    list.length === 0 ? 0 : Math.round((list.reduce((s, p) => s + p.age, 0) / list.length) * 10) / 10;
  const avgAgeM = avgAge(wardPatients.filter((p) => p.gender === 'M'));
  const avgAgeF = avgAge(wardPatients.filter((p) => p.gender === 'F'));
  const avgAgeAll = avgAge(wardPatients);

  // 旧「入退院情報」ダイアログ（ボタン廃止）から統合した稼働・状態別集計。
  // 稼働率＝稼働ベッド/総ベッド。隔離・拘束はベッドの運用フラグで数える。
  const rate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const wardBeds = wardRooms.flatMap((r) => r.beds);
  const isolated = wardBeds.filter((b) => b.flags?.includes('isolation')).length;
  const restrained = wardBeds.filter((b) => b.flags?.includes('restraint')).length;
  // 外出（＝不在者）は 3 列内訳の「不在者」と重複するため状態別チップからは省く。
  const observation = wardPatients.filter((p) => p.status === 'observation').length;
  // 稼働率の基準日（当日）。短縮形 M/D で併記する。
  const now = new Date();
  const asOf = `${now.getMonth() + 1}/${now.getDate()}`;

  const scheduledRows = scheduledAdmissions.slice(0, 5);
  const absentRows = absent.slice(0, 4);

  // 入院者情報 3 列（患者 / 在院者 / 不在者）
  const infoCols: { label: string; total: number; m: number; f: number; o: number; color: string }[] = [
    { label: '患者', total, m: males, f: females, o: others, color: '#23324d' },
    { label: '在院者', total: stayTotal, m: stayMale, f: stayFemale, o: stayOther, color: '#23324d' },
    { label: '不在者', total: absent.length, m: absentMale, f: absentFemale, o: absentOther, color: '#e08a00' },
  ];
  // 状態別チップ（色＋ラベルで判別＝色覚配慮）
  const infoChips: { label: string; v: number; bg: string; fg: string; vc: string }[] = [
    { label: '隔離', v: isolated, bg: '#f3f5f8', fg: '#6b7688', vc: '#23324d' },
    { label: '拘束', v: restrained, bg: '#fdeef0', fg: '#b0384a', vc: '#b0384a' },
    { label: '観察', v: observation, bg: '#fdf3e3', fg: '#b06e00', vc: '#b06e00' },
  ];

  return (
    <Stack spacing={1.5}>
      {/* 入院予定者(2a): 予定日＋病室バッジ / [詳細]→入院指示, [手続き]→入院手続き(病室確定済のみ) */}
      <PanelPaper>
        <PanelHeader label="入院予定者" count={scheduledAdmissions.length} ward={wardLabel} />
        {scheduledRows.length === 0 ? (
          <Box sx={{ px: 1.5, py: 1.25 }}>
            <Typography sx={{ fontSize: '0.72rem', color: '#8a93a3' }}>なし</Typography>
          </Box>
        ) : scheduledRows.map((p, i) => (
          <Box
            key={p.id}
            sx={{ px: 1.5, py: 1.25, borderBottom: i < scheduledRows.length - 1 ? '1px solid #edf0f4' : 'none' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#23324d' }} noWrap>{p.name}</Typography>
              <RoomBadge decided={p.roomDecided} room={p.roomNumber} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.75 }}>
              <Typography sx={{ fontSize: '0.68rem', color: '#8a93a3' }}>予定 {p.scheduledDate || '—'}</Typography>
              <Stack direction="row" spacing={0.75}>
                <PillButton label="詳細" onClick={() => onOpenAdmissionSchedule(p.id)} />
                {p.roomDecided && (
                  <PillButton label="手続き" filled onClick={() => onOpenAdmissionProcedure(p.id)} />
                )}
              </Stack>
            </Box>
          </Box>
        ))}
      </PanelPaper>

      {/* 不在者(2b): 氏名＋外出中チップ / [詳細] → 外出外泊画面へ */}
      <PanelPaper>
        <PanelHeader label="不在者" count={absent.length} ward={wardLabel} />
        {absentRows.length === 0 ? (
          <Box sx={{ px: 1.5, py: 1.25 }}>
            <Typography sx={{ fontSize: '0.72rem', color: '#8a93a3' }}>なし</Typography>
          </Box>
        ) : absentRows.map((p, i) => (
          <Box
            key={p.id}
            sx={{
              px: 1.5, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: i < absentRows.length - 1 ? '1px solid #edf0f4' : 'none',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#23324d' }}>{p.name}</Typography>
              <Box
                component="span"
                sx={{ bgcolor: '#e9f2fd', color: '#2f6fd6', fontSize: '0.68rem', fontWeight: 700, borderRadius: 999, px: 1, py: 0.25 }}
              >
                外出中
              </Box>
            </Box>
            <PillButton label="詳細" onClick={onOpenAbsent} />
          </Box>
        ))}
      </PanelPaper>

      {/* 入院者情報(1b): 病床稼働バー / 患者・在院者・不在者 3列 / 状態別チップ / 平均年齢 */}
      <PanelPaper>
        <PanelHeader label="入院者情報" ward={wardLabel} />

        {/* 病床稼働 + プログレスバー */}
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '0.72rem', color: '#6b7688' }}>病床稼働</Typography>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#23324d' }}>
              {occupiedBeds}
              <Box component="span" sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#8a93a3' }}> / {totalBeds} 床</Box>
            </Typography>
          </Box>
          <Box sx={{ mt: 0.75, height: 8, bgcolor: '#edf0f4', borderRadius: 1, overflow: 'hidden' }}>
            <Box sx={{ width: `${rate}%`, height: '100%', bgcolor: '#2f6fd6', borderRadius: 1 }} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, fontSize: '0.62rem' }}>
            <Box component="span" sx={{ color: '#8a93a3' }}>本日 {asOf} 時点</Box>
            <Box component="span" sx={{ color: '#2f6fd6', fontWeight: 700 }}>稼働率 {rate}%</Box>
          </Box>
        </Box>

        {/* 患者 / 在院者 / 不在者（男女他内訳を副次表示） */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid #edf0f4', borderBottom: '1px solid #edf0f4' }}>
          {infoCols.map((c, i) => (
            <Box key={c.label} sx={{ py: 1, px: 0.25, textAlign: 'center', borderRight: i < 2 ? '1px solid #edf0f4' : 'none' }}>
              <Typography sx={{ fontSize: '0.62rem', color: '#8a93a3' }}>{c.label}</Typography>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: c.color }}>{c.total}</Typography>
              <Typography sx={{ fontSize: '0.52rem', color: '#8a93a3', whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>
                男{c.m}・女{c.f}・他{c.o}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* 状態別（隔離 / 拘束 / 観察）: 3等分で均等配置（外出は不在者列と重複のため省く） */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75, px: 1.5, py: 1.25 }}>
          {infoChips.map((s) => (
            <Box
              key={s.label}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, bgcolor: s.bg, color: s.fg, fontSize: '0.68rem', borderRadius: 999, py: 0.4 }}
            >
              {s.label} <Box component="b" sx={{ color: s.vc }}>{s.v}</Box>
            </Box>
          ))}
        </Box>

        {/* 平均年齢 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #edf0f4', px: 1.5, py: 1, fontSize: '0.68rem' }}>
          <Box component="span" sx={{ color: '#6b7688' }}>平均年齢</Box>
          <Box component="span" sx={{ color: '#23324d' }}>
            男 <b>{avgAgeM}</b> ／ 女 <b>{avgAgeF}</b> ／ 全 <b>{avgAgeAll}</b> 歳
          </Box>
        </Box>
      </PanelPaper>
    </Stack>
  );
};

export default WardMapSidebar;
