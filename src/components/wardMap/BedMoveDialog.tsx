import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Stack, FormControl, InputLabel, Select, MenuItem,
  TextField, FormControlLabel, Checkbox, Divider, Chip, Alert,
} from '@mui/material';
import type { Bed, Patient, UnassignedPatient, WardId } from '../../types';
import { WARD_LABELS } from '../../types';
import { ROOMS } from '../../data/mockData';

export type BedMoveMode = 'move' | 'assign';

export interface BedMoveTarget {
  /** 移動 (move) 用の現患者 */
  patient?: Patient;
  /** 割当 (assign) 用の未割当患者 */
  unassigned?: UnassignedPatient;
  /** 現在の病棟（移動時のみ） */
  currentWard?: WardId;
  /** 現在の病室・ベッド（移動時のみ） */
  currentRoom?: string;
  currentBed?: string;
}

interface Props {
  open: boolean;
  mode: BedMoveMode;
  target: BedMoveTarget | null;
  /** オーダリング運用かどうか（隔離・拘束チェックの表示分岐） */
  orderingMode?: boolean;
  /** 食事締め時間（モック: HH:mm 文字列） */
  mealCutoff?: string;
  onClose: () => void;
  onSubmit: (params: BedMoveSubmitParams) => void;
}

export interface BedMoveSubmitParams {
  mode: BedMoveMode;
  patientId: string;
  toWard: WardId;
  toRoom: string;
  toBed: string;
  moveAt: string;
  mealAt: string;
  isolation?: boolean;
  restraint?: boolean;
  printMoveSheet?: boolean;
  printMealSheet?: boolean;
}

