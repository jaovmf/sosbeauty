import api from '../lib/api';
import type { Venda, NovaVendaRequest, FiltroVendas } from '../types/api';

export const vendasService = {
  // Listar vendas com filtros
  async listar(filtros?: FiltroVendas): Promise<Venda[]> {
    const params = new URLSearchParams();

    if (filtros?.cliente_id) {
      params.append('cliente_id', filtros.cliente_id.toString());
    }
    if (filtros?.status) {
      params.append('status', filtros.status);
    }
    if (filtros?.data_inicio) {
      params.append('data_inicio', filtros.data_inicio);
    }
    if (filtros?.data_fim) {
      params.append('data_fim', filtros.data_fim);
    }

    const response = await api.get<Venda[]>(`/vendas?${params.toString()}`);
    return response.data;
  },

  // Buscar venda por ID (com itens)
  async buscarPorId(id: number): Promise<Venda> {
    const response = await api.get<Venda>(`/vendas/${id}`);
    return response.data;
  },

  // Criar nova venda
  async criar(venda: NovaVendaRequest): Promise<{ id: number; total: number; message: string }> {
    const response = await api.post('/vendas', venda);
    return response.data;
  },

  // Atualizar status da venda
  async atualizarStatus(id: number, status: 'pendente' | 'pago' | 'cancelado'): Promise<{ message: string }> {
    const response = await api.put(`/vendas/${id}/status`, { status });
    return response.data;
  },

  // Buscar vendas por cliente
  async buscarPorCliente(clienteId: number): Promise<Venda[]> {
    return this.listar({ cliente_id: clienteId });
  },

  // Buscar vendas pendentes
  async buscarPendentes(): Promise<Venda[]> {
    return this.listar({ status: 'pendente' });
  },

  // Buscar vendas por período
  async buscarPorPeriodo(dataInicio: string, dataFim: string): Promise<Venda[]> {
    return this.listar({ data_inicio: dataInicio, data_fim: dataFim });
  },
};

export default vendasService;