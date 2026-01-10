import api from '../lib/api';
import type { DashboardData, RelatorioVendas } from '../types/api';

export interface DashboardStats {
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

export interface VendasPorCategoria {
  categoria: string;
  quantidade: number;
  receita: number;
  quantidade_vendida?: number;
  receita_total?: number;
}

export interface TopProduto {
  produto_id: number;
  name: string;
  quantidade_vendida: number;
  receita_total: number;
}

export const dashboardService = {
  async buscarDadosDashboard(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/relatorios/dashboard');
    return response.data;
  },

  async buscarRelatorioVendas(periodo?: string, dataInicio?: string, dataFim?: string): Promise<RelatorioVendas> {
    const params = new URLSearchParams();
    if (periodo) params.append('periodo', periodo);
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);

    const response = await api.get<RelatorioVendas>(`/relatorios/vendas?${params.toString()}`);
    return response.data;
  },

  async buscarVendasSemana(): Promise<RelatorioVendas> {
    return this.buscarRelatorioVendas('semana');
  },

  async buscarVendasMes(): Promise<RelatorioVendas> {
    return this.buscarRelatorioVendas('mes');
  },

  async buscarTopProdutosSemana(): Promise<TopProduto[]> {
    const relatorio = await this.buscarVendasSemana();
    return relatorio.produtos_mais_vendidos;
  },

  async buscarVendasPorCategoria(periodo = 'semana'): Promise<VendasPorCategoria[]> {
    const response = await api.get<any[]>(`/relatorios/vendas-por-categoria?periodo=${periodo}`);
    return response.data.map(item => ({
      categoria: item.categoria,
      quantidade: item.quantidade_vendida,
      receita: item.receita_total
    }));
  },

  async buscarDadosCompletos() {
    try {
      const [dashboardStats, vendasSemana, vendasMes, topProdutos, vendasPorCategoria] = await Promise.all([
        this.buscarDadosDashboard(),
        this.buscarVendasSemana(),
        this.buscarVendasMes(),
        this.buscarTopProdutosSemana(),
        this.buscarVendasPorCategoria()
      ]);

      return {
        stats: dashboardStats,
        vendasSemana,
        vendasMes,
        topProdutos,
        vendasPorCategoria
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }
};

export default dashboardService;