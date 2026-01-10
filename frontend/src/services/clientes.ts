import api from '../lib/api';
import type { Cliente } from '../types/api';

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
};

export default clientesService;