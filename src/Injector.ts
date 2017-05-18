import { Module } from './Module';
import { createBinder, InjectorMetaData } from './Binder';

export class Injector {
  private staticInjectionMap = new WeakMap();

  static getInjector(module: Module) {
    const injector = new Injector();

    module.init(createBinder(injector));

    return injector;
  }

  get<T>(Class: new (...args: any[]) => T): T {
    const data: InjectorMetaData = Reflect.getOwnMetadata(this, Class);
    const target = data.resolvesTo != null ? data.resolvesTo : Class;

    if (data.scope === 'transient') {
      return data.factory == null ? this.resolveClass(target) : data.factory();
    } else if (data.scope === 'singleton') {
      if (!this.staticInjectionMap.has(Class)) {
        this.staticInjectionMap.set(Class, data.factory == null ? this.resolveClass(target) : data.factory());
      }

      return this.staticInjectionMap.get(Class);
    }

    throw 'not supported';
  }

  private resolveClass<T>(Class: new (...args: any[]) => T): T {
    const s = Reflect.getMetadata('design:paramtypes', Class) || [];

    const instance = new Class(...s.map(this.get.bind(this)));
    Reflect.defineProperty(instance as any, '__injector', { configurable: false, writable: false, enumerable: false, value: this });

    return instance;
  }
}