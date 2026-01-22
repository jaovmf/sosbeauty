import { useState, useEffect, useCallback } from 'react';
import type { Produto, ConsultaEstoque } from '../types/api';
import produtosService from '../services/produtos';

export interface UseProdutosReturn {
  produtos: Produto[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  criarProduto: (produto: Omit<Produto, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  atualizarProduto: (id: number, produto: Partial<Produto>) => Promise<void>;
  atualizarProdutoComImagem: (id: number, formData: FormData) => Promise<void>;
  deletarProduto: (id: number) => Promise<void>;
  buscarProduto: (id: number) => Promise<Produto | null>;
  consultarEstoque: (filtros?: ConsultaEstoque) => Promise<void>;
}

export const useProdutos = (filtroInicial?: ConsultaEstoque): UseProdutosReturn => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar produtos
  const fetchProdutos = useCallback(async (filtros?: ConsultaEstoque) => {
    try {
      setLoading(true);
      setError(null);

      if (filtros) {
        const result = await produtosService.consultarEstoque(filtros);
        setProdutos(result.produtos);
      } else {
        const result = await produtosService.listar();
        setProdutos(result);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar produtos');
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para recarregar dados
  const refetch = useCallback(() => {
    return fetchProdutos(filtroInicial);
  }, [fetchProdutos, filtroInicial]);

  // Criar produto
  const criarProduto = useCallback(async (produto: Omit<Produto, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      await produtosService.criar(produto);
      await refetch(); // Recarregar lista
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Erro ao criar produto';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [refetch]);

  // Atualizar produto
  const atualizarProduto = useCallback(async (id: number, produto: Partial<Produto>) => {
    try {
      setError(null);
      await produtosService.atualizar(id, produto);
      await refetch(); // Recarregar lista
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Erro ao atualizar produto';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [refetch]);

  // Atualizar produto com imagem
  const atualizarProdutoComImagem = useCallback(async (id: number, formData: FormData) => {
    try {
      setError(null);
      await produtosService.atualizarComImagem(id, formData);
      await refetch(); // Recarregar lista
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Erro ao atualizar produto';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [refetch]);

  // Deletar produto
  const deletarProduto = useCallback(async (id: number) => {
    try {
      setError(null);
      await produtosService.deletar(id);
      await refetch(); // Recarregar lista
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Erro ao deletar produto';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [refetch]);

  // Buscar produto específico
  const buscarProduto = useCallback(async (id: number): Promise<Produto | null> => {
    try {
      setError(null);
      return await produtosService.buscarPorId(id);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Erro ao buscar produto';
      setError(errorMessage);
      return null;
    }
  }, []);

  // Consultar estoque com filtros
  const consultarEstoque = useCallback(async (filtros?: ConsultaEstoque) => {
    await fetchProdutos(filtros);
  }, [fetchProdutos]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchProdutos(filtroInicial);
  }, [fetchProdutos, filtroInicial]);

  return {
    produtos,
    loading,
    error,
    refetch,
    criarProduto,
    atualizarProduto,
    atualizarProdutoComImagem,
    deletarProduto,
    buscarProduto,
    consultarEstoque,
  };
};

// Hook específico para estoque baixo
export const useProdutosEstoqueBaixo = () => {
  return useProdutos({ estoque_baixo: true });
};

// Hook específico para uma categoria
export const useProdutosPorCategoria = (categoria: string) => {
  return useProdutos({ categoria });
};

// Hook específico para catálogo público (sem autenticação)
export const useCatalogo = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalogo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await produtosService.listarCatalogo();
      setProdutos(result);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar catálogo');
      console.error('Erro ao buscar catálogo:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogo();
  }, [fetchCatalogo]);

  return { produtos, loading, error, refetch: fetchCatalogo };
};

export default useProdutos;