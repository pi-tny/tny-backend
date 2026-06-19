export class AdminAlreadyExistsError extends Error {
  constructor() {
    super("An admin with this email already exists");
    this.name = "AdminAlreadyExistsError";
  }
}
