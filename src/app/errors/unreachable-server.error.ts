import {Server} from '../models/server.model';

export class UnreachableServer extends Error {
  constructor(server: Server) {
    super(`Unreachable server: ${server.alias}`);
  }
}
