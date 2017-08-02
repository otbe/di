import { Bind } from './Binder';

export interface Module {
  init(bind: Bind): void;
}
