import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Stack, Typography, TextField, Button, Alert,
  RadioGroup, Radio, FormControlLabel, FormControl, FormLabel,
  Checkbox, Select, MenuItem, InputLabel, Chip,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useFlowsheetStore, getActivePatternForDate } from '../store';
import type { CareItemMaster, CareRecord, ISODate } from '../types';

interface Props {
  open: boolean;
  patientId: string;
  date: ISODate;
  onClose: () => void;
}

/** ケア項目のキーから「投薬者」入力を出すか判定（id 接頭辞 ci-medication-） */
const hasAdministrator = (ci: CareItemMaster): boolean => ci.id.startsWith('ci-medication-');

/** 禁則文字を取り除く（モック挙動: 入力時に弾く） */
const stripForbidden = (s: string, forbidden: string[]): string => {
  let r = s;
  forbidden.forEach((c) => { r = r.split(c).join(''); });
  return r;
};

type DraftValue = string | number | string[] | boolean;

interface DraftRow {
  /** 既存 record id（紐付け） */
  existingId?: string;
  careItemId: string;
  value: DraftValue;
  administeredBy?: string; // 服薬項目のみ
}

const initialValueFor = (ci: CareItemMaster): DraftValue => {
  switch (ci.type) {
    case 'check': return false;
    case 'check-multi': return [];
    default: return '';
  }
};

