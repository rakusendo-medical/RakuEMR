// ===== ep-07 観察記録 =====
// 区分別の観察記録一括入力ダイアログ
// 参考システムマニュアル: 02 看護支援オプション.pdf p.260-264
//
// 隔離拘束一覧／記録タブの「区分回数枠タイトル（例: 隔離 16時 1回目）」クリックで起動。
// 該当時間・回数で記録対象となる患者のみ一覧表示し、状態・内容・連携・記録時間・記録者を入力して一括登録。
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, MenuItem, Typography, Box, Chip,
  Checkbox, Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import type {
  ObservationRecord, ObservationState, ObservationLinkSetting, IsolationOrder, IsolationSubtype, Patient,
} from '../../types';
import {
  MASTER_OBSERVATION_STATES, MASTER_STAFF_FOR_SIGN,
} from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import { useFlowsheetStore } from '../../features/flowsheet/store';
import ObservationContentBulkDialog from './ObservationContentBulkDialog';
import ObservationLinkSettingDialog from './ObservationLinkSettingDialog';

const STATE_OPTIONS: ObservationState[] = ['未記入', '浅眠', '落ち着き', '不穏', '睡眠', '中途覚醒'];

interface PatientRowDraft {
  patient: Patient;
  /** 紐付き隔離拘束指示 ID（subtype が「その他」の場合は空） */
  isolationOrderId: string;
  /** 既登録時は表示のみ（モックでは未対応で false 固定） */
  alreadyRegistered: boolean;
  selected: boolean;
  state: ObservationState;
  content: string;
  tags: string[];
  linkSetting?: ObservationLinkSetting;
  /** 解放時間ハイライト用（拘束入力時のみ表示） */
  releaseHint?: string;
  recordTime: string; // HH:mm
  signedBy: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** 対象区分 */
  subtype: IsolationSubtype | 'その他';
  /** 対象日付 (YYYY-MM-DD) */
  date: string;
  /** 対象時間（時のみ） */
  hour: number;
  /** 何回目か */
  occurrence: number;
  /** 候補患者と紐付き指示 */
  candidates: Array<{ patient: Patient; order: IsolationOrder }>;
}

function deriveShift(hour: number): 'night' | 'day' | 'evening' {
  if (hour < 8) return 'night';
  if (hour < 16) return 'day';
  return 'evening';
}

