import api from '../lib/api';
import type { Cliente, ClienteCRMResponse } from '../types/api';

export const clientesService = {
  async listar(search?: string): Promise<Cliente[]> {
    const params = new URLSearchParams();
    if (search) {
      params.append('search', search);
    }

    const response = await api.get<Cliente[]>(`/clientes?${params.toString()}`);
    return response.data;
  },

  async buscarPorId(id: number): Promise<Cliente> {
    const response = await api.get<Cliente>(`/clientes/${id}`);
    return response.data;
  },

  async criar(cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>): Promise<any> {
    const response = await api.post('/clientes', cliente);
    return response.data;
  },

  async atualizar(id: number, cliente: Partial<Cliente>): Promise<{ message: string }> {
    const response = await api.put(`/clientes/${id}`, cliente);
    return response.data;
  },

  async deletar(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/clientes/${id}`);
    return response.data;
  },
  
  async buscar(termo: string): Promise<Cliente[]> {
    return this.listar(termo);
  },

  async obterCRM(search?: string, diasInativo: number = 60): Promise<ClienteCRMResponse> {
    const params = new URLSearchParams();
    if (search) {
      params.append('search', search);
    }
    params.append('dias_inativo', String(diasInativo));

    const response = await api.get<ClienteCRMResponse>(`/clientes/crm/resumo?${params.toString()}`);
    return response.data;
  },
};

export default clientesService;