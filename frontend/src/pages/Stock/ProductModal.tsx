import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Divider,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatCurrency';
import api from '../../lib/api';
import { getServerUrl } from '../../lib/apiUrl';

interface Fornecedor {
  id: string;
  nome: string;
  razao_social?: string;
  ativo: boolean;
}

interface ProductFormData {
  name: string;
  stock: number;
  price: number;
  cost: number;
  promotional_price: number;
  fornecedor_id: string;
  image?: File | null;
  currentImage?: string;
}

const ProductModal = ({ open, product, produtos, onClose, onSave } : any) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    stock: 0,
    price: 0,
    cost: 0,
    promotional_price: 0,
    fornecedor_id: '',
    image: null,
    currentImage: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const hasNewImageRef = useRef(false);

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

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        stock: product.stock || 0,
        price: product.price || 0,
        cost: product.cost || 0,
        promotional_price: product.promotional_price || 0,
        fornecedor_id: product.fornecedor_id || '',
        image: null,
        currentImage: product.image || ''
      });
      setImagePreview(product.image ? `${getServerUrl()}${product.image}` : null);
      hasNewImageRef.current = false;
    }
    setError('');
  }, [product]);

  useEffect(() => {
    if (product && produtos && produtos.length > 0 && !hasNewImageRef.current) {
      const produtoAtualizado = produtos.find((p: any) => p.id === product.id);
      if (produtoAtualizado && produtoAtualizado.image !== product.image) {
        setFormData(prev => ({
          ...prev,
          currentImage: produtoAtualizado.image || ''
        }));
        setImagePreview(produtoAtualizado.image ? `${getServerUrl()}${produtoAtualizado.image}` : null);
      }
    }
  }, [produtos, product]);

  const handleInputChange = (field : any, value : any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Tipo de arquivo não permitido. Use apenas JPEG, PNG, GIF ou WebP.');
        return;
      }

      // Validar tamanho do arquivo (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Arquivo muito grande. Máximo 5MB.');
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      hasNewImageRef.current = true; // Marcar que há uma nova imagem

      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleRemoveImage = () => {
    if (formData.image) {
      // Se há uma nova imagem selecionada, cancelar e voltar para a imagem original
      setFormData(prev => ({ ...prev, image: null }));
      hasNewImageRef.current = false;
      if (formData.currentImage) {
        setImagePreview(`${getServerUrl()}${formData.currentImage}`);
      } else {
        setImagePreview(null);
      }
    } else {
      // Se não há nova imagem, remover a imagem atual do produto
      setFormData(prev => ({ ...prev, currentImage: '' }));
      setImagePreview(null);
    }
    setError('');
  };

  const calculateProfitMargin = () => {
    const sellPrice = formData.promotional_price > 0 ? formData.promotional_price : formData.price;
    if (sellPrice <= 0) return 0;
    return ((sellPrice - formData.cost) / sellPrice) * 100;
  };

  const calculateProfitValue = () => {
    const sellPrice = formData.promotional_price > 0 ? formData.promotional_price : formData.price;
    return sellPrice - formData.cost;
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      setError('Nome do produto é obrigatório');
      return;
    }

    if (formData.price <= 0) {
      setError('Preço de venda deve ser maior que zero');
      return;
    }

    if (formData.cost < 0) {
      setError('Custo não pode ser negativo');
      return;
    }

    if (formData.stock < 0) {
      setError('Estoque não pode ser negativo');
      return;
    }

    if (formData.price <= formData.cost) {
      setError('Preço de venda deve ser maior que o custo');
      return;
    }

    if (formData.promotional_price > 0 && formData.promotional_price >= formData.price) {
      setError('Preço promocional deve ser menor que o preço normal');
      return;
    }

    // Criar FormData para envio
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('brand', product.brand || '');
    formDataToSend.append('description', product.description || '');
    formDataToSend.append('category', product.category || '');
    formDataToSend.append('cost', formData.cost.toString());
    formDataToSend.append('price', formData.price.toString());
    // Sempre enviar promotional_price, mesmo se for 0 (para remover promoção)
    formDataToSend.append('promotional_price', formData.promotional_price.toString());
    formDataToSend.append('stock', formData.stock.toString());
    if (formData.fornecedor_id) {
      formDataToSend.append('fornecedor_id', formData.fornecedor_id);
    }

    // Adicionar imagem se houver uma nova
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    // Se não há imagem nova E a imagem atual foi removida, enviar null para remover
    if (!formData.image && !formData.currentImage && product.image) {
      // Usuário removeu a imagem - enviar campo vazio para indicar remoção
      formDataToSend.append('removeImage', 'true');
    }

    const updatedProduct = {
      id: product.id,
      formData: formDataToSend,
      hasImage: !!formData.image || !!formData.currentImage
    };

    onSave(updatedProduct);
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Editar Produto
          </Typography>
          <Button
            onClick={handleClose}
            color="inherit"
            sx={{ minWidth: 'auto', padding: 1 }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2.5}>
          {/* Informações Básicas */}
          <Grid item xs={12} {...({} as any)}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
              Informações Básicas
            </Typography>
            <Divider />
          </Grid>

          <Grid item xs={12} md={8} {...({} as any)} mt={1}>
            <TextField
              fullWidth
              label="Nome do Produto"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              variant="outlined"
              size="small"
            />
          </Grid>

          <Grid item xs={12} md={4} {...({} as any)} mt={1}>
            <TextField
              fullWidth
              label="Quantidade em Estoque"
              type="number"
              value={formData.stock}
              onChange={(e) => handleInputChange('stock', e.target.value)}
              variant="outlined"
              size="small"
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12} {...({} as any)} mt={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Fornecedor</InputLabel>
              <Select
                value={formData.fornecedor_id}
                onChange={(e) => handleInputChange('fornecedor_id', e.target.value)}
                label="Fornecedor"
                sx={{
                  '& .MuiSelect-select': {
                    minWidth: '180px',
                    display: 'flex',
                    alignItems: 'center'
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

          {/* Preços e Imagem */}
          <Grid item xs={12} {...({} as any)}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom sx={{ mt: 1 }}>
              Preços e Imagem
            </Typography>
            <Divider />
          </Grid>

          {/* Coluna Esquerda - Preços */}
          <Grid item xs={12} md={7} {...({} as any)}>
            <Grid container spacing={2}>
              <Grid item xs={12} {...({} as any)}>
                <TextField
                  fullWidth
                  label="Custo do Produto"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                  variant="outlined"
                  size="small"
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
                  }}
                />
              </Grid>

              <Grid item xs={12} {...({} as any)}>
                <TextField
                  fullWidth
                  label="Preço de Venda"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  variant="outlined"
                  size="small"
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
                  }}
                />
              </Grid>

              <Grid item xs={12} {...({} as any)}>
                <TextField
                  fullWidth
                  label="Preço Promocional (Opcional)"
                  type="number"
                  value={formData.promotional_price || ''}
                  onChange={(e) => handleInputChange('promotional_price', parseFloat(e.target.value) || 0)}
                  variant="outlined"
                  size="small"
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
                  }}
                />
              </Grid>

              {/* Resumo Financeiro */}
              {formData.cost > 0 && formData.price > 0 && (
                <Grid item xs={12} {...({} as any)}>
                  <Box
                    sx={{
                      backgroundColor: 'primary.50',
                      p: 1.5,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'primary.200'
                    }}
                  >
                    <Grid container spacing={1.5}>
                      <Grid item xs={6} {...({} as any)}>
                        <Box textAlign="center">
                          <Typography variant="caption" color="text.secondary">
                            Lucro/Unidade
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color={calculateProfitValue() > 0 ? 'success.main' : 'error.main'}>
                            {formatCurrency(calculateProfitValue())}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} {...({} as any)}>
                        <Box textAlign="center">
                          <Typography variant="caption" color="text.secondary">
                            Margem
                          </Typography>
                          <Typography variant="body2" fontWeight="bold" color={calculateProfitMargin() > 0 ? 'primary.main' : 'error.main'}>
                            {calculateProfitMargin().toFixed(1)}%
                          </Typography>
                        </Box>
                      </Grid>
                      {formData.promotional_price > 0 && (
                        <Grid item xs={12} {...({} as any)}>
                          <Box textAlign="center">
                            <Typography variant="caption" color="text.secondary">
                              Desconto Promocional
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="secondary.main">
                              -{Math.round(((formData.price - formData.promotional_price) / formData.price) * 100)}%
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Grid>

          {/* Coluna Direita - Imagem */}
          <Grid item xs={12} md={5} {...({} as any)}>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'grey.300',
                borderRadius: 1,
                p: 2,
                textAlign: 'center',
                backgroundColor: 'grey.50',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {imagePreview ? (
                <Box>
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Preview"
                    sx={{
                      maxWidth: '140px',
                      maxHeight: '140px',
                      objectFit: 'contain',
                      borderRadius: 1,
                      mb: 1.5
                    }}
                  />
                  <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleRemoveImage}
                    >
                      {formData.image ? 'Cancelar' : 'Remover'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                    >
                      Alterar
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <ImageIcon sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Sem imagem
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{ mt: 1 }}
                  >
                    Selecionar
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }} color="textSecondary">
                    JPG, PNG, GIF, WebP
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductModal;