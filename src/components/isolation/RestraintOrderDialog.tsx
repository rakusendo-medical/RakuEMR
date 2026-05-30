// ===== ep-05 隔離拘束指示 =====
// 隔離拘束指示ダイアログ（カルテ記事作成ダイアログ／隔離拘束指示）
// 参考システムマニュアル: 01 基本システム.pdf p.2182-2210
//
// タイトルセレクトで 12 種（隔離/拘束/隔離拘束 × 開始/解除/継続/変更）に切替し、
// 表示項目（開始日時/終了日時/拘束部位/開放時間/文書チェック）が動的に連動する。
// 「告知書を印刷する」ON で作成完了時に RestraintNoticePrintDialog を起動する。
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, MenuItem, Typography, Box, Chip,
  FormControlLabel, Checkbox, IconButton, Divider, Alert,
  FormControl, InputLabel, Select,
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Print as PrintIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import type {
  IsolationOrder, IsolationSubtype, IsolationOperation, ReleaseTimeEntry, Patient,
} from '../../types';
import {
  MASTER_RESTRAINT_PARTS,
  MASTER_RELEASE_TIME_TEMPLATES,
  MASTER_ISOLATION_DOCS_BY_CONTEXT,
  ISOLATION_ORDERS,
  type AdmitFormType,
} from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import RestraintNoticePrintDialog from './RestraintNoticePrintDialog';

const SUBTYPES: IsolationSubtype[] = ['隔離', '拘束', '隔離拘束'];
const OPERATIONS: IsolationOperation[] = ['開始', '解除', '継続', '変更'];

/** タイトルから { subtype, operation } を導出 */
function parseTitle(title: string): { subtype: IsolationSubtype; operation: IsolationOperation } | null {
  for (const sub of SUBTYPES) {
    for (const op of OPERATIONS) {
      if (title === `${sub}${op}`) return { subtype: sub, operation: op };
    }
  }
  return null;
}

