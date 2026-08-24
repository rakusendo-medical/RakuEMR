// ===== ep-07 観察記録 =====
// 個別観察記録ダイアログ（フローシート／隔離拘束タブ・一覧タブ共通の個別入力ダイアログ）
// 参考システムマニュアル: 02 看護支援オプション.pdf p.235-243
//
// 1 時間内の観察回数分の行（[追加]/[削除]、最大はマスタ依存）
// 状態セレクト（色付き）／時間／内容（文例・タグ）／連携／選択チェック
// 連携設定 ON 時は、登録時に S3 (ep-10) の useFlowsheetStore.addNursingRecord にもダブル書き込み
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, MenuItem, Typography, Box, Chip,
  Checkbox, IconButton, Tooltip, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type {
  ObservationRecord, ObservationState, ObservationLinkSetting, IsolationSubtype,
} from '../../types';
import {
  MASTER_OBSERVATION_STATES, MASTER_OBSERVATION_FREQUENCY,
  MASTER_OBSERVATION_TEMPLATES, MASTER_OBSERVATION_TAGS, patientNumberOf,
} from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import { useFlowsheetStore } from '../../features/flowsheet/store';
import ObservationLinkSettingDialog from './ObservationLinkSettingDialog';
import ObservationContentBulkDialog from './ObservationContentBulkDialog';
import {
  isFutureTimeString, useNowTick, OBSERVATION_FUTURE_BLOCK_MESSAGE, OBSERVATION_FUTURE_BLOCK_LABEL,
} from './observationFutureBlock';

const STATE_OPTIONS: ObservationState[] = ['未記入', '浅眠', '落ち着き', '不穏', '睡眠', '中途覚醒'];

interface RowDraft {
  occurrence: number;
  selected: boolean;
  time: string;     // HH:mm
  state: ObservationState;
  content: string;
  tags: string[];
  linkSetting?: ObservationLinkSetting;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** 患者 */
  patient: { id: string; name: string; age: number; wardId: string };
  /** 対象日付（YYYY-MM-DD） */
  date: string;
  /** 対象時間枠の開始時刻（HH:00） */
  hour: number;
  /** 区分（隔離 / 拘束 / 隔離拘束 / その他） */
  subtype: IsolationSubtype | 'その他';
  /** 紐付き隔離拘束指示 ID（隔離/拘束/隔離拘束 の場合のみ） */
  isolationOrderId?: string;
  /** 初期行数の上書き（未指定時は区分別マスタ MASTER_OBSERVATION_FREQUENCY を使用）。
      例: 2 を渡すと 00 分・30 分の 2 行で開く */
  defaultFrequency?: number;
  /** 観察間隔（15 分単位 / 30 分単位）の切替を表示する */
  showIntervalToggle?: boolean;
  /** 同一時間帯の既存記録をプリロードし、保存時に置き換える（重複防止）。
      フローシートの観察グリッドから開く場合に使用 */
  replaceExistingForHour?: boolean;
}

function deriveShift(hour: number): 'night' | 'day' | 'evening' {
  if (hour < 8) return 'night';
  if (hour < 16) return 'day';
  return 'evening';
}

