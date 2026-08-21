import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Tabs, Tab, Stack, Chip, FormControl, InputLabel, MenuItem, Select,
  IconButton, Drawer,
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Room, WardId } from '../../types';
import {
  ROOMS, PATIENTS, ADMISSION_ORDERS,
  MOVE_HISTORY_SAMPLES, applyDueMoves, applyCancelledMoves, isAbsent, bedFlagsOf, absenceLabel,
} from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';

// 'admission-info'（旧「入退院情報」ダイアログ）は ver0.16 で廃止し、
// 集計内容は病棟マップ右サイドバー「入院者情報」パネルに統合した。
export type RelatedFeatureKey = 'vacancy' | 'admission-schedule' | 'absent';

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
};

/**
 * us-01 の関連機能エントリ群から開く軽量ダイアログ。
 * モック段階では各機能のスタブ表示にとどめる（中身の本実装は別エピックで）。
 */
const RelatedFeatureDialogs: React.FC<Props> = ({ open, feature, ward, onClose }) => {
  const navigate = useNavigate();
  const [scheduleTab, setScheduleTab] = React.useState<'admit' | 'discharge'>('admit');

  // 閉じる過程(feature が null に戻る)でも内容を保持してアニメ完了させる
  const [lastFeature, setLastFeature] = React.useState<RelatedFeatureKey | null>(feature);
  React.useEffect(() => {
    if (feature) setLastFeature(feature);
  }, [feature]);
  const activeFeature = feature ?? lastFeature;

  // 各モードの open フラグ(コンポーネントは常駐マウントし、open のみで開閉してアニメを揃える)
  const drawerOpen = open && (activeFeature === 'admission-schedule' || activeFeature === 'absent');
  const dialogOpen = open && activeFeature === 'vacancy';
  const fullScreenPath = activeFeature === 'admission-schedule' ? '/admission' : null;

  const drawerTitle = activeFeature === 'admission-schedule' ? '入退院予定一覧'
    : activeFeature === 'absent' ? '不在者一覧' : '';
  const drawerSubtitle = activeFeature === 'admission-schedule' ? '入院・退院予定の患者一覧'
    : activeFeature === 'absent' ? '外出・外泊中の患者一覧' : '';

  return (
    <>
      {/* 右側 Drawer: 入退院予定 / 不在者 — UnassignedPatientsPanel と同じ構造で常駐レンダ */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={onClose}
        PaperProps={{ sx: { width: 380, p: 0 } }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700}>{drawerTitle}</Typography>
            <Typography variant="caption" color="text.secondary">{drawerSubtitle}</Typography>
          </Box>
          <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
        </Box>
        <Box sx={{ p: 1.5, overflow: 'auto', flex: 1 }}>
          {activeFeature === 'admission-schedule' && (
            <>
              <Tabs value={scheduleTab} onChange={(_, v) => setScheduleTab(v)} sx={{ mb: 1.5 }}>
                <Tab value="admit" label="入院予定" />
                <Tab value="discharge" label="退院予定" />
              </Tabs>
              <AdmissionScheduleContent type={scheduleTab} ward={ward} />
            </>
          )}
          {activeFeature === 'absent' && <AbsentContent ward={ward} />}
        </Box>
        {fullScreenPath && activeFeature === 'admission-schedule' && (
          <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              fullWidth
              startIcon={<OpenInNewIcon />}
              onClick={() => { onClose(); navigate(fullScreenPath); }}
            >
              入退院情報画面で開く
            </Button>
          </Box>
        )}
      </Drawer>

      {/* Dialog: 空床照会 — こちらも常駐レンダ */}
      <Dialog
        open={dialogOpen}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>空床照会</DialogTitle>
        <DialogContent dividers>
          {activeFeature === 'vacancy' && <VacancyContent ward={ward} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const VacancyContent: React.FC<{ ward: WardId }> = ({ ward }) => {
  const [selectedWard, setSelectedWard] = React.useState<WardId>(ward);
  const today = React.useMemo(() => new Date(), []);
  const [yearMonth, setYearMonth] = React.useState<{ y: number; m: number }>(
    () => ({ y: today.getFullYear(), m: today.getMonth() + 1 }),
  );

  const rooms = ROOMS.filter((r) => r.wardId === selectedWard);
  const daysInMonth = new Date(yearMonth.y, yearMonth.m, 0).getDate();
  // 参照を安定させる（毎 render で新配列になると、これを依存に持つ roomsByDay が
  // 病棟切替などのたびに日数ぶん再計算されてしまう）
  const days = React.useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  );

  // us-01/us-02: 在床は「その日時点」で判定する。病棟マップと同じく登録済みの移動（転棟・転室）を
  //   日付ごとに適用し、移動予定日を境に在床が入れ替わるようにする（病棟マップ・後負け判定と表示を揃える）。
  const scheduledMoves = useAppStore((s) => s.scheduledMoves);
  const moveEdits = useAppStore((s) => s.moveEdits);
  const cancelledMoveIds = useAppStore((s) => s.cancelledMoveIds);
  const allMoves = React.useMemo(
    () => [...MOVE_HISTORY_SAMPLES, ...scheduledMoves].map((m) => (moveEdits[m.id] ? { ...m, ...moveEdits[m.id] } : m)),
    [scheduledMoves, moveEdits],
  );
  /** 表示月の各日（その日の終わり時点）における在床。キーは日、値は病室配列。 */
  const roomsByDay = React.useMemo(() => {
    const map = new Map<number, Room[]>();
    for (const d of days) {
      const at = new Date(yearMonth.y, yearMonth.m - 1, d, 23, 59, 59);
      const afterDue = applyDueMoves(ROOMS, allMoves, cancelledMoveIds, at);
      map.set(d, applyCancelledMoves(afterDue, allMoves, cancelledMoveIds, at));
    }
    return map;
  }, [days, yearMonth, allMoves, cancelledMoveIds]);

  // 表示色
  const OCCUPIED = '#29b6e7'; // 使用中(明るい青)
  const EMPTY_BG = '#ffffff';
  const DISABLED = '#cbd5e1';

  // us-08: 空床照会は「予定が立った時点」で反映する。未確定（指示のみ）の入退院指示も対象とし、
  //   確定済みと未確定は色で区別しない（参考システム挙動準拠）。判定は日単位で時刻は考慮しない。
  //     入院指示（病室・ベッド指定済み）: 入院予定日「当日」から使用中
  //     退院指示                       : 退院予定日の「翌日」から空床（当日は使用中のまま）
  //   病室未割当（'—'）の入院指示は占有ベッドを特定できないため反映しない。
  const pendingOrders = useAppStore((s) => s.pendingOrders);
  const scheduleOrders = React.useMemo(() => {
    const fromMaster = ADMISSION_ORDERS
      .filter((o) => o.status !== 'キャンセル' && !!o.scheduledDate)
      // 入院指示の「手続完了」は在床（ROOMS）側に反映済みのため除外する。含めると、
      //   その患者が別病室へ移動した後も指示側が古い病室・ベッドを使用中と主張し続け、
      //   同じ患者で二重に病床を占有してしまう。
      // 退院指示は状態を問わず反映する。モックの静的な在床は退院を反映しないため、
      //   除外すると退院済みの患者がいつまでも使用中に見えてしまう。
      .filter((o) => o.type === '退院' || o.status !== '手続完了')
      .map((o) => ({
        type: o.type, patientId: o.patientId, scheduledDate: o.scheduledDate,
        wardId: o.wardId, roomNumber: o.roomNumber, bedLabel: o.bedLabel,
      }));
    const fromStore = pendingOrders
      .filter((o) => !!o.scheduledDate)
      .map((o) => ({
        type: o.type, patientId: o.patientId, scheduledDate: o.scheduledDate,
        wardId: o.wardId, roomNumber: o.roomNumber, bedLabel: o.bedLabel,
      }));
    return [...fromMaster, ...fromStore];
  }, [pendingOrders]);

  /** その日にベッドが使用中かどうか。day は表示月の日付。 */
  const occupied = (roomNumber: string, bedLabel: string, day: number): boolean => {
    const date = `${yearMonth.y}-${String(yearMonth.m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // その日時点の在床（移動反映後）を基準にする
    const bedOfDay = roomsByDay.get(day)
      ?.find((r) => r.wardId === selectedWard && r.roomNumber === roomNumber)
      ?.beds.find((b) => b.bed === bedLabel);
    // 在床患者がいる場合、退院予定日の翌日以降は空床（＝予定日当日までは使用中）
    if (bedOfDay?.patientId) {
      const discharge = scheduleOrders.find(
        (o) => o.type === '退院' && o.patientId === bedOfDay.patientId,
      );
      return !(discharge && date > discharge.scheduledDate);
    }
    // 空床の場合、当該ベッドを指定した入院予定日以降は使用中
    return scheduleOrders.some(
      (o) => o.type === '入院'
        && o.wardId === selectedWard
        && o.roomNumber === roomNumber
        && o.bedLabel === bedLabel
        && date >= o.scheduledDate,
    );
  };

  const dayColor = (day: number) => {
    const d = new Date(yearMonth.y, yearMonth.m - 1, day).getDay();
    if (d === 0) return '#dc2626'; // 日曜
    if (d === 6) return '#1d4ed8'; // 土曜
    return '#1e293b';
  };

  const changeMonth = (dir: -1 | 1) => {
    setYearMonth((cur) => {
      const m = cur.m + dir;
      if (m < 1) return { y: cur.y - 1, m: 12 };
      if (m > 12) return { y: cur.y + 1, m: 1 };
      return { y: cur.y, m };
    });
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>病棟</InputLabel>
          <Select
            label="病棟"
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value as WardId)}
          >
            <MenuItem value="ward1">第1病棟</MenuItem>
            <MenuItem value="ward2">第2病棟</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" color="text.secondary">表示月</Typography>
        <IconButton size="small" aria-label="前月" onClick={() => changeMonth(-1)}>
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <Typography
          variant="body2"
          data-testid="vacancy-year-month"
          sx={{ minWidth: 80, textAlign: 'center', fontWeight: 600 }}
        >
          {yearMonth.y}年{yearMonth.m}月
        </Typography>
        <IconButton size="small" aria-label="次月" onClick={() => changeMonth(1)}>
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box sx={{ overflow: 'auto', maxHeight: 480, border: '1px solid #e2e8f0' }}>
        <Box
          component="table"
          sx={{
            borderCollapse: 'collapse',
            fontSize: '0.7rem',
            '& th, & td': { border: '1px solid #e2e8f0' },
          }}
        >
          <thead>
            <tr>
              <Box
                component="th"
                sx={{
                  p: 0.5, bgcolor: '#f8fafc', position: 'sticky',
                  left: 0, top: 0, zIndex: 3, minWidth: 70, textAlign: 'center',
                }}
              >
                病室
              </Box>
              <Box
                component="th"
                sx={{
                  p: 0.5, bgcolor: '#f8fafc', position: 'sticky',
                  left: 70, top: 0, zIndex: 3, minWidth: 50, textAlign: 'center',
                }}
              >
                ベッド
              </Box>
              {days.map((d) => (
                <Box
                  key={d}
                  component="th"
                  sx={{
                    p: 0.5, bgcolor: '#f8fafc', position: 'sticky',
                    top: 0, zIndex: 2, minWidth: 26, textAlign: 'center',
                    color: dayColor(d), fontWeight: 700,
                  }}
                >
                  {d}
                </Box>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.flatMap((r) =>
              r.beds.map((bed, bedIdx) => (
                <tr key={`${r.roomNumber}-${bed.bed}`}>
                  {bedIdx === 0 && (
                    <Box
                      component="td"
                      rowSpan={r.beds.length}
                      sx={{
                        p: 0.5, bgcolor: '#f8fafc', position: 'sticky',
                        left: 0, zIndex: 1, fontWeight: 600, textAlign: 'center',
                        verticalAlign: 'top',
                      }}
                    >
                      {r.roomNumber}号室
                    </Box>
                  )}
                  <Box
                    component="td"
                    sx={{
                      p: 0.5, bgcolor: '#f8fafc', position: 'sticky',
                      left: 70, zIndex: 1, textAlign: 'center',
                    }}
                  >
                    {bed.bed}
                  </Box>
                  {days.map((d) => {
                    const state = bed.bedStatus === 'unavailable'
                      ? '使用不可'
                      : occupied(r.roomNumber, bed.bed, d) ? '使用中' : '空床';
                    const bg = state === '使用不可' ? DISABLED : state === '使用中' ? OCCUPIED : EMPTY_BG;
                    const cellDate = `${yearMonth.y}/${String(yearMonth.m).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
                    // 色だけでは状態が伝わらないため、ツールチップ（title）と読み上げ名（aria-label）の
                    // 両方に同じ説明を持たせる（title は環境によって読み上げられないため）
                    const cellLabel = `${cellDate} ${r.roomNumber}号室 ${bed.bed} ${state}`;
                    return (
                      <Box
                        key={d}
                        component="td"
                        title={cellLabel}
                        aria-label={cellLabel}
                        sx={{ height: 22, bgcolor: bg }}
                      />
                    );
                  })}
                </tr>
              )),
            )}
          </tbody>
        </Box>
      </Box>

      <Box sx={{ mt: 1.5, fontSize: '0.7rem', color: 'text.secondary' }}>
        <div>青色は、使用されているベッドを表します。</div>
        <div>白色は空床状態を表します。灰色は使用不可のベッドです。</div>
        <div>
          未確定の入退院指示も反映します（入院指示は予定日当日から使用中、退院指示は予定日の翌日から空床。日単位で判定）。
        </div>
        <div style={{ fontWeight: 700 }}>表示のみで、ベッドの選択はできません。</div>
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
  const absent = PATIENTS.filter((p) => p.wardId === ward && isAbsent(bedFlagsOf(p)));
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
            <Chip size="small" label={absenceLabel(bedFlagsOf(p))} sx={{ bgcolor: '#eef2ff', color: '#4338ca' }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
};


export default RelatedFeatureDialogs;
