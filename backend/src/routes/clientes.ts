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
