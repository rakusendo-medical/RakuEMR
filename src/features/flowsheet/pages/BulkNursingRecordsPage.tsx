import React, { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Paper, Typography, Stack, Select, MenuItem, FormControl, InputLabel,
  TextField, Button, Checkbox, FormControlLabel, Tooltip, Alert, Link as MuiLink,
  Table, TableBody, TableCell, TableHead, TableRow, ToggleButton, ToggleButtonGroup,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { PATIENTS } from '../../../data/mockData';
import { useFlowsheetStore, resolveShift } from '../store';
import { FLOWSHEET_WARDS, TODAY } from '../mockData';
import type {
  ConnectionTarget, ISODate, NursingRecordBody, RecordFormType, ShiftType,
} from '../types';

const SHIFT_LABEL: Record<ShiftType, string> = { night: '深夜', day: '日勤', evening: '準夜' };

interface RowDraft {
  patientId: string;
  selected: boolean;
  time: string; // HH:mm
  text: string; // 簡素化: 形式に応じてプライマリブロックに反映
  connections: ConnectionTarget[];
  isPublished: boolean;
}

const buildBody = (form: RecordFormType, text: string, title: string): NursingRecordBody => {
  switch (form) {
    case 'focus': return { formType: 'focus', body: { focus: title, data: text, action: '', response: '' } };
    case 'soap': return { formType: 'soap', body: { s: '', o: text, a: '', p: '' } };
    case 'free': return { formType: 'free', body: { free: text } };
  }
};

const CONN_OPTIONS: { value: ConnectionTarget; label: string }[] = [
  { value: 'flowsheet', label: 'フロー' },
  { value: 'handover', label: '申送' },
  { value: 'wardJournal', label: '病棟日誌' },
];

const BulkNursingRecordsPage: React.FC = () => {
  const property = useFlowsheetStore((s) => s.property);
  const currentStaffId = useFlowsheetStore((s) => s.currentStaffId);
  const staffs = useFlowsheetStore((s) => s.staffs);
  const addRecord = useFlowsheetStore((s) => s.addNursingRecord);
  const records = useFlowsheetStore((s) => s.nursingRecords);

  const initialWard = useMemo(() => {
    const aff = staffs.find((s) => s.id === currentStaffId)?.affiliation;
    return FLOWSHEET_WARDS.find((w) => w.label === aff)?.id ?? FLOWSHEET_WARDS[0]?.id ?? '';
  }, [staffs, currentStaffId]);

  const [wardId, setWardId] = useState<string>(initialWard);
  const [room, setRoom] = useState<string>('');
  const [date, setDate] = useState<ISODate>(TODAY);
  const [title, setTitle] = useState<string>('');
  const [formType, setFormType] = useState<RecordFormType>(property.defaultRecordForm);
  const [sortByName, setSortByName] = useState<'asc' | 'desc' | null>(null);
  const [rows, setRows] = useState<RowDraft[]>([]);
  const [bulkTimeOpen, setBulkTimeOpen] = useState(false);
  const [bulkTimeValue, setBulkTimeValue] = useState<string>('10:00');
  const [bulkBodyOpen, setBulkBodyOpen] = useState(false);
  const [bulkBodyText, setBulkBodyText] = useState<string>('');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const roomsForWard = useMemo(() => {
    const set = new Set(PATIENTS.filter((p) => p.wardId === wardId).map((p) => p.roomNumber));
    return Array.from(set).sort();
  }, [wardId]);

  const handleSearch = () => {
    let list = PATIENTS.filter((p) => p.wardId === wardId);
    if (room) list = list.filter((p) => p.roomNumber === room);
    setRows(list.map((p) => ({
      patientId: p.id,
      selected: false,
      time: '',
      text: '',
      connections: ['flowsheet'],
      isPublished: true,
    })));
    setSavedMsg(null);
  };

  const sortedRows = useMemo(() => {
    if (!sortByName) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const aName = PATIENTS.find((p) => p.id === a.patientId)?.name ?? '';
      const bName = PATIENTS.find((p) => p.id === b.patientId)?.name ?? '';
      return sortByName === 'asc' ? aName.localeCompare(bName, 'ja') : bName.localeCompare(aName, 'ja');
    });
    return copy;
  }, [rows, sortByName]);

  // 日付に対する記録回数
  const recordCountFor = (patientId: string): number =>
    records.filter((r) => r.patientId === patientId && !r.deletedAt && r.recordedAt.slice(0, 10) === date).length;

  const handleBulkTime = () => {
    setRows((rs) => rs.map((r) => ({ ...r, time: bulkTimeValue })));
    setBulkTimeOpen(false);
  };

  const handleBulkBody = () => {
    setRows((rs) => rs.map((r) => ({ ...r, text: bulkBodyText })));
    setBulkBodyOpen(false);
  };

  const handleRegister = () => {
    const errs: string[] = [];
    if (title.trim() === '') errs.push('共通記事タイトルが未入力です');
    rows.filter((r) => r.selected).forEach((r) => {
      if (r.time.trim() === '') errs.push(`${r.patientId}: 時間が未入力です`);
    });
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);

    let count = 0;
    rows.filter((r) => r.selected).forEach((r) => {
      const recordedAt = `${date}T${r.time.trim()}:00`;
      const shift: ShiftType = resolveShift(r.time.trim(), property.shiftStartTimes);
      addRecord({
        patientId: r.patientId,
        title,
        recordedAt,
        shift,
        formType,
        body: buildBody(formType, r.text, title),
        connections: r.connections,
        reportTargets: [],
        tags: [],
        isPublished: r.isPublished,
      });
      count += 1;
    });
    setSavedMsg(`${count} 名分の看護経過記録を登録しました。`);
    setRows((rs) => rs.map((r) => (r.selected ? { ...r, selected: false, text: '' } : r)));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
          <Typography variant="h6">一括看護経過記録</Typography>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>病棟</InputLabel>
            <Select label="病棟" value={wardId} onChange={(e) => { setWardId(e.target.value); setRoom(''); }}>
              {FLOWSHEET_WARDS.map((w) => <MenuItem key={w.id} value={w.id}>{w.label}</MenuItem>)}
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
          <Button size="small" variant="contained" onClick={handleSearch}>表示</Button>
          {savedMsg && <Alert severity="success" sx={{ ml: 'auto' }}>{savedMsg}</Alert>}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
          <TextField
            size="small" label="共通記事タイトル"
            value={title} onChange={(e) => setTitle(e.target.value)}
            sx={{ minWidth: 220 }}
          />
          <ToggleButtonGroup
            size="small" exclusive value={formType}
            onChange={(_, v: RecordFormType | null) => v && setFormType(v)}
          >
            <ToggleButton value="focus">FOCUS</ToggleButton>
            <ToggleButton value="soap">SOAP</ToggleButton>
            <ToggleButton value="free">フリー</ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title="全患者の時間を一括設定">
            <Button size="small" variant="outlined" onClick={() => setBulkTimeOpen(true)}>時間一括</Button>
          </Tooltip>
          <Tooltip title="全患者の本文を一括設定（同形式の患者全員に反映）">
            <Button size="small" variant="outlined" onClick={() => { setBulkBodyText(''); setBulkBodyOpen(true); }}>本文一括</Button>
          </Tooltip>
          <Box sx={{ flex: 1 }} />
          <Button size="small" onClick={() => setRows((rs) => rs.map((r) => ({ ...r, selected: true })))}>全て選択</Button>
          <Button size="small" onClick={() => setRows((rs) => rs.map((r) => ({ ...r, selected: false })))}>クリア</Button>
          <Button size="small" variant="contained" onClick={handleRegister} disabled={rows.every((r) => !r.selected)}>登録</Button>
        </Stack>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mt: 1 }}>
            <Stack>{errors.map((e, i) => <span key={i}>{e}</span>)}</Stack>
          </Alert>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 1, overflow: 'auto' }}>
        {rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>条件を指定して [表示] を押してください。</Typography>
        ) : (
          <Table size="small" sx={{ '& th, & td': { p: 0.75 } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ width: 48 }}>選択</TableCell>
                <TableCell sx={{ width: 90 }}>患者</TableCell>
                <TableCell sx={{ width: 140 }}>
                  <MuiLink
                    component="button" type="button"
                    onClick={() => setSortByName((s) => s === 'asc' ? 'desc' : 'asc')}
                  >
                    氏名 {sortByName === 'asc' ? '↑' : sortByName === 'desc' ? '↓' : ''}
                  </MuiLink>
                </TableCell>
                <TableCell sx={{ width: 90 }}>勤務帯</TableCell>
                <TableCell sx={{ width: 90 }}>時間</TableCell>
                <TableCell>本文</TableCell>
                <TableCell sx={{ width: 200 }}>連携</TableCell>
                <TableCell sx={{ width: 80 }}>公開</TableCell>
                <TableCell sx={{ width: 70 }}>記録</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRows.map((r) => {
                const i = rows.findIndex((rr) => rr.patientId === r.patientId);
                const p = PATIENTS.find((pp) => pp.id === r.patientId)!;
                const shift: ShiftType | null = r.time.trim()
                  ? resolveShift(r.time.trim(), property.shiftStartTimes)
                  : null;
                const cnt = recordCountFor(r.patientId);
                return (
                  <TableRow key={r.patientId} sx={{ bgcolor: r.selected ? '#dbeafe' : 'transparent' }}>
                    <TableCell>
                      <Checkbox size="small" checked={r.selected}
                        onChange={(e) => setRows((rs) => rs.map((row, idx) => (idx === i ? { ...row, selected: e.target.checked } : row)))}
                      />
                    </TableCell>
                    <TableCell>
                      <MuiLink component={RouterLink} to={`/karte/${p.id}#flowsheet`}>{p.id}</MuiLink>
                    </TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{shift ? SHIFT_LABEL[shift] : '—'}</TableCell>
                    <TableCell>
                      <TextField size="small" placeholder="HH:mm"
                        value={r.time}
                        onChange={(e) => setRows((rs) => rs.map((row, idx) => (idx === i ? { ...row, time: e.target.value, selected: e.target.value.trim() !== '' || row.selected } : row)))}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" multiline maxRows={4} fullWidth placeholder="本文（共通形式に従う）"
                        value={r.text}
                        onChange={(e) => setRows((rs) => rs.map((row, idx) => (idx === i ? { ...row, text: e.target.value, selected: e.target.value.trim() !== '' || row.selected } : row)))}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" flexWrap="wrap">
                        {CONN_OPTIONS.map((opt) => (
                          <FormControlLabel key={opt.value}
                            control={
                              <Checkbox size="small" checked={r.connections.includes(opt.value)}
                                onChange={(e) => setRows((rs) => rs.map((row, idx) => (idx === i ? {
                                  ...row,
                                  connections: e.target.checked
                                    ? [...row.connections, opt.value]
                                    : row.connections.filter((c) => c !== opt.value),
                                } : row)))}
                              />
                            }
                            label={<Typography variant="caption">{opt.label}</Typography>}
                          />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Checkbox size="small" checked={r.isPublished}
                        onChange={(e) => setRows((rs) => rs.map((row, idx) => (idx === i ? { ...row, isPublished: e.target.checked } : row)))}
                      />
                    </TableCell>
                    <TableCell>{cnt > 0 ? cnt : '未'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* 時間一括設定 */}
      <Dialog open={bulkTimeOpen} onClose={() => setBulkTimeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>時間設定</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            <TextField size="small" label="時間 (HH:mm)" value={bulkTimeValue}
              onChange={(e) => setBulkTimeValue(e.target.value)} />
            <Typography variant="caption" color="text.secondary">
              空白でエラーになります。勤務帯は時間に応じて自動連動。
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkTimeOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={handleBulkTime} disabled={bulkTimeValue.trim() === ''}>設定</Button>
        </DialogActions>
      </Dialog>

      {/* 本文一括 */}
      <Dialog open={bulkBodyOpen} onClose={() => setBulkBodyOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>本文一括入力（{formType.toUpperCase()}）</DialogTitle>
        <DialogContent dividers>
          <TextField multiline rows={6} fullWidth
            value={bulkBodyText}
            onChange={(e) => setBulkBodyText(e.target.value)}
            placeholder="本文を入力。形式 SOAP→O / FOCUS→D / フリー→本文 に反映されます。"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkBodyOpen(false)}>キャンセル</Button>
          <Button variant="contained" onClick={handleBulkBody}>反映</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BulkNursingRecordsPage;
