import { Binder } from './Binder';

export interface Module {
  init: (bind: Binder) => void;
}

