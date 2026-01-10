import { mockClients } from '../../SalesScreen/mocks/mockClients';
import { mockProducts } from '../../SalesScreen/mocks/mockProducts';
import type { Sale, SaleItem } from '../types';

// Função para gerar vendas mockadas
const generateMockSales = (): Sale[] => {
  const sales: Sale[] = [];

  // Datas dos últimos 3 meses
  const today = new Date();
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);

  let saleId = 1;

  // Gerar 50 vendas
  for (let i = 0; i < 50; i++) {
    // Data aleatória nos últimos 3 meses
    const randomDate = new Date(
      threeMonthsAgo.getTime() +
      Math.random() * (today.getTime() - threeMonthsAgo.getTime())
    );

    // Cliente aleatório
    const client = mockClients[Math.floor(Math.random() * mockClients.length)];

    // Quantidade aleatória de itens (1-5 produtos)
    const itemCount = Math.floor(Math.random() * 5) + 1;
    const items: SaleItem[] = [];

    let subtotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const product = mockProducts[Math.floor(Math.random() * mockProducts.length)];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 unidades
      const total = product.price * quantity;

      // Verificar se o produto já está na venda
      const existingItemIndex = items.findIndex(item => item.product.id === product.id);

      if (existingItemIndex >= 0) {
        items[existingItemIndex].quantity += quantity;
        items[existingItemIndex].total += total;
      } else {
        items.push({
          product,
          quantity,
          total
        });
      }

      subtotal += total;
    }

    // Frete aleatório
    const freeShipping = Math.random() > 0.3; // 70% chance de frete grátis
    const shippingValue = freeShipping ? 0 : Math.random() * 20 + 5; // R$ 5-25

    const total = subtotal + shippingValue;

    sales.push({
      id: saleId++,
      saleNumber: `VDA-${randomDate.getTime()}${String(saleId).padStart(3, '0')}`,
      client,
      items,
      subtotal,
      shippingValue,
      freeShipping,
      total,
      date: randomDate.toISOString(),
      createdAt: randomDate
    });
  }

  // Ordenar por data decrescente (mais recente primeiro)
  return sales.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const mockSales = generateMockSales();