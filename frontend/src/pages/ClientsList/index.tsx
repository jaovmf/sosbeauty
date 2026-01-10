import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Stack,
  IconButton,
  Tooltip,
  Grid,
  Fab
} from '@mui/material';
import {
  Edit as EditIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useClientes } from '../../hooks/useClientes';
import { useNavigate } from 'react-router-dom';
import type { Cliente } from '../../types/api';

interface EditFormData {
  name: string;
  email: string;
  phone: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

const ClientsList = () => {
  const navigate = useNavigate();
  const {
    clientes,
    loading,
    error,
    listarClientes,
    atualizarCliente,
    clearError
  } = useClientes();

  const [searchTerm, setSearchTerm] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    email: '',
    phone: '',
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [editErrors, setEditErrors] = useState<Partial<EditFormData>>({});

  useEffect(() => {
    listarClientes();
  }, [listarClientes]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const timeoutId = setTimeout(() => {
        listarClientes(searchTerm);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      listarClientes();
    }
  }, [searchTerm, listarClientes]);

  const handleEdit = (cliente: Cliente) => {
    setSelectedClient(cliente);
    setEditForm({
      name: cliente.name || '',
      email: cliente.email || '',
      phone: cliente.phone || '',
      street: cliente.street || '',
      neighborhood: cliente.neighborhood || '',
      city: cliente.city || '',
      state: cliente.state || '',
      zipCode: cliente.zipCode || ''
    });
    setEditErrors({});
    setEditOpen(true);
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const formatZipCode = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{5})(\d{3})$/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    return value;
  };

  const handleEditFormChange = (field: keyof EditFormData, value: string) => {
    let formattedValue = value;

    if (field === 'phone') {
      formattedValue = formatPhone(value);
    } else if (field === 'zipCode') {
      formattedValue = formatZipCode(value);
    } else if (field === 'state') {
      formattedValue = value.toUpperCase();
    }

    setEditForm(prev => ({
      ...prev,
      [field]: formattedValue
    }));

    // Limpar erro do campo
    if (editErrors[field]) {
      setEditErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateEditForm = () => {
    const newErrors: Partial<EditFormData> = {};

    if (!editForm.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!editForm.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      newErrors.email = 'E-mail deve ter um formato válido';
    }

    if (!editForm.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else {
      const phoneDigits = editForm.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 11) {
        newErrors.phone = 'Telefone deve ter 11 dígitos (com DDD)';
      }
    }

    if (!editForm.street.trim()) {
      newErrors.street = 'Rua é obrigatória';
    }

    if (!editForm.neighborhood.trim()) {
      newErrors.neighborhood = 'Bairro é obrigatório';
    }

    if (!editForm.city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    }

    if (!editForm.state.trim()) {
      newErrors.state = 'Estado é obrigatório';
    } else if (editForm.state.length !== 2) {
      newErrors.state = 'Estado deve ter 2 caracteres (ex: SC)';
    }

    if (!editForm.zipCode.trim()) {
      newErrors.zipCode = 'CEP é obrigatório';
    } else {
      const cepDigits = editForm.zipCode.replace(/\D/g, '');
      if (cepDigits.length !== 8) {
        newErrors.zipCode = 'CEP deve ter 8 dígitos';
      }
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!validateEditForm() || !selectedClient) {
      return;
    }

    setEditLoading(true);
    try {
      const clientData = {
        name: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase(),
        phone: editForm.phone.replace(/\D/g, ''),
        street: editForm.street.trim(),
        neighborhood: editForm.neighborhood.trim(),
        city: editForm.city.trim(),
        state: editForm.state.trim().toUpperCase(),
        zipCode: editForm.zipCode.replace(/\D/g, '')
      };

      const success = await atualizarCliente(selectedClient.id!, clientData);

      if (success) {
        setEditOpen(false);
        setSelectedClient(null);
        // Recarregar lista
        listarClientes(searchTerm || undefined);
      }
    } catch (err) {
      console.error('Erro ao atualizar cliente:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setSelectedClient(null);
    setEditErrors({});
  };

  const handleNewClient = () => {
    navigate('/clients');
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.phone?.includes(searchTerm) ||
    cliente.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Container maxWidth="xl">
        <Box padding={{ xs: 2, md: 3 }}>
          <Box marginBottom={{ xs: 3, md: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Clientes
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Gerencie todos os clientes cadastrados no sistema
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => clearError()}>
              {error}
            </Alert>
          )}

          {/* Barra de Pesquisa */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <TextField
                fullWidth
                placeholder="Pesquisar por nome, email, telefone ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Typography variant="body2" color="textSecondary" sx={{ minWidth: 'max-content' }}>
                {filteredClientes.length} cliente(s)
              </Typography>
            </Stack>
          </Paper>

          {/* Tabela de Clientes */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Telefone</TableCell>
                    <TableCell>Cidade</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : filteredClientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="textSecondary">
                          {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClientes.map((cliente) => (
                      <TableRow key={cliente.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {cliente.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {cliente.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {cliente.phone}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocationIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {cliente.city} - {cliente.state}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar cliente">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(cliente)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* FAB para adicionar cliente */}
          <Fab
            color="primary"
            onClick={handleNewClient}
            sx={{
              position: 'fixed',
              bottom: { xs: 20, sm: 30 },
              right: { xs: 20, sm: 30 },
              zIndex: 1000
            }}
          >
            <PersonAddIcon />
          </Fab>

          {/* Modal de Edição */}
          <Dialog
            open={editOpen}
            onClose={handleCloseEdit}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Editar Cliente: {selectedClient?.name}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nome Completo"
                      value={editForm.name}
                      onChange={(e) => handleEditFormChange('name', e.target.value)}
                      error={!!editErrors.name}
                      helperText={editErrors.name}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleEditFormChange('email', e.target.value)}
                      error={!!editErrors.email}
                      helperText={editErrors.email}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Telefone"
                      value={editForm.phone}
                      onChange={(e) => handleEditFormChange('phone', e.target.value)}
                      error={!!editErrors.phone}
                      helperText={editErrors.phone}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="Rua"
                      value={editForm.street}
                      onChange={(e) => handleEditFormChange('street', e.target.value)}
                      error={!!editErrors.street}
                      helperText={editErrors.street}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="CEP"
                      value={editForm.zipCode}
                      onChange={(e) => handleEditFormChange('zipCode', e.target.value)}
                      error={!!editErrors.zipCode}
                      helperText={editErrors.zipCode}
                      placeholder="12345-678"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Bairro"
                      value={editForm.neighborhood}
                      onChange={(e) => handleEditFormChange('neighborhood', e.target.value)}
                      error={!!editErrors.neighborhood}
                      helperText={editErrors.neighborhood}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Cidade"
                      value={editForm.city}
                      onChange={(e) => handleEditFormChange('city', e.target.value)}
                      error={!!editErrors.city}
                      helperText={editErrors.city}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Estado"
                      value={editForm.state}
                      onChange={(e) => handleEditFormChange('state', e.target.value)}
                      error={!!editErrors.state}
                      helperText={editErrors.state}
                      placeholder="SC"
                      inputProps={{ maxLength: 2 }}
                      required
                    />
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleCloseEdit}
                disabled={editLoading}
                startIcon={<CancelIcon />}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={editLoading}
                variant="contained"
                color="primary"
                startIcon={editLoading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {editLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </>
  );
};

export default ClientsList;