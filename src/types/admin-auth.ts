
export type UserRole = 'admin' | 'cliente' | 'suporte';
export type AdminRole = UserRole;

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
