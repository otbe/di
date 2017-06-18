import { Module } from './Module';
import { createBinder, InjectorMetaData } from './Binder';

export interface Newable<T> {
  new (...args: any[]): T;
}

export type Identifier<T> = Newable<T> | string | symbol;

export const INJECTION_MAP = Symbol();

export class Injector {
  private staticInjections = new Map<InjectorMetaData, any>();
  private bindings = new Map<Identifier<any>, InjectorMetaData>();

  static getInjector(module: Module) {
    const injector = new Injector();

    module.init(
      createBinder((identifier, data) =>
        injector.bindings.set(identifier, data)
      )
    );

    return injector;
  }

  get<T>(identifier: Newable<T> | string | symbol): T {
    const data = this.bindings.get(identifier);

    if (data == null) {
      throw new Error('no binding found');
    }

    if (data.scope === 'transient') {
      return this.resolve(data);
    } else if (data.scope === 'singleton') {
      if (!this.staticInjections.has(data)) {
        this.staticInjections.set(data, this.resolve(data));
      }

      return this.staticInjections.get(data);
    }

    throw 'not supported';
  }

  private resolve(data: InjectorMetaData) {
    if (data.class != null) {
      return this.resolveClass(data.class);
    } else if (data.factory != null) {
      return data.factory();
    } else if (data.value) {
      return data.value;
    }
  }

  private resolveClass<T>(Class: new (...args: any[]) => T): T {
    const s = Reflect.getMetadata(INJECTION_MAP, Class) || [];

    const instance = new Class(...s.map(this.get.bind(this)));
    Object.defineProperty(instance, '__injector', {
      configurable: false,
      writable: false,
      enumerable: false,
      value: this
    });

    return instance;
  }
}
