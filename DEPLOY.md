# Guia de Deploy - SOSBeauty Gestão

Este guia irá te ajudar a colocar o sistema SOSBeauty em produção usando serviços gratuitos.

## Arquitetura da Solução

- **Frontend**: Vercel (hospedagem gratuita, ilimitada)
- **Backend**: Render.com (hospedagem gratuita com limitações)
- **Banco de Dados**: MongoDB Atlas (512MB gratuito)

## ⚠️ Importante - Limitações do Plano Gratuito

O plano gratuito do **Render.com** tem uma limitação importante:
- O servidor **"dorme" após 15 minutos** sem requisições
- A primeira requisição após dormir leva **~30 segundos** para "acordar"
- Para uso em loja física, isso pode ser um problema em horários com pouco movimento

**Soluções**:
1. Usar plano pago do Render ($7/mês) que não dorme
2. Usar Railway.app (5$ crédito mensal gratuito)
3. Implementar "ping" automático para manter servidor acordado (não recomendado)

---

## Passo 1: Configurar MongoDB Atlas (Banco de Dados)

### 1.1 Criar Conta
1. Acesse: https://www.mongodb.com/cloud/atlas/register
2. Crie uma conta gratuita (pode usar conta Google/GitHub)

### 1.2 Criar Cluster
1. Clique em **"Build a Database"**
2. Escolha o plano **FREE (M0)** - 512MB
3. Selecione a região mais próxima (ex: São Paulo - AWS)
4. Dê um nome ao cluster (ex: `sosbeauty-cluster`)
5. Clique em **"Create Cluster"** (demora 1-3 minutos)

### 1.3 Criar Usuário do Banco de Dados
1. No menu lateral, clique em **"Database Access"**
2. Clique em **"Add New Database User"**
3. Escolha **"Password"** como método de autenticação
4. Defina:
   - Username: `sosbeauty_user` (ou outro nome)
   - Password: Gere uma senha forte (anote ela!)
5. Em **"Database User Privileges"**, selecione **"Read and write to any database"**
6. Clique em **"Add User"**

### 1.4 Configurar Acesso de Rede
1. No menu lateral, clique em **"Network Access"**
2. Clique em **"Add IP Address"**
3. Clique em **"Allow Access from Anywhere"** (adiciona `0.0.0.0/0`)
   - ⚠️ Isso é necessário para Render e Vercel acessarem
4. Clique em **"Confirm"**

