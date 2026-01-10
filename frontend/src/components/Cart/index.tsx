import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  List,
  ListItem,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  ShoppingCart as CartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useCart } from '../../contexts/CartContext';
import type { PaymentMethod } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/formatCurrency';
import CheckoutModal from './CheckoutModal';

const paymentMethods: PaymentMethod[] = [
  { type: 'dinheiro', label: 'Dinheiro' },
  { type: 'pix', label: 'PIX' },
  { type: 'credito', label: 'Cartão de Crédito' },
  { type: 'debito', label: 'Cartão de Débito' }
];

const Cart: React.FC = () => {
  const {
    items,
    total,
    itemCount,
    paymentMethod,
    removeItem,
    updateQuantity,
    clearCart,
    setPaymentMethod,
    isOpen,
    closeCart
  } = useCart();

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const handleFinalizePurchase = () => {
    if (items.length === 0) {
      return;
    }

    if (!paymentMethod) {
      toast.error('Por favor, selecione um método de pagamento');
      return;
    }

    setCheckoutModalOpen(true);
  };

  const handleCheckoutComplete = () => {
    setCheckoutModalOpen(false);
    closeCart();
    clearCart();
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={closeCart}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            maxWidth: '100vw'
          }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <CartIcon sx={{ color: '#ba8fee' }} />
                <Typography variant="h6" fontWeight={600}>
                  Meu Carrinho
                </Typography>
                {itemCount > 0 && (
                  <Chip
                    label={itemCount}
                    size="small"
                    sx={{
                      backgroundColor: '#ba8fee',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  />
                )}
              </Stack>
              <IconButton onClick={closeCart} size="small">
                <CloseIcon />
              </IconButton>
            </Stack>
          </Box>

          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {items.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CartIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Seu carrinho está vazio
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Adicione produtos ao carrinho para continuar
                </Typography>
              </Box>
            ) : (
              <>
                <List sx={{ p: 1 }}>
                  {items.map((item) => (
                    <ListItem
                      key={item.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        mb: 1,
                        flexDirection: 'column',
                        alignItems: 'stretch'
                      }}
                    >
                      <Box sx={{ width: '100%', display: 'flex', alignItems: 'flex-start' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {item.produto.name}
                          </Typography>
                          {item.produto.brand && (
                            <Typography variant="caption" color="text.secondary">
                              {item.produto.brand}
                            </Typography>
                          )}
                          <Typography variant="body2" color="primary" fontWeight={600} sx={{ mt: 0.5 }}>
                            {formatCurrency(item.produto.price)} cada
                          </Typography>
                        </Box>
                        <IconButton
                          onClick={() => removeItem(item.produto.id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <IconButton
                            onClick={() => updateQuantity(item.produto.id, item.quantity - 1)}
                            size="small"
                            disabled={item.quantity <= 1}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            onClick={() => updateQuantity(item.produto.id, item.quantity + 1)}
                            size="small"
                            disabled={item.quantity >= item.produto.stock}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Stack>

                        <Typography variant="subtitle1" fontWeight={700} color="primary">
                          {formatCurrency(item.total)}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>

                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Stack spacing={2}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      <PaymentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Método de Pagamento
                    </Typography>

                    <FormControl fullWidth size="small">
                      <InputLabel>Selecione o método</InputLabel>
                      <Select
                        value={paymentMethod?.type || ''}
                        onChange={(e) => {
                          const method = paymentMethods.find(m => m.type === e.target.value);
                          if (method) setPaymentMethod(method);
                        }}
                        label="Selecione o método"
                      >
                        {paymentMethods.map((method) => (
                          <MenuItem key={method.type} value={method.type}>
                            {method.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {paymentMethod && ['credito', 'debito', 'dinheiro'].includes(paymentMethod.type) && (
                      <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                        O pagamento será feito na hora da entrega
                      </Alert>
                    )}

                    {paymentMethod?.type === 'pix' && (
                      <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                        Chave PIX será enviada após confirmação do pedido
                      </Alert>
                    )}
                  </Stack>
                </Box>
              </>
            )}
          </Box>

          {items.length > 0 && (
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight={700}>
                    Total:
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{
                      background: 'linear-gradient(45deg, #ba8fee 30%, #e1c5ff 90%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {formatCurrency(total)}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={clearCart}
                    sx={{ flex: 1 }}
                  >
                    Limpar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleFinalizePurchase}
                    disabled={!paymentMethod}
                    startIcon={<WhatsAppIcon />}
                    sx={{
                      flex: 2,
                      backgroundColor: '#ba8fee',
                      '&:hover': {
                        backgroundColor: '#a777e3'
                      }
                    }}
                  >
                    Finalizar Pedido
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}
        </Box>
      </Drawer>

      <CheckoutModal
        open={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onComplete={handleCheckoutComplete}
      />
    </>
  );
};

export default Cart;