import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Venda from '../models/Venda';
import Produto from '../models/Produto';
import Cliente from '../models/Cliente';
import { authenticate } from '../middleware/auth';
import { createAuditLog } from '../utils/auditLogger';

const router = Router();

const processarItensEVenda = async (payload: {
  itens: any[];
  desconto_tipo?: 'percentual' | 'valor';
  desconto_valor?: number;
}) => {
  const { itens, desconto_tipo, desconto_valor } = payload;

  const itensProcessados = [];
  let subtotal = 0;

  for (const item of itens) {
    const produto = await Produto.findOne({ _id: item.produto_id, ativo: true });

    if (!produto) {
      throw new Error(`Produto ${item.produto_id} não encontrado`);
    }

    // Permitir venda mesmo com estoque zerado ou negativo

    const finalPrice = produto.promotional_price && produto.promotional_price > 0 && produto.promotional_price < produto.price
      ? produto.promotional_price
      : produto.price;

    const itemSubtotal = finalPrice * item.quantidade;
    subtotal += itemSubtotal;

    itensProcessados.push({
      produto_id: produto._id,
      produto_nome: produto.name,
      quantidade: item.quantidade,
      preco_unitario: finalPrice,
      subtotal: itemSubtotal
    });
  }

  let valorDesconto = 0;
  if (desconto_tipo && desconto_valor && desconto_valor > 0) {
    if (desconto_tipo === 'percentual') {
      valorDesconto = (subtotal * desconto_valor) / 100;
    } else if (desconto_tipo === 'valor') {
      valorDesconto = desconto_valor;
    }
  }

  if (valorDesconto > subtotal) {
    throw new Error('O desconto não pode ser maior que o subtotal');
  }

  return {
    itensProcessados,
    subtotal,
    valorDesconto,
    total: subtotal - valorDesconto
  };
};

// Endpoint para vendas do catálogo (público - não requer autenticação)
router.post('/catalog', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cliente_id, observacoes, itens, payment_method, desconto_tipo, desconto_valor } = req.body;

    if (!itens || itens.length === 0) {
      res.status(400).json({ error: 'Pelo menos um item é obrigatório' });
      return;
    }

    if (!cliente_id) {
      res.status(400).json({ error: 'Cliente é obrigatório' });
      return;
    }

    // Validar estoque e buscar preços (SEM dar baixa ainda)
    const itensProcessados = [];
    let subtotal = 0;

    for (const item of itens) {
      const produto = await Produto.findOne({ _id: item.produto_id, ativo: true });

      if (!produto) {
        res.status(400).json({ error: `Produto ${item.produto_id} não encontrado` });
        return;
      }

      // Permitir venda mesmo com estoque zerado ou negativo

      const finalPrice = produto.promotional_price && produto.promotional_price > 0 && produto.promotional_price < produto.price
        ? produto.promotional_price
        : produto.price;

      const itemSubtotal = finalPrice * item.quantidade;
      subtotal += itemSubtotal;

      itensProcessados.push({
        produto_id: produto._id,
        produto_nome: produto.name,
        quantidade: item.quantidade,
        preco_unitario: finalPrice,
        subtotal: itemSubtotal
      });
    }

    // Calcular desconto
    let valorDesconto = 0;
    if (desconto_tipo && desconto_valor && desconto_valor > 0) {
      if (desconto_tipo === 'percentual') {
        valorDesconto = (subtotal * desconto_valor) / 100;
      } else if (desconto_tipo === 'valor') {
        valorDesconto = desconto_valor;
      }
    }

    // Validar desconto
    if (valorDesconto > subtotal) {
      res.status(400).json({ error: 'O desconto não pode ser maior que o subtotal' });
      return;
    }

    const total = subtotal - valorDesconto;

    // Buscar nome do cliente
    const cliente = await Cliente.findById(cliente_id);
    const cliente_nome = cliente ? cliente.name : undefined;

    // Criar venda pendente (sem dar baixa no estoque)
    const venda = new Venda({
      cliente_id,
      cliente_nome,
      subtotal,
      desconto_tipo: desconto_tipo || undefined,
      desconto_valor: valorDesconto,
      total,
      observacoes,
      status: 'pendente',
      payment_method,
      itens: itensProcessados
    });

    await venda.save();

    res.status(201).json({
      id: venda._id,
      subtotal,
      desconto: valorDesconto,
      total,
      status: 'pendente',
      message: 'Venda do catálogo criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar venda do catálogo:', error);
    res.status(500).json({ error: 'Erro ao criar venda' });
  }
});

