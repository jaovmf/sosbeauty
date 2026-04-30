import api from '../lib/api';

export interface UserPreferencesPayload {
  [key: string]: any;
}

export const userPreferencesService = {
  async getPreferences(): Promise<Record<string, any>> {
    const response = await api.get('/usuarios/me/preferences');
    return response.data?.preferences || {};
  },

  async patchPreferences(preferences: UserPreferencesPayload): Promise<Record<string, any>> {
    const response = await api.patch('/usuarios/me/preferences', { preferences });
    return response.data?.preferences || {};
  },
};

export default userPreferencesService;
