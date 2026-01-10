# 🚀 Cliente API para SOSBeauty Frontend

Este documento explica como usar o cliente Axios configurado para consumir as APIs do backend SOSBeauty.

## 📁 Estrutura de Arquivos

```
frontend/src/
├── lib/
│   └── api.ts                 # Cliente Axios base
├── types/
│   └── api.ts                 # Tipos TypeScript das APIs
├── services/
│   ├── index.ts              # Exportações centralizadas
│   ├── produtos.ts           # Serviços de produtos
│   ├── clientes.ts           # Serviços de clientes
│   ├── vendas.ts             # Serviços de vendas
│   └── relatorios.ts         # Serviços de relatórios
├── hooks/
│   └── useProdutos.ts        # Hook React para produtos
└── examples/
    └── EstoqueExample.tsx    # Exemplo de uso na tela de estoque
```

## ⚙️ Configuração

### 1. Variável de Ambiente

Crie um arquivo `.env` no frontend com:

```env
REACT_APP_API_URL=http://localhost:3001/api
```

### 2. Iniciar o Backend

```bash
cd backend
npm run dev
```

O servidor deve estar rodando na porta 3001.

## 🎯 Como Usar

### **Importação Básica**

```typescript
// Importar serviços específicos
import { produtosService, clientesService, vendasService } from '../services';

// Ou importar individuais
import produtosService from '../services/produtos';
import { useProdutos } from '../hooks/useProdutos';
```

### **1. 📦 Produtos/Estoque**

#### Usando o Hook (Recomendado)

```typescript
import React from 'react';
import { useProdutos } from '../hooks/useProdutos';

const MinhaTelaEstoque = () => {
  const {
    produtos,          // Lista de produtos
    loading,           // Estado de carregamento
    error,             // Mensagem de erro
    refetch,           // Recarregar dados
    criarProduto,      // Criar novo produto
    atualizarProduto,  // Atualizar produto
    deletarProduto,    // Deletar produto
    consultarEstoque   // Consultar com filtros
  } = useProdutos();

  // Criar produto
  const handleCriar = async () => {
    await criarProduto({
      name: 'Novo Produto',
      brand: 'Marca',
      price: 29.99,
      stock: 10,
      category: 'Fio'
    });
  };

  // Atualizar estoque
  const handleAtualizarEstoque = async (id: number, novoEstoque: number) => {
    await atualizarProduto(id, { stock: novoEstoque });
  };

  // Filtrar produtos
  const handleFiltrar = async () => {
    await consultarEstoque({
      categoria: 'Fio',
      estoque_baixo: true
    });
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      {produtos.map(produto => (
        <div key={produto.id}>
          <h3>{produto.name}</h3>
          <p>Estoque: {produto.stock}</p>
          <p>Preço: R$ {produto.price}</p>
        </div>
      ))}
    </div>
  );
};
```

#### Usando Serviço Diretamente

```typescript
import produtosService from '../services/produtos';

// Listar produtos
const produtos = await produtosService.listar();

// Buscar por ID
const produto = await produtosService.buscarPorId(1);

// Criar produto
const novoProduto = await produtosService.criar({
  name: 'Fio YY 10mm',
  brand: 'FADVAN',
  price: 29.99,
  stock: 50,
  category: 'Fio'
});

// Consultar estoque baixo
const { produtos: estoqueBaixo } = await produtosService.produtosEstoqueBaixo();

// Obter categorias
const categorias = await produtosService.obterCategorias();
```

### **2. 👥 Clientes**

```typescript
import clientesService from '../services/clientes';

// Listar clientes
const clientes = await clientesService.listar();

// Buscar clientes
const clientesEncontrados = await clientesService.buscar('Maria');

// Criar cliente
const novoCliente = await clientesService.criar({
  name: 'João Silva',
  email: 'joao@email.com',
  phone: '(11) 99999-9999',
  street: 'Rua das Flores, 123',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01234-567'
});
```

### **3. 🛒 Vendas**

```typescript
import vendasService from '../services/vendas';

// Criar venda
const novaVenda = await vendasService.criar({
  cliente_id: 1,
  observacoes: 'Entrega urgente',
  itens: [
    { produto_id: 1, quantidade: 2 },
    { produto_id: 5, quantidade: 1 }
  ]
});

// Listar vendas
const vendas = await vendasService.listar();

// Buscar vendas pendentes
const vendasPendentes = await vendasService.buscarPendentes();

// Atualizar status
await vendasService.atualizarStatus(1, 'pago');
```

### **4. 📊 Relatórios**

```typescript
import relatoriosService from '../services/relatorios';

// Dashboard
const dadosDashboard = await relatoriosService.dashboard();

// Relatório de vendas
const relatorioVendas = await relatoriosService.vendas({
  periodo: 'mes'
});

// Estoque baixo
const estoqueBaixo = await relatoriosService.estoqueBaixo(5);

// Clientes ativos
const clientesAtivos = await relatoriosService.clientesAtivos('trimestre');
```

## 🎨 Hooks Especializados

### **useProdutos**

```typescript
// Hook básico
const { produtos, loading } = useProdutos();

// Hook para estoque baixo
const { produtos: estoqueBaixo } = useProdutosEstoqueBaixo();

// Hook para categoria específica
const { produtos: fios } = useProdutosPorCategoria('Fio');
```

## 🚨 Tratamento de Erros

O cliente já trata erros automaticamente:

```typescript
try {
  const produto = await produtosService.buscarPorId(999);
} catch (error) {
  // Error é automaticamente logado no console
  // error.response.data.error contém a mensagem do servidor
  console.error('Produto não encontrado');
}
```

## 🔧 Configurações Avançadas

### **Interceptors Personalizados**

```typescript
import api from '../lib/api';

// Adicionar token de autenticação
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### **Timeout Customizado**

```typescript
// Para uma requisição específica
const produtos = await api.get('/produtos', { timeout: 5000 });
```

## 📋 Exemplo Completo - Tela de Estoque

Veja o arquivo `src/examples/EstoqueExample.tsx` para um exemplo completo de como implementar uma tela de gerenciamento de estoque com:

- ✅ Listagem de produtos
- ✅ Filtros por categoria e estoque baixo
- ✅ Criação de novos produtos
- ✅ Edição de produtos existentes
- ✅ Exclusão de produtos
- ✅ Tratamento de erros
- ✅ Estados de loading

## 🚀 Próximos Passos

1. **Implementar na sua tela**: Use o exemplo como base
2. **Adicionar autenticação**: Se necessário, configure tokens
3. **Personalizar UI**: Adapte os componentes ao seu design
4. **Testes**: Adicione testes unitários para os serviços
5. **Cache**: Considere usar React Query para cache automático

## 🐛 Debugging

- Abra o console do navegador para ver logs das requisições
- Verifique se o backend está rodando na porta 3001
- Confirme a variável `REACT_APP_API_URL` no `.env`
- Use a aba Network do DevTools para inspecionar requisições