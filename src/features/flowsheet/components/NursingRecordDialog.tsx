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
  /** 登録／更新の完了後に呼ばれる（呼び出し元でグリッド表示へ反映する等に使う）。mode は登録='new'／更新='edit'。 */
  onSaved?: (info: { title: string; recordedAt: ISODateTime; mode: 'new' | 'edit' }) => void;
}

// 記録形式は SOAP／経時記録の 2 形式（2026-08-24 確定。旧 FOCUS/フリーは廃止）
const FORM_LABELS: Record<RecordFormType, string> = {
  soap: 'SOAP',
  chronological: '経時記録',
};

const CONNECTION_OPTIONS: { value: ConnectionTarget; label: string }[] = [
  { value: 'flowsheet', label: 'フローシート' },
  { value: 'handover', label: '申し送り' },
  { value: 'wardJournal', label: '病棟日誌' },
  { value: 'interview', label: '面接実施' },
  { value: 'reportTo', label: '報告先' },
];

const REPORT_ROLES: ReportRoleCode[] = ['作', '確', '両'];

// 定型文(1 つの本文入力欄へ挿入するテキスト)。タブ切替時に空欄なら自動挿入、本文ありなら確認して上書き。
// SOAP は S/O/A/P の見出し 4 行。経時記録は行頭に時刻（HH:mm ）を付けた行を起点にする。
const bodyTemplateFor = (form: RecordFormType, hhmm: string): string =>
  form === 'soap' ? 'S\nO\nA\nP' : `${hhmm} `;

// 既存レコード(構造化)を 1 本のテキストに復元
const composeBodyText = (rec: NursingRecord): string => {
  const b = rec.body;
  if (b.formType === 'soap') {
    const { s, o, a, p } = b.body;
    // ダイアログ保存分は全文を s に持つ（o/a/p 空）ためそのまま返す。構造化シードは見出し付きで展開
    if (!o && !a && !p) return s;
    return `S\n${s}\nO\n${o}\nA\n${a}\nP\n${p}`;
  }
  return b.body.text;
};

// 保存時にテキスト → 構造化 body を作る(主フィールドに全文を入れる簡易マッピング)。
// SOAP 各欄・経時記録の「時刻＋本文」行構造への構造化入力は現時点スコープ外
// （将来は多職種の部門診療録全てを対象にした共通の仕組みとして検討余地を残す）。
const buildBodyForSave = (form: RecordFormType, text: string): NursingRecordBody => {
  switch (form) {
    case 'soap': return { formType: 'soap', body: { s: text, o: '', a: '', p: '' } };
    case 'chronological': return { formType: 'chronological', body: { text } };
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
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tplAnchor, setTplAnchor] = useState<HTMLElement | null>(null);
  // タブ切替で本文を破棄する確認(既存本文がある場合のみ表示)
  const [pendingFormSwitch, setPendingFormSwitch] = useState<RecordFormType | null>(null);
  // 直近に自動挿入した定型文（未編集判定用。経時記録は時刻を含むため文字列で保持する）
  const [lastTemplate, setLastTemplate] = useState<string>('');

  // ダイアログ open 時に既存レコードを読み込む
  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setErrors([]);
    setConfirmDelete(false);
    if (existing) {
      setTitle(existing.title);
      setRecordedAt(existing.recordedAt);
      setForm(existing.formType);
      setBodyText(composeBodyText(existing));
      setConnections(existing.connections);
      setReports(existing.reportTargets.map((rt) => ({ staffId: rt.staffId, role: rt.role })));
      setTags(existing.tags);
      setLastTemplate('');
    } else {
      const baseDate = defaultDate ?? new Date().toISOString().slice(0, 10);
      const nowHHmm = new Date().toTimeString().slice(0, 5);
      setTitle('');
      setRecordedAt(`${baseDate}T${nowHHmm}:00`);
      setForm(property.defaultRecordForm);
      const tpl = bodyTemplateFor(property.defaultRecordForm, nowHHmm);
      setBodyText(tpl); // 新規作成は既定タブの定型文を最初から挿入
      setLastTemplate(tpl);
      setConnections(['flowsheet']);
      setReports([]);
      setTags([]);
    }
    setPendingFormSwitch(null);
  }, [open, existing, initialMode, defaultDate, property.defaultRecordForm]);

  const isViewMode = mode === 'view';

  // 経時記録の定型文・時刻行に使う時刻（記載日時があればその時刻、なければ現在時刻）
  const currentHHmm = () =>
    recordedAt ? recordedAt.slice(11, 16) : new Date().toTimeString().slice(0, 5);

  const insertTemplateFor = (next: RecordFormType) => {
    const tpl = bodyTemplateFor(next, currentHHmm());
    setForm(next);
    setBodyText(tpl);
    setLastTemplate(tpl);
  };

  // タブ(form)切替ハンドラ: 本文が空か定型文のままなら挿入、編集済みなら確認
  const requestFormSwitch = (next: RecordFormType) => {
    if (isViewMode || next === form) return;
    const hasContent = bodyText.trim().length > 0;
    if (!hasContent || bodyText === lastTemplate) {
      insertTemplateFor(next);
      return;
    }
    setPendingFormSwitch(next);
  };

  const applyPendingFormSwitch = () => {
    if (!pendingFormSwitch) return;
    insertTemplateFor(pendingFormSwitch);
    setPendingFormSwitch(null);
  };

  const cancelPendingFormSwitch = () => setPendingFormSwitch(null);

  // 経時記録: 本文末尾に現在時刻の行頭(HH:mm )を改行して挿入する補助
  const appendTimeLine = () => {
    const hhmm = new Date().toTimeString().slice(0, 5);
    setBodyText((prev) => {
      // 末尾の改行のみ除去する（行内の末尾スペースは既存行の一部なので保持する）
      const trimmed = prev.replace(/\n+$/, '');
      return trimmed ? `${trimmed}\n${hhmm} ` : `${hhmm} `;
    });
  };

  const handleSubmit = () => {
    const errs: string[] = [];
    if (title.trim() === '') errs.push('タイトルは必須です（最大 20 文字）');
    if (title.length > 20) errs.push('タイトルは 20 文字以内で入力してください');
    if (!recordedAt) errs.push('記載日時は必須です');

    // 未来日は常に登録不可（固定・マスタ設定によらない）
    if (new Date(recordedAt).getTime() > Date.now()) {
      errs.push('未来日時の登録はできません（未来日は登録不可）。');
    }

    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);

    const body: NursingRecordBody = buildBodyForSave(form, bodyText);

    const shift: ShiftType = resolveShift(recordedAt.slice(11, 16), property.shiftStartTimes);

    if (existing && mode === 'edit') {
      updateRecord(existing.id, {
        title, recordedAt, shift, formType: form, body,
        connections, reportTargets: reports.map((r) => ({ staffId: r.staffId, role: r.role })),
        tags,
      });
    } else {
      addRecord({
        patientId,
        title, recordedAt, shift, formType: form, body,
        connections, reportTargets: reports.map((r) => ({ staffId: r.staffId, role: r.role })),
        tags,
      });
    }
    onSaved?.({ title, recordedAt, mode: existing && mode === 'edit' ? 'edit' : 'new' });
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
    const text = b.formType === 'soap'
      ? `S\n${b.body.s}\nO\n${b.body.o}\nA\n${b.body.a}\nP\n${b.body.p}`
      : b.body.text;
    setBodyText(text);
  };

  const renderBody = () => {
    const helper = form === 'soap'
      ? '※ SOAP 定型文(S/O/A/P の見出し行)に沿って記入'
      : '※ 行頭に時刻(HH:mm)を付けて時系列で記入。[時刻行を追加] で現在時刻の行を挿入';
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
            <Tab value="soap" label="SOAP" disabled={isViewMode && form !== 'soap'} />
            <Tab value="chronological" label="経時記録" disabled={isViewMode && form !== 'chronological'} />
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
              本文に内容があります。{FORM_LABELS[pendingFormSwitch]}の定型文で上書きしますか？（現在の内容は失われます）
            </Alert>
          )}

          {!isViewMode && (
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={(e) => setTplAnchor(e.currentTarget)}>
                テンプレート呼出
              </Button>
              {form === 'chronological' && (
                <Button size="small" variant="outlined" onClick={appendTimeLine}>
                  時刻行を追加
                </Button>
              )}
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
          <Button variant="contained" onClick={() => handleSubmit()}>
            {existing ? '更新' : '登録'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NursingRecordDialog;
