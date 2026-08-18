import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Stack, Typography, TextField, IconButton, Button, Tooltip,
  Table, TableBody, TableCell, TableHead, TableRow, Alert,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useFlowsheetStore } from '../store';
import { TODAY } from '../mockData';
import { PATIENTS, patientNumberOf } from '../../../data/mockData';
import type { ISODate, VitalEntry } from '../types';

interface Props {
  open: boolean;
  patientId: string;
  date: ISODate;
  onClose: () => void;
}

interface RowDraft {
  /** 既存 id がある場合は紐付け（更新／削除判定用） */
  existingId?: string;
  time: string;            // HH:mm
  bpSys: string;
  bpDia: string;
  resp: string;
  pulse: string;
  temp: string;
  spo2: string;
  weight: string;
}

const numFromStr = (s: string): number | undefined => {
  const t = s.trim();
  if (t === '') return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
};

const toRowDraft = (v?: VitalEntry): RowDraft => ({
  existingId: v?.id,
  time: v?.time ?? '',
  bpSys: v?.bpSys != null ? String(v.bpSys) : '',
  bpDia: v?.bpDia != null ? String(v.bpDia) : '',
  resp: v?.resp != null ? String(v.resp) : '',
  pulse: v?.pulse != null ? String(v.pulse) : '',
  temp: v?.temp != null ? String(v.temp) : '',
  spo2: v?.spo2 != null ? String(v.spo2) : '',
  weight: v?.weight != null ? String(v.weight) : '',
});

const isHHmm = (s: string): boolean => /^([01]\d|2[0-3]):([0-5]\d)$/.test(s);

