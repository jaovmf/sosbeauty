import { Router, Request, Response } from 'express';
import AuditLog from '../models/AuditLog';
import { authenticate, gerenteOnly } from '../middleware/auth';

const router = Router();

router.use(authenticate, gerenteOnly);

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      entityType,
      action,
      actorName,
      entityId,
      startDate,
      endDate,
      page = '1',
      limit = '20',
    } = req.query;

    const query: Record<string, any> = {};

    if (entityType) {
      query.entityType = entityType;
    }

    if (action) {
      query.action = { $regex: String(action), $options: 'i' };
    }

    if (actorName) {
      query.actorName = { $regex: String(actorName), $options: 'i' };
    }

    if (entityId) {
      query.entityId = { $regex: String(entityId), $options: 'i' };
    }

    if (startDate || endDate) {
      query.createdAt = {};

      if (startDate) {
        query.createdAt.$gte = new Date(String(startDate));
      }

      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.min(100, Math.max(5, Number(limit)));
    const skip = (pageNumber - 1) * limitNumber;

    const [items, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      items,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    });
  } catch (error) {
    console.error('Erro ao listar auditoria:', error);
    res.status(500).json({ error: 'Erro ao listar auditoria.' });
  }
});

export default router;
