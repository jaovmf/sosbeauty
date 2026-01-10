export interface Produto {
  id: number;
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

export interface VendaItem {
  id?: number;
  venda_id?: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  produto_nome?: string;
}

export interface Venda {
  id?: number;
  cliente_id?: number;
  cliente_nome?: string;
  total: number;
  status?: 'pendente' | 'pago' | 'cancelado';
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  itens?: VendaItem[];
}

export interface NovaVendaRequest {
  cliente_id?: number;
  observacoes?: string;
  itens: {
    produto_id: number;
    quantidade: number;
  }[];
}

export interface ConsultaEstoque {
  produto_id?: number;
  categoria?: string;
  estoque_baixo?: boolean;
}

export interface FiltroVendas {
  cliente_id?: number;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface RelatorioVendas {
  periodo: string;
  total_vendas: number;
  quantidade_vendas: number;
  ticket_medio: number;
  produtos_mais_vendidos: {
    produto_id: number;
    name: string;
    quantidade_vendida: number;
    receita_total: number;
  }[];
}

export interface RelatorioEstoqueBaixo {
  produtos_estoque_baixo: Produto[];
  total: number;
}

export interface RelatorioClientesAtivos {
  clientes_ativos: {
    id: number;
    name: string;
    email: string;
    phone: string;
    total_compras: number;
    valor_total: number;
    ultima_compra: string;
  }[];
  total: number;
}

export interface DashboardData {
  vendas_hoje: {
    count: number;
    total: number;
  };
  vendas_mes: {
    count: number;
    total: number;
  };
  produtos_estoque_baixo: number;
  total_clientes: number;
  vendas_pendentes: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
}