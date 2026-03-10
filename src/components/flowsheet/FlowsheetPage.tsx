import { Box, Typography, Button, Select, MenuItem, Chip } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PatientHeader from '../karte/PatientHeader';
import VitalChart from './VitalChart';
import FlowsheetGrid from './FlowsheetGrid';
import ActionBar from '../karte/ActionBar';
import { flowsheetDays, flowsheetSubTabs } from '../../data/flowsheetMockData';

export default function FlowsheetPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: '#f0f2f5',
        overflow: 'hidden',
      }}
    >
      {/* Shared patient header */}
      <PatientHeader />

      {/* Date navigation bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1,
          py: 0.5,
          bgcolor: '#fff',
          borderBottom: '1px solid #ddd',
        }}
      >
        <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>日付:</Typography>
        <Button size="small" sx={{ fontSize: '10px', minHeight: 22, minWidth: 0 }}>
          <NavigateBeforeIcon sx={{ fontSize: 14 }} />
        </Button>
        <Typography sx={{ fontSize: '11px' }}>2016/12/16</Typography>
        <Button size="small" sx={{ fontSize: '10px', minHeight: 22, minWidth: 0 }}>
          表示
        </Button>
        <Button size="small" sx={{ fontSize: '10px', minHeight: 22, minWidth: 0 }}>
          <NavigateNextIcon sx={{ fontSize: 14 }} />
        </Button>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Select
            size="small"
            defaultValue="全パターン"
            sx={{ fontSize: '10px', height: 24, minWidth: 100, bgcolor: '#fff' }}
          >
            <MenuItem value="全パターン" sx={{ fontSize: '11px' }}>
              全パターン
            </MenuItem>
          </Select>
        </Box>
      </Box>

      {/* Sub-tab bar: フローシート / 関連観察 / etc */}
      <Box
        sx={{
          display: 'flex',
          gap: 0,
          px: 0.5,
          py: 0.3,
          bgcolor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
        }}
      >
        {flowsheetSubTabs.map((tab) => (
          <Box
            key={tab.label}
            sx={{
              px: 1.5,
              py: 0.3,
              fontSize: '10px',
              fontWeight: tab.active ? 700 : 400,
              color: tab.active ? '#1565c0' : '#666',
              bgcolor: tab.active ? '#fff' : 'transparent',
              border: tab.active ? '1px solid #ddd' : '1px solid transparent',
              borderBottom: tab.active ? '1px solid #fff' : '1px solid #ddd',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              '&:hover': { bgcolor: '#e3f2fd' },
            }}
          >
            {tab.label}
          </Box>
        ))}
        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <Chip
            label="関連観察"
            size="small"
            sx={{ fontSize: '9px', height: 20 }}
          />
          <Chip
            label="結期動計"
            size="small"
            variant="outlined"
            sx={{ fontSize: '9px', height: 20 }}
          />
        </Box>
      </Box>

      {/* Day headers row */}
      <Box
        sx={{
          display: 'flex',
          borderBottom: '1px solid #ccc',
          bgcolor: '#fff',
        }}
      >
        <Box
          sx={{
            width: 72,
            flexShrink: 0,
            borderRight: '1px solid #ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#e8eef5',
          }}
        >
          <Typography sx={{ fontSize: '9px', fontWeight: 600 }}>
            在院日数
          </Typography>
        </Box>
        {flowsheetDays.map((day) => (
          <Box
            key={day.date}
            sx={{
              flex: 1,
              textAlign: 'center',
              borderRight: '1px solid #eee',
              py: 0.3,
              bgcolor:
                day.dayOfWeek === '土'
                  ? '#e3f2fd'
                  : day.dayOfWeek === '日'
                    ? '#ffebee'
                    : '#fff',
            }}
          >
            <Typography
              sx={{
                fontSize: '9px',
                color:
                  day.dayOfWeek === '日'
                    ? '#d32f2f'
                    : day.dayOfWeek === '土'
                      ? '#1565c0'
                      : '#333',
                fontWeight: 600,
              }}
            >
              {day.date.slice(5)}({day.dayOfWeek})
            </Typography>
            <Typography sx={{ fontSize: '8px', color: '#999' }}>
              {day.hospitalDay}日目
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Room row */}
      <Box
        sx={{
          display: 'flex',
          borderBottom: '1px solid #ccc',
          bgcolor: '#fff',
        }}
      >
        <Box
          sx={{
            width: 72,
            flexShrink: 0,
            borderRight: '1px solid #ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#e8eef5',
          }}
        >
          <Typography sx={{ fontSize: '9px', fontWeight: 600 }}>病室</Typography>
        </Box>
        {flowsheetDays.map((day) => (
          <Box
            key={day.date}
            sx={{
              flex: 1,
              textAlign: 'center',
              borderRight: '1px solid #eee',
              py: 0.2,
            }}
          >
            <Typography sx={{ fontSize: '9px' }}>{day.room}</Typography>
          </Box>
        ))}
      </Box>

      {/* Schedule row */}
      <Box
        sx={{
          display: 'flex',
          borderBottom: '1px solid #ccc',
          bgcolor: '#fff',
        }}
      >
        <Box
          sx={{
            width: 72,
            flexShrink: 0,
            borderRight: '1px solid #ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#e8eef5',
          }}
        >
          <Typography sx={{ fontSize: '9px', fontWeight: 600 }}>場</Typography>
        </Box>
        {flowsheetDays.map((day, i) => (
          <Box
            key={day.date}
            sx={{
              flex: 1,
              textAlign: 'center',
              borderRight: '1px solid #eee',
              py: 0.2,
            }}
          >
            <Typography sx={{ fontSize: '9px', color: '#666' }}>
              {i === 0 ? '10:00~18:00' : ''}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Main scrollable content */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 0.5,
          py: 0.5,
          minHeight: 0,
        }}
      >
        {/* Vital chart */}
        <VitalChart />

        {/* Data grid */}
        <FlowsheetGrid />
      </Box>

      {/* Bottom row: pattern management */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.3,
          bgcolor: '#f5f5f5',
          borderTop: '1px solid #ddd',
        }}
      >
        <Typography sx={{ fontSize: '10px', color: '#666' }}>
          パターン変更:
        </Typography>
        <Button
          size="small"
          variant="outlined"
          sx={{ fontSize: '9px', minHeight: 20, px: 0.8 }}
        >
          確定
        </Button>
      </Box>

      {/* Shared action bar */}
      <ActionBar />
    </Box>
  );
}