function buildSlots(hour: number, frequency: number): string[] {
  const interval = Math.max(1, Math.floor(60 / frequency));
  const slots: string[] = [];
  for (let i = 0; i < frequency; i++) {
    const m = i * interval;
    slots.push(`${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return slots;
}

const ObservationRecordDialog: React.FC<Props> = ({ open, onClose, patient, date, hour, subtype, isolationOrderId, defaultFrequency, showIntervalToggle, replaceExistingForHour }) => {
  const addObservationRecordsBulk = useAppStore((s) => s.addObservationRecordsBulk);
  const removeObservationRecord = useAppStore((s) => s.removeObservationRecord);
  const dynamicObservations = useAppStore((s) => s.dynamicObservationRecords);
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const currentUserRole = useAppStore((s) => s.currentUserRole);
  const addNursingRecord = useFlowsheetStore((s) => s.addNursingRecord);

  // 初期回数: defaultFrequency 優先、無ければ区分別マスタを使用
  const subtypeKey = subtype === '隔離拘束' ? '拘束' : (subtype as '隔離' | '拘束' | 'その他');
  const initialFrequency = defaultFrequency ?? MASTER_OBSERVATION_FREQUENCY[subtypeKey] ?? 1;

  // 観察間隔（分）。間隔切替表示時のみ使用。初期値は initialFrequency から導出（4 回→15 分 / それ以外→30 分）
  const [unitMinutes, setUnitMinutes] = React.useState<15 | 30>(initialFrequency >= 4 ? 15 : 30);
  // 実効回数: 間隔切替が有効なら 60/間隔、無ければ従来の初期回数
  const effectiveFrequency = showIntervalToggle ? Math.round(60 / unitMinutes) : initialFrequency;

  const [rows, setRows] = React.useState<RowDraft[]>([]);
  const [contentBulkOpen, setContentBulkOpen] = React.useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = React.useState<number | null>(null);

  // 未来日入力不可（ep-07 共通ルール）: 現在日時が行の開始時刻に達していない行は入力・登録できない。
  // 時刻経過で入力可へ変わるため、一定間隔で現在時刻を更新して再判定する。
  const nowTick = useNowTick();
  const isFutureRow = React.useCallback(
    (time: string) => isFutureTimeString(date, time, nowTick),
    [date, nowTick],
  );

  // 既定行（指定回数の等分スロット・状態は落ち着き）。未来枠の行は未選択で作る
  const buildDefaultRows = React.useCallback((freq: number): RowDraft[] =>
    buildSlots(hour, freq).map((time, i) => ({
      occurrence: i + 1,
      selected: !isFutureTimeString(date, time),
      time,
      state: '落ち着き' as ObservationState,
      content: '',
      tags: [],
    })), [hour, date]);

  // 同一時間帯の既存記録（置き換えモードでプリロード・保存時に削除する対象）
  const existingForHour = React.useMemo(() => {
    const hh = String(hour).padStart(2, '0');
    return dynamicObservations
      .filter((r) => r.patientId === patient.id && r.date === date && r.time.startsWith(`${hh}:`))
      .slice()
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [dynamicObservations, patient.id, date, hour]);

  // 開いた瞬間のみ初期化（置き換えモードで既存があればプリロード、無ければ既定）。
  // 間隔切替時の再構築はトグルの onChange 側で行う（ここでは effectiveFrequency に依存しない）。
  React.useEffect(() => {
    if (!open) return;
    if (replaceExistingForHour && existingForHour.length > 0) {
      setRows(existingForHour.map((r, i) => ({
        occurrence: i + 1, selected: true, time: r.time, state: r.state,
        content: r.note ?? '', tags: r.tags ?? [],
      })));
    } else {
      setRows(buildDefaultRows(effectiveFrequency));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hour, date, patient.id]);

  const updateRow = (i: number, patch: Partial<RowDraft>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const addRow = () => {
    if (rows.length >= 9) return;
    const next = rows.length + 1;
    const interval = Math.floor(60 / next);
    // 1 行追加し、開始時間を再計算（1 回目開始 = hour:00、以降は等分）
    setRows((prev) => {
      const newRow: RowDraft = {
        occurrence: next,
        selected: true,
        time: `${String(hour).padStart(2, '0')}:${String(interval * (next - 1)).padStart(2, '0')}`,
        state: '落ち着き',
        content: '',
        tags: [],
      };
      // 既存行も再計算（開始時刻が未来になった行は選択を外す）
      return [...prev, newRow].map((r, i) => {
        const time = `${String(hour).padStart(2, '0')}:${String(Math.min(59, interval * i)).padStart(2, '0')}`;
        return { ...r, time, occurrence: i + 1, selected: r.selected && !isFutureRow(time) };
      });
    });
  };
  const removeRow = (i: number) => {
    setRows((prev) => prev.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, occurrence: idx + 1 })));
  };

  // 全選択/全解除は入力可能な行（未来枠でない行）だけを対象にする
  const toggleSelectAll = () => {
    const selectable = rows.filter((r) => !isFutureRow(r.time));
    const allSelected = selectable.length > 0 && selectable.every((r) => r.selected);
    setRows((prev) => prev.map((r) => (isFutureRow(r.time) ? { ...r, selected: false } : { ...r, selected: !allSelected })));
  };

  const handleApplyContentBulk = ({ content, tags }: { content: string; tags: string[] }) => {
    setRows((prev) => prev.map((r) => (isFutureRow(r.time) ? r : { ...r, content, tags })));
  };

  const insertTemplate = (i: number, tmpl: string) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, content: r.content ? `${r.content}\n${tmpl}` : tmpl } : r)));
  };

  const handleSubmit = () => {
    const selected = rows.filter((r) => r.selected);
    if (selected.length === 0) {
      showSnackbar('登録対象の行が選択されていません', 'warning');
      return;
    }
    // 未来日入力不可: 時間欄を未来時刻へ手入力した行があれば登録を中止する
    const futureRows = selected.filter((r) => isFutureRow(r.time));
    if (futureRows.length > 0) {
      showSnackbar(`${OBSERVATION_FUTURE_BLOCK_MESSAGE}: ${futureRows.map((r) => r.time).join('、')}`, 'error');
      return;
    }
    const signedBy = currentUserRole === 'doctor' ? '田村 医師' : '山本 看護師';
    const now = new Date().toISOString();

    const newRecords: ObservationRecord[] = selected.map((r) => {
      const recordId = `OBS-${Date.now()}-${r.occurrence}`;
      // 連携 ON なら NursingRecord を S3 ストアにダブル書き込み
      let linkedNursingRecordId: string | undefined;
      if (r.linkSetting?.linkToNursingRecord) {
        const stateConf = MASTER_OBSERVATION_STATES.find((s) => s.state === r.state);
        const created = addNursingRecord({
          patientId: patient.id,
          title: subtype === 'その他' ? '観察記録（その他）' : '観察記録（隔離拘束）',
          recordedAt: `${date}T${r.time}:00`,
          shift: deriveShift(hour),
          formType: 'chronological',
          body: {
            formType: 'chronological',
            // 経時記録: 行頭に観察時刻を付けて状態・内容を 1 行で記録する
            body: {
              text: `${r.time} ${r.state}：${r.content || stateConf?.prescriptionText || ''}`,
            },
          },
          connections: ['flowsheet'],
          reportTargets: [],
          tags: ['隔離拘束観察', ...r.tags],
          isPublished: true,
        });
        linkedNursingRecordId = created.id;
      }
      return {
        id: recordId,
        isolationOrderId: isolationOrderId ?? '',
        patientId: patient.id,
        date,
        time: r.time,
        state: r.state,
        note: r.content || undefined,
        subtype,
        occurrence: r.occurrence,
        tags: r.tags.length > 0 ? r.tags : undefined,
        signedBy,
        linkSetting: r.linkSetting,
        linkedNursingRecordId,
      };
    });

    // 置き換えモード: 同一時間帯の既存記録を削除してから登録（重複・累積を防ぐ）
    if (replaceExistingForHour) {
      existingForHour.forEach((r) => removeObservationRecord(r.id));
    }
    addObservationRecordsBulk(newRecords);
    const linkedCount = newRecords.filter((r) => r.linkedNursingRecordId).length;
    showSnackbar(
      `観察記録を ${newRecords.length} 件登録しました${linkedCount > 0 ? `（うち ${linkedCount} 件を看護記録に連携）` : ''}`,
      'success',
    );
    onClose();
    void now;
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          観察記録
          <Chip label={subtype} size="small" color="warning" variant="outlined" />
          <Typography variant="body2" color="text.secondary">
            [{patientNumberOf(patient.id)}] {patient.name}（{patient.age}歳） / {date} {String(hour).padStart(2, '0')}:00 〜
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            {/* 観察間隔の切替（タイトル直下の独立行）。間隔を変えると行を作り直す。 */}
            {showIntervalToggle && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" color="text.secondary">観察間隔:</Typography>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={unitMinutes}
                  onChange={(_, v: 15 | 30 | null) => {
                    if (!v) return;
                    setUnitMinutes(v);
                    // 間隔変更時は既定スロットで作り直す
                    setRows(buildDefaultRows(Math.round(60 / v)));
                  }}
                >
                  <ToggleButton value={15}>15分単位</ToggleButton>
                  <ToggleButton value={30}>30分単位</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            )}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Button size="small" variant="outlined" onClick={toggleSelectAll}>
                {rows.every((r) => r.selected) ? '全解除' : '全選択'}
              </Button>
              <Button size="small" variant="outlined" onClick={() => setContentBulkOpen(true)}>
                内容一括入力
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button size="small" startIcon={<AddIcon />} onClick={addRow} disabled={rows.length >= 9}>
                追加 ({rows.length}/9)
              </Button>
            </Stack>

            {rows.map((row, i) => {
              const stateConf = MASTER_OBSERVATION_STATES.find((s) => s.state === row.state);
              // 未来枠の行: [選択] チェックと入力欄を非活性（時間欄のみ修正できるよう活性のまま残す）
              const future = isFutureRow(row.time);
              return (
                <Box
                  key={i}
                  data-testid={future ? 'obs-row-future' : 'obs-row'}
                  sx={{
                    display: 'flex', gap: 1, alignItems: 'flex-start',
                    p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1,
                    bgcolor: future ? '#e2e8f0' : (stateConf?.bgColor ?? '#fff'),
                    opacity: future ? 0.7 : 1,
                  }}
                >
                  <Tooltip title={future ? OBSERVATION_FUTURE_BLOCK_MESSAGE : ''} arrow>
                    <span>
                      <Checkbox
                        size="small" checked={row.selected} disabled={future}
                        inputProps={{ 'aria-label': `${row.occurrence}回目 選択` }}
                        onChange={(e) => updateRow(i, { selected: e.target.checked })} sx={{ p: 0.5 }}
                      />
                    </span>
                  </Tooltip>
                  <Box sx={{ width: 70 }}>
                    <Typography variant="caption" color="text.secondary" display="block">{row.occurrence}回目</Typography>
                    <TextField
                      size="small" placeholder="HH:mm" sx={{ width: 70 }}
                      value={row.time}
                      onChange={(e) => updateRow(i, { time: e.target.value })}
                    />
                    {future && (
                      <Typography variant="caption" color="error" display="block" sx={{ fontSize: '0.6rem' }}>
                        {OBSERVATION_FUTURE_BLOCK_LABEL}
                      </Typography>
                    )}
                  </Box>
                  <TextField
                    select size="small" label="状態" sx={{ minWidth: 110 }} disabled={future}
                    value={row.state}
                    onChange={(e) => updateRow(i, { state: e.target.value as ObservationState })}
                  >
                    {STATE_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </TextField>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      multiline minRows={2} fullWidth size="small" label="内容" disabled={future}
                      value={row.content}
                      onChange={(e) => updateRow(i, { content: e.target.value })}
                      inputProps={{ maxLength: 3000 }}
                    />
                    <Stack direction="row" spacing={0.3} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                      {MASTER_OBSERVATION_TEMPLATES.slice(0, 3).map((t, ti) => (
                        <Tooltip key={ti} title={t}>
                          <span>
                            <Button size="small" variant="outlined" disabled={future} onClick={() => insertTemplate(i, t)}
                              sx={{ fontSize: '0.6rem', py: 0, px: 0.5, minWidth: 0 }}>
                              文例{ti + 1}
                            </Button>
                          </span>
                        </Tooltip>
                      ))}
                      <Box sx={{ flex: 1 }} />
                      {row.tags.map((t) => (
                        <Chip key={t} label={t} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                      ))}
                      <Button size="small" variant="outlined" disabled={future} onClick={() => setLinkDialogOpen(i)}
                        sx={{ fontSize: '0.6rem', py: 0, px: 0.5, minWidth: 0 }}>
                        {row.linkSetting?.linkToNursingRecord ? '連携あり' : '未連携'}
                      </Button>
                    </Stack>
                  </Box>
                  <IconButton size="small" onClick={() => removeRow(i)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button variant="contained" onClick={handleSubmit}>登録</Button>
        </DialogActions>
      </Dialog>

      <ObservationContentBulkDialog
        open={contentBulkOpen}
        onClose={() => setContentBulkOpen(false)}
        onApply={handleApplyContentBulk}
      />
      {linkDialogOpen !== null && (
        <ObservationLinkSettingDialog
          open={linkDialogOpen !== null}
          onClose={() => setLinkDialogOpen(null)}
          initial={rows[linkDialogOpen]?.linkSetting}
          onApply={(setting) => updateRow(linkDialogOpen, { linkSetting: setting })}
        />
      )}
    </>
  );
};

export default ObservationRecordDialog;
