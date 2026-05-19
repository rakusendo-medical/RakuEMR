import React, { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Paper, Typography, Stack, Select, MenuItem, FormControl, InputLabel,
  TextField, Button, Tooltip, Alert, Link as MuiLink,
  Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel,
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import { PATIENTS } from '../../../data/mockData';
import { useFlowsheetStore } from '../store';
import { FLOWSHEET_WARDS, MASTER_SLEEP_STATES, TODAY } from '../mockData';
import type { ISODate, SleepLog } from '../types';

// 12 時間軸: 21:00 〜 翌 08:59（1 時間刻み）
const HOUR_SLOTS: { hour: number; offsetDay: 0 | 1; label: string }[] = (() => {
  const slots: { hour: number; offsetDay: 0 | 1; label: string }[] = [];
  for (let h = 21; h <= 23; h++) slots.push({ hour: h, offsetDay: 0, label: `${h}:00` });
  for (let h = 0; h <= 8; h++) slots.push({ hour: h, offsetDay: 1, label: `${String(h).padStart(2, '0')}:00` });
  return slots;
})();

const slotIso = (date: ISODate, hour: number, offsetDay: 0 | 1): string => {
  const d = new Date(date);
  d.setDate(d.getDate() + offsetDay);
  d.setHours(hour, 0, 0, 0);
  // ISO local 風（タイムゾーン非依存簡易）
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:00:00`;
};

const STATE_COLOR: Record<string, string> = {
  '入眠': '#1d4ed8',
  '覚醒': '#16a34a',
  '離床': '#f59e0b',
  '中途覚醒': '#dc2626',
  '不穏': '#9333ea',
};

interface CellTarget {
  patientId: string;
  hour: number;
  offsetDay: 0 | 1;
}

const SleepTablePage: React.FC = () => {
  const currentStaffId = useFlowsheetStore((s) => s.currentStaffId);
  const staffs = useFlowsheetStore((s) => s.staffs);
  const sleepLogs = useFlowsheetStore((s) => s.sleepLogs);
  const addSleepLog = useFlowsheetStore((s) => s.addSleepLog);
  const deleteSleepLog = useFlowsheetStore((s) => s.deleteSleepLog);

  const initialWard = useMemo(() => {
    const aff = staffs.find((s) => s.id === currentStaffId)?.affiliation;
    return FLOWSHEET_WARDS.find((w) => w.label === aff)?.id ?? FLOWSHEET_WARDS[0]?.id ?? '';
  }, [staffs, currentStaffId]);

  const [wardId, setWardId] = useState<string>(initialWard);
  const [room, setRoom] = useState<string>('');
  const [date, setDate] = useState<ISODate>(TODAY);
  const [shown, setShown] = useState<typeof PATIENTS>([]);

  // 個別ダイアログ
  const [individualCell, setIndividualCell] = useState<CellTarget | null>(null);
  const [individualEnd, setIndividualEnd] = useState<{ hour: number; offsetDay: 0 | 1 }>({ hour: 22, offsetDay: 0 });
  const [individualState, setIndividualState] = useState<string>('入眠');

  // 一括ダイアログ
  const [bulkSlot, setBulkSlot] = useState<{ hour: number; offsetDay: 0 | 1 } | null>(null);
  const [bulkRows, setBulkRows] = useState<{ patientId: string; selected: boolean; state: string }[]>([]);

  const roomsForWard = useMemo(() => {
    const set = new Set(PATIENTS.filter((p) => p.wardId === wardId).map((p) => p.roomNumber));
    return Array.from(set).sort();
  }, [wardId]);

  const handleSearch = () => {
    let list = PATIENTS.filter((p) => p.wardId === wardId);
    if (room) list = list.filter((p) => p.roomNumber === room);
    setShown(list);
  };

  // 各セルに該当する睡眠ログを判定
  const cellLog = (patientId: string, hour: number, offsetDay: 0 | 1): SleepLog | undefined => {
    const slotEpoch = new Date(slotIso(date, hour, offsetDay)).getTime();
    return sleepLogs.find((l) => {
      if (l.patientId !== patientId) return false;
      const s = new Date(l.startAt).getTime();
      const e = new Date(l.endAt).getTime();
      return s <= slotEpoch && slotEpoch < e;
    });
  };

  const handleClickCell = (target: CellTarget) => {
    setIndividualCell(target);
    // デフォルトは 1 時間後
    const idx = HOUR_SLOTS.findIndex((h) => h.hour === target.hour && h.offsetDay === target.offsetDay);
    const next = HOUR_SLOTS[Math.min(HOUR_SLOTS.length - 1, idx + 1)] ?? HOUR_SLOTS[idx];
    setIndividualEnd({ hour: next.hour, offsetDay: next.offsetDay });
    setIndividualState('入眠');
  };

  const handleSubmitIndividual = () => {
    if (!individualCell) return;
    const startAt = slotIso(date, individualCell.hour, individualCell.offsetDay);
    const endAt = slotIso(date, individualEnd.hour, individualEnd.offsetDay);
    if (endAt <= startAt) return;
    addSleepLog({
      patientId: individualCell.patientId,
      startAt, endAt, state: individualState,
    });
    setIndividualCell(null);
  };

  const handleClickColumnTitle = (slot: { hour: number; offsetDay: 0 | 1 }) => {
    setBulkSlot(slot);
    setBulkRows(shown.map((p) => ({ patientId: p.id, selected: true, state: '入眠' })));
  };

  const handleSubmitBulk = () => {
    if (!bulkSlot) return;
    const startAt = slotIso(date, bulkSlot.hour, bulkSlot.offsetDay);
    const idx = HOUR_SLOTS.findIndex((h) => h.hour === bulkSlot.hour && h.offsetDay === bulkSlot.offsetDay);
    const next = HOUR_SLOTS[Math.min(HOUR_SLOTS.length - 1, idx + 1)];
    const endAt = next ? slotIso(date, next.hour, next.offsetDay) : slotIso(date, bulkSlot.hour + 1, bulkSlot.offsetDay);
    bulkRows.filter((r) => r.selected).forEach((r) => {
      addSleepLog({ patientId: r.patientId, startAt, endAt, state: r.state });
    });
    setBulkSlot(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
          <Typography variant="h6">睡眠表</Typography>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>病棟</InputLabel>
            <Select label="病棟" value={wardId} onChange={(e) => { setWardId(e.target.value); setRoom(''); }}>
              {FLOWSHEET_WARDS.map((w) => (
                <MenuItem key={w.id} value={w.id}>{w.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>病室</InputLabel>
            <Select label="病室" value={room} onChange={(e) => setRoom(e.target.value)} displayEmpty>
              <MenuItem value=""><em>全室</em></MenuItem>
              {roomsForWard.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField type="date" size="small" label="日付"
            value={date} onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" size="small" onClick={handleSearch}>表示</Button>
          <Box sx={{ flex: 1 }} />
          <Alert severity="info" sx={{ py: 0 }}>
            セルクリック=個別入力、列タイトルクリック=同時間枠の一括入力
          </Alert>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1, overflow: 'auto' }}>
        {shown.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            条件を指定して [表示] を押してください。
          </Typography>
        ) : (
          <Table size="small" sx={{ '& th, & td': { p: 0.5 }, minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 90, position: 'sticky', left: 0, bgcolor: '#f1f5f9', zIndex: 1 }}>患者</TableCell>
                {HOUR_SLOTS.map((s) => (
                  <TableCell key={`${s.offsetDay}-${s.hour}`} align="center">
                    <Tooltip title="この時間枠で全患者の一括入力">
                      <MuiLink component="button" type="button" onClick={() => handleClickColumnTitle({ hour: s.hour, offsetDay: s.offsetDay })} sx={{ fontSize: 11 }}>
                        {s.label}
                      </MuiLink>
                    </Tooltip>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.map((p) => (
                <TableRow key={p.id}>
                  <TableCell sx={{ position: 'sticky', left: 0, bgcolor: '#fff', zIndex: 1 }}>
                    <MuiLink component={RouterLink} to={`/karte/${p.id}#flowsheet`} sx={{ fontSize: 12 }}>
                      {p.id}
                    </MuiLink>
                    <br />
                    <Typography variant="caption">{p.name}</Typography>
                  </TableCell>
                  {HOUR_SLOTS.map((s) => {
                    const log = cellLog(p.id, s.hour, s.offsetDay);
                    return (
                      <TableCell
                        key={`${s.offsetDay}-${s.hour}`}
                        align="center"
                        onClick={() => handleClickCell({ patientId: p.id, hour: s.hour, offsetDay: s.offsetDay })}
                        sx={{
                          cursor: 'pointer', minWidth: 50, height: 28,
                          bgcolor: log ? `${STATE_COLOR[log.state] ?? '#94a3b8'}33` : 'transparent',
                          '&:hover': { bgcolor: '#fee2e2' },
                          borderLeft: '1px solid', borderColor: 'divider',
                        }}
                      >
                        {log && (
                          <Tooltip title={`${log.state} ${log.startAt.replace('T', ' ')}〜${log.endAt.replace('T', ' ')}`}>
                            <Box sx={{ width: 8, height: 8, mx: 'auto', borderRadius: '50%', bgcolor: STATE_COLOR[log.state] ?? '#94a3b8' }} />
                          </Tooltip>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* 個別ダイアログ */}
      <Dialog open={!!individualCell} onClose={() => setIndividualCell(null)} fullWidth maxWidth="xs">
        <DialogTitle>睡眠・活動記録（個別）</DialogTitle>
        <DialogContent dividers>
          {individualCell && (
            <Stack spacing={1}>
              <Typography variant="body2">
                患者: {PATIENTS.find((p) => p.id === individualCell.patientId)?.name ?? individualCell.patientId}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                開始時刻: {slotIso(date, individualCell.hour, individualCell.offsetDay).replace('T', ' ')}
              </Typography>
              <FormControl size="small">
                <InputLabel>終了時刻</InputLabel>
                <Select
                  label="終了時刻"
                  value={`${individualEnd.offsetDay}-${individualEnd.hour}`}
                  onChange={(e) => {
                    const [od, h] = (e.target.value as string).split('-').map(Number);
                    setIndividualEnd({ hour: h, offsetDay: od as 0 | 1 });
                  }}
                >
                  {HOUR_SLOTS.map((s) => (
                    <MenuItem key={`${s.offsetDay}-${s.hour}`} value={`${s.offsetDay}-${s.hour}`}>
                      {s.label}{s.offsetDay === 1 ? '（翌日）' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>状態</InputLabel>
                <Select label="状態" value={individualState} onChange={(e) => setIndividualState(e.target.value)}>
                  {MASTER_SLEEP_STATES.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* 既存ログがあれば削除可 */}
              {(() => {
                const existing = cellLog(individualCell.patientId, individualCell.hour, individualCell.offsetDay);
                if (!existing) return null;
                return (
                  <Alert severity="warning"
                    action={<Button size="small" color="error" onClick={() => { deleteSleepLog(existing.id); setIndividualCell(null); }}>削除</Button>}
                  >
                    既存のログ「{existing.state}」があります。
                  </Alert>
                );
              })()}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIndividualCell(null)}>キャンセル</Button>
          <Button variant="contained" onClick={handleSubmitIndividual}>登録</Button>
        </DialogActions>
      </Dialog>

      {/* 一括ダイアログ */}
      <Dialog open={!!bulkSlot} onClose={() => setBulkSlot(null)} fullWidth maxWidth="md">
        <DialogTitle>
          睡眠・活動記録（一括）
          {bulkSlot && (
            <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
              {HOUR_SLOTS.find((s) => s.hour === bulkSlot.hour && s.offsetDay === bulkSlot.offsetDay)?.label}{bulkSlot.offsetDay === 1 ? '（翌日）' : ''}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 60 }}>選択</TableCell>
                <TableCell sx={{ width: 90 }}>患者</TableCell>
                <TableCell sx={{ width: 140 }}>氏名</TableCell>
                <TableCell>状態</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bulkRows.map((r, i) => {
                const p = PATIENTS.find((pp) => pp.id === r.patientId)!;
                return (
                  <TableRow key={r.patientId}>
                    <TableCell>
                      <Checkbox
                        size="small" checked={r.selected}
                        onChange={(e) => setBulkRows((rs) => rs.map((row, idx) => (idx === i ? { ...row, selected: e.target.checked } : row)))}
                      />
                    </TableCell>
                    <TableCell>{p.id}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={r.state}
                        onChange={(e) => setBulkRows((rs) => rs.map((row, idx) => (idx === i ? { ...row, state: e.target.value } : row)))}
                        sx={{ minWidth: 120 }}
                      >
                        {MASTER_SLEEP_STATES.map((s) => (
                          <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button size="small" onClick={() => setBulkRows((rs) => rs.map((r) => ({ ...r, selected: true })))}>全て選択</Button>
            <Button size="small" onClick={() => setBulkRows((rs) => rs.map((r) => ({ ...r, selected: false })))}>クリア</Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkSlot(null)}>キャンセル</Button>
          <Button variant="contained" onClick={handleSubmitBulk}>登録</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SleepTablePage;
