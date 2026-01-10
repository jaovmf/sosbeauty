import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

// Função para obter URL da API (mesma lógica do api.ts)
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== '') {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === '192.168.1.7' || hostname === '192.168.1.9') {
      return `http://${hostname}:3003/api`;
    }
    if (hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
      return `http://${hostname}:3003/api`;
    }
  }
  return 'http://localhost:3003/api';
};

const API_URL = getApiUrl();

interface Usuario {
  id: string;
  name: string;
  email: string;
  role: string;
  roleName: string;
  ativo: boolean;
  phone?: string;
  lastLogin?: string;
  createdAt: string;
}

const UsuariosManagement: React.FC = () => {
  const { usuario: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'vendedor',
    phone: ''
  });

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      const response = await axios.get(`${API_URL}/usuarios`);
      setUsuarios(response.data.usuarios);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: Usuario) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        phone: user.phone || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'vendedor',
        phone: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        // Atualizar usuário
        await axios.put(`${API_URL}/usuarios/${editingUser.id}`, formData);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        // Criar novo usuário
        await axios.post(`${API_URL}/auth/register`, formData);
        toast.success('Usuário criado com sucesso!');
      }

      handleCloseDialog();
      loadUsuarios();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao salvar usuário';
      toast.error(message);
    }
  };

  const handleToggleStatus = async (user: Usuario) => {
    try {
      if (user.ativo) {
        await axios.delete(`${API_URL}/usuarios/${user.id}`);
        toast.success('Usuário desativado!');
      } else {
        await axios.post(`${API_URL}/usuarios/${user.id}/reativar`);
        toast.success('Usuário reativado!');
      }

      loadUsuarios();
    } catch (error: any) {
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'error',
      admin: 'warning',
      gerente: 'info',
      vendedor: 'success',
      visualizador: 'default'
    };
    return colors[role] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Apenas super_admin pode acessar
  if (currentUser?.role !== 'super_admin') {
    return (
      <Box p={3}>
        <Typography variant="h5" color="error">
          Acesso negado. Apenas Super Admin pode gerenciar usuários.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Gerenciar Usuários
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Usuário
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Usuário</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Função</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Último Login</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography fontWeight={500}>{user.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={user.roleName}
                    color={getRoleColor(user.role) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.ativo ? 'Ativo' : 'Inativo'}
                    color={user.ativo ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString('pt-BR')
                    : 'Nunca'}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(user)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color={user.ativo ? 'error' : 'success'}
                    onClick={() => handleToggleStatus(user)}
                    disabled={user.id === currentUser?.id}
                  >
                    {user.ativo ? <BlockIcon /> : <CheckCircleIcon />}
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de Criação/Edição */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label="Nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
              fullWidth
            />
            <TextField
              label="Telefone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Função"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              fullWidth
            >
              <MenuItem value="super_admin">Super Administrador</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="gerente">Gerente</MenuItem>
              <MenuItem value="vendedor">Vendedor</MenuItem>
              <MenuItem value="visualizador">Visualizador</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.email || (!editingUser && !formData.password)}
          >
            {editingUser ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsuariosManagement;
