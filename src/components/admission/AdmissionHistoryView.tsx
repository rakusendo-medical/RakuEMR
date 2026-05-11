import React from 'react';
import {
  Box, Stack, Typography, Tabs, Tab, FormControl, InputLabel, Select, MenuItem,
  Button, TextField, Paper, Chip, Alert, Divider, IconButton, Tooltip,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon, Lock as LockIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import type { AdmissionHistory, MedicalRecord, Patient } from '../../types';
import {
  PATIENTS, ADMISSION_HISTORY, MASTER_RESIDENCE_TYPES, MASTER_ADMIT_FORM_TYPES,
} from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import DeleteReasonDialog from './DeleteReasonDialog';
import AdmitFormChangeDialog from './AdmitFormChangeDialog';
import IsolationHistoryDialog from '../isolation/IsolationHistoryDialog';

type DetailTab = 'admit' | 'discharge';

type CancelAction = 'cancel-form-change' | 'cancel-admission' | 'cancel-discharge';

const fmtJP = (iso?: string) => {
  if (!iso) return '';
  const [d, t] = iso.split('T');
  if (!d) return iso;
  return t ? `${d.replace(/-/g, '/')} ${t}` : d.replace(/-/g, '/');
};

/**
 * ep-04 us-10: 入院歴・退院歴ビュー。
 *
 * 左ペインに入院期間グループを期別、各期間内の形態レコードを admitDate 昇順で表示。
 * 右ペインで詳細・編集・取消・形態変更を行う。
 */
const AdmissionHistoryView: React.FC = () => {
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const optionalFeatures = useAppStore((s) => s.optionalFeatures);
  const admissionHistoryEdits = useAppStore((s) => s.admissionHistoryEdits);
  const addedAdmissionHistory = useAppStore((s) => s.addedAdmissionHistory);
  const removedAdmissionHistoryIds = useAppStore((s) => s.removedAdmissionHistoryIds);
  const editAdmissionHistory = useAppStore((s) => s.editAdmissionHistory);
  const addAdmissionHistory = useAppStore((s) => s.addAdmissionHistory);
  const removeAdmissionHistory = useAppStore((s) => s.removeAdmissionHistory);
  const appendMedicalRecord = useAppStore((s) => s.appendMedicalRecord);
  const storeSelectedPatient = useAppStore((s) => s.selectedPatient);

  // 入院歴の合成（マスタ + 編集差分 + 追加 - 削除）
  const allHistories: AdmissionHistory[] = React.useMemo(() => {
    const base = ADMISSION_HISTORY
      .filter((r) => !removedAdmissionHistoryIds.includes(r.id))
      .map((r) => ({ ...r, ...admissionHistoryEdits[r.id] } as AdmissionHistory));
    const added = addedAdmissionHistory.filter((r) => !removedAdmissionHistoryIds.includes(r.id));
    return [...base, ...added];
  }, [admissionHistoryEdits, addedAdmissionHistory, removedAdmissionHistoryIds]);

  // 履歴を持つ患者のみ
  const patientsWithHistory: Patient[] = React.useMemo(() => {
    const ids = new Set(allHistories.map((h) => h.patientId));
    return PATIENTS.filter((p) => ids.has(p.id));
  }, [allHistories]);

  const [selectedPatientId, setSelectedPatientId] = React.useState<string>(() => {
    if (storeSelectedPatient && patientsWithHistory.find((p) => p.id === storeSelectedPatient.id)) {
      return storeSelectedPatient.id;
    }
    return patientsWithHistory[0]?.id ?? '';
  });

  const selectedPatient = patientsWithHistory.find((p) => p.id === selectedPatientId);

  // 当該患者の履歴を期間でグルーピング
  const periods = React.useMemo(() => {
    const recs = allHistories.filter((h) => h.patientId === selectedPatientId);
    const groups = new Map<string, AdmissionHistory[]>();
    for (const r of recs) {
      const key = r.periodId;
      const arr = groups.get(key) ?? [];
      arr.push(r);
      groups.set(key, arr);
    }
    // 期間内は admitDate 昇順、期間自体は最初の admitDate 昇順
    const result = Array.from(groups.entries()).map(([periodId, items]) => {
      const sorted = [...items].sort((a, b) => (a.admitDate < b.admitDate ? -1 : a.admitDate > b.admitDate ? 1 : 0));
      return { periodId, items: sorted };
    });
    result.sort((a, b) => (a.items[0].admitDate < b.items[0].admitDate ? -1 : 1));
    return result;
  }, [allHistories, selectedPatientId]);

  // 直近期間 = 最新期間（配列末尾）
  const latestPeriod = periods[periods.length - 1];

  // 選択中の形態レコード
  const [selectedRecordId, setSelectedRecordId] = React.useState<string | null>(null);

  // 患者切替・初回 mount で「最新期間の最後（current）形態」を選択
  React.useEffect(() => {
    if (!latestPeriod) {
      setSelectedRecordId(null);
      return;
    }
    const last = latestPeriod.items[latestPeriod.items.length - 1];
    setSelectedRecordId(last.id);
  }, [selectedPatientId, latestPeriod?.periodId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedRecord = React.useMemo(
    () => allHistories.find((h) => h.id === selectedRecordId) ?? null,
    [allHistories, selectedRecordId],
  );

  const [tab, setTab] = React.useState<DetailTab>('admit');

  // 編集フィールド（ローカル state、登録時に store に反映）
  const [admitReason, setAdmitReason] = React.useState('');
  const [dischargeReason, setDischargeReason] = React.useState('');
  const [outcome, setOutcome] = React.useState('');
  const [postDischargeAction, setPostDischargeAction] = React.useState('');
  const [returnTo, setReturnTo] = React.useState('');

  React.useEffect(() => {
    if (!selectedRecord) {
      setAdmitReason('');
      setDischargeReason('');
      setOutcome('');
      setPostDischargeAction('');
      setReturnTo('');
      return;
    }
    setAdmitReason(selectedRecord.admitReason ?? '');
    setDischargeReason(selectedRecord.dischargeReason ?? '');
    setOutcome(selectedRecord.outcome ?? '');
    setPostDischargeAction(selectedRecord.postDischargeAction ?? '');
    setReturnTo(selectedRecord.returnTo ?? '');
  }, [selectedRecordId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 操作ボタンの表示条件
  const isLatestPeriodRecord = !!selectedRecord && selectedRecord.periodId === latestPeriod?.periodId;
  const isCurrentForm = !!selectedRecord && !selectedRecord.dischargeDate; // 退院日 or 形態変更日が未設定 = 現形態
  const isFormChange = !!selectedRecord?.isAdmitFormChange;
  const hasIsDischargedPeriod = latestPeriod?.items.some((r) => r.status === '退院済') ?? false;
  // 入院取消可: 直近期間が現在入院中、かつ最初の形態レコード選択
  const isInitialOfLatestPeriod = !!selectedRecord
    && selectedRecord.periodId === latestPeriod?.periodId
    && selectedRecord.id === latestPeriod?.items[0]?.id;
  const canCancelAdmission = isInitialOfLatestPeriod
    && (latestPeriod?.items.some((r) => r.status === '入院中') ?? false);
  const canCancelDischarge = hasIsDischargedPeriod && isInitialOfLatestPeriod;

  // ダイアログ
  const [formChangeOpen, setFormChangeOpen] = React.useState(false);
  const [deleteReason, setDeleteReason] = React.useState<{ open: boolean; action: CancelAction | null }>({ open: false, action: null });
  // ===== ep-08 隔離拘束歴 =====
  const [isolationHistoryOpen, setIsolationHistoryOpen] = React.useState(false);

  const buildMedicalRecord = (content: string, tags: string[] = []): MedicalRecord => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ymd = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())}`;
    const ts = `${ymd} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    return {
      id: `MR-AH-${Date.now()}`,
      date: ymd,
      dayOfWeek: ['日', '月', '火', '水', '木', '金', '土'][now.getDay()],
      category: '入退院記録',
      author: selectedRecord?.doctorName ?? '主治医',
      authorRole: '医師',
      content,
      tags,
      timestamp: ts,
      likes: 0,
      comments: 0,
    };
  };

  const handleRegister = () => {
    if (!selectedRecord) return;
    editAdmissionHistory(selectedRecord.id, {
      admitReason: admitReason || undefined,
      dischargeReason: dischargeReason || undefined,
      outcome: outcome || undefined,
      postDischargeAction: postDischargeAction || undefined,
      returnTo: returnTo || undefined,
    });
    appendMedicalRecord(selectedPatientId, buildMedicalRecord(
      `入院歴を更新（${tab === 'admit' ? '入院時' : '退院時'}）／ 形態: ${selectedRecord.admitForm ?? ''}`,
      ['入院歴更新'],
    ));
    showSnackbar('入院歴を登録しました（変更日時・操作者を記録）', 'success');
  };

  const handleAdmitFormChange = (params: { newAdmitForm: string; changedAt: string; documents: string[] }) => {
    if (!selectedRecord) return;
    // 旧形態レコードの dischargeDate を「形態変更日時 - 1 分」に設定
    const changed = new Date(params.changedAt);
    const oneMinBefore = new Date(changed.getTime() - 60_000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const oneMinBeforeIso = `${oneMinBefore.getFullYear()}-${pad(oneMinBefore.getMonth() + 1)}-${pad(oneMinBefore.getDate())}T${pad(oneMinBefore.getHours())}:${pad(oneMinBefore.getMinutes())}`;
    editAdmissionHistory(selectedRecord.id, { dischargeDate: oneMinBeforeIso });

    // 新形態レコードを追加
    const newId = `AH-CHG-${Date.now()}`;
    const newRecord: AdmissionHistory = {
      id: newId,
      patientId: selectedRecord.patientId,
      patientName: selectedRecord.patientName,
      periodId: selectedRecord.periodId,
      admitDate: params.changedAt,
      wardId: selectedRecord.wardId,
      roomNumber: selectedRecord.roomNumber,
      doctorName: selectedRecord.doctorName,
      status: '入院中',
      isAdmitFormChange: true,
      admitForm: params.newAdmitForm,
      admitReason: `形態変更により ${params.newAdmitForm} に切替（${params.documents.length}文書添付）`,
    };
    addAdmissionHistory(newRecord);
    appendMedicalRecord(selectedPatientId, buildMedicalRecord(
      `入院形態を ${selectedRecord.admitForm ?? ''} → ${params.newAdmitForm} に変更（${fmtJP(params.changedAt)}）`,
      ['形態変更'],
    ));
    setSelectedRecordId(newId);
    setFormChangeOpen(false);
    showSnackbar(`入院形態を変更しました（${selectedRecord.admitForm} → ${params.newAdmitForm}）`, 'success');
  };

  const handleDeleteConfirmed = (params: { category: string; reason: string }) => {
    if (!selectedRecord || !deleteReason.action) return;
    const action = deleteReason.action;
    setDeleteReason({ open: false, action: null });

    if (action === 'cancel-form-change') {
      // 形態変更レコードを削除し、前形態の dischargeDate を元に戻す（モックでは undefined に戻す）
      const periodItems = latestPeriod?.items ?? [];
      const idx = periodItems.findIndex((r) => r.id === selectedRecord.id);
      const prev = idx > 0 ? periodItems[idx - 1] : null;
      removeAdmissionHistory(selectedRecord.id);
      if (prev) {
        editAdmissionHistory(prev.id, { dischargeDate: undefined });
      }
      appendMedicalRecord(selectedPatientId, buildMedicalRecord(
        `入院形態変更を取消（${selectedRecord.admitForm}）／ 分類: ${params.category}／理由: ${params.reason || '(未入力)'}`,
        ['形態変更取消'],
      ));
      showSnackbar('形態変更を取り消しました', 'success');
      // 選択を前形態に
      if (prev) setSelectedRecordId(prev.id);
    } else if (action === 'cancel-admission') {
      // 期間内の全レコードを削除
      const ids = (latestPeriod?.items ?? []).map((r) => r.id);
      ids.forEach((id) => removeAdmissionHistory(id));
      appendMedicalRecord(selectedPatientId, buildMedicalRecord(
        `入院取消／ 分類: ${params.category}／理由: ${params.reason || '(未入力)'}／入院確定オーダ・食事療法も連動取消`,
        ['入院取消'],
      ));
      showSnackbar('入院を取り消しました（期限管理文書削除済、入院確定オーダ・食事療法も連動取消）', 'success');
    } else if (action === 'cancel-discharge') {
      // 直近期間の最後のレコードを「入院中」に戻す（dischargeDate 等を消す）
      const last = latestPeriod?.items[latestPeriod.items.length - 1];
      if (last) {
        editAdmissionHistory(last.id, {
          status: '入院中',
          dischargeDate: undefined,
          dischargeReason: undefined,
          dischargeCategory: undefined,
          outcome: undefined,
          postDischargeAction: undefined,
          returnTo: undefined,
        });
      }
      appendMedicalRecord(selectedPatientId, buildMedicalRecord(
        `退院取消／ 分類: ${params.category}／理由: ${params.reason || '(未入力)'}`,
        ['退院取消'],
      ));
      showSnackbar('退院を取り消しました（退院時文書削除済）', 'success');
    }
  };

  if (patientsWithHistory.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">入院歴を持つ患者がいません。</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* ヘッダー */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>患者</InputLabel>
          <Select label="患者" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)}>
            {patientsWithHistory.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.id} {p.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab value="admit" label="入院時" />
          <Tab value="discharge" label="退院時" />
        </Tabs>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="食事歴（実装エピック未割当）">
            <span>
              <Button
                size="small" variant="outlined" startIcon={<RestaurantIcon />}
                onClick={() => showSnackbar('食事歴は別エピックで実装予定です', 'info')}
              >
                食事歴
              </Button>
            </span>
          </Tooltip>
          {/* ===== ep-08 隔離拘束歴 ===== */}
          <Button
            size="small" variant="outlined" startIcon={<LockIcon />}
            onClick={() => setIsolationHistoryOpen(true)}
          >
            隔離歴
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        {/* 左: 履歴リスト */}
        <Paper variant="outlined" sx={{ width: 320, p: 1.25, flexShrink: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>入院履歴</Typography>
          <Divider sx={{ mb: 1 }} />
          <Stack spacing={1.25}>
            {periods.map((period, pi) => {
              const first = period.items[0];
              const last = period.items[period.items.length - 1];
              const periodEnd = last.status === '退院済' ? fmtJP(last.dischargeDate) : '入院中';
              return (
                <Box key={period.periodId}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    期間 {pi + 1}: {fmtJP(first.admitDate)} 〜 {periodEnd}
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.5, pl: 1 }}>
                    {period.items.map((item) => {
                      const isSelected = item.id === selectedRecordId;
                      const isCurrent = !item.dischargeDate;
                      return (
                        <Box
                          key={item.id}
                          onClick={() => setSelectedRecordId(item.id)}
                          sx={{
                            p: 0.75,
                            border: '1px solid',
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            borderRadius: 0.75,
                            cursor: 'pointer',
                            bgcolor: isSelected ? '#eff6ff' : 'transparent',
                            '&:hover': { bgcolor: '#f0f7ff' },
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                              {item.admitForm ?? '(形態未設定)'}
                            </Typography>
                            {item.isAdmitFormChange && (
                              <Chip label="形態変更" size="small" sx={{ height: 18, fontSize: '0.625rem', bgcolor: '#fef3c7', color: '#a16207' }} />
                            )}
                            {isCurrent && (
                              <Chip label="現在" size="small" color="primary" sx={{ height: 18, fontSize: '0.625rem' }} />
                            )}
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {fmtJP(item.admitDate)} 〜 {item.dischargeDate ? fmtJP(item.dischargeDate) : '継続中'}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Paper>

        {/* 右: 詳細 */}
        <Paper variant="outlined" sx={{ flex: 1, p: 2, minWidth: 0 }}>
          {!selectedRecord ? (
            <Typography variant="body2" color="text.secondary">履歴を選択してください。</Typography>
          ) : (
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {selectedPatient?.id} {selectedPatient?.name}
                  {selectedPatient && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({selectedPatient.age}歳{selectedPatient.gender === 'M' ? '男性' : '女性'})
                    </Typography>
                  )}
                </Typography>
                {isCurrentForm && <Chip label="現在の形態" size="small" color="primary" />}
                {isFormChange && <Chip label="形態変更レコード" size="small" sx={{ bgcolor: '#fef3c7', color: '#a16207' }} />}
              </Stack>

              <Alert severity="warning" sx={{ py: 0.5 }} icon={<CloseIcon fontSize="small" />}>
                期限管理文書（入院時文書／退院時文書）は取消で削除されます。必要な文書は事前にダウンロードしてください。
              </Alert>

              {tab === 'admit' ? (
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5}>
                    <TextField size="small" label="入院日" value={fmtJP(selectedRecord.admitDate)} InputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                    <TextField size="small" label="指示医" value={selectedRecord.doctorName} InputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                  </Stack>
                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      size="small"
                      label="病棟・病室"
                      value={`${selectedRecord.wardId === 'ward1' ? '第１病棟' : '第２病棟'} ${selectedRecord.roomNumber}号室`}
                      InputProps={{ readOnly: true }}
                      sx={{ flex: 1 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>入院形態</InputLabel>
                      <Select label="入院形態" value={selectedRecord.admitForm ?? ''} disabled>
                        {MASTER_ADMIT_FORM_TYPES.map((f) => (<MenuItem key={f} value={f}>{f}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Stack>
                  <TextField
                    size="small"
                    label="入院決定の理由（最大 3000 文字）"
                    multiline rows={4}
                    value={admitReason}
                    onChange={(e) => setAdmitReason(e.target.value.slice(0, 3000))}
                    helperText={`${admitReason.length}/3000`}
                  />
                  {optionalFeatures.psychiatricLink && (
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>精神科入院有無</InputLabel>
                      <Select label="精神科入院有無" defaultValue="不明">
                        <MenuItem value="有">有</MenuItem>
                        <MenuItem value="無">無</MenuItem>
                        <MenuItem value="不明">不明</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      size="small"
                      label="退院日"
                      value={fmtJP(selectedRecord.dischargeDate)}
                      InputProps={{ readOnly: true }}
                      sx={{ flex: 1 }}
                    />
                    <TextField size="small" label="指示医" value={selectedRecord.doctorName} InputProps={{ readOnly: true }} sx={{ flex: 1 }} />
                  </Stack>
                  <Stack direction="row" spacing={1.5}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>退院区分</InputLabel>
                      <Select label="退院区分" value={selectedRecord.dischargeCategory ?? ''} disabled>
                        <MenuItem value="退院">退院</MenuItem>
                        <MenuItem value="退院後通院">退院後通院</MenuItem>
                        <MenuItem value="退院後転院">退院後転院</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel>転帰</InputLabel>
                      <Select label="転帰" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                        {['治癒', '軽快', '転院', '死亡', 'その他'].map((o) => (<MenuItem key={o} value={o}>{o}</MenuItem>))}
                      </Select>
                    </FormControl>
                  </Stack>
                  <TextField
                    size="small"
                    label="退院決定の理由（最大 3000 文字）"
                    multiline rows={3}
                    value={dischargeReason}
                    onChange={(e) => setDischargeReason(e.target.value.slice(0, 3000))}
                    helperText={`${dischargeReason.length}/3000`}
                  />
                  <TextField
                    size="small"
                    label="退院後処置（最大 1000 文字）"
                    multiline rows={2}
                    value={postDischargeAction}
                    onChange={(e) => setPostDischargeAction(e.target.value.slice(0, 1000))}
                    helperText={`${postDischargeAction.length}/1000`}
                  />
                  <FormControl size="small" sx={{ maxWidth: 240 }}>
                    <InputLabel>帰住先</InputLabel>
                    <Select label="帰住先" value={returnTo} onChange={(e) => setReturnTo(e.target.value)}>
                      <MenuItem value=""><em>未選択</em></MenuItem>
                      {MASTER_RESIDENCE_TYPES.map((r) => (<MenuItem key={r} value={r}>{r}</MenuItem>))}
                    </Select>
                  </FormControl>
                  {optionalFeatures.psychiatricLink && (
                    <TextField size="small" label="退院後の所在（精神科連携）" value="" />
                  )}
                </Stack>
              )}

              <Divider />
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                <Button variant="contained" onClick={handleRegister}>登録</Button>
                {isCurrentForm && isLatestPeriodRecord && (
                  <Button variant="outlined" color="primary" onClick={() => setFormChangeOpen(true)}>
                    形態変更
                  </Button>
                )}
                {isFormChange && (
                  <Button variant="outlined" color="warning" onClick={() => setDeleteReason({ open: true, action: 'cancel-form-change' })}>
                    変更取消
                  </Button>
                )}
                {canCancelAdmission && (
                  <Button variant="outlined" color="error" onClick={() => setDeleteReason({ open: true, action: 'cancel-admission' })}>
                    入院取消
                  </Button>
                )}
                {canCancelDischarge && (
                  <Button variant="outlined" color="error" onClick={() => setDeleteReason({ open: true, action: 'cancel-discharge' })}>
                    退院取消
                  </Button>
                )}
                <Box sx={{ flex: 1 }} />
                {selectedPatient && (
                  <Tooltip title="この患者のカルテを開く">
                    <IconButton size="small" disabled>
                      <CloseIcon sx={{ display: 'none' }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          )}
        </Paper>
      </Box>

      <AdmitFormChangeDialog
        open={formChangeOpen}
        currentForm={selectedRecord?.admitForm as any}
        patientName={selectedPatient?.name ?? ''}
        onClose={() => setFormChangeOpen(false)}
        onConfirm={handleAdmitFormChange}
      />

      <DeleteReasonDialog
        open={deleteReason.open}
        variant={deleteReason.action === 'cancel-discharge' ? 'discharge' : 'admit'}
        onClose={() => setDeleteReason({ open: false, action: null })}
        onConfirm={handleDeleteConfirmed}
      />

      {/* ===== ep-08 隔離拘束歴 ===== */}
      <IsolationHistoryDialog
        open={isolationHistoryOpen}
        onClose={() => setIsolationHistoryOpen(false)}
        patientId={selectedPatientId}
      />
    </Box>
  );
};

export default AdmissionHistoryView;
