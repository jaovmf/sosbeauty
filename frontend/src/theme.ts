import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#6F1DBA',
      light: '#9B5DE5',
      dark: '#4A0F82',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#E91E63',
      light: '#F06292',
      dark: '#AD1457',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F6F4FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E1B2E',
      secondary: '#5E5A72',
    },
    success: {
      main: '#2E7D32',
    },
    warning: {
      main: '#ED6C02',
    },
    error: {
      main: '#D32F2F',
    },
    info: {
      main: '#0288D1',
    },
    divider: '#E0D7F3',
  },
});
