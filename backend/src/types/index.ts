export interface Cliente {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Produto {
  id?: number;
  name: string;
  brand?: string;
  description?: string;
  category?: string;
  cost?: number;
  price: number;
  promotional_price?: number;
  stock: number;
  image?: string;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Venda {
  id?: number;
  cliente_id?: number;
  total: number;
  status?: 'pendente' | 'pago' | 'cancelado';
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  itens?: VendaItem[];
}

export interface VendaItem {
  id?: number;
  venda_id?: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface NovaVendaRequest {
  cliente_id?: number;
  observacoes?: string;
  itens: {
    produto_id: number;
    quantidade: number;
  }[];
}

export interface RelatorioVendas {
  periodo: string;
  total_vendas: number;
  quantidade_vendas: number;
  ticket_medio: number;
  produtos_mais_vendidos: {
    produto_id: number;
    nome: string;
    quantidade_vendida: number;
    receita_total: number;
  }[];
}

export interface ConsultaEstoque {
  produto_id?: number;
  categoria?: string;
  estoque_baixo?: boolean;
}