import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const NursingRecordsPage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6">部門記録簿</Typography>
    </Paper>
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="body2" color="text.secondary">
        部門記録簿（看護記録一覧） — フェーズ 4 で実装。
      </Typography>
      <Typography variant="caption" color="text.disabled">
        us-22 看護記録表示 / us-23 個別看護記録
      </Typography>
    </Paper>
  </Box>
);

export default NursingRecordsPage;
