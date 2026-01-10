import express, { Request, Response } from 'express';
import Usuario from '../models/Usuario';
import { authenticate, superAdminOnly, adminOnly } from '../middleware/auth';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * GET /api/usuarios
 * Listar todos os usuários (apenas admin ou super_admin)
 */
router.get('/', adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, role, ativo } = req.query;

    // Construir filtro
    const filtro: any = {};

    if (search) {
      filtro.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      filtro.role = role;
    }

    if (ativo !== undefined) {
      filtro.ativo = ativo === 'true';
    }

    const usuarios = await Usuario.find(filtro).sort({ createdAt: -1 });

    res.json({
      total: usuarios.length,
      usuarios: usuarios.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        roleName: u.roleName,
        ativo: u.ativo,
        avatar: u.avatar,
        phone: u.phone,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt
      }))
    });
  } catch (error: any) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      error: 'Erro ao listar usuários.'
    });
  }
});

/**
 * GET /api/usuarios/:id
 * Obter usuário por ID
 */
router.get('/:id', adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id);

    if (!usuario) {
      res.status(404).json({
        error: 'Usuário não encontrado.'
      });
      return;
    }

    res.json({
      usuario: {
        id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
        roleName: usuario.roleName,
        ativo: usuario.ativo,
        avatar: usuario.avatar,
        phone: usuario.phone,
        lastLogin: usuario.lastLogin,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt
      }
    });
  } catch (error: any) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({
      error: 'Erro ao obter usuário.'
    });
  }
});

/**
 * PUT /api/usuarios/:id
 * Atualizar usuário (apenas super_admin)
 */
router.put('/:id', superAdminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role, ativo, phone, avatar, password } = req.body;

    const usuario = await Usuario.findById(id).select('+password');

    if (!usuario) {
      res.status(404).json({
        error: 'Usuário não encontrado.'
      });
      return;
    }

    // Atualizar campos
    if (name) usuario.name = name;
    if (email) usuario.email = email.toLowerCase();
    if (role) usuario.role = role;
    if (ativo !== undefined) usuario.ativo = ativo;
    if (phone !== undefined) usuario.phone = phone;
    if (avatar !== undefined) usuario.avatar = avatar;
    if (password) usuario.password = password; // Será hasheada pelo middleware pre-save

    await usuario.save();

    res.json({
      message: 'Usuário atualizado com sucesso!',
      usuario: {
        id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
        roleName: usuario.roleName,
        ativo: usuario.ativo,
        avatar: usuario.avatar,
        phone: usuario.phone
      }
    });
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);

    if (error.code === 11000) {
      res.status(400).json({
        error: 'Email já cadastrado para outro usuário.'
      });
      return;
    }

    res.status(500).json({
      error: 'Erro ao atualizar usuário.'
    });
  }
});

/**
 * DELETE /api/usuarios/:id
 * Desativar usuário (soft delete - apenas super_admin)
 */
router.delete('/:id', superAdminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Não permitir deletar a si mesmo
    if (req.userId === id) {
      res.status(400).json({
        error: 'Você não pode desativar sua própria conta.'
      });
      return;
    }

    const usuario = await Usuario.findById(id);

    if (!usuario) {
      res.status(404).json({
        error: 'Usuário não encontrado.'
      });
      return;
    }

    // Soft delete
    usuario.ativo = false;
    await usuario.save();

    res.json({
      message: 'Usuário desativado com sucesso!',
      usuario: {
        id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        ativo: usuario.ativo
      }
    });
  } catch (error: any) {
    console.error('Erro ao desativar usuário:', error);
    res.status(500).json({
      error: 'Erro ao desativar usuário.'
    });
  }
});

/**
 * POST /api/usuarios/:id/reativar
 * Reativar usuário (apenas super_admin)
 */
router.post('/:id/reativar', superAdminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id);

    if (!usuario) {
      res.status(404).json({
        error: 'Usuário não encontrado.'
      });
      return;
    }

    usuario.ativo = true;
    await usuario.save();

    res.json({
      message: 'Usuário reativado com sucesso!',
      usuario: {
        id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        ativo: usuario.ativo
      }
    });
  } catch (error: any) {
    console.error('Erro ao reativar usuário:', error);
    res.status(500).json({
      error: 'Erro ao reativar usuário.'
    });
  }
});

/**
 * GET /api/usuarios/stats/resumo
 * Estatísticas de usuários
 */
router.get('/stats/resumo', adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const total = await Usuario.countDocuments();
    const ativos = await Usuario.countDocuments({ ativo: true });
    const inativos = await Usuario.countDocuments({ ativo: false });

    const porRole = await Usuario.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      total,
      ativos,
      inativos,
      porRole: porRole.map((r) => ({
        role: r._id,
        count: r.count
      }))
    });
  } catch (error: any) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      error: 'Erro ao obter estatísticas.'
    });
  }
});

export default router;
