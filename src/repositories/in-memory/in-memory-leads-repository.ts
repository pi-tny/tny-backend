import type { Lead } from "../../../generated/prisma";
import type {
  CreateLeadData,
  LeadsRepository,
  ListLeadsFilters,
} from "@/repositories/leads-repository";

export class InMemoryLeadsRepository implements LeadsRepository {
  public items: Lead[] = [];
  private nextId = 1;

  async upsertByEmail(data: CreateLeadData) {
    const existing = this.items.find((item) => item.email === data.email);

    if (existing) {
      existing.name = data.name;
      existing.phone = data.phone;
      existing.marketing_consent = data.marketing_consent ?? true;
      existing.consent_date = new Date();
      return existing;
    }

    const lead: Lead = {
      id: this.nextId++,
      name: data.name,
      email: data.email,
      phone: data.phone,
      marketing_consent: data.marketing_consent ?? true,
      consent_date: new Date(),
      created_at: new Date(),
    };
    this.items.push(lead);
    return lead;
  }

  async list(filters: ListLeadsFilters) {
    let result = [...this.items];

    if (filters.q) {
      const term = filters.q.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.email.toLowerCase().includes(term),
      );
    }

    result.sort((a, b) => b.id - a.id);
    const total = result.length;
    const start = (filters.page - 1) * filters.limit;
    const items = result.slice(start, start + filters.limit);

    return { items, total, page: filters.page, limit: filters.limit };
  }

  async delete(id: number) {
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) return false;
    this.items.splice(index, 1);
    return true;
  }
}
