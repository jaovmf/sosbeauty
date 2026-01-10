import express, { Request, Response } from 'express';
import Usuario from '../models/Usuario';
import { authenticate, superAdminOnly, generateToken } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/auth/register
 * Registrar novo usuário (apenas super_admin pode criar)
 */
router.post('/register', authenticate, superAdminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, phone, avatar } = req.body;

    // Validar campos obrigatórios
    if (!name || !email || !password) {
      res.status(400).json({
        error: 'Nome, email e senha são obrigatórios.'
      });
      return;
    }

    // Verificar se email já existe
    const emailExiste = await Usuario.findOne({ email: email.toLowerCase() });
    if (emailExiste) {
      res.status(400).json({
        error: 'Email já cadastrado.'
      });
      return;
    }

    // Criar usuário
    const usuario = new Usuario({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'vendedor',
      phone,
      avatar,
      ativo: true
    });

    await usuario.save();

    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      usuario: {
        id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
        roleName: usuario.roleName,
        ativo: usuario.ativo
      }
    });
  } catch (error: any) {
    console.error('Erro ao registrar usuário:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        error: 'Erro de validação',
        details: messages
      });
      return;
    }

    res.status(500).json({
      error: 'Erro ao registrar usuário.'
    });
  }
});

/**
 * POST /api/auth/login
 * Login de usuário
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      res.status(400).json({
        error: 'Email e senha são obrigatórios.'
      });
      return;
    }

    // Buscar usuário com senha
    const usuario = await Usuario.findOne({
      email: email.toLowerCase()
    }).select('+password');

    if (!usuario) {
      res.status(401).json({
        error: 'Email ou senha inválidos.'
      });
      return;
    }

    // Verificar se usuário está ativo
    if (!usuario.ativo) {
      res.status(403).json({
        error: 'Usuário inativo. Entre em contato com o administrador.'
      });
      return;
    }

    // Verificar senha
    const senhaCorreta = await usuario.comparePassword(password);
    if (!senhaCorreta) {
      res.status(401).json({
        error: 'Email ou senha inválidos.'
      });
      return;
    }

    // Atualizar último login
    usuario.lastLogin = new Date();
    await usuario.save();

    // Gerar token
    const token = generateToken(usuario);

    // Enviar cookie (opcional)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });

    res.json({
      message: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
        roleName: usuario.roleName,
        avatar: usuario.avatar,
        phone: usuario.phone,
        lastLogin: usuario.lastLogin
      }
    });
  } catch (error: any) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({
      error: 'Erro ao fazer login.'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout de usuário
 */
router.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    // Limpar cookie
    res.clearCookie('token');

    res.json({
      message: 'Logout realizado com sucesso!'
    });
  } catch (error: any) {
    console.error('Erro ao fazer logout:', error);
    res.status(500).json({
      error: 'Erro ao fazer logout.'
    });
  }
});

/**
 * GET /api/auth/me
 * Obter perfil do usuário logado
 */
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.usuario) {
      res.status(401).json({
        error: 'Não autenticado.'
      });
      return;
    }

    res.json({
      usuario: {
        id: req.usuario._id,
        name: req.usuario.name,
        email: req.usuario.email,
        role: req.usuario.role,
        roleName: req.usuario.roleName,
        avatar: req.usuario.avatar,
        phone: req.usuario.phone,
        ativo: req.usuario.ativo,
        lastLogin: req.usuario.lastLogin,
        createdAt: req.usuario.createdAt
      }
    });
  } catch (error: any) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({
      error: 'Erro ao obter perfil.'
    });
  }
});

/**
 * PUT /api/auth/me
 * Atualizar perfil do usuário logado
 */
router.put('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.usuario) {
      res.status(401).json({
        error: 'Não autenticado.'
      });
      return;
    }

    const { name, phone, avatar, currentPassword, newPassword } = req.body;

    const usuario = await Usuario.findById(req.usuario._id).select('+password');

    if (!usuario) {
      res.status(404).json({
        error: 'Usuário não encontrado.'
      });
      return;
    }

    // Atualizar campos básicos
    if (name) usuario.name = name;
    if (phone !== undefined) usuario.phone = phone;
    if (avatar !== undefined) usuario.avatar = avatar;

    // Alterar senha (se fornecida)
    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({
          error: 'Senha atual é obrigatória para alterar a senha.'
        });
        return;
      }

      const senhaCorreta = await usuario.comparePassword(currentPassword);
      if (!senhaCorreta) {
        res.status(401).json({
          error: 'Senha atual incorreta.'
        });
        return;
      }

      usuario.password = newPassword;
    }

    await usuario.save();

    res.json({
      message: 'Perfil atualizado com sucesso!',
      usuario: {
        id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
        roleName: usuario.roleName,
        avatar: usuario.avatar,
        phone: usuario.phone
      }
    });
  } catch (error: any) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      error: 'Erro ao atualizar perfil.'
    });
  }
});

/**
 * POST /api/auth/first-user
 * Criar primeiro super admin (apenas se não existir nenhum usuário)
 */
router.post('/first-user', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificar se já existe algum usuário
    const totalUsuarios = await Usuario.countDocuments();

    if (totalUsuarios > 0) {
      res.status(403).json({
        error: 'Já existem usuários cadastrados. Use a rota de registro.'
      });
      return;
    }

    const { name, email, password } = req.body;

    // Validar campos
    if (!name || !email || !password) {
      res.status(400).json({
        error: 'Nome, email e senha são obrigatórios.'
      });
      return;
    }

    // Criar primeiro super admin
    const usuario = new Usuario({
      name,
      email: email.toLowerCase(),
      password,
      role: 'super_admin',
      ativo: true
    });

    await usuario.save();

    // Gerar token
    const token = generateToken(usuario);

    res.status(201).json({
      message: 'Super Admin criado com sucesso!',
      token,
      usuario: {
        id: usuario._id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
        roleName: usuario.roleName
      }
    });
  } catch (error: any) {
    console.error('Erro ao criar primeiro usuário:', error);
    res.status(500).json({
      error: 'Erro ao criar primeiro usuário.'
    });
  }
});

export default router;
