import { Router, Request, Response } from 'express';
import Produto from '../models/Produto';
import { uploadProduto } from '../middleware/upload';
import { authenticate } from '../middleware/auth';
import cloudinary from '../config/cloudinary';

const router = Router();

// Helper para extrair public_id de URL do Cloudinary
const extractPublicId = (url: string): string | null => {
  try {
    // URL do Cloudinary: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/filename.ext
    const matches = url.match(/\/sosbeauty\/produtos\/([^/.]+)/);
    return matches ? `sosbeauty/produtos/${matches[1]}` : null;
  } catch {
    return null;
  }
};

// Todas as rotas de produtos requerem autenticação
router.use(authenticate);

// Criar novo produto
router.post('/', uploadProduto.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, brand, description, category, cost, price, promotional_price, stock } = req.body;

    if (!name || price === undefined || stock === undefined) {
      // Com Cloudinary, não precisa remover arquivo manualmente (já está na nuvem)
      res.status(400).json({ error: 'Nome, preço e estoque são obrigatórios' });
      return;
    }

    // Cloudinary retorna a URL completa da imagem
    const imagePath = req.file ? (req.file as any).path : undefined;

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
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    const oldImagePath = produtoAtual.image;
    const oldImagePublicId = oldImagePath ? extractPublicId(oldImagePath) : null;
    let newImagePath;

    if (req.file) {
      // Nova imagem foi enviada - Cloudinary retorna URL completa
      newImagePath = (req.file as any).path;

      // Remover imagem antiga do Cloudinary se existir
      if (oldImagePublicId) {
        cloudinary.uploader.destroy(oldImagePublicId).catch((err) => {
          console.error('Erro ao remover imagem antiga do Cloudinary:', err);
        });
      }
    } else if (removeImage === 'true') {
      // Usuário quer remover a imagem
      newImagePath = undefined;

      // Remover do Cloudinary
      if (oldImagePublicId) {
        cloudinary.uploader.destroy(oldImagePublicId).catch((err) => {
          console.error('Erro ao remover imagem do Cloudinary:', err);
        });
      }
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
      // Aceitar 0 para remover promoção, ou o valor informado
      promotional_price: promotional_price !== undefined && promotional_price !== ''
        ? parseFloat(promotional_price)
        : undefined,
      stock: parseInt(stock),
      image: newImagePath
    };

    await Produto.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    res.json({ message: 'Produto atualizado com sucesso', image: newImagePath });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
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
