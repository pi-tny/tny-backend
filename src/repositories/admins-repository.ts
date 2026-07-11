import type { Admin } from "../../generated/prisma";

export interface CreateAdminData {
  name: string;
  email: string;
  password_hash: string;
}

export interface UpdateAdminData {
  name?: string;
  email?: string;
  password_hash?: string;
  active?: boolean;
}

export interface LoginState {
  failed_login_attempts: number;
  locked_until: Date | null;
}

export interface AdminsRepository {
  findByEmail(email: string): Promise<Admin | null>;
  findById(id: number): Promise<Admin | null>;
  findMany(): Promise<Admin[]>;
  create(data: CreateAdminData): Promise<Admin>;
  update(id: number, data: UpdateAdminData): Promise<Admin | null>;
  delete(id: number): Promise<boolean>;
  // Atualiza o controle de tentativas de login / bloqueio da conta.
  updateLoginState(id: number, data: LoginState): Promise<void>;
}
