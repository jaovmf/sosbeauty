import { useState } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Drawer,
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Home as HomeIcon,
  ShoppingCart as ShoppingCartIcon,
  PointOfSale as PointOfSaleIcon,
  LocalShipping as LocalShippingIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  AddBox as AddBoxIcon,
  PersonAdd as PersonAddIcon,
  People as PeopleIcon,
  Storefront as StorefrontIcon,
  ManageAccounts as ManageAccountsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const mainActions = [
  { label: 'Home', value: '/', icon: <HomeIcon /> },
  { label: 'Vender', value: '/sales', icon: <ShoppingCartIcon /> },
  { label: 'Estoque', value: '/stock', icon: <InventoryIcon /> },
  { label: 'Gerenciar', value: '/sales-management', icon: <PointOfSaleIcon /> },
  { label: 'Mais', value: 'more', icon: <AssessmentIcon /> },
];

const speedDialActions = [
  { icon: <PersonAddIcon />, name: 'Cadastrar Cliente', path: '/clients' },
  { icon: <AddBoxIcon />, name: 'Adicionar Produto', path: '/products' },
  { icon: <LocalShippingIcon />, name: 'Entrada Mercadoria', path: '/entradas' },
  { icon: <PeopleIcon />, name: 'Clientes', path: '/clients-list' },
  { icon: <AssessmentIcon />, name: 'Relatórios', path: '/reports' },
  { icon: <ManageAccountsIcon />, name: 'CRM', path: '/crm' },
  { icon: <StorefrontIcon />, name: 'Catálogo', path: '/catalog' },
];

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [openMoreDrawer, setOpenMoreDrawer] = useState(false);

  const getCurrentValue = () => {
    const path = location.pathname;
    const mainAction = mainActions.find((action) => action.value === path);
    if (mainAction) return mainAction.value;

    // Se estiver em uma das páginas do speed dial, retorna 'more'
    const isSpeedDialPath = speedDialActions.some((action) => action.path === path);
    if (isSpeedDialPath) return 'more';

    return '/';
  };

  const handleNavigation = (value: string) => {
    if (value === 'more') {
      setOpenMoreDrawer((prev) => !prev);
      return;
    }
    setOpenMoreDrawer(false);
    navigate(value);
  };

  const handleSpeedDialAction = (path: string) => {
    navigate(path);
    setOpenMoreDrawer(false);
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
              onClick={() => handleNavigation(action.value)}
            />
          ))}
        </BottomNavigation>
      </Paper>

      <Drawer
        anchor="right"
        open={openMoreDrawer}
        onClose={() => setOpenMoreDrawer(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: '50vw',
            maxWidth: 360,
            minWidth: 240,
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
            boxShadow: theme.shadows[8],
            pb: 10,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            Mais opções
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Atalhos rápidos
          </Typography>
        </Box>

        <Divider />

        <List sx={{ px: 1, pt: 1 }}>
          {speedDialActions.map((action) => (
            <ListItemButton
              key={action.name}
              onClick={() => handleSpeedDialAction(action.path)}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>{action.icon}</ListItemIcon>
              <ListItemText
                primary={action.name}
                primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
    </>
  );
};

export default MobileBottomNav;
