import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Tabs, Tab, Stack, Chip, Divider, Grid,
} from '@mui/material';
import { CalendarMonth as CalendarIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { WardId } from '../../types';
import { ROOMS, PATIENTS, ADMISSION_ORDERS } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';

export type RelatedFeatureKey = 'vacancy' | 'admission-schedule' | 'absent' | 'admission-info';

interface Props {
  open: boolean;
  feature: RelatedFeatureKey | null;
  ward: WardId;
  onClose: () => void;
}

const titleMap: Record<RelatedFeatureKey, string> = {
  'vacancy': '空床照会',
  'admission-schedule': '入退院予定一覧',
  'absent': '不在者一覧',
  'admission-info': '入退院情報',
};

/**
 * us-01 の関連機能エントリ群から開く軽量ダイアログ。
 * モック段階では各機能のスタブ表示にとどめる（中身の本実装は別エピックで）。
 */
const RelatedFeatureDialogs: React.FC<Props> = ({ open, feature, ward, onClose }) => {
  const navigate = useNavigate();
  const [scheduleTab, setScheduleTab] = React.useState<'admit' | 'discharge'>('admit');

  if (!feature) return null;

  const fullScreenPath = (feature === 'admission-schedule' || feature === 'admission-info') ? '/admission' : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{titleMap[feature]}</DialogTitle>
      <DialogContent dividers>
        {feature === 'vacancy' && <VacancyContent ward={ward} />}
        {feature === 'admission-schedule' && (
          <>
            <Tabs value={scheduleTab} onChange={(_, v) => setScheduleTab(v)} sx={{ mb: 2 }}>
              <Tab value="admit" label="入院予定" />
              <Tab value="discharge" label="退院予定" />
            </Tabs>
            <AdmissionScheduleContent type={scheduleTab} ward={ward} />
          </>
        )}
        {feature === 'absent' && <AbsentContent ward={ward} />}
        {feature === 'admission-info' && <AdmissionInfoContent ward={ward} />}
      </DialogContent>
      <DialogActions>
        {fullScreenPath && (
          <Button
            startIcon={<OpenInNewIcon />}
            onClick={() => { onClose(); navigate(fullScreenPath); }}
          >
            入退院情報画面で開く
          </Button>
        )}
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
};

const VacancyContent: React.FC<{ ward: WardId }> = ({ ward }) => {
  const rooms = ROOMS.filter((r) => r.wardId === ward);
  // 参考システム仕様: 青色=使用中、白色=空床、表示のみ。
  // 各セルは、その病室の病床ごとに 1 マスを表示する想定（モックでは全日同じ占有状態を表示）
  const days = ['今日', '明日', '明後日', '3日後', '4日後', '5日後', '6日後'];
  const OCCUPIED = '#1d4ed8'; // 使用中（青）
  const EMPTY_BG = '#ffffff'; // 空床（白）
  const DISABLED = '#cbd5e1'; // 使用不可（グレー）
  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <CalendarIcon fontSize="small" color="primary" />
        <Typography variant="body2" color="text.secondary">
          カレンダー形式の空床状況（青=使用中／白=空床／グレー=使用不可・表示のみ）
        </Typography>
      </Stack>
      <Box sx={{ overflowX: 'auto' }}>
        <Box component="table" sx={{ borderCollapse: 'collapse', fontSize: '0.75rem', width: '100%' }}>
          <thead>
            <tr>
              <Box component="th" sx={{ border: '1px solid #e2e8f0', p: 1, bgcolor: '#f8fafc', textAlign: 'left' }}>病室 / 床</Box>
              {days.map((d) => (
                <Box key={d} component="th" sx={{ border: '1px solid #e2e8f0', p: 0.75, bgcolor: '#f8fafc' }}>{d}</Box>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.flatMap((r) =>
              r.beds.map((bed) => (
                <tr key={`${r.roomNumber}-${bed.bed}`}>
                  <Box component="td" sx={{ border: '1px solid #e2e8f0', p: 0.75, fontWeight: 600 }}>
                    {r.roomNumber}号室 {bed.bed}
                  </Box>
                  {days.map((d) => {
                    const bg = bed.disabled ? DISABLED : (bed.patientId ? OCCUPIED : EMPTY_BG);
                    return (
                      <Box
                        key={d}
                        component="td"
                        sx={{
                          border: '1px solid #e2e8f0',
                          p: 0.75,
                          minWidth: 36,
                          height: 28,
                          textAlign: 'center',
                          bgcolor: bg,
                        }}
                      />
                    );
                  })}
                </tr>
              )),
            )}
          </tbody>
        </Box>
      </Box>
    </Box>
  );
};

const AdmissionScheduleContent: React.FC<{ type: 'admit' | 'discharge'; ward: WardId }> = ({ type, ward }) => {
  // ADMISSION_ORDERS（マスタ） + pendingOrders（store） を結合し、種別・病棟で絞り込んで日付順に表示
  const pendingOrders = useAppStore((s) => s.pendingOrders);
  const targetType = type === 'admit' ? '入院' : '退院';

  const rows = React.useMemo(() => {
    const fromMaster = ADMISSION_ORDERS
      .filter((o) => o.type === targetType && o.wardId === ward && o.scheduledDate);
    const fromPending = pendingOrders
      .filter((o) => o.type === targetType && o.wardId === ward && o.scheduledDate);
    const merged: Array<{
      id: string; date: string; patientId: string; name: string;
      age?: number; gender?: 'M' | 'F'; ward: string; doctor: string; status: string;
    }> = [
      ...fromMaster.map((o) => {
        const p = PATIENTS.find((pt) => pt.id === o.patientId);
        return {
          id: o.id,
          date: o.scheduledDate,
          patientId: o.patientId,
          name: o.patientName,
          age: p?.age,
          gender: p?.gender,
          ward: `${o.wardId === 'ward1' ? '第１病棟' : '第２病棟'}${o.roomNumber !== '—' ? ` ${o.roomNumber}号室` : ''}`,
          doctor: o.doctorName,
          status: o.status,
        };
      }),
      ...fromPending.map((o) => {
        const p = PATIENTS.find((pt) => pt.id === o.patientId);
        return {
          id: o.id,
          date: o.scheduledDate,
          patientId: o.patientId,
          name: o.patientName,
          age: p?.age,
          gender: p?.gender,
          ward: `${o.wardId === 'ward1' ? '第１病棟' : '第２病棟'}${o.roomNumber !== '—' ? ` ${o.roomNumber}号室` : ''}`,
          doctor: o.doctorName,
          status: '指示済' as const,
        };
      }),
    ];
    // 日付昇順
    return merged.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }, [targetType, ward, pendingOrders]);

  if (rows.length === 0) {
    return <Typography variant="body2" color="text.secondary">該当する{type === 'admit' ? '入院' : '退院'}予定はありません。</Typography>;
  }

  return (
    <Stack spacing={1}>
      {rows.map((row) => (
        <Box key={row.id} sx={{ p: 1.25, border: '1px solid #e2e8f0', borderRadius: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {row.date} {row.name}
                {row.age !== undefined && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({row.age}歳{row.gender === 'M' ? '男性' : '女性'})
                  </Typography>
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {row.ward} ／ {row.doctor}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" sx={{
                fontWeight: 700,
                color: row.status === '手続完了' ? '#1d4ed8' : '#b91c1c',
              }}>
                {row.status === '手続完了' ? '確定' : '未確定'}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
};

const AbsentContent: React.FC<{ ward: WardId }> = ({ ward }) => {
  const absent = PATIENTS.filter((p) => p.wardId === ward && p.status === 'outing');
  if (absent.length === 0) {
    return <Typography variant="body2" color="text.secondary">不在者はいません。</Typography>;
  }
  return (
    <Stack spacing={1}>
      {absent.map((p) => (
        <Box key={p.id} sx={{ p: 1.25, border: '1px solid #e2e8f0', borderRadius: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {p.name}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ({p.age}歳{p.gender === 'M' ? '男性' : '女性'})
            </Typography>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {p.roomNumber}号室 {p.bedLabel} ／ {p.doctorName}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip size="small" label="外出中" sx={{ bgcolor: '#eef2ff', color: '#4338ca' }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
};

const AdmissionInfoContent: React.FC<{ ward: WardId }> = ({ ward }) => {
  const wardPatients = PATIENTS.filter((p) => p.wardId === ward);
  const total = wardPatients.length;
  const isolated = wardPatients.filter((p) => p.status === 'isolation').length;
  const restrained = wardPatients.filter((p) => p.status === 'restraint').length;
  const outing = wardPatients.filter((p) => p.status === 'outing').length;
  const observation = wardPatients.filter((p) => p.status === 'observation').length;

  const wardRooms = ROOMS.filter((r) => r.wardId === ward);
  const totalBeds = wardRooms.reduce((sum, r) => sum + r.beds.filter((b) => !b.disabled).length, 0);
  const occupiedBeds = wardRooms.reduce(
    (sum, r) => sum + r.beds.filter((b) => b.patientId).length,
    0,
  );
  const rate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const cards: { label: string; value: string }[] = [
    { label: '在院患者', value: `${total}名` },
    { label: '稼働率', value: `${rate}%` },
    { label: '稼働ベッド', value: `${occupiedBeds}/${totalBeds}床` },
    { label: '隔離中', value: `${isolated}名` },
    { label: '拘束中', value: `${restrained}名` },
    { label: '外出中', value: `${outing}名` },
    { label: '観察中', value: `${observation}名` },
  ];

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        表示病棟の入退院情報サマリ（モック表示）
      </Typography>
      <Grid container spacing={1.5}>
        {cards.map((c) => (
          <Grid item xs={6} sm={3} key={c.label}>
            <Box sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              <Typography variant="h6" fontWeight={700} color="primary.dark" sx={{ mt: 0.5 }}>
                {c.value}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary">
        ※ 入退院手続き・指示の本処理は別エピック（入退院手続き／入退院指示）で実装します。
      </Typography>
    </Box>
  );
};

export default RelatedFeatureDialogs;
