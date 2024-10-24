import {Extension} from '@codemirror/state';

export interface EditorSetup {
  setup: string;
  extensions: Extension[];
}