/** 表示項目の有無 */
function fieldsForTitle(title: string) {
  const parsed = parseTitle(title);
  if (!parsed) return { hasStart: true, hasEnd: false, hasParts: false, hasReleaseTimes: false, hasDocs: false };
  const { subtype, operation } = parsed;
  const isRelease = operation === '解除';
  const isStart = operation === '開始';
  const isRestraintLike = subtype === '拘束' || subtype === '隔離拘束';
  return {
    hasStart: !isRelease,
    hasEnd: isRelease,
    hasParts: isRestraintLike && !isRelease,
    hasReleaseTimes: !isRelease,
    hasDocs: isStart,
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  patient: Patient | null;
  /** 起動時のタイトル固定（指示リンクから渡される。例: '隔離開始'） */
  initialTitle: string;
  /** 編集モード時の元指示 ID（未指定なら新規） */
  editOrderId?: string;
}

const RestraintOrderDialog: React.FC<Props> = ({ open, onClose, patient, initialTitle, editOrderId }) => {
  const isEdit = !!editOrderId;
  const dynamicOrders = useAppStore((s) => s.dynamicIsolationOrders);
  const addIsolationOrder = useAppStore((s) => s.addIsolationOrder);
  const updateIsolationOrder = useAppStore((s) => s.updateIsolationOrder);
  const releaseIsolationOrder = useAppStore((s) => s.releaseIsolationOrder);
  const appendMedicalRecord = useAppStore((s) => s.appendMedicalRecord);
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  const sourceOrder = React.useMemo<IsolationOrder | null>(() => {
    if (!editOrderId) return null;
    return (
      dynamicOrders.find((o) => o.id === editOrderId) ??
      ISOLATION_ORDERS.find((o) => o.id === editOrderId) ??
      null
    );
  }, [editOrderId, dynamicOrders]);

  // 患者の入院形態（モック: P003=措置入院 / P004=任意入院 / P006=医療保護入院 / その他は任意入院）
  const admitForm: AdmitFormType = React.useMemo(() => {
    if (!patient) return '任意入院';
    if (patient.id === 'P003') return '措置入院';
    if (patient.id === 'P006') return '医療保護入院';
    return '任意入院';
  }, [patient]);

  const [title, setTitle] = React.useState(initialTitle);
  const [startDatetime, setStartDatetime] = React.useState('');
  const [endDatetime, setEndDatetime] = React.useState('');
  const [restraintParts, setRestraintParts] = React.useState<string[]>([]);
  const [releaseTimes, setReleaseTimes] = React.useState<ReleaseTimeEntry[]>([]);
  const [showReleaseTimes, setShowReleaseTimes] = React.useState(false);
  const [docChecks, setDocChecks] = React.useState<string[]>([]);
  const [content, setContent] = React.useState('');
  const [printNotice, setPrintNotice] = React.useState(false);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [noticeOpen, setNoticeOpen] = React.useState(false);
  const [pendingNoticePayload, setPendingNoticePayload] = React.useState<{ orderId: string; orderDate: string; startDatetime: string } | null>(null);

  // 初期化（open or initialTitle 変化時）
  React.useEffect(() => {
    if (!open) return;
    setTitle(initialTitle);
    if (sourceOrder) {
      setStartDatetime(sourceOrder.startDatetime ?? '');
      setEndDatetime(sourceOrder.endDatetime ?? '');
      setRestraintParts(sourceOrder.restraintParts ?? []);
      setReleaseTimes(sourceOrder.releaseTimes ?? []);
      setShowReleaseTimes((sourceOrder.releaseTimes ?? []).length > 0);
      setDocChecks(sourceOrder.linkedDocumentChecks ?? []);
    } else {
      const now = new Date();
      const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setStartDatetime(iso);
      setEndDatetime(iso);
      setRestraintParts([]);
      setReleaseTimes([]);
      setShowReleaseTimes(false);
      setDocChecks([]);
    }
    setContent('');
    setPrintNotice(false);
    setErrors([]);
  }, [open, initialTitle, sourceOrder]);

  const fields = fieldsForTitle(title);
  const parsed = parseTitle(title);

  // 開始時のみ参照する文書群
  const docCandidates = React.useMemo<string[]>(() => {
    if (!fields.hasDocs || !parsed) return [];
    return MASTER_ISOLATION_DOCS_BY_CONTEXT[admitForm]?.[parsed.subtype] ?? [];
  }, [fields.hasDocs, parsed, admitForm]);

  // 開放時間の操作
  const addReleaseRow = () => {
    if (releaseTimes.length >= 9) return;
    setReleaseTimes((prev) => [...prev, { start: '', end: '' }]);
  };
  const removeReleaseRow = (idx: number) => {
    setReleaseTimes((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateReleaseRow = (idx: number, patch: Partial<ReleaseTimeEntry>) => {
    setReleaseTimes((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const loadTemplate = (templateName: string) => {
    const tmpl = MASTER_RELEASE_TIME_TEMPLATES.find((t) => t.name === templateName);
    if (!tmpl) return;
    if (releaseTimes.length > 0 && !window.confirm('既存の開放時間入力をクリアしてテンプレートを読み込みますか？')) return;
    setReleaseTimes(tmpl.entries.map((e) => ({ ...e })));
    setShowReleaseTimes(true);
  };
  const openReleaseTimes = () => {
    setShowReleaseTimes(true);
    if (releaseTimes.length === 0 && MASTER_RELEASE_TIME_TEMPLATES.length > 0) {
      // 初回クリックでデフォルトテンプレートを読み込む
      setReleaseTimes(MASTER_RELEASE_TIME_TEMPLATES[0].entries.map((e) => ({ ...e })));
    }
  };

  const toggleRestraintPart = (part: string) => {
    setRestraintParts((prev) => (prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]));
  };
  const toggleDocCheck = (doc: string) => {
    setDocChecks((prev) => (prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]));
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!parsed) {
      errs.push('タイトルを選択してください');
      return errs;
    }
    if (fields.hasStart && !startDatetime) errs.push('開始日時を入力してください');
    if (fields.hasEnd && !endDatetime) errs.push('終了日時を入力してください');
    if (fields.hasParts && restraintParts.length === 0) errs.push('拘束部位を 1 件以上選択してください');
    // 開放時間: 開始時間以前不可
    if (fields.hasReleaseTimes && startDatetime) {
      const startHHMM = startDatetime.slice(11, 16); // 'YYYY-MM-DD HH:mm' 想定
      releaseTimes.forEach((r, i) => {
        if (r.start && r.start < startHHMM) errs.push(`開放時間 ${i + 1} 行目: 開始時間が指示開始時間 (${startHHMM}) 以前です`);
        if (r.start && r.end && r.start >= r.end) errs.push(`開放時間 ${i + 1} 行目: 開始時間 < 終了時間 となるよう入力してください`);
      });
    }
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0 || !parsed || !patient) return;

    const orderDate = startDatetime.slice(0, 10).replace(/-/g, '/') || endDatetime.slice(0, 10).replace(/-/g, '/');
    const orderId = sourceOrder?.id ?? `ISO-${Date.now()}`;
    const dt = startDatetime || endDatetime;

    if (parsed.operation === '解除' && sourceOrder) {
      releaseIsolationOrder(sourceOrder.id, endDatetime);
    } else if (sourceOrder) {
      updateIsolationOrder(sourceOrder.id, {
        subtype: parsed.subtype,
        operation: parsed.operation,
        startDatetime: fields.hasStart ? startDatetime : sourceOrder.startDatetime,
        endDatetime: fields.hasEnd ? endDatetime : undefined,
        restraintParts: fields.hasParts ? restraintParts : undefined,
        releaseTimes: fields.hasReleaseTimes && releaseTimes.length > 0 ? releaseTimes : undefined,
        linkedDocumentChecks: fields.hasDocs ? docChecks : sourceOrder.linkedDocumentChecks,
      });
    } else {
      // 新規
      const newOrder: IsolationOrder = {
        id: orderId,
        patientId: patient.id,
        patientName: patient.name,
        type: parsed.subtype === '隔離拘束' ? '拘束' : parsed.subtype, // 後方互換: 旧 type は隔離 or 拘束
        subtype: parsed.subtype,
        operation: parsed.operation,
        startDatetime: fields.hasStart ? startDatetime : '',
        endDatetime: fields.hasEnd ? endDatetime : undefined,
        wardId: patient.wardId,
        roomNumber: `${patient.roomNumber}-${patient.bedLabel}`,
        doctorName: patient.doctorName,
        restraintParts: fields.hasParts ? restraintParts : undefined,
        releaseTimes: fields.hasReleaseTimes && releaseTimes.length > 0 ? releaseTimes : undefined,
        linkedDocumentChecks: fields.hasDocs ? docChecks : undefined,
        isPending: false,
      };
      addIsolationOrder(newOrder);
    }

    // カルテ記事追加（解除指示には拘束部位を載せない）
    const tagBody: string[] = [];
    if (fields.hasStart) tagBody.push(`開始: ${startDatetime}`);
    if (fields.hasEnd) tagBody.push(`終了: ${endDatetime}`);
    if (fields.hasParts && restraintParts.length > 0) tagBody.push(`拘束部位: ${restraintParts.join('・')}`);
    if (fields.hasReleaseTimes && releaseTimes.length > 0) {
      tagBody.push(`開放時間: ${releaseTimes.filter((r) => r.start && r.end).map((r) => `${r.start}-${r.end}`).join(', ')}`);
    }
    if (fields.hasDocs && docChecks.length > 0) tagBody.push(`文書: ${docChecks.join('・')}`);
    if (content) tagBody.push(`所見: ${content}`);

    appendMedicalRecord(patient.id, {
      id: `MR-${orderId}`,
      date: orderDate.replace(/\//g, '-'),
      dayOfWeek: '—',
      category: '医師記録',
      author: patient.doctorName,
      authorRole: '医師',
      content: `【${title}】\n${tagBody.join('\n')}`,
      tags: ['隔離拘束'],
      timestamp: dt,
      likes: 0,
      comments: 0,
    });

    showSnackbar(`${title} を登録しました`, 'success');

    if (printNotice) {
      // 告知書印刷ダイアログを起動
      setPendingNoticePayload({ orderId, orderDate, startDatetime: dt });
      setNoticeOpen(true);
    } else {
      onClose();
    }
  };

  const handleNoticePrint = (payload: { content: string; interviewForm: string }) => {
    if (pendingNoticePayload) {
      updateIsolationOrder(pendingNoticePayload.orderId, {
        noticePrint: { printedAt: new Date().toISOString(), content: payload.content, interviewForm: payload.interviewForm },
      });
      showSnackbar('告知書を印刷しました（モック）', 'success');
    }
    setNoticeOpen(false);
    setPendingNoticePayload(null);
    onClose();
  };

  const handleNoticeClose = () => {
    setNoticeOpen(false);
    setPendingNoticePayload(null);
    onClose();
  };

  const titleOptions = React.useMemo(() => {
    const opts: string[] = [];
    SUBTYPES.forEach((s) => OPERATIONS.forEach((op) => opts.push(`${s}${op}`)));
    return opts;
  }, []);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          隔離拘束指示
          {patient && (
            <Typography variant="body2" color="text.secondary">
              [{patient.patientNumber ?? patient.id}] {patient.name}（{patient.gender === 'M' ? '男' : '女'} {patient.age}歳 / 入院形態: {admitForm}）
            </Typography>
          )}
          {isEdit && <Chip label="編集" size="small" color="info" variant="outlined" sx={{ ml: 'auto' }} />}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            {errors.length > 0 && (
              <Alert severity="error" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                <Stack spacing={0.3}>
                  {errors.map((e, i) => <Typography key={i} variant="caption">{e}</Typography>)}
                </Stack>
              </Alert>
            )}

            <TextField
              select size="small" label="タイトル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            >
              {titleOptions.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {fields.hasStart && (
                <TextField
                  size="small" label="開始日時" sx={{ flex: 1 }}
                  placeholder="YYYY-MM-DD HH:mm"
                  value={startDatetime}
                  onChange={(e) => setStartDatetime(e.target.value)}
                />
              )}
              {fields.hasEnd && (
                <TextField
                  size="small" label="終了日時" sx={{ flex: 1 }}
                  placeholder="YYYY-MM-DD HH:mm"
                  value={endDatetime}
                  onChange={(e) => setEndDatetime(e.target.value)}
                />
              )}
            </Box>

            {fields.hasParts && (
              <Box>
                <Typography variant="caption" color="text.secondary">拘束部位（複数選択可）</Typography>
                <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 0.5 }}>
                  {MASTER_RESTRAINT_PARTS.map((p) => (
                    <Chip
                      key={p} label={p} size="small"
                      color={restraintParts.includes(p) ? 'primary' : 'default'}
                      variant={restraintParts.includes(p) ? 'filled' : 'outlined'}
                      onClick={() => toggleRestraintPart(p)}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {fields.hasReleaseTimes && (
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">開放時間（最大 9 件）</Typography>
                  <Box sx={{ flex: 1 }} />
                  {!showReleaseTimes && (
                    <Button size="small" variant="outlined" startIcon={<ScheduleIcon />} onClick={openReleaseTimes}>
                      開放時間を入力
                    </Button>
                  )}
                  {showReleaseTimes && (
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel shrink>テンプレート読込</InputLabel>
                      <Select
                        label="テンプレート読込"
                        value=""
                        displayEmpty
                        notched
                        onChange={(e) => loadTemplate(e.target.value as string)}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              mt: 0.5,
                              bgcolor: 'background.paper',
                              boxShadow: 3,
                              '& .MuiMenuItem-root': {
                                color: 'text.primary',
                              },
                            },
                          },
                          // Dialog 上で確実に最前面に出すため明示
                          sx: { zIndex: (theme) => theme.zIndex.modal + 1 },
                        }}
                      >
                        <MenuItem value="" disabled>
                          <em>テンプレートを選択</em>
                        </MenuItem>
                        {MASTER_RELEASE_TIME_TEMPLATES.map((t) => (
                          <MenuItem key={t.name} value={t.name}>{t.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Stack>
                {showReleaseTimes && (
                  <Stack spacing={0.5}>
                    {releaseTimes.map((r, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" sx={{ width: 30 }}>{i + 1}.</Typography>
                        <TextField
                          size="small" placeholder="HH:mm" sx={{ width: 100 }}
                          value={r.start}
                          onChange={(e) => updateReleaseRow(i, { start: e.target.value })}
                        />
                        <Typography variant="caption">〜</Typography>
                        <TextField
                          size="small" placeholder="HH:mm" sx={{ width: 100 }}
                          value={r.end}
                          onChange={(e) => updateReleaseRow(i, { end: e.target.value })}
                        />
                        <IconButton size="small" onClick={() => removeReleaseRow(i)}><DeleteIcon fontSize="small" /></IconButton>
                      </Stack>
                    ))}
                    <Button
                      size="small" startIcon={<AddIcon />}
                      onClick={addReleaseRow}
                      disabled={releaseTimes.length >= 9}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      追加 ({releaseTimes.length}/9)
                    </Button>
                  </Stack>
                )}
              </Box>
            )}

            {fields.hasDocs && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  文書チェック（入院形態: {admitForm} × {parsed?.subtype}）
                </Typography>
                {docCandidates.length === 0 && (
                  <Typography variant="caption" color="text.disabled" display="block">
                    対象文書がマスタに定義されていません
                  </Typography>
                )}
                <Stack sx={{ mt: 0.5 }}>
                  {docCandidates.map((d) => (
                    <FormControlLabel
                      key={d}
                      control={<Checkbox size="small" checked={docChecks.includes(d)} onChange={() => toggleDocCheck(d)} />}
                      label={<Typography variant="body2">{d}</Typography>}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            <TextField
              multiline minRows={3} fullWidth size="small" label="所見（カルテ本文）"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <Divider />

            <FormControlLabel
              control={<Checkbox checked={printNotice} onChange={(e) => setPrintNotice(e.target.checked)} />}
              label={
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PrintIcon fontSize="small" />
                  <Typography variant="body2">告知書を印刷する（隔離拘束指示箋）</Typography>
                </Stack>
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>キャンセル</Button>
          <Button variant="contained" onClick={handleSubmit}>{isEdit ? '更新' : '作成'}</Button>
        </DialogActions>
      </Dialog>

      <RestraintNoticePrintDialog
        open={noticeOpen}
        onClose={handleNoticeClose}
        mode="new"
        orderDate={pendingNoticePayload?.orderDate ?? ''}
        startDatetime={pendingNoticePayload?.startDatetime ?? ''}
        initialContent={content}
        onPrint={handleNoticePrint}
      />
    </>
  );
};

export default RestraintOrderDialog;
