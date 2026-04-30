import { Box, Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface KpiMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color?: string;
  trend?: number;
  highlight?: 'default' | 'warning' | 'error';
}

const KpiMetricCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  highlight = 'default',
}: KpiMetricCardProps) => {
  const isWarning = highlight === 'warning';
  const isError = highlight === 'error';

  return (
    <Card
      sx={{
        height: '100%',
        borderColor: isWarning ? 'warning.main' : isError ? 'error.main' : 'divider',
        backgroundColor: isWarning ? 'warning.50' : isError ? 'error.50' : 'background.paper',
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {title}
          </Typography>
          <Box sx={{ opacity: 0.75, color: color || 'text.secondary' }}>{icon}</Box>
        </Box>

        <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', md: '1.45rem' }, color: color || 'text.primary' }}>
          {value}
        </Typography>

        {(subtitle || trend !== undefined) && (
          <Box mt={0.25} display="flex" alignItems="center" justifyContent="space-between" gap={1}>
            <Typography variant="caption" color="text.secondary">
              {subtitle || ''}
            </Typography>
            {trend !== undefined && (
              <Typography
                variant="caption"
                fontWeight={700}
                color={trend > 0 ? 'success.main' : trend < 0 ? 'error.main' : 'text.secondary'}
              >
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default KpiMetricCard;
