import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Checkbox, Button, Chip,
  Grid, Stack, Tabs, Tab,
} from '@mui/material';
import { ArrowForward, Clear } from '@mui/icons-material';
import type { WardId } from '../../types';
import { ROOMS, STATUS_CONFIG, PATIENTS } from '../../data/mockData';
import StatusBadge from '../common/StatusBadge';
import { useAppStore } from '../../stores/useAppStore';

const WardMap: React.FC = () => {
  const navigate = useNavigate();
  const { selectedRooms, toggleRoom, clearSelectedRooms, setSelectedPatient } = useAppStore();
  const [ward, setWard] = React.useState<WardId>('ward1');

  const rooms = ROOMS.filter((r) => r.wardId === ward);

  const handlePatientClick = (patientId: string) => {
    const patient = PATIENTS.find((p) => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient);
      navigate(`/patients/${patientId}`);
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Tabs value={ward} onChange={(_, v) => setWard(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="第１病棟マップ" value="ward1" />
          <Tab label="第２病棟マップ" value="ward2" />
        </Tabs>
        {selectedRooms.size > 0 && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              選択中: {selectedRooms.size}室
            </Typography>
            <Button variant="contained" size="small" endIcon={<ArrowForward />} onClick={() => navigate('/batch-input')}>
              一括入力へ
            </Button>
            <Button size="small" startIcon={<Clear />} onClick={clearSelectedRooms}>
              解除
            </Button>
          </Stack>
        )}
      </Stack>

      <Grid container spacing={1.5}>
        {rooms.map((room) => {
          const isSelected = selectedRooms.has(room.roomNumber);
          return (
            <Grid item xs={12} sm={6} md={3} key={room.roomNumber}>
              <Card
                sx={{
                  border: isSelected ? '2px solid' : '1px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'primary.main' + '08' : 'background.paper',
                  boxShadow: isSelected ? '0 0 0 3px rgba(30,64,175,0.12)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <Box sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  px: 1.5, py: 1, bgcolor: isSelected ? 'primary.main' + '12' : '#f8fafc',
                  borderBottom: '1px solid', borderColor: 'divider',
                }}>
                  <Typography variant="subtitle2" fontWeight={700}>{room.roomNumber}号室</Typography>
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleRoom(room.roomNumber)}
                    size="small"
                    sx={{ p: 0 }}
                  />
                </Box>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                  {room.beds.map((bed) => (
                    <Box
                      key={bed.bed}
                      onClick={() => bed.patientId && handlePatientClick(bed.patientId)}
                      sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        px: 1.5, py: 1, borderBottom: '1px solid #f1f5f9',
                        cursor: bed.patientId ? 'pointer' : 'default',
                        '&:hover': bed.patientId ? { bgcolor: '#f0f7ff' } : {},
                      }}
                    >
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Box sx={{
                          width: 28, height: 28, borderRadius: 1,
                          bgcolor: bed.patientId ? (bed.gender === 'M' ? '#dbeafe' : '#fce7f3') : '#f1f5f9',
                          color: bed.patientId ? (bed.gender === 'M' ? 'primary.main' : '#be185d') : 'text.disabled',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 700,
                        }}>
                          {bed.bed}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={bed.patientId ? 600 : 400} color={bed.patientId ? 'text.primary' : 'text.disabled'}>
                            {bed.patientName || '空床'}
                          </Typography>
                          {bed.patientId && (
                            <Typography variant="caption" color="text.secondary">{bed.patientId}</Typography>
                          )}
                        </Box>
                      </Stack>
                      <StatusBadge status={bed.status} />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Legend */}
      <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <Stack key={key} direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cfg.color }} />
            <Typography variant="caption" color="text.secondary">{cfg.label}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default WardMap;
