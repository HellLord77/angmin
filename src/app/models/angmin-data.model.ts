import {Theme} from '../enums/theme';
import {Server} from './server.model';

export interface AngminData {
  scale: number;
  theme: Theme;
  notify: boolean;
  servers: Server[];
}
