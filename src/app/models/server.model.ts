import {Scheme} from '../enums/scheme';

export interface Server {
  alias: string;
  scheme: Scheme;
  hostname: string;
  port: number;
  path?: string;
  username?: string;
  password?: string;
}

export declare type Servers = Server[];
