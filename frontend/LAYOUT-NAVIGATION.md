# Sistema de Navegação Responsivo

## Visão Geral

O frontend agora possui um sistema de navegação adaptativo que melhora significativamente a experiência do usuário em diferentes dispositivos.

## Componentes Criados

### 1. Sidebar (Desktop)
**Localização:** `src/components/Layout/Sidebar/index.tsx`

- **Sidebar colapsável** com toggle para expandir/recolher
- **Navegação visual** com ícones coloridos e estados ativos destacados
- **Seções organizadas:**
  - Menu principal (Dashboard, Nova Venda, Catálogo, etc.)
  - Menu secundário (Cadastros)
- **Design moderno** com efeitos hover e transições suaves
- **Largura dinâmica:** 280px expandida, 72px colapsada

### 2. Bottom Navigation (Mobile)
**Localização:** `src/components/Layout/MobileBottomNav/index.tsx`

- **Bottom Navigation Bar** fixada na parte inferior da tela
- **5 ações principais:**
  - Home
  - Vender
  - Catálogo
  - Estoque
  - Mais (abre Speed Dial)
- **Speed Dial** para ações secundárias:
  - Relatórios
  - Clientes
  - Cadastrar Cliente
  - Adicionar Produto
- **UX otimizada** para uso com uma mão no mobile

### 3. AppLayout Wrapper
**Localização:** `src/components/Layout/AppLayout/index.tsx`

- **Layout responsivo** que alterna automaticamente entre Sidebar e Bottom Navigation
- **Breakpoint:** `md` (768px)
  - Desktop (≥768px): Mostra Sidebar
  - Mobile (<768px): Mostra Bottom Navigation
- **Padding inteligente** que se ajusta para evitar sobreposição

## Como Usar

O layout é aplicado automaticamente em todas as rotas através do arquivo `src/routes/index.tsx`:

```tsx
<AppLayout>
  <Routes>
    <Route path="/" element={<Home />} />
    {/* outras rotas */}
  </Routes>
</AppLayout>
```

## Mudanças nas Páginas

Todas as páginas tiveram o componente `<Header />` removido, pois a navegação agora é global através do layout:

- ✅ Home
- ✅ SalesScreen
- ✅ Stock
- ✅ Reports
- ✅ ProductRegistration
- ✅ ClientRegistration
- ✅ SalesManagement
- ✅ ClientsList

**Nota:** A página Catalog mantém seu próprio `CatalogHeader` pois possui um layout específico.

## Benefícios

### Desktop
- Navegação sempre visível na lateral
- Acesso rápido a todas as funcionalidades
- Mais espaço vertical para conteúdo
- Design profissional e moderno

### Mobile
- UX otimizada para touch
- Bottom Navigation acessível com o polegar
- Speed Dial para ações secundárias
- Menor uso de espaço de tela
- Navegação intuitiva

## Tecnologias

- **Material-UI (MUI)** v7
- **React Router** para navegação
- **TypeScript** para type safety
- **Responsive Design** com breakpoints do MUI

## Próximas Melhorias

Possíveis melhorias futuras:
- [ ] Adicionar notificações badge nos ícones
- [ ] Implementar busca rápida na sidebar
- [ ] Adicionar tema claro/escuro toggle
- [ ] Persistir estado colapsado da sidebar
- [ ] Animações mais elaboradas
