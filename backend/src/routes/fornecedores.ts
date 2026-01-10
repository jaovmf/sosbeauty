import { Router, Request, Response } from 'express';
import Fornecedor from '../models/Fornecedor';
import { authenticate } from '../middleware/auth';

const router = Router();

// Todas as rotas de fornecedores requerem autenticação
router.use(authenticate);

// Listar todos os fornecedores
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, ativo } = req.query;

    let query: any = {};

    if (search) {
      query.$or = [
        { nome: { $regex: search, $options: 'i' } },
        { razao_social: { $regex: search, $options: 'i' } },
        { cnpj: { $regex: search, $options: 'i' } }
      ];
    }

    if (ativo !== undefined) {
      query.ativo = ativo === 'true';
    }

    const fornecedores = await Fornecedor.find(query).sort({ nome: 1 });

    res.json({
      total: fornecedores.length,
      fornecedores
    });
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar fornecedor por ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const fornecedor = await Fornecedor.findById(id);

    if (!fornecedor) {
      res.status(404).json({ error: 'Fornecedor não encontrado' });
      return;
    }

    res.json(fornecedor);
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo fornecedor
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      nome,
      razao_social,
      cnpj,
      email,
      telefone,
      celular,
      endereco,
      bairro,
      cidade,
      estado,
      cep,
      site,
      observacoes
    } = req.body;

    // Validações básicas
    if (!nome || nome.trim() === '') {
      res.status(400).json({ error: 'Nome do fornecedor é obrigatório' });
      return;
    }

    // Verificar se CNPJ já existe (se fornecido)
    if (cnpj && cnpj.trim() !== '') {
      const fornecedorExistente = await Fornecedor.findOne({ cnpj: cnpj.trim() });
      if (fornecedorExistente) {
        res.status(400).json({ error: 'CNPJ já cadastrado' });
        return;
      }
    }

    const fornecedor = new Fornecedor({
      nome: nome.trim(),
      razao_social: razao_social?.trim(),
      cnpj: cnpj?.trim() || undefined,
      email: email?.trim(),
      telefone: telefone?.trim(),
      celular: celular?.trim(),
      endereco: endereco?.trim(),
      bairro: bairro?.trim(),
      cidade: cidade?.trim(),
      estado: estado?.trim(),
      cep: cep?.trim(),
      site: site?.trim(),
      observacoes: observacoes?.trim(),
      ativo: true
    });

    await fornecedor.save();

    res.status(201).json({
      message: 'Fornecedor criado com sucesso',
      fornecedor
    });
  } catch (error: any) {
    console.error('Erro ao criar fornecedor:', error);

    if (error.code === 11000) {
      res.status(400).json({ error: 'CNPJ já cadastrado' });
      return;
    }

    res.status(500).json({ error: 'Erro ao criar fornecedor' });
  }
});

// Atualizar fornecedor
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      nome,
      razao_social,
      cnpj,
      email,
      telefone,
      celular,
      endereco,
      bairro,
      cidade,
      estado,
      cep,
      site,
      observacoes,
      ativo
    } = req.body;

    const fornecedor = await Fornecedor.findById(id);

    if (!fornecedor) {
      res.status(404).json({ error: 'Fornecedor não encontrado' });
      return;
    }

    // Validações
    if (nome && nome.trim() === '') {
      res.status(400).json({ error: 'Nome do fornecedor não pode ser vazio' });
      return;
    }

    // Verificar se CNPJ já existe em outro fornecedor
    if (cnpj && cnpj.trim() !== '') {
      const fornecedorComCNPJ = await Fornecedor.findOne({
        cnpj: cnpj.trim(),
        _id: { $ne: id }
      });

      if (fornecedorComCNPJ) {
        res.status(400).json({ error: 'CNPJ já cadastrado em outro fornecedor' });
        return;
      }
    }

    // Atualizar campos
    if (nome) fornecedor.nome = nome.trim();
    if (razao_social !== undefined) fornecedor.razao_social = razao_social?.trim();
    if (cnpj !== undefined) fornecedor.cnpj = cnpj?.trim() || undefined;
    if (email !== undefined) fornecedor.email = email?.trim();
    if (telefone !== undefined) fornecedor.telefone = telefone?.trim();
    if (celular !== undefined) fornecedor.celular = celular?.trim();
    if (endereco !== undefined) fornecedor.endereco = endereco?.trim();
    if (bairro !== undefined) fornecedor.bairro = bairro?.trim();
    if (cidade !== undefined) fornecedor.cidade = cidade?.trim();
    if (estado !== undefined) fornecedor.estado = estado?.trim();
    if (cep !== undefined) fornecedor.cep = cep?.trim();
    if (site !== undefined) fornecedor.site = site?.trim();
    if (observacoes !== undefined) fornecedor.observacoes = observacoes?.trim();
    if (ativo !== undefined) fornecedor.ativo = ativo;

    await fornecedor.save();

    res.json({
      message: 'Fornecedor atualizado com sucesso',
      fornecedor
    });
  } catch (error: any) {
    console.error('Erro ao atualizar fornecedor:', error);

    if (error.code === 11000) {
      res.status(400).json({ error: 'CNPJ já cadastrado em outro fornecedor' });
      return;
    }

    res.status(500).json({ error: 'Erro ao atualizar fornecedor' });
  }
});

// Desativar fornecedor (soft delete)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const fornecedor = await Fornecedor.findById(id);

    if (!fornecedor) {
      res.status(404).json({ error: 'Fornecedor não encontrado' });
      return;
    }

    fornecedor.ativo = false;
    await fornecedor.save();

    res.json({ message: 'Fornecedor desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao desativar fornecedor' });
  }
});

// Reativar fornecedor
router.post('/:id/reativar', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const fornecedor = await Fornecedor.findById(id);

    if (!fornecedor) {
      res.status(404).json({ error: 'Fornecedor não encontrado' });
      return;
    }

    fornecedor.ativo = true;
    await fornecedor.save();

    res.json({ message: 'Fornecedor reativado com sucesso' });
  } catch (error) {
    console.error('Erro ao reativar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao reativar fornecedor' });
  }
});

export default router;
