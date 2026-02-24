import React from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Typography, Button, Stack,
} from '@mui/material';
import { Add, Visibility, Print } from '@mui/icons-material';
import { DOCUMENTS } from '../../data/mockData';

const DOC_TYPE_COLORS: Record<string, string> = {
  '入院時': '#1e40af', '退院時': '#059669', '隔離拘束': '#dc2626', '行動制限': '#d97706', 'その他': '#64748b',
};

const DocumentManagement: React.FC = () => (
  <Box>
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Typography variant="body2" color="text.secondary">入院に必要な書類の作成・登録・表示</Typography>
      <Button variant="contained" startIcon={<Add />}>新規作成</Button>
    </Stack>
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>書類ID</TableCell>
            <TableCell>患者氏名</TableCell>
            <TableCell>書類タイトル</TableCell>
            <TableCell>種別</TableCell>
            <TableCell>作成日</TableCell>
            <TableCell>作成者</TableCell>
            <TableCell>状態</TableCell>
            <TableCell align="center">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {DOCUMENTS.map((d) => (
            <TableRow key={d.id} hover>
              <TableCell>{d.id}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{d.patientName}</TableCell>
              <TableCell>{d.title}</TableCell>
              <TableCell>
                <Chip label={d.type} size="small" sx={{ bgcolor: (DOC_TYPE_COLORS[d.type] || '#64748b') + '18', color: DOC_TYPE_COLORS[d.type], fontWeight: 600 }} />
              </TableCell>
              <TableCell>{d.createdAt}</TableCell>
              <TableCell>{d.createdBy}</TableCell>
              <TableCell>
                <Chip label={d.status} size="small" color={d.status === '登録済' ? 'success' : d.status === '完成' ? 'info' : 'warning'} variant="outlined" />
              </TableCell>
              <TableCell align="center">
                <Stack direction="row" spacing={0.5} justifyContent="center">
                  <Button size="small" startIcon={<Visibility />}>表示</Button>
                  <Button size="small" startIcon={<Print />}>印刷</Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

export default DocumentManagement;
