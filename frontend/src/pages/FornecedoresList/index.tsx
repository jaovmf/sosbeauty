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
  Fab,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import api from '../../lib/api';

interface Fornecedor {
  id: string;
  nome: string;
  razao_social?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  site?: string;
  observacoes?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  nome: string;
  razao_social: string;
  cnpj: string;
  email: string;
  telefone: string;
  celular: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  site: string;
  observacoes: string;
}

const FornecedoresList = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    razao_social: '',
    cnpj: '',
    email: '',
    telefone: '',
    celular: '',
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    site: '',
    observacoes: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [showInactive, setShowInactive] = useState(false);

  const loadFornecedores = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (!showInactive) params.append('ativo', 'true');

      const response = await api.get(`/fornecedores?${params.toString()}`);
      const data = response.data.fornecedores || response.data;
      setFornecedores(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar fornecedores');
      setFornecedores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFornecedores();
  }, [searchTerm, showInactive]);

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
      const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
      if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
    } else if (cleaned.length === 10) {
      const match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
      if (match) return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{5})(\d{3})$/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    return value;
  };

  const handleFormChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;

    if (field === 'cnpj') {
      formattedValue = formatCNPJ(value);
    } else if (field === 'telefone' || field === 'celular') {
      formattedValue = formatPhone(value);
    } else if (field === 'cep') {
      formattedValue = formatCEP(value);
    } else if (field === 'estado') {
      formattedValue = value.toUpperCase().slice(0, 2);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Partial<FormData> = {};

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }

    if (formData.cnpj && formData.cnpj.replace(/\D/g, '').length !== 14) {
      errors.cnpj = 'CNPJ inválido';
    }

    if (formData.estado && formData.estado.length !== 2) {
      errors.estado = 'Estado deve ter 2 letras';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenDialog = (fornecedor?: Fornecedor) => {
    if (fornecedor) {
      setEditMode(true);
      setSelectedFornecedor(fornecedor);
      setFormData({
        nome: fornecedor.nome || '',
        razao_social: fornecedor.razao_social || '',
        cnpj: fornecedor.cnpj || '',
        email: fornecedor.email || '',
        telefone: fornecedor.telefone || '',
        celular: fornecedor.celular || '',
        endereco: fornecedor.endereco || '',
        bairro: fornecedor.bairro || '',
        cidade: fornecedor.cidade || '',
        estado: fornecedor.estado || '',
        cep: fornecedor.cep || '',
        site: fornecedor.site || '',
        observacoes: fornecedor.observacoes || ''
      });
    } else {
      setEditMode(false);
      setSelectedFornecedor(null);
      setFormData({
        nome: '',
        razao_social: '',
        cnpj: '',
        email: '',
        telefone: '',
        celular: '',
        endereco: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        site: '',
        observacoes: ''
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setSelectedFornecedor(null);
    setFormErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      if (editMode && selectedFornecedor) {
        await api.put(`/fornecedores/${selectedFornecedor.id}`, formData);
      } else {
        await api.post('/fornecedores', formData);
      }

      handleCloseDialog();
      loadFornecedores();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar fornecedor');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja desativar este fornecedor?')) return;

    try {
      setLoading(true);
      setError(null);
      await api.delete(`/fornecedores/${id}`);
      loadFornecedores();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao desativar fornecedor');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.post(`/fornecedores/${id}/reativar`);
      loadFornecedores();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao reativar fornecedor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Fornecedores
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gerencie seus fornecedores
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Pesquisar por nome, CNPJ ou razão social..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <Stack direction="row" spacing={2} sx={{ minWidth: { md: 'auto' } }}>
            <Button
              variant={showInactive ? 'contained' : 'outlined'}
              onClick={() => setShowInactive(!showInactive)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {showInactive ? 'Mostrar Ativos' : 'Mostrar Inativos'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Novo Fornecedor
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Razão Social</TableCell>
                <TableCell>CNPJ</TableCell>
                <TableCell>Contato</TableCell>
                <TableCell>Cidade/UF</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fornecedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Nenhum fornecedor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                fornecedores.map((fornecedor) => (
                  <TableRow key={fornecedor.id}>
                    <TableCell>
                      <Chip
                        label={fornecedor.ativo ? 'Ativo' : 'Inativo'}
                        color={fornecedor.ativo ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <BusinessIcon fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight="medium">
                          {fornecedor.nome}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{fornecedor.razao_social || '-'}</TableCell>
                    <TableCell>{fornecedor.cnpj || '-'}</TableCell>
                    <TableCell>
                      <Box>
                        {fornecedor.celular && (
                          <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
                            <PhoneIcon fontSize="small" />
                            {fornecedor.celular}
                          </Typography>
                        )}
                        {fornecedor.email && (
                          <Typography variant="body2" display="flex" alignItems="center" gap={0.5} color="text.secondary">
                            <EmailIcon fontSize="small" />
                            {fornecedor.email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {fornecedor.cidade && fornecedor.estado
                        ? `${fornecedor.cidade} / ${fornecedor.estado}`
                        : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(fornecedor)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {fornecedor.ativo ? (
                          <Tooltip title="Desativar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(fornecedor.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Reativar">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleReactivate(fornecedor.id)}
                            >
                              <RestoreIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editMode ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Nome *"
                value={formData.nome}
                onChange={(e) => handleFormChange('nome', e.target.value)}
                error={!!formErrors.nome}
                helperText={formErrors.nome}
              />
              <TextField
                fullWidth
                label="Razão Social"
                value={formData.razao_social}
                onChange={(e) => handleFormChange('razao_social', e.target.value)}
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="CNPJ"
                value={formData.cnpj}
                onChange={(e) => handleFormChange('cnpj', e.target.value)}
                error={!!formErrors.cnpj}
                helperText={formErrors.cnpj}
                inputProps={{ maxLength: 18 }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.telefone}
                onChange={(e) => handleFormChange('telefone', e.target.value)}
                inputProps={{ maxLength: 15 }}
              />
              <TextField
                fullWidth
                label="Celular"
                value={formData.celular}
                onChange={(e) => handleFormChange('celular', e.target.value)}
                inputProps={{ maxLength: 15 }}
              />
            </Stack>

            <TextField
              fullWidth
              label="Endereço"
              value={formData.endereco}
              onChange={(e) => handleFormChange('endereco', e.target.value)}
            />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Bairro"
                value={formData.bairro}
                onChange={(e) => handleFormChange('bairro', e.target.value)}
                sx={{ flex: 2 }}
              />
              <TextField
                fullWidth
                label="Cidade"
                value={formData.cidade}
                onChange={(e) => handleFormChange('cidade', e.target.value)}
                sx={{ flex: 2 }}
              />
              <TextField
                label="UF"
                value={formData.estado}
                onChange={(e) => handleFormChange('estado', e.target.value)}
                error={!!formErrors.estado}
                helperText={formErrors.estado}
                inputProps={{ maxLength: 2 }}
                sx={{ flex: 1, minWidth: 80 }}
              />
              <TextField
                label="CEP"
                value={formData.cep}
                onChange={(e) => handleFormChange('cep', e.target.value)}
                inputProps={{ maxLength: 9 }}
                sx={{ flex: 1, minWidth: 120 }}
              />
            </Stack>

            <TextField
              fullWidth
              label="Site"
              value={formData.site}
              onChange={(e) => handleFormChange('site', e.target.value)}
            />

            <TextField
              fullWidth
              label="Observações"
              multiline
              rows={3}
              value={formData.observacoes}
              onChange={(e) => handleFormChange('observacoes', e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FornecedoresList;
