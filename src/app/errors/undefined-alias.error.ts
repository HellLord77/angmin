export class UndefinedAlias extends Error {
  constructor(alias: string) {
    super(`Undefined alias: ${alias}`);
  }
}