### 1.5 Obter Connection String
1. Volte para **"Database"** no menu lateral
2. Clique no botão **"Connect"** do seu cluster
3. Escolha **"Connect your application"**
4. Copie a **Connection String**, será algo como:
   ```
   mongodb+srv://sosbeauty_user:<password>@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **IMPORTANTE**: Substitua `<password>` pela senha que você definiu
6. Adicione o nome do banco no final, após `.net/`:
   ```
   mongodb+srv://sosbeauty_user:SUA_SENHA@cluster.xxxxx.mongodb.net/sosbeauty?retryWrites=true&w=majority
   ```
7. **Guarde essa string**, você vai precisar dela!

---

## Passo 2: Subir Backend no Render.com

### 2.1 Preparar Repositório
1. Certifique-se de que seu código está no **GitHub**
2. Se ainda não está:
   ```bash
   # Inicializar git (se ainda não fez)
   git init
   git add .
   git commit -m "Preparar para deploy"

   # Criar repositório no GitHub e fazer push
   git remote add origin https://github.com/seu-usuario/sosbeauty-gestao.git
   git branch -M main
   git push -u origin main
   ```

### 2.2 Criar Conta no Render
1. Acesse: https://render.com/
2. Clique em **"Get Started for Free"**
3. Faça login com sua conta do GitHub

### 2.3 Criar Web Service
1. No dashboard, clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub (autorize acesso se necessário)
3. Selecione o repositório `sosbeauty-gestao`

### 2.4 Configurar o Service
Preencha os campos:

- **Name**: `sosbeauty-api` (ou outro nome único)
- **Region**: Selecione a mais próxima (ex: Ohio - US East)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Instance Type**: `Free`

### 2.5 Configurar Variáveis de Ambiente
Role para baixo até **"Environment Variables"** e adicione:

| Key | Value |
|-----|-------|
| `` | `production` |
| `PORT` | `3003` |
| `MONGODB_URI` | Cole a connection string do MongoDB Atlas (com senha) |
| `JWT_SECRET` | Gere uma chave aleatória (veja abaixo) |
| `JWT_EXPIRES_IN` | `7d` |
| `CORS_ORIGINS` | Deixe vazio por enquanto (preencheremos depois) |

**Para gerar JWT_SECRET**, no seu terminal execute:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.6 Deploy
1. Clique em **"Create Web Service"**
2. Aguarde o deploy (5-10 minutos na primeira vez)
3. Quando terminar, você verá **"Live"** e uma URL como:
   ```
   https://sosbeauty.onrender.com
   ```
4. **Teste** a API acessando:
   ```
   https://sosbeauty.onrender.com/api/health
   ```
   Deve retornar JSON com status OK

### 2.7 Atualizar CORS_ORIGINS
1. No painel do Render, vá em **"Environment"** (menu lateral)
2. Edite a variável `CORS_ORIGINS`
3. Adicione (por enquanto):
   ```
   http://localhost:5173
   ```
4. Clique em **"Save Changes"** (irá fazer redeploy automático)

**Nota**: Depois de subir o frontend, voltaremos aqui para adicionar a URL do Vercel

---

## Passo 3: Subir Frontend no Vercel

### 3.1 Criar Conta no Vercel
1. Acesse: https://vercel.com/signup
2. Faça login com sua conta do GitHub

### 3.2 Importar Projeto
1. No dashboard, clique em **"Add New..."** → **"Project"**
2. Selecione o repositório `sosbeauty-gestao` do GitHub
3. Clique em **"Import"**

### 3.3 Configurar o Projeto
Preencha os campos:

- **Framework Preset**: Vite (deve detectar automaticamente)
- **Root Directory**: Clique em **"Edit"** e selecione `frontend`
- **Build Command**: `npm run build` (já preenchido)
- **Output Directory**: `dist` (já preenchido)
- **Install Command**: `npm install` (já preenchido)

### 3.4 Configurar Variável de Ambiente
1. Expanda **"Environment Variables"**
2. Adicione:
   - **Name**: `VITE_API_URL`
   - **Value**: A URL do seu backend no Render + `/api`
     ```
     https://sosbeauty.onrender.com/api
     ```
   - **Environments**: Marque todas (Production, Preview, Development)
3. Clique em **"Add"**

### 3.5 Deploy
1. Clique em **"Deploy"**
2. Aguarde o build (2-5 minutos)
3. Quando terminar, você terá uma URL como:
   ```
   https://sosbeauty-gestao-xxxxx.vercel.app
   ```
4. **Copie essa URL!**

### 3.6 Testar o Frontend
1. Acesse a URL do Vercel
2. Tente fazer login com suas credenciais
3. Se der erro CORS, vá para o próximo passo

---

## Passo 4: Atualizar CORS no Backend

Agora que temos a URL do frontend, precisamos permitir no CORS:

1. Volte para o **Render.com**
2. Acesse seu serviço `sosbeauty-api`
3. Vá em **"Environment"** no menu lateral
4. Edite `CORS_ORIGINS` e coloque:
   ```
   http://localhost:5173,https://sosbeauty-gestao-xxxxx.vercel.app
   ```
   (substitua pela sua URL real do Vercel)
5. Clique em **"Save Changes"**
6. Aguarde o redeploy (~2 minutos)

---

## Passo 5: Testar Tudo

### 5.1 Verificar Backend
Acesse: `https://sosbeauty.onrender.com/api/health`

Deve retornar:
```json
{
  "status": "OK",
  "timestamp": "2025-01-10T...",
  "database": {
    "type": "MongoDB",
    "status": "connected"
  }
}
```

### 5.2 Verificar Frontend
1. Acesse sua URL do Vercel
2. Faça login com suas credenciais
3. Teste criar um produto
4. Teste criar uma venda
5. Teste o catálogo público: `https://sua-url.vercel.app/catalog`

---

## Passo 6: Criar Primeiro Usuário (Se necessário)

Se você ainda não tem usuários no banco:

### Opção 1: Via Compass (Interface Gráfica)
1. Baixe MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Conecte usando a connection string do Atlas
3. Navegue até `sosbeauty` → `usuarios`
4. Insira um documento manualmente (veja estrutura abaixo)

### Opção 2: Via Terminal/API
Use uma ferramenta como Postman ou cURL:

