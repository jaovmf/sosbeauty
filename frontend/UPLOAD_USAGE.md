# Upload de Imagens - Guia de Uso

## Funcionalidade Implementada

O sistema agora suporta upload de imagens para produtos no modal de edição com as seguintes características:

### ✅ Recursos Implementados

1. **Campo de Upload de Imagem**
   - Drag and drop visual
   - Validação de tipos de arquivo (JPEG, PNG, GIF, WebP)
   - Limite de tamanho (5MB)
   - Preview em tempo real

2. **Preview de Imagem**
   - Exibe imagem atual do produto (se existir)
   - Preview da nova imagem selecionada
   - Botões para alterar ou remover imagem

3. **Integração com Backend**
   - Envio via FormData para suporte a multipart/form-data
   - Manutenção da imagem atual se nenhuma nova for selecionada
   - Remoção automática da imagem anterior no servidor

### 🎯 Como Usar

1. **Abrir Modal de Edição**
   - Clique no ícone de editar (✏️) de qualquer produto na lista
   - O modal será aberto com os dados atuais do produto

2. **Upload de Imagem**
   - Role até a seção "Imagem do Produto"
   - Se já houver uma imagem, ela será exibida
   - Clique em "Selecionar Imagem" para escolher uma nova
   - Ou "Alterar Imagem" se já houver uma

3. **Preview e Validação**
   - A imagem aparecerá imediatamente como preview
   - Formatos aceitos: JPEG, PNG, GIF, WebP
   - Tamanho máximo: 5MB
   - Mensagens de erro aparecerão se houver problemas

4. **Salvar Alterações**
   - Clique em "Salvar Alterações"
   - A imagem será enviada junto com os outros dados
   - A lista de produtos será atualizada automaticamente

### 🔧 Implementação Técnica

**Frontend:**
- Novo componente de upload no `ProductModal.tsx`
- Preview com validação de tipo e tamanho
- Estado para gerenciar imagem atual vs nova imagem
- FormData para envio multipart

**Backend:**
- Middleware multer configurado
- Upload para `uploads/produtos/`
- Validação de tipos e tamanhos
- Limpeza automática em caso de erro
- Servimento de arquivos estáticos em `/uploads`

**Fluxo de Dados:**
1. Frontend: Seleção de arquivo → Validação → Preview
2. Frontend: FormData → Service → Hook
3. Backend: Multer → Validação → Armazenamento
4. Backend: Response com URL da imagem
5. Frontend: Atualização da lista

### 🌐 URLs das Imagens

As imagens ficam acessíveis em:
```
http://localhost:3003/uploads/produtos/[nome-do-arquivo]
```

Exemplo:
```
http://localhost:3003/uploads/produtos/image-1634567890123-123456789.jpg
```

### 📋 Validações

- **Tipos permitidos:** JPEG, PNG, GIF, WebP
- **Tamanho máximo:** 5MB
- **Nome único:** Gerado automaticamente com timestamp
- **Limpeza:** Remoção da imagem anterior ao atualizar
- **Fallback:** Mantém imagem atual se não enviar nova

### 🚀 Próximos Passos

A mesma funcionalidade pode ser facilmente adicionada ao cadastro de novos produtos seguindo o mesmo padrão implementado aqui.