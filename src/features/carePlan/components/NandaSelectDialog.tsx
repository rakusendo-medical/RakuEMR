import React, { useMemo, useState } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, InputLabel, List, ListItemButton, MenuItem, Radio,
  Select, Stack, TextField, Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import type { ProblemDomain } from '../types';
import { PROBLEM_DOMAINS } from '../types';
import { useCarePlanStore } from '../store';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  initialCode?: string;
}

const NandaSelectDialog: React.FC<Props> = ({ open, onClose, onSelect, initialCode }) => {
  const nandaMaster = useCarePlanStore((s) => s.nandaMaster);
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<ProblemDomain | 'all'>('all');
  const [selected, setSelected] = useState<string | undefined>(initialCode);

  React.useEffect(() => {
    if (open) setSelected(initialCode);
  }, [open, initialCode]);

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
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          disabled={!selected}
          onClick={() => {
            if (selected) {
              onSelect(selected);
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
