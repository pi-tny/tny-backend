export class InsufficientStockError extends Error {
  constructor() {
    super("insufficient stock for one or more items");
    this.name = "InsufficientStockError";
  }
}
