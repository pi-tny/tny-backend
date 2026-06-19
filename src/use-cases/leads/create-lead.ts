import type { Lead } from "../../../generated/prisma";
import type { LeadsRepository } from "@/repositories/leads-repository";

interface CreateLeadUseCaseRequest {
  name: string;
  email: string;
  phone: string;
  marketing_consent?: boolean;
}

interface CreateLeadUseCaseResponse {
  lead: Lead;
}

export class CreateLeadUseCase {
  constructor(private leadsRepository: LeadsRepository) {}

  async execute(
    data: CreateLeadUseCaseRequest,
  ): Promise<CreateLeadUseCaseResponse> {
    const lead = await this.leadsRepository.upsertByEmail(data);
    return { lead };
  }
}
