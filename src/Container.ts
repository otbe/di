import { Module } from './Module';
import { createBinder, InjectorMetaData, Bind, ResolveBinder } from './Binder';

export interface Newable<T> {
  new (...args: any[]): T;
}

export type Identifier<T> = Newable<T> | symbol;

export const INJECTION_MAP = Symbol();

export interface Snapshot {
  bindings: Map<Identifier<any>, InjectorMetaData>;
  staticInjections: Map<InjectorMetaData, any>;
}

export class Container {
  private bindings = new Map<Identifier<any>, InjectorMetaData>();

  private staticInjections = new Map<InjectorMetaData, any>();

  private _bind: Bind = createBinder(
    this.bindings.set.bind(this.bindings),
    this.bindings.has.bind(this.bindings)
  );

  constructor(...modules: Array<Module>) {
    modules.forEach((module) => module.init(this._bind));
  }

  async get<T>(identifier: Identifier<T>): Promise<T> {
    const data = this.bindings.get(identifier);

    if (data == null) {
      throw new Error(`no binding found for ${identifier.toString()}`);
    }

    if (data.scope === 'transient') {
      return await this.resolve(data);
    } else if (data.scope === 'singleton') {
      if (!this.staticInjections.has(data)) {
        this.staticInjections.set(data, await this.resolve(data));
      }

      return this.staticInjections.get(data);
    }

    throw `not supported scope ${data.scope}`;
  }

  bind<T>(identifier: Identifier<T>): ResolveBinder<T> {
    return this._bind(identifier);
  }

  unbind<T>(identifier: Identifier<T>) {
    const data = this.bindings.get(identifier);

    if (data != null) {
      this.bindings.delete(identifier);
      this.staticInjections.delete(data);
    }
  }

  isBound<T>(identifier: Identifier<T>) {
    return this.bindings.has(identifier);
  }

  snapshot(): Snapshot {
    return {
      bindings: new Map(this.bindings),
      staticInjections: new Map(this.staticInjections)
    };
  }

  restore(snapshot: Snapshot) {
    this.bindings = snapshot.bindings;
    this.staticInjections = snapshot.staticInjections;
  }

  private async resolve(data: InjectorMetaData) {
    if (data.class != null) {
      return await this.resolveClass(data.class);
    } else if (data.factory != null) {
      return await data.factory();
    } else if (data.value) {
      return data.value;
    }

    throw `no injection target found`;
  }

  private async resolveClass<T>(Class: new (...args: any[]) => T): Promise<T> {
    const s = Reflect.getMetadata(INJECTION_MAP, Class) || [];

    return new Class(...(await Promise.all(s.map(this.get.bind(this)))));
  }
}
