export class VariantSkuAlreadyExistsError extends Error {
  constructor() {
    super("A variant with this SKU already exists");
    this.name = "VariantSkuAlreadyExistsError";
  }
}
