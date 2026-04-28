import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  typography: {
    fontFamily: [
      '"Noto Sans JP"',
      '"Hiragino Kaku Gothic ProN"',
      '"Yu Gothic"',
      'sans-serif',
    ].join(','),
    fontSize: 14,
    h5: { fontWeight: 700, fontSize: '1.625rem' },
    h6: { fontWeight: 700, fontSize: '1.125rem' },
    subtitle1: { fontWeight: 600, fontSize: '1.0625rem' },
    subtitle2: { fontWeight: 600, fontSize: '0.9375rem' },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.9375rem' },
    caption: { fontSize: '0.8125rem' },
    button: { fontSize: '0.875rem' },
  },
  palette: {
    primary: {
      main: '#1e40af',
      light: '#3b82f6',
      dark: '#1e3a5f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#059669',
      light: '#34d399',
      dark: '#047857',
    },
    error: {
      main: '#dc2626',
      light: '#f87171',
    },
    warning: {
      main: '#d97706',
      light: '#fbbf24',
    },
    success: {
      main: '#16a34a',
      light: '#4ade80',
    },
    info: {
      main: '#6366f1',
      light: '#a5b4fc',
    },
    background: {
      default: '#f0f2f5',
      paper: '#ffffff',
    },
    divider: '#e2e8f0',
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, size: 'small' },
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' },
        sizeSmall: { padding: '6px 14px' },
      },
    },
    MuiChip: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem' },
        sizeSmall: { height: 26 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: '8px 12px', fontSize: '0.875rem' },
        head: { fontWeight: 700, color: '#475569', backgroundColor: '#f8fafc', whiteSpace: 'nowrap' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#f0f7ff' },
          '&:nth-of-type(even)': { backgroundColor: '#fafbfc' },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, minHeight: 40, fontSize: '0.875rem' },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40 },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: { borderColor: '#e2e8f0' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 12 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { border: 'none' },
      },
    },
  },
});
