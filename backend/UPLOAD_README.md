# Upload de Imagens para Produtos

Este documento explica como usar a funcionalidade de upload de imagens para produtos implementada.

## Funcionalidades Implementadas

### 1. Upload na Criação de Produto
- **Endpoint**: `POST /api/produtos`
- **Content-Type**: `multipart/form-data`
- **Campo de imagem**: `image`

### 2. Upload na Edição de Produto
- **Endpoint**: `PUT /api/produtos/:id`
- **Content-Type**: `multipart/form-data`
- **Campo de imagem**: `image` (opcional)

### 3. Servir Imagens Estáticas
- **URL**: `http://localhost:3003/uploads/produtos/[nome-do-arquivo]`
- As imagens são acessíveis diretamente via URL

## Como Usar

### Criando um Produto com Imagem

```javascript
const formData = new FormData();
formData.append('name', 'Produto Teste');
formData.append('brand', 'Marca Teste');
formData.append('description', 'Descrição do produto');
formData.append('category', 'Categoria');
formData.append('cost', '10.00');
formData.append('price', '20.00');
formData.append('stock', '100');
formData.append('image', file); // arquivo de imagem

fetch('/api/produtos', {
  method: 'POST',
  body: formData
});
```

### Editando um Produto com Nova Imagem

```javascript
const formData = new FormData();
formData.append('name', 'Produto Atualizado');
formData.append('brand', 'Marca Atualizada');
formData.append('price', '25.00');
formData.append('stock', '150');
formData.append('image', novaImagem); // nova imagem (opcional)

fetch('/api/produtos/1', {
  method: 'PUT',
  body: formData
});
```

## Configurações

### Tipos de Arquivo Permitidos
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### Limites
- Tamanho máximo: 5MB por arquivo
- Diretório de upload: `uploads/produtos/`

### Estrutura de Resposta

**Criação bem-sucedida:**
```json
{
  "id": 1,
  "name": "Produto Teste",
  "brand": "Marca Teste",
  "description": "Descrição do produto",
  "category": "Categoria",
  "cost": 10.00,
  "price": 20.00,
  "stock": 100,
  "image": "/uploads/produtos/image-1634567890123-123456789.jpg",
  "message": "Produto adicionado com sucesso"
}
```

**Atualização bem-sucedida:**
```json
{
  "message": "Produto atualizado com sucesso",
  "image": "/uploads/produtos/image-1634567890456-987654321.jpg"
}
```

## Recursos Implementados

✅ Upload de imagem na criação de produto
✅ Upload de imagem na edição de produto
✅ Validação de tipos de arquivo
✅ Limite de tamanho de arquivo
✅ Remoção automática de imagem antiga ao atualizar
✅ Limpeza de arquivo em caso de erro
✅ Servimento de arquivos estáticos
✅ Geração de nomes únicos para arquivos

## Observações

- Se não for enviada uma imagem, o campo `image` será `null`
- Ao editar um produto sem enviar nova imagem, a imagem atual é mantida
- Ao enviar nova imagem na edição, a imagem anterior é automaticamente removida
- As imagens são salvas no servidor no diretório `uploads/produtos/`
- URLs das imagens são retornadas no formato `/uploads/produtos/[arquivo]`