import type { Request } from 'express';
import AuditLog from '../models/AuditLog';

interface CreateAuditLogParams {
  req: Request;
  entityType: 'produto' | 'venda';
  entityId: string;
  action: string;
  changes: Record<string, any>;
  meta?: Record<string, any>;
}

export const createAuditLog = async ({
  req,
  entityType,
  entityId,
  action,
  changes,
  meta,
}: CreateAuditLogParams): Promise<void> => {
  try {
    await AuditLog.create({
      entityType,
      entityId,
      action,
      actorId: req.userId,
      actorName: req.usuario?.name,
      changes,
      meta: {
        ...meta,
        ip: req.ip,
        userAgent: req.get('user-agent') || '',
      },
    });
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
  }
};
