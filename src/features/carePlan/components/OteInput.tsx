import React from 'react';
import { Box, IconButton, Paper, Stack, TextField, Typography, Button } from '@mui/material';
import {
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import type { OteContent } from '../types';

interface Props {
  value: OteContent;
  onChange: (value: OteContent) => void;
}

const SECTIONS: { key: keyof OteContent; label: string; hint: string }[] = [
  { key: 'observation', label: 'O: 観察', hint: '症状、状態、行動などの観察項目' },
  { key: 'therapy', label: 'T: 援助', hint: '看護師による直接援助・支援内容' },
  { key: 'education', label: 'E: 指導', hint: '患者・家族への指導内容' },
];

const OteInput: React.FC<Props> = ({ value, onChange }) => {
  const updateSection = (key: keyof OteContent, newList: string[]) => {
    onChange({ ...value, [key]: newList });
  };

  const update = (key: keyof OteContent, idx: number, text: string) => {
    const list = [...value[key]];
    list[idx] = text;
    updateSection(key, list);
  };

  const remove = (key: keyof OteContent, idx: number) => {
    const list = value[key].filter((_, i) => i !== idx);
    updateSection(key, list);
  };

  const move = (key: keyof OteContent, idx: number, dir: -1 | 1) => {
    const list = [...value[key]];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= list.length) return;
    [list[idx], list[newIdx]] = [list[newIdx], list[idx]];
    updateSection(key, list);
  };

  const add = (key: keyof OteContent) => {
    updateSection(key, [...value[key], '']);
  };

  return (
    <Stack spacing={1.5}>
      {SECTIONS.map(({ key, label, hint }) => (
        <Paper key={key} variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle2">{label}</Typography>
            <Typography variant="caption" color="text.secondary">
              {hint}
            </Typography>
          </Stack>
          <Stack spacing={0.75}>
            {value[key].length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                (未入力)
              </Typography>
            )}
            {value[key].map((line, idx) => (
              <Stack key={idx} direction="row" spacing={0.5} alignItems="center">
                <TextField
                  value={line}
                  onChange={(e) => update(key, idx, e.target.value)}
                  placeholder={`${label} の項目を入力`}
                  fullWidth
                />
                <IconButton size="small" disabled={idx === 0} onClick={() => move(key, idx, -1)}>
                  <ArrowUpIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" disabled={idx === value[key].length - 1} onClick={() => move(key, idx, 1)}>
                  <ArrowDownIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => remove(key, idx)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            <Box>
              <Button size="small" startIcon={<AddIcon />} onClick={() => add(key)}>
                行を追加
              </Button>
            </Box>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
};

export default OteInput;
