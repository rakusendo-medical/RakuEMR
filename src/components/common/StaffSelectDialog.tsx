import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  FormControlLabel, Radio, RadioGroup, FormLabel, Checkbox, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, TextField, Box, Typography,
} from '@mui/material';

export type StaffMatchMode = 'all' | 'any';

export interface StaffSelectValue {
  staffIds: string[];
  matchMode: StaffMatchMode;
}

interface Props {
  open: boolean;
  /** 選択候補となる職員一覧 */
  staffOptions: { id: string; name: string; role?: string }[];
  /** 現在の選択値（ダイアログを開いたときの初期表示） */
  initial: StaffSelectValue;
  onClose: () => void;
  onConfirm: (value: StaffSelectValue) => void;
  /** 表示タイトル（デフォルト: 担当職員選択） */
  title?: string;
}

/**
 * 担当職員選択ダイアログ（ep-09 us-16 Phase 2）。
 * - 複数職員のチェック選択
 * - 「全てに一致／いずれかに一致」のラジオで照合方式を切替
 * - 検索ボックスで職員名／ロールに含まれる文字列で絞込み
 */
const StaffSelectDialog: React.FC<Props> = ({
  open, staffOptions, initial, onClose, onConfirm, title = '担当職員選択',
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(initial.staffIds);
  const [matchMode, setMatchMode] = useState<StaffMatchMode>(initial.matchMode);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedIds(initial.staffIds);
      setMatchMode(initial.matchMode);
      setQuery('');
    }
  }, [open, initial.staffIds, initial.matchMode]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staffOptions;
    return staffOptions.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.role ?? '').toLowerCase().includes(q),
    );
  }, [staffOptions, query]);

  const toggle = (id: string) => {
    setSelectedIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  };

  const handleConfirm = () => {
    onConfirm({ staffIds: selectedIds, matchMode });
    onClose();
  };

  const handleClear = () => {
    setSelectedIds([]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 1.5 }}>
          <TextField
            placeholder="職員名・ロールで絞込み"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            size="small"
            fullWidth
          />
        </Box>
        <FormLabel sx={{ fontSize: '0.75rem' }}>照合方式</FormLabel>
        <RadioGroup
          row
          value={matchMode}
          onChange={(e) => setMatchMode(e.target.value as StaffMatchMode)}
        >
          <FormControlLabel value="all" control={<Radio size="small" />} label="全てに一致" />
          <FormControlLabel value="any" control={<Radio size="small" />} label="いずれかに一致" />
        </RadioGroup>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          選択中: {selectedIds.length}名
        </Typography>
        <List dense sx={{ maxHeight: 360, overflowY: 'auto', border: '1px solid', borderColor: 'divider' }}>
          {filtered.map((s) => {
            const checked = selectedIds.includes(s.id);
            return (
              <ListItem key={s.id} disablePadding>
                <ListItemButton onClick={() => toggle(s.id)} dense>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple size="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={s.name}
                    secondary={s.role}
                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
          {filtered.length === 0 && (
            <ListItem>
              <ListItemText
                primary="該当する職員がありません"
                primaryTypographyProps={{ fontSize: '0.8125rem', color: 'text.secondary' }}
              />
            </ListItem>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClear} disabled={selectedIds.length === 0}>
          クリア
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" onClick={handleConfirm}>確定</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StaffSelectDialog;
