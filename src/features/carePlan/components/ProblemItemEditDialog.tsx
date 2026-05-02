import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, FormHelperText, InputLabel, MenuItem, Radio, RadioGroup,
  Select, Stack, TextField, Tooltip, Typography, FormControlLabel, Menu,
} from '@mui/material';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import type { OteContent, Priority, ProblemDomain, ProblemItem, ProblemItemStatus } from '../types';
import { PROBLEM_DOMAINS } from '../types';
import { useCarePlanStore } from '../store';
import OteInput from './OteInput';
import NandaSelectDialog from './NandaSelectDialog';

type DraftItem = {
  domain: ProblemDomain;
  priority: Priority;
  nandaCode: string;
  /** 問題点（手入力可・必須）。NANDA 診断名をベースに患者個別事情を加味して記述 */
  problemStatement: string;
  shortTermGoal: string;
  ote: OteContent;
};

const EMPTY: DraftItem = {
  domain: '精神',
  priority: 'medium',
  nandaCode: '',
  problemStatement: '',
  shortTermGoal: '',
  ote: { observation: [''], therapy: [''], education: [''] },
};

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: ProblemItem;
  onClose: () => void;
  onSubmit: (draft: DraftItem, saveAs: 'draft' | 'active') => void;
  onClose_?: (status: ProblemItemStatus, reason: string) => void;
}

