import api from '../lib/api';
import type { AuditLogListResponse } from '../types/api';

interface ListAuditParams {
  entityType?: 'produto' | 'venda' | '';
  action?: string;
  actorName?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const auditoriaService = {
  async listar(params: ListAuditParams = {}): Promise<AuditLogListResponse> {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const response = await api.get<AuditLogListResponse>(`/auditoria?${query.toString()}`);
    return response.data;
  },
};

export default auditoriaService;
