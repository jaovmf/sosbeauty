import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonOff as PersonOffIcon,
  PersonAddDisabled as PersonAddDisabledIcon,
  AttachMoney as AttachMoneyIcon,
  Search as SearchIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { useClientes } from '../../hooks/useClientes';
import type { ClienteCRM } from '../../types/api';
import { formatCurrency } from '../../utils/formatCurrency';

const CRM = () => {
  const { obterCRM, loading, error } = useClientes();

  const [search, setSearch] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<'all' | 'ativo' | 'inativo' | 'sem_compras'>('all');
  const [diasInativo, setDiasInativo] = useState(60);
  const [clientes, setClientes] = useState<ClienteCRM[]>([]);
  const [resumo, setResumo] = useState({
    total_clientes: 0,
    ativos: 0,
    inativos: 0,
    sem_compras: 0,
    faturamento_total: 0
  });

  const carregarCRM = async (filtroSearch?: string, filtroDias?: number) => {
    const data = await obterCRM(filtroSearch, filtroDias ?? diasInativo);
    if (data) {
      setClientes(data.clientes || []);
      setResumo(data.resumo);
    }
  };

  useEffect(() => {
    carregarCRM();
  }, []);

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((cliente) => {
      const matchStatus = statusFiltro === 'all' || cliente.status_relacionamento === statusFiltro;
      return matchStatus;
    });
  }, [clientes, statusFiltro]);

  const getStatusChip = (status: ClienteCRM['status_relacionamento']) => {
    if (status === 'ativo') {
      return <Chip label="Ativo" color="success" size="small" />;
    }

    if (status === 'inativo') {
      return <Chip label="Inativo" color="warning" size="small" />;
    }

    return <Chip label="Sem compras" color="default" size="small" />;
  };

  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 70) return 'success';
    if (score >= 40) return 'warning';
    return 'error';
  };

  return (
    <Container maxWidth="xl" sx={{ pb: { xs: 10, md: 3 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Box>
        <Box mb={3}>
          <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
            CRM Simples
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Visão de relacionamento com clientes para ação comercial rápida
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          mb={2}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
            gap: 2
          }}
        >
          <Box>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Clientes</Typography>
                    <Typography variant="h6" fontWeight="bold">{resumo.total_clientes}</Typography>
                  </Box>
                  <PeopleIcon color="primary" />
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">Ativos</Typography>
                    <Typography variant="h6" fontWeight="bold">{resumo.ativos}</Typography>
                  </Box>
                  <PeopleIcon color="success" />
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">Inativos</Typography>
                    <Typography variant="h6" fontWeight="bold">{resumo.inativos}</Typography>
                  </Box>
                  <PersonOffIcon color="warning" />
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">Sem Compras</Typography>
                    <Typography variant="h6" fontWeight="bold">{resumo.sem_compras}</Typography>
                  </Box>
                  <PersonAddDisabledIcon color="disabled" />
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary">Faturamento</Typography>
                    <Typography variant="h6" fontWeight="bold">{formatCurrency(resumo.faturamento_total)}</Typography>
                  </Box>
                  <AttachMoneyIcon color="success" />
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '5fr 3fr 4fr' },
              gap: 2,
              alignItems: 'center'
            }}
          >
            <Box>
              <TextField
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, cidade, telefone ou email"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                type="number"
                label="Dias para inativo"
                value={diasInativo}
                inputProps={{ min: 1, max: 365 }}
                onChange={(e) => setDiasInativo(parseInt(e.target.value || '60', 10))}
              />
            </Box>

            <Box>
              <Stack direction="row" spacing={1}>
                <Chip
                  label="Atualizar"
                  color="primary"
                  onClick={() => carregarCRM(search, diasInativo)}
                  clickable
                />
              </Stack>
            </Box>
          </Box>

          <Box mt={2}>
            <ToggleButtonGroup
              size="small"
              value={statusFiltro}
              exclusive
              onChange={(_, value) => value && setStatusFiltro(value)}
            >
              <ToggleButton value="all">Todos</ToggleButton>
              <ToggleButton value="ativo">Ativos</ToggleButton>
              <ToggleButton value="inativo">Inativos</ToggleButton>
              <ToggleButton value="sem_compras">Sem compras</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 2
            }}
          >
            {clientesFiltrados.map((cliente) => (
              <Box key={cliente.id}>
                <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle1" fontWeight="bold">{cliente.name}</Typography>
                      {getStatusChip(cliente.status_relacionamento)}
                    </Stack>

                    <Typography variant="caption" color="text.secondary" display="block">
                      {cliente.phone || 'Sem telefone'} {cliente.city ? `• ${cliente.city}` : ''}
                    </Typography>

                    <Stack direction="row" spacing={1} mt={1.5} mb={1.5} alignItems="center">
                      <PsychologyIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">Score CRM</Typography>
                      <Chip
                        label={cliente.score}
                        size="small"
                        color={getScoreColor(cliente.score)}
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Stack>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 1
                      }}
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary">Compras</Typography>
                        <Typography variant="body2" fontWeight={600}>{cliente.total_compras}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Ticket Médio</Typography>
                        <Typography variant="body2" fontWeight={600}>{formatCurrency(cliente.ticket_medio)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Valor Total</Typography>
                        <Typography variant="body2" fontWeight={600}>{formatCurrency(cliente.valor_total)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Última compra</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {cliente.ultima_compra
                            ? `${new Date(cliente.ultima_compra).toLocaleDateString('pt-BR')} (${cliente.dias_sem_comprar}d)`
                            : 'Nunca comprou'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default CRM;
