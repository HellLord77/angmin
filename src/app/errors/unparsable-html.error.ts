export class UnparsableHtml extends Error {
  constructor(html: string) {
    super(`Unparsable HTML: ${html}`);
  }
}
