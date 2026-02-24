import React, { useState } from 'react';
import {
  Box, Grid, List, ListItemButton, ListItemText, Typography, Paper,
  Button, Stack, Divider, Card, CardContent,
} from '@mui/material';
import { Edit, History } from '@mui/icons-material';
import { NURSING_RECORDS } from '../../data/mockData';
import type { NursingRecord } from '../../types';

interface Props {
  patientId?: string;
}

const NursingRecordView: React.FC<Props> = ({ patientId }) => {
  const records = patientId
    ? NURSING_RECORDS.filter((r) => r.patientId === patientId)
    : NURSING_RECORDS;
  const [selected, setSelected] = useState<NursingRecord | null>(null);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <Box sx={{ px: 1.5, py: 1, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" color="text.secondary">看護録リスト</Typography>
          </Box>
          <List disablePadding sx={{ maxHeight: 500, overflow: 'auto' }}>
            {records.map((r) => (
              <ListItemButton
                key={r.id}
                selected={selected?.id === r.id}
                onClick={() => setSelected(r)}
                sx={{ borderBottom: '1px solid #f1f5f9' }}
              >
                <ListItemText
                  primary={`${r.date} ${r.time}`}
                  secondary={
                    <>
                      <Typography component="span" variant="caption" color="text.secondary">{r.author}</Typography>
                      <br />
                      <Typography component="span" variant="caption">{r.content.substring(0, 40)}...</Typography>
                    </>
                  }
                  primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 600 }}
                />
              </ListItemButton>
            ))}
            {records.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.disabled">看護録がありません</Typography>
              </Box>
            )}
          </List>
        </Paper>
      </Grid>
      <Grid item xs={12} md={8}>
        <Paper variant="outlined" sx={{ p: 2, minHeight: 300 }}>
          {selected ? (
            <>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1">{selected.date} {selected.time}</Typography>
                  <Typography variant="caption" color="text.secondary">記録者: {selected.author}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="outlined" startIcon={<Edit />}>編集</Button>
                  <Button size="small" variant="outlined" startIcon={<History />}>履歴</Button>
                </Stack>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Card variant="outlined" sx={{ bgcolor: '#fafbfc' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {selected.content}
                  </Typography>
                </CardContent>
              </Card>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
              <Typography color="text.disabled">左のリストから看護録を選択してください</Typography>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default NursingRecordView;
