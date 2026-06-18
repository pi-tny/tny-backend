import type { Category } from "../../../generated/prisma";
import type {
  CategoriesRepository,
  CategoryInput,
} from "@/repositories/categories-repository";

export class InMemoryCategoriesRepository implements CategoriesRepository {
  public items: Category[] = [];
  private nextId = 1;

  async findMany(): Promise<Category[]> {
    return [...this.items].sort((a, b) => a.id - b.id);
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
