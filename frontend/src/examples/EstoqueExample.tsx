import React, { useState } from 'react';
import { useProdutos } from '../hooks/useProdutos';
import { Produto } from '../types/api';

const EstoqueExample: React.FC = () => {
  const {
    produtos,
    loading,
    error,
    refetch,
    criarProduto,
    atualizarProduto,
    deletarProduto,
    consultarEstoque
  } = useProdutos();

  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [mostrarEstoqueBaixo, setMostrarEstoqueBaixo] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  // Função para aplicar filtros
  const aplicarFiltros = async () => {
    await consultarEstoque({
      categoria: filtroCategoria || undefined,
      estoque_baixo: mostrarEstoqueBaixo || undefined
    });
  };

  // Função para salvar produto (criar ou atualizar)
  const salvarProduto = async (produto: Produto) => {
    try {
      if (produto.id) {
        await atualizarProduto(produto.id, produto);
        alert('Produto atualizado com sucesso!');
      } else {
        await criarProduto(produto);
        alert('Produto criado com sucesso!');
      }
      setProdutoEditando(null);
    } catch (err) {
      alert('Erro ao salvar produto');
    }
  };

  // Função para excluir produto
  const excluirProduto = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deletarProduto(id);
        alert('Produto excluído com sucesso!');
      } catch (err) {
        alert('Erro ao excluir produto');
      }
    }
  };

  if (loading) return <div>Carregando produtos...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gerenciar Estoque</h1>

      {/* Filtros */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Categoria</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Todas as categorias</option>
              <option value="Fio">Fio</option>
              <option value="Cola">Cola</option>
              <option value="Higiene">Higiene</option>
              <option value="Pinça">Pinça</option>
              <option value="Descartáveis">Descartáveis</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={mostrarEstoqueBaixo}
                onChange={(e) => setMostrarEstoqueBaixo(e.target.checked)}
                className="mr-2"
              />
              Apenas estoque baixo
            </label>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={aplicarFiltros}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Botão para criar produto */}
      <div className="mb-4">
        <button
          onClick={() => setProdutoEditando({
            name: '',
            brand: '',
            description: '',
            category: '',
            cost: 0,
            price: 0,
            stock: 0
          })}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Novo Produto
        </button>
      </div>

      {/* Lista de produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {produtos.map((produto) => (
          <div key={produto.id} className="border rounded-lg p-4 shadow">
            <h3 className="font-semibold text-lg">{produto.name}</h3>
            <p className="text-gray-600">{produto.brand}</p>
            <p className="text-sm text-gray-500 mb-2">{produto.category}</p>

            <div className="space-y-1 text-sm">
              <p>Estoque: <span className={produto.stock <= 10 ? 'text-red-500 font-bold' : ''}>{produto.stock}</span></p>
              <p>Custo: R$ {produto.cost?.toFixed(2) || '0.00'}</p>
              <p>Preço: R$ {produto.price.toFixed(2)}</p>
              <p>Margem: {produto.cost ? (((produto.price - produto.cost) / produto.cost) * 100).toFixed(1) : '0'}%</p>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setProdutoEditando(produto)}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Editar
              </button>
              <button
                onClick={() => produto.id && excluirProduto(produto.id)}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {produtos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum produto encontrado
        </div>
      )}

      {/* Modal de edição (simplificado) */}
      {produtoEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {produtoEditando.id ? 'Editar Produto' : 'Novo Produto'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  value={produtoEditando.name}
                  onChange={(e) => setProdutoEditando({...produtoEditando, name: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Marca</label>
                <input
                  type="text"
                  value={produtoEditando.brand || ''}
                  onChange={(e) => setProdutoEditando({...produtoEditando, brand: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <input
                  type="text"
                  value={produtoEditando.category || ''}
                  onChange={(e) => setProdutoEditando({...produtoEditando, category: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Custo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={produtoEditando.cost || 0}
                    onChange={(e) => setProdutoEditando({...produtoEditando, cost: parseFloat(e.target.value)})}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Preço</label>
                  <input
                    type="number"
                    step="0.01"
                    value={produtoEditando.price}
                    onChange={(e) => setProdutoEditando({...produtoEditando, price: parseFloat(e.target.value)})}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estoque</label>
                <input
                  type="number"
                  value={produtoEditando.stock}
                  onChange={(e) => setProdutoEditando({...produtoEditando, stock: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2 justify-end">
              <button
                onClick={() => setProdutoEditando(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={() => salvarProduto(produtoEditando)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstoqueExample;