export class UndefinedAlias extends Error {
  constructor(alias: string) {
    super(`Unknown server: ${alias}`);
  }
}
