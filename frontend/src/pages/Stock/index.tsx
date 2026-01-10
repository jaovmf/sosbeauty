import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Container,
  TablePagination,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  Grid,
  Button,
  Stack,
  alpha,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Category as CategoryIcon,
  LocalOffer as LocalOfferIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import ProductModal from './ProductModal';
import { formatCurrency } from '../../utils/formatCurrency';
import { useProdutos } from '../../hooks/useProdutos';
import type { Produto } from '../../types/api';

const Stock = () => {
  const theme = useTheme();
  const {
    produtos,
    loading,
    error,
    refetch,
    atualizarProduto,
    atualizarProdutoComImagem,
    deletarProduto,
    consultarEstoque
  } = useProdutos();

  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'ok'>('all');
  const [promoFilter, setPromoFilter] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);

  useEffect(() => {
    if (produtos.length > 0) {
      const categoriasUnicas = Array.from(
        new Set(produtos.map(p => p.category).filter(Boolean) as string[])
      ).sort();
      setCategorias(categoriasUnicas);

      const marcasUnicas = Array.from(
        new Set(produtos.map(p => p.brand).filter(Boolean) as string[])
      ).sort();
      setMarcas(marcasUnicas);
    }
  }, [produtos]);

  // KPIs calculados
  const kpis = useMemo(() => {
    const total = produtos.length;
    const totalValue = produtos.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const lowStock = produtos.filter(p => p.stock > 0 && p.stock <= 10).length;
    const outOfStock = produtos.filter(p => p.stock === 0).length;
    const inPromo = produtos.filter(p =>
      p.promotional_price && p.promotional_price > 0 && p.promotional_price < p.price
    ).length;
    const avgStockValue = total > 0 ? totalValue / total : 0;

    return { total, totalValue, lowStock, outOfStock, inPromo, avgStockValue };
  }, [produtos]);

  const handleProductClick = (product: Produto) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const handleSaveProduct = async (updatedProduct: any) => {
    try {
      if (updatedProduct.id) {
        if (updatedProduct.formData && updatedProduct.formData instanceof FormData) {
          await atualizarProdutoComImagem(updatedProduct.id, updatedProduct.formData);
        } else {
          await atualizarProduto(updatedProduct.id, updatedProduct);
        }
      }
      handleCloseModal();
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deletarProduto(productId);
      } catch (err) {
        console.error('Erro ao excluir produto:', err);
      }
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredProducts = useMemo(() => {
    return produtos.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategoria = !categoriaFiltro || product.category === categoriaFiltro;
      const matchesMarca = !marcaFiltro || product.brand === marcaFiltro;

      const matchesStock =
        stockFilter === 'all' ? true :
        stockFilter === 'low' ? (product.stock > 0 && product.stock <= 10) :
        stockFilter === 'out' ? product.stock === 0 :
        product.stock > 10;

      const matchesPromo = !promoFilter ||
        (product.promotional_price && product.promotional_price > 0 && product.promotional_price < product.price);

      return matchesSearch && matchesCategoria && matchesMarca && matchesStock && matchesPromo;
    });
  }, [produtos, searchTerm, categoriaFiltro, marcaFiltro, stockFilter, promoFilter]);

  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const limparFiltros = () => {
    setSearchTerm('');
    setCategoriaFiltro('');
    setMarcaFiltro('');
    setStockFilter('all');
    setPromoFilter(false);
    setPage(0);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Esgotado', color: 'error' as const, icon: <WarningIcon /> };
    if (stock <= 10) return { label: 'Baixo', color: 'warning' as const, icon: <WarningIcon /> };
    return { label: 'OK', color: 'success' as const, icon: <CheckCircleIcon /> };
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box padding={3} display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Box textAlign="center">
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Carregando produtos...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="xl" sx={{ pb: { xs: 10, md: 3 }, px: { xs: 1, sm: 2, md: 3 } }}>
        <Box>
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <InventoryIcon sx={{ fontSize: { xs: 28, md: 32 }, color: 'primary.main' }} />
              <Box>
                <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                  Estoque
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Gestão de produtos e inventário
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Atualizar">
              <IconButton
                onClick={refetch}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Erros */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* KPIs */}
          <Grid container spacing={{ xs: 1.5, md: 3 }} mb={3}>
            <Grid item xs={6} sm={6} md={2.4}>
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      Total Produtos
                    </Typography>
                    <InventoryIcon sx={{ fontSize: { xs: 20, md: 24 }, color: 'primary.main', opacity: 0.7 }} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                    {kpis.total}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    cadastrados
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={6} md={2.4}>
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      Valor Total
                    </Typography>
                    <AttachMoneyIcon sx={{ fontSize: { xs: 20, md: 24 }, color: 'success.main', opacity: 0.7 }} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold" color="success.main" sx={{ fontSize: { xs: '1.1rem', md: '1.5rem' } }}>
                    {formatCurrency(kpis.totalValue)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    em estoque
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={6} md={2.4}>
              <Card
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: kpis.lowStock > 0 ? 'warning.main' : 'divider',
                  borderRadius: 2,
                  bgcolor: kpis.lowStock > 0 ? alpha(theme.palette.warning.main, 0.05) : 'background.paper'
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      Estoque Baixo
                    </Typography>
                    <WarningIcon sx={{ fontSize: { xs: 20, md: 24 }, color: 'warning.main', opacity: 0.7 }} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold" color="warning.main" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                    {kpis.lowStock}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    produtos (≤10 un)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={6} md={2.4}>
              <Card
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: kpis.outOfStock > 0 ? 'error.main' : 'divider',
                  borderRadius: 2,
                  bgcolor: kpis.outOfStock > 0 ? alpha(theme.palette.error.main, 0.05) : 'background.paper'
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      Esgotados
                    </Typography>
                    <TrendingDownIcon sx={{ fontSize: { xs: 20, md: 24 }, color: 'error.main', opacity: 0.7 }} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold" color="error.main" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                    {kpis.outOfStock}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    sem estoque
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={6} md={2.4}>
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      Em Promoção
                    </Typography>
                    <LocalOfferIcon sx={{ fontSize: { xs: 20, md: 24 }, color: 'info.main', opacity: 0.7 }} />
                  </Box>
                  <Typography variant="h5" fontWeight="bold" color="info.main" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                    {kpis.inPromo}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    produtos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filtros */}
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <FilterListIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Filtros
                </Typography>
              </Box>

              <Grid container spacing={2}>
                {/* Busca */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar produto, marca ou categoria..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(0);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                {/* Categoria */}
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      value={categoriaFiltro}
                      label="Categoria"
                      onChange={(e) => {
                        setCategoriaFiltro(e.target.value);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {categorias.map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Marca */}
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Marca</InputLabel>
                    <Select
                      value={marcaFiltro}
                      label="Marca"
                      onChange={(e) => {
                        setMarcaFiltro(e.target.value);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {marcas.map((marca) => (
                        <MenuItem key={marca} value={marca}>{marca}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Status do Estoque */}
                <Grid item xs={12} md={3}>
                  <ToggleButtonGroup
                    value={stockFilter}
                    exclusive
                    onChange={(_, newValue) => {
                      if (newValue !== null) {
                        setStockFilter(newValue);
                        setPage(0);
                      }
                    }}
                    size="small"
                    fullWidth
                  >
                    <ToggleButton value="all">Todos</ToggleButton>
                    <ToggleButton value="ok">OK</ToggleButton>
                    <ToggleButton value="low">
                      <Badge badgeContent={kpis.lowStock} color="warning" max={99}>
                        Baixo
                      </Badge>
                    </ToggleButton>
                    <ToggleButton value="out">
                      <Badge badgeContent={kpis.outOfStock} color="error" max={99}>
                        Esgot.
                      </Badge>
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Grid>

                {/* Botão Limpar */}
                <Grid item xs={12} md={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={limparFiltros}
                    startIcon={<ClearIcon />}
                    size="small"
                    sx={{ height: '40px' }}
                  >
                    Limpar
                  </Button>
                </Grid>
              </Grid>

              {/* Filtros Adicionais */}
              <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                <Chip
                  label="Em Promoção"
                  color={promoFilter ? 'primary' : 'default'}
                  onClick={() => {
                    setPromoFilter(!promoFilter);
                    setPage(0);
                  }}
                  icon={<LocalOfferIcon />}
                  variant={promoFilter ? 'filled' : 'outlined'}
                />
                <Chip
                  label={`${filteredProducts.length} produtos encontrados`}
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Tabela Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Produto</strong></TableCell>
                    <TableCell><strong>Marca</strong></TableCell>
                    <TableCell><strong>Categoria</strong></TableCell>
                    <TableCell align="right"><strong>Preço</strong></TableCell>
                    <TableCell align="center"><strong>Estoque</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                    <TableCell align="center"><strong>Ações</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProducts.map((product) => {
                    const status = getStockStatus(product.stock);
                    const hasPromo = product.promotional_price && product.promotional_price > 0 && product.promotional_price < product.price;

                    return (
                      <TableRow key={product.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {product.name}
                            </Typography>
                            {hasPromo && (
                              <Chip label="PROMOÇÃO" size="small" color="error" sx={{ mt: 0.5, height: 20 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{product.brand || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={product.category || 'Sem categoria'}
                            size="small"
                            variant="outlined"
                            icon={<CategoryIcon />}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {hasPromo ? (
                            <Box>
                              <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary', display: 'block' }}>
                                {formatCurrency(product.price)}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" color="error.main">
                                {formatCurrency(product.promotional_price!)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" fontWeight={500}>
                              {formatCurrency(product.price)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="h6" fontWeight="bold">
                            {product.stock}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={status.label}
                            color={status.color}
                            size="small"
                            icon={status.icon}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" color="primary" onClick={() => handleProductClick(product)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteProduct(product.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filteredProducts.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Linhas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </TableContainer>
          </Box>

          {/* Cards Mobile */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Stack spacing={1.5}>
              {paginatedProducts.map((product) => {
                const status = getStockStatus(product.stock);
                const hasPromo = product.promotional_price && product.promotional_price > 0 && product.promotional_price < product.price;

                return (
                  <Card
                    key={product.id}
                    elevation={0}
                    sx={{
                      border: 1,
                      borderColor: status.color === 'error' ? 'error.main' :
                                  status.color === 'warning' ? 'warning.main' : 'divider',
                      borderRadius: 2,
                      bgcolor: status.color === 'error' ? alpha(theme.palette.error.main, 0.02) :
                              status.color === 'warning' ? alpha(theme.palette.warning.main, 0.02) : 'background.paper'
                    }}
                  >
                    <CardContent sx={{ p: 1.5 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            {product.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.brand} • {product.category}
                          </Typography>
                        </Box>
                        <Chip label={status.label} color={status.color} size="small" icon={status.icon} />
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.5}>
                        <Box>
                          {hasPromo ? (
                            <Box>
                              <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                                {formatCurrency(product.price)}
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" color="error.main">
                                {formatCurrency(product.promotional_price!)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="h6" fontWeight="bold">
                              {formatCurrency(product.price)}
                            </Typography>
                          )}
                        </Box>
                        <Box textAlign="center">
                          <Typography variant="caption" color="text.secondary">Estoque</Typography>
                          <Typography variant="h6" fontWeight="bold">{product.stock}</Typography>
                        </Box>
                        <Box>
                          <IconButton size="small" color="primary" onClick={() => handleProductClick(product)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteProduct(product.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>

            <TablePagination
              component="div"
              count={filteredProducts.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              sx={{ borderTop: 1, borderColor: 'divider', mt: 2 }}
            />
          </Box>
        </Box>
      </Container>

      <ProductModal
        open={modalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
        onSave={handleSaveProduct}
      />
    </>
  );
};

export default Stock;