// Todas as rotas abaixo requerem autenticação
router.use(authenticate);

// Criar pré-venda (orçamento interno)
router.post('/pre-venda', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cliente_id, observacoes, itens, desconto_tipo, desconto_valor, payment_method, valor_frete } = req.body;

    if (!itens || itens.length === 0) {
      res.status(400).json({ error: 'Pelo menos um item é obrigatório' });
      return;
    }

    if (!cliente_id) {
      res.status(400).json({ error: 'Cliente é obrigatório' });
      return;
    }

    const { itensProcessados, subtotal, valorDesconto, total } = await processarItensEVenda({
      itens,
      desconto_tipo,
      desconto_valor
    });

    const cliente = await Cliente.findById(cliente_id);
    const cliente_nome = cliente ? cliente.name : undefined;

    const venda = new Venda({
      cliente_id,
      cliente_nome,
      subtotal,
      desconto_tipo: desconto_tipo || undefined,
      desconto_valor: valorDesconto,
      total,
      observacoes,
      status: 'pendente',
      payment_method,
      shipping_value: valor_frete ? parseFloat(valor_frete) : 0,
      itens: itensProcessados
    });

    await venda.save();

    res.status(201).json({
      id: venda._id,
      subtotal,
      desconto: valorDesconto,
      total,
      status: 'pendente',
      message: 'Pré-venda criada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao criar pré-venda:', error);
    res.status(400).json({ error: error.message || 'Erro ao criar pré-venda' });
  }
});

// Atualizar pré-venda pendente (itens, desconto, frete e pagamento)
router.put('/:id/pre-venda', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { cliente_id, observacoes, itens, desconto_tipo, desconto_valor, payment_method, valor_frete } = req.body;

    const venda = await Venda.findOne({ _id: id, status: 'pendente' });
    if (!venda) {
      res.status(404).json({ error: 'Pré-venda não encontrada ou já finalizada' });
      return;
    }

    if (!itens || itens.length === 0) {
      res.status(400).json({ error: 'Pelo menos um item é obrigatório' });
      return;
    }

    const { itensProcessados, subtotal, valorDesconto, total } = await processarItensEVenda({
      itens,
      desconto_tipo,
      desconto_valor
    });

    let cliente_nome = venda.cliente_nome;
    if (cliente_id) {
      const cliente = await Cliente.findById(cliente_id);
      cliente_nome = cliente ? cliente.name : venda.cliente_nome;
      venda.cliente_id = cliente_id;
    }

    venda.cliente_nome = cliente_nome;
    venda.itens = itensProcessados;
    venda.subtotal = subtotal;
    venda.desconto_tipo = desconto_tipo || undefined;
    venda.desconto_valor = valorDesconto;
    venda.total = total;
    venda.observacoes = observacoes;
    venda.payment_method = payment_method;
    venda.shipping_value = valor_frete ? parseFloat(valor_frete) : 0;

    await venda.save();

    res.json({
      id: venda._id,
      subtotal,
      desconto: valorDesconto,
      total,
      status: venda.status,
      message: 'Pré-venda atualizada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao atualizar pré-venda:', error);
    res.status(400).json({ error: error.message || 'Erro ao atualizar pré-venda' });
  }
});