const ProblemItemEditDialog: React.FC<Props> = ({
  open, mode, initial, onClose, onSubmit, onClose_,
}) => {
  const nandaMaster = useCarePlanStore((s) => s.nandaMaster);
  const [draft, setDraft] = useState<DraftItem>(EMPTY);
  const [nandaDialogOpen, setNandaDialogOpen] = useState(false);
  const [closeMenuAnchor, setCloseMenuAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      if (initial) {
        // 既存データに problemStatement が無い場合は NANDA 名で補完してから編集モードへ
        const fallback = nandaMaster.find((n) => n.code === initial.nandaCode)?.name ?? '';
        setDraft({
          domain: initial.domain,
          priority: initial.priority,
          nandaCode: initial.nandaCode,
          problemStatement: initial.problemStatement ?? fallback,
          shortTermGoal: initial.shortTermGoal,
          ote: initial.ote,
        });
      } else {
        setDraft(EMPTY);
      }
    }
  }, [open, initial, nandaMaster]);

  const selectedNanda = useMemo(
    () => nandaMaster.find((n) => n.code === draft.nandaCode),
    [nandaMaster, draft.nandaCode]
  );

  const handleClose = (status: ProblemItemStatus, reason: string) => {
    setCloseMenuAnchor(null);
    onClose_?.(status, reason);
  };

  const isValid = draft.nandaCode && draft.problemStatement.trim() && draft.shortTermGoal.trim();

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>
          {mode === 'create' ? '看護計画を追加' : '看護計画を編集'}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Stack direction="row" spacing={2}>
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel>領域分類</InputLabel>
                <Select
                  label="領域分類"
                  value={draft.domain}
                  onChange={(e) => setDraft((d) => ({ ...d, domain: e.target.value as ProblemDomain }))}
                >
                  {PROBLEM_DOMAINS.map((d) => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </Select>
                <FormHelperText sx={{ fontSize: '0.7rem' }}>
                  問題点の中心となる領域を選択
                </FormHelperText>
              </FormControl>
              <FormControl component="fieldset">
                <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                  優先度
                </Typography>
                <RadioGroup
                  row
                  value={draft.priority}
                  onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as Priority }))}
                >
                  <FormControlLabel value="high" control={<Radio size="small" />} label="高" />
                  <FormControlLabel value="medium" control={<Radio size="small" />} label="中" />
                  <FormControlLabel value="low" control={<Radio size="small" />} label="低" />
                </RadioGroup>
              </FormControl>
            </Stack>

            <Box>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">看護診断(NANDA)</Typography>
                <Tooltip title="NANDA看護診断リストから患者の問題点に最も近い診断名を選択します。領域でフィルタするとすばやく絞り込めます。" placement="right">
                  <InfoIcon sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
                </Tooltip>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  fullWidth
                  value={selectedNanda ? `${selectedNanda.name} (${selectedNanda.code})` : ''}
                  placeholder="「選択...」ボタンからNANDA診断を選んでください"
                  InputProps={{ readOnly: true }}
                  helperText={draft.nandaCode ? `領域: ${selectedNanda?.domain ?? '—'}` : undefined}
                />
                <Button
                  variant="outlined"
                  onClick={() => setNandaDialogOpen(true)}
                  sx={{ flexShrink: 0, height: 40 }}
                >
                  選択...
                </Button>
              </Stack>
            </Box>

            <Box>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">問題点（手入力可・必須）</Typography>
                <Tooltip title="NANDA 診断名をベースに、患者個別の事情を加味して記述します（例: 「[NANDA] により夜間 2 時間ごとに目覚める」）" placement="right">
                  <InfoIcon sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
                </Tooltip>
              </Stack>
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={5}
                value={draft.problemStatement}
                onChange={(e) => setDraft((d) => ({ ...d, problemStatement: e.target.value }))}
                placeholder="患者個別の問題点を記述（NANDA 選択時は診断名が初期値、編集可）"
                inputProps={{ maxLength: 500 }}
                helperText={`${draft.problemStatement.length} / 500 文字`}
                error={!draft.problemStatement.trim() && !!draft.nandaCode}
              />
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">短期目標</Typography>
              <TextField
                fullWidth
                multiline
                minRows={2}
                value={draft.shortTermGoal}
                onChange={(e) => setDraft((d) => ({ ...d, shortTermGoal: e.target.value }))}
                placeholder="解決後の姿を状態記述で入力（例: 毎食後に服薬を自分で確認できる）"
                helperText="「〜できる」「〜を維持できる」などの達成可能な状態で記入します"
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.75 }}>具体策 (OTE)</Typography>
              <OteInput value={draft.ote} onChange={(ote) => setDraft((d) => ({ ...d, ote }))} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, justifyContent: 'space-between' }}>
          <Box>
            {mode === 'edit' && onClose_ && (
              <>
                <Button
                  color="error"
                  variant="outlined"
                  onClick={(e) => setCloseMenuAnchor(e.currentTarget)}
                >
                  この看護計画をクローズ...
                </Button>
                <Menu
                  anchorEl={closeMenuAnchor}
                  open={Boolean(closeMenuAnchor)}
                  onClose={() => setCloseMenuAnchor(null)}
                >
                  <MenuItem onClick={() => handleClose('closed_resolved', '解決')}>解決でクローズ</MenuItem>
                  <MenuItem onClick={() => handleClose('closed_cancelled', '中止')}>中止でクローズ</MenuItem>
                  <MenuItem onClick={() => handleClose('closed_changed', '変更')}>変更でクローズ</MenuItem>
                </Menu>
              </>
            )}
          </Box>
          <Box>
            <Button onClick={onClose}>キャンセル</Button>
            <Button
              disabled={!isValid}
              onClick={() => isValid && onSubmit(draft, 'draft')}
            >
              保存(下書き)
            </Button>
            <Button
              variant="contained"
              disabled={!isValid}
              onClick={() => isValid && onSubmit(draft, 'active')}
            >
              保存して有効化
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <NandaSelectDialog
        open={nandaDialogOpen}
        initialCode={draft.nandaCode}
        initialProblemStatement={draft.problemStatement}
        onClose={() => setNandaDialogOpen(false)}
        onSelect={(code, problemStatement) => {
          const item = nandaMaster.find((n) => n.code === code);
          setDraft((d) => ({
            ...d,
            nandaCode: code,
            problemStatement,
            domain: item?.domain ?? d.domain,
          }));
        }}
      />
    </>
  );
};

export default ProblemItemEditDialog;
