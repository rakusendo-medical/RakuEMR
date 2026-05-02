import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const BulkNursingRecordsPage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6">一括看護記録</Typography>
    </Paper>
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="body2" color="text.secondary">
        一括看護記録（病棟・病室単位） — フェーズ 5 で実装。
      </Typography>
      <Typography variant="caption" color="text.disabled">us-26 一括看護記録</Typography>
    </Paper>
  </Box>
);

export default BulkNursingRecordsPage;
