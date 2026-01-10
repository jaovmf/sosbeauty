export interface Product {
  id: number;
  name: string;
  price: number;
  cost: number;
  stock: number;
  image: string;
}

export interface Client {
  name?: string;
  email?: string;
  phone?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

export interface CartItem {
  product: Product;
  quantity: number;
}