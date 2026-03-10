import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  typography: {
    fontFamily: '"Noto Sans JP", "Helvetica", "Arial", sans-serif',
    fontSize: 12,
  },
  palette: {
    background: {
      default: '#f5f5f5',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontSize: '12px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minWidth: 0,
          fontSize: '11px',
        },
      },
    },
  },
});
