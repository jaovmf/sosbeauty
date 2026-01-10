import { useState, useCallback } from 'react';
import { clientesService } from '../services/clientes';
import type { Cliente } from '../types/api';

export const useClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const listarClientes = useCallback(async (search?: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await clientesService.listar(search);
      setClientes(result);
    } catch (err: any) {
      console.error('Erro ao carregar clientes:', err);
      setError(err.response?.data?.error || 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarClientePorId = useCallback(async (id: number): Promise<Cliente | null> => {
    setLoading(true);
    setError('');
    try {
      const result = await clientesService.buscarPorId(id);
      return result;
    } catch (err: any) {
      console.error('Erro ao buscar cliente:', err);
      setError(err.response?.data?.error || 'Erro ao buscar cliente');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const criarCliente = useCallback(async (cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>): Promise<any | null> => {
    setLoading(true);
    setError('');
    try {
      const result = await clientesService.criar(cliente);
      // Atualizar lista de clientes após criar
      await listarClientes();
      return result;
    } catch (err: any) {
      console.error('Erro ao criar cliente:', err);
      setError(err.response?.data?.error || 'Erro ao criar cliente');
      return null;
    } finally {
      setLoading(false);
    }
  }, [listarClientes]);

  const atualizarCliente = useCallback(async (id: number, cliente: Partial<Cliente>): Promise<boolean> => {
    setLoading(true);
    setError('');
    try {
      await clientesService.atualizar(id, cliente);
      // Atualizar lista de clientes após atualizar
      await listarClientes();
      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar cliente:', err);
      setError(err.response?.data?.error || 'Erro ao atualizar cliente');
      return false;
    } finally {
      setLoading(false);
    }
  }, [listarClientes]);

  const deletarCliente = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError('');
    try {
      await clientesService.deletar(id);
      // Atualizar lista de clientes após deletar
      await listarClientes();
      return true;
    } catch (err: any) {
      console.error('Erro ao deletar cliente:', err);
      setError(err.response?.data?.error || 'Erro ao deletar cliente');
      return false;
    } finally {
      setLoading(false);
    }
  }, [listarClientes]);

  const buscarClientes = useCallback(async (termo: string): Promise<Cliente[]> => {
    setLoading(true);
    setError('');
    try {
      const result = await clientesService.buscar(termo);
      return result;
    } catch (err: any) {
      console.error('Erro ao buscar clientes:', err);
      setError(err.response?.data?.error || 'Erro ao buscar clientes');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    clientes,
    loading,
    error,
    listarClientes,
    buscarClientePorId,
    criarCliente,
    atualizarCliente,
    deletarCliente,
    buscarClientes,
    clearError: () => setError(''),
  };
};

export default useClientes;