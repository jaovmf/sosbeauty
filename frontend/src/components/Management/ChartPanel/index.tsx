import { Box, Paper, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface ChartPanelProps {
  title: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  height?: number;
}

const ChartPanel = ({ title, icon, actions, children, height = 300 }: ChartPanelProps) => {
  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, height: '100%' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" marginBottom={2}>
        <Box display="flex" alignItems="center" gap={1}>
          {icon}
          <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.125rem' } }}>
            {title}
          </Typography>
        </Box>
        {actions && <Box>{actions}</Box>}
      </Box>
      <Box sx={{ height: { xs: 250, md: height } }}>{children}</Box>
    </Paper>
  );
};

export default ChartPanel;
