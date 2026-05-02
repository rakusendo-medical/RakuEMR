import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, Box, Typography, InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import type { MedicalInstitution } from '../../data/mockData';
import { MEDICAL_INSTITUTIONS } from '../../data/mockData';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (inst: MedicalInstitution) => void;
}

const MedicalInstitutionSearchDialog: React.FC<Props> = ({ open, onClose, onSelect }) => {
  const [q, setQ] = React.useState('');

  React.useEffect(() => {
    if (open) setQ('');
  }, [open]);

  const results = React.useMemo(() => {
    if (!q) return MEDICAL_INSTITUTIONS;
    const lc = q.toLowerCase();
    return MEDICAL_INSTITUTIONS.filter((m) =>
      m.name.toLowerCase().includes(lc) || m.address.toLowerCase().includes(lc) || m.type.includes(q),
    );
  }, [q]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>医療機関検索</DialogTitle>
      <DialogContent dividers>
        <TextField
          size="small"
          fullWidth
          placeholder="名称・所在地・種別で検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ mb: 1.5 }}
        />
        <Stack spacing={0.75}>
          {results.length === 0 && (
            <Typography variant="caption" color="text.secondary">該当なし</Typography>
          )}
          {results.map((m) => (
            <Box
              key={m.id}
              onClick={() => onSelect(m)}
              sx={{
                p: 1.25,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#f0f7ff' },
              }}
            >
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography variant="body2" fontWeight={700}>{m.name}</Typography>
                <Typography variant="caption" color="text.secondary">{m.type}</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">{m.address}</Typography>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MedicalInstitutionSearchDialog;
