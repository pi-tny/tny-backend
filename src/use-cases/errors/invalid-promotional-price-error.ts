export class InvalidPromotionalPriceError extends Error {
  constructor() {
    super("promotional_price must be lower than the base price");
    this.name = "InvalidPromotionalPriceError";
  }
}
