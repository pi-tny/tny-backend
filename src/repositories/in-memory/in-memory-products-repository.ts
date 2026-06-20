import type { Category, Product } from "../../../generated/prisma";
import type {
  CreateProductData,
  ListProductsFilters,
  ProductDetail,
  ProductSort,
  ProductSummary,
  ProductsRepository,
  UpdateProductData,
} from "@/repositories/products-repository";

function comparator(sort: ProductSort): (a: Product, b: Product) => number {
  switch (sort) {
    case "oldest":
      return (a, b) => a.id - b.id;
    case "price_asc":
      return (a, b) => a.price - b.price || a.id - b.id;
    case "price_desc":
      return (a, b) => b.price - a.price || a.id - b.id;
    case "name":
      return (a, b) => a.name.localeCompare(b.name) || a.id - b.id;
    case "newest":
    default:
      return (a, b) => b.id - a.id;
  }
}

// Faithful-enough fake for unit tests: products, category links and a seeded
// category catalog. Variants/images are out of scope here (covered via e2e), so
// detail returns empty arrays and cover_image is null.
export class InMemoryProductsRepository implements ProductsRepository {
  public items: Product[] = [];
  public categories: Category[] = [];
  public links: { product_id: number; category_id: number }[] = [];
  // seed variant stock here to exercise the in_stock filter
  public variants: { product_id: number; quantity: number }[] = [];
  private nextId = 1;

  private categoriesOf(productId: number): Category[] {
    const ids = this.links
      .filter((link) => link.product_id === productId)
      .map((link) => link.category_id);
    return this.categories.filter((category) => ids.includes(category.id));
  }

  private toSummary(product: Product): ProductSummary {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      promotional_price: product.promotional_price,
      active: product.active,
      cover_image: null,
      categories: this.categoriesOf(product.id),
    };
  }

  private toDetail(product: Product): ProductDetail {
    return {
      ...this.toSummary(product),
      description: product.description,
      created_at: product.created_at,
      variants: [],
      images: [],
    };
  }

  async findBySku(sku: string) {
    const product = this.items.find((item) => item.sku === sku);
    return product ? { id: product.id } : null;
  }

  async exists(id: number) {
    return this.items.some((item) => item.id === id);
  }

  async list(filters: ListProductsFilters) {
    let result = [...this.items];

    if (filters.active !== undefined) {
      result = result.filter((item) => item.active === filters.active);
    }
    if (filters.categoryId !== undefined) {
      result = result.filter((item) =>
        this.links.some(
          (link) =>
            link.product_id === item.id &&
            link.category_id === filters.categoryId,
        ),
      );
    }
    if (filters.q) {
      const term = filters.q.toLowerCase();
      result = result.filter((item) =>
        item.name.toLowerCase().includes(term),
      );
    }
    if (filters.minPrice !== undefined) {
      result = result.filter((item) => item.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter((item) => item.price <= filters.maxPrice!);
    }
    if (filters.onSale) {
      result = result.filter((item) => item.promotional_price !== null);
    }
    if (filters.inStock) {
      result = result.filter((item) =>
        this.variants.some(
          (variant) => variant.product_id === item.id && variant.quantity > 0,
        ),
      );
    }

    result.sort(comparator(filters.sort ?? "newest"));
    const total = result.length;
    const start = (filters.page - 1) * filters.limit;
    const items = result
      .slice(start, start + filters.limit)
      .map((item) => this.toSummary(item));

    return { items, total, page: filters.page, limit: filters.limit };
  }

  async findDetail(id: number, includeInactive: boolean) {
    const product = this.items.find((item) => item.id === id);
    if (!product || (!includeInactive && !product.active)) return null;
    return this.toDetail(product);
  }

  async findRelated(id: number, limit: number) {
    const categoryIds = this.links
      .filter((link) => link.product_id === id)
      .map((link) => link.category_id);

    return this.items
      .filter(
        (item) =>
          item.id !== id &&
          item.active &&
          this.links.some(
            (link) =>
              link.product_id === item.id &&
              categoryIds.includes(link.category_id),
          ),
      )
      .slice(0, limit)
      .map((item) => this.toSummary(item));
  }

  async create(data: CreateProductData) {
    const product: Product = {
      id: this.nextId++,
      sku: data.sku,
      name: data.name,
      description: data.description,
      price: data.price,
      promotional_price: data.promotional_price ?? null,
      active: data.active ?? true,
      created_at: new Date(),
    };
    this.items.push(product);
    for (const categoryId of data.category_ids ?? []) {
      this.links.push({ product_id: product.id, category_id: categoryId });
    }
    return this.toDetail(product);
  }

  async update(id: number, data: UpdateProductData) {
    const product = this.items.find((item) => item.id === id);
    if (!product) return null;

    if (data.sku !== undefined) product.sku = data.sku;
    if (data.name !== undefined) product.name = data.name;
    if (data.description !== undefined) product.description = data.description;
    if (data.price !== undefined) product.price = data.price;
    if (data.promotional_price !== undefined) {
      product.promotional_price = data.promotional_price;
    }
    if (data.active !== undefined) product.active = data.active;
    if (data.category_ids !== undefined) {
      this.links = this.links.filter((link) => link.product_id !== id);
      for (const categoryId of data.category_ids) {
        this.links.push({ product_id: id, category_id: categoryId });
      }
    }

    return this.toDetail(product);
  }

  async softDelete(id: number) {
    const product = this.items.find((item) => item.id === id);
    if (!product) return false;
    product.active = false;
    return true;
  }

  async setCategories(id: number, categoryIds: number[]) {
    const product = this.items.find((item) => item.id === id);
    if (!product) return null;
    this.links = this.links.filter((link) => link.product_id !== id);
    for (const categoryId of categoryIds) {
      this.links.push({ product_id: id, category_id: categoryId });
    }
    return this.categoriesOf(id);
  }
}
