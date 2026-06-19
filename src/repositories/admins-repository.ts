import type { Admin } from "../../generated/prisma";

// ISP: only the methods the auth use cases need. Admin management (create/list/
// update/delete) will extend this interface in its own slice.
export interface AdminsRepository {
  findByEmail(email: string): Promise<Admin | null>;
  findById(id: number): Promise<Admin | null>;
}
