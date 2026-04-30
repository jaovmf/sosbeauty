import { Alert, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface OperationalNoticeProps {
  severity: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: ReactNode;
  onClose?: () => void;
  mb?: number;
}

const OperationalNotice = ({
  severity,
  title,
  message,
  onClose,
  mb = 2,
}: OperationalNoticeProps) => {
  return (
    <Alert severity={severity} onClose={onClose} sx={{ mb, borderRadius: 2 }}>
      {title && (
        <Typography variant="subtitle2" sx={{ mb: 0.25 }}>
          {title}
        </Typography>
      )}
      <Typography variant="body2">{message}</Typography>
    </Alert>
  );
};

export default OperationalNotice;
