import React, { useState } from 'react';
import {
  Box, Tabs, Tab, Card, CardContent, Typography, Stack, Button, TextField,
  Grid, Paper, Divider,
} from '@mui/material';
import { Edit, History, Add } from '@mui/icons-material';
import { NURSING_DIARY, WARD_DIARY } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';

const WardManagement: React.FC = () => {
  const [tab, setTab] = useState(0);
  const { showSnackbar } = useAppStore();

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="看護管理日誌" />
        <Tab label="病棟日誌" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button variant="contained" startIcon={<Add />}>新規作成</Button>
          </Stack>
          <Stack spacing={2}>
            {NURSING_DIARY.map((entry) => (
              <Card key={entry.id}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="subtitle2">
                        {entry.date} — {entry.wardId === 'ward1' ? '第１病棟' : '第２病棟'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">記録者: {entry.author}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" startIcon={<Edit />}>編集</Button>
                    </Stack>
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Grid container spacing={2} sx={{ mb: 1 }}>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary">入院患者数</Typography>
                      <Typography variant="body2" fontWeight={600}>{entry.patientCount}名</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary">入院</Typography>
                      <Typography variant="body2" fontWeight={600}>{entry.admissions}名</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="caption" color="text.secondary">退院</Typography>
                      <Typography variant="body2" fontWeight={600}>{entry.discharges}名</Typography>
                    </Grid>
                    {entry.incidents && (
                      <Grid item xs={3}>
                        <Typography variant="caption" color="error">特記事項</Typography>
                        <Typography variant="body2" fontWeight={600} color="error">{entry.incidents}</Typography>
                      </Grid>
                    )}
                  </Grid>
                  <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{entry.content}</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button variant="contained" startIcon={<Add />}>新規作成</Button>
          </Stack>
          <Stack spacing={2}>
            {WARD_DIARY.map((entry) => (
              <Card key={entry.id}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="subtitle2">
                        {entry.date} — {entry.wardId === 'ward1' ? '第１病棟' : '第２病棟'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">記録者: {entry.author}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" startIcon={<Edit />}>編集</Button>
                      <Button size="small" startIcon={<History />}>履歴</Button>
                    </Stack>
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{entry.content}</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default WardManagement;
