import { Router, Request, Response } from 'express';
import Produto from '../models/Produto';
import { uploadProduto } from '../middleware/upload';
import { authenticate } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

const router = Router();

// Todas as rotas de produtos requerem autenticação
router.use(authenticate);

// Criar novo produto
router.post('/', uploadProduto.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, brand, description, category, cost, price, promotional_price, stock } = req.body;

    if (!name || price === undefined || stock === undefined) {
      if (req.file) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Erro ao remover arquivo:', unlinkErr);
        });
      }
      res.status(400).json({ error: 'Nome, preço e estoque são obrigatórios' });
      return;
    }

    const imagePath = req.file ? `/uploads/produtos/${req.file.filename}` : undefined;

    const produto = new Produto({
      name,
      brand,
      description,
      category,
      cost: cost ? parseFloat(cost) : undefined,
      price: parseFloat(price),
      promotional_price: promotional_price ? parseFloat(promotional_price) : undefined,
      stock: parseInt(stock),
      image: imagePath,
      ativo: true
    });

    await produto.save();

    res.status(201).json({
      ...produto.toJSON(),
      message: 'Produto adicionado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);

    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Erro ao remover arquivo:', unlinkErr);
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Consultar estoque com filtros
router.get('/estoque', async (req: Request, res: Response): Promise<void> => {
  try {
    const { produto_id, categoria, estoque_baixo, promocional } = req.query as any;

    let query: any = { ativo: true };

    if (produto_id) {
      query._id = produto_id;
    }

    if (categoria) {
      query.category = categoria;
    }

    if (estoque_baixo === 'true') {
      query.stock = { $lte: 10 };
    }

    if (promocional === 'true') {
      query.promotional_price = { $exists: true, $gt: 0 };
    }

    const produtos = await Produto.find(query).sort({ name: 1 });

    res.json({
      produtos,
      total: produtos.length
    });
  } catch (error) {
    console.error('Erro ao consultar estoque:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar produtos promocionais
router.get('/promocionais', async (req: Request, res: Response): Promise<void> => {
  try {
    const produtos = await Produto.find({
      ativo: true,
      promotional_price: { $exists: true, $gt: 0 }
    }).sort({ name: 1 });

    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos promocionais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar todos os produtos ativos
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const produtos = await Produto.find({ ativo: true }).sort({ name: 1 });
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar produto por ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const produto = await Produto.findOne({ _id: id, ativo: true });

    if (!produto) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    res.json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar produto
router.put('/:id', uploadProduto.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, brand, description, category, cost, price, promotional_price, stock, removeImage } = req.body;

    // Buscar produto atual
    const produtoAtual = await Produto.findOne({ _id: id, ativo: true });

    if (!produtoAtual) {
      if (req.file) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Erro ao remover arquivo:', unlinkErr);
        });
      }
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    const oldImagePath = produtoAtual.image;
    let newImagePath;

    if (req.file) {
      // Nova imagem foi enviada
      newImagePath = `/uploads/produtos/${req.file.filename}`;
    } else if (removeImage === 'true') {
      // Usuário quer remover a imagem
      newImagePath = undefined;
    } else {
      // Manter imagem atual
      newImagePath = oldImagePath;
    }

    // Atualizar produto
    const updateData: any = {
      name,
      brand,
      description,
      category,
      cost: cost ? parseFloat(cost) : undefined,
      price: parseFloat(price),
      promotional_price: promotional_price ? parseFloat(promotional_price) : undefined,
      stock: parseInt(stock),
      image: newImagePath
    };

    await Produto.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    // Remover arquivo físico quando necessário
    if ((req.file || removeImage === 'true') && oldImagePath) {
      const oldFilePath = path.join(__dirname, '../../', oldImagePath);
      fs.unlink(oldFilePath, (unlinkErr) => {
        if (unlinkErr) console.error('Erro ao remover imagem antiga:', unlinkErr);
      });
    }

    res.json({ message: 'Produto atualizado com sucesso', image: newImagePath });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);

    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Erro ao remover arquivo:', unlinkErr);
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar produto (soft delete)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const produto = await Produto.findByIdAndUpdate(
      id,
      { ativo: false },
      { new: true }
    );

    if (!produto) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    res.json({ message: 'Produto removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
