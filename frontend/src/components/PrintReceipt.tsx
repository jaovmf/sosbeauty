import React, { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow
} from '@mui/material';
import {
  Print as PrintIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { formatCurrency } from '../utils/formatCurrency';

interface PrintReceiptProps {
  open: boolean;
  onClose: () => void;
  saleData: {
    saleNumber: string;
    date: string;
    client: {
      name: string;
      phone?: string;
      street?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
    items: Array<{
      product: { name: string };
      quantity: number;
      total: number;
    }>;
    subtotal: number;
    desconto?: number;
    descontoTipo?: 'percentual' | 'valor';
    descontoValor?: number;
    shippingValue: number;
    freeShipping: boolean;
    total: number;
    paymentMethod: string;
    valorPago?: number;
    troco?: number;
  };
}

const PrintReceipt: React.FC<PrintReceiptProps> = ({ open, onClose, saleData }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const paymentMethods: Record<string, string> = {
    'dinheiro': 'Dinheiro',
    'cartao_credito': 'Cartão de Crédito',
    'cartao_debito': 'Cartão de Débito',
    'pix': 'PIX',
    'transferencia': 'Transferência Bancária'
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Comprovante de Venda - ${saleData.saleNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              text-align: center;
              color: #1976d2;
              font-size: 24px;
              margin-bottom: 5px;
            }
            h2 {
              text-align: center;
              font-size: 14px;
              font-weight: normal;
              color: #666;
              margin-top: 0;
            }
            .divider {
              border-bottom: 2px solid #333;
              margin: 15px 0;
            }
            .section {
              margin-bottom: 15px;
            }
            .section-title {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 5px;
              color: #333;
            }
            .info-line {
              font-size: 12px;
              margin: 3px 0;
              color: #555;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            th, td {
              text-align: left;
              padding: 8px;
              font-size: 12px;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .total-row {
              font-weight: bold;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .highlight {
              background-color: #e3f2fd;
              padding: 10px;
              border-radius: 5px;
              margin: 10px 0;
            }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="bold">
            Comprovante de Venda
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box ref={printRef} sx={{ p: 2 }}>
          <Typography variant="h5" align="center" fontWeight="bold" color="primary" gutterBottom>
            SOS Beauty
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
            Comprovante de Venda
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Informações da Venda
            </Typography>
            <Typography variant="body2">
              <strong>Número:</strong> {saleData.saleNumber}
            </Typography>
            <Typography variant="body2">
              <strong>Data:</strong> {new Date(saleData.date).toLocaleDateString('pt-BR')} às{' '}
              {new Date(saleData.date).toLocaleTimeString('pt-BR')}
            </Typography>
          </Box>

          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Cliente
            </Typography>
            <Typography variant="body2">
              <strong>Nome:</strong> {saleData.client.name}
            </Typography>
            {saleData.client.phone && (
              <Typography variant="body2">
                <strong>Telefone:</strong> {saleData.client.phone}
              </Typography>
            )}
            {saleData.client.street && (
              <Typography variant="body2">
                <strong>Endereço:</strong> {saleData.client.street}
                {saleData.client.neighborhood && `, ${saleData.client.neighborhood}`}
              </Typography>
            )}
            {saleData.client.city && (
              <Typography variant="body2">
                <strong>Cidade:</strong> {saleData.client.city} - {saleData.client.state}
              </Typography>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Produtos
            </Typography>
            <Table size="small">
              <TableBody>
                {saleData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell align="center">{item.quantity}x</TableCell>
                    <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Resumo Financeiro
            </Typography>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2">{formatCurrency(saleData.subtotal)}</Typography>
            </Box>

            {saleData.desconto && saleData.desconto > 0 && (
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2" color="success.main">
                  Desconto {saleData.descontoTipo === 'percentual' ? `(${saleData.descontoValor}%)` : ''}:
                </Typography>
                <Typography variant="body2" color="success.main">
                  -{formatCurrency(saleData.desconto)}
                </Typography>
              </Box>
            )}

            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2">Frete:</Typography>
              <Typography variant="body2">
                {saleData.freeShipping ? 'GRÁTIS' : formatCurrency(saleData.shippingValue)}
              </Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="h6" fontWeight="bold">
                Total:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {formatCurrency(saleData.total)}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2">
                <strong>Forma de Pagamento:</strong>
              </Typography>
              <Typography variant="body2">
                {paymentMethods[saleData.paymentMethod] || saleData.paymentMethod}
              </Typography>
            </Box>

            {saleData.paymentMethod === 'dinheiro' && saleData.valorPago && (
              <>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2">Valor Pago:</Typography>
                  <Typography variant="body2">{formatCurrency(saleData.valorPago)}</Typography>
                </Box>
                {saleData.troco && saleData.troco > 0 && (
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    sx={{
                      bgcolor: 'success.light',
                      p: 1,
                      borderRadius: 1,
                      mt: 1
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      Troco:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(saleData.troco)}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="caption" display="block" align="center" color="text.secondary">
            Obrigado pela sua compra!
          </Typography>
          <Typography variant="caption" display="block" align="center" color="text.secondary">
            SOS Beauty - Sistema de Gestão
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Fechar
        </Button>
        <Button onClick={handlePrint} variant="contained" startIcon={<PrintIcon />}>
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrintReceipt;