const VitalEditDialog: React.FC<Props> = ({ open, patientId, date, onClose }) => {
  const property = useFlowsheetStore((s) => s.property);
  const vitals = useFlowsheetStore((s) => s.vitals);
  const staffs = useFlowsheetStore((s) => s.staffs);
  const changeLogs = useFlowsheetStore((s) => s.changeLogs);
  const addVital = useFlowsheetStore((s) => s.addVital);
  const updateVital = useFlowsheetStore((s) => s.updateVital);
  const deleteVital = useFlowsheetStore((s) => s.deleteVital);

  const existingForDate = useMemo(
    () => vitals
      .filter((v) => v.patientId === patientId && v.date === date)
      .sort((a, b) => a.time.localeCompare(b.time)),
    [vitals, patientId, date],
  );

  const [rows, setRows] = useState<RowDraft[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // ダイアログ open のたびに既存値を読み込む
  useEffect(() => {
    if (open) {
      setRows(existingForDate.length > 0 ? existingForDate.map(toRowDraft) : [toRowDraft()]);
      setErrors([]);
    }
  }, [open, existingForDate]);

  const addRow = () => setRows((r) => [...r, toRowDraft()]);
  const removeRow = (idx: number) => setRows((r) => r.filter((_, i) => i !== idx));
  const updateRow = (idx: number, patch: Partial<RowDraft>) =>
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  /**
   * 検証して書き込み。
   * - 時間空欄行: 既存があれば削除、なければ無視
   * - 時間入力ありで HH:mm でないものはエラー
   * - 未来日時: 常に登録不可（固定・マスタ設定によらない）
   */
  const handleRegister = () => {
    const errs: string[] = [];
    const targets: { row: RowDraft; ok: boolean }[] = [];
    rows.forEach((row, i) => {
      if (row.time.trim() === '') {
        targets.push({ row, ok: false });
        return;
      }
      if (!isHHmm(row.time.trim())) {
        errs.push(`${i + 1} 行目: 時刻は HH:mm 形式（例 09:30）で入力してください`);
        return;
      }
      targets.push({ row, ok: true });
    });

    // 未来日時チェック
    const dt = new Date();
    const nowEpoch = dt.getTime();
    const futureRows: { row: RowDraft; whenEpoch: number }[] = [];
    targets.filter((t) => t.ok).forEach(({ row }) => {
      const epoch = new Date(`${date}T${row.time}:00`).getTime();
      if (epoch > nowEpoch) futureRows.push({ row, whenEpoch: epoch });
    });

    if (futureRows.length > 0) {
      errs.push('未来日時のバイタルは登録できません（未来日は登録不可）。');
    }

    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);

    // 既存 id を持つもので draft が「時間空欄」なら削除、それ以外は値変化があれば更新
    const existingIdsTouched = new Set<string>();
    targets.forEach(({ row, ok }) => {
      if (row.existingId) {
        existingIdsTouched.add(row.existingId);
        if (!ok) {
          // 時間空欄 → 削除
          deleteVital(row.existingId);
          return;
        }
        // 既存更新（値が変わっているかは store 側でログ）
        updateVital(row.existingId, {
          time: row.time.trim(),
          bpSys: numFromStr(row.bpSys),
          bpDia: numFromStr(row.bpDia),
          resp: numFromStr(row.resp),
          pulse: numFromStr(row.pulse),
          temp: numFromStr(row.temp),
          spo2: numFromStr(row.spo2),
          weight: numFromStr(row.weight),
        });
      } else {
        if (!ok) return; // 新規行で時間空欄 → 無視
        addVital({
          patientId, date,
          time: row.time.trim(),
          bpSys: numFromStr(row.bpSys),
          bpDia: numFromStr(row.bpDia),
          resp: numFromStr(row.resp),
          pulse: numFromStr(row.pulse),
          temp: numFromStr(row.temp),
          spo2: numFromStr(row.spo2),
          weight: numFromStr(row.weight),
        });
      }
    });

    // 既存にあって draft に登場しなかったものは削除（=ユーザーが行を消した）
    existingForDate.forEach((v) => {
      if (!existingIdsTouched.has(v.id)) deleteVital(v.id);
    });

    onClose();
  };

  const history = useMemo(
    () => changeLogs
      .filter((l) => l.targetType === 'vital' && l.patientId === patientId && l.date === date)
      .sort((a, b) => (a.at < b.at ? 1 : -1)),
    [changeLogs, patientId, date],
  );

  const staffNameOf = (id: string) => staffs.find((s) => s.id === id)?.name ?? id;
  const patient = PATIENTS.find((p) => p.id === patientId);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 0.5 }}>
        バイタル編集
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {patient ? `${patient.name}（${patientNumberOf(patientId)}）` : patientNumberOf(patientId)} / {date}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            <Stack>{errors.map((e, i) => <span key={i}>{e}</span>)}</Stack>
          </Alert>
        )}

        <Table size="small" sx={{ '& th, & td': { p: 0.5 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 36 }} />
              <TableCell sx={{ width: 90 }}>時間 *</TableCell>
              <TableCell sx={{ width: 80 }}>BP（上）</TableCell>
              <TableCell sx={{ width: 80 }}>BP（下）</TableCell>
              <TableCell sx={{ width: 60 }}>R</TableCell>
              <TableCell sx={{ width: 60 }}>P</TableCell>
              <TableCell sx={{ width: 70 }}>T</TableCell>
              <TableCell sx={{ width: 60 }}>S</TableCell>
              <TableCell sx={{ width: 70 }}>W</TableCell>
              <TableCell>記録者</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => {
              const existing = row.existingId
                ? existingForDate.find((v) => v.id === row.existingId)
                : undefined;
              const recorder = existing
                ? staffNameOf(existing.recordedBy)
                : '（登録時に自動入力）';
              const numField = (k: keyof RowDraft, w: number) => (
                <TextField
                  size="small" variant="outlined"
                  value={row[k] as string}
                  onChange={(e) => updateRow(i, { [k]: e.target.value } as Partial<RowDraft>)}
                  inputProps={{ inputMode: 'decimal' }}
                  sx={{ width: w }}
                />
              );
              return (
                <TableRow key={i}>
                  <TableCell>
                    <Tooltip title="この行を削除">
                      <IconButton size="small" onClick={() => removeRow(i)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small" placeholder="HH:mm"
                      value={row.time}
                      onChange={(e) => updateRow(i, { time: e.target.value })}
                      sx={{ width: 90 }}
                    />
                  </TableCell>
                  <TableCell>{numField('bpSys', 80)}</TableCell>
                  <TableCell>{numField('bpDia', 80)}</TableCell>
                  <TableCell>{numField('resp', 60)}</TableCell>
                  <TableCell>{numField('pulse', 60)}</TableCell>
                  <TableCell>{numField('temp', 70)}</TableCell>
                  <TableCell>{numField('spo2', 60)}</TableCell>
                  <TableCell>{numField('weight', 70)}</TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{recorder}</Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <Stack direction="row" justifyContent="flex-start" sx={{ mt: 1 }}>
          <Button startIcon={<AddIcon />} size="small" onClick={addRow}>行を追加</Button>
        </Stack>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>更新履歴</Typography>
          {history.length === 0 ? (
            <Typography variant="caption" color="text.disabled">履歴はありません。</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 180 }}>更新日時</TableCell>
                  <TableCell sx={{ width: 160 }}>更新者</TableCell>
                  <TableCell sx={{ width: 90 }}>操作</TableCell>
                  <TableCell>内容</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>{h.at.replace('T', ' ')}</TableCell>
                    <TableCell>{staffNameOf(h.actorId)}</TableCell>
                    <TableCell>{h.op === 'register' ? '登録' : '更新'}</TableCell>
                    <TableCell>{h.summary}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>

        {date > TODAY && (
          <Alert severity="info" sx={{ mt: 1 }}>
            未来日 ({date}) のため、この日のバイタルは登録できません（未来日は登録不可）。
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={() => handleRegister()}>登録</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VitalEditDialog;
