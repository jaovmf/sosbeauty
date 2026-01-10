import { useState, useCallback } from 'react';
import { vendasService } from '../services/vendas';
import type { Venda, NovaVendaRequest, FiltroVendas } from '../types/api';

export const useVendas = () => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const listarVendas = useCallback(async (filtros?: FiltroVendas) => {
    setLoading(true);
    setError('');
    try {
      const result = await vendasService.listar(filtros);
      setVendas(result);
    } catch (err: any) {
      console.error('Erro ao carregar vendas:', err);
      setError(err.response?.data?.error || 'Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarVendaPorId = useCallback(async (id: number): Promise<Venda | null> => {
    setLoading(true);
    setError('');
    try {
      const result = await vendasService.buscarPorId(id);
      return result;
    } catch (err: any) {
      console.error('Erro ao buscar venda:', err);
      setError(err.response?.data?.error || 'Erro ao buscar venda');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const criarVenda = useCallback(async (venda: NovaVendaRequest): Promise<{ id: number; total: number; message: string } | null> => {
    setLoading(true);
    setError('');
    try {
      const result = await vendasService.criar(venda);
      // Atualizar lista de vendas após criar
      await listarVendas();
      return result;
    } catch (err: any) {
      console.error('Erro ao criar venda:', err);
      setError(err.response?.data?.error || 'Erro ao criar venda');
      return null;
    } finally {
      setLoading(false);
    }
  }, [listarVendas]);

  const atualizarStatusVenda = useCallback(async (id: number, status: 'pendente' | 'pago' | 'cancelado'): Promise<boolean> => {
    setLoading(true);
    setError('');
    try {
      await vendasService.atualizarStatus(id, status);
      // Atualizar lista de vendas após atualizar status
      await listarVendas();
      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar status da venda:', err);
      setError(err.response?.data?.error || 'Erro ao atualizar status da venda');
      return false;
    } finally {
      setLoading(false);
    }
  }, [listarVendas]);

  const buscarVendasPorCliente = useCallback(async (clienteId: number) => {
    setLoading(true);
    setError('');
    try {
      const result = await vendasService.buscarPorCliente(clienteId);
      setVendas(result);
    } catch (err: any) {
      console.error('Erro ao buscar vendas do cliente:', err);
      setError(err.response?.data?.error || 'Erro ao buscar vendas do cliente');
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarVendasPendentes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await vendasService.buscarPendentes();
      setVendas(result);
    } catch (err: any) {
      console.error('Erro ao buscar vendas pendentes:', err);
      setError(err.response?.data?.error || 'Erro ao buscar vendas pendentes');
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarVendasPorPeriodo = useCallback(async (dataInicio: string, dataFim: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await vendasService.buscarPorPeriodo(dataInicio, dataFim);
      setVendas(result);
    } catch (err: any) {
      console.error('Erro ao buscar vendas por período:', err);
      setError(err.response?.data?.error || 'Erro ao buscar vendas por período');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    vendas,
    loading,
    error,
    listarVendas,
    buscarVendaPorId,
    criarVenda,
    atualizarStatusVenda,
    buscarVendasPorCliente,
    buscarVendasPendentes,
    buscarVendasPorPeriodo,
    clearError: () => setError(''),
  };
};

export default useVendas;