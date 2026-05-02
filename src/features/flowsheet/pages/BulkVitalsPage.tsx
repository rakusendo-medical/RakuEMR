import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Paper, Typography, Stack, Select, MenuItem, FormControl, InputLabel,
  TextField, Button, Checkbox, FormControlLabel,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Tooltip, Alert,
  Link as MuiLink,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { PATIENTS } from '../../../data/mockData';
import { useFlowsheetStore } from '../store';
import {
  FLOWSHEET_WARDS, MASTER_BULK_VITAL_KINDS, TODAY,
  type BulkVitalKindId,
} from '../mockData';
import type { ISODate, ShiftType } from '../types';

interface RowDraft {
  patientId: string;
  selected: boolean;
  time: string;
  values: Record<string, string>;
}

const numFromStr = (s: string): number | undefined => {
  if (s.trim() === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

const FIELD_LABEL: Record<string, string> = {
  bpSys: 'BP（上）', bpDia: 'BP（下）',
  temp: 'T', pulse: 'P', resp: 'R', spo2: 'S', weight: 'W',
};

const BulkVitalsPage: React.FC = () => {
  const property = useFlowsheetStore((s) => s.property);
  const currentStaffId = useFlowsheetStore((s) => s.currentStaffId);
  const staffs = useFlowsheetStore((s) => s.staffs);
  const addVital = useFlowsheetStore((s) => s.addVital);
  const upsertSign = useFlowsheetStore((s) => s.upsertSign);

  // ログオン職員所属に応じて初期病棟
  const initialWard = useMemo(() => {
    const aff = staffs.find((s) => s.id === currentStaffId)?.affiliation;
    const matched = FLOWSHEET_WARDS.find((w) => w.label === aff);
    return matched?.id ?? FLOWSHEET_WARDS[0]?.id ?? '';
  }, [staffs, currentStaffId]);

  const [wardId, setWardId] = useState<string>(initialWard);
  const [room, setRoom] = useState<string>('');
  const [kindId, setKindId] = useState<BulkVitalKindId>('basic');
  const [recordDate, setRecordDate] = useState<ISODate>(TODAY);
  const [inputTargetOnly, setInputTargetOnly] = useState<boolean>(property.inputTargetOnlyDefault);
  const [bulkSign, setBulkSign] = useState<boolean>(property.bulkSignDefault);
  const [rows, setRows] = useState<RowDraft[]>([]);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const kindMaster = MASTER_BULK_VITAL_KINDS.find((k) => k.id === kindId)!;

  // 病室一覧（選択中病棟）
  const roomsForWard = useMemo(() => {
    const set = new Set(PATIENTS.filter((p) => p.wardId === wardId).map((p) => p.roomNumber));
    return Array.from(set).sort();
  }, [wardId]);

  const handleSearch = () => {
    let list = PATIENTS.filter((p) => p.wardId === wardId);
    if (room) list = list.filter((p) => p.roomNumber === room);
    // モックでは全患者がパターン適用対象とみなす（spec の「対象項目設定あり」は将来）
    if (inputTargetOnly) {
      // 表示は全件で同じだが、UI 仕様確認用フラグ
    }
    setRows(list.map((p) => ({
      patientId: p.id,
      selected: false,
      time: kindMaster.defaultTime,
      values: {},
    })));
    setSavedMsg(null);
  };

  // 種類変更時に時刻だけ追従させる（既存値は保持）
  useEffect(() => {
    setRows((rs) => rs.map((r) => ({
      ...r,
      time: r.values && Object.keys(r.values).length > 0 ? r.time : kindMaster.defaultTime,
    })));
  }, [kindMaster.defaultTime]);

  const updateValue = (idx: number, field: string, value: string) =>
    setRows((rs) => rs.map((r, i) => {
      if (i !== idx) return r;
      const nextValues = { ...r.values, [field]: value };
      // 1 つでも値入力されたら更新チェックを自動 ON
      const anyValue = Object.values(nextValues).some((v) => v && v.trim() !== '');
      return { ...r, values: nextValues, selected: anyValue || r.selected };
    }));

  const updateTime = (idx: number, time: string) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, time } : r)));

  const setAllSelected = (sel: boolean) =>
    setRows((rs) => rs.map((r) => ({ ...r, selected: sel })));

  const handleSet = () => {
    const targets = rows.filter((r) => r.selected);
    let count = 0;
    targets.forEach((r) => {
      const hasAny = Object.values(r.values).some((v) => v && v.trim() !== '');
      if (!hasAny) return;
      addVital({
        patientId: r.patientId,
        date: recordDate,
        time: r.time,
        bpSys: numFromStr(r.values.bpSys ?? ''),
        bpDia: numFromStr(r.values.bpDia ?? ''),
        temp:  numFromStr(r.values.temp ?? ''),
        pulse: numFromStr(r.values.pulse ?? ''),
        resp:  numFromStr(r.values.resp ?? ''),
        spo2:  numFromStr(r.values.spo2 ?? ''),
        weight: numFromStr(r.values.weight ?? ''),
      });
      if (bulkSign && kindMaster.signShift) {
        upsertSign(recordDate, r.patientId, kindMaster.signShift as ShiftType, currentStaffId);
      }
      count += 1;
    });
    setSavedMsg(`${count} 名のバイタルを登録しました${bulkSign ? `（${kindMaster.signShift === 'day' ? '日勤' : kindMaster.signShift === 'night' ? '深夜' : '準夜'}サイン連動）` : ''}。`);
    // 値はクリア
    setRows((rs) => rs.map((r) => (r.selected ? { ...r, values: {}, selected: false } : r)));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
          <Typography variant="h6">一括バイタル入力</Typography>
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
              {roomsForWard.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>種類</InputLabel>
            <Select
              label="種類"
              value={kindId}
              onChange={(e) => setKindId(e.target.value as BulkVitalKindId)}
            >
              {MASTER_BULK_VITAL_KINDS.map((k) => (
                <MenuItem key={k.id} value={k.id}>{k.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="date" size="small" label="記録日"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small" checked={inputTargetOnly}
                onChange={(e) => setInputTargetOnly(e.target.checked)}
              />
            }
            label="入力対象患者のみ"
          />
          <Button variant="contained" size="small" onClick={handleSearch}>表示</Button>
          {savedMsg && <Alert severity="success" sx={{ ml: 'auto' }}>{savedMsg}</Alert>}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Button size="small" variant="outlined" onClick={() => setAllSelected(true)}>全て選択</Button>
          <Button size="small" variant="outlined" onClick={() => setAllSelected(false)}>クリア</Button>
          <FormControlLabel
            control={
              <Checkbox
                size="small" checked={bulkSign}
                onChange={(e) => setBulkSign(e.target.checked)}
              />
            }
            label={`フローシートへサインする（${kindMaster.signShift ?? '—'}）`}
          />
          <Box sx={{ flex: 1 }} />
          <Tooltip title="再表示（入力値は破棄）">
            <span>
              <IconButton size="small" onClick={handleSearch}><RefreshIcon fontSize="small" /></IconButton>
            </span>
          </Tooltip>
          <Button variant="contained" onClick={handleSet} disabled={rows.every((r) => !r.selected)}>
            設定
          </Button>
        </Stack>

        {rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            条件を指定して [表示] を押してください。
          </Typography>
        ) : (
          <Table size="small" sx={{ '& th, & td': { p: 0.75 } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ width: 48 }}>更新</TableCell>
                <TableCell sx={{ width: 90 }}>患者番号</TableCell>
                <TableCell sx={{ width: 140 }}>氏名</TableCell>
                <TableCell sx={{ width: 90 }}>病室</TableCell>
                <TableCell sx={{ width: 90 }}>時刻</TableCell>
                {kindMaster.fields.map((f) => (
                  <TableCell key={f} sx={{ width: 90 }}>{FIELD_LABEL[f]}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => {
                const p = PATIENTS.find((pp) => pp.id === r.patientId)!;
                return (
                  <TableRow key={r.patientId} sx={{ bgcolor: r.selected ? '#dbeafe' : 'transparent' }}>
                    <TableCell>
                      <Checkbox
                        size="small" checked={r.selected}
                        onChange={(e) => setRows((rs) => rs.map((row, idx) => (idx === i ? { ...row, selected: e.target.checked } : row)))}
                      />
                    </TableCell>
                    <TableCell>
                      <MuiLink component={RouterLink} to={`/flowsheet/${p.id}`}>
                        {p.id}
                      </MuiLink>
                    </TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.roomNumber}-{p.bedLabel}</TableCell>
                    <TableCell>
                      <TextField
                        size="small" placeholder="HH:mm"
                        value={r.time}
                        onChange={(e) => updateTime(i, e.target.value)}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    {kindMaster.fields.map((f) => (
                      <TableCell key={f}>
                        <TextField
                          size="small"
                          value={r.values[f] ?? ''}
                          onChange={(e) => updateValue(i, f, e.target.value)}
                          inputProps={{ inputMode: 'decimal' }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
};

export default BulkVitalsPage;