// Endpoint para vendas normais (do SalesScreen)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cliente_id, observacoes, itens, desconto_tipo, desconto_valor, valor_pago, payment_method, valor_frete } = req.body;

    if (!itens || itens.length === 0) {
      res.status(400).json({ error: 'Pelo menos um item é obrigatório' });
      return;
    }

    // Validar estoque e buscar preços
    const itensProcessados = [];
    let subtotal = 0;

    for (const item of itens) {
      const produto = await Produto.findOne({ _id: item.produto_id, ativo: true });

      if (!produto) {
        res.status(400).json({ error: `Produto ${item.produto_id} não encontrado` });
        return;
      }

      if (produto.stock < item.quantidade) {
        res.status(400).json({ error: `Estoque insuficiente para produto ${produto.name}` });
        return;
      }

      const finalPrice = produto.promotional_price && produto.promotional_price > 0 && produto.promotional_price < produto.price
        ? produto.promotional_price
        : produto.price;

      const itemSubtotal = finalPrice * item.quantidade;
      subtotal += itemSubtotal;

      itensProcessados.push({
        produto_id: produto._id,
        produto_nome: produto.name,
        quantidade: item.quantidade,
        preco_unitario: finalPrice,
        subtotal: itemSubtotal
      });
    }

    // Calcular desconto
    let valorDesconto = 0;
    if (desconto_tipo && desconto_valor && desconto_valor > 0) {
      if (desconto_tipo === 'percentual') {
        valorDesconto = (subtotal * desconto_valor) / 100;
      } else if (desconto_tipo === 'valor') {
        valorDesconto = desconto_valor;
      }
    }

    // Validar desconto
    if (valorDesconto > subtotal) {
      res.status(400).json({ error: 'O desconto não pode ser maior que o subtotal' });
      return;
    }

    const total = subtotal - valorDesconto;

    // Calcular troco (apenas para pagamento em dinheiro)
    let troco = 0;
    if (payment_method === 'dinheiro' && valor_pago && valor_pago > total) {
      troco = valor_pago - total;
    }

    // Buscar nome do cliente se fornecido
    let cliente_nome;
    if (cliente_id) {
      const cliente = await Cliente.findById(cliente_id);
      if (cliente) {
        cliente_nome = cliente.name;
      }
    }

    // Dar baixa no estoque
    for (const item of itensProcessados) {
      const produtoAtual = await Produto.findById(item.produto_id);

      await Produto.findByIdAndUpdate(
        item.produto_id,
        { $inc: { stock: -item.quantidade } }
      );

      if (produtoAtual) {
        await createAuditLog({
          req,
          entityType: 'produto',
          entityId: String(item.produto_id),
          action: 'estoque_baixado_venda',
          changes: {
            stock: {
              from: Number(produtoAtual.stock),
              to: Number(produtoAtual.stock) - Number(item.quantidade),
            },
          },
          meta: {
            venda_id: undefined,
            quantidade: item.quantidade,
          },
        });
      }
    }

    // Criar venda
    const venda = new Venda({
      cliente_id: cliente_id || undefined,
      cliente_nome,
      subtotal,
      desconto_tipo: desconto_tipo || undefined,
      desconto_valor: valorDesconto,
      total,
      valor_pago: valor_pago || undefined,
      troco,
      payment_method,
      shipping_value: valor_frete ? parseFloat(valor_frete) : 0,
      observacoes,
      status: 'pago',
      itens: itensProcessados
    });

    await venda.save();

    await createAuditLog({
      req,
      entityType: 'venda',
      entityId: String(venda._id),
      action: 'venda_criada_paga',
      changes: {
        status: { from: 'pendente', to: 'pago' },
        total: venda.total,
      },
    });

    res.status(201).json({
      id: venda._id,
      subtotal,
      desconto: valorDesconto,
      total,
      troco,
      message: 'Venda criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(500).json({ error: 'Erro ao criar venda' });
  }
});

