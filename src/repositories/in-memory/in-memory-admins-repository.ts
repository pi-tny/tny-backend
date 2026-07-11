import type { Admin } from "../../../generated/prisma";
import type {
  AdminsRepository,
  CreateAdminData,
  LoginState,
  UpdateAdminData,
} from "@/repositories/admins-repository";

export class InMemoryAdminsRepository implements AdminsRepository {
  public items: Admin[] = [];
  private nextId = 1;

  async findByEmail(email: string): Promise<Admin | null> {
    return this.items.find((item) => item.email === email) ?? null;
  }

  async findById(id: number): Promise<Admin | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async findMany(): Promise<Admin[]> {
    return [...this.items].sort((a, b) => a.id - b.id);
  }

  async create(data: CreateAdminData): Promise<Admin> {
    const admin: Admin = {
      id: this.nextId++,
      name: data.name,
      email: data.email,
      password_hash: data.password_hash,
      active: true,
      failed_login_attempts: 0,
      locked_until: null,
      created_at: new Date(),
    };
    this.items.push(admin);
    return admin;
  }

  async update(id: number, data: UpdateAdminData): Promise<Admin | null> {
    const admin = this.items.find((item) => item.id === id);
    if (!admin) return null;

    if (data.name !== undefined) admin.name = data.name;
    if (data.email !== undefined) admin.email = data.email;
    if (data.password_hash !== undefined) {
      admin.password_hash = data.password_hash;
    }
    if (data.active !== undefined) admin.active = data.active;

    return admin;
  }

  async updateLoginState(id: number, data: LoginState): Promise<void> {
    const admin = this.items.find((item) => item.id === id);
    if (!admin) return;
    admin.failed_login_attempts = data.failed_login_attempts;
    admin.locked_until = data.locked_until;
  }

  async delete(id: number): Promise<boolean> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) return false;
    this.items.splice(index, 1);
    return true;
  }
}
