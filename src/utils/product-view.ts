// Shared read-model helpers for products. Used by the products repository and
// (later) the order use case, so the price-resolution rule lives in one place.

interface PriceParts {
  price: number;
  promotional_price: number | null;
}

// Effective price of a variant: a product-wide promotional_price wins; otherwise
// the variant's own price; otherwise the product base price.
export function resolveFinalPrice(
  product: PriceParts,
  variant: { price: number | null },
): number {
  if (product.promotional_price !== null) {
    return product.promotional_price;
  }
  if (variant.price !== null) {
    return variant.price;
  }
  return product.price;
}

interface ImageLike {
  url: string;
  position: number;
  variant_id: number | null;
}

// Cover image: lowest-position general (non-variant) image, falling back to any
// image, or null when the product has none.
export function resolveCoverImage(images: ImageLike[]): string | null {
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const general = sorted.filter((image) => image.variant_id === null);
  const pool = general.length > 0 ? general : sorted;
  return pool[0]?.url ?? null;
}
