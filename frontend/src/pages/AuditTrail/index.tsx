import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Download as DownloadIcon,
  HistoryEdu as HistoryEduIcon,
  TravelExplore as TravelExploreIcon,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/Layout/PageHeader';
import SectionBlock from '../../components/Management/SectionBlock';
import OperationalNotice from '../../components/Management/OperationalNotice';
import EmptyStatePanel from '../../components/Management/EmptyStatePanel';
import auditoriaService from '../../services/auditoria';
import type { AuditLogItem } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';

const ACTION_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'produto_atualizado', label: 'Produto atualizado' },
  { value: 'estoque_baixado_venda', label: 'Estoque baixado na venda' },
  { value: 'estoque_baixado_confirmacao', label: 'Estoque baixado na confirmação' },
  { value: 'venda_criada_paga', label: 'Venda criada paga' },
  { value: 'venda_confirmada', label: 'Venda confirmada' },
  { value: 'pre_venda_cancelada', label: 'Pré-venda cancelada' },
  { value: 'venda_status_atualizado', label: 'Status da venda atualizado' },
];

const ACTION_LABELS: Record<string, string> = {
  produto_atualizado: 'Produto atualizado',
  estoque_baixado_venda: 'Estoque baixado na venda',
  estoque_baixado_confirmacao: 'Estoque baixado na confirmação',
  venda_criada_paga: 'Venda criada paga',
  venda_confirmada: 'Venda confirmada',
  pre_venda_cancelada: 'Pré-venda cancelada',
  venda_status_atualizado: 'Status da venda atualizado',
};

const FIELD_LABELS: Record<string, string> = {
  price: 'Preço',
  stock: 'Estoque',
  promotional_price: 'Preço promocional',
  status: 'Status',
  total: 'Total',
};

const ENTITY_LABELS: Record<'produto' | 'venda', string> = {
  produto: 'Produto',
  venda: 'Venda',
};

const isChangeTransition = (value: unknown): value is { from: unknown; to: unknown } => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return 'from' in value && 'to' in value;
};

const formatAuditValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime()) && value.includes('T')) {
      return date.toLocaleString('pt-BR');
    }

    return value;
  }

  return JSON.stringify(value);
};

