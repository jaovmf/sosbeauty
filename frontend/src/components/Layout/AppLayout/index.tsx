import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from '../Sidebar';
import MobileBottomNav from '../MobileBottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar para Desktop */}
      {!isMobile && <Sidebar />}

      {/* Conteúdo Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: { xs: 2, md: 3 },
          pb: { xs: 10, md: 3 }, // Padding bottom maior no mobile por causa do BottomNav
          width: { xs: '100%', md: 'calc(100% - 280px)' },
          minHeight: '100vh',
          overflowX: 'hidden',
        }}
      >
        {children}
      </Box>

      {/* Bottom Navigation para Mobile */}
      {isMobile && <MobileBottomNav />}
    </Box>
  );
};

export default AppLayout;
