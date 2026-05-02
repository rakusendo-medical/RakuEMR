import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Stack, Typography, TextField, Button, Alert,
  Tabs, Tab, Select, MenuItem, FormControl, InputLabel, FormControlLabel, Checkbox,
  Chip, Divider, IconButton, Menu, ListItemText, MenuList,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useFlowsheetStore, resolveShift } from '../store';
import type {
  ConnectionTarget, ISODate, ISODateTime, NursingRecord, NursingRecordBody,
  RecordFormType, ReportRoleCode, ShiftType,
} from '../types';

type Mode = 'view' | 'edit' | 'new';

interface Props {
  open: boolean;
  patientId: string;
  /** 既存レコード参照／編集時に指定 */
  recordId?: string | null;
  /** 新規作成時のデフォルト日（フローシート起点で当該日が来る） */
  defaultDate?: ISODate;
  initialMode?: Mode;
  onClose: () => void;
}

const FORM_LABELS: Record<RecordFormType, string> = {
  focus: 'FOCUS',
  soap: 'SOAP',
  free: 'フリー',
};

const CONNECTION_OPTIONS: { value: ConnectionTarget; label: string }[] = [
  { value: 'flowsheet', label: 'フローシート' },
  { value: 'handover', label: '申し送り' },
  { value: 'wardJournal', label: '病棟日誌' },
  { value: 'interview', label: '面接実施' },
  { value: 'reportTo', label: '報告先' },
];

const REPORT_ROLES: ReportRoleCode[] = ['作', '確', '両'];

interface DraftBodyFocus { focus: string; data: string; action: string; response: string; }
interface DraftBodySoap { s: string; o: string; a: string; p: string; }
interface DraftBodyFree { free: string; }

const emptyBodyFor = (form: RecordFormType): NursingRecordBody => {
  switch (form) {
    case 'focus': return { formType: 'focus', body: { focus: '', data: '', action: '', response: '' } };
    case 'soap': return { formType: 'soap', body: { s: '', o: '', a: '', p: '' } };
    case 'free': return { formType: 'free', body: { free: '' } };
  }
};

const sanitize = (s: string, forbidden: string[]): string => {
  let r = s;
  forbidden.forEach((c) => { r = r.split(c).join(''); });
  return r;
};

