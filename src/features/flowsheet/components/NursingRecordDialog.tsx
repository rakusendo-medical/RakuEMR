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
  /**
   * 登録／更新の完了後に呼ばれる（呼び出し元でグリッド表示へ反映する等に使う）。mode は登録='new'／更新='edit'。
   * recordId は登録／更新された NursingRecord の id（隔離拘束一覧など、指示へ紐付けたい呼び出し元が使う）。
   */
  onSaved?: (info: { title: string; recordedAt: ISODateTime; mode: 'new' | 'edit'; recordId: string }) => void;
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

// テンプレート(本文の雛形)。タブ切替時に空欄なら自動挿入、本文ありなら確認して上書き
const BODY_TEMPLATE: Record<RecordFormType, string> = {
  focus: 'F：\n\nD：\n\nA：\n\nR：\n',
  soap: 'S：\n\nO：\n\nA：\n\nP：\n',
  free: '',
};

// 既存レコード(構造化)を 1 本のテキストに復元
const composeBodyText = (rec: NursingRecord): string => {
  const b = rec.body;
  if (b.formType === 'focus') {
    return `F：${b.body.focus}\nD：${b.body.data}\nA：${b.body.action}\nR：${b.body.response}`;
  }
  if (b.formType === 'soap') {
    return `S：${b.body.s}\nO：${b.body.o}\nA：${b.body.a}\nP：${b.body.p}`;
  }
  return b.body.free;
};

// 保存時にテキスト → 構造化 body を作る(主フィールドに全文を入れる簡易マッピング)
const buildBodyForSave = (form: RecordFormType, text: string): NursingRecordBody => {
  switch (form) {
    case 'focus': return { formType: 'focus', body: { focus: text, data: '', action: '', response: '' } };
    case 'soap': return { formType: 'soap', body: { s: text, o: '', a: '', p: '' } };
    case 'free': return { formType: 'free', body: { free: text } };
  }
};

const sanitize = (s: string, forbidden: string[]): string => {
  let r = s;
  forbidden.forEach((c) => { r = r.split(c).join(''); });
  return r;
};

