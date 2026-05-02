import React, { useMemo, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, FormHelperText, InputLabel, List, ListItemButton, MenuItem, Radio,
  Select, Stack, TextField, Typography,
} from '@mui/material';
import { Search as SearchIcon, EditOutlined as EditOutlinedIcon } from '@mui/icons-material';
import type { ProblemDomain } from '../types';
import { PROBLEM_DOMAINS } from '../types';
import { useCarePlanStore } from '../store';

interface Props {
  open: boolean;
  onClose: () => void;
  /** NANDA コード + 問題点テキスト（手入力可）の両方を返却 */
  onSelect: (code: string, problemStatement: string) => void;
  initialCode?: string;
  /** 初期表示の問題点テキスト（編集モード時に既存値を渡す） */
  initialProblemStatement?: string;
}

const NandaSelectDialog: React.FC<Props> = ({ open, onClose, onSelect, initialCode, initialProblemStatement }) => {
  const nandaMaster = useCarePlanStore((s) => s.nandaMaster);
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<ProblemDomain | 'all'>('all');
  const [selected, setSelected] = useState<string | undefined>(initialCode);
  // 問題点テキスト。NANDA 選択時に診断名で自動補完するが、ユーザーは自由編集可
  const [problemStatement, setProblemStatement] = useState<string>(initialProblemStatement ?? '');
  // ユーザーが手で編集したかどうかを追跡（自動補完と上書きしないため）
  const [problemStatementTouched, setProblemStatementTouched] = useState(false);

  React.useEffect(() => {
    if (open) {
      setSelected(initialCode);
      setProblemStatement(initialProblemStatement ?? '');
      setProblemStatementTouched(!!initialProblemStatement);
    }
  }, [open, initialCode, initialProblemStatement]);

  // NANDA 選択 → 問題点テキストが空 or 未編集なら診断名で自動補完
  React.useEffect(() => {
    if (!selected) return;
    if (problemStatementTouched && problemStatement.trim().length > 0) return;
    const n = nandaMaster.find((x) => x.code === selected);
    if (n) {
      setProblemStatement(n.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const filtered = useMemo(() => {
    return nandaMaster.filter((n) => {
      if (domain !== 'all' && n.domain !== domain) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!n.name.toLowerCase().includes(q) && !n.code.includes(q)) return false;
      }
      return true;
    });
  }, [nandaMaster, query, domain]);

  const frequentlyUsed = filtered.filter((n) => n.frequentlyUsed);
  const others = filtered.filter((n) => !n.frequentlyUsed);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { height: 640 } }}>
      <DialogTitle>NANDA 看護診断を選択</DialogTitle>
      <Divider />
      <Box sx={{ p: 2, pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            fullWidth
            placeholder="キーワード / コード検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel>領域</InputLabel>
            <Select
              label="領域"
              value={domain}
              onChange={(e) => setDomain(e.target.value as ProblemDomain | 'all')}
            >
              <MenuItem value="all">すべて</MenuItem>
              {PROBLEM_DOMAINS.map((d) => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Box>
      <DialogContent dividers sx={{ pt: 1 }}>
        {frequentlyUsed.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary">よく使う診断</Typography>
            <List dense disablePadding>
              {frequentlyUsed.map((n) => (
                <ListItemButton
                  key={n.code}
                  selected={selected === n.code}
                  onClick={() => setSelected(n.code)}
                >
                  <Radio checked={selected === n.code} size="small" />
                  <Stack>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {n.code} {n.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">領域: {n.domain}</Typography>
                  </Stack>
                </ListItemButton>
              ))}
            </List>
          </>
        )}
        {others.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              すべての診断
            </Typography>
            <List dense disablePadding>
              {others.map((n) => (
                <ListItemButton
                  key={n.code}
                  selected={selected === n.code}
                  onClick={() => setSelected(n.code)}
                >
                  <Radio checked={selected === n.code} size="small" />
                  <Stack>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {n.code} {n.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">領域: {n.domain}</Typography>
                  </Stack>
                </ListItemButton>
              ))}
            </List>
          </>
        )}
        {filtered.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            該当する診断がありません
          </Typography>
        )}
      </DialogContent>
      {/* 問題点 手入力欄: NANDA 選択後に編集可能。NANDA 選択 + 問題点テキスト両方が必須 */}
      <Box sx={{ p: 2, pt: 1.5, borderTop: '1px solid #e2e8f0', bgcolor: '#fafbfc' }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
          <EditOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            問題点（必須・手入力可）
          </Typography>
        </Stack>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          placeholder={selected ? 'NANDA 診断名が入っています。患者個別の事情を加味して編集できます' : 'NANDA を選択するか、問題点を直接入力してください'}
          value={problemStatement}
          onChange={(e) => {
            setProblemStatement(e.target.value);
            setProblemStatementTouched(true);
          }}
          inputProps={{ maxLength: 500 }}
          error={problemStatement.trim().length === 0 && !!selected}
        />
        <FormHelperText sx={{ ml: 0 }}>
          {problemStatement.length} / 500 文字。空欄では確定できません。
        </FormHelperText>
      </Box>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          disabled={!selected || problemStatement.trim().length === 0}
          onClick={() => {
            if (selected && problemStatement.trim().length > 0) {
              onSelect(selected, problemStatement.trim());
              onClose();
            }
          }}
        >
          選択
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NandaSelectDialog;
