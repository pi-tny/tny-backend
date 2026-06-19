import type { Admin } from "../../../generated/prisma";
import type { AdminsRepository } from "@/repositories/admins-repository";

interface ListAdminsUseCaseResponse {
  admins: Admin[];
}

export class ListAdminsUseCase {
  constructor(private adminsRepository: AdminsRepository) {}

  async execute(): Promise<ListAdminsUseCaseResponse> {
    const admins = await this.adminsRepository.findMany();
    return { admins };
  }
}
