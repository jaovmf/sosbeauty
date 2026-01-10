# Migração SQLite → MongoDB - SOS Beauty

## 📋 Status da Migração

### ✅ Concluído
- [x] Instalação do Mongoose
- [x] Criação dos Models (Cliente, Produto, Venda)
- [x] Configuração de conexão MongoDB
- [x] Migração de rotas de Clientes

### 🔄 Em Andamento
- [ ] Migração de rotas de Produtos
- [ ] Migração de rotas de Vendas
- [ ] Migração de rotas de Relatórios
- [ ] Script de migração de dados
- [ ] Atualização do server.ts
- [ ] Testes completos

## 🏗️ Estrutura Criada

### Models (src/models/)
```
Cliente.ts  - Model de clientes com validações
Produto.ts  - Model de produtos com virtuals para preço final
Venda.ts    - Model de vendas com itens embarcados
```

### Database (src/database/)
```
mongodb.ts  - Configuração de conexão MongoDB
database.ts - Conexão SQLite (antiga - manter por enquanto)
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do backend:

```env
PORT=3003
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/sosbeauty
```

**Para MongoDB Atlas (cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sosbeauty?retryWrites=true&w=majority
```

### 2. Instalação do MongoDB Local

**Windows:**
1. Download: https://www.mongodb.com/try/download/community
2. Instalar MongoDB Community Edition
3. Iniciar serviço: `net start MongoDB`

**Linux/Mac:**
```bash
# Ubuntu
sudo apt-get install mongodb

# Mac (Homebrew)
brew install mongodb-community
brew services start mongodb-community
```

### 3. Verificar Conexão

```bash
# Testar conexão
mongo
# ou
mongosh

# Verificar databases
show dbs

# Usar database
use sosbeauty
```

## 📊 Diferenças SQLite vs MongoDB

### SQLite (Antes)
```javascript
// Buscar clientes
db.all('SELECT * FROM clientes WHERE name LIKE ?', [`%${search}%`])

// Criar cliente
db.run('INSERT INTO clientes (name, email) VALUES (?, ?)', [name, email])
```

### MongoDB/Mongoose (Depois)
```javascript
// Buscar clientes
await Cliente.find({ name: new RegExp(search, 'i') })

// Criar cliente
const cliente = new Cliente({ name, email })
await cliente.save()
```

## 🎯 Benefícios da Migração

### 1. **Escalabilidade**
- MongoDB escala horizontalmente
- Melhor para grandes volumes de dados
- Replicação nativa

### 2. **Flexibilidade**
- Schema dinâmico
- Estruturas aninhadas (vendas com itens embarcados)
- Fácil evolução do modelo de dados

### 3. **Performance**
- Índices automáticos
- Queries mais rápidas para buscas complexas
- Agregações poderosas

### 4. **Desenvolvimento**
- TypeScript com tipagem forte
- Validações no model
- Virtuals e hooks
- Middleware pré/pós operações

## 📝 Modelos de Dados

### Cliente
```typescript
{
  name: string (required)
  email?: string (unique)
  phone?: string
  street?: string
  neighborhood?: string
  city?: string
  state?: string
  zipCode?: string
  createdAt: Date
  updatedAt: Date
}
```

### Produto
```typescript
{
  name: string (required)
  brand?: string
  description?: string
  category?: string
  cost?: number
  price: number (required)
  promotional_price?: number
  stock: number (default: 0)
  image?: string
  ativo: boolean (default: true)
  createdAt: Date
  updatedAt: Date

  // Virtuals
  hasPromotion: boolean
  finalPrice: number
}
```

### Venda
```typescript
{
  cliente_id?: ObjectId (ref: Cliente)
  cliente_nome?: string
  total: number (required)
  status: 'pendente' | 'pago' | 'cancelado'
  observacoes?: string
  payment_method?: string
  shipping_value: number (default: 0)
  itens: [{
    produto_id: ObjectId (ref: Produto)
    produto_nome: string
    quantidade: number
    preco_unitario: number
    subtotal: number
  }]
  createdAt: Date
  updatedAt: Date
}
```

## 🚀 Próximos Passos

### 1. Migrar Rotas Restantes
- Produtos
- Vendas
- Relatórios

### 2. Criar Script de Migração
Script para transferir dados do SQLite para MongoDB

### 3. Atualizar server.ts
Trocar inicialização do SQLite por MongoDB

### 4. Testes
Testar todas as funcionalidades

### 5. Deploy
Configurar MongoDB em produção (Atlas)

## 🔐 Segurança

### Índices Criados
```javascript
// Cliente
{ name: 1 }
{ email: 1 }
{ phone: 1 }

// Produto
{ name: 1 }
{ category: 1 }
{ brand: 1 }
{ ativo: 1 }
{ stock: 1 }

// Venda
{ cliente_id: 1 }
{ status: 1 }
{ createdAt: -1 }
{ 'itens.produto_id': 1 }
```

### Validações
- Email único
- Campos obrigatórios
- Valores mínimos (preços, quantidades)
- Enums para status

## 📚 Recursos

- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [MongoDB University](https://university.mongodb.com/)

## ⚠️ Avisos Importantes

1. **Backup**: Sempre faça backup do banco SQLite antes de migrar
2. **Testes**: Teste localmente antes de ir para produção
3. **IDs**: MongoDB usa ObjectId ao invés de INTEGER
4. **Timestamps**: Usa `createdAt`/`updatedAt` ao invés de `created_at`/`updated_at`
5. **Relacionamentos**: Vendas agora têm itens embarcados (embedded) ao invés de tabela separada

## 🐛 Troubleshooting

### Erro: "Cannot connect to MongoDB"
```bash
# Verificar se MongoDB está rodando
sudo systemctl status mongod  # Linux
brew services list            # Mac
net start MongoDB             # Windows
```

### Erro: "Email já cadastrado"
- MongoDB retorna código 11000 para duplicate key
- Tratado nas rotas com try/catch

### Performance lenta
- Verificar índices criados
- Usar `.lean()` para queries read-only
- Limitar resultados com `.limit()`
