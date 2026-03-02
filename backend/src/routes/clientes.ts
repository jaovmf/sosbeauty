import { Router, Request, Response } from 'express';
import Cliente from '../models/Cliente';
import Venda from '../models/Venda';
import { authenticate } from '../middleware/auth';

const router = Router();

// Todas as rotas de clientes requerem autenticação
router.use(authenticate);

// Criar novo cliente
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, street, neighborhood, city, state, zipCode } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Nome é obrigatório' });
      return;
    }

    const cliente = new Cliente({
      name,
      email,
      phone,
      street,
      neighborhood,
      city,
      state,
      zipCode
    });

    await cliente.save();

    res.status(201).json({
      ...cliente.toJSON(),
      message: 'Cliente cadastrado com sucesso'
    });
  } catch (error: any) {
    // Removido verificação de email duplicado (código 11000)
    // Agora permite múltiplos clientes com mesmo email
    console.error('Erro ao cadastrar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar clientes com busca opcional
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query = {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { city: searchRegex }
        ]
      };
    }

    const clientes = await Cliente.find(query).sort({ name: 1 });
    res.json(clientes);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// CRM simples de clientes (recência, frequência, valor)
router.get('/crm/resumo', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const diasInativo = Math.max(1, parseInt((req.query.dias_inativo as string) || '60', 10));

    let query: any = {};

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query = {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { city: searchRegex }
        ]
      };
    }

    const clientes = await Cliente.find(query).sort({ name: 1 });

    const vendasPorCliente = await Venda.aggregate([
      {
        $match: {
          status: 'pago',
          cliente_id: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$cliente_id',
          total_compras: { $sum: 1 },
          valor_total: { $sum: '$total' },
          ticket_medio: { $avg: '$total' },
          ultima_compra: { $max: '$createdAt' }
        }
      }
    ]);

    const vendasMap = new Map<string, any>();
    for (const item of vendasPorCliente) {
      vendasMap.set(String(item._id), item);
    }

    const now = new Date();

    const calcularScore = (totalCompras: number, valorTotal: number, diasSemComprar: number | null): number => {
      let scoreRecencia = 0;
      if (diasSemComprar !== null) {
        if (diasSemComprar <= 15) scoreRecencia = 40;
        else if (diasSemComprar <= 30) scoreRecencia = 30;
        else if (diasSemComprar <= 60) scoreRecencia = 20;
        else if (diasSemComprar <= diasInativo) scoreRecencia = 10;
      }

      let scoreFrequencia = 0;
      if (totalCompras >= 10) scoreFrequencia = 35;
      else if (totalCompras >= 5) scoreFrequencia = 25;
      else if (totalCompras >= 3) scoreFrequencia = 15;
      else if (totalCompras >= 1) scoreFrequencia = 8;

      let scoreValor = 0;
      if (valorTotal >= 5000) scoreValor = 25;
      else if (valorTotal >= 2000) scoreValor = 18;
      else if (valorTotal >= 1000) scoreValor = 12;
      else if (valorTotal >= 300) scoreValor = 6;

      return Math.min(100, scoreRecencia + scoreFrequencia + scoreValor);
    };

    const clientesCRM = clientes.map((cliente: any) => {
      const vendas = vendasMap.get(String(cliente._id));
      const totalCompras = vendas?.total_compras || 0;
      const valorTotal = vendas?.valor_total || 0;
      const ticketMedio = vendas?.ticket_medio || 0;
      const ultimaCompra = vendas?.ultima_compra || null;

      let diasSemComprar: number | null = null;
      if (ultimaCompra) {
        const diffMs = now.getTime() - new Date(ultimaCompra).getTime();
        diasSemComprar = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      const status_relacionamento = totalCompras === 0
        ? 'sem_compras'
        : (diasSemComprar !== null && diasSemComprar > diasInativo ? 'inativo' : 'ativo');

      const score = calcularScore(totalCompras, valorTotal, diasSemComprar);

      return {
        id: cliente._id,
        name: cliente.name,
        email: cliente.email,
        phone: cliente.phone,
        city: cliente.city,
        total_compras: totalCompras,
        valor_total: Math.round(valorTotal * 100) / 100,
        ticket_medio: Math.round(ticketMedio * 100) / 100,
        ultima_compra: ultimaCompra,
        dias_sem_comprar: diasSemComprar,
        status_relacionamento,
        score
      };
    });

    clientesCRM.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.valor_total !== a.valor_total) return b.valor_total - a.valor_total;
      return a.name.localeCompare(b.name);
    });

    const resumo = {
      total_clientes: clientesCRM.length,
      ativos: clientesCRM.filter(c => c.status_relacionamento === 'ativo').length,
      inativos: clientesCRM.filter(c => c.status_relacionamento === 'inativo').length,
      sem_compras: clientesCRM.filter(c => c.status_relacionamento === 'sem_compras').length,
      faturamento_total: Math.round(clientesCRM.reduce((sum, c) => sum + c.valor_total, 0) * 100) / 100
    };

    res.json({
      dias_inativo: diasInativo,
      resumo,
      clientes: clientesCRM
    });
  } catch (error) {
    console.error('Erro ao gerar CRM de clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar cliente por ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findById(id);

    if (!cliente) {
      res.status(404).json({ error: 'Cliente não encontrado' });
      return;
    }

    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar cliente
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, street, neighborhood, city, state, zipCode } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Nome é obrigatório' });
      return;
    }

    const cliente = await Cliente.findByIdAndUpdate(
      id,
      {
        name,
        email,
        phone,
        street,
        neighborhood,
        city,
        state,
        zipCode
      },
      { new: true, runValidators: true }
    );

    if (!cliente) {
      res.status(404).json({ error: 'Cliente não encontrado' });
      return;
    }

    res.json({ message: 'Cliente atualizado com sucesso' });
  } catch (error: any) {
    // Removido verificação de email duplicado
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar cliente
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Verificar se há vendas associadas
    const vendasCount = await Venda.countDocuments({ cliente_id: id });

    if (vendasCount > 0) {
      res.status(400).json({ error: 'Não é possível excluir cliente com vendas associadas' });
      return;
    }

    const cliente = await Cliente.findByIdAndDelete(id);

    if (!cliente) {
      res.status(404).json({ error: 'Cliente não encontrado' });
      return;
    }

    res.json({ message: 'Cliente removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
