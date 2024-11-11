export class PredefinedAlias extends Error {
  constructor(alias: string) {
    super(`Known server: ${alias}`);
  }
}
