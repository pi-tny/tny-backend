import type { Lead } from "../../generated/prisma";

export interface CreateLeadData {
  name: string;
  email: string;
  phone: string;
  marketing_consent?: boolean;
}

export interface ListLeadsFilters {
  q?: string;
  page: number;
  limit: number;
}

export interface LeadListResult {
  items: Lead[];
  total: number;
  page: number;
  limit: number;
}

export interface LeadsRepository {
  // create or, when the email already exists, silently update + renew consent
  upsertByEmail(data: CreateLeadData): Promise<Lead>;
  list(filters: ListLeadsFilters): Promise<LeadListResult>;
  delete(id: number): Promise<boolean>;
}
