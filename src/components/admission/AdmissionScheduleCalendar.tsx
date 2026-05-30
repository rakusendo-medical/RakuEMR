import React from 'react';
import {
  Box, Stack, Typography, Tabs, Tab, FormControl, Select, MenuItem, InputLabel,
  Button, IconButton, Paper, Divider, Tooltip,
} from '@mui/material';
import { ChevronLeft, ChevronRight, Today as TodayIcon, InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { AdmissionOrder, WardId } from '../../types';
import { ADMISSION_ORDERS, PATIENTS, patientNumberOf } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import AdmissionConfirmDialog from './AdmissionConfirmDialog';
import DischargeConfirmDialog from './DischargeConfirmDialog';
import RelatedFeatureDialogs from '../wardMap/RelatedFeatureDialogs';
import type { KartePageLocationState } from '../karte/KartePage';

type ScheduleType = '入院' | '退院';
type WardFilter = WardId | 'all';

const monthLabel = (d: Date) => `${d.getFullYear()}年${d.getMonth() + 1}月`;
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
const formatYMD = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const AdmissionScheduleCalendar: React.FC = () => {
  const navigate = useNavigate();
  const confirmedAdmissionIds = useAppStore((s) => s.confirmedAdmissionIds);
  const setSelectedPatient = useAppStore((s) => s.setSelectedPatient);

  const [type, setType] = React.useState<ScheduleType>('入院');
  const [ward, setWard] = React.useState<WardFilter>('all');
  const [month, setMonth] = React.useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [admissionOrder, setAdmissionOrder] = React.useState<AdmissionOrder | null>(null);
  const [dischargeOrder, setDischargeOrder] = React.useState<AdmissionOrder | null>(null);
  const [vacancyOpen, setVacancyOpen] = React.useState(false);

  const pendingOrders = useAppStore((s) => s.pendingOrders);

  const orders = React.useMemo(() => {
    const fromMaster: AdmissionOrder[] = ADMISSION_ORDERS;
    const fromStore: AdmissionOrder[] = pendingOrders.map((p) => ({
      id: p.id,
      patientId: p.patientId,
      patientName: p.patientName,
      type: p.type,
      status: '指示済',
      scheduledDate: p.scheduledDate,
      doctorName: p.doctorName,
      roomNumber: p.roomNumber,
      bedLabel: p.bedLabel,
      wardId: p.wardId,
    }));
    return [...fromMaster, ...fromStore]
      .filter((o) => o.type === type)
      .filter((o) => ward === 'all' || o.wardId === ward);
  }, [type, ward, pendingOrders]);

  const undated = orders.filter((o) => !o.scheduledDate);
  const dated = orders.filter((o) => o.scheduledDate);

  // 確定済か判定（status === '手続完了' または 当セッションで confirm された）
  const isConfirmed = (o: AdmissionOrder) => o.status === '手続完了' || confirmedAdmissionIds.includes(o.id);

  // カレンダー用に日付ごとにグルーピング
  const byDate = React.useMemo(() => {
    const map = new Map<string, AdmissionOrder[]>();
    for (const o of dated) {
      const d = new Date(o.scheduledDate);
      if (d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth()) {
        const key = formatYMD(d);
        const arr = map.get(key) ?? [];
        arr.push(o);
        map.set(key, arr);
      }
    }
    return map;
  }, [dated, month]);

  const handlePatientClick = (o: AdmissionOrder) => {
    if (isConfirmed(o)) {
      // 確定済 → カルテへ
      const patient = PATIENTS.find((p) => p.id === o.patientId);
      if (patient) {
        setSelectedPatient(patient);
        navigate(`/karte/${patient.id}`, { state: { from: 'patient-list' } satisfies KartePageLocationState });
      }
      return;
    }
    if (o.type === '入院') {
      setAdmissionOrder(o);
    } else {
      setDischargeOrder(o);
    }
  };

  const goPrevMonth = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const goNextMonth = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  const goToday = () => {
    const d = new Date();
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  // カレンダーマス組立
  const firstDow = startOfMonth(month).getDay();
  const totalDays = daysInMonth(month);
  const cells: Array<{ key: string; date: Date | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ key: `pad-${i}`, date: null });
  for (let d = 1; d <= totalDays; d++) cells.push({ key: `d-${d}`, date: new Date(month.getFullYear(), month.getMonth(), d) });
  while (cells.length % 7 !== 0) cells.push({ key: `tail-${cells.length}`, date: null });

  const today = new Date();
  const isToday = (d: Date) => d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();

  return (
    <Box>
      {/* ヘッダー */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
        <Tabs value={type} onChange={(_, v) => setType(v)}>
          <Tab value="入院" label="入院予定" />
          <Tab value="退院" label="退院予定" />
        </Tabs>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>病棟</InputLabel>
          <Select label="病棟" value={ward} onChange={(e) => setWard(e.target.value as WardFilter)}>
            <MenuItem value="all">全病棟</MenuItem>
            <MenuItem value="ward1">第１病棟</MenuItem>
            <MenuItem value="ward2">第２病棟</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={0.5} alignItems="center">
          <IconButton size="small" onClick={goPrevMonth} aria-label="前月"><ChevronLeft /></IconButton>
          <Button size="small" variant="outlined" startIcon={<TodayIcon />} onClick={goToday}>現在</Button>
          <IconButton size="small" onClick={goNextMonth} aria-label="翌月"><ChevronRight /></IconButton>
          <Typography variant="subtitle1" fontWeight={700} sx={{ ml: 1, minWidth: 100 }}>
            {monthLabel(month)}
          </Typography>
        </Stack>
      </Stack>

      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        {/* カレンダー */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* 凡例（カレンダー右上・実セル配色と揃え） */}
          <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center" sx={{ mb: 0.75, flexWrap: 'wrap', rowGap: 0.5 }}>
            <Tooltip
              title={
                <Box sx={{ fontSize: '0.7rem', lineHeight: 1.5 }}>
                  色は次に行う操作（クリック挙動）を表します。<br />
                  ・確定済（青/黒）= クリックでカルテへ遷移<br />
                  ・未確定（赤）= クリックで入退院手続きダイアログを表示<br />
                  ※ us-07 仕様準拠（状態依存遷移）
                </Box>
              }
              arrow
              placement="bottom-end"
            >
              <Stack direction="row" spacing={0.3} alignItems="center" sx={{ color: 'text.disabled', cursor: 'help', mr: 0.5 }}>
                <InfoOutlinedIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption" sx={{ fontStyle: 'italic' }}>凡例 = 次の操作</Typography>
              </Stack>
            </Tooltip>
            <LegendChip label="入院確定" color="#1d4ed8" bgcolor="#eff6ff" />
            <LegendChip label="退院確定" color="#0f172a" bgcolor="#eff6ff" />
            <LegendChip label="未確定（指示）" color="#b91c1c" bgcolor="#fef2f2" />
            <LegendChip label="今日" color="primary.main" bgcolor="#eff6ff" bordered />
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
            {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
              <Box key={d} sx={{ textAlign: 'center', py: 0.5, fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', bgcolor: '#f8fafc', borderRadius: 0.5 }}>
                {d}
              </Box>
            ))}
            {cells.map((c) => {
              if (!c.date) return <Box key={c.key} sx={{ minHeight: 90 }} />;
              const key = formatYMD(c.date);
              const dayOrders = byDate.get(key) ?? [];
              return (
                <Box
                  key={c.key}
                  sx={{
                    minHeight: 90,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 0.5,
                    p: 0.5,
                    bgcolor: isToday(c.date) ? '#eff6ff' : 'background.paper',
                    overflow: 'hidden',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: isToday(c.date) ? 700 : 500, color: isToday(c.date) ? 'primary.main' : 'text.secondary' }}>
                    {c.date.getDate()}
                  </Typography>
                  <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                    {dayOrders.map((o) => {
                      const confirmed = isConfirmed(o);
                      return (
                        <Tooltip key={o.id} title={`${o.patientName} (${o.patientId}) / ${o.doctorName}`} arrow>
                          <Box
                            onClick={() => handlePatientClick(o)}
                            sx={{
                              cursor: 'pointer',
                              fontSize: '0.6875rem',
                              color: confirmed
                                ? (type === '入院' ? '#1d4ed8' : '#0f172a')
                                : '#b91c1c',
                              fontWeight: 600,
                              lineHeight: 1.3,
                              borderRadius: 0.5,
                              px: 0.5,
                              py: 0.25,
                              bgcolor: confirmed ? '#eff6ff' : '#fef2f2',
                              '&:hover': { bgcolor: confirmed ? '#dbeafe' : '#fee2e2' },
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {o.patientName}
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Stack>
                </Box>
              );
            })}
          </Box>

        </Box>

        {/* 日付未定者パネル */}
        <Paper variant="outlined" sx={{ width: 280, p: 1.25 }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
              日付未定者
            </Typography>
            <Typography variant="caption" color="text.secondary">{undated.length}件</Typography>
          </Stack>
          <Divider sx={{ mb: 1 }} />
          {undated.length === 0 && (
            <Typography variant="caption" color="text.secondary">該当なし</Typography>
          )}
          {undated.map((o) => (
            <Box
              key={o.id}
              onClick={() => handlePatientClick(o)}
              sx={{
                p: 1, mb: 0.75,
                border: '1px solid', borderColor: 'divider', borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#f0f7ff' },
              }}
            >
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
                {patientNumberOf(o.patientId)}
              </Typography>
              <Typography variant="body2" fontWeight={600}>{o.patientName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {o.wardId === 'ward1' ? '第１病棟' : '第２病棟'} ／ {o.doctorName}
              </Typography>
            </Box>
          ))}
        </Paper>
      </Box>

      <AdmissionConfirmDialog
        open={!!admissionOrder}
        order={admissionOrder}
        onClose={() => setAdmissionOrder(null)}
        onConfirmed={() => setAdmissionOrder(null)}
        onOpenVacancy={() => setVacancyOpen(true)}
      />

      <DischargeConfirmDialog
        open={!!dischargeOrder}
        order={dischargeOrder}
        onClose={() => setDischargeOrder(null)}
        onConfirmed={() => setDischargeOrder(null)}
      />

      <RelatedFeatureDialogs
        open={vacancyOpen}
        feature={vacancyOpen ? 'vacancy' : null}
        ward={ward === 'all' ? 'ward1' : ward}
        onClose={() => setVacancyOpen(false)}
      />
    </Box>
  );
};

const LegendChip: React.FC<{ label: string; color: string; bgcolor: string; bordered?: boolean }> = ({ label, color, bgcolor, bordered }) => (
  <Box
    sx={{
      fontSize: '0.6875rem',
      fontWeight: 600,
      color,
      bgcolor,
      px: 0.75,
      py: 0.25,
      borderRadius: 0.5,
      border: bordered ? '1px solid' : 'none',
      borderColor: bordered ? 'divider' : 'transparent',
      lineHeight: 1.3,
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </Box>
);

export default AdmissionScheduleCalendar;
