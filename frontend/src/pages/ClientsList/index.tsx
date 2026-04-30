import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
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
  TextField,
  MenuItem,
  InputAdornment,
  Stack,
  IconButton,
  Tooltip,
  Grid,
  Fab,
  Checkbox,
  TablePagination,
  TableSortLabel,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  People as PeopleIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useClientes } from '../../hooks/useClientes';
import { useNavigate } from 'react-router-dom';
import type { Cliente } from '../../types/api';
import PageHeader from '../../components/Layout/PageHeader';
import SectionBlock from '../../components/Management/SectionBlock';
import OperationalNotice from '../../components/Management/OperationalNotice';
import EmptyStatePanel from '../../components/Management/EmptyStatePanel';
import userPreferencesService from '../../services/userPreferences';
import toast from 'react-hot-toast';

const CLIENTS_LAST_FILTERS_KEY = 'sosbeauty:clients:lastFilters';

interface ClientFilterSnapshot {
  searchTerm: string;
  sortBy: 'name' | 'email' | 'phone' | 'city';
  sortDirection: 'asc' | 'desc';
}

interface ClientsLayoutPrefs {
  rowsPerPage: number;
  denseRows: boolean;
}

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
    deletarCliente,
    clearError
  } = useClientes();

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'phone' | 'city'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [denseRows, setDenseRows] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const deferredSearchInput = useDeferredValue(searchInput);
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
    const loadInitialPrefs = async () => {
      try {
        const lastRaw = localStorage.getItem(CLIENTS_LAST_FILTERS_KEY);
        if (lastRaw) {
          const parsed = JSON.parse(lastRaw) as ClientFilterSnapshot;
          setSearchTerm(parsed.searchTerm || '');
          setSearchInput(parsed.searchTerm || '');
          setSortBy(parsed.sortBy || 'name');
          setSortDirection(parsed.sortDirection || 'asc');
        }

        const serverPrefs = await userPreferencesService.getPreferences().catch(() => ({}));

        const serverClientsPrefs = serverPrefs?.clients || {};

        if (serverClientsPrefs.layout) {
          setRowsPerPage(serverClientsPrefs.layout.rowsPerPage || 10);
          setDenseRows(!!serverClientsPrefs.layout.denseRows);
        }
      } catch {
        // Sem fallback adicional necessário
      }
    };

    loadInitialPrefs();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(deferredSearchInput);
      setPage(0);
    }, 250);
    return () => clearTimeout(timeout);
  }, [deferredSearchInput]);

  useEffect(() => {
    localStorage.setItem(CLIENTS_LAST_FILTERS_KEY, JSON.stringify({
      searchTerm,
      sortBy,
      sortDirection,
    }));
  }, [searchTerm, sortBy, sortDirection]);

  useEffect(() => {
    userPreferencesService.patchPreferences({
      clients: {
        layout: { rowsPerPage, denseRows },
      },
    }).catch(() => {});
  }, [rowsPerPage, denseRows]);

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
        toast.success('Cliente atualizado com sucesso.');
      }
    } catch (err) {
      console.error('Erro ao atualizar cliente:', err);
      toast.error('Não foi possível atualizar o cliente.');
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

  const handleSort = (column: 'name' | 'email' | 'phone' | 'city') => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(column);
    setSortDirection('asc');
  };

  const toggleClientSelection = (clientId: number) => {
    setSelectedClientIds((prev) => (
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    ));
  };

  const togglePageSelection = (ids: number[]) => {
    const allSelected = ids.every((id) => selectedClientIds.includes(id));
    if (allSelected) {
      setSelectedClientIds((prev) => prev.filter((id) => !ids.includes(id)));
      return;
    }
    setSelectedClientIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleBulkDelete = async () => {
    if (selectedClientIds.length === 0) return;
    if (!window.confirm(`Deseja excluir ${selectedClientIds.length} cliente(s)?`)) return;

    let successCount = 0;
    for (const id of selectedClientIds) {
      const ok = await deletarCliente(id);
      if (ok) successCount += 1;
    }
    setSelectedClientIds([]);
    if (successCount > 0) {
      toast.success(`${successCount} cliente(s) removido(s).`);
    } else {
      toast.error('Não foi possível remover os clientes selecionados.');
    }
  };

  const handleDeleteClient = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Deseja excluir este cliente?')) return;
    const ok = await deletarCliente(id);
    if (ok) {
      setSelectedClientIds((prev) => prev.filter((clientId) => clientId !== id));
      toast.success('Cliente removido com sucesso.');
    } else {
      toast.error('Não foi possível remover o cliente.');
    }
  };

  const filteredClientes = useMemo(() => {
    const filtered = clientes.filter(cliente =>
      cliente.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.phone?.includes(searchTerm) ||
      cliente.city?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      const modifier = sortDirection === 'asc' ? 1 : -1;
      const aValue = String((a as any)[sortBy] || '').toLowerCase();
      const bValue = String((b as any)[sortBy] || '').toLowerCase();
      return aValue.localeCompare(bValue) * modifier;
    });
  }, [clientes, searchTerm, sortBy, sortDirection]);

  const paginatedClientes = filteredClientes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  useEffect(() => {
    setSelectedClientIds((prev) => prev.filter((id) => filteredClientes.some((cliente) => cliente.id === id)));
  }, [filteredClientes]);

  return (
    <>
      <Container maxWidth="xl">
        <Box padding={{ xs: 2, md: 3 }}>
          <PageHeader
            title="Clientes"
            subtitle="Gestão de cadastro, contato e localização dos clientes"
            icon={<PeopleIcon fontSize="small" />}
            actions={
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={handleNewClient}
              >
                Novo Cliente
              </Button>
            }
          />

          {error && (
            <OperationalNotice
              severity="error"
              title="Falha ao carregar clientes"
              message={error}
              onClose={() => clearError()}
              mb={3}
            />
          )}

          <SectionBlock
            title="Filtros"
            icon={<SearchIcon color="primary" fontSize="small" />}
            actions={
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 'max-content', alignSelf: 'center' }}>
                  {filteredClientes.length} cliente(s)
                </Typography>
              </Stack>
            }
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
              <TextField
                fullWidth
                placeholder="Pesquisar por nome, email, telefone ou cidade..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
              <FormControlLabel
                control={<Switch checked={denseRows} onChange={(e) => setDenseRows(e.target.checked)} size="small" />}
                label="Tabela compacta"
              />
              <Button
                size="small"
                color="error"
                variant="outlined"
                disabled={selectedClientIds.length === 0}
                onClick={handleBulkDelete}
              >
                Excluir selecionados ({selectedClientIds.length})
              </Button>
            </Stack>
          </SectionBlock>

          <SectionBlock
            title="Clientes Cadastrados"
            showHeaderDivider
            padding={0}
          >
            <TableContainer>
              <Table size={denseRows ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={paginatedClientes.length > 0 && paginatedClientes.every((cliente) => selectedClientIds.includes(cliente.id || 0))}
                        indeterminate={paginatedClientes.some((cliente) => selectedClientIds.includes(cliente.id || 0)) && !paginatedClientes.every((cliente) => selectedClientIds.includes(cliente.id || 0))}
                        onChange={() => togglePageSelection(paginatedClientes.map((cliente) => cliente.id || 0))}
                      />
                    </TableCell>
                    <TableCell>
                      <TableSortLabel active={sortBy === 'name'} direction={sortDirection} onClick={() => handleSort('name')}>
                        Nome
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel active={sortBy === 'email'} direction={sortDirection} onClick={() => handleSort('email')}>
                        Email
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel active={sortBy === 'phone'} direction={sortDirection} onClick={() => handleSort('phone')}>
                        Telefone
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel active={sortBy === 'city'} direction={sortDirection} onClick={() => handleSort('city')}>
                        Cidade
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : filteredClientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <EmptyStatePanel
                          title={searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                          subtitle={searchTerm ? 'Tente ajustar os filtros de busca.' : 'Cadastre um cliente para iniciar.'}
                          compact
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedClientes.map((cliente) => (
                      <TableRow key={cliente.id} hover selected={selectedClientIds.includes(cliente.id || 0)}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            size="small"
                            checked={selectedClientIds.includes(cliente.id || 0)}
                            onChange={() => toggleClientSelection(cliente.id || 0)}
                          />
                        </TableCell>
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
                          <Tooltip title="Excluir cliente">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClient(cliente.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
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
              <TablePagination
                component="div"
                count={filteredClientes.length}
                page={page}
                onPageChange={(_e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Linhas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </TableContainer>
          </SectionBlock>

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
                      autoComplete="name"
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
                      autoComplete="email"
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
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
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
                      autoComplete="address-line1"
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
                      inputMode="numeric"
                      autoComplete="postal-code"
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
                      autoComplete="address-level3"
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
                      autoComplete="address-level2"
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
                      autoComplete="address-level1"
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