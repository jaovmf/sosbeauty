import api from '../lib/api';
import type { Produto, ConsultaEstoque } from '../types/api';

export const produtosService = {
  // Listar todos os produtos (requer autenticação)
  async listar(): Promise<Produto[]> {
    const response = await api.get<Produto[]>('/produtos');
    return response.data;
  },

  // Listar produtos do catálogo público (sem autenticação)
  async listarCatalogo(): Promise<Produto[]> {
    const response = await api.get<Produto[]>('/produtos/catalogo');
    return response.data;
  },

  // Buscar produto por ID
  async buscarPorId(id: number): Promise<Produto> {
    const response = await api.get<Produto>(`/produtos/${id}`);
    return response.data;
  },

  // Criar novo produto
  async criar(produto: Omit<Produto, 'id' | 'created_at' | 'updated_at'>): Promise<any> {
    const response = await api.post('/produtos', produto);
    return response.data;
  },

  // Atualizar produto
  async atualizar(id: number, produto: Partial<Produto>): Promise<{ message: string }> {
    const response = await api.put(`/produtos/${id}`, produto);
    return response.data;
  },

  // Atualizar produto com FormData (para upload de imagem)
  async atualizarComImagem(id: number, formData: FormData): Promise<{ message: string; image?: string }> {
    const response = await api.put(`/produtos/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Deletar produto (soft delete)
  async deletar(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/produtos/${id}`);
    return response.data;
  },

  // Consultar estoque com filtros
  async consultarEstoque(filtros?: ConsultaEstoque & { promocional?: boolean }): Promise<{ produtos: Produto[]; total: number }> {
    const params = new URLSearchParams();

    if (filtros?.produto_id) {
      params.append('produto_id', filtros.produto_id.toString());
    }
    if (filtros?.categoria) {
      params.append('categoria', filtros.categoria);
    }
    if (filtros?.estoque_baixo) {
      params.append('estoque_baixo', 'true');
    }
    if (filtros?.promocional) {
      params.append('promocional', 'true');
    }

    const response = await api.get<{ produtos: Produto[]; total: number }>(`/produtos/estoque?${params.toString()}`);
    return response.data;
  },

  // Buscar produtos com estoque baixo
  async produtosEstoqueBaixo(): Promise<{ produtos: Produto[]; total: number }> {
    return this.consultarEstoque({ estoque_baixo: true });
  },

  // Buscar produtos por categoria
  async buscarPorCategoria(categoria: string): Promise<{ produtos: Produto[]; total: number }> {
    return this.consultarEstoque({ categoria });
  },

  // Buscar produtos promocionais
  async produtosPromocionais(): Promise<Produto[]> {
    const response = await api.get<Produto[]>('/produtos/promocionais');
    return response.data;
  },

  // Buscar produtos (com termo de busca)
  async buscar(termo: string): Promise<Produto[]> {
    const produtos = await this.listar();
    return produtos.filter(produto =>
      produto.name.toLowerCase().includes(termo.toLowerCase()) ||
      produto.brand?.toLowerCase().includes(termo.toLowerCase()) ||
      produto.category?.toLowerCase().includes(termo.toLowerCase())
    );
  },

  // Verificar se produto tem estoque suficiente
  async verificarEstoque(id: number, quantidade: number): Promise<boolean> {
    const produto = await this.buscarPorId(id);
    return produto.stock >= quantidade;
  },

  // Atualizar apenas o estoque
  async atualizarEstoque(id: number, novoEstoque: number): Promise<{ message: string }> {
    const produto = await this.buscarPorId(id);
    return this.atualizar(id, { ...produto, stock: novoEstoque });
  },

  // Obter categorias únicas
  async obterCategorias(): Promise<string[]> {
    const produtos = await this.listar();
    const categorias = new Set(produtos.map(p => p.category).filter(Boolean) as string[]);
    return Array.from(categorias).sort();
  },

  // Obter marcas únicas
  async obterMarcas(): Promise<string[]> {
    const produtos = await this.listar();
    const marcas = new Set(produtos.map(p => p.brand).filter(Boolean) as string[]);
    return Array.from(marcas).sort();
  }
};

export default produtosService;