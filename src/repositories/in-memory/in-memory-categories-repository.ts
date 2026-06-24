import type { Category } from "../../../generated/prisma";
import type {
  CategoriesRepository,
  CategoryInput,
  CategoryListResult,
  ListCategoriesParams,
} from "@/repositories/categories-repository";

export class InMemoryCategoriesRepository implements CategoriesRepository {
  public items: Category[] = [];
  private nextId = 1;

  async findMany({
    page,
    limit,
  }: ListCategoriesParams): Promise<CategoryListResult> {
    const ordered = [...this.items].sort((a, b) => a.id - b.id);
    const start = (page - 1) * limit;
    const items = ordered.slice(start, start + limit);

    return { items, total: ordered.length, page, limit };
  }

  async findById(id: number): Promise<Category | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async create(data: CategoryInput): Promise<Category> {
    const category: Category = {
      id: this.nextId++,
      name: data.name,
      description: data.description,
    };
    this.items.push(category);
    return category;
  }

  async update(id: number, data: CategoryInput): Promise<Category | null> {
    const category = this.items.find((item) => item.id === id);
    if (!category) return null;
    category.name = data.name;
    category.description = data.description;
    return category;
  }

  async delete(id: number): Promise<boolean> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) return false;
    this.items.splice(index, 1);
    return true;
  }
}
