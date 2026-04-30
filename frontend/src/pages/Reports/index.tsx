import type { ProdutoMaisVendido } from '../../services/relatoriosService';
import React, { useState, useEffect, useMemo } from 'react';
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
  Container,
  TablePagination,
  TextField,
  MenuItem,
  Button,
  Grid,
  Stack,
  Autocomplete,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  useTheme,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PictureAsPdfIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
  PieChart as PieChartIcon,
  LocalShipping as LocalShippingIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import relatoriosService from '../../services/relatoriosService';
import api from '../../lib/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';
import PageHeader from '../../components/Layout/PageHeader';
import SectionBlock from '../../components/Management/SectionBlock';
import KpiMetricCard from '../../components/Management/KpiMetricCard';
import ChartPanel from '../../components/Management/ChartPanel';
import OperationalNotice from '../../components/Management/OperationalNotice';
import userPreferencesService from '../../services/userPreferences';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Cliente {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface Produto {
  id: number;
  name: string;
  category: string;
  price: number;
}

type ChartType = 'line' | 'bar' | 'pie';

const REPORTS_LAST_FILTERS_KEY = 'sosbeauty:reports:lastFilters';

interface ReportsFilterSnapshot {
  startDate: string | null;
  endDate: string | null;
  selectedClientId: number | null;
  selectedProductIds: number[];
}

const Reports = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<ProdutoMaisVendido[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [showProdutosMaisVendidos, setShowProdutosMaisVendidos] = useState(false);
  const carregarProdutosMaisVendidos = async () => {
    setLoadingProdutos(true);
    try {
      const { produtos } = await relatoriosService.obterRelatorioProdutosMaisVendidos();
      setProdutosMaisVendidos(produtos);
    } catch (error) {
      setProdutosMaisVendidos([]);
      setError('Erro ao carregar produtos mais vendidos');
    } finally {
      setLoadingProdutos(false);
    }
  };
  const exportarProdutosMaisVendidosCSV = () => {
    if (!produtosMaisVendidos.length) return;
    const csvRows = [
      'Produto,Quantidade Vendida,Receita Total',
      ...produtosMaisVendidos.map(p => `${p.name},${p.quantidade_vendida},${formatCurrency(p.receita_total)}`)
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produtos-mais-vendidos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  // Estados para dados do backend - INTEGRAÇÃO ATIVA
  const [vendas, setVendas] = useState<[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Produto[]>([]);
  const [pendingFilterRestore, setPendingFilterRestore] = useState<ReportsFilterSnapshot | null>(null);

  const [totalVendas, setTotalVendas] = useState(0);
  const [faturamentoTotal, setFaturamentoTotal] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [totalFrete, setTotalFrete] = useState(0);

  const [chartType, setChartType] = useState<ChartType>('line');

  useEffect(() => {
    carregarDados();
  }, []);

  const getCurrentFilters = (): ReportsFilterSnapshot => ({
    startDate: startDate ? startDate.format('YYYY-MM-DD') : null,
    endDate: endDate ? endDate.format('YYYY-MM-DD') : null,
    selectedClientId: selectedClient ? selectedClient.id : null,
    selectedProductIds: selectedProducts.map((produto) => produto.id),
  });

  const applyFilterSnapshot = (snapshot: ReportsFilterSnapshot) => {
    setStartDate(snapshot.startDate ? dayjs(snapshot.startDate) : null);
    setEndDate(snapshot.endDate ? dayjs(snapshot.endDate) : null);
    setSelectedClient(
      snapshot.selectedClientId
        ? clientes.find((cliente) => cliente.id === snapshot.selectedClientId) || null
        : null
    );
    setSelectedProducts(
      snapshot.selectedProductIds.length > 0
        ? produtos.filter((produto) => snapshot.selectedProductIds.includes(produto.id))
        : []
    );
    setPage(0);
  };

  useEffect(() => {
    const loadInitialPrefs = async () => {
      try {
        const [lastRaw, serverPrefs] = await Promise.all([
          Promise.resolve(localStorage.getItem(REPORTS_LAST_FILTERS_KEY)),
          userPreferencesService.getPreferences().catch(() => ({})),
        ]);

        if (lastRaw) {
          const parsed = JSON.parse(lastRaw) as ReportsFilterSnapshot;
          setPendingFilterRestore(parsed);
        }

        const serverReportsPrefs = serverPrefs?.reports || {};
        if (serverReportsPrefs.layout?.rowsPerPage) {
          setRowsPerPage(serverReportsPrefs.layout.rowsPerPage);
        }
      } catch {
        // Sem fallback adicional necessário
      }
    };

    loadInitialPrefs();
  }, []);

  useEffect(() => {
    if (!pendingFilterRestore || loading) return;
    applyFilterSnapshot(pendingFilterRestore);
    setPendingFilterRestore(null);
  }, [pendingFilterRestore, loading, clientes, produtos]);

  useEffect(() => {
    if (pendingFilterRestore) return;
    localStorage.setItem(REPORTS_LAST_FILTERS_KEY, JSON.stringify(getCurrentFilters()));
  }, [startDate, endDate, selectedClient, selectedProducts, pendingFilterRestore]);

  useEffect(() => {
    userPreferencesService.patchPreferences({
      reports: {
        layout: { rowsPerPage },
      },
    }).catch(() => {});
  }, [rowsPerPage]);

  useEffect(() => {
    if (startDate || endDate || selectedClient || selectedProducts.length > 0) {
      filtrarVendas();
    } else {
      carregarVendas();
    }
  }, [startDate, endDate, selectedClient, selectedProducts]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      await Promise.all([
        carregarVendas(),
        carregarClientes(),
        carregarProdutos(),
        carregarEstatisticas()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados dos relatórios');
    } finally {
      setLoading(false);
    }
  };

  const carregarVendas = async () => {
    try {
      console.log('🔄 Carregando vendas do backend...');
      const vendasData = await relatoriosService.obterVendas();
      console.log('✅ Vendas carregadas:', vendasData);
      setVendas(vendasData);
    } catch (error) {
      console.error('❌ Erro ao carregar vendas:', error);
      throw error;
    }
  };

  const carregarClientes = async () => {
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const carregarProdutos = async () => {
    try {
      const response = await api.get('/produtos');
      setProdutos(response.data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      const filtros: any = {};
      if (startDate) filtros.data_inicio = startDate.format('YYYY-MM-DD');
      if (endDate) filtros.data_fim = endDate.format('YYYY-MM-DD');

      const relatorio = await relatoriosService.obterRelatorioVendas(filtros);
      setTotalVendas(relatorio.quantidade_vendas);
      setFaturamentoTotal(relatorio.total_vendas);
      setTicketMedio(relatorio.ticket_medio);
      setTotalFrete(relatorio.total_frete || 0);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const filtrarVendas = async () => {
    try {
      const filtros = {};

      if (startDate) filtros.data_inicio = startDate.format('YYYY-MM-DD');
      if (endDate) filtros.data_fim = endDate.format('YYYY-MM-DD');
      if (selectedClient) filtros.cliente_id = selectedClient.id.toString();

      const vendasData = await relatoriosService.obterVendas(filtros);

      let vendasFiltradas = vendasData;

      if (selectedProducts.length > 0) {
        vendasFiltradas = vendasData.filter(venda => {
          const produtoIds = venda.itens.map(item => item.produto_id);
          return selectedProducts.some(produto => produtoIds.includes(produto.id));
        });
      }

      setVendas(vendasFiltradas);
      await carregarEstatisticas();
    } catch (error) {
      console.error('Erro ao filtrar vendas:', error);
    }
  };

  // Calcular dados para gráficos
  const chartData = useMemo(() => {
    if (!vendas || vendas.length === 0) {
      return {
        salesByDay: { labels: [], data: [] },
        revenueByDay: { labels: [], data: [] },
        topProducts: { labels: [], data: [] },
        salesByStatus: { labels: [], data: [] }
      };
    }

    // Vendas por dia
    const salesByDayMap = new Map<string, number>();
    const revenueByDayMap = new Map<string, number>();

    vendas.forEach(venda => {
      const date = new Date(venda.created_at).toLocaleDateString('pt-BR');
      salesByDayMap.set(date, (salesByDayMap.get(date) || 0) + 1);
      revenueByDayMap.set(date, (revenueByDayMap.get(date) || 0) + venda.total);
    });

    const salesByDay = {
      labels: Array.from(salesByDayMap.keys()).sort((a, b) => {
        const [dayA, monthA, yearA] = a.split('/').map(Number);
        const [dayB, monthB, yearB] = b.split('/').map(Number);
        return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
      }),
      data: Array.from(salesByDayMap.keys()).sort((a, b) => {
        const [dayA, monthA, yearA] = a.split('/').map(Number);
        const [dayB, monthB, yearB] = b.split('/').map(Number);
        return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
      }).map(date => salesByDayMap.get(date) || 0)
    };

    const revenueByDay = {
      labels: Array.from(revenueByDayMap.keys()).sort((a, b) => {
        const [dayA, monthA, yearA] = a.split('/').map(Number);
        const [dayB, monthB, yearB] = b.split('/').map(Number);
        return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
      }),
      data: Array.from(revenueByDayMap.keys()).sort((a, b) => {
        const [dayA, monthA, yearA] = a.split('/').map(Number);
        const [dayB, monthB, yearB] = b.split('/').map(Number);
        return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
      }).map(date => revenueByDayMap.get(date) || 0)
    };

    // Top produtos
    const productSales = new Map<string, number>();
    vendas.forEach(venda => {
      if (venda.itens && venda.itens.length > 0) {
        venda.itens.forEach(item => {
          productSales.set(
            item.produto_nome,
            (productSales.get(item.produto_nome) || 0) + item.quantidade
          );
        });
      }
    });

    const topProductsArray = Array.from(productSales.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topProducts = {
      labels: topProductsArray.map(([name]) => name),
      data: topProductsArray.map(([, qty]) => qty)
    };

    // Vendas por status
    const statusMap = new Map<string, number>();
    vendas.forEach(venda => {
      statusMap.set(venda.status, (statusMap.get(venda.status) || 0) + 1);
    });

    const salesByStatus = {
      labels: Array.from(statusMap.keys()).map(status =>
        status === 'pago' ? 'Pago' :
        status === 'pendente' ? 'Pendente' :
        status.charAt(0).toUpperCase() + status.slice(1)
      ),
      data: Array.from(statusMap.values())
    };

    return { salesByDay, revenueByDay, topProducts, salesByStatus };
  }, [vendas]);

  // Mantemos a tendência neutra até existir comparação com período anterior.
  const trends = useMemo(() => {
    return { sales: 0, revenue: 0, ticket: 0 };
  }, []);

  const paginatedSales = vendas.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedClient(null);
    setSelectedProducts([]);
    setPage(0);
    carregarVendas();
    carregarEstatisticas();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const exportToExcel = () => {
    const dataToExport = vendas.map(venda => ({
      'ID da Venda': venda.id,
      'Data': formatDate(venda.created_at),
      'Cliente': venda.cliente_nome,
      'Total': venda.total,
      'Status': venda.status,
      'Produtos': venda.itens.map(item => `${item.produto_nome} (${item.quantidade}x)`).join(', '),
      'Observações': venda.observacoes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório de Vendas');

    const fileName = `relatorio-vendas-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Relatório de Vendas - SOS Beauty', 20, 20);

    if (startDate || endDate) {
      doc.setFontSize(12);
      const period = `Período: ${startDate ? startDate.format('DD/MM/YYYY') : 'Início'} até ${endDate ? endDate.format('DD/MM/YYYY') : 'Hoje'}`;
      doc.text(period, 20, 35);
    }

    doc.setFontSize(12);
    doc.text(`Total de Vendas: ${totalVendas}`, 20, 50);
    doc.text(`Faturamento Total: ${formatCurrency(faturamentoTotal)}`, 20, 60);
    doc.text(`Ticket Médio: ${formatCurrency(ticketMedio)}`, 20, 70);

    const tableData = vendas.map(venda => [
      venda.id.toString(),
      formatDate(venda.created_at),
      venda.cliente_nome,
      formatCurrency(venda.total),
      venda.itens.length + ' item(s)'
    ]);

    (doc as any).autoTable({
      head: [['ID', 'Data', 'Cliente', 'Total', 'Itens']],
      body: tableData,
      startY: 85,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [29, 78, 137] }
    });

    const fileName = `relatorio-vendas-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Configurações dos gráficos
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: isMobile ? 10 : 15,
          font: {
            size: isMobile ? 10 : 12
          }
        }
      }
    }
  };

  const salesChartData = {
    labels: chartData.salesByDay.labels,
    datasets: [
      {
        label: 'Vendas',
        data: chartData.salesByDay.data,
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main + '20',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const revenueChartData = {
    labels: chartData.revenueByDay.labels,
    datasets: [
      {
        label: 'Faturamento (R$)',
        data: chartData.revenueByDay.data,
        borderColor: theme.palette.success.main,
        backgroundColor: theme.palette.success.main + '20',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const topProductsChartData = {
    labels: chartData.topProducts.labels,
    datasets: [
      {
        label: 'Quantidade Vendida',
        data: chartData.topProducts.data,
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.info.main
        ]
      }
    ]
  };

  const statusChartData = {
    labels: chartData.salesByStatus.labels,
    datasets: [
      {
        data: chartData.salesByStatus.data,
        backgroundColor: [
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main
        ]
      }
    ]
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box padding={3}>
          <OperationalNotice
            severity="error"
            title="Falha ao carregar relatórios"
            message={error}
          />
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="xl">
        <Box padding={{ xs: 1, sm: 2, md: 3 }}>
          <Box marginBottom={3}>
            <PageHeader
              title="Relatórios de Vendas"
              subtitle="Análise de desempenho, faturamento e mix de produtos"
              icon={<AssessmentIcon fontSize="small" />}
              actions={
                <Box display="flex" gap={1} flexDirection={{ xs: 'column', sm: 'row' }} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  <Button
                    variant="outlined"
                    startIcon={<FileDownloadIcon />}
                    onClick={exportToExcel}
                    disabled={vendas.length === 0}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                    size="medium"
                  >
                    Excel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={exportToPDF}
                    disabled={vendas.length === 0}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                    size="medium"
                  >
                    PDF
                  </Button>
                  <Button
                    variant="contained"
                    color={showProdutosMaisVendidos ? 'secondary' : 'primary'}
                    startIcon={<BarChartIcon />}
                    onClick={async () => {
                      if (!showProdutosMaisVendidos) await carregarProdutosMaisVendidos();
                      setShowProdutosMaisVendidos(v => !v);
                    }}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                    size="medium"
                  >
                    Produtos Mais Vendidos
                  </Button>
                </Box>
              }
            />
            {/* Tabela de Produtos Mais Vendidos - AGORA LOGO ABAIXO DO TÍTULO */}
            {showProdutosMaisVendidos && (
              <Box marginY={3}>
                <Paper elevation={2} sx={{ borderRadius: 3, width: '100%', overflowX: 'auto' }}>
                  <Box sx={{ padding: { xs: 2, md: 3 }, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                      Produtos Mais Vendidos (Todos)
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<FileDownloadIcon />}
                      onClick={exportarProdutosMaisVendidosCSV}
                      disabled={produtosMaisVendidos.length === 0}
                      size="small"
                    >
                      Exportar CSV
                    </Button>
                  </Box>
                  {loadingProdutos ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <TableContainer sx={{ minWidth: 320 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: 'primary.50' }}>
                            <TableCell><strong>Produto</strong></TableCell>
                            <TableCell><strong>Marca</strong></TableCell>
                            <TableCell align="center"><strong>Quantidade Vendida</strong></TableCell>
                            <TableCell align="center"><strong>Receita Total</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {produtosMaisVendidos.map((produto) => (
                            <TableRow key={produto.produto_id} hover>
                              <TableCell>{produto.name}</TableCell>
                              <TableCell>{produto.brand || '-'}</TableCell>
                              <TableCell align="center">{produto.quantidade_vendida}</TableCell>
                              <TableCell align="center">{formatCurrency(produto.receita_total)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              </Box>
            )}
          </Box>

          {/* KPI Cards */}
          <Grid container spacing={2} marginBottom={3}>
            <Grid item xs={12} sm={6} md={2.4}>
              <KpiMetricCard
                title="Total de Vendas"
                value={totalVendas}
                icon={<ShoppingCartIcon sx={{ color: theme.palette.primary.main }} />}
                color={theme.palette.primary.main}
                trend={trends.sales}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <KpiMetricCard
                title="Faturamento Total"
                value={formatCurrency(faturamentoTotal)}
                icon={<AttachMoneyIcon sx={{ color: theme.palette.success.main }} />}
                color={theme.palette.success.main}
                trend={trends.revenue}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <KpiMetricCard
                title="Ticket Médio"
                value={formatCurrency(ticketMedio)}
                icon={<InventoryIcon sx={{ color: theme.palette.info.main }} />}
                color={theme.palette.info.main}
                trend={trends.ticket}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <KpiMetricCard
                title="Total em Frete"
                value={formatCurrency(totalFrete)}
                icon={<LocalShippingIcon sx={{ color: theme.palette.warning.main }} />}
                color={theme.palette.warning.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <KpiMetricCard
                title="Total de Clientes"
                value={clientes.length}
                icon={<PeopleIcon sx={{ color: theme.palette.secondary.main }} />}
                color={theme.palette.secondary.main}
              />
            </Grid>
          </Grid>

          <SectionBlock
            title="Filtros"
            icon={<BarChartIcon color="primary" fontSize="small" />}
          >
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Data Inicial"
                    value={startDate}
                    onChange={(newValue) => {
                      setStartDate(newValue);
                      setPage(0);
                    }}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Data Final"
                    value={endDate}
                    onChange={(newValue) => {
                      setEndDate(newValue);
                      setPage(0);
                    }}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true
                      }
                    }}
                  />
                </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  options={clientes}
                  getOptionLabel={(option) => option.name}
                  value={selectedClient}
                  onChange={(event: any, newValue: any) => {
                    setSelectedClient(newValue);
                    setPage(0);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Cliente"
                      size="small"
                      sx={{ minWidth: 200 }}
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  sx={{ minWidth: 200 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  multiple
                  options={produtos}
                  getOptionLabel={(option) => option.name}
                  value={selectedProducts}
                  onChange={(event: any, newValue: any) => {
                    setSelectedProducts(newValue);
                    setPage(0);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Produtos"
                      size="small"
                      sx={{ minWidth: 200 }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option.name}
                        {...getTagProps({ index })}
                        key={option.id}
                        size="small"
                      />
                    ))
                  }
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  sx={{ minWidth: 200 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  size="small"
                  sx={{
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Limpar Filtros
                </Button>
              </Grid>
              </Grid>
            </LocalizationProvider>
          </SectionBlock>

          {/* Gráficos */}
          <Grid container spacing={2} marginBottom={3}>
            {/* Vendas por Dia */}
            <Grid item xs={12} lg={8}>
              <ChartPanel
                title="Vendas no Período"
                icon={<ShowChartIcon color="primary" />}
                actions={
                  <ToggleButtonGroup
                    value={chartType}
                    exclusive
                    onChange={(e, newType) => newType && setChartType(newType)}
                    size="small"
                  >
                    <ToggleButton value="line" aria-label="linha">
                      <ShowChartIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton value="bar" aria-label="barra">
                      <BarChartIcon fontSize="small" />
                    </ToggleButton>
                  </ToggleButtonGroup>
                }
              >
                {chartType === 'line' ? (
                  <Line data={salesChartData} options={lineChartOptions} />
                ) : (
                  <Bar data={salesChartData} options={barChartOptions} />
                )}
              </ChartPanel>
            </Grid>

            {/* Vendas por Status */}
            <Grid item xs={12} lg={4}>
              <ChartPanel
                title="Vendas por Status"
                icon={<PieChartIcon color="secondary" />}
              >
                <Pie data={statusChartData} options={pieChartOptions} />
              </ChartPanel>
            </Grid>

            {/* Faturamento por Dia */}
            <Grid item xs={12} lg={8}>
              <ChartPanel
                title="Faturamento no Período"
                icon={<AttachMoneyIcon color="success" />}
              >
                {chartType === 'line' ? (
                  <Line data={revenueChartData} options={lineChartOptions} />
                ) : (
                  <Bar data={revenueChartData} options={barChartOptions} />
                )}
              </ChartPanel>
            </Grid>

            {/* Top Produtos */}
            <Grid item xs={12} lg={4}>
              <ChartPanel
                title="Top 5 Produtos"
                icon={<InventoryIcon color="info" />}
              >
                <Bar data={topProductsChartData} options={barChartOptions} />
              </ChartPanel>
            </Grid>
          </Grid>

          <SectionBlock
            title="Detalhamento de Vendas"
            showHeaderDivider
            padding={0}
          >

            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.50' }}>
                      <TableCell><strong>ID da Venda</strong></TableCell>
                      <TableCell><strong>Data</strong></TableCell>
                      <TableCell><strong>Cliente</strong></TableCell>
                      <TableCell align="center"><strong>Frete</strong></TableCell>
                      <TableCell align="center"><strong>Status</strong></TableCell>
                      <TableCell align="center"><strong>Total</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedSales.map((venda) => (
                      <TableRow key={venda.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            #{venda.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {formatDate(venda.created_at)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {venda.cliente_nome}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            sx={{
                              color: venda.shipping_value > 0 ? 'text.primary' : 'success.main',
                              fontWeight: venda.shipping_value > 0 ? 'normal' : 'bold'
                            }}
                          >
                            {venda.shipping_value > 0 ? formatCurrency(venda.shipping_value) : 'Grátis'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={venda.status === 'pago' ? 'PAGO' : venda.status.toUpperCase()}
                            color={venda.status === 'pago' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(venda.total)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ display: { xs: 'block', md: 'none' }, padding: 2 }}>
              {paginatedSales.map((venda) => (
                <Card key={venda.id} sx={{ marginBottom: 2, padding: 2, borderRadius: 2 }}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" marginBottom={1}>
                      <Box>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          #{venda.id}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(venda.created_at)}
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        {formatCurrency(venda.total)}
                      </Typography>
                    </Box>

                    <Box marginBottom={1}>
                      <Typography variant="body2" fontWeight="medium">
                        {venda.cliente_nome}
                      </Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Frete:{' '}
                          <span style={{ color: venda.shipping_value > 0 ? 'inherit' : '#2e7d32', fontWeight: venda.shipping_value > 0 ? 'normal' : 'bold' }}>
                            {venda.shipping_value > 0 ? formatCurrency(venda.shipping_value) : 'Grátis'}
                          </span>
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Chip
                          label={venda.status === 'pago' ? 'PAGO' : venda.status.toUpperCase()}
                          color={venda.status === 'pago' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>

            <TablePagination
              component="div"
              count={vendas.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Itens por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
              }
            />
          </SectionBlock>
        </Box>
      </Container>

    </>
  );
};

export default Reports;
