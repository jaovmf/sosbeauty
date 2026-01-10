import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import api from '../../lib/api';
import { formatCurrency } from '../../utils/formatCurrency';

interface Produto {
  id: string;
  name: string;
  brand?: string;
  cost?: number;
  price: number;
  stock: number;
}

interface Fornecedor {
  id: string;
  nome: string;
  razao_social?: string;
  ativo: boolean;
}

interface ItemEntrada {
  produto: Produto | null;
  quantidade: number;
  custo_unitario: number;
  custo_total: number;
}

interface EntradaMercadoria {
  id: string;
  numero_nota?: string;
  fornecedor_id: {
    id: string;
    nome: string;
    razao_social?: string;
  };
  data_entrada: string;
  itens: Array<{
    produto_id: {
      id: string;
      name: string;
      brand?: string;
    };
    quantidade: number;
    custo_unitario: number;
    custo_total: number;
  }>;
  custo_total: number;
  observacoes?: string;
  usuario_id: {
    name: string;
  };
  createdAt: string;
}

const EntradasMercadoria = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<Fornecedor | null>(null);
  const [numeroNota, setNumeroNota] = useState('');
  const [dataEntrada, setDataEntrada] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<ItemEntrada[]>([]);

  // History dialog
  const [historyOpen, setHistoryOpen] = useState(false);
  const [entradas, setEntradas] = useState<EntradaMercadoria[]>([]);

  useEffect(() => {
    loadFornecedores();
    loadProdutos();
  }, []);

  const loadFornecedores = async () => {
    try {
      const response = await api.get('/fornecedores?ativo=true');
      const data = response.data.fornecedores || response.data;
      setFornecedores(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Erro ao carregar fornecedores:', err);
      setFornecedores([]);
    }
  };

  const loadProdutos = async () => {
    try {
      const response = await api.get('/produtos?ativo=true');
      const data = response.data.produtos || response.data;
      setProdutos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Erro ao carregar produtos:', err);
      setProdutos([]);
    }
  };

  const loadEntradas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/entradas?limit=20');
      setEntradas(response.data);
    } catch (err: any) {
      setError('Erro ao carregar histórico de entradas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setItens([...itens, {
      produto: null,
      quantidade: 1,
      custo_unitario: 0,
      custo_total: 0
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemEntrada, value: any) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };

    // Recalcular custo total do item
    if (field === 'quantidade' || field === 'custo_unitario') {
      const quantidade = field === 'quantidade' ? value : newItens[index].quantidade;
      const custoUnitario = field === 'custo_unitario' ? value : newItens[index].custo_unitario;
      newItens[index].custo_total = quantidade * custoUnitario;
    }

    setItens(newItens);
  };

  const calcularTotal = () => {
    return itens.reduce((sum, item) => sum + item.custo_total, 0);
  };

  const validateForm = (): boolean => {
    if (!fornecedorSelecionado) {
      setError('Selecione um fornecedor');
      return false;
    }

    if (itens.length === 0) {
      setError('Adicione pelo menos um item');
      return false;
    }

    for (const item of itens) {
      if (!item.produto) {
        setError('Selecione um produto para todos os itens');
        return false;
      }
      if (item.quantidade <= 0) {
        setError('Quantidade deve ser maior que zero');
        return false;
      }
      if (item.custo_unitario < 0) {
        setError('Custo unitário inválido');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        numero_nota: numeroNota.trim() || undefined,
        fornecedor_id: fornecedorSelecionado!.id,
        data_entrada: dataEntrada,
        itens: itens.map(item => ({
          produto_id: item.produto!.id,
          quantidade: item.quantidade,
          custo_unitario: item.custo_unitario
        })),
        observacoes: observacoes.trim() || undefined
      };

      await api.post('/entradas', payload);

      setSuccess('Entrada de mercadoria registrada com sucesso!');

      // Limpar formulário
      setFornecedorSelecionado(null);
      setNumeroNota('');
      setDataEntrada(new Date().toISOString().split('T')[0]);
      setObservacoes('');
      setItens([]);

      // Recarregar produtos para atualizar estoque
      loadProdutos();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao registrar entrada de mercadoria');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistory = () => {
    loadEntradas();
    setHistoryOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Entrada de Mercadorias
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Registre a entrada de produtos no estoque
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={handleOpenHistory}
        >
          Ver Histórico
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Informações da Entrada */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Informações da Entrada
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  value={fornecedorSelecionado}
                  onChange={(_, newValue) => setFornecedorSelecionado(newValue)}
                  options={fornecedores}
                  getOptionLabel={(option) => option.nome}
                  renderInput={(params) => (
                    <TextField {...params} label="Fornecedor *" fullWidth />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body2">{option.nome}</Typography>
                        {option.razao_social && (
                          <Typography variant="caption" color="text.secondary">
                            {option.razao_social}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Número da Nota"
                  value={numeroNota}
                  onChange={(e) => setNumeroNota(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data da Entrada"
                  value={dataEntrada}
                  onChange={(e) => setDataEntrada(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Observações"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Items da Entrada */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Produtos
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
              >
                Adicionar Item
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {itens.length === 0 ? (
              <Box textAlign="center" py={4}>
                <ShoppingCartIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  Nenhum item adicionado. Clique em "Adicionar Item" para começar.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell width="40%">Produto</TableCell>
                      <TableCell width="15%">Quantidade</TableCell>
                      <TableCell width="20%">Custo Unitário</TableCell>
                      <TableCell width="20%">Custo Total</TableCell>
                      <TableCell width="5%"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itens.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Autocomplete
                            value={item.produto}
                            onChange={(_, newValue) => handleItemChange(index, 'produto', newValue)}
                            options={produtos}
                            getOptionLabel={(option) => `${option.name}${option.brand ? ` - ${option.brand}` : ''}`}
                            renderInput={(params) => (
                              <TextField {...params} size="small" placeholder="Selecione um produto" />
                            )}
                            renderOption={(props, option) => (
                              <li {...props}>
                                <Box>
                                  <Typography variant="body2">{option.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Estoque atual: {option.stock} | Custo: {formatCurrency(option.cost || 0)}
                                  </Typography>
                                </Box>
                              </li>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantidade}
                            onChange={(e) => handleItemChange(index, 'quantidade', Number(e.target.value))}
                            inputProps={{ min: 1, step: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.custo_unitario}
                            onChange={(e) => handleItemChange(index, 'custo_unitario', Number(e.target.value))}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(item.custo_total)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Resumo */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 24 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Resumo
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Fornecedor:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {fornecedorSelecionado?.nome || '-'}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Total de Itens:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {itens.length}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Quantidade Total:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {itens.reduce((sum, item) => sum + item.quantidade, 0)}
                  </Typography>
                </Box>

                <Divider />

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight="bold">
                    Custo Total:
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    {formatCurrency(calcularTotal())}
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={loading || itens.length === 0}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Salvando...' : 'Registrar Entrada'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Histórico Dialog */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Histórico de Entradas</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Data</TableCell>
                    <TableCell>Fornecedor</TableCell>
                    <TableCell>Nota</TableCell>
                    <TableCell>Itens</TableCell>
                    <TableCell>Custo Total</TableCell>
                    <TableCell>Usuário</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Nenhuma entrada encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    entradas.map((entrada) => (
                      <TableRow key={entrada.id}>
                        <TableCell>
                          {new Date(entrada.data_entrada).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>{entrada.fornecedor_id.nome}</TableCell>
                        <TableCell>{entrada.numero_nota || '-'}</TableCell>
                        <TableCell>
                          <Chip label={`${entrada.itens.length} item(s)`} size="small" />
                        </TableCell>
                        <TableCell>{formatCurrency(entrada.custo_total)}</TableCell>
                        <TableCell>{entrada.usuario_id.name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EntradasMercadoria;
