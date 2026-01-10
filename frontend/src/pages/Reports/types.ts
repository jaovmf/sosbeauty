import { mockClients } from '../SalesScreen/mocks/mockClients';
import { mockProducts } from '../SalesScreen/mocks/mockProducts';

export interface SaleItem {
  product: typeof mockProducts[0];
  quantity: number;
  total: number;
}

export interface Sale {
  id: number;
  saleNumber: string;
  client: typeof mockClients[0];
  items: SaleItem[];
  subtotal: number;
  shippingValue: number;
  freeShipping: boolean;
  total: number;
  date: string;
  createdAt: Date;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
};

export interface Product {
  id: number;
  name: string;
};