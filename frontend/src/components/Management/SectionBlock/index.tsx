import { Box, Paper, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface SectionBlockProps {
  title?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  mb?: number;
  padding?: number | { xs?: number; sm?: number; md?: number };
  showHeaderDivider?: boolean;
}

const SectionBlock = ({
  title,
  icon,
  actions,
  children,
  mb = 3,
  padding = { xs: 2, md: 2.5 },
  showHeaderDivider = false,
}: SectionBlockProps) => {
  return (
    <Paper sx={{ mb, borderRadius: 2 }}>
      {(title || actions) && (
        <Box
          sx={{
            px: padding,
            py: 1.5,
            borderBottom: showHeaderDivider ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            flexWrap="wrap"
          >
            {title && (
              <Box display="flex" alignItems="center" gap={1}>
                {icon}
                <Typography variant="subtitle2">{title}</Typography>
              </Box>
            )}
            {actions && <Box>{actions}</Box>}
          </Box>
        </Box>
      )}

      <Box sx={{ p: padding }}>{children}</Box>
    </Paper>
  );
};

export default SectionBlock;
