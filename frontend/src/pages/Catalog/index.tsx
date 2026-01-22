import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Fade,
  Stack,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Storefront as StorefrontIcon
} from '@mui/icons-material';
import ProductCard from '../../components/ProductCard';
import CatalogHeader from '../../components/Layout/CatalogHeader';
import Cart from '../../components/Cart';
import CartButton from '../../components/Cart/CartButton';
import { useCatalogo } from '../../hooks/useProdutos';

const Catalog = () => {
  const { produtos, loading, error } = useCatalogo();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [promocionalFiltro, setPromocionalFiltro] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);

  useEffect(() => {
    if (produtos.length > 0) {
      const categoriasUnicas = Array.from(
        new Set(produtos.map(p => p.category).filter(Boolean) as string[])
      ).sort();
      setCategorias(categoriasUnicas);
    }
  }, [produtos]);

  const filteredProducts = produtos.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !categoriaFiltro || product.category === categoriaFiltro;

    const matchesPromotion = !promocionalFiltro ||
      (product.promotional_price && product.promotional_price > 0 && product.promotional_price < product.price);

    return matchesSearch && matchesCategory && matchesPromotion && product.stock > 0;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setCategoriaFiltro('');
    setPromocionalFiltro(false);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'grey.50' }}>
        <CatalogHeader/>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 80px)">
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={60} sx={{ color: '#ba8fee' }} />
            <Typography variant="h6" color="text.secondary">
              Carregando catálogo...
            </Typography>
          </Stack>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'grey.50' }}>
      <CatalogHeader/>

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
        <Box textAlign="center" mb={{ xs: 3, md: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              background: 'linear-gradient(45deg, #ba8fee 30%, #e1c5ff 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            Nossos Produtos
          </Typography>
          <Divider sx={{ maxWidth: 200, mx: 'auto', borderColor: '#ba8fee' }} />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3 },
            mb: { xs: 3, md: 4 },
            borderRadius: 3,
            background: 'linear-gradient(135deg, #fff 0%, #fafafa 100%)',
            border: '1px solid rgba(186, 143, 238, 0.1)'
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FilterIcon sx={{ color: '#ba8fee' }} />
              <Typography variant="h6" fontWeight={600}>
                Filtros
              </Typography>
            </Stack>
            <Chip
              icon={<StorefrontIcon />}
              label={`${filteredProducts.length} produtos`}
              sx={{
                backgroundColor: '#ba8fee',
                color: 'white',
                fontWeight: 500
              }}
            />
          </Stack>

          <Grid container spacing={{ xs: 2, md: 3 }} alignItems="end">
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                placeholder="Buscar produtos, marcas ou descrições..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#ba8fee' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ba8fee'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ba8fee'
                    }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ '&.Mui-focused': { color: '#ba8fee' } }}>
                  Categoria
                </InputLabel>
                <Select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  label="Categoria"
                  sx={{
                    borderRadius: 2,
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ba8fee'
                    },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#ba8fee'
                    },
                    fontSize: '1rem',
                    minHeight: '56px',
                    height: '56px',
                    width: '100%',
                    minWidth: '110px',
                    '& .MuiSelect-select': {
                      fontSize: '1rem',
                      padding: '16px 14px',
                      width: '100%',
                      minWidth: '110px'
                    },
                    '& .MuiOutlinedInput-root': {
                      fontSize: '1rem',
                      width: '100%',
                      minWidth: '110px'
                    },
                    '& fieldset': {
                      minWidth: '110px'
                    }
                  }}
                >
                  <MenuItem value="">Todas as categorias</MenuItem>
                  {categorias.map(categoria => (
                    <MenuItem key={categoria} value={categoria}>
                      {categoria}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={promocionalFiltro}
                    onChange={(e) => setPromocionalFiltro(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#ff5252',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#ff5252',
                      },
                    }}
                  />
                }
                label="Só promoções"
                sx={{
                  height: '56px',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: promocionalFiltro ? 'rgba(255, 82, 82, 0.1)' : 'transparent',
                  borderRadius: 2,
                  padding: '0 16px',
                  border: promocionalFiltro ? '1px solid #ff5252' : '1px solid transparent'
                }}
              />
            </Grid>

            <Grid item xs={12} md={1}>
              {(searchTerm || categoriaFiltro || promocionalFiltro) && (
                <Chip
                  label="Limpar"
                  onClick={clearFilters}
                  onDelete={clearFilters}
                  color="secondary"
                  sx={{
                    width: '100%',
                    cursor: 'pointer',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'secondary.dark'
                    }
                  }}
                />
              )}
            </Grid>
          </Grid>
        </Paper>

        {filteredProducts.length > 0 ? (
          <Fade in={true} timeout={600}>
            <Grid
              container
              spacing={{ xs: 2, sm: 2.5, md: 3 }}
              sx={{
                justifyContent: 'center',
                alignItems: 'stretch'
              }}
            >
              {filteredProducts.map((produto, index) => (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  lg={3}
                  key={produto.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                >
                  <Fade in={true} timeout={600} style={{ transitionDelay: `${index * 50}ms` }}>
                    <Box sx={{ width: '100%', maxWidth: '280px' }}>
                      <ProductCard produto={produto} />
                    </Box>
                  </Fade>
                </Grid>
              ))}
            </Grid>
          </Fade>
        ) : (
          <Paper
            sx={{
              textAlign: 'center',
              py: 8,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #fff 0%, #fafafa 100%)'
            }}
          >
            <StorefrontIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              {searchTerm || categoriaFiltro
                ? 'Nenhum produto encontrado'
                : 'Nenhum produto disponível'
              }
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {searchTerm || categoriaFiltro
                ? 'Tente ajustar os filtros de busca'
                : 'Em breve teremos produtos disponíveis'
              }
            </Typography>
          </Paper>
        )}
      </Container>
      <Cart />
      <CartButton />
    </Box>
  );
};

export default Catalog;