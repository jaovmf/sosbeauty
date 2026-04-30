import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface EmptyStatePanelProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  compact?: boolean;
}

const EmptyStatePanel = ({ title, subtitle, icon, compact = false }: EmptyStatePanelProps) => {
  return (
    <Box
      sx={{
        py: compact ? 2 : 4,
        textAlign: 'center',
        border: compact ? 'none' : '1px dashed',
        borderColor: compact ? 'transparent' : 'divider',
        borderRadius: compact ? 0 : 2,
      }}
    >
      {icon && <Box sx={{ mb: 1, color: 'text.disabled' }}>{icon}</Box>}
      <Typography variant={compact ? 'body2' : 'subtitle2'} color="text.secondary" sx={{ fontWeight: compact ? 400 : 600 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default EmptyStatePanel;
