import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Usuario, { IUsuario, UserRole } from '../models/Usuario';

const JWT_SECRET: string = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-mude-em-producao';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

// Estender o tipo Request para incluir usuario
declare global {
  namespace Express {
    interface Request {
      usuario?: IUsuario;
      userId?: string;
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Middleware: Verificar se usuário está autenticado
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Buscar token do header Authorization ou cookies
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        error: 'Não autorizado. Token não fornecido.'
      });
      return;
    }

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Buscar usuário
    const usuario = await Usuario.findById(decoded.id).select('+password');

    if (!usuario) {
      res.status(401).json({
        error: 'Usuário não encontrado. Token inválido.'
      });
      return;
    }

    if (!usuario.ativo) {
      res.status(403).json({
        error: 'Usuário inativo. Acesso negado.'
      });
      return;
    }

    // Adicionar usuário ao request
    req.usuario = usuario;
    req.userId = usuario._id.toString();

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        error: 'Token inválido.'
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'Token expirado. Faça login novamente.'
      });
      return;
    }

    res.status(500).json({
      error: 'Erro ao verificar autenticação.'
    });
  }
};

/**
 * Middleware: Verificar se usuário tem uma das roles permitidas
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      res.status(401).json({
        error: 'Não autenticado.'
      });
      return;
    }

    if (!roles.includes(req.usuario.role)) {
      res.status(403).json({
        error: 'Você não tem permissão para acessar este recurso.',
        requiredRoles: roles,
        yourRole: req.usuario.role
      });
      return;
    }

    next();
  };
};

/**
 * Middleware: Apenas Super Admin
 */
export const superAdminOnly = authorize('super_admin');

/**
 * Middleware: Admin ou superior
 */
export const adminOnly = authorize('super_admin', 'admin');

/**
 * Middleware: Gerente ou superior
 */
export const gerenteOnly = authorize('super_admin', 'admin', 'gerente');

/**
 * Utilitário: Gerar JWT Token
 */
export const generateToken = (usuario: IUsuario): string => {
  const payload: JwtPayload = {
    id: usuario._id.toString(),
    email: usuario.email,
    role: usuario.role
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as jwt.SignOptions);
};

/**
 * Utilitário: Verificar se usuário pode acessar recurso
 */
export const canAccess = (usuario: IUsuario, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(usuario.role);
};

// Hierarquia de permissões
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 5,
  admin: 4,
  gerente: 3,
  vendedor: 2,
  visualizador: 1
};

/**
 * Verificar se role tem nível de permissão suficiente
 */
export const hasPermissionLevel = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

export { JWT_SECRET, JWT_EXPIRES_IN };