const ObservationBulkDialog: React.FC<Props> = ({ open, onClose, subtype, date, hour, occurrence, candidates }) => {
  const addObservationRecordsBulk = useAppStore((s) => s.addObservationRecordsBulk);
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const observationFutureBlock = useAppStore((s) => s.optionalFeatures.observationFutureBlock);
  const currentUserRole = useAppStore((s) => s.currentUserRole);
  const addNursingRecord = useFlowsheetStore((s) => s.addNursingRecord);

  const defaultStaff = currentUserRole === 'doctor' ? '田村 医師' : '山本 看護師';

  // 未来日チェック: 対象時刻が現在より未来の場合は表示候補から除外
  const filteredCandidates = React.useMemo(() => {
    if (!observationFutureBlock) return candidates;
    const target = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`);
    return candidates.filter(() => target.getTime() <= Date.now());
  }, [candidates, observationFutureBlock, date, hour]);

  const [rows, setRows] = React.useState<PatientRowDraft[]>([]);
  const [contentBulkOpen, setContentBulkOpen] = React.useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setRows(filteredCandidates.map(({ patient, order }) => {
      const releases = order.releaseTimes ?? [];
      const targetHHMM = `${String(hour).padStart(2, '0')}:00`;
      // 対象時間が解放時間に該当するかチェック（拘束入力時のみ表示）
      const matchedRelease = releases.find((r) => r.start <= targetHHMM && targetHHMM < r.end);
      const showReleaseHint = subtype === '拘束' && !!matchedRelease;
      return {
        patient,
        isolationOrderId: order.id,
        alreadyRegistered: false,
        selected: true,
        state: '落ち着き',
        content: '',
        tags: [],
        releaseHint: showReleaseHint ? `${matchedRelease!.start}-${matchedRelease!.end}` : undefined,
        recordTime: targetHHMM,
        signedBy: defaultStaff,
      };
    }));
  }, [open, filteredCandidates, subtype, hour, defaultStaff]);

  const updateRow = (i: number, patch: Partial<PatientRowDraft>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const toggleSelectAll = () => {
    const allSelected = rows.filter((r) => !r.alreadyRegistered).every((r) => r.selected);
    setRows((prev) => prev.map((r) => (r.alreadyRegistered ? r : { ...r, selected: !allSelected })));
  };

  const handleApplyContentBulk = ({ content, tags }: { content: string; tags: string[] }) => {
    setRows((prev) => prev.map((r) => (r.alreadyRegistered ? r : { ...r, content, tags })));
  };

  const handleSubmit = () => {
    const targets = rows.filter((r) => r.selected && !r.alreadyRegistered);
    if (targets.length === 0) {
      showSnackbar('登録対象がありません', 'warning');
      return;
    }
    const newRecords: ObservationRecord[] = targets.map((r, i) => {
      const recordId = `OBS-BULK-${Date.now()}-${i}`;
      let linkedNursingRecordId: string | undefined;
      if (r.linkSetting?.linkToNursingRecord) {
        const stateConf = MASTER_OBSERVATION_STATES.find((s) => s.state === r.state);
        const created = addNursingRecord({
          patientId: r.patient.id,
          title: subtype === 'その他' ? '観察記録（その他）' : '観察記録（隔離拘束）',
          recordedAt: `${date}T${r.recordTime}:00`,
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
        isolationOrderId: r.isolationOrderId,
        patientId: r.patient.id,
        date,
        time: r.recordTime,
        state: r.state,
        note: r.content || undefined,
        subtype,
        occurrence,
        tags: r.tags.length > 0 ? r.tags : undefined,
        signedBy: r.signedBy,
        linkSetting: r.linkSetting,
        linkedNursingRecordId,
      };
    });
    addObservationRecordsBulk(newRecords);
    const linkedCount = newRecords.filter((r) => r.linkedNursingRecordId).length;
    showSnackbar(
      `${newRecords.length} 件の観察記録を一括登録しました${linkedCount > 0 ? `（うち ${linkedCount} 件を看護記録に連携）` : ''}`,
      'success',
    );
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          観察記録（一括入力）
          <Chip label={subtype} size="small" color="warning" variant="outlined" />
          <Typography variant="body2" color="text.secondary">
            {date} {String(hour).padStart(2, '0')}:00 {occurrence}回目 / {rows.length}件
          </Typography>
          {observationFutureBlock && new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`).getTime() > Date.now() && rows.length === 0 && (
            <Chip label="未来日のため対象 0 件" size="small" color="error" />
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Button size="small" variant="outlined" onClick={toggleSelectAll}>
              {rows.filter((r) => !r.alreadyRegistered).every((r) => r.selected) ? '全解除' : '全選択'}
            </Button>
            <Button size="small" variant="outlined" onClick={() => setContentBulkOpen(true)}>
              内容一括入力
            </Button>
          </Stack>
          {rows.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                該当する患者はいません{observationFutureBlock ? '（未来日入力抑止が有効）' : ''}
              </Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }}>選択</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>患者</TableCell>
                  <TableCell sx={{ minWidth: 110 }}>状態</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>内容</TableCell>
                  <TableCell sx={{ width: 80 }}>連携</TableCell>
                  <TableCell sx={{ width: 80 }}>時間</TableCell>
                  <TableCell sx={{ minWidth: 110 }}>記録者</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, i) => {
                  const stateConf = MASTER_OBSERVATION_STATES.find((s) => s.state === row.state);
                  return (
                    <TableRow key={i} sx={{ bgcolor: row.alreadyRegistered ? '#f1f5f9' : (stateConf?.bgColor ?? '#fff') }}>
                      <TableCell>
                        <Checkbox
                          size="small"
                          checked={row.selected}
                          disabled={row.alreadyRegistered}
                          onChange={(e) => updateRow(i, { selected: e.target.checked })}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          [{row.patient.id}] {row.patient.name}（{row.patient.age}）
                        </Typography>
                        {row.releaseHint && (
                          <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, ml: 0.5 }}>
                            開放 {row.releaseHint}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <TextField
                          select size="small" fullWidth
                          value={row.state}
                          disabled={row.alreadyRegistered}
                          onChange={(e) => updateRow(i, { state: e.target.value as ObservationState })}
                        >
                          {STATE_OPTIONS.map((s) => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small" fullWidth multiline maxRows={3}
                          value={row.content}
                          disabled={row.alreadyRegistered}
                          onChange={(e) => updateRow(i, { content: e.target.value })}
                          inputProps={{ maxLength: 3000 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small" variant="outlined"
                          disabled={row.alreadyRegistered}
                          onClick={() => setLinkDialogOpen(i)}
                          sx={{ fontSize: '0.65rem', py: 0, px: 0.5, minWidth: 0 }}
                        >
                          {row.linkSetting?.linkToNursingRecord ? '連携あり' : '未連携'}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small" sx={{ width: 70 }}
                          value={row.recordTime}
                          disabled={row.alreadyRegistered}
                          onChange={(e) => updateRow(i, { recordTime: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          select size="small" fullWidth
                          value={row.signedBy}
                          disabled={row.alreadyRegistered}
                          onChange={(e) => updateRow(i, { signedBy: e.target.value })}
                        >
                          {MASTER_STAFF_FOR_SIGN.map((s) => (
                            <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={rows.length === 0}>登録</Button>
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

export default ObservationBulkDialog;
