import { useState, useEffect, useMemo, useDeferredValue } from 'react';
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
  Chip,
  MenuItem,
  FormControl,
  Select,
  Card,
  CardContent,
  Grid,
  Button,
  Stack,
  alpha,
  useTheme,
  useMediaQuery,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Checkbox,
  TableSortLabel,
  FormControlLabel,
  Switch
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
import { HistoryEdu as HistoryEduIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ProductModal from './ProductModal';
import { formatCurrency } from '../../utils/formatCurrency';
import { useProdutos } from '../../hooks/useProdutos';
import type { Produto } from '../../types/api';
import PageHeader from '../../components/Layout/PageHeader';
import SectionBlock from '../../components/Management/SectionBlock';
import KpiMetricCard from '../../components/Management/KpiMetricCard';
import OperationalNotice from '../../components/Management/OperationalNotice';
import EmptyStatePanel from '../../components/Management/EmptyStatePanel';
import userPreferencesService from '../../services/userPreferences';
import toast from 'react-hot-toast';

const STOCK_LAST_FILTERS_KEY = 'sosbeauty:stock:lastFilters';

interface StockFilterSnapshot {
  searchTerm: string;
  categoriaFiltro: string;
  marcaFiltro: string;
  stockFilter: 'all' | 'low' | 'out' | 'ok';
  promoFilter: boolean;
  sortBy: 'name' | 'brand' | 'category' | 'price' | 'stock';
  sortDirection: 'asc' | 'desc';
}

interface StockLayoutPrefs {
  rowsPerPage: number;
  denseRows: boolean;
  visibleColumns: {
    brand: boolean;
    category: boolean;
    price: boolean;
    stock: boolean;
    status: boolean;
  };
}

const Stock = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
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
  const [denseRows, setDenseRows] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [marcaFiltro, setMarcaFiltro] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'ok'>('all');
  const [promoFilter, setPromoFilter] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'brand' | 'category' | 'price' | 'stock'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<StockLayoutPrefs['visibleColumns']>({
    brand: true,
    category: true,
    price: true,
    stock: true,
    status: true,
  });
  const deferredSearchInput = useDeferredValue(searchInput);

  const getCurrentFilters = (): StockFilterSnapshot => ({
    searchTerm,
    categoriaFiltro,
    marcaFiltro,
    stockFilter,
    promoFilter,
    sortBy,
    sortDirection,
  });

  const getCurrentLayout = (): StockLayoutPrefs => ({
    rowsPerPage,
    denseRows,
    visibleColumns,
  });

  const applyFilters = (filters: StockFilterSnapshot) => {
    setSearchTerm(filters.searchTerm || '');
    setCategoriaFiltro(filters.categoriaFiltro || '');
    setMarcaFiltro(filters.marcaFiltro || '');
    setStockFilter(filters.stockFilter || 'all');
    setPromoFilter(!!filters.promoFilter);
    setSortBy(filters.sortBy || 'name');
    setSortDirection(filters.sortDirection || 'asc');
    setSearchInput(filters.searchTerm || '');
    setPage(0);
  };

  useEffect(() => {
    const loadInitialPrefs = async () => {
      try {
        const lastRaw = localStorage.getItem(STOCK_LAST_FILTERS_KEY);
        if (lastRaw) {
          const parsed = JSON.parse(lastRaw) as StockFilterSnapshot;
          applyFilters(parsed);
        }

        const serverPrefs = await userPreferencesService.getPreferences().catch(() => ({}));

        const serverStockPrefs = serverPrefs?.stock || {};

        if (serverStockPrefs.layout) {
          const layout = serverStockPrefs.layout as StockLayoutPrefs;
          setRowsPerPage(layout.rowsPerPage || 10);
          setDenseRows(!!layout.denseRows);
          if (layout.visibleColumns) {
            setVisibleColumns({
              brand: layout.visibleColumns.brand !== false,
              category: layout.visibleColumns.category !== false,
              price: layout.visibleColumns.price !== false,
              stock: layout.visibleColumns.stock !== false,
              status: layout.visibleColumns.status !== false,
            });
          }
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
    localStorage.setItem(STOCK_LAST_FILTERS_KEY, JSON.stringify(getCurrentFilters()));
  }, [searchTerm, categoriaFiltro, marcaFiltro, stockFilter, promoFilter, sortBy, sortDirection]);

  useEffect(() => {
    userPreferencesService.patchPreferences({
      stock: {
        layout: getCurrentLayout(),
      },
    }).catch(() => {});
  }, [rowsPerPage, denseRows, visibleColumns]);

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
    const totalSaleValue = produtos.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const totalCostValue = produtos.reduce((sum, p) => sum + ((p.cost ?? 0) * p.stock), 0);
    const lowStock = produtos.filter(p => p.stock > 0 && p.stock <= 10).length;
    const outOfStock = produtos.filter(p => p.stock === 0).length;
    const inPromo = produtos.filter(p =>
      p.promotional_price && p.promotional_price > 0 && p.promotional_price < p.price
    ).length;

    return { total, totalSaleValue, totalCostValue, lowStock, outOfStock, inPromo };
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
      toast.success('Produto atualizado com sucesso.');
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      toast.error('Não foi possível salvar o produto.');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deletarProduto(productId);
        setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
        toast.success('Produto removido com sucesso.');
      } catch (err) {
        console.error('Erro ao excluir produto:', err);
        toast.error('Não foi possível remover o produto.');
      }
    }
  };

  const handleSort = (column: 'name' | 'brand' | 'category' | 'price' | 'stock') => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortBy(column);
    setSortDirection('asc');
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedProductIds((prev) => (
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    ));
  };

  const togglePageSelection = () => {
    const pageIds = paginatedProducts.map((product) => product.id);
    const allSelected = pageIds.every((id) => selectedProductIds.includes(id));

    if (allSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !pageIds.includes(id)));
      return;
    }

    setSelectedProductIds((prev) => Array.from(new Set([...prev, ...pageIds])));
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    if (!window.confirm(`Deseja remover ${selectedProductIds.length} produto(s)?`)) return;

    let successCount = 0;
    for (const id of selectedProductIds) {
      try {
        await deletarProduto(id);
        successCount += 1;
      } catch {
        // Mantém fluxo mesmo com falhas pontuais
      }
    }

    setSelectedProductIds([]);

    if (successCount > 0) {
      toast.success(`${successCount} produto(s) removido(s).`);
    } else {
      toast.error('Não foi possível remover os produtos selecionados.');
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
    const filtered = produtos.filter(product => {
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

    return filtered.sort((a, b) => {
      const modifier = sortDirection === 'asc' ? 1 : -1;

      if (sortBy === 'price') {
        return (a.price - b.price) * modifier;
      }

      if (sortBy === 'stock') {
        return (a.stock - b.stock) * modifier;
      }

      const aValue = String((a as any)[sortBy] || '').toLowerCase();
      const bValue = String((b as any)[sortBy] || '').toLowerCase();

      return aValue.localeCompare(bValue) * modifier;
    });
  }, [produtos, searchTerm, categoriaFiltro, marcaFiltro, stockFilter, promoFilter, sortBy, sortDirection]);

  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  useEffect(() => {
    setSelectedProductIds((prev) => prev.filter((id) => filteredProducts.some((product) => product.id === id)));
  }, [filteredProducts]);

  const limparFiltros = () => {
    setSearchInput('');
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
          <PageHeader
            title="Estoque"
            subtitle="Gestão de produtos e inventário"
            icon={<InventoryIcon fontSize="small" />}
            actions={
              <Tooltip title="Atualizar estoque">
                <IconButton
                  onClick={refetch}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.18) }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            }
          />

          {/* Erros */}
          {error && (
            <OperationalNotice
              severity="error"
              title="Falha ao carregar estoque"
              message={error}
            />
          )}

          {/* KPIs */}
          <Grid container spacing={{ xs: 1.25, md: 3 }} mb={3}>
            <Grid item xs={6} sm={6} md={2}>
              <KpiMetricCard
                title="Total Produtos"
                value={kpis.total}
                subtitle="cadastrados"
                icon={<InventoryIcon sx={{ fontSize: { xs: 20, md: 24 } }} />}
                color={theme.palette.primary.main}
              />
            </Grid>

            <Grid item xs={6} sm={6} md={2}>
              <KpiMetricCard
                title="Valor Venda"
                value={formatCurrency(kpis.totalSaleValue)}
                subtitle="pelo preco de venda"
                icon={<TrendingUpIcon sx={{ fontSize: { xs: 20, md: 24 } }} />}
                color={theme.palette.success.main}
              />
            </Grid>

            <Grid item xs={6} sm={6} md={2}>
              <KpiMetricCard
                title="Valor Custo"
                value={formatCurrency(kpis.totalCostValue)}
                subtitle="pelo preco de custo"
                icon={<AttachMoneyIcon sx={{ fontSize: { xs: 20, md: 24 } }} />}
                color={theme.palette.info.main}
              />
            </Grid>

            <Grid item xs={6} sm={6} md={2}>
              <KpiMetricCard
                title="Estoque Baixo"
                value={kpis.lowStock}
                subtitle="produtos (<=10 un)"
                icon={<WarningIcon sx={{ fontSize: { xs: 20, md: 24 } }} />}
                color={theme.palette.warning.main}
                highlight={kpis.lowStock > 0 ? 'warning' : 'default'}
              />
            </Grid>

            <Grid item xs={6} sm={6} md={2}>
              <KpiMetricCard
                title="Esgotados"
                value={kpis.outOfStock}
                subtitle="sem estoque"
                icon={<TrendingDownIcon sx={{ fontSize: { xs: 20, md: 24 } }} />}
                color={theme.palette.error.main}
                highlight={kpis.outOfStock > 0 ? 'error' : 'default'}
              />
            </Grid>

            <Grid item xs={6} sm={6} md={2}>
              <KpiMetricCard
                title="Em Promocao"
                value={kpis.inPromo}
                subtitle="produtos"
                icon={<LocalOfferIcon sx={{ fontSize: { xs: 20, md: 24 } }} />}
                color={theme.palette.info.main}
              />
            </Grid>
          </Grid>

          <SectionBlock
            title="Filtros"
            icon={<FilterListIcon color="primary" fontSize="small" />}
            actions={
              <Typography variant="body2" color="text.secondary">
                {filteredProducts.length} itens filtrados
              </Typography>
            }
          >

              <Grid container spacing={{ xs: 1.5, md: 2 }}>
                {/* Busca */}
                <Grid item xs={12} md={4} sx={{ order: { xs: 1, md: 1 } }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={isMobile ? 'Buscar produto...' : 'Buscar produto, marca ou categoria...'}
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
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
                <Grid item xs={6} md={2} sx={{ order: { xs: 2, md: 2 } }}>
                  <FormControl fullWidth size="small">
                    <Select
                      displayEmpty
                      value={categoriaFiltro}
                      renderValue={(selected) => {
                        if (!selected) return 'Categoria';
                        return selected;
                      }}
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
                <Grid item xs={6} md={2} sx={{ order: { xs: 3, md: 3 } }}>
                  <FormControl fullWidth size="small">
                    <Select
                      displayEmpty
                      value={marcaFiltro}
                      renderValue={(selected) => {
                        if (!selected) return 'Marca';
                        return selected;
                      }}
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
                <Grid item xs={12} md={3} sx={{ order: { xs: 4, md: 4 } }}>
                  <ToggleButtonGroup
                    value={stockFilter}
                    exclusive
                    orientation={isMobile ? 'vertical' : 'horizontal'}
                    onChange={(_, newValue) => {
                      if (newValue !== null) {
                        setStockFilter(newValue);
                        setPage(0);
                      }
                    }}
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiToggleButton-root': {
                        textTransform: 'none',
                        py: isMobile ? 0.75 : 0.5,
                        whiteSpace: 'nowrap'
                      }
                    }}
                  >
                    <ToggleButton value="all">Todos</ToggleButton>
                    <ToggleButton value="ok">OK</ToggleButton>
                    <ToggleButton value="low">Baixo ({kpis.lowStock})</ToggleButton>
                    <ToggleButton value="out">Esgotado ({kpis.outOfStock})</ToggleButton>
                  </ToggleButtonGroup>
                </Grid>

                {/* Botão Limpar */}
                <Grid item xs={12} md={1} sx={{ order: { xs: 5, md: 5 } }}>
                  <Box display="flex" justifyContent={{ xs: 'flex-start', md: 'stretch' }}>
                    <Button
                      fullWidth={!isMobile}
                      variant="outlined"
                      onClick={limparFiltros}
                      startIcon={<ClearIcon />}
                      size="small"
                      sx={{ height: '40px', minWidth: { xs: 120, md: 'auto' } }}
                    >
                      Limpar
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              {/* Filtros Adicionais */}
              <Box mt={2} display="flex" gap={1} flexWrap="wrap" alignItems="center">
                <FormControlLabel
                  control={
                    <Switch
                      checked={denseRows}
                      onChange={(e) => setDenseRows(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Tabela compacta"
                />
                <Chip
                  label={visibleColumns.brand ? 'Marca on' : 'Marca off'}
                  onClick={() => setVisibleColumns((prev) => ({ ...prev, brand: !prev.brand }))}
                  variant={visibleColumns.brand ? 'filled' : 'outlined'}
                />
                <Chip
                  label={visibleColumns.category ? 'Categoria on' : 'Categoria off'}
                  onClick={() => setVisibleColumns((prev) => ({ ...prev, category: !prev.category }))}
                  variant={visibleColumns.category ? 'filled' : 'outlined'}
                />
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
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  disabled={selectedProductIds.length === 0}
                  onClick={handleBulkDelete}
                >
                  Excluir selecionados ({selectedProductIds.length})
                </Button>
              </Box>
          </SectionBlock>

          {/* Tabela Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <SectionBlock
              title="Produtos"
              actions={
                <Chip
                  label={`${filteredProducts.length} itens`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              }
              showHeaderDivider
              padding={0}
            >
              <TableContainer>
                <Table size={denseRows ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={paginatedProducts.length > 0 && paginatedProducts.every((product) => selectedProductIds.includes(product.id))}
                          indeterminate={paginatedProducts.some((product) => selectedProductIds.includes(product.id)) && !paginatedProducts.every((product) => selectedProductIds.includes(product.id))}
                          onChange={togglePageSelection}
                        />
                      </TableCell>
                      <TableCell>
                        <TableSortLabel active={sortBy === 'name'} direction={sortDirection} onClick={() => handleSort('name')}>
                          <strong>Produto</strong>
                        </TableSortLabel>
                      </TableCell>
                      {visibleColumns.brand && (
                        <TableCell>
                          <TableSortLabel active={sortBy === 'brand'} direction={sortDirection} onClick={() => handleSort('brand')}>
                            <strong>Marca</strong>
                          </TableSortLabel>
                        </TableCell>
                      )}
                      {visibleColumns.category && (
                        <TableCell>
                          <TableSortLabel active={sortBy === 'category'} direction={sortDirection} onClick={() => handleSort('category')}>
                            <strong>Categoria</strong>
                          </TableSortLabel>
                        </TableCell>
                      )}
                      {visibleColumns.price && (
                        <TableCell align="right">
                          <TableSortLabel active={sortBy === 'price'} direction={sortDirection} onClick={() => handleSort('price')}>
                            <strong>Preço</strong>
                          </TableSortLabel>
                        </TableCell>
                      )}
                      {visibleColumns.stock && (
                        <TableCell align="center">
                          <TableSortLabel active={sortBy === 'stock'} direction={sortDirection} onClick={() => handleSort('stock')}>
                            <strong>Estoque</strong>
                          </TableSortLabel>
                        </TableCell>
                      )}
                      {visibleColumns.status && <TableCell align="center"><strong>Status</strong></TableCell>}
                      <TableCell align="center"><strong>Ações</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <EmptyStatePanel
                            title="Nenhum produto encontrado"
                            subtitle="Revise os filtros aplicados para listar itens."
                            compact
                          />
                        </TableCell>
                      </TableRow>
                    ) : paginatedProducts.map((product) => {
                      const status = getStockStatus(product.stock);
                      const hasPromo = product.promotional_price && product.promotional_price > 0 && product.promotional_price < product.price;

                      return (
                        <TableRow key={product.id} hover selected={selectedProductIds.includes(product.id)}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              size="small"
                              checked={selectedProductIds.includes(product.id)}
                              onChange={() => toggleProductSelection(product.id)}
                            />
                          </TableCell>
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
                          {visibleColumns.brand && <TableCell>{product.brand || '-'}</TableCell>}
                          {visibleColumns.category && (
                            <TableCell>
                              <Chip
                                label={product.category || 'Sem categoria'}
                                size="small"
                                variant="outlined"
                                icon={<CategoryIcon />}
                              />
                            </TableCell>
                          )}
                          {visibleColumns.price && <TableCell align="right">
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
                          </TableCell>}
                          {visibleColumns.stock && <TableCell align="center">
                            <Typography variant="h6" fontWeight="bold">
                              {product.stock}
                            </Typography>
                          </TableCell>}
                          {visibleColumns.status && <TableCell align="center">
                            <Chip
                              label={status.label}
                              color={status.color}
                              size="small"
                              icon={status.icon}
                            />
                          </TableCell>}
                          <TableCell align="center">
                            <IconButton size="small" color="primary" onClick={() => handleProductClick(product)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <Tooltip title="Ver auditoria do produto">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => navigate(`/audit?entityType=produto&entityId=${product.id}`)}
                              >
                                <HistoryEduIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
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
            </SectionBlock>
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
                      <CardContent sx={{ p: 1.75 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.25} gap={1}>
                        <Box flex={1}>
                            <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: 1.25 }}>
                            {product.name}
                          </Typography>
                            <Box display="flex" gap={0.75} flexWrap="wrap" mt={0.75}>
                              {product.brand && <Chip label={product.brand} size="small" variant="outlined" />}
                              {product.category && <Chip label={product.category} size="small" variant="outlined" icon={<CategoryIcon />} />}
                            </Box>
                        </Box>
                        <Chip label={status.label} color={status.color} size="small" icon={status.icon} />
                      </Box>

                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.25}>
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
                        <Box display="flex" gap={0.75}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleProductClick(product)}
                            sx={{ border: 1, borderColor: 'primary.main', borderRadius: 1.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <Tooltip title="Ver auditoria do produto">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => navigate(`/audit?entityType=produto&entityId=${product.id}`)}
                              sx={{ border: 1, borderColor: 'info.main', borderRadius: 1.5 }}
                            >
                              <HistoryEduIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteProduct(product.id)}
                            sx={{ border: 1, borderColor: 'error.main', borderRadius: 1.5 }}
                          >
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
