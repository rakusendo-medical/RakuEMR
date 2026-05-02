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
  Checkbox, IconButton, Tooltip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type {
  ObservationRecord, ObservationState, ObservationLinkSetting, IsolationSubtype,
} from '../../types';
import {
  MASTER_OBSERVATION_STATES, MASTER_OBSERVATION_FREQUENCY,
  MASTER_OBSERVATION_TEMPLATES, MASTER_OBSERVATION_TAGS,
} from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import { useFlowsheetStore } from '../../features/flowsheet/store';
import ObservationLinkSettingDialog from './ObservationLinkSettingDialog';
import ObservationContentBulkDialog from './ObservationContentBulkDialog';

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

const ObservationRecordDialog: React.FC<Props> = ({ open, onClose, patient, date, hour, subtype, isolationOrderId }) => {
  const addObservationRecordsBulk = useAppStore((s) => s.addObservationRecordsBulk);
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const currentUserRole = useAppStore((s) => s.currentUserRole);
  const addNursingRecord = useFlowsheetStore((s) => s.addNursingRecord);

  // マスタの区分別観察回数を初期回数として使用
  const subtypeKey = subtype === '隔離拘束' ? '拘束' : (subtype as '隔離' | '拘束' | 'その他');
  const initialFrequency = MASTER_OBSERVATION_FREQUENCY[subtypeKey] ?? 1;

  const [rows, setRows] = React.useState<RowDraft[]>([]);
  const [contentBulkOpen, setContentBulkOpen] = React.useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const slots = buildSlots(hour, initialFrequency);
    setRows(slots.map((time, i) => ({
      occurrence: i + 1,
      selected: true,
      time,
      state: '落ち着き',
      content: '',
      tags: [],
    })));
  }, [open, hour, initialFrequency]);

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
      // 既存行も再計算
      return [...prev, newRow].map((r, i) => ({
        ...r,
        time: `${String(hour).padStart(2, '0')}:${String(Math.min(59, interval * i)).padStart(2, '0')}`,
        occurrence: i + 1,
      }));
    });
  };
  const removeRow = (i: number) => {
    setRows((prev) => prev.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, occurrence: idx + 1 })));
  };

  const toggleSelectAll = () => {
    const allSelected = rows.every((r) => r.selected);
    setRows((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));
  };

  const handleApplyContentBulk = ({ content, tags }: { content: string; tags: string[] }) => {
    setRows((prev) => prev.map((r) => ({ ...r, content, tags })));
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
          formType: 'focus',
          body: {
            formType: 'focus',
            body: {
              focus: subtype === 'その他' ? '観察記録（その他）' : '隔離拘束観察',
              data: r.content || stateConf?.prescriptionText || '',
              action: stateConf?.prescriptionText || '',
              response: r.state,
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
            [{patient.id}] {patient.name}（{patient.age}歳） / {date} {String(hour).padStart(2, '0')}:00 〜
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
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
              return (
                <Box
                  key={i}
                  sx={{
                    display: 'flex', gap: 1, alignItems: 'flex-start',
                    p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1,
                    bgcolor: stateConf?.bgColor ?? '#fff',
                  }}
                >
                  <Checkbox size="small" checked={row.selected} onChange={(e) => updateRow(i, { selected: e.target.checked })} sx={{ p: 0.5 }} />
                  <Box sx={{ width: 70 }}>
                    <Typography variant="caption" color="text.secondary" display="block">{row.occurrence}回目</Typography>
                    <TextField
                      size="small" placeholder="HH:mm" sx={{ width: 70 }}
                      value={row.time}
                      onChange={(e) => updateRow(i, { time: e.target.value })}
                    />
                  </Box>
                  <TextField
                    select size="small" label="状態" sx={{ minWidth: 110 }}
                    value={row.state}
                    onChange={(e) => updateRow(i, { state: e.target.value as ObservationState })}
                  >
                    {STATE_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </TextField>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      multiline minRows={2} fullWidth size="small" label="内容"
                      value={row.content}
                      onChange={(e) => updateRow(i, { content: e.target.value })}
                      inputProps={{ maxLength: 3000 }}
                    />
                    <Stack direction="row" spacing={0.3} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                      {MASTER_OBSERVATION_TEMPLATES.slice(0, 3).map((t, ti) => (
                        <Tooltip key={ti} title={t}>
                          <Button size="small" variant="outlined" onClick={() => insertTemplate(i, t)}
                            sx={{ fontSize: '0.6rem', py: 0, px: 0.5, minWidth: 0 }}>
                            文例{ti + 1}
                          </Button>
                        </Tooltip>
                      ))}
                      <Box sx={{ flex: 1 }} />
                      {row.tags.map((t) => (
                        <Chip key={t} label={t} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                      ))}
                      <Button size="small" variant="outlined" onClick={() => setLinkDialogOpen(i)}
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
