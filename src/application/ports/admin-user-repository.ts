export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
};

export interface AdminUserRepository {
  findByEmail(email: string): Promise<AdminUser | null>;
}
