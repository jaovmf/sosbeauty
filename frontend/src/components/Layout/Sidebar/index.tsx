import { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  IconButton,
  Divider,
  Avatar,
  useTheme,
  alpha,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Home as HomeIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  AddBox as AddBoxIcon,
  PersonAdd as PersonAddIcon,
  ViewList as ViewListIcon,
  People as PeopleIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Storefront as StorefrontIcon,
  Logout as LogoutIcon,
  ManageAccounts as ManageAccountsIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  LocalShipping as LocalShippingIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const drawerWidth = 280;

interface MenuItem {
  text: string;
  icon: JSX.Element;
  path: string;
  color?: string;
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', icon: <HomeIcon />, path: '/', color: '#1976d2' },
  { text: 'Nova Venda', icon: <ShoppingCartIcon />, path: '/sales', color: '#2e7d32' },
  { text: 'Catálogo', icon: <StorefrontIcon />, path: '/catalog', color: '#ed6c02' },
  { text: 'Gerenciar Vendas', icon: <ViewListIcon />, path: '/sales-management', color: '#9c27b0' },
  { text: 'Estoque', icon: <InventoryIcon />, path: '/stock', color: '#0288d1' },
  { text: 'Relatórios', icon: <AssessmentIcon />, path: '/reports', color: '#d32f2f' },
];

const secondaryMenuItems: MenuItem[] = [
  { text: 'Adicionar Produto', icon: <AddBoxIcon />, path: '/products', color: '#388e3c' },
  { text: 'Cadastrar Cliente', icon: <PersonAddIcon />, path: '/clients', color: '#1976d2' },
  { text: 'Lista de Clientes', icon: <PeopleIcon />, path: '/clients-list', color: '#7b1fa2' },
  { text: 'Fornecedores', icon: <BusinessIcon />, path: '/fornecedores', color: '#f57c00' },
  { text: 'Entrada de Mercadorias', icon: <LocalShippingIcon />, path: '/entradas', color: '#0277bd' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { usuario, logout } = useAuth();
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/login');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : 72,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : 72,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          px: open ? 2 : 1,
          minHeight: '64px !important',
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
        }}
      >
        {open && (
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 40,
                height: 40,
              }}
            >
              SB
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                SOS Beauty
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sistema de Gestão
              </Typography>
            </Box>
          </Box>
        )}
        <IconButton onClick={handleDrawerToggle} size="small">
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Toolbar>

      <Divider />

      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2,
                  borderRadius: 2,
                  backgroundColor: active
                    ? alpha(item.color || theme.palette.primary.main, 0.12)
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: active
                      ? alpha(item.color || theme.palette.primary.main, 0.2)
                      : alpha(theme.palette.action.hover, 0.08),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : 'auto',
                    justifyContent: 'center',
                    color: active ? item.color : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    opacity: open ? 1 : 0,
                    '& .MuiListItemText-primary': {
                      fontWeight: active ? 600 : 400,
                      color: active ? item.color : 'text.primary',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ mx: 2 }} />

      <List sx={{ px: 1, py: 2 }}>
        {open && (
          <ListItem sx={{ px: 2, mb: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              CADASTROS
            </Typography>
          </ListItem>
        )}
        {secondaryMenuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2,
                  borderRadius: 2,
                  backgroundColor: active
                    ? alpha(item.color || theme.palette.primary.main, 0.12)
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: active
                      ? alpha(item.color || theme.palette.primary.main, 0.2)
                      : alpha(theme.palette.action.hover, 0.08),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : 'auto',
                    justifyContent: 'center',
                    color: active ? item.color : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    opacity: open ? 1 : 0,
                    '& .MuiListItemText-primary': {
                      fontWeight: active ? 600 : 400,
                      fontSize: '0.9rem',
                      color: active ? item.color : 'text.primary',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider />

      {/* User Menu */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={handleUserMenuOpen}
          sx={{
            borderRadius: 2,
            p: 1.5,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 0 }}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 36,
                height: 36,
              }}
            >
              {usuario?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </ListItemIcon>
          {open && (
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {usuario?.name}
              </Typography>
              <Chip
                label={usuario?.roleName || usuario?.role}
                size="small"
                sx={{
                  mt: 0.5,
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                }}
              />
            </Box>
          )}
        </ListItemButton>
      </Box>

      {/* User Menu Dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleUserMenuClose}
        PaperProps={{
          sx: {
            width: 220,
            mt: -1,
          },
        }}
      >
        <MenuItem disabled>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {usuario?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {usuario?.email}
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleUserMenuClose(); navigate('/usuarios'); }}>
          <ListItemIcon>
            <ManageAccountsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Gerenciar Usuários</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleUserMenuClose(); navigate('/perfil'); }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Meu Perfil</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Sair</ListItemText>
        </MenuItem>
      </Menu>
    </Drawer>
  );
};

export default Sidebar;
