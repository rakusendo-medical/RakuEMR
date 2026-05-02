import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const BulkVitalsPage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6">一括バイタル入力</Typography>
    </Paper>
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="body2" color="text.secondary">
        一括バイタル入力（病棟・病室単位） — フェーズ 5 で実装。
      </Typography>
      <Typography variant="caption" color="text.disabled">us-24 一括バイタル入力</Typography>
    </Paper>
  </Box>
);

export default BulkVitalsPage;
