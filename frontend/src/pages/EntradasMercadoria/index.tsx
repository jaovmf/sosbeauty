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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  Stack,
  Chip,
  useTheme,
  useMediaQuery
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
import OperationalNotice from '../../components/Management/OperationalNotice';
import EmptyStatePanel from '../../components/Management/EmptyStatePanel';

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
  quantidade: number | '';
  custo_unitario: number | '';
  custo_total: number;
}

interface NovoProdutoForm {
  name: string;
  brand: string;
  category: string;
  cost: string;
  price: string;
  stock: string;
  description: string;
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
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

  // Novo produto (cadastro rápido)
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [novoProduto, setNovoProduto] = useState<NovoProdutoForm>({
    name: '',
    brand: '',
    category: '',
    cost: '',
    price: '',
    stock: '',
    description: ''
  });
  const [novoProdutoErrors, setNovoProdutoErrors] = useState<Partial<NovoProdutoForm>>({});

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
      const lista = Array.isArray(data) ? data : [];
      setProdutos(lista);
      const categoriasUnicas = Array.from(
        new Set(lista.map((p: Produto) => p.category).filter(Boolean) as string[])
      ).sort((a, b) => a.localeCompare(b));
      const marcasUnicas = Array.from(
        new Set(lista.map((p: Produto) => p.brand).filter(Boolean) as string[])
      ).sort((a, b) => a.localeCompare(b));
      setCategorias(categoriasUnicas);
      setMarcas(marcasUnicas);
    } catch (err: any) {
      console.error('Erro ao carregar produtos:', err);
      setProdutos([]);
      setCategorias([]);
      setMarcas([]);
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
      const quantidadeRaw = field === 'quantidade' ? value : newItens[index].quantidade;
      const custoUnitarioRaw = field === 'custo_unitario' ? value : newItens[index].custo_unitario;
      const quantidade = quantidadeRaw === '' ? 0 : Number(quantidadeRaw);
      const custoUnitario = custoUnitarioRaw === '' ? 0 : Number(custoUnitarioRaw);
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
      const quantidade = item.quantidade === '' ? 0 : Number(item.quantidade);
      const custoUnitario = item.custo_unitario === '' ? 0 : Number(item.custo_unitario);

      if (!Number.isFinite(quantidade) || quantidade <= 0) {
        setError('Quantidade deve ser maior que zero');
        return false;
      }
      if (!Number.isFinite(custoUnitario) || custoUnitario < 0) {
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
          quantidade: item.quantidade === '' ? 0 : Number(item.quantidade),
          custo_unitario: item.custo_unitario === '' ? 0 : Number(item.custo_unitario)
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

  const handleNovoProdutoChange = (field: keyof NovoProdutoForm, value: string) => {
    setNovoProduto((prev) => ({ ...prev, [field]: value }));
    if (novoProdutoErrors[field]) {
      setNovoProdutoErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const resetNovoProduto = () => {
    setNovoProduto({
      name: '',
      brand: '',
      category: '',
      cost: '',
      price: '',
      stock: '',
      description: ''
    });
    setNovoProdutoErrors({});
  };

  const validateNovoProduto = () => {
    const errors: Partial<NovoProdutoForm> = {};

    if (!novoProduto.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (!novoProduto.brand.trim()) {
      errors.brand = 'Marca é obrigatória';
    }

    if (!novoProduto.category.trim()) {
      errors.category = 'Categoria é obrigatória';
    }

    const cost = parseFloat(novoProduto.cost || '0');
    if (Number.isNaN(cost) || cost < 0) {
      errors.cost = 'Custo deve ser maior ou igual a zero';
    }

    const price = parseFloat(novoProduto.price || '0');
    if (Number.isNaN(price) || price <= 0) {
      errors.price = 'Preço deve ser maior que zero';
    }

    if (!Number.isNaN(cost) && !Number.isNaN(price) && cost >= price) {
      errors.price = 'Preço deve ser maior que o custo';
    }



    setNovoProdutoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSalvarNovoProduto = async () => {
    if (!validateNovoProduto()) {
      return;
    }

    try {
      setSavingProduct(true);

      const stockValue = novoProduto.stock === '' ? 0 : parseInt(novoProduto.stock, 10);
      const payload = {
        name: novoProduto.name.trim(),
        brand: novoProduto.brand.trim(),
        category: novoProduto.category.trim(),
        cost: parseFloat(novoProduto.cost || '0'),
        price: parseFloat(novoProduto.price),
        stock: stockValue,
        description: novoProduto.description.trim() || undefined
      };

      const response = await api.post('/produtos', payload);
      const created = response.data;

      await loadProdutos();

      const createdProduct = {
        id: created.id,
        name: created.name,
        brand: created.brand,
        cost: created.cost,
        price: created.price,
        stock: created.stock
      } as Produto;

      const itemSemProdutoIndex = itens.findIndex((item) => !item.produto);
      if (itemSemProdutoIndex >= 0) {
        handleItemChange(itemSemProdutoIndex, 'produto', createdProduct);
        handleItemChange(itemSemProdutoIndex, 'custo_unitario', createdProduct.cost || 0);
      }

      setSuccess('Produto cadastrado com sucesso! Agora você pode usá-lo na entrada.');
      setProductModalOpen(false);
      resetNovoProduto();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao cadastrar produto');
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, pb: { xs: 10, md: 4 } }}>
      <Box
        mb={{ xs: 2.5, md: 4 }}
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={{ xs: 1.5, sm: 2 }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.125rem' } }}>
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
          sx={{ alignSelf: { xs: 'flex-end', sm: 'auto' } }}
        >
          Ver Histórico
        </Button>
      </Box>

      {error && (
        <OperationalNotice
          severity="error"
          title="Falha ao processar entrada"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {success && (
        <OperationalNotice
          severity="success"
          title="Operação concluída"
          message={success}
          onClose={() => setSuccess(null)}
        />
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          alignItems: 'start'
        }}
      >
        {/* Informações da Entrada */}
        <Box>
          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Informações da Entrada
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }
              }}
            >
              <Autocomplete
                fullWidth
                disablePortal
                value={fornecedorSelecionado}
                onChange={(_, newValue) => setFornecedorSelecionado(newValue)}
                options={fornecedores}
                getOptionLabel={(option) => option.nome}
                sx={{ width: '100%' }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Fornecedor *"
                    placeholder="Selecione o fornecedor"
                    size={isMobile ? 'small' : 'medium'}
                    fullWidth
                  />
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

              <TextField
                fullWidth
                label="Número da Nota"
                value={numeroNota}
                onChange={(e) => setNumeroNota(e.target.value)}
              />

              <TextField
                fullWidth
                type="date"
                label="Data da Entrada"
                value={dataEntrada}
                onChange={(e) => setDataEntrada(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Observações"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
              />
            </Box>
          </Paper>

          {/* Items da Entrada */}
          <Paper sx={{ p: { xs: 2, md: 3 }, mt: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', md: 'center' }}
              flexDirection={{ xs: 'column', md: 'row' }}
              gap={{ xs: 1.5, md: 1 }}
              mb={2}
            >
              <Typography variant="h6" fontWeight="bold">
                Produtos
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setProductModalOpen(true)}
                  fullWidth={isMobile}
                >
                  Cadastrar Produto
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  fullWidth={isMobile}
                >
                  Adicionar Item
                </Button>
              </Stack>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {itens.length === 0 ? (
              <EmptyStatePanel
                title="Nenhum item adicionado"
                subtitle="Clique em 'Adicionar Item' para começar."
                icon={<ShoppingCartIcon sx={{ fontSize: 60 }} />}
              />
            ) : (
              <>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
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
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              handleItemChange(index, 'quantidade', nextValue === '' ? '' : Number(nextValue));
                            }}
                            inputProps={{ min: 1, step: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.custo_unitario}
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              handleItemChange(index, 'custo_unitario', nextValue === '' ? '' : Number(nextValue));
                            }}
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
              </Box>

              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Stack spacing={1.5}>
                  {itens.map((item, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Item {index + 1}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <Stack spacing={1.25}>
                        <Autocomplete
                          value={item.produto}
                          onChange={(_, newValue) => handleItemChange(index, 'produto', newValue)}
                          options={produtos}
                          getOptionLabel={(option) => `${option.name}${option.brand ? ` - ${option.brand}` : ''}`}
                          renderInput={(params) => (
                            <TextField {...params} size="small" label="Produto" placeholder="Selecione um produto" />
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

                        <Stack direction="row" spacing={1}>
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Quantidade"
                            value={item.quantidade}
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              handleItemChange(index, 'quantidade', nextValue === '' ? '' : Number(nextValue));
                            }}
                            inputProps={{ min: 1, step: 1 }}
                          />
                          <TextField
                            fullWidth
                            size="small"
                            type="number"
                            label="Custo Unit."
                            value={item.custo_unitario}
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              handleItemChange(index, 'custo_unitario', nextValue === '' ? '' : Number(nextValue));
                            }}
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </Stack>

                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="text.secondary">Total do item</Typography>
                          <Typography variant="subtitle1" fontWeight={700} color="primary">
                            {formatCurrency(item.custo_total)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
              </>
            )}
          </Paper>
        </Box>

        {/* Resumo */}
        <Box>
          <Card
            sx={{
              display: 'block',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              position: { xs: 'static', md: 'sticky' },
              top: 24
            }}
          >
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
                    {itens.reduce((sum, item) => sum + (item.quantidade === '' ? 0 : Number(item.quantidade)), 0)}
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
        </Box>
      </Box>

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
                        <EmptyStatePanel
                          title="Nenhuma entrada encontrada"
                          subtitle="Registre uma entrada para visualizar o histórico."
                          compact
                        />
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

      <Dialog open={productModalOpen} onClose={() => setProductModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cadastrar Produto na Entrada</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome do produto *"
                value={novoProduto.name}
                onChange={(e) => handleNovoProdutoChange('name', e.target.value)}
                error={!!novoProdutoErrors.name}
                helperText={novoProdutoErrors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={marcas}
                value={novoProduto.brand}
                onChange={(_, newValue) => handleNovoProdutoChange('brand', typeof newValue === 'string' ? newValue : '')}
                onInputChange={(_, newInputValue) => handleNovoProdutoChange('brand', newInputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Marca *"
                    error={!!novoProdutoErrors.brand}
                    helperText={novoProdutoErrors.brand || 'Selecione uma marca existente ou digite uma nova'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                freeSolo
                options={categorias}
                value={novoProduto.category}
                onChange={(_, newValue) => handleNovoProdutoChange('category', typeof newValue === 'string' ? newValue : '')}
                onInputChange={(_, newInputValue) => handleNovoProdutoChange('category', newInputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Categoria *"
                    error={!!novoProdutoErrors.category}
                    helperText={novoProdutoErrors.category || 'Selecione uma categoria existente ou digite uma nova'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Custo"
                value={novoProduto.cost}
                onChange={(e) => handleNovoProdutoChange('cost', e.target.value)}
                error={!!novoProdutoErrors.cost}
                helperText={novoProdutoErrors.cost}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Preço de venda *"
                value={novoProduto.price}
                onChange={(e) => handleNovoProdutoChange('price', e.target.value)}
                error={!!novoProdutoErrors.price}
                helperText={novoProdutoErrors.price}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Estoque inicial"
                value={novoProduto.stock}
                onChange={(e) => handleNovoProdutoChange('stock', e.target.value)}
                error={!!novoProdutoErrors.stock}
                helperText={novoProdutoErrors.stock || 'Opcional (padrão 0)'}
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Descrição (opcional)"
                value={novoProduto.description}
                onChange={(e) => handleNovoProdutoChange('description', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setProductModalOpen(false); resetNovoProduto(); }} disabled={savingProduct}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSalvarNovoProduto} disabled={savingProduct}>
            {savingProduct ? 'Salvando...' : 'Salvar Produto'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EntradasMercadoria;
