import { Router, Request, Response } from 'express';
import Venda from '../models/Venda';
import Produto from '../models/Produto';
import Cliente from '../models/Cliente';
import { authenticate } from '../middleware/auth';

const router = Router();

// Todas as rotas de relatórios requerem autenticação
router.use(authenticate);

// Relatório de vendas
router.get('/vendas', async (req: Request, res: Response): Promise<void> => {
  try {
    const { periodo, data_inicio, data_fim } = req.query;

    let dateFilter: any = { status: 'pago' };

    if (data_inicio && data_fim) {
      const startDate = new Date(data_inicio as string);
      const endDate = new Date(data_fim as string);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { $gte: startDate, $lte: endDate };
    } else if (periodo) {
      const now = new Date();
      switch (periodo) {
        case 'hoje':
          const startOfDay = new Date(now.setHours(0, 0, 0, 0));
          const endOfDay = new Date(now.setHours(23, 59, 59, 999));
          dateFilter.createdAt = { $gte: startOfDay, $lte: endOfDay };
          break;
        case 'semana':
          const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
          dateFilter.createdAt = { $gte: sevenDaysAgo };
          break;
        case 'mes':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter.createdAt = { $gte: startOfMonth };
          break;
        case 'ano':
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          dateFilter.createdAt = { $gte: startOfYear };
          break;
      }
    }

    // Buscar vendas
    const vendas = await Venda.find(dateFilter);

    // Calcular totais
    let totalVendas = 0;
    let totalFrete = 0;
    let quantidadeVendas = vendas.length;
    const produtosMap = new Map<string, { name: string, quantidade: number, receita: number }>();

    vendas.forEach(venda => {
      totalVendas += venda.total;
      totalFrete += venda.shipping_value || 0;

      venda.itens.forEach(item => {
        const produtoId = item.produto_id.toString();
        if (produtosMap.has(produtoId)) {
          const prod = produtosMap.get(produtoId)!;
          prod.quantidade += item.quantidade;
          prod.receita += item.subtotal;
        } else {
          produtosMap.set(produtoId, {
            name: item.produto_nome,
            quantidade: item.quantidade,
            receita: item.subtotal
          });
        }
      });
    });

    const ticketMedio = quantidadeVendas > 0 ? totalVendas / quantidadeVendas : 0;

    // Top 10 produtos
    const produtosMaisVendidos = Array.from(produtosMap.entries())
      .map(([produto_id, data]) => ({
        produto_id,
        name: data.name,
        quantidade_vendida: data.quantidade,
        receita_total: data.receita
      }))
      .sort((a, b) => b.quantidade_vendida - a.quantidade_vendida)
      .slice(0, 10);

    res.json({
      periodo: periodo || `${data_inicio} a ${data_fim}`,
      total_vendas: totalVendas,
      total_frete: Math.round(totalFrete * 100) / 100,
      quantidade_vendas: quantidadeVendas,
      ticket_medio: Math.round(ticketMedio * 100) / 100,
      produtos_mais_vendidos: produtosMaisVendidos
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de vendas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Relatório de estoque baixo
router.get('/estoque-baixo', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limite = 10 } = req.query;

    const produtos = await Produto.find({
      ativo: true,
      stock: { $lte: parseInt(limite as string) }
    })
      .select('id name stock category price')
      .sort({ stock: 1 });

    res.json({
      produtos_estoque_baixo: produtos,
      total: produtos.length
    });
  } catch (error) {
    console.error('Erro ao buscar produtos com estoque baixo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Relatório de clientes ativos
router.get('/clientes-ativos', async (req: Request, res: Response): Promise<void> => {
  try {
    const { periodo } = req.query;

    let dateFilter: any = {};

    if (periodo) {
      const now = new Date();
      switch (periodo) {
        case 'mes':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter.createdAt = { $gte: startOfMonth };
          break;
        case 'trimestre':
          const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
          dateFilter.createdAt = { $gte: threeMonthsAgo };
          break;
        case 'ano':
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          dateFilter.createdAt = { $gte: startOfYear };
          break;
      }
    }

    // Usar aggregation para agrupar por cliente
    const clientesAtivos = await Venda.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$cliente_id',
          cliente_nome: { $first: '$cliente_nome' },
          total_compras: { $sum: 1 },
          valor_total: { $sum: '$total' },
          ultima_compra: { $max: '$createdAt' }
        }
      },
      { $sort: { valor_total: -1 } },
      { $limit: 20 }
    ]);

    // Enriquecer com dados dos clientes
    const clientesEnriquecidos = await Promise.all(
      clientesAtivos.map(async (item) => {
        if (item._id) {
          const cliente = await Cliente.findById(item._id);
          return {
            id: item._id,
            name: item.cliente_nome || cliente?.name,
            email: cliente?.email,
            phone: cliente?.phone,
            total_compras: item.total_compras,
            valor_total: item.valor_total,
            ultima_compra: item.ultima_compra
          };
        }
        return {
          id: null,
          name: item.cliente_nome || 'Cliente não identificado',
          email: null,
          phone: null,
          total_compras: item.total_compras,
          valor_total: item.valor_total,
          ultima_compra: item.ultima_compra
        };
      })
    );

    res.json({
      clientes_ativos: clientesEnriquecidos,
      total: clientesEnriquecidos.length
    });
  } catch (error) {
    console.error('Erro ao buscar clientes ativos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Relatório de vendas por período
router.get('/vendas-por-periodo', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tipo = 'diario', data_inicio, data_fim } = req.query;

    let dateFilter: any = { status: 'pago' };

    if (data_inicio && data_fim) {
      const startDate = new Date(data_inicio as string);
      const endDate = new Date(data_fim as string);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { $gte: startDate, $lte: endDate };
    }

    let groupFormat: any;
    switch (tipo) {
      case 'diario':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'semanal':
        groupFormat = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'mensal':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
        break;
      default:
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
    }

    const dados = await Venda.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupFormat,
          quantidade_vendas: { $sum: 1 },
          total_vendas: { $sum: '$total' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1, '_id.week': -1 } },
      { $limit: 30 },
      {
        $project: {
          _id: 0,
          periodo: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $toString: '$_id.month' },
              { $cond: [{ $ifNull: ['$_id.day', null] }, { $concat: ['-', { $toString: '$_id.day' }] }, ''] },
              { $cond: [{ $ifNull: ['$_id.week', null] }, { $concat: ['-W', { $toString: '$_id.week' }] }, ''] }
            ]
          },
          quantidade_vendas: 1,
          total_vendas: 1
        }
      }
    ]);

    res.json({
      tipo_periodo: tipo,
      dados
    });
  } catch (error) {
    console.error('Erro ao gerar relatório por período:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Relatório de vendas por categoria
router.get('/vendas-por-categoria', async (req: Request, res: Response): Promise<void> => {
  try {
    const { periodo = 'semana' } = req.query;

    let dateFilter: any = { status: 'pago' };
    const now = new Date();

    switch (periodo) {
      case 'hoje':
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));
        dateFilter.createdAt = { $gte: startOfDay, $lte: endOfDay };
        break;
      case 'semana':
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        dateFilter.createdAt = { $gte: sevenDaysAgo };
        break;
      case 'mes':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter.createdAt = { $gte: startOfMonth };
        break;
      case 'ano':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        dateFilter.createdAt = { $gte: startOfYear };
        break;
    }

    const vendas = await Venda.find(dateFilter);

    // Agrupar por categoria
    const categoriaMap = new Map<string, { quantidade: number, receita: number }>();

    for (const venda of vendas) {
      for (const item of venda.itens) {
        const produto = await Produto.findById(item.produto_id);
        const categoria = produto?.category || 'Sem Categoria';

        if (categoriaMap.has(categoria)) {
          const cat = categoriaMap.get(categoria)!;
          cat.quantidade += item.quantidade;
          cat.receita += item.subtotal;
        } else {
          categoriaMap.set(categoria, {
            quantidade: item.quantidade,
            receita: item.subtotal
          });
        }
      }
    }

    const categorias = Array.from(categoriaMap.entries())
      .map(([categoria, data]) => ({
        categoria,
        quantidade_vendida: data.quantidade,
        receita: data.receita
      }))
      .sort((a, b) => b.receita - a.receita);

    res.json(categorias);
  } catch (error) {
    console.error('Erro ao buscar vendas por categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dashboard stats
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Vendas de hoje
    const vendasHoje = await Venda.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'pago'
    });

    const vendasHojeStats = {
      count: vendasHoje.length,
      total: vendasHoje.reduce((sum, v) => sum + v.total, 0),
      frete: vendasHoje.reduce((sum, v) => sum + (v.shipping_value || 0), 0)
    };

    // Vendas do mês
    const vendasMes = await Venda.find({
      createdAt: { $gte: startOfMonth },
      status: 'pago'
    });

    const vendasMesStats = {
      count: vendasMes.length,
      total: vendasMes.reduce((sum, v) => sum + v.total, 0),
      frete: vendasMes.reduce((sum, v) => sum + (v.shipping_value || 0), 0)
    };

    // Produtos com estoque baixo
    const produtosEstoqueBaixo = await Produto.countDocuments({
      ativo: true,
      stock: { $lte: 10 }
    });

    // Total de clientes
    const totalClientes = await Cliente.countDocuments();

    // Vendas pendentes
    const vendasPendentes = await Venda.countDocuments({ status: 'pendente' });

    res.json({
      vendas_hoje: vendasHojeStats,
      vendas_mes: vendasMesStats,
      produtos_estoque_baixo: produtosEstoqueBaixo,
      total_clientes: totalClientes,
      vendas_pendentes: vendasPendentes
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
