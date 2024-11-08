import {Scheme} from '../enums/scheme';
import {Server} from '../models/server.model';

export function isServer(object: unknown): object is Server {
  return (
    typeof object === 'object' &&
    object !== null &&
    'alias' in object &&
    typeof object.alias === 'string' &&
    'scheme' in object &&
    Object.values(Scheme).includes(object.scheme as Scheme) &&
    'hostname' in object &&
    typeof object.hostname === 'string' &&
    'port' in object &&
    typeof object.port === 'number' &&
    (!('path' in object) || typeof object.path === 'string') &&
    (!('username' in object) || typeof object.username === 'string') &&
    (!('password' in object) || typeof object.password === 'string')
  );
}
