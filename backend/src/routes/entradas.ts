import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import EntradaMercadoria from '../models/EntradaMercadoria';
import Produto from '../models/Produto';
import Fornecedor from '../models/Fornecedor';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Listar todas as entradas de mercadoria
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fornecedor_id, data_inicio, data_fim, limit = '50' } = req.query;

    const filter: any = {};

    if (fornecedor_id) {
      filter.fornecedor_id = fornecedor_id;
    }

    if (data_inicio || data_fim) {
      filter.data_entrada = {};
      if (data_inicio) {
        filter.data_entrada.$gte = new Date(data_inicio as string);
      }
      if (data_fim) {
        filter.data_entrada.$lte = new Date(data_fim as string);
      }
    }

    const entradas = await EntradaMercadoria.find(filter)
      .populate('fornecedor_id', 'nome razao_social')
      .populate('usuario_id', 'name email')
      .populate('itens.produto_id', 'name brand')
      .sort({ data_entrada: -1 })
      .limit(parseInt(limit as string));

    res.json(entradas);
  } catch (error) {
    console.error('Erro ao listar entradas:', error);
    res.status(500).json({ error: 'Erro ao listar entradas de mercadoria' });
  }
});

// Buscar entrada por ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const entrada = await EntradaMercadoria.findById(id)
      .populate('fornecedor_id', 'nome razao_social cnpj')
      .populate('usuario_id', 'name email')
      .populate('itens.produto_id', 'name brand cost price stock');

    if (!entrada) {
      res.status(404).json({ error: 'Entrada não encontrada' });
      return;
    }

    res.json(entrada);
  } catch (error) {
    console.error('Erro ao buscar entrada:', error);
    res.status(500).json({ error: 'Erro ao buscar entrada' });
  }
});

// Criar nova entrada de mercadoria
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      numero_nota,
      fornecedor_id,
      data_entrada,
      itens,
      observacoes
    } = req.body;

    // Validações
    if (!fornecedor_id) {
      await session.abortTransaction();
      res.status(400).json({ error: 'Fornecedor é obrigatório' });
      return;
    }

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      await session.abortTransaction();
      res.status(400).json({ error: 'Deve haver pelo menos um item na entrada' });
      return;
    }

    // Verificar se o fornecedor existe e está ativo
    const fornecedor = await Fornecedor.findById(fornecedor_id).session(session);
    if (!fornecedor) {
      await session.abortTransaction();
      res.status(404).json({ error: 'Fornecedor não encontrado' });
      return;
    }

    if (!fornecedor.ativo) {
      await session.abortTransaction();
      res.status(400).json({ error: 'Fornecedor está inativo' });
      return;
    }

    // Validar e processar itens
    const itensProcessados = [];
    let custoTotal = 0;

    for (const item of itens) {
      const { produto_id, quantidade, custo_unitario } = item;

      if (!produto_id || !quantidade || quantidade <= 0 || custo_unitario < 0) {
        await session.abortTransaction();
        res.status(400).json({ error: 'Dados inválidos nos itens' });
        return;
      }

      // Verificar se o produto existe
      const produto = await Produto.findById(produto_id).session(session);
      if (!produto) {
        await session.abortTransaction();
        res.status(404).json({ error: `Produto ${produto_id} não encontrado` });
        return;
      }

      const itemCustoTotal = quantidade * custo_unitario;
      custoTotal += itemCustoTotal;

      itensProcessados.push({
        produto_id,
        quantidade,
        custo_unitario,
        custo_total: itemCustoTotal
      });

      // Atualizar estoque e custo do produto
      await Produto.findByIdAndUpdate(
        produto_id,
        {
          $inc: { stock: quantidade },
          $set: { cost: custo_unitario }
        },
        { session }
      );
    }

    // Criar entrada
    const entrada = new EntradaMercadoria({
      numero_nota: numero_nota?.trim(),
      fornecedor_id,
      data_entrada: data_entrada ? new Date(data_entrada) : new Date(),
      itens: itensProcessados,
      custo_total: custoTotal,
      observacoes: observacoes?.trim(),
      usuario_id: (req as any).user.id
    });

    await entrada.save({ session });

    await session.commitTransaction();

    // Buscar entrada completa com populate
    const entradaCompleta = await EntradaMercadoria.findById(entrada._id)
      .populate('fornecedor_id', 'nome razao_social')
      .populate('usuario_id', 'name email')
      .populate('itens.produto_id', 'name brand stock');

    res.status(201).json({
      message: 'Entrada de mercadoria registrada com sucesso',
      entrada: entradaCompleta
    });
  } catch (error: any) {
    await session.abortTransaction();
    console.error('Erro ao criar entrada:', error);
    res.status(500).json({ error: 'Erro ao criar entrada de mercadoria' });
  } finally {
    session.endSession();
  }
});

// Cancelar entrada de mercadoria (reverter estoque)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const entrada = await EntradaMercadoria.findById(id).session(session);

    if (!entrada) {
      await session.abortTransaction();
      res.status(404).json({ error: 'Entrada não encontrada' });
      return;
    }

    // Reverter estoque de todos os itens
    for (const item of entrada.itens) {
      await Produto.findByIdAndUpdate(
        item.produto_id,
        {
          $inc: { stock: -item.quantidade }
        },
        { session }
      );
    }

    // Deletar a entrada
    await EntradaMercadoria.findByIdAndDelete(id).session(session);

    await session.commitTransaction();

    res.json({
      message: 'Entrada de mercadoria cancelada com sucesso',
      entrada
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Erro ao cancelar entrada:', error);
    res.status(500).json({ error: 'Erro ao cancelar entrada de mercadoria' });
  } finally {
    session.endSession();
  }
});

// Obter relatório de entradas por período
router.get('/relatorio/periodo', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data_inicio, data_fim } = req.query;

    if (!data_inicio || !data_fim) {
      res.status(400).json({ error: 'Data de início e fim são obrigatórias' });
      return;
    }

    const entradas = await EntradaMercadoria.find({
      data_entrada: {
        $gte: new Date(data_inicio as string),
        $lte: new Date(data_fim as string)
      }
    })
      .populate('fornecedor_id', 'nome razao_social')
      .populate('usuario_id', 'name')
      .populate('itens.produto_id', 'name')
      .sort({ data_entrada: -1 });

    const totalEntradas = entradas.length;
    const valorTotal = entradas.reduce((acc, entrada) => acc + entrada.custo_total, 0);
    const quantidadeItens = entradas.reduce((acc, entrada) => {
      return acc + entrada.itens.reduce((sum, item) => sum + item.quantidade, 0);
    }, 0);

    res.json({
      periodo: {
        inicio: data_inicio,
        fim: data_fim
      },
      resumo: {
        total_entradas: totalEntradas,
        valor_total: valorTotal,
        quantidade_itens: quantidadeItens
      },
      entradas
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de entradas' });
  }
});

export default router;
