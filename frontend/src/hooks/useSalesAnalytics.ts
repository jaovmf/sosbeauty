import { useMemo } from 'react';
import { mockSales } from '../pages/Reports/mocks/mockSales';

export const useSalesAnalytics = () => {
  const analytics = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Vendas da semana
    const weekSales = mockSales.filter(sale =>
      new Date(sale.date) >= startOfWeek
    );

    // Vendas do mês
    const monthSales = mockSales.filter(sale =>
      new Date(sale.date) >= startOfMonth
    );

    // Vendas do mês passado
    const lastMonthSales = mockSales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startOfLastMonth && saleDate <= endOfLastMonth;
    });

    // Cálculos da semana
    const weekRevenue = weekSales.reduce((sum, sale) => sum + sale.total, 0);
    const weekCount = weekSales.length;

    // Cálculos do mês
    const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);
    const monthCount = monthSales.length;

    // Comparação com mês passado
    const lastMonthRevenue = lastMonthSales.reduce((sum, sale) => sum + sale.total, 0);
    const lastMonthCount = lastMonthSales.length;

    const revenueGrowth = lastMonthRevenue > 0
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    const salesGrowth = lastMonthCount > 0
      ? ((monthCount - lastMonthCount) / lastMonthCount) * 100
      : 0;

    // Top produtos da semana
    const productSales = new Map();
    weekSales.forEach(sale => {
      sale.items.forEach(item => {
        const productName = item.product.name;
        const currentSales = productSales.get(productName) || { quantity: 0, revenue: 0 };
        productSales.set(productName, {
          quantity: currentSales.quantity + item.quantity,
          revenue: currentSales.revenue + item.total
        });
      });
    });

    // Converter para array e ordenar por receita
    const topProducts = Array.from(productSales.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Dados para gráfico de pizza (categorias de produtos)
    const categoryData = new Map();
    weekSales.forEach(sale => {
      sale.items.forEach(item => {
        const productName = item.product.name;
        let category = 'Outros';

        if (productName.includes('Fio')) category = 'Fios';
        else if (productName.includes('Cola')) category = 'Colas';
        else if (productName.includes('Pinça')) category = 'Pinças';
        else if (productName.includes('Escovinha')) category = 'Escovinhas';
        else if (productName.includes('Removedor')) category = 'Removedores';

        const currentValue = categoryData.get(category) || 0;
        categoryData.set(category, currentValue + item.total);
      });
    });

    const pieChartData = {
      labels: Array.from(categoryData.keys()),
      datasets: [{
        data: Array.from(categoryData.values()),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    return {
      week: {
        revenue: weekRevenue,
        count: weekCount,
        average: weekCount > 0 ? weekRevenue / weekCount : 0
      },
      month: {
        revenue: monthRevenue,
        count: monthCount,
        average: monthCount > 0 ? monthRevenue / monthCount : 0,
        revenueGrowth,
        salesGrowth
      },
      topProducts,
      pieChartData,
      totalSales: mockSales.length,
      totalRevenue: mockSales.reduce((sum, sale) => sum + sale.total, 0)
    };
  }, []);

  return analytics;
};