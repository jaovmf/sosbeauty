import api from '../lib/api';

export interface RelatorioPeriodo {
  periodo?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface RelatorioVendas {
  periodo: string;
  total_vendas: number;
  quantidade_vendas: number;
  ticket_medio: number;
  produtos_mais_vendidos: Array<{
    produto_id: number;
    name: string;
    quantidade_vendida: number;
    receita_total: number;
  }>;
}

export interface DashboardData {
  vendas_hoje: {
    count: number;
    total: number;
  };
  vendas_mes: {
    count: number;
    total: number;
  };
  produtos_estoque_baixo: number;
  total_clientes: number;
  vendas_pendentes: number;
}

export interface VendaDetalhada {
  id: number;
  cliente_id: number;
  total: number;
  observacoes?: string;
  status: string;
  created_at: string;
  updated_at: string;
  cliente_nome: string;
  itens: Array<{
    id: number;
    venda_id: number;
    produto_id: number;
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
    produto_nome: string;
  }>;
}

// Interface para filtros de vendas
export interface FiltrosVenda {
  cliente_id?: string;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
}

class RelatoriosService {
  async obterRelatorioVendas(params: RelatorioPeriodo): Promise<RelatorioVendas> {
    try {
      const response = await api.get('/relatorios/vendas', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter relatório de vendas:', error);
      throw error;
    }
  }

  async obterDashboard(): Promise<DashboardData> {
    try {
      const response = await api.get('/relatorios/dashboard');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter dados do dashboard:', error);
      throw error;
    }
  }

  async obterVendas(filtros: FiltrosVenda = {}): Promise<VendaDetalhada[]> {
    try {
      const response = await api.get('/vendas', { params: filtros });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter vendas:', error);
      throw error;
    }
  }

  async obterVendaPorId(id: number): Promise<VendaDetalhada> {
    try {
      const response = await api.get(`/vendas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter venda por ID:', error);
      throw error;
    }
  }

  async obterClientesAtivos(periodo?: string) {
    try {
      const params = periodo ? { periodo } : {};
      const response = await api.get('/relatorios/clientes-ativos', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter clientes ativos:', error);
      throw error;
    }
  }

  async obterProdutosEstoqueBaixo(limite = 10) {
    try {
      const response = await api.get('/relatorios/estoque-baixo', {
        params: { limite }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter produtos com estoque baixo:', error);
      throw error;
    }
  }

  async obterVendasPorPeriodo(tipo = 'diario', data_inicio?: string, data_fim?: string) {
    try {
      const params: any = { tipo };
      if (data_inicio) params.data_inicio = data_inicio;
      if (data_fim) params.data_fim = data_fim;

      const response = await api.get('/relatorios/vendas-por-periodo', { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter vendas por período:', error);
      throw error;
    }
  }
}

export default new RelatoriosService();