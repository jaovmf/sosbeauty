# 🛍️ Catálogo Público SOSBeauty

## 📖 Visão Geral

Uma página pública e responsiva para exibir os produtos da SOSBeauty aos clientes. Perfeita para enviar via WhatsApp ou link direto.

## 🌐 Acesso

### URL do Catálogo:
```
http://localhost:5175/catalog
```

**Para produção, substitua por seu domínio:**
```
https://seudominio.com/catalog
```

## ✨ Funcionalidades Implementadas

### 🎨 **Design Responsivo**
- ✅ Layout adaptável para desktop, tablet e mobile
- ✅ Cards de produto com hover elegante
- ✅ Design moderno e profissional
- ✅ Cores e tipografia da marca

### 🔍 **Sistema de Busca e Filtros**
- ✅ Busca por nome, marca ou descrição
- ✅ Filtro por categoria
- ✅ Contador de produtos encontrados
- ✅ Botão para limpar filtros

### 🛒 **Informações dos Produtos**
- ✅ Imagem do produto (com placeholder se não houver)
- ✅ Nome e marca
- ✅ Descrição
- ✅ Preço formatado em R$
- ✅ Quantidade em estoque
- ✅ Badge de categoria
- ✅ Indicador de "Últimas unidades" (≤5 unidades)
- ✅ Badge de "Esgotado" para produtos sem estoque

### 📱 **Integração WhatsApp**
- ✅ Botão no header
- ✅ Botão no footer
- ✅ Mensagem pré-definida
- ✅ Abre diretamente no WhatsApp

### 🎯 **Recursos Especiais**
- ✅ Só mostra produtos em estoque
- ✅ Animações suaves (Fade In)
- ✅ Loading state elegante
- ✅ Tratamento de erros
- ✅ Estados vazios informativos

## 📱 Como Usar

### **Para Clientes:**

1. **Acesse o link** enviado pelo vendedor
2. **Navegue pelos produtos** usando scroll ou filtros
3. **Use a busca** para encontrar produtos específicos
4. **Filtre por categoria** para navegar por tipo
5. **Clique no WhatsApp** para entrar em contato

### **Para Vendedores:**

1. **Envie o link** `http://localhost:5175/catalog` para clientes
2. **Mantenha produtos atualizados** no sistema administrativo
3. **Configure o número do WhatsApp** no código (linha 31 do Catalog)

## ⚙️ Configuração

### **Número do WhatsApp**

Edite o arquivo `src/pages/Catalog/index.tsx`, linha 31:

```typescript
const phoneNumber = '5511999999999'; // Substitua pelo número real
```

**Formato:** Código do país + DDD + número (sem espaços ou símbolos)

Exemplos:
- `5511999999999` (Brasil - SP)
- `5521888888888` (Brasil - RJ)

### **Mensagem Padrão**

Linha 32 do mesmo arquivo:

```typescript
const message = 'Olá! Vi seus produtos no catálogo e gostaria de mais informações.';
```

## 🎨 Personalização Visual

### **Cores da Marca**

As cores podem ser ajustadas no tema Material-UI:

```typescript
// Gradiente do título
background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'

// Cor principal
backgroundColor: 'primary.main'
```

### **Logo/Nome da Empresa**

No header (linha 52):

```typescript
<Typography variant="h6">
  SOSBeauty - Catálogo  {/* Altere aqui */}
</Typography>
```

## 📊 Características dos Cards

| Elemento | Comportamento |
|----------|---------------|
| **Imagem** | 250px altura, object-fit cover, placeholder automático |
| **Título** | Máximo 2 linhas com ellipsis |
| **Descrição** | Máximo 3 linhas com ellipsis |
| **Preço** | Formatado em R$ com destaque |
| **Estoque** | Badge discreta no canto |
| **Categoria** | Chip flutuante sobre a imagem |

## 🚀 Deploy e Produção

### **Variáveis de Ambiente**

Crie arquivo `.env` no frontend:

```env
VITE_API_URL=https://api.seudominio.com
VITE_WHATSAPP_NUMBER=5511999999999
```

### **Build para Produção**

```bash
cd frontend
npm run build
```

### **Servidor Web**

Configure seu servidor para servir os arquivos estáticos e redirecionar `/catalog` para o index.html.

## 🔗 Links Úteis

| Página | URL | Descrição |
|--------|-----|-----------|
| **Catálogo** | `/catalog` | Página pública para clientes |
| **Admin** | `/` | Sistema administrativo |
| **Estoque** | `/stock` | Gerenciar produtos |
| **Produtos** | `/products` | Cadastrar novos produtos |

## 📱 Responsividade

### **Breakpoints:**
- **Mobile:** 1 produto por linha
- **Tablet:** 2 produtos por linha
- **Desktop:** 3-4 produtos por linha
- **Wide:** 4+ produtos por linha

### **Recursos Mobile:**
- ✅ Touch-friendly
- ✅ Botões grandes
- ✅ Texto legível
- ✅ WhatsApp integrado

## 🎯 Casos de Uso

### **Vendedor → Cliente**
1. "Olha nosso catálogo: [link]"
2. Cliente navega pelos produtos
3. Cliente clica no WhatsApp
4. Conversa personalizada

### **Marketing Digital**
1. Postar link nas redes sociais
2. Incluir em bio do Instagram
3. Enviar por email
4. QR Code para físico

## 🛠️ Manutenção

### **Atualizar Produtos**
Os produtos são sincronizados automaticamente com o sistema administrativo. Basta:

1. Adicionar/editar produtos no admin
2. Upload das imagens
3. Produtos aparecem automaticamente no catálogo

### **Backup das Imagens**
As imagens ficam em `backend/uploads/produtos/` - faça backup regular.

---

## 🎉 Resultado Final

Uma página profissional, responsiva e funcional que:
- ✅ Mostra seus produtos de forma atrativa
- ✅ Facilita o contato via WhatsApp
- ✅ Funciona perfeitamente no mobile
- ✅ Sincroniza automaticamente com o estoque
- ✅ Oferece experiência de usuário moderna

**URL para compartilhar:** `http://localhost:5175/catalog`

*Substitua o localhost pelo seu domínio em produção!*