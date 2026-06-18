import type { Category } from "../../generated/prisma";

export interface CategoryInput {
  name: string;
  description: string | null;
}

// ISP: only the methods the Category use cases actually need.
export interface CategoriesRepository {
  findMany(): Promise<Category[]>;
  findById(id: number): Promise<Category | null>;
  create(data: CategoryInput): Promise<Category>;
  update(id: number, data: CategoryInput): Promise<Category | null>;
  delete(id: number): Promise<boolean>; // false when the id did not exist
}
