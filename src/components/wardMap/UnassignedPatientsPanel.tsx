import React from 'react';
import {
  Drawer, Box, Typography, IconButton, Stack, Button, Chip, Divider,
} from '@mui/material';
import { Close as CloseIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { UNASSIGNED_PATIENTS } from '../../data/mockData';
import { WARD_LABELS } from '../../types';
import type { UnassignedPatient } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onAssign: (patient: UnassignedPatient) => void;
}

const formatLocation = (p: UnassignedPatient) => {
  const ward = p.designatedWardId === 'tentative'
    ? '病棟（仮）'
    : WARD_LABELS[p.designatedWardId];
  const room = p.designatedRoomNumber === 'tentative' ? '病室（仮）' : `${p.designatedRoomNumber}号室`;
  const bed = p.designatedBedLabel === 'tentative' ? 'ベッド（仮）' : `${p.designatedBedLabel}ベッド`;
  return `${ward} / ${room} / ${bed}`;
};

const UnassignedPatientsPanel: React.FC<Props> = ({ open, onClose, onAssign }) => (
  <Drawer
    anchor="right"
    open={open}
    onClose={onClose}
    PaperProps={{ sx: { width: 380, p: 0 } }}
  >
    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" fontWeight={700}>未割当者一覧</Typography>
        <Typography variant="caption" color="text.secondary">
          {UNASSIGNED_PATIENTS.length}名 ／ 病棟・病室・ベッドのいずれかが「仮」の患者
        </Typography>
      </Box>
      <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
    </Box>
    <Box sx={{ p: 1.5, overflow: 'auto', flex: 1 }}>
      {UNASSIGNED_PATIENTS.length === 0 && (
        <Typography variant="caption" color="text.secondary">未割当患者はいません。</Typography>
      )}
      {UNASSIGNED_PATIENTS.map((p) => (
        <Box
          key={p.id}
          onDoubleClick={() => onAssign(p)}
          sx={{
            p: 1.25,
            mb: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            cursor: 'pointer',
            '&:hover': { bgcolor: '#f0f7ff' },
          }}
        >
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={700}>
                {p.name}
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  ({p.age}歳{p.gender === 'M' ? '男性' : '女性'})
                </Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                {formatLocation(p)}
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                入院予定 {p.scheduledAdmitAt} ／ {p.doctorName}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                {p.designatedWardId === 'tentative' && <Chip label="病棟仮" size="small" sx={{ bgcolor: '#fef3c7', color: '#a16207' }} />}
                {p.designatedRoomNumber === 'tentative' && <Chip label="病室仮" size="small" sx={{ bgcolor: '#fef3c7', color: '#a16207' }} />}
                {p.designatedBedLabel === 'tentative' && <Chip label="ベッド仮" size="small" sx={{ bgcolor: '#fef3c7', color: '#a16207' }} />}
              </Stack>
            </Box>
            <Button
              size="small"
              variant="contained"
              endIcon={<OpenInNewIcon />}
              onClick={(e) => { e.stopPropagation(); onAssign(p); }}
            >
              移動
            </Button>
          </Stack>
          {p.notes && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary">{p.notes}</Typography>
            </>
          )}
        </Box>
      ))}
    </Box>
  </Drawer>
);

export default UnassignedPatientsPanel;
