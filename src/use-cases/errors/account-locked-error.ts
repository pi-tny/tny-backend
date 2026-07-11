export class AccountLockedError extends Error {
  constructor() {
    super("account temporarily locked after too many failed login attempts");
    this.name = "AccountLockedError";
  }
}
