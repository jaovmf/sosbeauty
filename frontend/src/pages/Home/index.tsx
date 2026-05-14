import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Container,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  alpha,
  useTheme,
  LinearProgress,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Paper
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useDashboard } from '../../hooks/useDashboard';
import PageHeader from '../../components/Layout/PageHeader';
import KpiMetricCard from '../../components/Management/KpiMetricCard';
import ChartPanel from '../../components/Management/ChartPanel';
import OperationalNotice from '../../components/Management/OperationalNotice';
import EmptyStatePanel from '../../components/Management/EmptyStatePanel';

ChartJS.register(ArcElement, ChartTooltip, Legend);

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const {
    loading,
    error,
    stats,
    vendasSemana,
    vendasMes,
    topProdutos,
    getPieChartData,
    calcularCrescimentoMensal,
    carregarDados
  } = useDashboard();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const crescimentoMensal = calcularCrescimentoMensal();
  const pieChartData = getPieChartData();

  // Tratamento de loading
  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box padding={3} display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 10,
          usePointStyle: true,
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = formatCurrency(context.parsed);
            return `${context.label}: ${value}`;
          }
        }
      }
    }
  };

  return (
    <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 }, pb: { xs: 10, md: 3 } }}>
      <Box>
        <PageHeader
          title="Dashboard"
          subtitle="Visão consolidada da operação"
          actions={
            <Tooltip title="Atualizar indicadores">
              <IconButton
                onClick={carregarDados}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.18) }
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          }
        />

        {/* Exibir erros */}
        {error && (
          <OperationalNotice
            severity="error"
            title="Falha ao carregar o dashboard"
            message={error}
          />
        )}

        {/* MOBILE: Card Principal Compacto */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }} mb={2}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              color: 'text.primary',
              borderRadius: 3
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                    Vendas do Mês
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ fontSize: '1.75rem', my: 0.5 }}>
                    {formatCurrency(vendasMes.total_vendas)}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {crescimentoMensal >= 0 ? (
                      <TrendingUpIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <TrendingDownIcon sx={{ fontSize: 16 }} />
                    )}
                    <Typography variant="caption" fontWeight={600}>
                      {formatPercentage(crescimentoMensal)} vs mês anterior
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AttachMoneyIcon />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={1.5}>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight="bold">
                      {vendasMes.quantidade_vendas}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
                      Vendas
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(vendasSemana.ticket_medio)}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
                      Ticket Médio
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight="bold">
                      {stats.total_clientes}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
                      Clientes
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>

        {/* DESKTOP: KPIs em Grid */}
        <Grid container spacing={{ xs: 2, md: 3 }} mb={{ xs: 2, md: 3 }} sx={{ display: { xs: 'none', md: 'flex' } }}>
          {[
            {
              title: 'Vendas do Mês',
              value: formatCurrency(vendasMes.total_vendas),
              subtitle: `${vendasMes.quantidade_vendas} vendas`,
              icon: <AttachMoneyIcon />,
              color: theme.palette.success.main,
              trend: crescimentoMensal
            },
            {
              title: 'Vendas da Semana',
              value: formatCurrency(vendasSemana.total_vendas),
              subtitle: `${vendasSemana.quantidade_vendas} vendas`,
              icon: <ShoppingCartIcon />,
              color: theme.palette.primary.main,
              trend: null
            },
            {
              title: 'Ticket Médio',
              value: formatCurrency(vendasSemana.ticket_medio),
              subtitle: 'Últimos 7 dias',
              icon: <ShowChartIcon />,
              color: theme.palette.info.main,
              trend: null
            },
            {
              title: 'Total de Clientes',
              value: stats.total_clientes.toString(),
              subtitle: 'Cadastrados',
              icon: <PeopleIcon />,
              color: theme.palette.warning.main,
              trend: null
            }
          ].map((kpi, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <KpiMetricCard
                title={kpi.title}
                value={kpi.value}
                subtitle={kpi.subtitle}
                icon={kpi.icon}
                color={kpi.color}
                trend={kpi.trend === null ? undefined : kpi.trend}
              />
            </Grid>
          ))}
        </Grid>

        {/* Alertas */}
        {(stats.produtos_estoque_baixo > 0 || stats.vendas_pendentes > 0) && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2}>
            {stats.produtos_estoque_baixo > 0 && (
              <Paper
                onClick={() => navigate('/stock')}
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  border: `1px solid ${alpha('#d32f2f', 0.2)}`,
                  bgcolor: alpha('#d32f2f', 0.05),
                  borderRadius: 2,
                  flex: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: alpha('#d32f2f', 0.1),
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    bgcolor: alpha('#d32f2f', 0.1),
                    color: '#d32f2f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <WarningIcon />
                </Box>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight="bold" color="#d32f2f">
                    {stats.produtos_estoque_baixo}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Produtos com estoque baixo
                  </Typography>
                </Box>
                <ArrowForwardIcon sx={{ color: '#d32f2f', fontSize: 20 }} />
              </Paper>
            )}

            {stats.vendas_pendentes > 0 && (
              <Paper
                onClick={() => navigate('/sales-management')}
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  border: `1px solid ${alpha('#f57c00', 0.2)}`,
                  bgcolor: alpha('#f57c00', 0.05),
                  borderRadius: 2,
                  flex: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: alpha('#f57c00', 0.1),
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    bgcolor: alpha('#f57c00', 0.1),
                    color: '#f57c00',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AccessTimeIcon />
                </Box>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight="bold" color="#f57c00">
                    {stats.vendas_pendentes}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Vendas pendentes
                  </Typography>
                </Box>
                <ArrowForwardIcon sx={{ color: '#f57c00', fontSize: 20 }} />
              </Paper>
            )}
          </Stack>
        )}

        {/* Top Produtos - Mobile Compacto (melhorado) */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }} mb={2}>
          <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Top Produtos
                </Typography>
                <Chip
                  label="Esta semana"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main'
                  }}
                />
              </Box>
              <List disablePadding>
                {(topProdutos.length > 0 ? topProdutos.slice(0, 3) : Array(3).fill(null)).map((product, index) => (
                  <Box key={product ? product.name : index}>
                    <ListItem
                      sx={{
                        px: 0,
                        py: 1,
                        minHeight: 'auto',
                        opacity: product ? 1 : 0.5
                      }}
                    >
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 1,
                          bgcolor: product ? (index === 0 ? alpha(theme.palette.success.main, 0.15) : alpha(theme.palette.primary.main, 0.1)) : theme.palette.action.disabledBackground,
                          color: product ? (index === 0 ? 'success.main' : 'primary.main') : theme.palette.text.disabled,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          mr: 1.5,
                          flexShrink: 0
                        }}
                      >
                        {index + 1}
                      </Box>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={500} noWrap>
                            {product ? product.name : '---'}
                          </Typography>
                        }
                        secondary={
                          product ? (
                            <Typography variant="caption" color="text.secondary">
                              {product.quantidade_vendida} un · {formatCurrency(product.receita_total)}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              Sem dados
                            </Typography>
                          )
                        }
                        sx={{ my: 0 }}
                      />
                      {product && topProdutos[0] && (
                        <Box sx={{ width: 40, ml: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.max(10, (product.quantidade_vendida / (topProdutos[0].quantidade_vendida || 1)) * 100)}
                            sx={{ height: 5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                          />
                        </Box>
                      )}
                    </ListItem>
                    {index < 2 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Desktop: Gráficos e Top Produtos (melhorados) */}
        <Grid container spacing={3} sx={{ display: { xs: 'none', md: 'flex' } }}>
          <Grid item xs={12} md={5}>
            <ChartPanel
              title="Vendas por Categoria"
              icon={<ShowChartIcon color="primary" />}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom mb={2}>
                Últimos 7 dias
              </Typography>
              <Box height="100%" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                {pieChartData.labels.length > 0 ? (
                  <>
                    <Box width="100%" height={220}>
                      <Pie data={pieChartData} options={chartOptions} />
                    </Box>
                    <Box mt={2} width="100%">
                      {pieChartData.labels.map((label, idx) => {
                        let value = pieChartData.datasets[0].data[idx];
                        if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) value = 0;
                        const total = pieChartData.datasets[0].data.reduce((a, b) => (typeof b === 'number' && isFinite(b) ? a + b : a), 0);
                        const percent = total > 0 ? Math.round((value / total) * 100) : 0;
                        return (
                          <Box key={label} display="flex" alignItems="center" mb={0.5}>
                            <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: pieChartData.datasets[0].backgroundColor[idx], mr: 1 }} />
                            <Typography variant="body2" sx={{ minWidth: 90 }}>{label}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              {formatCurrency(value)}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                              {percent}%
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </>
                ) : (
                  <EmptyStatePanel
                    title="Nenhuma venda registrada"
                    subtitle="Não há dados suficientes para o gráfico neste período."
                  />
                )}
              </Box>
            </ChartPanel>
          </Grid>

          <Grid item xs={12} md={7}>
            <ChartPanel
              title="Top Produtos"
              icon={<CheckCircleIcon sx={{ color: 'success.main' }} />}
            >
              <Typography variant="body2" color="text.secondary" mb={2}>
                Mais vendidos da semana
              </Typography>
              <List disablePadding>
                {(topProdutos.length > 0 ? topProdutos.slice(0, 5) : Array(5).fill(null)).map((product, index) => (
                  <Box key={product ? product.name : index}>
                    <ListItem
                      sx={{
                        px: 0,
                        py: 1.5,
                        '&:hover': { bgcolor: product ? alpha(theme.palette.primary.main, 0.05) : undefined },
                        borderRadius: 1,
                        transition: 'all 0.2s ease',
                        opacity: product ? 1 : 0.5
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1,
                          bgcolor: product ? (index === 0 ? alpha(theme.palette.success.main, 0.15) : alpha(theme.palette.primary.main, 0.1)) : theme.palette.action.disabledBackground,
                          color: product ? (index === 0 ? 'success.main' : 'primary.main') : theme.palette.text.disabled,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          mr: 2
                        }}
                      >
                        #{index + 1}
                      </Box>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight={500}>
                            {product ? product.name : '---'}
                          </Typography>
                        }
                        secondary={
                          product ? (
                            <Box display="flex" gap={2} mt={0.5}>
                              <Typography variant="caption" color="text.secondary">
                                {product.quantidade_vendida} unidades
                              </Typography>
                              <Typography variant="caption" fontWeight={600} color="primary.main">
                                {formatCurrency(product.receita_total)}
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                {topProdutos[0] && product.quantidade_vendida > 0 ? `${Math.round((product.quantidade_vendida / (topProdutos[0].quantidade_vendida || 1)) * 100)}%` : ''}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              Sem dados
                            </Typography>
                          )
                        }
                      />
                      {product && topProdutos[0] && (
                        <Box sx={{ width: 60, ml: 2 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.max(10, (product.quantidade_vendida / (topProdutos[0].quantidade_vendida || 1)) * 100)}
                            sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                          />
                        </Box>
                      )}
                    </ListItem>
                    {index < 4 && <Divider sx={{ my: 0 }} />}
                  </Box>
                ))}
              </List>
            </ChartPanel>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Home;
