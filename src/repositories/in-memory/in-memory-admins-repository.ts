import type { Admin } from "../../../generated/prisma";
import type { AdminsRepository } from "@/repositories/admins-repository";

export class InMemoryAdminsRepository implements AdminsRepository {
  public items: Admin[] = [];

  async findByEmail(email: string): Promise<Admin | null> {
    return this.items.find((item) => item.email === email) ?? null;
  }

  async findById(id: number): Promise<Admin | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }
}