const NursingRecordDialog: React.FC<Props> = ({
  open, patientId, recordId, defaultDate, initialMode = 'new', onClose, onSaved,
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
  const [bodyText, setBodyText] = useState<string>('');
  const [connections, setConnections] = useState<ConnectionTarget[]>(['flowsheet']);
  const [reports, setReports] = useState<{ staffId: string; role: ReportRoleCode }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmFutureMsg, setConfirmFutureMsg] = useState<string | null>(null);
  const [tplAnchor, setTplAnchor] = useState<HTMLElement | null>(null);
  // タブ切替で本文を破棄する確認(既存本文がある場合のみ表示)
  const [pendingFormSwitch, setPendingFormSwitch] = useState<RecordFormType | null>(null);

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
      setBodyText(composeBodyText(existing));
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
      setBodyText(BODY_TEMPLATE[property.defaultRecordForm]); // 新規作成は既定タブのテンプレを最初から挿入
      setConnections(['flowsheet']);
      setReports([]);
      setTags([]);
      setIsPublished(true);
    }
    setPendingFormSwitch(null);
  }, [open, existing, initialMode, defaultDate, property.defaultRecordForm]);

  const isViewMode = mode === 'view';

  // タブ(form)切替ハンドラ: 本文が空ならテンプレ挿入、ありなら確認
  const requestFormSwitch = (next: RecordFormType) => {
    if (isViewMode || next === form) return;
    const hasContent = bodyText.trim().length > 0;
    if (!hasContent) {
      setForm(next);
      setBodyText(BODY_TEMPLATE[next]);
      return;
    }
    // 現テンプレと完全一致なら未編集とみなして無確認で切替
    if (bodyText === BODY_TEMPLATE[form]) {
      setForm(next);
      setBodyText(BODY_TEMPLATE[next]);
      return;
    }
    setPendingFormSwitch(next);
  };

  const applyPendingFormSwitch = () => {
    if (!pendingFormSwitch) return;
    setForm(pendingFormSwitch);
    setBodyText(BODY_TEMPLATE[pendingFormSwitch]);
    setPendingFormSwitch(null);
  };

  const cancelPendingFormSwitch = () => setPendingFormSwitch(null);

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

    const body: NursingRecordBody = buildBodyForSave(form, bodyText);

    const shift: ShiftType = resolveShift(recordedAt.slice(11, 16), property.shiftStartTimes);

    let savedId: string;
    if (existing && mode === 'edit') {
      updateRecord(existing.id, {
        title, recordedAt, shift, formType: form, body,
        connections, reportTargets: reports.map((r) => ({ staffId: r.staffId, role: r.role })),
        tags, isPublished,
      });
      savedId = existing.id;
    } else {
      savedId = addRecord({
        patientId,
        title, recordedAt, shift, formType: form, body,
        connections, reportTargets: reports.map((r) => ({ staffId: r.staffId, role: r.role })),
        tags, isPublished,
      }).id;
    }
    onSaved?.({ title, recordedAt, mode: existing && mode === 'edit' ? 'edit' : 'new', recordId: savedId });
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
    // テンプレの構造化本文を 1 本のテキストに展開して挿入
    const b = tpl.body;
    let text = '';
    if (b.formType === 'focus') {
      text = `F：${b.body.focus}\nD：${b.body.data}\nA：${b.body.action}\nR：${b.body.response}`;
    } else if (b.formType === 'soap') {
      text = `S：${b.body.s}\nO：${b.body.o}\nA：${b.body.a}\nP：${b.body.p}`;
    } else {
      text = b.body.free;
    }
    setBodyText(text);
  };

  const renderBody = () => {
    const helper = form === 'focus'
      ? '※ FOCUS テンプレート(F/D/A/R)の見出しに沿って記入'
      : form === 'soap'
        ? '※ SOAP テンプレート(S/O/A/P)の見出しに沿って記入'
        : '※ 自由記述';
    return (
      <TextField
        label="本文"
        helperText={helper}
        multiline minRows={10} fullWidth size="small"
        value={bodyText}
        onChange={(e) => setBodyText(sanitize(e.target.value, property.forbiddenChars))}
        InputProps={{ readOnly: isViewMode, sx: { fontFamily: 'monospace', fontSize: '0.875rem' } }}
      />
    );
  };

  const titleText = useMemo(() => {
    if (mode === 'view') return '看護経過記録（参照）';
    if (mode === 'edit') return '看護経過記録（編集）';
    return '看護経過記録（新規作成）';
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
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <TextField
              label="タイトル"
              size="small"
              value={title}
              onChange={(e) => setTitle(sanitize(e.target.value, property.forbiddenChars).slice(0, 20))}
              inputProps={{ maxLength: 20, readOnly: isViewMode }}
              sx={{ flex: 1 }}
              helperText={`${title.length}/20`}
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
            onChange={(_, v: RecordFormType) => requestFormSwitch(v)}
            sx={{ minHeight: 32, '& .MuiTab-root': { minHeight: 32 } }}
          >
            <Tab value="focus" label="FOCUS" disabled={isViewMode && form !== 'focus'} />
            <Tab value="soap" label="SOAP" disabled={isViewMode && form !== 'soap'} />
            <Tab value="free" label="フリー" disabled={isViewMode && form !== 'free'} />
          </Tabs>

          {/* 本文が編集済みの状態でタブ切替するときの上書き確認 */}
          {pendingFormSwitch && (
            <Alert
              severity="warning"
              action={
                <Stack direction="row" spacing={1}>
                  <Button color="inherit" size="small" onClick={cancelPendingFormSwitch}>
                    キャンセル
                  </Button>
                  <Button color="warning" size="small" variant="contained" onClick={applyPendingFormSwitch}>
                    上書きして {FORM_LABELS[pendingFormSwitch]} に切替
                  </Button>
                </Stack>
              }
            >
              本文に内容があります。{FORM_LABELS[pendingFormSwitch]} テンプレートで上書きしますか?(現在の内容は失われます)
            </Alert>
          )}

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

          {/* タグ（テンプレート呼出の下）: 自由入力＋Enter で複数付与できる */}
          <Box>
            <Typography variant="subtitle2">タグ</Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
              {tags.map((t) => (
                <Chip
                  key={t} label={t} size="small"
                  onDelete={isViewMode ? undefined : () => setTags((prev) => prev.filter((x) => x !== t))}
                />
              ))}
              {!isViewMode && (
                <TextField
                  size="small" placeholder="タグを追加 (Enter)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  inputProps={{ 'aria-label': 'タグを追加' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault();
                      const v = tagInput.trim();
                      setTags((prev) => (prev.includes(v) ? prev : [...prev, v]));
                      setTagInput('');
                    }
                  }}
                />
              )}
            </Stack>
          </Box>

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
            この看護経過記録を削除します。よろしいですか？（論理削除）
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
