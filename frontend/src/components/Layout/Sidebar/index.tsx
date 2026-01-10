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

interface MenuItemType {
  text: string;
  icon: JSX.Element;
  path: string;
  highlight?: boolean;
}

const menuItems: MenuItemType[] = [
  { text: 'Dashboard', icon: <HomeIcon />, path: '/' },
  { text: 'Nova Venda', icon: <ShoppingCartIcon />, path: '/sales' },
  { text: 'Catálogo', icon: <StorefrontIcon />, path: '/catalog' },
  { text: 'Gerenciar Vendas', icon: <ViewListIcon />, path: '/sales-management' },
  { text: 'Estoque', icon: <InventoryIcon />, path: '/stock' },
  { text: 'Relatórios', icon: <AssessmentIcon />, path: '/reports' },
];

const secondaryMenuItems: MenuItemType[] = [
  { text: 'Adicionar Produto', icon: <AddBoxIcon />, path: '/products' },
  { text: 'Cadastrar Cliente', icon: <PersonAddIcon />, path: '/clients' },
  { text: 'Lista de Clientes', icon: <PeopleIcon />, path: '/clients-list' },
  { text: 'Fornecedores', icon: <BusinessIcon />, path: '/fornecedores' },
  { text: 'Entrada de Mercadorias', icon: <LocalShippingIcon />, path: '/entradas' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { usuario, logout } = useAuth();
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const getItemStyle = (active: boolean, highlight?: boolean) => ({
    minHeight: 48,
    justifyContent: open ? 'initial' : 'center',
    px: 2,
    borderRadius: 2,
    color: active
      ? theme.palette.secondary.main
      : highlight
      ? theme.palette.secondary.main
      : theme.palette.text.primary,
    backgroundColor: active
      ? alpha(theme.palette.secondary.light, 0.25)
      : 'transparent',
    '&:hover': {
      backgroundColor: active
        ? alpha(theme.palette.secondary.light, 0.35)
        : alpha(theme.palette.action.hover, 0.08),
    },
  });

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : 72,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : 72,
          transition: theme.transitions.create('width'),
          overflowX: 'hidden',
          backgroundColor: '#fff',
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Toolbar
        sx={{
          justifyContent: open ? 'space-between' : 'center',
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
        }}
      >
        {open && (
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 50, height: 50 }}>
              SOS
            </Avatar>
            <Box>
              <Typography fontWeight="bold">SOS Beauty</Typography>
              <Typography variant="caption" color="text.secondary">
                Sistema de Gestão
              </Typography>
            </Box>
          </Box>
        )}
        <IconButton onClick={() => setOpen(!open)} size="small">
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
                onClick={() => navigate(item.path)}
                sx={getItemStyle(active, item.highlight)}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : 'auto',
                    color: active || item.highlight
                      ? theme.palette.secondary.main
                      : theme.palette.text.secondary,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    opacity: open ? 1 : 0,
                    '& .MuiListItemText-primary': {
                      fontWeight: active || item.highlight ? 600 : 400,
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
          <ListItem sx={{ px: 2 }}>
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
                onClick={() => navigate(item.path)}
                sx={getItemStyle(active)}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : 'auto',
                    color: active
                      ? theme.palette.secondary.main
                      : theme.palette.text.secondary,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    opacity: open ? 1 : 0,
                    '& .MuiListItemText-primary': {
                      fontSize: '0.9rem',
                      fontWeight: active ? 600 : 400,
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

      {/* User */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 0 }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {usuario?.name?.charAt(0)}
            </Avatar>
          </ListItemIcon>
          {open && (
            <Box>
              <Typography fontWeight={600}>{usuario?.name}</Typography>
              <Chip
                label={usuario?.roleName || usuario?.role}
                size="small"
                sx={{
                  mt: 0.5,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                }}
              />
            </Box>
          )}
        </ListItemButton>
      </Box>

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => navigate('/perfil')}>
          <SettingsIcon fontSize="small" sx={{ mr: 1 }} /> Meu Perfil
        </MenuItem>
        <MenuItem onClick={() => { logout(); navigate('/login'); }}>
          <LogoutIcon fontSize="small" color="error" sx={{ mr: 1 }} /> Sair
        </MenuItem>
      </Menu>
    </Drawer>
  );
};

export default Sidebar;
