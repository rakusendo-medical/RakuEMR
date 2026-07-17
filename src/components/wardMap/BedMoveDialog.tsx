import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Stack, FormControl, InputLabel, Select, MenuItem,
  TextField, FormControlLabel, Checkbox, Divider, Chip, Alert,
} from '@mui/material';
import type { Bed, Patient, UnassignedPatient, WardId } from '../../types';
import { WARD_LABELS } from '../../types';
import { ROOMS } from '../../data/mockData';
import type { ScheduledMove } from '../../stores/useAppStore';

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
  /** この患者の移動履歴（seed＋登録分）。移動モードの履歴欄に表示 */
  moves?: ScheduledMove[];
  /** 取消済みの移動 ID 集合 */
  cancelledMoveIds?: string[];
  /** 履歴の「取消」実行 */
  onCancelMove?: (id: string) => void;
  /** 履歴の「更新」実行（移動先・移動日時の変更。ベッドは布団運用のため持たない） */
  onUpdateMove?: (id: string, patch: { toWardId: WardId; toRoom: string; scheduledAt: string }) => void;
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
  open, mode, target, orderingMode = false, mealCutoff = '17:00',
  moves = [], cancelledMoveIds = [], onCancelMove, onUpdateMove, onClose, onSubmit,
}) => {
  const initialWard: WardId = (target?.currentWard
    ?? (target?.unassigned?.designatedWardId !== 'tentative' ? target?.unassigned?.designatedWardId as WardId : undefined)
    ?? 'ward1') as WardId;
  const initialRoom = (target?.unassigned?.designatedRoomNumber !== 'tentative' ? target?.unassigned?.designatedRoomNumber as string : '') ?? '';

  const [toWard, setToWard] = React.useState<WardId>(initialWard);
  const [toRoom, setToRoom] = React.useState<string>(initialRoom);
  const [moveAt, setMoveAt] = React.useState<string>(formatNow());
  const [mealAt, setMealAt] = React.useState<string>(formatNow());
  // 配膳先変更日時は基本、移動日時と同じ。ON=移動日時と同値・入力欄非表示／OFF=個別入力
  const [mealSameAsMove, setMealSameAsMove] = React.useState(true);
  const [isolation, setIsolation] = React.useState(false);
  const [restraint, setRestraint] = React.useState(false);
  const [printMoveSheet, setPrintMoveSheet] = React.useState(false);
  const [printMealSheet, setPrintMealSheet] = React.useState(false);
  const [confirmCutoff, setConfirmCutoff] = React.useState(false);
  const [outOfRangeWarn, setOutOfRangeWarn] = React.useState(false);
  // 履歴の取消確認対象（要件4）
  const [cancelTargetId, setCancelTargetId] = React.useState<string | null>(null);
  // 更新モード（履歴行を選択して編集中の移動 ID）。null=新規登録モード
  const [editingMoveId, setEditingMoveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setToWard(initialWard);
      setToRoom(initialRoom);
      setMoveAt(formatNow());
      setMealAt(formatNow());
      setMealSameAsMove(true);
      setIsolation(false);
      setRestraint(false);
      setPrintMoveSheet(false);
      setPrintMealSheet(false);
      setConfirmCutoff(false);
      setOutOfRangeWarn(false);
      setCancelTargetId(null);
      setEditingMoveId(null);
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
      // 「移動日時と同じ」ON のときは移動日時を配膳先変更日時として送る
      mealAt: mealSameAsMove ? moveAt : mealAt,
      isolation: orderingMode ? isolation : undefined,
      restraint: orderingMode ? restraint : undefined,
      printMoveSheet,
      printMealSheet,
    });
  };

  // 履歴行を選択 → フォームに値を読み込み、更新モードへ（削除は不可）
  const startEdit = (mv: ScheduledMove) => {
    setToWard(mv.toWardId);
    setToRoom(mv.toRoom);
    setMoveAt(mv.scheduledAt);
    setEditingMoveId(mv.id);
  };
  const exitEdit = () => {
    setEditingMoveId(null);
    setToWard(initialWard);
    setToRoom(initialRoom);
    setMoveAt(formatNow());
  };
  const handleUpdate = () => {
    if (!editingMoveId || !toRoom || availableBeds.length === 0) return;
    onUpdateMove?.(editingMoveId, { toWardId: toWard, toRoom, scheduledAt: moveAt });
    onClose(); // AC-5: 更新後はダイアログを閉じて病棟マップに反映
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
            <Chip label={mode === 'assign' ? '割当' : editingMoveId ? '移動（更新）' : '移動'} size="small" color={editingMoveId ? 'warning' : 'primary'} />
            {orderingMode && <Chip label="オーダリング運用" size="small" color="warning" />}
            {editingMoveId && (
              <Typography variant="caption" color="text.secondary">
                履歴の移動を更新中（下部の履歴から選択。[新規登録に戻る] で解除）
              </Typography>
            )}
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

          <Stack spacing={0.75}>
            {/* 「移動日時と同じ」チェックは日時欄の上に配置（既定 ON） */}
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Checkbox
                  size="small"
                  checked={mealSameAsMove}
                  onChange={(_, v) => setMealSameAsMove(v)}
                />
              }
              label={<Typography variant="body2">配膳先変更日時は移動日時と同じ</Typography>}
            />
            {/* 移動日時 と 配膳先変更日時 は同じ行で左右に揃える（配膳側は非表示時は空欄で高さ維持しない） */}
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
              {!mealSameAsMove ? (
                <TextField
                  size="small"
                  label="配膳先変更日時"
                  type="datetime-local"
                  value={mealAt}
                  onChange={(e) => setMealAt(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: 1 }}
                />
              ) : (
                <Box sx={{ flex: 1 }} />
              )}
            </Stack>
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
                  移動履歴
                </Typography>
                {moves.length === 0 ? (
                  <Box sx={{ p: 1, border: '1px dashed', borderColor: 'divider', borderRadius: 1, color: 'text.secondary' }}>
                    <Typography variant="caption">この患者の登録済み移動はありません。</Typography>
                  </Box>
                ) : (
                  <Stack spacing={0.5}>
                    {/* 見出し・データ行を同一の grid テンプレートで揃える（列ズレ防止） */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '116px 68px 1fr 48px 60px 52px', columnGap: 1, alignItems: 'center', px: 1, py: 0.25, border: '1px solid transparent', color: 'text.secondary' }}>
                      <Typography variant="caption">移動日</Typography>
                      <Typography variant="caption">病棟</Typography>
                      <Typography variant="caption">病室</Typography>
                      <Typography variant="caption" sx={{ textAlign: 'center' }}>状態</Typography>
                      <Typography variant="caption" sx={{ textAlign: 'center' }}>種別</Typography>
                      <Typography variant="caption" sx={{ textAlign: 'right' }}>操作</Typography>
                    </Box>
                    {/* 入院（最古）を先頭に、以降は移動履歴（時系列・昇順） */}
                    {[...moves].sort((a, b) => (a.scheduledAt < b.scheduledAt ? -1 : 1)).map((m) => {
                      const cancelled = cancelledMoveIds.includes(m.id);
                      const sameWard = m.fromWardId === m.toWardId;
                      const isAdmission = sameWard && m.fromRoom === m.toRoom; // 入院（最初の病室）
                      const status = cancelled ? '取消' : (new Date(m.scheduledAt) > new Date() ? '未' : '済');
                      const statusColor = cancelled ? 'default' : status === '未' ? 'warning' : 'info';
                      // 種別: 入院（最初の病室）／転室（同一病棟の病室移動）／転棟（病棟間）
                      const kind = isAdmission ? '入院' : sameWard ? '転室' : '転棟';
                      const kindColor = isAdmission ? 'primary' : sameWard ? 'default' : 'secondary';
                      const editable = !isAdmission && !cancelled && !!onUpdateMove; // 予定・移動済のみ更新可
                      const editing = editingMoveId === m.id;
                      return (
                        <Box
                          key={m.id}
                          onClick={editable ? () => startEdit(m) : undefined}
                          sx={{
                            display: 'grid', gridTemplateColumns: '116px 68px 1fr 48px 60px 52px', columnGap: 1, alignItems: 'center',
                            px: 1, py: 0.75, border: '1px solid',
                            borderColor: editing ? 'primary.main' : 'divider',
                            bgcolor: editing ? 'action.selected' : 'transparent',
                            borderRadius: 1, opacity: cancelled ? 0.6 : 1,
                            cursor: editable ? 'pointer' : 'default',
                            '&:hover': editable ? { bgcolor: editing ? 'action.selected' : 'action.hover' } : undefined,
                          }}
                        >
                          <Typography variant="caption" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {m.scheduledAt.replace('T', ' ')}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {WARD_LABELS[m.toWardId]}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {m.toRoom}号室
                          </Typography>
                          <Box sx={{ textAlign: 'center' }}>
                            <Chip
                              label={status}
                              size="small"
                              color={statusColor}
                              variant={cancelled ? 'outlined' : 'filled'}
                              sx={{ height: 20 }}
                            />
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <Chip label={kind} size="small" color={kindColor} variant="outlined" sx={{ height: 20 }} />
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            {!cancelled && !isAdmission && onCancelMove && (
                              <Button
                                size="small"
                                color="error"
                                sx={{ minWidth: 0, px: 0.5 }}
                                onClick={(e) => { e.stopPropagation(); setCancelTargetId(m.id); }}
                              >
                                取消
                              </Button>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </>
          )}

          {cancelTargetId && (
            <Alert
              severity="warning"
              action={
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => setCancelTargetId(null)}>やめる</Button>
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    onClick={() => { onCancelMove?.(cancelTargetId); setCancelTargetId(null); }}
                  >
                    取消を実行
                  </Button>
                </Stack>
              }
            >
              この移動を取消します（履歴には取消として残ります。削除はされません）。
            </Alert>
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
        {editingMoveId && (
          <Button onClick={exitEdit} sx={{ mr: 'auto' }}>新規登録に戻る</Button>
        )}
        <Button onClick={onClose}>キャンセル</Button>
        {editingMoveId ? (
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={!toRoom || availableBeds.length === 0}
          >
            更新
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!toRoom || availableBeds.length === 0}
          >
            {(cutoffExceeded && !confirmCutoff) || (showOutOfRange && !outOfRangeWarn) ? '確認' : submitLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BedMoveDialog;
