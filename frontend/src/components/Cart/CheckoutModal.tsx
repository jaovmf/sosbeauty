import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Stack,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Login as LoginIcon,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useCart } from '../../contexts/CartContext';
import { useClientes } from '../../hooks/useClientes';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Cliente } from '../../types/api';

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

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type CheckoutStep = 'select' | 'login' | 'register';

const CheckoutModal: React.FC<CheckoutModalProps> = ({ open, onClose, onComplete }) => {
  const { items, total, paymentMethod } = useCart();
  const { buscarClientes, criarCliente, loading: clienteLoading } = useClientes();

  const [step, setStep] = useState<CheckoutStep>('select');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [precisaTroco, setPrecisaTroco] = useState(false);
  const [valorTroco, setValorTroco] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const resetModal = () => {
    setStep('select');
    setPhoneNumber('');
    setCliente(null);
    setError('');
    setPrecisaTroco(false);
    setValorTroco('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const formatZipCode = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{5})(\d{3})$/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    return value;
  };

  const handlePhoneSearch = async () => {
    if (!phoneNumber.trim()) {
      setError('Digite um número de telefone');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');

    try {
      const clientes = await buscarClientes(cleanPhone);
      const clienteEncontrado = clientes.find(c =>
       c.phone && c.phone.replace(/\D/g, '') === cleanPhone
      );

      if (clienteEncontrado) {
        setCliente(clienteEncontrado);
        setError('');
      } else {
        setError('Cliente não encontrado. Por favor, faça o cadastro.');
        setFormData(prev => ({ ...prev, phone: phoneNumber }));
        setStep('register');
      }
    } catch (err) {
      setError('Erro ao buscar cliente. Tente novamente.');
    }
  };

  const handleRegister = async () => {
    try {
      if (!formData.name || !formData.phone ||
          !formData.street || !formData.number || !formData.neighborhood ||
          !formData.city || !formData.state || !formData.zipCode) {
        setError('Todos os campos obrigatórios devem ser preenchidos');
        return;
      }

      if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('E-mail deve ter um formato válido');
        return;
      }

      const clientData = {
        name: formData.name.trim(),
        email: formData.email.trim() ? formData.email.trim().toLowerCase() : '',
        phone: formData.phone.replace(/\D/g, ''),
        street: `${formData.street.trim()}, ${formData.number.trim()}`,
        neighborhood: formData.neighborhood.trim(),
        city: formData.city.trim(),
        state: formData.state.trim().toUpperCase(),
        zipCode: formData.zipCode.replace(/\D/g, '')
      };

      const novoCliente = await criarCliente(clientData);
      if (novoCliente) {
        setCliente(novoCliente);
        setError('');
      }
    } catch (err) {
      setError('Erro ao cadastrar cliente. Tente novamente.');
    }
  };

  const handleFinalizePurchase = async () => {
    if (!cliente || !paymentMethod) {
      setError('Informações incompletas para finalizar a compra');
      return;
    }

    setLoading(true);
    try {
      const vendaData = {
        cliente_id: cliente.id,
        payment_method: paymentMethod.label,
        observacoes: 'Pedido feito pelo catálogo',
        itens: items.map(item => ({
          produto_id: item.produto.id,
          quantidade: item.quantity
        }))
      };

      const response = await fetch(`${getApiUrl()}/vendas/catalog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(vendaData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar pedido');
      }

      const resultado = await response.json();

      const itemsList = items.map(item =>
        `• ${item.produto.name} - Qtd: ${item.quantity} - ${formatCurrency(item.total)}`
      ).join('\n');

      let paymentInfo = '';
      let observacaoExtra = '';

      if (paymentMethod.type === 'pix') {
        paymentInfo = `\n*Forma de Pagamento:* ${paymentMethod.label}`;
        observacaoExtra = 'Aguardando confirmacao do pedido para envio da chave PIX';
      } else {
        paymentInfo = `\n*Forma de Pagamento:* ${paymentMethod.label}`;
        observacaoExtra = 'Pagamento na entrega';

        if (paymentMethod.type === 'dinheiro' && precisaTroco && valorTroco) {
          const valorTrocoNum = parseFloat(valorTroco);
          const trocoCalculado = valorTrocoNum - total;
          paymentInfo += `\n*Valor pago:* ${formatCurrency(valorTrocoNum)}\n*Troco a devolver:* ${formatCurrency(trocoCalculado)}`;
        }
      }

      const message = `*Novo Pedido - SOS Beauty*

*Numero do Pedido:* #${resultado.id.toString().padStart(6, '0')}

*Cliente:* ${cliente.name}
*Telefone:* ${cliente.phone}

*Endereco de Entrega:*
${cliente.street}
${cliente.neighborhood}
${cliente.city} - ${cliente.state}
CEP: ${cliente.zipCode}

*Produtos:*
${itemsList}

*Total: ${formatCurrency(total)}*${paymentInfo}

*Status:* Aguardando confirmação
*Observacao:* ${observacaoExtra}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/5549988106106?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');

      toast.success(`Pedido #${resultado.id.toString().padStart(6, '0')} criado com sucesso! Enviado via WhatsApp e aguardando confirmação.`);

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Erro ao finalizar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: '#ba8fee' }}>
          Finalizar Pedido
        </Typography>
      </DialogTitle>

      <DialogContent>
        {step === 'select' && (
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Para finalizar seu pedido, precisamos de suas informações:
            </Typography>

            <Stack spacing={3} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<LoginIcon />}
                onClick={() => setStep('login')}
                sx={{
                  py: 2,
                  borderColor: '#ba8fee',
                  color: '#ba8fee',
                  '&:hover': {
                    borderColor: '#a777e3',
                    backgroundColor: 'rgba(186, 143, 238, 0.04)'
                  }
                }}
              >
                Já tenho cadastro
              </Button>

              <Button
                variant="contained"
                size="large"
                startIcon={<PersonAddIcon />}
                onClick={() => setStep('register')}
                sx={{
                  py: 2,
                  backgroundColor: '#ba8fee',
                  '&:hover': {
                    backgroundColor: '#a777e3'
                  }
                }}
              >
                Fazer cadastro
              </Button>
            </Stack>
          </Box>
        )}

        {step === 'login' && !cliente && (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Digite seu telefone
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Vamos buscar suas informações no sistema
            </Typography>

            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Número de telefone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                error={!!error}
                helperText={error}
              />

              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => setStep('select')}
                  sx={{ flex: 1 }}
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  onClick={handlePhoneSearch}
                  disabled={clienteLoading}
                  sx={{ flex: 1 }}
                >
                  {clienteLoading ? <CircularProgress size={20} /> : 'Buscar'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}

        {step === 'register' && !cliente && (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Cadastrar novo cliente
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid {...({} as any)} size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </Grid>
              <Grid {...({} as any)} size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Email (opcional)"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </Grid>
              <Grid {...({} as any)} size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                  placeholder="(11) 99999-9999"
                  required
                />
              </Grid>
              <Grid {...({} as any)} size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Rua"
                  value={formData.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="Rua das Flores"
                  required
                />
              </Grid>
              <Grid {...({} as any)} size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  label="Número"
                  value={formData.number}
                  onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                  placeholder="270"
                  required
                />
              </Grid>
              <Grid {...({} as any)} size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  label="CEP"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: formatZipCode(e.target.value) }))}
                  placeholder="12345-678"
                  required
                />
              </Grid>
              <Grid {...({} as any)} size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Bairro"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  required
                />
              </Grid>
              <Grid {...({} as any)} size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Cidade"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  required
                />
              </Grid>
              <Grid {...({} as any)} size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Estado"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                  placeholder="SC"
                  inputProps={{ maxLength: 2 }}
                  required
                />
              </Grid>
            </Grid>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setStep('select')}
                sx={{ flex: 1 }}
              >
                Voltar
              </Button>
              <Button
                variant="contained"
                onClick={handleRegister}
                disabled={clienteLoading}
                sx={{ flex: 1 }}
              >
                {clienteLoading ? <CircularProgress size={20} /> : 'Cadastrar'}
              </Button>
            </Stack>
          </Box>
        )}

        {cliente && (
          <Box sx={{ py: 2 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Cliente encontrado! Confira os dados abaixo:
            </Alert>

            <Paper sx={{ p: 2, mb: 3, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>{cliente.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                📞 {cliente.phone}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                📧 {cliente.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                📍 {cliente.street}, {cliente.neighborhood}<br/>
                {cliente.city} - {cliente.state}, CEP: {cliente.zipCode}
              </Typography>
            </Paper>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Resumo do Pedido
            </Typography>

            {items.map((item) => (
              <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                <Typography variant="body2">
                  {item.produto.name} (x{item.quantity})
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(item.total)}
                </Typography>
              </Box>
            ))}

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
              <Typography variant="h6">Subtotal:</Typography>
              <Typography variant="h6" color="primary" fontWeight={700}>
                {formatCurrency(total)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Frete:</Typography>
              <Typography variant="body2" color="text.secondary">
                A calcular
              </Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6" color="primary" fontWeight={700}>
                {formatCurrency(total)} + frete
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mt: 2, fontSize: '0.875rem' }}>
              O valor do frete será calculado e informado após a confirmação do pedido.
            </Alert>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Forma de pagamento: {paymentMethod?.label}
                {paymentMethod && ['credito', 'debito', 'dinheiro'].includes(paymentMethod.type) && ' (na entrega)'}
                {paymentMethod?.type === 'pix' && ' (chave PIX será enviada após confirmação)'}
              </Typography>

              {paymentMethod?.type === 'dinheiro' && (
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={precisaTroco}
                        onChange={(e) => setPrecisaTroco(e.target.checked)}
                      />
                    }
                    label="Precisa de troco?"
                  />

                  {precisaTroco && (
                    <TextField
                      fullWidth
                      label="Valor para troco"
                      value={valorTroco}
                      onChange={(e) => setValorTroco(e.target.value)}
                      placeholder="R$ 50,00"
                      sx={{ mt: 1 }}
                      type="number"
                      inputProps={{ min: total + 1, step: "0.01" }}
                    />
                  )}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        {cliente ? (
          <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{ flex: 1 }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleFinalizePurchase}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <WhatsAppIcon />}
              sx={{
                flex: 2,
                backgroundColor: '#25D366',
                '&:hover': {
                  backgroundColor: '#128C7E'
                }
              }}
            >
              {loading ? 'Criando Pedido...' : 'Enviar Pedido'}
            </Button>
          </Stack>
        ) : (
          <Button onClick={handleClose}>
            Cancelar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CheckoutModal;