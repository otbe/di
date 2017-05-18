import { Injector } from './Injector';

export interface FinalBinder {
  inTransientScope(): void;
}

export interface ResolveBinder<T> extends FinalBinder {
  to<S extends T>(dep: new () => S): FinalBinder;
  toFactory<S extends T>(dep: () => S): FinalBinder;
}

export interface Binder {
  <T>(dependency: new (...args: any[]) => T): ResolveBinder<T>;
}

export interface InjectorMetaData {
  scope: 'transient' | 'singleton';
  resolvesTo?: new <T>() => T;
  factory?: <T>() => T;
}

export const createBinder = (injector: Injector): Binder => {
  return <T>(dep: new () => T) => {
    const data: InjectorMetaData = { scope: 'singleton' };
    Reflect.defineMetadata(injector, data, dep);

    return {
      to(dep: new () => T) { data.resolvesTo = dep; return this; },
      toFactory<T>(dep: () => T) { data.factory = dep; return this; },
      inTransientScope() { data.scope = 'transient'; }
    };
  };
};
