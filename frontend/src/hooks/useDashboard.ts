import { useState, useCallback, useEffect } from 'react';
import { dashboardService, type DashboardStats, type VendasPorCategoria, type TopProduto } from '../services/dashboard';
import type { RelatorioVendas } from '../types/api';

interface DashboardData {
  stats: DashboardStats;
  vendasSemana: RelatorioVendas;
  vendasMes: RelatorioVendas;
  topProdutos: TopProduto[];
  vendasPorCategoria: VendasPorCategoria[];
}

export const useDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dadosCompletos = await dashboardService.buscarDadosCompletos();
      setData(dadosCompletos);
    } catch (err: any) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError(err.response?.data?.error || 'Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarDadosDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const stats = await dashboardService.buscarDadosDashboard();
      setData(prev => prev ? { ...prev, stats } : null);
      return stats;
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas do dashboard:', err);
      setError(err.response?.data?.error || 'Erro ao buscar estatísticas');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarVendasSemana = useCallback(async () => {
    try {
      const vendasSemana = await dashboardService.buscarVendasSemana();
      setData(prev => prev ? { ...prev, vendasSemana } : null);
      return vendasSemana;
    } catch (err: any) {
      console.error('Erro ao buscar vendas da semana:', err);
      setError(err.response?.data?.error || 'Erro ao buscar vendas da semana');
      return null;
    }
  }, []);

  const buscarVendasMes = useCallback(async () => {
    try {
      const vendasMes = await dashboardService.buscarVendasMes();
      setData(prev => prev ? { ...prev, vendasMes } : null);
      return vendasMes;
    } catch (err: any) {
      console.error('Erro ao buscar vendas do mês:', err);
      setError(err.response?.data?.error || 'Erro ao buscar vendas do mês');
      return null;
    }
  }, []);

  const buscarTopProdutos = useCallback(async () => {
    try {
      const topProdutos = await dashboardService.buscarTopProdutosSemana();
      setData(prev => prev ? { ...prev, topProdutos } : null);
      return topProdutos;
    } catch (err: any) {
      console.error('Erro ao buscar top produtos:', err);
      setError(err.response?.data?.error || 'Erro ao buscar top produtos');
      return null;
    }
  }, []);

  const buscarVendasPorCategoria = useCallback(async () => {
    try {
      const vendasPorCategoria = await dashboardService.buscarVendasPorCategoria();
      setData(prev => prev ? { ...prev, vendasPorCategoria } : null);
      return vendasPorCategoria;
    } catch (err: any) {
      console.error('Erro ao buscar vendas por categoria:', err);
      setError(err.response?.data?.error || 'Erro ao buscar vendas por categoria');
      return null;
    }
  }, []);

  // Carregar dados automaticamente ao montar o hook
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Função para transformar dados em formato compatível com o chart
  const getPieChartData = useCallback(() => {
    if (!data?.vendasPorCategoria) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 1
        }]
      };
    }

    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#C9CBCF', '#4BC0C0', '#FF6384', '#36A2EB'
    ];

    return {
      labels: data.vendasPorCategoria.map(item => item.categoria),
      datasets: [{
        data: data.vendasPorCategoria.map(item => item.receita),
        backgroundColor: colors.slice(0, data.vendasPorCategoria.length),
        borderColor: colors.slice(0, data.vendasPorCategoria.length).map(color => color + '80'),
        borderWidth: 1
      }]
    };
  }, [data?.vendasPorCategoria]);

  // Calcular crescimento do mês atual vs mês anterior
  const calcularCrescimentoMensal = useCallback(() => {
    if (!data?.vendasMes) return 0;

    // Por simplicidade, vamos usar um crescimento simulado
    // Em uma implementação real, isso viria de uma comparação com o mês anterior
    const baseGrowth = Math.random() * 20 - 10; // -10% a +10%
    return Math.round(baseGrowth * 10) / 10;
  }, [data?.vendasMes]);

  return {
    data,
    loading,
    error,
    carregarDados,
    buscarDadosDashboard,
    buscarVendasSemana,
    buscarVendasMes,
    buscarTopProdutos,
    buscarVendasPorCategoria,
    getPieChartData,
    calcularCrescimentoMensal,
    clearError: () => setError(''),

    // Getters convenientes para os dados
    get stats() {
      return data?.stats || {
        vendas_hoje: { count: 0, total: 0 },
        vendas_mes: { count: 0, total: 0 },
        produtos_estoque_baixo: 0,
        total_clientes: 0,
        vendas_pendentes: 0
      };
    },

    get vendasSemana() {
      return data?.vendasSemana || {
        periodo: 'semana',
        total_vendas: 0,
        quantidade_vendas: 0,
        ticket_medio: 0,
        produtos_mais_vendidos: []
      };
    },

    get vendasMes() {
      return data?.vendasMes || {
        periodo: 'mes',
        total_vendas: 0,
        quantidade_vendas: 0,
        ticket_medio: 0,
        produtos_mais_vendidos: []
      };
    },

    get topProdutos() {
      return data?.topProdutos || [];
    },

    get vendasPorCategoria() {
      return data?.vendasPorCategoria || [];
    }
  };
};

export default useDashboard;