import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  InputAdornment,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useProdutos } from '../../hooks/useProdutos';
import api from '../../lib/api';
import toast from 'react-hot-toast';

// Função para obter URL da API
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

interface Fornecedor {
  id: string;
  nome: string;
  razao_social?: string;
  ativo: boolean;
}

type ProductFormData = {
  name: string;
  brand: string;
  description: string;
  category: string;
  cost: string;
  price: string;
  promotional_price: string;
  stock: string;
  fornecedor_id: string;
  image: File | null;
};

type ProductFormErrors = {
  name?: string;
  brand?: string;
  description?: string;
  category?: string;
  cost?: string;
  price?: string;
  promotional_price?: string;
  stock?: string;
  image?: string;
};

const ProductRegistration = () => {
  const { criarProduto, loading: loadingProdutos } = useProdutos();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    brand: '',
    description: '',
    category: '',
    cost: '',
    price: '',
    promotional_price: '',
    stock: '',
    fornecedor_id: '',
    image: null
  });

  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadFornecedores();
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

  const categories = [
    'Fios',
    'Colas',
    'Pinças',
    'Escovinhas',
    'Removedores',
    'Acessórios',
    'Cuidados',
    'Outros'
  ];

  const handleInputChange = (field: keyof ProductFormData, value: string | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleImageChange = (event : any) => {
    const file = event.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      if (errors.image) {
        setErrors(prev => ({
          ...prev,
          image: ''
        }));
      }
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null
    }));
    setImagePreview(null);
  };

  const calculateProfitMargin = () => {
    const cost = parseFloat(formData.cost) || 0;
    const price = parseFloat(formData.price) || 0;

    if (price <= 0) return 0;
    return ((price - cost) / price) * 100;
  };

  const validateForm = () => {
    const newErrors: ProductFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do produto é obrigatório';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Marca é obrigatória';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.category) {
      newErrors.category = 'Categoria é obrigatória';
    }

    const cost = parseFloat(formData.cost);
    if (!formData.cost || cost < 0) {
      newErrors.cost = 'Preço de custo deve ser maior ou igual a zero';
    }

    const price = parseFloat(formData.price);
    if (!formData.price || price <= 0) {
      newErrors.price = 'Preço de venda deve ser maior que zero';
    }

    if (formData.cost && formData.price && cost >= price) {
      newErrors.price = 'Preço de venda deve ser maior que o custo';
    }

    if (formData.promotional_price) {
      const promotionalPrice = parseFloat(formData.promotional_price);
      if (promotionalPrice <= 0) {
        newErrors.promotional_price = 'Preço promocional deve ser maior que zero';
      } else if (formData.price && promotionalPrice >= price) {
        newErrors.promotional_price = 'Preço promocional deve ser menor que o preço normal';
      }
    }

    const stock = parseInt(formData.stock);
    if (!formData.stock || stock < 0) {
      newErrors.stock = 'Quantidade em estoque deve ser maior ou igual a zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e : any) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Preparar FormData para envio com imagem
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('brand', formData.brand.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('cost', formData.cost);
      formDataToSend.append('price', formData.price);
      if (formData.promotional_price) {
        formDataToSend.append('promotional_price', formData.promotional_price);
      }
      formDataToSend.append('stock', formData.stock);
      if (formData.fornecedor_id) {
        formDataToSend.append('fornecedor_id', formData.fornecedor_id);
      }

      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      // Criar produto via API
      await fetch(`${getApiUrl()}/produtos`, {
        method: 'POST',
        body: formDataToSend
      });

      toast.success('Produto cadastrado com sucesso!');
      handleClear();
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      toast.error('Erro ao cadastrar produto. Tente novamente.');
    }
  };

  const handleClear = () => {
    setFormData({
      name: '',
      brand: '',
      description: '',
      category: '',
      cost: '',
      price: '',
      promotional_price: '',
      stock: '',
      fornecedor_id: '',
      image: null
    });
    setImagePreview(null);
    setErrors({});
  };

  const formatCurrency = (value : number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const profitMargin = calculateProfitMargin();
  const profitValue = (parseFloat(formData.price) || 0) - (parseFloat(formData.cost) || 0);

  return (
    <>
      <Container maxWidth="lg">
        <Box padding={{ xs: 2, md: 3 }}>
          <Box display="flex" alignItems="center" marginBottom={{ xs: 2, md: 3 }} sx={{ px: { xs: 1, md: 0 } }}>
            <AddIcon sx={{ marginRight: 1, fontSize: { xs: 24, md: 32 } }} />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontSize: { xs: '1.5rem', md: '2.125rem' }
              }}
            >
              Cadastrar Novo Produto
            </Typography>
          </Box>

          {success && (
            <Alert severity="success" sx={{ marginBottom: { xs: 2, md: 3 }, mx: { xs: 1, md: 0 } }}>
              Produto cadastrado com sucesso!
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={{ xs: 2, md: 3 }}>
              <Grid item xs={12} {...({} as any)}>
                <Paper
                  elevation={3}
                  sx={{
                    padding: { xs: 2.5, md: 3.5 },
                    mx: { xs: 1, md: 0 },
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                    Informações Básicas
                  </Typography>

                  <Grid container spacing={{ xs: 1.5, md: 3 }}>
                    <Grid item xs={12} sm={6} md={6} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Nome do Produto"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        error={!!errors.name}
                        helperText={errors.name}
                        required
                        sx={{
                          minWidth: '200px',
                          '& .MuiInputBase-root': {
                            height: '56px',
                            fontSize: '1rem',
                            minWidth: '200px'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6} md={6} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Marca"
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        error={!!errors.brand}
                        helperText={errors.brand}
                        required
                        sx={{
                          minWidth: '200px',
                          '& .MuiInputBase-root': {
                            height: '56px',
                            fontSize: '1rem',
                            minWidth: '200px'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} {...({} as any)}>
                      <FormControl
                        fullWidth
                        error={!!errors.category}
                        sx={{
                          width: '100%',
                          minWidth: '200px'
                        }}
                      >
                        <InputLabel>Categoria</InputLabel>
                        <Select
                          fullWidth
                          value={formData.category}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          label="Categoria"
                          required
                          sx={{
                            fontSize: '1rem',
                            minHeight: '56px',
                            height: '56px',
                            width: '100%',
                            minWidth: '150px',
                            '& .MuiSelect-select': {
                              fontSize: '1rem',
                              padding: '16px 14px',
                              width: '100%',
                              minWidth: '150px'
                            },
                            '& .MuiOutlinedInput-root': {
                              fontSize: '1rem',
                              width: '100%',
                              minWidth: '150px'
                            },
                            '& fieldset': {
                              minWidth: '150px'
                            }
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                '& .MuiMenuItem-root': {
                                  fontSize: '1rem',
                                  padding: '12px 16px',
                                  minHeight: '48px'
                                }
                              }
                            }
                          }}
                        >
                          {categories.map((category) => (
                            <MenuItem key={category} value={category}>
                              {category}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.category && (
                          <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5, fontSize: { xs: '0.8rem', md: '0.75rem' } }}>
                            {errors.category}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} {...({} as any)}>
                      <FormControl
                        fullWidth
                        sx={{
                          minWidth: '200px'
                        }}
                      >
                        <InputLabel>Fornecedor (Opcional)</InputLabel>
                        <Select
                          value={formData.fornecedor_id}
                          onChange={(e) => handleInputChange('fornecedor_id', e.target.value)}
                          label="Fornecedor (Opcional)"
                          sx={{
                            fontSize: '1rem',
                            minHeight: '56px',
                            '& .MuiSelect-select': {
                              fontSize: '1rem',
                              padding: '16px 14px'
                            }
                          }}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                '& .MuiMenuItem-root': {
                                  fontSize: '1rem',
                                  padding: '12px 16px',
                                  minHeight: '48px'
                                }
                              }
                            }
                          }}
                        >
                          <MenuItem value="">
                            <em>Nenhum</em>
                          </MenuItem>
                          {fornecedores.map((fornecedor) => (
                            <MenuItem key={fornecedor.id} value={fornecedor.id}>
                              {fornecedor.nome}
                              {fornecedor.razao_social && ` - ${fornecedor.razao_social}`}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Descrição"
                        multiline
                        rows={3}
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        error={!!errors.description}
                        helperText={errors.description}
                        required
                        sx={{
                          minWidth: '200px',
                          '& .MuiInputBase-root': {
                            fontSize: '1rem',
                            minWidth: '200px'
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6} {...({} as any)}>
                <Paper
                  elevation={3}
                  sx={{
                    padding: { xs: 2.5, md: 3.5 },
                    mx: { xs: 1, md: 0 },
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    height: 'fit-content'
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                    Informações de Preço
                  </Typography>

                  <Grid container spacing={{ xs: 1.5, md: 2 }}>
                    <Grid item xs={12} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Preço de Custo"
                        type="number"
                        inputMode="decimal"
                        value={formData.cost}
                        onChange={(e) => handleInputChange('cost', e.target.value)}
                        error={!!errors.cost}
                        helperText={errors.cost}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                          inputProps: { min: 0, step: 0.01, inputMode: 'decimal' }
                        }}
                        required
                        sx={{
                          minWidth: '200px',
                          '& .MuiInputBase-root': {
                            height: '56px',
                            fontSize: '1rem',
                            minWidth: '200px'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Preço de Venda"
                        type="number"
                        inputMode="decimal"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        error={!!errors.price}
                        helperText={errors.price}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                          inputProps: { min: 0, step: 0.01, inputMode: 'decimal' }
                        }}
                        required
                        sx={{
                          minWidth: '200px',
                          '& .MuiInputBase-root': {
                            height: '56px',
                            fontSize: '1rem',
                            minWidth: '200px'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Preço Promocional (Opcional)"
                        type="number"
                        inputMode="decimal"
                        value={formData.promotional_price}
                        onChange={(e) => handleInputChange('promotional_price', e.target.value)}
                        error={!!errors.promotional_price}
                        helperText={errors.promotional_price || "Deixe em branco se não há promoção"}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                          inputProps: { min: 0, step: 0.01, inputMode: 'decimal' }
                        }}
                        sx={{
                          minWidth: '200px',
                          '& .MuiInputBase-root': {
                            height: '56px',
                            fontSize: '1rem',
                            minWidth: '200px'
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} {...({} as any)}>
                      <TextField
                        fullWidth
                        label="Quantidade em Estoque"
                        type="number"
                        inputMode="numeric"
                        value={formData.stock}
                        onChange={(e) => handleInputChange('stock', e.target.value)}
                        error={!!errors.stock}
                        helperText={errors.stock}
                        InputProps={{
                          inputProps: { min: 0, inputMode: 'numeric' }
                        }}
                        required
                        sx={{
                          minWidth: '200px',
                          '& .MuiInputBase-root': {
                            height: '56px',
                            fontSize: '1rem',
                            minWidth: '200px'
                          }
                        }}
                      />
                    </Grid>
                  </Grid>

                  {formData.cost && formData.price && (
                    <Box
                      mt={{ xs: 2.5, md: 3 }}
                      p={{ xs: 2, md: 2.5 }}
                      bgcolor="primary.50"
                      borderRadius={2}
                      border="1px solid"
                      borderColor="primary.200"
                    >
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        sx={{
                          fontSize: { xs: '1rem', md: '1.1rem' },
                          fontWeight: 600,
                          color: 'primary.main'
                        }}
                      >
                        💰 Análise de Lucro
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
                          Lucro por unidade:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{
                            fontSize: { xs: '0.9rem', md: '1rem' },
                            color: profitValue > 0 ? 'success.main' : 'error.main'
                          }}
                        >
                          {formatCurrency(profitValue)}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
                          Margem de lucro:
                        </Typography>
                        <Chip
                          label={`${profitMargin.toFixed(1)}%`}
                          color={profitMargin > 0 ? 'success' : 'error'}
                          size="medium"
                          sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                        />
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6} {...({} as any)}>
                <Paper
                  elevation={3}
                  sx={{
                    padding: { xs: 2.5, md: 3.5 },
                    mx: { xs: 1, md: 0 },
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    height: 'fit-content',
                    width: { xs: 'calc(100% - 10px)', md: 'auto' }
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                    Imagem do Produto
                  </Typography>

                  <Box textAlign="center">
                    {imagePreview ? (
                      <Box>
                        <Card sx={{ maxWidth: { xs: 250, md: 300 }, margin: '0 auto', mb: 2 }}>
                          <Box
                            component="img"
                            src={imagePreview}
                            alt="Preview"
                            sx={{
                              width: '100%',
                              height: { xs: 150, md: 200 },
                              objectFit: 'cover'
                            }}
                          />
                        </Card>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<ClearIcon />}
                          onClick={removeImage}
                          size="small"
                          sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}
                        >
                          Remover Imagem
                        </Button>
                      </Box>
                    ) : (
                      <Box>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="image-upload"
                          type="file"
                          onChange={handleImageChange}
                        />
                        <label htmlFor="image-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<PhotoCameraIcon />}
                            size="large"
                            sx={{ mb: 2, fontSize: { xs: '0.9rem', md: '1rem' } }}
                          >
                            Adicionar Imagem
                          </Button>
                        </label>
                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                          Formatos aceitos: JPG, PNG, GIF
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                          Tamanho máximo: 5MB
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} {...({} as any)}>
                <Box
                  display="flex"
                  gap={{ xs: 1, md: 2 }}
                  justifyContent={{ xs: 'flext-start', md: 'flex-end' }}
                  flexWrap="nowrap"
                  sx={{ px: { xs: 1, md: 0 }, pb: { xs: 2, md: 0 } }}
                >
                  <Button
                    variant="outlined"
                    onClick={handleClear}
                    size="large"
                    startIcon={<ClearIcon />}
                    sx={{
                      fontSize: { xs: '0.9rem', md: '1rem' },
                      px: { xs: 2, md: 3 },
                      py: { xs: 1, md: 1.5 }
                    }}
                  >
                    Limpar Formulário
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<SaveIcon />}
                    sx={{
                      fontSize: { xs: '0.9rem', md: '1rem' },
                      px: { xs: 2, md: 3 },
                      py: { xs: 1, md: 1.5 }
                    }}
                  >
                    Cadastrar Produto
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Container>
    </>
  );
};

export default ProductRegistration;