const formatNow = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const BedMoveDialog: React.FC<Props> = ({
  open, mode, target, orderingMode = false, mealCutoff = '17:00', onClose, onSubmit,
}) => {
  const initialWard: WardId = (target?.currentWard
    ?? (target?.unassigned?.designatedWardId !== 'tentative' ? target?.unassigned?.designatedWardId as WardId : undefined)
    ?? 'ward1') as WardId;
  const initialRoom = (target?.unassigned?.designatedRoomNumber !== 'tentative' ? target?.unassigned?.designatedRoomNumber as string : '') ?? '';

  const [toWard, setToWard] = React.useState<WardId>(initialWard);
  const [toRoom, setToRoom] = React.useState<string>(initialRoom);
  const [moveAt, setMoveAt] = React.useState<string>(formatNow());
  const [mealAt, setMealAt] = React.useState<string>(formatNow());
  const [isolation, setIsolation] = React.useState(false);
  const [restraint, setRestraint] = React.useState(false);
  const [printMoveSheet, setPrintMoveSheet] = React.useState(false);
  const [printMealSheet, setPrintMealSheet] = React.useState(false);
  const [confirmCutoff, setConfirmCutoff] = React.useState(false);
  const [outOfRangeWarn, setOutOfRangeWarn] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setToWard(initialWard);
      setToRoom(initialRoom);
      setMoveAt(formatNow());
      setMealAt(formatNow());
      setIsolation(false);
      setRestraint(false);
      setPrintMoveSheet(false);
      setPrintMealSheet(false);
      setConfirmCutoff(false);
      setOutOfRangeWarn(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target?.patient?.id, target?.unassigned?.id]);

  if (!target) return null;
  const subjectName = target.patient?.name ?? target.unassigned?.name ?? '';
  const subjectMeta = target.patient
    ? `${target.patient.age}歳${target.patient.gender === 'M' ? '男性' : '女性'} / 現在 ${WARD_LABELS[target.currentWard ?? target.patient.wardId]} ${target.currentRoom ?? target.patient.roomNumber}号室 ${target.currentBed ?? target.patient.bedLabel}`
    : target.unassigned
      ? `${target.unassigned.age}歳${target.unassigned.gender === 'M' ? '男性' : '女性'} / ${target.unassigned.doctorName}`
      : '';

  const wardRooms = ROOMS.filter((r) => r.wardId === toWard);
  const room = wardRooms.find((r) => r.roomNumber === toRoom);
  const availableBeds = room ? room.beds.filter((b: Bed) => !b.disabled && !b.patientId) : [];
  // ベッドは廃止（布団運用）。移動先病室の空き枠の先頭を自動割当する。
  const autoBed = availableBeds[0]?.bed ?? '';
  const roomFull = !!toRoom && availableBeds.length === 0;

  // 食事締め時間判定（モック簡易版）
  const moveTime = moveAt.split('T')[1] ?? '00:00';
  const cutoffExceeded = moveTime > mealCutoff;

  // 範囲外判定（assign で病棟・病室の指定がある場合）
  const u = target.unassigned;
  const wardOutOfRange = u && u.designatedWardId !== 'tentative' && u.designatedWardId !== toWard;
  const roomOutOfRange = u && u.designatedRoomNumber !== 'tentative' && u.designatedRoomNumber !== toRoom;
  const showOutOfRange = (wardOutOfRange || roomOutOfRange) && !!toRoom;

  const handleSubmit = () => {
    if (cutoffExceeded && !confirmCutoff) {
      setConfirmCutoff(true);
      return;
    }
    if (showOutOfRange && !outOfRangeWarn) {
      setOutOfRangeWarn(true);
      return;
    }
    onSubmit({
      mode,
      patientId: target.patient?.id ?? target.unassigned?.id ?? '',
      toWard,
      toRoom,
      toBed: autoBed,
      moveAt,
      mealAt,
      isolation: orderingMode ? isolation : undefined,
      restraint: orderingMode ? restraint : undefined,
      printMoveSheet,
      printMealSheet,
    });
  };

  const submitLabel = mode === 'assign' ? '割当登録' : '登録';
  const headerLabel = mode === 'assign' ? '転棟・転室ダイアログ（割当）' : '転棟・転室ダイアログ（移動）';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        {headerLabel}
        <Typography variant="caption" color="text.secondary" component="div">
          {subjectName}　<Typography component="span" variant="caption" color="text.secondary">{subjectMeta}</Typography>
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip label={mode === 'assign' ? '割当' : '移動'} size="small" color="primary" />
            {orderingMode && <Chip label="オーダリング運用" size="small" color="warning" />}
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>移動先 病棟</InputLabel>
              <Select label="移動先 病棟" value={toWard} onChange={(e) => { setToWard(e.target.value as WardId); setToRoom(''); }}>
                <MenuItem value="ward1">第１病棟</MenuItem>
                <MenuItem value="ward2">第２病棟</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>移動先 病室</InputLabel>
              <Select label="移動先 病室" value={toRoom} onChange={(e) => setToRoom(e.target.value)}>
                {wardRooms.map((r) => (
                  <MenuItem key={r.roomNumber} value={r.roomNumber}>{r.roomNumber}号室</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          {roomFull && (
            <Typography variant="caption" color="error">
              選択した病室に空きがありません。別の病室を選択してください。
            </Typography>
          )}

          <Stack direction="row" spacing={1.5}>
            <TextField
              size="small"
              label="移動日時"
              type="datetime-local"
              value={moveAt}
              onChange={(e) => setMoveAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="配膳先変更日時"
              type="datetime-local"
              value={mealAt}
              onChange={(e) => setMealAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Stack>

          {orderingMode && (
            <Box>
              <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                オーダリング運用 — 同時登録項目
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <FormControlLabel control={<Checkbox checked={isolation} onChange={(_, v) => setIsolation(v)} />} label="隔離" />
                <FormControlLabel control={<Checkbox checked={restraint} onChange={(_, v) => setRestraint(v)} />} label="拘束" />
              </Stack>
            </Box>
          )}

          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
              印刷オプション
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <FormControlLabel control={<Checkbox checked={printMoveSheet} onChange={(_, v) => setPrintMoveSheet(v)} />} label="移動箋" />
              <FormControlLabel control={<Checkbox checked={printMealSheet} onChange={(_, v) => setPrintMealSheet(v)} />} label="食事箋" />
            </Stack>
          </Box>

          {mode === 'move' && (
            <>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                  履歴（モック表示）
                </Typography>
                <Box sx={{ p: 1, border: '1px dashed', borderColor: 'divider', borderRadius: 1, color: 'text.secondary' }}>
                  <Typography variant="caption">この患者の登録済み移動はありません。</Typography>
                </Box>
              </Box>
            </>
          )}

          {cutoffExceeded && confirmCutoff && (
            <Alert severity="warning">
              移動日時 {moveTime} は食事締め時間（{mealCutoff}）を過ぎています。OK で続行します。
            </Alert>
          )}
          {showOutOfRange && outOfRangeWarn && (
            <Alert severity="warning">
              指定範囲外の割当です（{wardOutOfRange ? '病棟' : ''}{wardOutOfRange && roomOutOfRange ? '・' : ''}{roomOutOfRange ? '病室' : ''}）。
              OK で続行します。
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!toRoom || availableBeds.length === 0}
        >
          {(cutoffExceeded && !confirmCutoff) || (showOutOfRange && !outOfRangeWarn) ? '確認' : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BedMoveDialog;
