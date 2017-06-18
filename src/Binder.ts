import { Identifier, Newable } from './Injector';

export interface FinalBinder {
  transient(): void;
}

export interface ResolveBinder<T> extends FinalBinder {
  to<S extends T>(dep: Newable<S>): FinalBinder;
  toFactory<S extends T>(dep: () => S): FinalBinder;
  toConstant(value: any): void;
}

export interface Binder {
  <T>(identifier: Identifier<T>): ResolveBinder<T>;
}

export interface InjectorMetaData {
  scope: 'transient' | 'singleton';
  class?: Newable<any>;
  factory?: <T>() => T;
  value?: any;
}

export function createBinder(
  addBinding: (identifier: Identifier<any>, data: InjectorMetaData) => void
): Binder {
  return <T>(identifier: Identifier<T>) => {
    const data: InjectorMetaData = { scope: 'singleton' };
    addBinding(identifier, data);

    if (typeof identifier !== 'string' && typeof identifier !== 'symbol') {
      data.class = identifier;
    }

    return {
      to<S extends T>(dep: Newable<S>) {
        data.class = dep;
        return this;
      },
      toFactory<S extends T>(dep: () => S) {
        data.factory = dep;
        data.class = undefined;
        return this;
      },
      toConstant(value: any) {
        data.class = undefined;
        data.value = value;
      },
      transient() {
        data.scope = 'transient';
      }
    };
  };
}