const NursingRecordDialog: React.FC<Props> = ({
  open, patientId, recordId, defaultDate, initialMode = 'new', onClose,
}) => {
  const property = useFlowsheetStore((s) => s.property);
  const records = useFlowsheetStore((s) => s.nursingRecords);
  const templates = useFlowsheetStore((s) => s.recordTemplates);
  const staffs = useFlowsheetStore((s) => s.staffs);
  const currentStaffId = useFlowsheetStore((s) => s.currentStaffId);
  const addRecord = useFlowsheetStore((s) => s.addNursingRecord);
  const updateRecord = useFlowsheetStore((s) => s.updateNursingRecord);
  const deleteRecord = useFlowsheetStore((s) => s.deleteNursingRecord);

  const existing = recordId ? records.find((r) => r.id === recordId) ?? null : null;

  const [mode, setMode] = useState<Mode>(initialMode);
  const [title, setTitle] = useState('');
  const [recordedAt, setRecordedAt] = useState<ISODateTime>('');
  const [form, setForm] = useState<RecordFormType>(property.defaultRecordForm);
  const [bodyFocus, setBodyFocus] = useState<DraftBodyFocus>({ focus: '', data: '', action: '', response: '' });
  const [bodySoap, setBodySoap] = useState<DraftBodySoap>({ s: '', o: '', a: '', p: '' });
  const [bodyFree, setBodyFree] = useState<DraftBodyFree>({ free: '' });
  const [connections, setConnections] = useState<ConnectionTarget[]>(['flowsheet']);
  const [reports, setReports] = useState<{ staffId: string; role: ReportRoleCode }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmFutureMsg, setConfirmFutureMsg] = useState<string | null>(null);
  const [tplAnchor, setTplAnchor] = useState<HTMLElement | null>(null);

  // ダイアログ open 時に既存レコードを読み込む
  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setErrors([]);
    setConfirmDelete(false);
    setConfirmFutureMsg(null);
    if (existing) {
      setTitle(existing.title);
      setRecordedAt(existing.recordedAt);
      setForm(existing.formType);
      const b = existing.body.body as DraftBodyFocus | DraftBodySoap | DraftBodyFree;
      if (existing.formType === 'focus') {
        setBodyFocus(b as DraftBodyFocus);
        setBodySoap({ s: '', o: '', a: '', p: '' });
        setBodyFree({ free: '' });
      } else if (existing.formType === 'soap') {
        setBodySoap(b as DraftBodySoap);
        setBodyFocus({ focus: '', data: '', action: '', response: '' });
        setBodyFree({ free: '' });
      } else {
        setBodyFree(b as DraftBodyFree);
        setBodyFocus({ focus: '', data: '', action: '', response: '' });
        setBodySoap({ s: '', o: '', a: '', p: '' });
      }
      setConnections(existing.connections);
      setReports(existing.reportTargets.map((rt) => ({ staffId: rt.staffId, role: rt.role })));
      setTags(existing.tags);
      setIsPublished(existing.isPublished);
    } else {
      const baseDate = defaultDate ?? new Date().toISOString().slice(0, 10);
      const nowHHmm = new Date().toTimeString().slice(0, 5);
      setTitle('');
      setRecordedAt(`${baseDate}T${nowHHmm}:00`);
      setForm(property.defaultRecordForm);
      setBodyFocus({ focus: '', data: '', action: '', response: '' });
      setBodySoap({ s: '', o: '', a: '', p: '' });
      setBodyFree({ free: '' });
      setConnections(['flowsheet']);
      setReports([]);
      setTags([]);
      setIsPublished(true);
    }
  }, [open, existing, initialMode, defaultDate, property.defaultRecordForm]);

  const isViewMode = mode === 'view';

  // FOCUS のフォーカス値はタイトルと連動
  useEffect(() => {
    if (form === 'focus' && !isViewMode) {
      setTitle(bodyFocus.focus.slice(0, 20));
    }
  }, [form, bodyFocus.focus, isViewMode]);

  const handleSubmit = (afterConfirm = false) => {
    const errs: string[] = [];
    if (title.trim() === '') errs.push('タイトルは必須です（最大 20 文字）');
    if (title.length > 20) errs.push('タイトルは 20 文字以内で入力してください');
    if (!recordedAt) errs.push('記載日時は必須です');

    // 未来日チェック
    const dt = new Date(recordedAt).getTime();
    const nowEpoch = Date.now();
    const isFuture = dt > nowEpoch;
    if (isFuture) {
      if (property.validateFuture) {
        errs.push('未来日時の登録はできません（マスタ validate.future）。');
      } else if (property.confirmFuture && !afterConfirm) {
        setConfirmFutureMsg('未来日時の登録です。続行しますか？');
        if (errs.length > 0) setErrors(errs);
        return;
      }
    }

    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    setConfirmFutureMsg(null);

    const body: NursingRecordBody =
      form === 'focus' ? { formType: 'focus', body: bodyFocus }
      : form === 'soap' ? { formType: 'soap', body: bodySoap }
      : { formType: 'free', body: bodyFree };

    const shift: ShiftType = resolveShift(recordedAt.slice(11, 16), property.shiftStartTimes);

    if (existing && mode === 'edit') {
      updateRecord(existing.id, {
        title, recordedAt, shift, formType: form, body,
        connections, reportTargets: reports.map((r) => ({ staffId: r.staffId, role: r.role })),
        tags, isPublished,
      });
    } else {
      addRecord({
        patientId,
        title, recordedAt, shift, formType: form, body,
        connections, reportTargets: reports.map((r) => ({ staffId: r.staffId, role: r.role })),
        tags, isPublished,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (!existing) return;
    deleteRecord(existing.id);
    onClose();
  };

  const insertTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    setTplAnchor(null);
    if (!tpl) return;
    setForm(tpl.formType);
    if (tpl.body.formType === 'focus') setBodyFocus(tpl.body.body);
    if (tpl.body.formType === 'soap') setBodySoap(tpl.body.body);
    if (tpl.body.formType === 'free') setBodyFree(tpl.body.body);
  };

  const renderBody = () => {
    const ro = isViewMode;
    const tf = (label: string, value: string, on: (s: string) => void, rows = 3) => (
      <TextField
        label={label} multiline rows={rows} fullWidth size="small"
        value={value}
        onChange={(e) => on(sanitize(e.target.value, property.forbiddenChars))}
        InputProps={{ readOnly: ro }}
      />
    );
    switch (form) {
      case 'focus':
        return (
          <Stack spacing={1}>
            {tf('F（フォーカス）— タイトルに連動', bodyFocus.focus, (s) => setBodyFocus({ ...bodyFocus, focus: s }), 1)}
            {tf('D（データ）', bodyFocus.data, (s) => setBodyFocus({ ...bodyFocus, data: s }))}
            {tf('A（アクション）', bodyFocus.action, (s) => setBodyFocus({ ...bodyFocus, action: s }))}
            {tf('R（レスポンス）', bodyFocus.response, (s) => setBodyFocus({ ...bodyFocus, response: s }))}
          </Stack>
        );
      case 'soap':
        return (
          <Stack spacing={1}>
            {tf('S（主観）', bodySoap.s, (s) => setBodySoap({ ...bodySoap, s }))}
            {tf('O（客観）', bodySoap.o, (s) => setBodySoap({ ...bodySoap, o: s }))}
            {tf('A（アセスメント）', bodySoap.a, (s) => setBodySoap({ ...bodySoap, a: s }))}
            {tf('P（プラン）', bodySoap.p, (s) => setBodySoap({ ...bodySoap, p: s }))}
          </Stack>
        );
      case 'free':
        return tf('本文', bodyFree.free, (s) => setBodyFree({ free: s }), 8);
    }
  };

  const titleText = useMemo(() => {
    if (mode === 'view') return '看護記録（参照）';
    if (mode === 'edit') return '看護記録（編集）';
    return '看護記録（新規作成）';
  }, [mode]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography variant="h6">{titleText}</Typography>
          {existing && (
            <Chip
              size="small" variant="outlined"
              label={`作成: ${staffs.find((s) => s.id === existing.recordedBy)?.name ?? ''} / ${existing.registeredAt.replace('T', ' ')}`}
            />
          )}
          {existing?.updatedAt && (
            <Chip
              size="small" variant="outlined" color="warning"
              label={`修正: ${staffs.find((s) => s.id === existing.updatedBy)?.name ?? ''} / ${existing.updatedAt.replace('T', ' ')}`}
            />
          )}
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            <Stack>{errors.map((e, i) => <span key={i}>{e}</span>)}</Stack>
          </Alert>
        )}
        {confirmFutureMsg && (
          <Alert
            severity="warning" sx={{ mb: 1 }}
            action={
              <Stack direction="row" spacing={1}>
                <Button color="inherit" size="small" onClick={() => setConfirmFutureMsg(null)}>戻る</Button>
                <Button color="warning" size="small" variant="contained" onClick={() => handleSubmit(true)}>続行</Button>
              </Stack>
            }
          >
            {confirmFutureMsg}
          </Alert>
        )}

        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="タイトル"
              size="small"
              value={title}
              onChange={(e) => setTitle(sanitize(e.target.value, property.forbiddenChars).slice(0, 20))}
              inputProps={{ maxLength: 20, readOnly: isViewMode || form === 'focus' }}
              sx={{ flex: 1 }}
              helperText={form === 'focus' ? '※ FOCUS のフォーカスと連動' : `${title.length}/20`}
            />
            <TextField
              label="記載日時" size="small" type="datetime-local"
              value={recordedAt.slice(0, 16)}
              onChange={(e) => setRecordedAt(`${e.target.value}:00`)}
              InputLabelProps={{ shrink: true }}
              InputProps={{ readOnly: isViewMode }}
            />
          </Stack>

          <Tabs
            value={form}
            onChange={(_, v: RecordFormType) => !isViewMode && setForm(v)}
            sx={{ minHeight: 32, '& .MuiTab-root': { minHeight: 32 } }}
          >
            <Tab value="focus" label="FOCUS" disabled={isViewMode && form !== 'focus'} />
            <Tab value="soap" label="SOAP" disabled={isViewMode && form !== 'soap'} />
            <Tab value="free" label="フリー" disabled={isViewMode && form !== 'free'} />
          </Tabs>

          {!isViewMode && (
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={(e) => setTplAnchor(e.currentTarget)}>
                テンプレート呼出
              </Button>
              <Menu
                open={Boolean(tplAnchor)}
                anchorEl={tplAnchor}
                onClose={() => setTplAnchor(null)}
              >
                <MenuList>
                  {templates.map((t) => (
                    <MenuItem key={t.id} onClick={() => insertTemplate(t.id)}>
                      <ListItemText
                        primary={t.name}
                        secondary={`形式: ${FORM_LABELS[t.formType]}`}
                      />
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            </Stack>
          )}

          {renderBody()}

          <Divider />

          <Box>
            <Typography variant="subtitle2">連携</Typography>
            <Stack direction="row" flexWrap="wrap">
              {CONNECTION_OPTIONS.map((opt) => (
                <FormControlLabel
                  key={opt.value}
                  control={
                    <Checkbox
                      size="small"
                      checked={connections.includes(opt.value)}
                      disabled={isViewMode}
                      onChange={(e) => {
                        setConnections(
                          e.target.checked
                            ? [...connections, opt.value]
                            : connections.filter((x) => x !== opt.value),
                        );
                      }}
                    />
                  }
                  label={opt.label}
                />
              ))}
            </Stack>
          </Box>

          {connections.includes('reportTo') && (
            <Box>
              <Typography variant="subtitle2">報告先</Typography>
              <Stack spacing={0.5}>
                {reports.map((rt, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>職員</InputLabel>
                      <Select
                        label="職員"
                        value={rt.staffId}
                        disabled={isViewMode}
                        onChange={(e) => setReports(reports.map((r, idx) => idx === i ? { ...r, staffId: e.target.value } : r))}
                      >
                        {staffs.map((s) => (
                          <MenuItem key={s.id} value={s.id}>{s.name}（{s.role}）</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <InputLabel>報告種別</InputLabel>
                      <Select
                        label="報告種別"
                        value={rt.role}
                        disabled={isViewMode}
                        onChange={(e) => setReports(reports.map((r, idx) => idx === i ? { ...r, role: e.target.value as ReportRoleCode } : r))}
                      >
                        {REPORT_ROLES.map((r) => (
                          <MenuItem key={r} value={r}>[{r}]</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {!isViewMode && (
                      <IconButton size="small" onClick={() => setReports(reports.filter((_, idx) => idx !== i))}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                ))}
                {!isViewMode && (
                  <Button
                    size="small"
                    onClick={() => setReports([...reports, { staffId: staffs[0]?.id ?? '', role: '確' }])}
                  >
                    報告先を追加
                  </Button>
                )}
              </Stack>
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2">タグ</Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
              {tags.map((t) => (
                <Chip
                  key={t} label={t} size="small"
                  onDelete={isViewMode ? undefined : () => setTags(tags.filter((x) => x !== t))}
                />
              ))}
              {!isViewMode && (
                <TextField
                  size="small" placeholder="タグを追加 (Enter)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault();
                      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
                      setTagInput('');
                    }
                  }}
                />
              )}
            </Stack>
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={isPublished}
                disabled={isViewMode}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
            }
            label="記事を公開する（オフ: 看護メニュー内のみ表示）"
          />
        </Stack>

        {confirmDelete && (
          <Alert
            severity="error" sx={{ mt: 1 }}
            action={
              <Stack direction="row" spacing={1}>
                <Button color="inherit" size="small" onClick={() => setConfirmDelete(false)}>戻る</Button>
                <Button color="error" size="small" variant="contained" onClick={handleDelete}>削除する</Button>
              </Stack>
            }
          >
            この看護記録を削除します。よろしいですか？（論理削除）
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        {existing && mode === 'view' && (
          <Button onClick={() => setMode('edit')}>編集</Button>
        )}
        {existing && mode !== 'view' && (
          <Button color="error" onClick={() => setConfirmDelete(true)}>削除</Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>閉じる</Button>
        {!isViewMode && (
          <Button variant="contained" onClick={() => handleSubmit(false)}>
            {existing ? '更新' : '登録'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NursingRecordDialog;
