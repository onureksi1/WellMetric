import client from './client';

export const adminUsersApi = {
  getAll: (filters: any) =>
    client.get('/admin/users', { params: filters }),
  getStats: () =>
    client.get('/admin/users/stats'),
  getOne: (id: string) =>
    client.get(`/admin/users/${id}`),
  create: (dto: any) =>
    client.post('/admin/users', dto),
  update: (id: string, dto: any) =>
    client.patch(`/admin/users/${id}`, dto),
  updateStatus: (id: string, isActive: boolean) =>
    client.patch(`/admin/users/${id}/status`, { is_active: isActive }),
  assignCompany: (id: string, dto: any) =>
    client.patch(`/admin/users/${id}/assign-company`, dto),
  resendInvite: (id: string) =>
    client.post(`/admin/users/${id}/resend-invite`),
  delete: (id: string) =>
    client.delete(`/admin/users/${id}`),
};
