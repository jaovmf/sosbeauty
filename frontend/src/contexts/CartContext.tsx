import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Produto } from '../types/api';

export interface CartItem {
  id: number;
  produto: Produto;
  quantity: number;
  total: number;
}

export interface PaymentMethod {
  type: 'dinheiro' | 'pix' | 'credito' | 'debito';
  label: string;
}

export interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  paymentMethod: PaymentMethod | null;
  addItem: (produto: Produto) => void;
  removeItem: (produtoId: number) => void;
  updateQuantity: (produtoId: number, quantity: number) => void;
  clearCart: () => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = (produto: Produto) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.produto.id === produto.id);

      if (existingItem) {
        return prev.map(item =>
          item.produto.id === produto.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * produto.price
              }
            : item
        );
      }

      return [...prev, {
        id: Date.now(),
        produto,
        quantity: 1,
        total: produto.price
      }];
    });
  };

  const removeItem = (produtoId: number) => {
    setItems(prev => prev.filter(item => item.produto.id !== produtoId));
  };

  const updateQuantity = (produtoId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(produtoId);
      return;
    }

    setItems(prev =>
      prev.map(item =>
        item.produto.id === produtoId
          ? {
              ...item,
              quantity,
              total: quantity * item.produto.price
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setPaymentMethod(null);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const total = items.reduce((sum, item) => sum + item.total, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const value: CartContextType = {
    items,
    total,
    itemCount,
    paymentMethod,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setPaymentMethod,
    isOpen,
    openCart,
    closeCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};