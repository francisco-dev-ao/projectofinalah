
export type UserRole = 'admin' | 'cliente' | 'suporte' | 'comercial' | 'super_admin';
export type AdminRole = UserRole;

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
