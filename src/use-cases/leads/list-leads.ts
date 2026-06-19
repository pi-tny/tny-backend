import type {
  LeadListResult,
  LeadsRepository,
} from "@/repositories/leads-repository";

interface ListLeadsUseCaseRequest {
  q?: string;
  page?: number;
  limit?: number;
}

interface ListLeadsUseCaseResponse {
  result: LeadListResult;
}

export class ListLeadsUseCase {
  constructor(private leadsRepository: LeadsRepository) {}

  async execute({
    q,
    page = 1,
    limit = 20,
  }: ListLeadsUseCaseRequest): Promise<ListLeadsUseCaseResponse> {
    const result = await this.leadsRepository.list({ q, page, limit });
    return { result };
  }
}