```bash
# Gerar hash da senha (use bcrypt online ou node)
# Exemplo: senha "admin123" gera hash "$2b$10$..."

# Depois insira direto no MongoDB Atlas (Database → Browse Collections → Insert Document)
```

**Estrutura do usuário**:
```json
{
  "name": "Administrador",
  "email": "admin@sosbeauty.com",
  "password": "$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "role": "admin",
  "createdAt": "2025-01-10T00:00:00.000Z",
  "updatedAt": "2025-01-10T00:00:00.000Z"
}
```

---

## URLs Importantes

Depois de concluir, anote suas URLs:

- **Frontend (Loja/Admin)**: `https://sosbeauty-gestao-xxxxx.vercel.app`
- **Backend API**: `https://sosbeauty.onrender.com/api`
- **Catálogo Público**: `https://sosbeauty-gestao-xxxxx.vercel.app/catalog`
- **Health Check**: `https://sosbeauty.onrender.com/api/health`

---

## Configuração de Domínio Próprio (Opcional)

### No Vercel (Frontend)
1. Vá em **"Settings"** → **"Domains"**
2. Adicione seu domínio (ex: `loja.sosbeauty.com.br`)
3. Configure os DNS conforme instruções do Vercel

### No Render (Backend)
1. Vá em **"Settings"** → **"Custom Domain"**
2. Adicione seu domínio (ex: `api.sosbeauty.com.br`)
3. Configure os DNS conforme instruções do Render
4. **IMPORTANTE**: Atualize `VITE_API_URL` no Vercel com o novo domínio

---

## Troubleshooting

### Backend não conecta ao MongoDB
- Verifique se a connection string está correta
- Verifique se substituiu `<password>` pela senha real
- Verifique se adicionou `/sosbeauty` após `.net/`
- Verifique se liberou IP `0.0.0.0/0` no Network Access

### Erro de CORS no Frontend
- Verifique se adicionou a URL do Vercel em `CORS_ORIGINS`
- Certifique-se de incluir `https://` na URL
- Aguarde 2-3 minutos após salvar (redeploy automático)

### Frontend não encontra API
- Verifique se configurou `VITE_API_URL` no Vercel
- Verifique se a URL termina com `/api`
- Teste o health check da API diretamente no navegador

### Backend "dorme" muito
- Isso é normal no plano free do Render
- Considere upgrade para plano pago ($7/mês)
- Ou use Railway.app (5$ crédito mensal)

### Primeira requisição muito lenta
- Se o backend dormiu, a primeira request leva ~30s
- Isso é limitação do plano free
- Próximas requisições são rápidas (até dormir novamente)

---

## Manutenção e Atualizações

### Atualizar o Código
Sempre que fizer alterações no código:

```bash
# Commit e push para o GitHub
git add .
git commit -m "Descrição das alterações"
git push origin main
```

**Render e Vercel farão deploy automático** quando detectarem mudanças no GitHub!

### Monitorar Logs
- **Render**: Vá em **"Logs"** para ver logs do backend
- **Vercel**: Vá em **"Deployments"** → Clique no deployment → **"View Function Logs"**

### Backup do Banco
No MongoDB Atlas:
1. Vá em **"Clusters"** → **"..."** → **"Load Sample Dataset"**
2. Para backup manual, use MongoDB Compass para exportar coleções

---

## Custos

### Plano Gratuito Atual
- **MongoDB Atlas**: FREE (512MB)
- **Render.com**: FREE (com sleep)
- **Vercel**: FREE (ilimitado para projetos pessoais)
- **Total**: R$ 0,00/mês

### Plano Recomendado para Produção
- **MongoDB Atlas**: FREE (512MB) - OK para começar
- **Render.com**: $7/mês (sem sleep, melhor para loja)
- **Vercel**: FREE (já é ótimo)
- **Total**: ~R$ 35/mês (USD 7)

---

## Próximos Passos

Após deploy bem-sucedido:

1. ✅ Testar todas as funcionalidades
2. ✅ Criar produtos no sistema
3. ✅ Cadastrar clientes
4. ✅ Testar vendas
5. ✅ Compartilhar URL do catálogo com clientes
6. ✅ Configurar domínio próprio (opcional)
7. ✅ Fazer backup inicial do banco de dados

---

## Suporte

Se tiver problemas:
1. Verifique os logs no Render/Vercel
2. Teste o health check da API
3. Verifique as variáveis de ambiente
4. Confirme que MongoDB está conectado

Boa sorte com seu sistema! 🚀
