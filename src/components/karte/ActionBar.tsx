import { Box, Button, Select, MenuItem } from '@mui/material';
import { actionButtons } from '../../data/mockData';

export default function ActionBar() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        bgcolor: '#e8eef5',
        borderTop: '2px solid #90a4ae',
        flexWrap: 'wrap',
      }}
    >
      {actionButtons.map((label) => (
        <Button
          key={label}
          size="small"
          variant="outlined"
          sx={{
            fontSize: '10px',
            px: 1,
            py: 0.2,
            minHeight: 24,
            bgcolor: '#fff',
            borderColor: '#90a4ae',
            color: '#333',
            '&:hover': { bgcolor: '#e3f2fd' },
          }}
        >
          {label}
        </Button>
      ))}

      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Select
          size="small"
          defaultValue="次回予定のメモ"
          sx={{
            fontSize: '10px',
            height: 24,
            minWidth: 120,
            bgcolor: '#fff',
          }}
        >
          <MenuItem value="次回予定のメモ" sx={{ fontSize: '11px' }}>
            次回予定のメモ
          </MenuItem>
        </Select>

        <Button
          size="small"
          variant="outlined"
          sx={{
            fontSize: '10px',
            px: 1.5,
            minHeight: 24,
            bgcolor: '#fff',
            borderColor: '#90a4ae',
          }}
        >
          印刷
        </Button>
        <Button
          size="small"
          variant="contained"
          color="error"
          sx={{
            fontSize: '10px',
            px: 1.5,
            minHeight: 24,
          }}
        >
          終了
        </Button>
      </Box>
    </Box>
  );
}
