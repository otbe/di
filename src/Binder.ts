import { Identifier, Newable } from './Container';

export interface FinalBinder {
  transient(): void;
}

export interface ResolveBinder<T> extends FinalBinder {
  to<S extends T>(dep: Newable<S>): FinalBinder;
  toFactory<S extends T>(dep: () => Promise<S> | S): FinalBinder;
  toValue(value: any): void;
}

export interface Bind {
  <T>(identifier: Identifier<T>): ResolveBinder<T>;
}

export interface InjectorMetaData {
  scope: 'transient' | 'singleton';
  class?: Newable<any>;
  factory?: () => any;
  value?: any;
}

export function createBinder(
  addBinding: (identifier: Identifier<any>, data: InjectorMetaData) => void,
  exists: (identifier: Identifier<any>) => boolean
): Bind {
  return function<T>(identifier: Identifier<T>) {
    if (exists(identifier)) {
      throw `${identifier.toString()} already bound`;
    }

    const data: InjectorMetaData = { scope: 'singleton' };
    addBinding(identifier, data);

    if (typeof identifier !== 'symbol') {
      data.class = identifier;
    }

    return {
      to<S extends T>(dep: Newable<S>) {
        data.class = dep;
        return this;
      },
      toFactory<S extends T>(dep: () => Promise<S> | S) {
        data.factory = dep;
        data.class = undefined;
        return this;
      },
      toValue(value: any) {
        data.class = undefined;
        data.value = value;
      },
      transient() {
        data.scope = 'transient';
      }
    };
  };
}
