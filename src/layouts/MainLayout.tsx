import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Avatar, Snackbar, Alert,
  Divider, Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  LocalHospital, People, MeetingRoom, Search, Groups,
  Description, Assessment, Lock, Home, Receipt,
  FitnessCenter, Favorite, FolderOpen, Business, PersonAdd,
} from '@mui/icons-material';
import { useAppStore } from '../stores/useAppStore';

const DRAWER_WIDTH = 220;
const DRAWER_COLLAPSED = 60;

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactElement;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'ward-map',       label: '病棟マップ',       icon: <LocalHospital />,  path: '/' },
  { key: 'patient-list',   label: '入院患者一覧',     icon: <People />,         path: '/patients' },
  { key: 'outpatient',     label: '外来一覧',         icon: <Groups />,         path: '/outpatient' },
  { key: 'patient-search', label: '患者検索',         icon: <Search />,         path: '/patient-search' },
  { key: 'admission',      label: '入退院管理',       icon: <MeetingRoom />,    path: '/admission' },
  { key: 'nursing',        label: '看護記録',         icon: <Description />,    path: '/nursing' },
  { key: 'flowsheet',      label: 'フローシート',     icon: <Assessment />,     path: '/flowsheet' },
  { key: 'isolation',      label: '隔離拘束',         icon: <Lock />,           path: '/isolation' },
  { key: 'behavior',       label: '行動範囲',         icon: <Lock />,           path: '/behavior' },
  { key: 'outing',         label: '外出外泊',         icon: <Home />,           path: '/outing' },
  { key: 'ward-mgmt',      label: '病棟管理',         icon: <Business />,       path: '/ward-management' },
  { key: 'documents',      label: '書類管理',         icon: <FolderOpen />,     path: '/documents' },
  { key: 'orders',         label: 'オーダ管理',       icon: <Receipt />,        path: '/orders' },
  { key: 'rehab',          label: 'リハビリ',         icon: <FitnessCenter />,  path: '/rehab' },
  { key: 'care',           label: '看護ケア予定',     icon: <Favorite />,       path: '/nursing-care' },
  { key: 'patient-reg',    label: '患者登録',         icon: <PersonAdd />,      path: '/patient-registration' },
];

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, snackbar, hideSnackbar } = useAppStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentNav = NAV_ITEMS.find((item) => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  });

  const drawerWidth = sidebarOpen ? DRAWER_WIDTH : DRAWER_COLLAPSED;

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#0f172a',
            color: '#e2e8f0',
            transition: 'width 0.2s ease',
            overflowX: 'hidden',
          },
        }}
      >
        {/* Logo */}
        <Box sx={{ p: sidebarOpen ? '12px 16px' : '12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b' }}>
          {sidebarOpen ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                component="img"
                src="https://rakusendo-hp.jp/shared/images/logo-s.png"
                alt="楽仙堂病院"
                sx={{ height: 28, width: 'auto', borderRadius: '4px' }}
              />
              <Box>
                <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 800, letterSpacing: '0.05em', fontSize: '0.875rem', lineHeight: 1.2 }}>
                  EMR
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.625rem' }}>
                  電子カルテシステム
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box
              component="img"
              src="https://rakusendo-hp.jp/shared/images/logo-s.png"
              alt="楽仙堂病院"
              sx={{ height: 24, width: 'auto', borderRadius: '4px', mx: 'auto' }}
            />
          )}
          <IconButton onClick={toggleSidebar} size="small" sx={{ color: '#64748b' }}>
            {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Box>

        {/* Nav Items */}
        <List sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = currentNav?.key === item.key;
            return (
              <Tooltip key={item.key} title={sidebarOpen ? '' : item.label} placement="right">
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    minHeight: 38,
                    px: sidebarOpen ? 2 : 1.5,
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    bgcolor: isActive ? '#1e3a5f' : 'transparent',
                    borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                    color: isActive ? '#fff' : '#94a3b8',
                    '&:hover': { bgcolor: '#1e293b' },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: sidebarOpen ? 36 : 'auto', justifyContent: 'center' }}>
                    {React.cloneElement(item.icon, { fontSize: 'small' })}
                  </ListItemIcon>
                  {sidebarOpen && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.8125rem', noWrap: true }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Drawer>

      {/* Main Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar variant="dense" sx={{ justifyContent: 'space-between', minHeight: 48 }}>
            <Typography variant="h6" color="text.primary">
              {currentNav?.label || '電子カルテ'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {currentTime.toLocaleDateString('ja-JP')} {currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
              <Divider orientation="vertical" flexItem />
              <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.light', fontSize: '0.75rem', fontWeight: 700 }}>
                看
              </Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Outlet />
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={hideSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={hideSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MainLayout;
