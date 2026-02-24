import React from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Typography,
} from '@mui/material';
import { ORDERS } from '../../data/mockData';

const ORDER_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  '処方':     { bg: '#dbeafe', color: '#1e40af' },
  '注射':     { bg: '#fce7f3', color: '#be185d' },
  '心理検査': { bg: '#fef3c7', color: '#d97706' },
  'ECT':      { bg: '#fef3c7', color: '#d97706' },
  '入院定時': { bg: '#dcfce7', color: '#16a34a' },
  'IF':       { bg: '#e0e7ff', color: '#4338ca' },
  '文字':     { bg: '#f1f5f9', color: '#475569' },
};

interface Props {
  patientId?: string;
}

const OrderManagement: React.FC<Props> = ({ patientId }) => {
  const data = patientId ? ORDERS.filter((o) => o.patientId === patientId) : ORDERS;

  return (
    <Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>オーダID</TableCell>
              {!patientId && <TableCell>患者氏名</TableCell>}
              <TableCell>種類</TableCell>
              <TableCell>内容</TableCell>
              <TableCell>スケジュール</TableCell>
              <TableCell>開始日</TableCell>
              <TableCell>日数</TableCell>
              <TableCell>状態</TableCell>
              <TableCell>指示医</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((o) => {
              const typeStyle = ORDER_TYPE_COLORS[o.type] || ORDER_TYPE_COLORS['文字'];
              return (
                <TableRow key={o.id} hover>
                  <TableCell>{o.id}</TableCell>
                  {!patientId && <TableCell sx={{ fontWeight: 600 }}>{o.patientName}</TableCell>}
                  <TableCell>
                    <Chip label={o.type} size="small" sx={{ bgcolor: typeStyle.bg, color: typeStyle.color, fontWeight: 600 }} />
                  </TableCell>
                  <TableCell>{o.content}</TableCell>
                  <TableCell>{o.schedule}</TableCell>
                  <TableCell>{o.startDate}</TableCell>
                  <TableCell>{o.days > 0 ? `${o.days}日` : '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={o.status}
                      size="small"
                      color={o.status === '実施中' ? 'success' : o.status === '予定' ? 'warning' : o.status === '中止' ? 'error' : 'info'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{o.doctorName}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {data.length}件
      </Typography>
    </Box>
  );
};

export default OrderManagement;
