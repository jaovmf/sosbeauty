import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Alert,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  Container,
  Stack,
  Paper,
  alpha,
  useTheme,
  Fab,
  Badge,
  Collapse,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  LocalShipping as LocalShippingIcon,
  Payment as PaymentIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatCurrency';
import { useProdutos } from '../../hooks/useProdutos';
import { useClientes } from '../../hooks/useClientes';
import { useVendas } from '../../hooks/useVendas';
import type { Produto, Cliente, NovaVendaRequest } from '../../types/api';
import PrintReceipt from '../../components/PrintReceipt';

interface CartItem {
  product: Produto;
  quantity: number;
  total: number;
}

const SalesScreen = () => {
  const theme = useTheme();

  // Hooks para dados
  const { produtos, loading: loadingProdutos, error: errorProdutos, refetch: refetchProdutos } = useProdutos();
  const { clientes, loading: loadingClientes, error: errorClientes, listarClientes } = useClientes();
  const { criarPreVenda, atualizarPreVenda, buscarVendaPorId, loading: loadingVenda, error: errorVenda } = useVendas();
  const [searchParams] = useSearchParams();
  const preVendaId = searchParams.get('preVendaId');
  const isEditingPreVenda = !!preVendaId;
  const preVendaLoadedRef = useRef(false);

  // Estados principais
  const [step, setStep] = useState(1); // 1: Cliente, 2: Produtos, 3: Entrega/Pagamento
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState<string>('1');

  // Estados de entrega e pagamento
  const [shippingOption, setShippingOption] = useState<'8' | '10' | 'free'>('8');
  const [paymentMethod, setPaymentMethod] = useState('');

  // Estados de desconto
  const [descontoTipo, setDescontoTipo] = useState<'percentual' | 'valor' | ''>('');
  const [descontoValor, setDescontoValor] = useState<number>(0);

  // Estados de pagamento em dinheiro
  const [valorPago, setValorPago] = useState<number>(0);

  // Estados de UI
  const [showCart, setShowCart] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [pendingSaleData, setPendingSaleData] = useState<any>(null);

  useEffect(() => {
    listarClientes();
  }, [listarClientes]);

  useEffect(() => {
    const carregarPreVenda = async () => {
      if (!isEditingPreVenda || !preVendaId || preVendaLoadedRef.current) return;
      if (produtos.length === 0 || clientes.length === 0) return;

      const venda: any = await buscarVendaPorId(preVendaId as any);

      if (!venda || venda.status !== 'pendente') {
        toast.error('Pré-venda não encontrada ou já finalizada');
        return;
      }

      const clienteDaVenda = clientes.find((c) => String(c.id) === String(venda.cliente_id));
      if (clienteDaVenda) {
        setSelectedClient(clienteDaVenda);
      }

      const itensCarregados = (venda.itens || [])
        .map((item: any) => {
          const produto = produtos.find((p) => String(p.id) === String(item.produto_id));
          if (!produto) return null;

          return {
            product: produto,
            quantity: item.quantidade,
            total: item.subtotal
          } as CartItem;
        })
        .filter(Boolean) as CartItem[];

      if (itensCarregados.length === 0) {
        toast.error('Não foi possível carregar itens da pré-venda');
        return;
      }

      setCartItems(itensCarregados);
      setPaymentMethod(venda.payment_method || '');
      setDescontoTipo(venda.desconto_tipo || '');
      setDescontoValor(venda.desconto_valor || 0);

      const shippingValue = Number(venda.shipping_value || 0);
      if (shippingValue === 8) setShippingOption('8');
      else if (shippingValue === 7) setShippingOption('8');
      else if (shippingValue === 10) setShippingOption('10');
      else setShippingOption('free');

      setStep(2);
      preVendaLoadedRef.current = true;
      toast.success('Pré-venda carregada para edição');
    };

    carregarPreVenda();
  }, [isEditingPreVenda, preVendaId, produtos, clientes, buscarVendaPorId]);

  // Resetar quantidade quando produto mudar
  useEffect(() => {
    setQuantity(1);
    setQuantityInput('1');
  }, [selectedProduct]);

  const getProductPrice = (product: Produto) => {
    return product.promotional_price && product.promotional_price > 0 && product.promotional_price < product.price
      ? product.promotional_price
      : product.price;
  };

  const handleAddToCart = () => {
    if (!selectedProduct) {
      setError('Selecione um produto');
      return;
    }



    const existingItemIndex = cartItems.findIndex(item => item.product.id === selectedProduct.id);

    if (existingItemIndex >= 0) {
      const newQuantity = cartItems[existingItemIndex].quantity + quantity;
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity = newQuantity;
      updatedItems[existingItemIndex].total = newQuantity * getProductPrice(selectedProduct);
      setCartItems(updatedItems);
    } else {
      const newItem: CartItem = {
        product: selectedProduct,
        quantity: quantity,
        total: getProductPrice(selectedProduct) * quantity
      };
      setCartItems([...cartItems, newItem]);
    }

    setSelectedProduct(null);
    setQuantity(1);
    setError('');
    toast.success('Produto adicionado!');
  };

  const handleUpdateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(index);
      return;
    }

    const item = cartItems[index];
    // Permitir atualizar mesmo com estoque zerado/negativo

    const updatedItems = [...cartItems];
    updatedItems[index].quantity = newQuantity;
    updatedItems[index].total = newQuantity * getProductPrice(item.product);
    setCartItems(updatedItems);
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
    toast.success('Produto removido');
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.total, 0);
  };

  const calculateDesconto = () => {
    if (!descontoTipo || !descontoValor || descontoValor <= 0) return 0;

    const subtotal = calculateSubtotal();

    if (descontoTipo === 'percentual') {
      return (subtotal * descontoValor) / 100;
    } else if (descontoTipo === 'valor') {
      return Math.min(descontoValor, subtotal); // Não pode ser maior que o subtotal
    }

    return 0;
  };

  const getShippingValue = () => {
    if (shippingOption === 'free') return 0;
    if (shippingOption === '8') return 8;
    if (shippingOption === '10') return 10;
    return 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDesconto() + getShippingValue();
  };

  const calculateTroco = () => {
    if (paymentMethod === 'dinheiro' && valorPago > 0) {
      const total = calculateTotal();
      return Math.max(0, valorPago - total);
    }
    return 0;
  };

  const canProceedToStep2 = () => selectedClient !== null;
  const canProceedToStep3 = () => cartItems.length > 0;
  const canFinalizeSale = () => paymentMethod !== '';

  const handleFinalizeSale = async () => {
    if (!selectedClient || cartItems.length === 0 || !paymentMethod) {
      setError('Preencha todos os dados necessários');
      return;
    }

    // Validar valor pago para pagamento em dinheiro
    if (paymentMethod === 'dinheiro' && valorPago < calculateTotal()) {
      setError('Valor pago deve ser maior ou igual ao total da venda');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const saleData: any = {
        cliente_id: selectedClient.id,
        itens: cartItems.map(item => ({
          produto_id: item.product.id,
          quantidade: item.quantity,
          preco_unitario: getProductPrice(item.product)
        })),
        payment_method: paymentMethod,
        valor_frete: getShippingValue(),
        frete_gratis: shippingOption === 'free'
      };

      // Adicionar desconto se houver
      if (descontoTipo && descontoValor > 0) {
        saleData.desconto_tipo = descontoTipo;
        saleData.desconto_valor = descontoValor;
      }

      // Adicionar valor pago se for dinheiro
      if (paymentMethod === 'dinheiro' && valorPago > 0) {
        saleData.valor_pago = valorPago;
      }

      const result = isEditingPreVenda && preVendaId
        ? await atualizarPreVenda(preVendaId as any, saleData)
        : await criarPreVenda(saleData);

      if (result) {
        const saleDataForWhatsApp = {
          saleNumber: `ORC-${result.id}`,
          date: new Date().toISOString(),
          client: selectedClient,
          items: cartItems,
          subtotal: calculateSubtotal(),
          desconto: calculateDesconto(),
          descontoTipo,
          shippingValue: getShippingValue(),
          freeShipping: shippingOption === 'free',
          total: calculateTotal(),
          paymentMethod: paymentMethod,
          valorPago: valorPago,
          troco: calculateTroco()
        };

        setPendingSaleData(saleDataForWhatsApp);
        setWhatsappModalOpen(true);

        // Limpar formulário
        setSelectedClient(null);
        setCartItems([]);
        setShippingOption('8');
        setPaymentMethod('');
        setDescontoTipo('');
        setDescontoValor(0);
        setValorPago(0);
        setStep(1);
        setError('');

        await refetchProdutos();
        toast.success(`Pré-venda salva com sucesso! Número: ORC-${result.id}`);
      } else {
        setError(errorVenda || 'Erro ao salvar pré-venda');
      }
    } catch (error) {
      console.error('Erro ao salvar pré-venda:', error);
      setError('Erro ao salvar pré-venda. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sendWhatsAppMessage = (saleData: any) => {
    if (!saleData.client.phone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }

    const clientPhone = saleData.client.phone.replace(/\D/g, '');
    const itemsList = saleData.items.map((item: CartItem) =>
      `• ${item.product.name} - Qtd: ${item.quantity} - ${formatCurrency(item.total)}`
    ).join('\n');

    const paymentMethods: any = {
      'dinheiro': 'Dinheiro',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'pix': 'PIX',
      'transferencia': 'Transferência Bancária'
    };

    let pixInfo = '';
    if (saleData.paymentMethod === 'pix') {
      pixInfo = `\n\n*Dados para Pagamento PIX:*\nCNPJ: 46393792000102\n\nPor favor, realize o pagamento e envie o comprovante.`;
    }

    let descontoInfo = '';
    if (saleData.desconto > 0) {
      const descontoTexto = saleData.descontoTipo === 'percentual'
        ? `Desconto (${saleData.descontoValor}%): -${formatCurrency(saleData.desconto)}`
        : `Desconto: -${formatCurrency(saleData.desconto)}`;
      descontoInfo = `\n${descontoTexto}`;
    }

    let trocoInfo = '';
    if (saleData.paymentMethod === 'dinheiro' && saleData.troco > 0) {
      trocoInfo = `\nValor Pago: ${formatCurrency(saleData.valorPago)}\n*Troco: ${formatCurrency(saleData.troco)}*`;
    }

    const message = `*Pré-venda / Orçamento - SOS Beauty*

  *Número do Orçamento:* ${saleData.saleNumber}
*Data:* ${new Date(saleData.date).toLocaleDateString('pt-BR')} às ${new Date(saleData.date).toLocaleTimeString('pt-BR')}

*Cliente:* ${saleData.client.name}
*Telefone:* ${saleData.client.phone}

*Endereço de Entrega:*
${saleData.client.street || 'Não informado'}
${saleData.client.neighborhood || ''}
${saleData.client.city || 'Não informado'} - ${saleData.client.state || ''}
CEP: ${saleData.client.zipCode || 'Não informado'}

*Produtos do Pedido:*
${itemsList}

*Resumo Financeiro:*
Subtotal: ${formatCurrency(saleData.subtotal)}${descontoInfo}
Frete: ${saleData.freeShipping ? 'GRÁTIS' : formatCurrency(saleData.shippingValue)}
Forma de Pagamento: ${paymentMethods[saleData.paymentMethod] || saleData.paymentMethod}
*Total Geral: ${formatCurrency(saleData.total)}*${trocoInfo}${pixInfo}

*Status:* Aguardando confirmação

Se estiver tudo certo, me confirme para finalizarmos sua venda ✅`;

    const whatsappUrl = `https://wa.me/55${clientPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setWhatsappModalOpen(false);
    setPendingSaleData(null);
  };

  // Tratamento de loading
  if (loadingProdutos || loadingClientes) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Box textAlign="center">
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Carregando dados...
            </Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  const produtosDisponiveis = produtos;

  return (
    <Container maxWidth="lg" sx={{ pb: { xs: 12, md: 3 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
            {isEditingPreVenda ? 'Editar Pré-venda' : 'Nova Pré-venda'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Etapa {step} de 3
          </Typography>
        </Box>

        {/* Erros */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {(errorProdutos || errorClientes) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorProdutos || errorClientes}
          </Alert>
        )}

        {/* Progress Steps */}
        <Box sx={{ display: { xs: 'none', md: 'flex' } }} gap={2} mb={3}>
          {[
            { num: 1, label: 'Cliente', icon: <PersonIcon /> },
            { num: 2, label: 'Produtos', icon: <ShoppingCartIcon /> },
            { num: 3, label: 'Pagamento', icon: <PaymentIcon /> }
          ].map((s) => (
            <Card
              key={s.num}
              elevation={step === s.num ? 3 : 0}
              sx={{
                flex: 1,
                border: step === s.num ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                borderColor: step >= s.num ? 'primary.main' : 'divider',
                bgcolor: step >= s.num ? alpha(theme.palette.primary.main, 0.05) : 'background.paper'
              }}
            >
              <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: step >= s.num ? 'primary.main' : 'grey.300',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {step > s.num ? <CheckIcon /> : s.icon}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Etapa {s.num}
                  </Typography>
                  <Typography variant="body2" fontWeight={step === s.num ? 600 : 400}>
                    {s.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* STEP 1: Selecionar Cliente */}
        {step === 1 && (
          <Card elevation={2}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PersonIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Selecionar Cliente
                </Typography>
              </Box>

              <Autocomplete
                options={clientes}
                getOptionLabel={(option) => `${option.name} - ${option.phone || 'Sem telefone'}`}
                value={selectedClient}
                onChange={(_, newValue) => setSelectedClient(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar cliente"
                    placeholder="Digite o nome ou telefone"
                    fullWidth
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.phone || 'Sem telefone'} • {option.city || 'Sem cidade'}
                      </Typography>
                    </Box>
                  </li>
                )}
                sx={{ mb: 2 }}
              />

              {selectedClient && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                  <Typography variant="subtitle2" color="success.main" fontWeight="bold" gutterBottom>
                    Cliente Selecionado
                  </Typography>
                  <Typography variant="body2">{selectedClient.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedClient.phone} • {selectedClient.city}
                  </Typography>
                </Paper>
              )}

              <Box mt={3} display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2()}
                  endIcon={<ShoppingCartIcon />}
                >
                  Adicionar Produtos
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Adicionar Produtos */}
        {step === 2 && (
          <>
            <Card elevation={2} sx={{ mb: 2 }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <ShoppingCartIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Adicionar Produtos
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  <Autocomplete
                    options={produtosDisponiveis}
                    getOptionLabel={(option) => `${option.name} - ${formatCurrency(getProductPrice(option))} (Estoque: ${option.stock})`}
                    value={selectedProduct}
                    onChange={(_, newValue) => setSelectedProduct(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Buscar produto"
                        placeholder="Digite o nome do produto"
                      />
                    )}
                    renderOption={(props, option) => {
                      const price = getProductPrice(option);
                      const hasPromo = option.promotional_price && option.promotional_price > 0 && option.promotional_price < option.price;

                      return (
                        <li {...props} key={option.id}>
                          <Box width="100%">
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" fontWeight={500}>
                                {option.name}
                              </Typography>
                              <Box textAlign="right">
                                {hasPromo && (
                                  <Typography
                                    variant="caption"
                                    sx={{ textDecoration: 'line-through', color: 'text.secondary', display: 'block' }}
                                  >
                                    {formatCurrency(option.price)}
                                  </Typography>
                                )}
                                <Typography variant="body2" fontWeight="bold" color={hasPromo ? 'error.main' : 'text.primary'}>
                                  {formatCurrency(price)}
                                </Typography>
                              </Box>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Estoque: {option.stock} un • {option.brand}
                            </Typography>
                          </Box>
                        </li>
                      );
                    }}
                  />

                  {selectedProduct && (
                    <Box display="flex" gap={2} alignItems="center">
                      <TextField
                        type="number"
                        label="Quantidade"
                        value={quantityInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQuantityInput(val);

                          // Atualizar quantidade numérica para cálculos
                          const numVal = parseInt(val) || 0;
                          setQuantity(numVal);
                        }}
                        onBlur={() => {
                          // Quando sai do campo, garante valor mínimo de 1
                          const numVal = parseInt(quantityInput) || 1;
                          const finalVal = Math.max(1, Math.min(numVal, selectedProduct.stock));
                          setQuantity(finalVal);
                          setQuantityInput(finalVal.toString());
                        }}
                        inputProps={{ min: 1, max: selectedProduct.stock, inputMode: 'numeric', pattern: '[0-9]*' }}
                        error={!quantityInput || parseInt(quantityInput) === 0}
                        helperText={(!quantityInput || parseInt(quantityInput) === 0) ? 'Mínimo: 1' : ''}
                        sx={{ width: 120 }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleAddToCart}
                        startIcon={<AddIcon />}
                        fullWidth
                      >
                        Adicionar ({formatCurrency(getProductPrice(selectedProduct) * quantity)})
                      </Button>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Carrinho */}
            {cartItems.length > 0 && (
              <Card elevation={2}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">
                      Carrinho ({cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'})
                    </Typography>
                    <Chip
                      label={formatCurrency(calculateSubtotal())}
                      color="primary"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>

                  <List disablePadding>
                    {cartItems.map((item, index) => (
                      <Box key={index}>
                        <ListItem
                          sx={{
                            px: 0,
                            py: 1.5,
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            gap: 1
                          }}
                        >
                          <ListItemText
                            primary={item.product.name}
                            secondary={`${formatCurrency(getProductPrice(item.product))} cada`}
                            sx={{ flex: { xs: 1, sm: '1 1 auto' }, mb: { xs: 1, sm: 0 } }}
                          />
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box display="flex" alignItems="center" border={1} borderColor="divider" borderRadius={1}>
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <Typography sx={{ px: 2, minWidth: 40, textAlign: 'center' }}>
                                {item.quantity}
                              </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <Typography fontWeight="bold" sx={{ minWidth: 80, textAlign: 'right' }}>
                              {formatCurrency(item.total)}
                            </Typography>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveFromCart(index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </ListItem>
                        {index < cartItems.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>

                  <Box mt={3} display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                    <Button
                      variant="outlined"
                      onClick={() => setStep(1)}
                      fullWidth
                    >
                      Voltar
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => setStep(3)}
                      disabled={!canProceedToStep3()}
                      endIcon={<PaymentIcon />}
                      fullWidth
                    >
                      Continuar para Pagamento
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* STEP 3: Entrega e Pagamento */}
        {step === 3 && (
          <Card elevation={2}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Salvar Pré-venda
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* Opções de Entrega */}
              <Box mb={3}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <LocalShippingIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Entrega
                  </Typography>
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  {[
                    { value: '8', label: 'R$ 8,00', icon: '🚚' },
                    { value: '10', label: 'R$ 10,00', icon: '🚚' },
                    { value: 'free', label: 'Grátis', icon: '🎁' }
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={shippingOption === option.value ? 'contained' : 'outlined'}
                      onClick={() => setShippingOption(option.value as any)}
                      sx={{
                        flex: 1,
                        py: 1.5,
                        justifyContent: 'flex-start',
                        textTransform: 'none'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography fontSize="1.5rem">{option.icon}</Typography>
                        <Typography fontWeight={shippingOption === option.value ? 'bold' : 'normal'}>
                          {option.label}
                        </Typography>
                      </Box>
                    </Button>
                  ))}
                </Stack>
              </Box>

              {/* Forma de Pagamento */}
              <Box mb={3}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <PaymentIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Forma de Pagamento
                  </Typography>
                </Box>

                <FormControl fullWidth>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      // Limpar valor pago se não for dinheiro
                      if (e.target.value !== 'dinheiro') {
                        setValorPago(0);
                      }
                    }}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Selecione a forma de pagamento
                    </MenuItem>
                    <MenuItem value="dinheiro">💵 Dinheiro</MenuItem>
                    <MenuItem value="pix">📱 PIX</MenuItem>
                    <MenuItem value="cartao_debito">💳 Cartão de Débito</MenuItem>
                    <MenuItem value="cartao_credito">💳 Cartão de Crédito</MenuItem>
                    <MenuItem value="transferencia">🏦 Transferência</MenuItem>
                  </Select>
                </FormControl>

                {/* Calculadora de Troco para Dinheiro */}
                {paymentMethod === 'dinheiro' && (
                  <Box mt={2}>
                    <TextField
                      label="Valor Pago pelo Cliente"
                      type="number"
                      fullWidth
                      value={valorPago || ''}
                      onChange={(e) => setValorPago(parseFloat(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                      }}
                      inputProps={{ min: 0, step: 0.01, inputMode: 'decimal' }}
                      helperText={valorPago > 0 && valorPago >= calculateTotal()
                        ? `Troco: ${formatCurrency(calculateTroco())}`
                        : valorPago > 0
                        ? 'Valor insuficiente'
                        : 'Informe o valor pago pelo cliente'}
                      error={valorPago > 0 && valorPago < calculateTotal()}
                    />

                    {calculateTroco() > 0 && (
                      <Paper sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), border: '1px solid', borderColor: 'success.main' }}>
                        <Typography variant="subtitle2" color="success.dark" fontWeight="bold">
                          💰 Troco a Devolver
                        </Typography>
                        <Typography variant="h5" color="success.main" fontWeight="bold">
                          {formatCurrency(calculateTroco())}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                )}
              </Box>

              {/* Sistema de Descontos */}
              <Box mb={3}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  💸 Desconto (Opcional)
                </Typography>

                <Stack direction="row" spacing={1} mb={2}>
                  <FormControl sx={{ flex: 1 }}>
                    <Select
                      value={descontoTipo}
                      onChange={(e) => {
                        setDescontoTipo(e.target.value as any);
                        if (!e.target.value) setDescontoValor(0);
                      }}
                      displayEmpty
                      size="small"
                    >
                      <MenuItem value="">Sem desconto</MenuItem>
                      <MenuItem value="percentual">Percentual (%)</MenuItem>
                      <MenuItem value="valor">Valor Fixo (R$)</MenuItem>
                    </Select>
                  </FormControl>

                  {descontoTipo && (
                    <TextField
                      type="number"
                      size="small"
                      sx={{ flex: 1 }}
                      value={descontoValor || ''}
                      onChange={(e) => setDescontoValor(parseFloat(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">
                          {descontoTipo === 'percentual' ? '%' : 'R$'}
                        </InputAdornment>,
                      }}
                      inputProps={{
                        min: 0,
                        step: descontoTipo === 'percentual' ? 1 : 0.01,
                        max: descontoTipo === 'percentual' ? 100 : calculateSubtotal(),
                        inputMode: descontoTipo === 'percentual' ? 'numeric' : 'decimal'
                      }}
                      placeholder={descontoTipo === 'percentual' ? 'Ex: 10' : 'Ex: 50.00'}
                    />
                  )}
                </Stack>

                {descontoTipo && descontoValor > 0 && (
                  <Typography variant="caption" color="success.main">
                    ✓ Desconto de {formatCurrency(calculateDesconto())} aplicado
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Resumo */}
              <Box mb={3}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Resumo da Venda
                </Typography>

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography color="text.secondary">Subtotal ({cartItems.length} itens)</Typography>
                  <Typography fontWeight={500}>{formatCurrency(calculateSubtotal())}</Typography>
                </Box>

                {calculateDesconto() > 0 && (
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography color="success.main">
                      Desconto {descontoTipo === 'percentual' ? `(${descontoValor}%)` : ''}
                    </Typography>
                    <Typography fontWeight={500} color="success.main">
                      - {formatCurrency(calculateDesconto())}
                    </Typography>
                  </Box>
                )}

                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography color="text.secondary">Entrega</Typography>
                  <Typography fontWeight={500} color={shippingOption === 'free' ? 'success.main' : 'text.primary'}>
                    {shippingOption === 'free' ? 'Grátis' : formatCurrency(getShippingValue())}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6" fontWeight="bold">
                    Total
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    {formatCurrency(calculateTotal())}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }} sx={{ display: { xs: 'none', md: 'flex' } }}>
                <Button
                  variant="outlined"
                  onClick={() => setStep(2)}
                  fullWidth
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleFinalizeSale}
                  disabled={!canFinalizeSale() || isProcessing}
                  startIcon={isProcessing ? <CircularProgress size={20} /> : <CheckIcon />}
                  fullWidth
                >
                  {isProcessing ? 'Processando...' : 'Salvar Pré-venda'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Barra fixa mobile - Resumo + CTA */}
        {step === 3 && (
          <Paper
            elevation={8}
            sx={{
              display: { xs: 'block', md: 'none' },
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 70,
              zIndex: 1200,
              borderTop: 1,
              borderColor: 'divider',
              p: 1.5
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="caption" color="text.secondary">
                Total da pré-venda
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {formatCurrency(calculateTotal())}
              </Typography>
            </Box>

            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                onClick={() => setStep(2)}
                sx={{ minHeight: 44, minWidth: 100 }}
              >
                Voltar
              </Button>
              <Button
                variant="contained"
                onClick={handleFinalizeSale}
                disabled={!canFinalizeSale() || isProcessing}
                startIcon={isProcessing ? <CircularProgress size={18} /> : <CheckIcon />}
                fullWidth
                sx={{ minHeight: 44 }}
              >
                {isProcessing ? 'Processando...' : 'Salvar Pré-venda'}
              </Button>
            </Box>
          </Paper>
        )}

        {/* Modal WhatsApp */}
        <Dialog
          open={whatsappModalOpen}
          onClose={() => setWhatsappModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <WhatsAppIcon color="success" />
              <Typography variant="h6" fontWeight="bold">
                Enviar Orçamento
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography>
              Deseja enviar a pré-venda por WhatsApp para o cliente?
            </Typography>
            {pendingSaleData && (
              <Box mt={2} p={2} bgcolor="grey.100" borderRadius={2}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Cliente:</strong> {pendingSaleData.client.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Telefone:</strong> {pendingSaleData.client.phone}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Total:</strong> {formatCurrency(pendingSaleData.total)}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWhatsappModalOpen(false)} color="inherit">
              Não enviar
            </Button>
            <Button
              onClick={() => {
                setPrintModalOpen(true);
                setWhatsappModalOpen(false);
              }}
              variant="outlined"
            >
              Imprimir Comprovante
            </Button>
            <Button
              onClick={() => pendingSaleData && sendWhatsAppMessage(pendingSaleData)}
              variant="contained"
              color="success"
              startIcon={<WhatsAppIcon />}
            >
              Enviar WhatsApp
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal Impressão */}
        {pendingSaleData && (
          <PrintReceipt
            open={printModalOpen}
            onClose={() => {
              setPrintModalOpen(false);
              setPendingSaleData(null);
            }}
            saleData={pendingSaleData}
          />
        )}

        {/* FAB Mobile - Carrinho */}
        {cartItems.length > 0 && step === 2 && (
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Fab
              color="primary"
              sx={{
                position: 'fixed',
                bottom: 80,
                right: 16,
                zIndex: 1000
              }}
              onClick={() => setStep(3)}
            >
              <Badge badgeContent={cartItems.length} color="error">
                <ShoppingCartIcon />
              </Badge>
            </Fab>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default SalesScreen;
