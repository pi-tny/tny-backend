import type { Category } from "../../generated/prisma";

export interface CategoryInput {
  name: string;
  description: string | null;
}

export interface ListCategoriesParams {
  page: number;
  limit: number;
}

export interface CategoryListResult {
  items: Category[];
  total: number;
  page: number;
  limit: number;
}

// ISP: only the methods the Category use cases actually need.
export interface CategoriesRepository {
  findMany(params: ListCategoriesParams): Promise<CategoryListResult>;
  findById(id: number): Promise<Category | null>;
  create(data: CategoryInput): Promise<Category>;
  update(id: number, data: CategoryInput): Promise<Category | null>;
  delete(id: number): Promise<boolean>; // false when the id did not exist
}
