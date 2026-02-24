import { Box, Typography, Button, Chip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { currentPatient, karteTabs } from '../../data/mockData';

const tabRoutes: Record<string, string> = {
  karte: '/',
  flowsheet: '/flowsheet',
};

const tabColors: Record<string, string> = {
  karte: '#4CAF50',
  'medical-record': '#2196F3',
  'nursing-record': '#FF9800',
  flowsheet: '#9C27B0',
  'nursing-info': '#E91E63',
  'patient-schedule': '#00BCD4',
};

export default function PatientHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTabId =
    Object.entries(tabRoutes).find(([, path]) => path === location.pathname)?.[0] || 'karte';

  return (
    <Box>
      {/* ⑫ Top Navigation Tabs */}
      <Box
        sx={{
          display: 'flex',
          gap: 0,
          bgcolor: '#5B8C5A',
          px: 1,
          pt: 0.5,
        }}
      >
        {karteTabs.map((tab) => {
          const isActive = tab.id === currentTabId;
          return (
            <Box
              key={tab.id}
              onClick={() => {
                const route = tabRoutes[tab.id];
                if (route) navigate(route);
              }}
              sx={{
                px: 2,
                py: 0.5,
                bgcolor: isActive ? '#fff' : tabColors[tab.id] || '#6a6',
                color: isActive ? '#333' : '#fff',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: isActive ? 700 : 400,
                mr: 0.5,
                '&:hover': {
                  opacity: 0.85,
                },
              }}
            >
              {tab.label}
            </Box>
          );
        })}
      </Box>

      {/* ② Patient Tag + ③ Patient Info Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: '#e8f0fe',
          borderBottom: '1px solid #ccc',
          px: 1,
          py: 0.5,
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        {/* ① Patient tag (入院) */}
        <Chip
          label="入院"
          size="small"
          sx={{
            bgcolor: '#d32f2f',
            color: '#fff',
            fontWeight: 700,
            fontSize: '11px',
            height: 22,
          }}
        />
        <Chip
          label="外入"
          size="small"
          variant="outlined"
          sx={{ fontSize: '10px', height: 20 }}
        />

        <Typography
          sx={{ fontSize: '13px', fontWeight: 700, color: '#1565c0' }}
        >
          {currentPatient.id}
        </Typography>
        <Typography sx={{ fontSize: '13px', fontWeight: 700 }}>
          {currentPatient.name}
        </Typography>
        <Typography sx={{ fontSize: '11px', color: '#666' }}>
          {currentPatient.gender}
        </Typography>
        <Typography sx={{ fontSize: '11px', color: '#666' }}>
          {currentPatient.bloodType}
        </Typography>
        <Typography sx={{ fontSize: '11px', color: '#666' }}>
          L/{currentPatient.wardName}
        </Typography>
        <Typography sx={{ fontSize: '11px', color: '#1565c0' }}>
          Dr 医師 太郎
        </Typography>
        <Typography sx={{ fontSize: '11px', color: '#e65100' }}>
          Ns {currentPatient.nurse}
        </Typography>
        <Typography sx={{ fontSize: '11px', color: '#2e7d32' }}>
          ♦ デイケア 大地
        </Typography>

        {/* Right side: kana + age */}
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '11px', color: '#666' }}>
            {currentPatient.nameKana}
          </Typography>
          <Typography sx={{ fontSize: '11px' }}>
            {currentPatient.birthDate}({currentPatient.age})
          </Typography>
          <Typography sx={{ fontSize: '11px', fontWeight: 600 }}>
            {currentPatient.roomNumber}
          </Typography>
        </Box>
      </Box>

      {/* ④ Quick Action Buttons + Sub navigation */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: '#f0f4f8',
          borderBottom: '1px solid #ddd',
          px: 1,
          py: 0.3,
          gap: 0.5,
          flexWrap: 'wrap',
        }}
      >
        <QuickBtn label="看取記" color="#4caf50" />
        <QuickBtn label="既往歴" />
        <QuickBtn label="病歴管理" />
        <QuickBtn label="体重/食事" />
        <QuickBtn label="身体追理" />
        <QuickBtn label="心理記事" />

        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
          <QuickBtn label="添付ファイル" color="#1976d2" variant />
          <QuickBtn label="旧PACS" color="#1976d2" variant />
          <QuickBtn label="新PACS" color="#1976d2" variant />
          <QuickBtn label="処方" color="#d32f2f" variant />
          <QuickBtn label="紹介" color="#ff9800" variant />
        </Box>
      </Box>
    </Box>
  );
}

function QuickBtn({
  label,
  color,
  variant,
}: {
  label: string;
  color?: string;
  variant?: boolean;
}) {
  return (
    <Button
      size="small"
      variant={variant ? 'contained' : 'text'}
      sx={{
        fontSize: '10px',
        px: 1,
        py: 0.2,
        minHeight: 22,
        bgcolor: variant ? color || '#1976d2' : 'transparent',
        color: variant ? '#fff' : color || '#333',
        '&:hover': {
          bgcolor: variant ? color || '#1976d2' : '#e0e0e0',
          opacity: 0.9,
        },
      }}
    >
      {label}
    </Button>
  );
}
