import { useState } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  useTheme,
} from '@mui/material';
import {
  Home as HomeIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  AddBox as AddBoxIcon,
  PersonAdd as PersonAddIcon,
  People as PeopleIcon,
  Storefront as StorefrontIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const mainActions = [
  { label: 'Home', value: '/', icon: <HomeIcon /> },
  { label: 'Vender', value: '/sales', icon: <ShoppingCartIcon /> },
  { label: 'Estoque', value: '/stock', icon: <InventoryIcon /> },
  { label: 'Catálogo', value: '/catalog', icon: <StorefrontIcon /> },
  { label: 'Mais', value: 'more', icon: <AssessmentIcon /> },
];

const speedDialActions = [
  { icon: <AssessmentIcon />, name: 'Relatórios', path: '/reports' },
  { icon: <PeopleIcon />, name: 'Clientes', path: '/clients-list' },
  { icon: <PersonAddIcon />, name: 'Cadastrar Cliente', path: '/clients' },
  { icon: <AddBoxIcon />, name: 'Adicionar Produto', path: '/products' },
];

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [openSpeedDial, setOpenSpeedDial] = useState(false);

  const getCurrentValue = () => {
    const path = location.pathname;
    const mainAction = mainActions.find((action) => action.value === path);
    if (mainAction) return mainAction.value;

    // Se estiver em uma das páginas do speed dial, retorna 'more'
    const isSpeedDialPath = speedDialActions.some((action) => action.path === path);
    if (isSpeedDialPath) return 'more';

    // Se estiver em gerenciar vendas, retorna 'Vender'
    if (path === '/sales-management') return '/sales';

    return '/';
  };

  const handleNavigation = (_event: React.SyntheticEvent, newValue: string) => {
    if (newValue === 'more') {
      setOpenSpeedDial(true);
      return;
    }
    navigate(newValue);
  };

  const handleSpeedDialAction = (path: string) => {
    navigate(path);
    setOpenSpeedDial(false);
  };

  return (
    <>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          display: { xs: 'block', md: 'none' },
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
        elevation={3}
      >
        <BottomNavigation
          value={getCurrentValue()}
          onChange={handleNavigation}
          showLabels
          sx={{
            height: 70,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '6px 12px',
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              marginTop: '4px',
            },
            '& .MuiBottomNavigationAction-label.Mui-selected': {
              fontSize: '0.75rem',
              fontWeight: 600,
            },
          }}
        >
          {mainActions.map((action) => (
            <BottomNavigationAction
              key={action.value}
              label={action.label}
              value={action.value}
              icon={action.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>

      <SpeedDial
        ariaLabel="Mais opções"
        sx={{
          position: 'fixed',
          bottom: 90,
          right: 16,
          display: { xs: 'flex', md: 'none' },
          '& .MuiFab-primary': {
            backgroundColor: theme.palette.primary.main,
          },
        }}
        icon={<SpeedDialIcon />}
        open={openSpeedDial}
        onClose={() => setOpenSpeedDial(false)}
        onOpen={() => setOpenSpeedDial(true)}
        FabProps={{
          sx: {
            display: getCurrentValue() === 'more' ? 'flex' : 'none',
          },
        }}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => handleSpeedDialAction(action.path)}
            tooltipPlacement="left"
          />
        ))}
      </SpeedDial>
    </>
  );
};

export default MobileBottomNav;