// Endpoint para confirmar vendas pendentes e dar baixa no estoque
router.put('/:id/confirm', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { shipping_value } = req.body;

    // Buscar venda pendente
    const venda = await Venda.findOne({ _id: id, status: 'pendente' });

    if (!venda) {
      res.status(404).json({ error: 'Venda não encontrada ou já confirmada' });
      return;
    }

    // Verificar estoque atual antes de dar baixa
    for (const item of venda.itens) {
      const produto = await Produto.findById(item.produto_id);

      if (!produto) {
        res.status(400).json({ error: `Produto ${item.produto_nome} não encontrado` });
        return;
      }

      // Permitir venda mesmo com estoque zerado ou negativo
    }

    // Dar baixa no estoque
    for (const item of venda.itens) {
      const produtoAtual = await Produto.findById(item.produto_id);

      await Produto.findByIdAndUpdate(
        item.produto_id,
        { $inc: { stock: -item.quantidade } }
      );

      if (produtoAtual) {
        await createAuditLog({
          req,
          entityType: 'produto',
          entityId: String(item.produto_id),
          action: 'estoque_baixado_confirmacao',
          changes: {
            stock: {
              from: Number(produtoAtual.stock),
              to: Number(produtoAtual.stock) - Number(item.quantidade),
            },
          },
          meta: {
            venda_id: String(venda._id),
            quantidade: item.quantidade,
          },
        });
      }
    }

    // Atualizar status da venda e frete
    const previousStatus = venda.status;
    const shippingVal = shipping_value ? parseFloat(shipping_value) : 0;
    venda.status = 'pago';
    venda.shipping_value = shippingVal;
    await venda.save();

    await createAuditLog({
      req,
      entityType: 'venda',
      entityId: String(venda._id),
      action: 'venda_confirmada',
      changes: {
        status: { from: previousStatus, to: venda.status },
      },
      meta: {
        shipping_value: shippingVal,
      },
    });

    res.json({ message: 'Venda confirmada com sucesso' });
  } catch (error) {
    console.error('Erro ao confirmar venda:', error);
    res.status(500).json({ error: 'Erro ao confirmar venda' });
  }
});

// Endpoint para cancelar pré-venda pendente
router.put('/:id/cancel-pre-venda', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const venda = await Venda.findById(id);

    if (!venda) {
      res.status(404).json({ error: 'Venda não encontrada' });
      return;
    }

    if (venda.status !== 'pendente') {
      res.status(400).json({ error: 'Somente pré-vendas pendentes podem ser canceladas' });
      return;
    }

    const previousStatus = venda.status;
    venda.status = 'cancelado';
    await venda.save();

    await createAuditLog({
      req,
      entityType: 'venda',
      entityId: String(venda._id),
      action: 'pre_venda_cancelada',
      changes: {
        status: { from: previousStatus, to: venda.status },
      },
    });

    res.json({ message: 'Pré-venda cancelada com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar pré-venda:', error);
    res.status(500).json({ error: 'Erro ao cancelar pré-venda' });
  }
});

// Listar vendas com filtros
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cliente_id, status, data_inicio, data_fim } = req.query;

    let query: any = {};

    if (cliente_id) {
      query.cliente_id = cliente_id;
    }

    if (status) {
      query.status = status;
    }

    if (data_inicio || data_fim) {
      query.createdAt = {};
      if (data_inicio) {
        query.createdAt.$gte = new Date(data_inicio as string);
      }
      if (data_fim) {
        const endDate = new Date(data_fim as string);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const vendas = await Venda.find(query).sort({ createdAt: -1 });

    res.json(vendas);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar venda por ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const venda = await Venda.findById(id);

    if (!venda) {
      res.status(404).json({ error: 'Venda não encontrada' });
      return;
    }

    res.json(venda);
  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar status da venda
router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pendente', 'pago', 'cancelado'].includes(status)) {
      res.status(400).json({ error: 'Status inválido' });
      return;
    }

    const vendaAtual = await Venda.findById(id);

    if (!vendaAtual) {
      res.status(404).json({ error: 'Venda não encontrada' });
      return;
    }

    const previousStatus = vendaAtual.status;
    vendaAtual.status = status;
    await vendaAtual.save();

    await createAuditLog({
      req,
      entityType: 'venda',
      entityId: String(vendaAtual._id),
      action: 'venda_status_atualizado',
      changes: {
        status: { from: previousStatus, to: vendaAtual.status },
      },
    });

    res.json({ message: 'Status da venda atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar status da venda:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
