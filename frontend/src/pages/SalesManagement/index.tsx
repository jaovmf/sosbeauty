import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Visibility as ViewIcon,
  WhatsApp as WhatsAppIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatCurrency';
import { sendWhatsAppMessage } from '../SalesScreen/functions/sendWhatsAppMessage';
import api from '../../lib/api';

interface VendaDetalhada {
  id: number;
  cliente_id: number;
  cliente_nome: string;
  total: number;
  status: 'pendente' | 'pago' | 'cancelado';
  observacoes: string;
  created_at: string;
  updated_at: string;
  payment_method?: string;
  shipping_value?: number;
  itens?: VendaItem[];
  cliente?: {
    name: string;
    email: string;
    phone: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface VendaItem {
  id: number;
  produto_id: number;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

const SalesManagement = () => {
  const [vendas, setVendas] = useState<VendaDetalhada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVenda, setSelectedVenda] = useState<VendaDetalhada | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [confirmedVenda, setConfirmedVenda] = useState<VendaDetalhada | null>(null);
  const [shippingValue, setShippingValue] = useState('');

  const loadVendas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await api.get(`/vendas?${params.toString()}`);
      setVendas(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendas();
  }, [statusFilter]);

  const loadVendaDetails = async (vendaId: number) => {
    try {
      const vendaResponse = await api.get(`/vendas/${vendaId}`);
      const venda = vendaResponse.data;

      try {
        const clienteResponse = await api.get(`/clientes/${venda.cliente_id}`);
        venda.cliente = clienteResponse.data;
      } catch (err) {
        console.error('Erro ao carregar cliente:', err);
      }

      setSelectedVenda(venda);
      setDetailsOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao carregar detalhes da venda');
    }
  };

  const confirmVenda = async (vendaId: number) => {
    setLoadingConfirm(true);
    try {
      await api.put(`/vendas/${vendaId}/confirm`, {
        shipping_value: shippingValue ? parseFloat(shippingValue) : 0
      });

      setConfirmOpen(false);
      setShippingValue('');
      await loadVendas();

      if (selectedVenda) {
        setConfirmedVenda(selectedVenda);
        setWhatsappOpen(true);
      }
      setSelectedVenda(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao confirmar venda');
    } finally {
      setLoadingConfirm(false);
    }
  };

  const handleSendWhatsApp = async (venda: VendaDetalhada) => {
    try {
      const vendaResponse = await api.get(`/vendas/${venda.id}`);
      const vendaCompleta = vendaResponse.data;

      const clienteResponse = await api.get(`/clientes/${venda.cliente_id}`);
      const cliente = clienteResponse.data;

      if (!vendaCompleta.itens || vendaCompleta.itens.length === 0) {
        throw new Error('Venda não possui itens');
      }

      const saleData = {
        saleNumber: venda.id.toString().padStart(6, '0'),
        date: new Date(venda.created_at),
        client: {
          name: cliente.name,
          phone: cliente.phone,
          address: {
            street: cliente.street,
            neighborhood: cliente.neighborhood,
            city: cliente.city,
            state: cliente.state,
            zipCode: cliente.zipCode
          }
        },
        items: vendaCompleta.itens.map((item: any) => ({
          product: { name: item.produto_nome },
          quantity: item.quantidade,
          total: item.subtotal
        })),
        subtotal: venda.total,
        freeShipping: vendaCompleta.shipping_value === 0,
        shippingValue: vendaCompleta.shipping_value || 0,
        total: venda.total + (vendaCompleta.shipping_value || 0),
        paymentMethod: vendaCompleta.payment_method
      };

      sendWhatsAppMessage(saleData);
      setWhatsappOpen(false);
      setConfirmedVenda(null);
    } catch (err: any) {
      setError('Erro ao enviar mensagem WhatsApp: ' + (err.response?.data?.error || err.message));
      console.error('Erro detalhado:', err);
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      pendente: { label: 'Pendente', color: 'warning' as const },
      pago: { label: 'Confirmado', color: 'success' as const },
      cancelado: { label: 'Cancelado', color: 'error' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] ||
                   { label: status, color: 'default' as const };

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        variant="filled"
      />
    );
  };

  const filteredVendas = vendas.filter(venda =>
    statusFilter === 'all' || venda.status === statusFilter
  );

  return (
    <>
      <Container maxWidth="xl">
        <Box padding={{ xs: 2, md: 3 }}>
          <Box marginBottom={{ xs: 3, md: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Gerenciar Vendas
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Visualize e gerencie todas as vendas do catálogo
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Filtros */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <FilterIcon />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="pendente">Pendentes</MenuItem>
                  <MenuItem value="pago">Confirmados</MenuItem>
                  <MenuItem value="cancelado">Cancelados</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="textSecondary">
                {filteredVendas.length} venda(s) encontrada(s)
              </Typography>
            </Stack>
          </Paper>

          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : filteredVendas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="textSecondary">
                          Nenhuma venda encontrada
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVendas.map((venda) => (
                      <TableRow key={venda.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            #{venda.id.toString().padStart(6, '0')}
                          </Typography>
                        </TableCell>
                        <TableCell>{venda.cliente_nome}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {formatCurrency(venda.total)}
                          </Typography>
                        </TableCell>
                        <TableCell>{getStatusChip(venda.status)}</TableCell>
                        <TableCell>
                          {new Date(venda.created_at).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(venda.created_at).toLocaleTimeString('pt-BR')}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Ver detalhes">
                              <IconButton
                                size="small"
                                onClick={() => loadVendaDetails(venda.id)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            {venda.status === 'pendente' && (
                              <Tooltip title="Confirmar venda">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => {
                                    setSelectedVenda(venda);
                                    setConfirmOpen(true);
                                  }}
                                >
                                  <CheckIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Dialog
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Detalhes da Venda #{selectedVenda?.id.toString().padStart(6, '0')}
            </DialogTitle>
            <DialogContent>
              {selectedVenda && (
                <Box>
                  <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                      Informações Gerais
                    </Typography>
                    <Typography variant="body2">
                      <strong>Cliente:</strong> {selectedVenda.cliente_nome}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {getStatusChip(selectedVenda.status)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total:</strong> {formatCurrency(selectedVenda.total)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Data:</strong> {new Date(selectedVenda.created_at).toLocaleString('pt-BR')}
                    </Typography>
                    {selectedVenda.payment_method && (
                      <Typography variant="body2">
                        <strong>Forma de Pagamento:</strong> {selectedVenda.payment_method}
                      </Typography>
                    )}
                    {selectedVenda.observacoes && (
                      <Typography variant="body2">
                        <strong>Observações:</strong> {selectedVenda.observacoes}
                      </Typography>
                    )}
                  </Box>

                  {selectedVenda.cliente && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        📍 Endereço de Entrega
                      </Typography>
                      <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="body2">
                          <strong>Telefone:</strong> {selectedVenda.cliente.phone}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Endereço:</strong> {selectedVenda.cliente.street}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Bairro:</strong> {selectedVenda.cliente.neighborhood}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Cidade:</strong> {selectedVenda.cliente.city} - {selectedVenda.cliente.state}
                        </Typography>
                        <Typography variant="body2">
                          <strong>CEP:</strong> {selectedVenda.cliente.zipCode}
                        </Typography>
                        {selectedVenda.cliente.email && (
                          <Typography variant="body2">
                            <strong>Email:</strong> {selectedVenda.cliente.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}

                  {selectedVenda.itens && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Itens da Venda
                      </Typography>
                      <List dense>
                        {selectedVenda.itens.map((item, index) => (
                          <Box key={item.id}>
                            <ListItem>
                              <ListItemText
                                primary={item.produto_nome}
                                secondary={
                                  <Box display="flex" justifyContent="space-between">
                                    <Typography variant="caption">
                                      Qtd: {item.quantidade} x {formatCurrency(item.preco_unitario)}
                                    </Typography>
                                    <Typography variant="caption" fontWeight="bold">
                                      {formatCurrency(item.subtotal)}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < selectedVenda.itens!.length - 1 && <Divider />}
                          </Box>
                        ))}
                      </List>
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsOpen(false)}>
                Fechar
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Confirmar Venda</DialogTitle>
            <DialogContent>
              <Typography variant="body1">
                Deseja confirmar esta venda? Esta ação irá:
              </Typography>
              <Box component="ul" sx={{ mt: 2 }}>
                <li>Dar baixa no estoque dos produtos</li>
                <li>Alterar o status para "Confirmado"</li>
                <li>Opcionalmente enviar confirmação por WhatsApp</li>
              </Box>
              <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
                Esta ação não pode ser desfeita.
              </Typography>

              <Box sx={{ mt: 3 }}>
                <TextField
                  fullWidth
                  label="Valor do Frete (R$)"
                  type="number"
                  value={shippingValue}
                  onChange={(e) => setShippingValue(e.target.value)}
                  inputProps={{
                    min: 0,
                    step: "0.01"
                  }}
                  placeholder="0.00"
                  helperText="Informe o valor do frete para esta venda"
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setConfirmOpen(false)}
                disabled={loadingConfirm}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => selectedVenda && confirmVenda(selectedVenda.id)}
                disabled={loadingConfirm}
                variant="contained"
                color="success"
                startIcon={loadingConfirm ? <CircularProgress size={20} /> : <CheckIcon />}
              >
                {loadingConfirm ? 'Confirmando...' : 'Confirmar Venda'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={whatsappOpen}
            onClose={() => setWhatsappOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Typography variant="h6" sx={{ color: '#25D366', display: 'flex', alignItems: 'center', gap: 1 }}>
                <WhatsAppIcon />
                Venda Confirmada!
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Alert severity="success" sx={{ mb: 2 }}>
                Venda #{confirmedVenda?.id.toString().padStart(6, '0')} confirmada com sucesso!
              </Alert>

              <Typography variant="body1" gutterBottom>
                Deseja enviar uma confirmação por WhatsApp para o cliente?
              </Typography>

              {confirmedVenda && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>Cliente:</strong> {confirmedVenda.cliente_nome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Total:</strong> {formatCurrency(confirmedVenda.total)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Forma de pagamento:</strong> {confirmedVenda.payment_method || 'Não informado'}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button
                onClick={() => {
                  setWhatsappOpen(false);
                  setConfirmedVenda(null);
                }}
                color="inherit"
              >
                Não Enviar
              </Button>
              <Button
                onClick={() => confirmedVenda && handleSendWhatsApp(confirmedVenda)}
                variant="contained"
                startIcon={<WhatsAppIcon />}
                sx={{
                  backgroundColor: '#25D366',
                  '&:hover': {
                    backgroundColor: '#128C7E'
                  }
                }}
              >
                Enviar WhatsApp
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </>
  );
};

export default SalesManagement;