const FlowsheetEditDialog: React.FC<Props> = ({ open, patientId, date, onClose }) => {
  const property = useFlowsheetStore((s) => s.property);
  const careItemMaster = useFlowsheetStore((s) => s.careItemMaster);
  const patternMaster = useFlowsheetStore((s) => s.patternMaster);
  const applications = useFlowsheetStore((s) => s.patternApplications);
  const careRecords = useFlowsheetStore((s) => s.careRecords);
  const staffs = useFlowsheetStore((s) => s.staffs);
  const currentStaffId = useFlowsheetStore((s) => s.currentStaffId);
  const changeLogs = useFlowsheetStore((s) => s.changeLogs);
  const addCareRecord = useFlowsheetStore((s) => s.addCareRecord);
  const updateCareRecord = useFlowsheetStore((s) => s.updateCareRecord);
  const deleteCareRecord = useFlowsheetStore((s) => s.deleteCareRecord);

  const activeApp = getActivePatternForDate(applications, patientId, date);
  const activePattern = activeApp?.patternId
    ? patternMaster.find((p) => p.id === activeApp.patternId) ?? null
    : null;

  const careItemMap = useMemo(
    () => new Map(careItemMaster.map((c) => [c.id, c])),
    [careItemMaster],
  );

  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const ids = activePattern?.careItemIds ?? [];
    const records = careRecords.filter((c) => c.patientId === patientId && c.date === date);
    const next: DraftRow[] = ids.map((id) => {
      const ci = careItemMap.get(id);
      const rec = records.find((r) => r.careItemId === id);
      const initial = ci ? initialValueFor(ci) : '';
      return {
        existingId: rec?.id,
        careItemId: id,
        value: rec ? rec.value : initial,
        administeredBy: rec?.administeredBy
          ?? (ci && hasAdministrator(ci)
            ? (property.medicationInitialOperator === 'logon' ? currentStaffId : '')
            : undefined),
      };
    });
    setDrafts(next);
    setErrors([]);
  }, [open, activePattern, careItemMap, careRecords, patientId, date, property.medicationInitialOperator, currentStaffId]);

  const updateDraft = (idx: number, patch: Partial<DraftRow>) =>
    setDrafts((d) => d.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const handleRegister = () => {
    const errs: string[] = [];
    drafts.forEach((row) => {
      const ci = careItemMap.get(row.careItemId);
      if (!ci) return;
      // text 型のみ禁則文字バリデーション。stripForbidden 済みのはずだが念のため
      if (ci.type === 'text' && typeof row.value === 'string') {
        property.forbiddenChars.forEach((c) => {
          if (row.value && (row.value as string).includes(c)) {
            errs.push(`${ci.name}: 禁則文字「${c}」は使用できません`);
          }
        });
      }
    });
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);

    drafts.forEach((row) => {
      const ci = careItemMap.get(row.careItemId);
      if (!ci) return;
      const isEmpty = (() => {
        if (typeof row.value === 'boolean') return row.value === false;
        if (Array.isArray(row.value)) return row.value.length === 0;
        if (typeof row.value === 'string') return row.value.trim() === '';
        return false;
      })();

      if (row.existingId) {
        if (isEmpty) {
          deleteCareRecord(row.existingId);
        } else {
          updateCareRecord(row.existingId, {
            value: row.value,
            administeredBy: row.administeredBy,
          });
        }
      } else if (!isEmpty) {
        addCareRecord({
          patientId, date,
          careItemId: row.careItemId,
          value: row.value,
          administeredBy: row.administeredBy,
        });
      }
    });
    onClose();
  };

  const history = useMemo(
    () => changeLogs
      .filter((l) => l.targetType === 'care_record' && l.patientId === patientId && l.date === date)
      .sort((a, b) => (a.at < b.at ? 1 : -1)),
    [changeLogs, patientId, date],
  );

  const staffNameOf = (id: string): string => staffs.find((s) => s.id === id)?.name ?? id;

  const renderInput = (idx: number, row: DraftRow): React.ReactNode => {
    const ci = careItemMap.get(row.careItemId);
    if (!ci) return null;
    switch (ci.type) {
      case 'text':
        return (
          <TextField
            size="small"
            value={(row.value as string) ?? ''}
            onChange={(e) => updateDraft(idx, { value: stripForbidden(e.target.value, property.forbiddenChars) })}
            fullWidth
            placeholder={ci.unit ? `単位: ${ci.unit}` : ''}
          />
        );
      case 'combo':
        return (
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              displayEmpty
              value={(row.value as string) ?? ''}
              onChange={(e) => updateDraft(idx, { value: e.target.value })}
            >
              <MenuItem value=""><em>—</em></MenuItem>
              {(ci.options ?? []).map((o) => (
                <MenuItem key={o} value={o}>{o}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'radio':
        return (
          <RadioGroup
            row
            value={(row.value as string) ?? ''}
            onChange={(e) => updateDraft(idx, { value: e.target.value })}
          >
            {(ci.options ?? []).map((o) => (
              <FormControlLabel key={o} value={o} control={<Radio size="small" />} label={o} />
            ))}
          </RadioGroup>
        );
      case 'check':
        return (
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(row.value)}
                onChange={(e) => updateDraft(idx, { value: e.target.checked })}
              />
            }
            label={ci.unit ?? '済'}
          />
        );
      case 'check-multi': {
        const list = Array.isArray(row.value) ? (row.value as string[]) : [];
        return (
          <Stack direction="row" flexWrap="wrap">
            {(ci.options ?? []).map((o) => {
              const checked = list.includes(o);
              return (
                <FormControlLabel
                  key={o}
                  control={
                    <Checkbox
                      size="small"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...list, o]
                          : list.filter((x) => x !== o);
                        updateDraft(idx, { value: next });
                      }}
                    />
                  }
                  label={o}
                />
              );
            })}
          </Stack>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6">フローシート編集</Typography>
          <Typography variant="body2" color="text.secondary">{date}</Typography>
          <Box sx={{ flex: 1 }} />
          <Chip
            size="small"
            label={activePattern ? `パターン: ${activePattern.name}` : 'パターンなし'}
            color={activePattern ? 'primary' : 'default'}
            variant="outlined"
          />
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 1 }}>
            <Stack>{errors.map((e, i) => <span key={i}>{e}</span>)}</Stack>
          </Alert>
        )}
        {!activePattern && (
          <Alert severity="info" sx={{ mb: 1 }}>
            適用パターンがありません。下にパターンマスタの全項目を表示しています。新規入力は「パターンなし」として履歴に記録されます。
          </Alert>
        )}

        {drafts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            このパターンに登録された項目がありません。
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {drafts.map((row, idx) => {
              const ci = careItemMap.get(row.careItemId);
              if (!ci) return null;
              const isMedication = hasAdministrator(ci);
              return (
                <Box key={row.careItemId} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', pb: 0.5, borderBottom: '1px dashed', borderColor: 'divider' }}>
                  <Box sx={{ width: 140 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{ci.name}</Typography>
                    {ci.unit && <Typography variant="caption" color="text.disabled">{ci.unit}</Typography>}
                  </Box>
                  <Box sx={{ flex: 1 }}>{renderInput(idx, row)}</Box>
                  {isMedication && (
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>投薬者</InputLabel>
                      <Select
                        label="投薬者"
                        value={row.administeredBy ?? ''}
                        onChange={(e) => updateDraft(idx, { administeredBy: e.target.value || undefined })}
                      >
                        <MenuItem value=""><em>—</em></MenuItem>
                        {staffs.map((s) => (
                          <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Box>
              );
            })}
          </Stack>
        )}

        <Box sx={{ mt: 2 }}>
          <FormLabel sx={{ fontSize: 13, fontWeight: 600 }}>体重（W）</FormLabel>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            体重はバイタル編集ダイアログで入力します（このダイアログでは入力できません）。
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>更新履歴</Typography>
          {history.length === 0 ? (
            <Typography variant="caption" color="text.disabled">履歴はありません。</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 180 }}>更新日時</TableCell>
                  <TableCell sx={{ width: 140 }}>パターン</TableCell>
                  <TableCell sx={{ width: 140 }}>登録職員</TableCell>
                  <TableCell sx={{ width: 70 }}>区分</TableCell>
                  <TableCell>内容</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((h) => {
                  const pname = h.patternId === undefined
                    ? activePattern?.name ?? 'パターンなし'
                    : (h.patternId ? patternMaster.find((p) => p.id === h.patternId)?.name ?? 'パターンなし' : 'パターンなし');
                  return (
                    <TableRow key={h.id}>
                      <TableCell>{h.at.replace('T', ' ')}</TableCell>
                      <TableCell>{pname}</TableCell>
                      <TableCell>{staffNameOf(h.actorId)}</TableCell>
                      <TableCell>{h.op === 'register' ? '登録' : '更新'}</TableCell>
                      <TableCell>{h.summary}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Tooltip title="このダイアログ内の値を全クリアして登録すると、当日のケア記録が削除されます">
          <span>
            <Button
              size="small"
              startIcon={<DeleteIcon />}
              color="error"
              onClick={() => {
                // 全クリア（既存があれば削除扱い）
                setDrafts((d) => d.map((row) => {
                  const ci = careItemMap.get(row.careItemId);
                  return { ...row, value: ci ? initialValueFor(ci) : '' };
                }));
              }}
            >
              当日全クリア
            </Button>
          </span>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={handleRegister}>登録</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FlowsheetEditDialog;
