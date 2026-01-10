import api from '../lib/api';
import type {
  RelatorioVendas,
  RelatorioEstoqueBaixo,
  RelatorioClientesAtivos,
  DashboardData
} from '../types/api';

export const relatoriosService = {
  // Relatório de vendas
  async vendas(params?: {
    periodo?: 'hoje' | 'semana' | 'mes' | 'ano';
    data_inicio?: string;
    data_fim?: string;
  }): Promise<RelatorioVendas> {
    const urlParams = new URLSearchParams();

    if (params?.periodo) {
      urlParams.append('periodo', params.periodo);
    }
    if (params?.data_inicio) {
      urlParams.append('data_inicio', params.data_inicio);
    }
    if (params?.data_fim) {
      urlParams.append('data_fim', params.data_fim);
    }

    const response = await api.get<RelatorioVendas>(`/relatorios/vendas?${urlParams.toString()}`);
    return response.data;
  },

  // Produtos com estoque baixo
  async estoqueBaixo(limite: number = 10): Promise<RelatorioEstoqueBaixo> {
    const response = await api.get<RelatorioEstoqueBaixo>(`/relatorios/estoque-baixo?limite=${limite}`);
    return response.data;
  },

  // Clientes mais ativos
  async clientesAtivos(periodo?: 'mes' | 'trimestre' | 'ano'): Promise<RelatorioClientesAtivos> {
    const params = new URLSearchParams();
    if (periodo) {
      params.append('periodo', periodo);
    }

    const response = await api.get<RelatorioClientesAtivos>(`/relatorios/clientes-ativos?${params.toString()}`);
    return response.data;
  },

  // Vendas por período
  async vendasPorPeriodo(params?: {
    tipo?: 'diario' | 'semanal' | 'mensal';
    data_inicio?: string;
    data_fim?: string;
  }): Promise<{
    tipo_periodo: string;
    dados: Array<{
      periodo: string;
      quantidade_vendas: number;
      total_vendas: number;
    }>;
  }> {
    const urlParams = new URLSearchParams();

    if (params?.tipo) {
      urlParams.append('tipo', params.tipo);
    }
    if (params?.data_inicio) {
      urlParams.append('data_inicio', params.data_inicio);
    }
    if (params?.data_fim) {
      urlParams.append('data_fim', params.data_fim);
    }

    const response = await api.get(`/relatorios/vendas-por-periodo?${urlParams.toString()}`);
    return response.data;
  },

  // Dados para dashboard
  async dashboard(): Promise<DashboardData> {
    const response = await api.get<DashboardData>('/relatorios/dashboard');
    return response.data;
  },
};

export default relatoriosService;