const AuditTrail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { usuario } = useAuth();
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [entityType, setEntityType] = useState<'produto' | 'venda' | ''>(() => {
    const value = searchParams.get('entityType');
    return value === 'produto' || value === 'venda' ? value : '';
  });
  const [action, setAction] = useState(() => searchParams.get('action') || '');
  const [actorName, setActorName] = useState(() => searchParams.get('actorName') || '');
  const [entityId, setEntityId] = useState(() => searchParams.get('entityId') || '');
  const [startDate, setStartDate] = useState(() => searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(() => searchParams.get('endDate') || '');
  const [page, setPage] = useState(() => Math.max(Number(searchParams.get('page') || '1') - 1, 0));
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  const canAccess = ['super_admin', 'admin', 'gerente'].includes(usuario?.role || '');
  const availableActions = useMemo(() => {
    if (!entityType) {
      return ACTION_OPTIONS;
    }

    const allowed = entityType === 'produto'
      ? ['produto_atualizado', 'estoque_baixado_venda', 'estoque_baixado_confirmacao']
      : ['venda_criada_paga', 'venda_confirmada', 'pre_venda_cancelada', 'venda_status_atualizado'];

    return ACTION_OPTIONS.filter((option) => !option.value || allowed.includes(option.value));
  }, [entityType]);

  const loadAudit = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await auditoriaService.listar({
        entityType,
        action,
        actorName,
        entityId,
        startDate,
        endDate,
        page: page + 1,
        limit: rowsPerPage,
      });

      setItems(response.items);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar auditoria.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      loadAudit();
    }
  }, [entityType, action, actorName, entityId, startDate, endDate, page, rowsPerPage, canAccess]);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (entityType) nextParams.set('entityType', entityType);
    if (action) nextParams.set('action', action);
    if (actorName) nextParams.set('actorName', actorName);
    if (entityId) nextParams.set('entityId', entityId);
    if (startDate) nextParams.set('startDate', startDate);
    if (endDate) nextParams.set('endDate', endDate);
    if (page > 0) nextParams.set('page', String(page + 1));

    setSearchParams(nextParams, { replace: true });
  }, [entityType, action, actorName, entityId, startDate, endDate, page, setSearchParams]);

  const clearFilters = () => {
    setEntityType('');
    setAction('');
    setActorName('');
    setEntityId('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const formatDateTime = (value: string) => new Date(value).toLocaleString('pt-BR');

  const getActionLabel = (value: string) => ACTION_LABELS[value] || value;

  const renderChangeSummary = (changes: AuditLogItem['changes']) => {
    const entries = Object.entries(changes || {}).filter(([, value]) => value !== undefined);

    if (entries.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          Sem detalhamento disponível.
        </Typography>
      );
    }

    return (
      <Stack spacing={0.5}>
        {entries.map(([field, value]) => {
          const label = FIELD_LABELS[field] || field;

          if (isChangeTransition(value)) {
            return (
              <Typography key={field} variant="body2" color="text.secondary">
                <strong>{label}:</strong> {formatAuditValue(value.from)} {'->'} {formatAuditValue(value.to)}
              </Typography>
            );
          }

          return (
            <Typography key={field} variant="body2" color="text.secondary">
              <strong>{label}:</strong> {formatAuditValue(value)}
            </Typography>
          );
        })}
      </Stack>
    );
  };

  const handleEntityDrilldown = (item: AuditLogItem) => {
    setEntityType(item.entityType);
    setEntityId(item.entityId);
    setPage(0);
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const response = await auditoriaService.listar({
        entityType,
        action,
        actorName,
        entityId,
        startDate,
        endDate,
        page: 1,
        limit: Math.max(total, 1),
      });

      const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const rows = response.items.map((item) => [
        formatDateTime(item.createdAt),
        ENTITY_LABELS[item.entityType],
        item.entityId,
        getActionLabel(item.action),
        item.actorName || '-',
        Object.entries(item.changes || {})
          .filter(([, value]) => value !== undefined)
          .map(([field, value]) => {
            const label = FIELD_LABELS[field] || field;
            return isChangeTransition(value)
              ? `${label}: ${formatAuditValue(value.from)} -> ${formatAuditValue(value.to)}`
              : `${label}: ${formatAuditValue(value)}`;
          })
          .join(' | '),
      ]);

      const csv = [
        ['Data', 'Entidade', 'ID da entidade', 'Ação', 'Usuário', 'Alterações'].map(escapeCsv).join(';'),
        ...rows.map((row) => row.map(escapeCsv).join(';')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao exportar auditoria.');
    } finally {
      setExporting(false);
    }
  };

  if (!canAccess) {
    return (
      <Container maxWidth="xl">
        <Box p={3}>
          <OperationalNotice
            severity="error"
            title="Acesso restrito"
            message="Somente gerentes, administradores e super administradores podem acessar a auditoria."
            mb={0}
          />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box p={{ xs: 2, md: 3 }}>
        <PageHeader
          title="Auditoria"
          subtitle="Histórico operacional de alterações em produtos e vendas"
          icon={<HistoryEduIcon fontSize="small" />}
          actions={
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportCsv}
              disabled={loading || exporting || total === 0}
            >
              {exporting ? 'Exportando...' : 'Exportar CSV'}
            </Button>
          }
        />

        {error && (
          <OperationalNotice
            severity="error"
            title="Falha ao carregar auditoria"
            message={error}
            onClose={() => setError('')}
          />
        )}

        <SectionBlock
          title="Filtros"
          actions={
            <Button size="small" variant="outlined" onClick={clearFilters}>
              Limpar filtros
            </Button>
          }
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Entidade"
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value as 'produto' | 'venda' | '');
                  setPage(0);
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="produto">Produto</MenuItem>
                <MenuItem value="venda">Venda</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Ação"
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(0);
                }}
              >
                {availableActions.map((option) => (
                  <MenuItem key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Usuário"
                value={actorName}
                onChange={(e) => {
                  setActorName(e.target.value);
                  setPage(0);
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="ID da entidade"
                value={entityId}
                onChange={(e) => {
                  setEntityId(e.target.value);
                  setPage(0);
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Data inicial"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Data final"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </SectionBlock>

        <SectionBlock
          title="Eventos"
          actions={
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {entityId && <Chip label={`ID: ${entityId}`} size="small" variant="outlined" />}
              <Chip label={`${total} registro(s)`} color="primary" variant="outlined" size="small" />
            </Stack>
          }
          showHeaderDivider
          padding={0}
        >
          {loading ? (
            <Box py={8} display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <EmptyStatePanel
              title="Nenhum registro encontrado"
              subtitle="Ajuste os filtros para localizar eventos de auditoria."
            />
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data</TableCell>
                      <TableCell>Entidade</TableCell>
                      <TableCell>Ação</TableCell>
                      <TableCell>Usuário</TableCell>
                      <TableCell>Alterações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item._id} hover>
                        <TableCell>
                          <Typography variant="body2">{formatDateTime(item.createdAt)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip label={ENTITY_LABELS[item.entityType]} size="small" variant="outlined" />
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<TravelExploreIcon fontSize="small" />}
                              onClick={() => handleEntityDrilldown(item)}
                              sx={{ minWidth: 0, px: 0.5 }}
                            >
                              {item.entityId}
                            </Button>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{getActionLabel(item.action)}</Typography>
                        </TableCell>
                        <TableCell>{item.actorName || '-'}</TableCell>
                        <TableCell>{renderChangeSummary(item.changes)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_event, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 20, 50, 100]}
                labelRowsPerPage="Linhas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </>
          )}
        </SectionBlock>
      </Box>
    </Container>
  );
};

export default AuditTrail;
