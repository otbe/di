import 'reflect-metadata';
import 'babel-polyfill';
import * as expect from 'expect';
import {
  Container,
  Bind,
  Module,
  inject,
  createBoundedInject
} from '../src/index';

describe('simple-ts-di', () => {
  it('unbind and rebind', () => {
    class Test {
      sayHi() {
        return 'hi';
      }
    }

    class Test2 {
      sayHi() {
        return 'hi';
      }
    }

    class MyModule implements Module {
      init(bind: Bind) {
        bind(Test);
      }
    }

    const s = new Container(new MyModule());
    const t1 = s.get(Test);
    const t2 = s.get(Test);
    expect(t1).toBe(t2);

    s.unbind(Test);

    expect(s.isBound(Test)).toBeFalsy();
    expect(() => s.get<Test>(Test)).toThrow();

    s.bind(Test).to(Test2);

    expect(s.isBound(Test)).toBeTruthy();

    const r1 = s.get<Test2>(Test);

    expect(r1).toBeA(Test2);
  });

  it('snapshot/restore', () => {
    class Test {
      sayHi() {
        return 'hi';
      }
    }

    class Test2 {
      sayHi() {
        return 'hi';
      }
    }

    class MyModule implements Module {
      init(bind: Bind) {
        bind(Test);
        bind(Test2);
      }
    }

    const s = new Container(new MyModule());
    expect(s.isBound(Test)).toBeTruthy();
    expect(s.isBound(Test2)).toBeTruthy();

    const snapshot = s.snapshot();

    s.unbind(Test);

    expect(s.isBound(Test)).toBeFalsy();
    expect(s.isBound(Test2)).toBeTruthy();

    s.restore(snapshot);

    expect(s.isBound(Test)).toBeTruthy();
    expect(s.isBound(Test2)).toBeTruthy();
  });

  it('mutliple modules', () => {
    class Test {
      sayHi() {
        return 'hi';
      }
    }

    class Test2 {
      sayHi() {
        return 'hi';
      }
    }

    class MyModule implements Module {
      init(bind: Bind) {
        bind(Test);
      }
    }

    class MyModule2 implements Module {
      init(bind: Bind) {
        bind(Test2);
      }
    }

    const c = new Container(new MyModule(), new MyModule2());

    expect(c.get(Test)).toBeTruthy();
    expect(c.get(Test2)).toBeTruthy();

    expect(() => new Container(new MyModule(), new MyModule())).toThrow();
  });

  it('simple', () => {
    class Test {
      sayHi() {
        return 'hi';
      }
    }

    class MyModule implements Module {
      init(bind: Bind) {
        bind(Test);
      }
    }

    const s = new Container(new MyModule());
    const t1 = s.get(Test);
    const t2 = s.get(Test);
    expect(t1).toBe(t2);

    expect(t1.sayHi()).toBe('hi');
    expect(t2.sayHi()).toBe('hi');
  });

  it('should return the same service for multiple hits of a property injected dep', () => {
    class Service {
      sayHi() {
        return 'hi';
      }
    }

    class Test {
      @inject() service: Service;
    }

    class MyModule implements Module {
      init(bind: Bind) {
        bind(Service).transient();
        bind(Test);
      }
    }

    const s = new Container(new MyModule());
    const t1 = s.get(Test);

    expect(t1.service).toBe(t1.service);
  });

  it('sub dependencies', () => {
    class Service {
      sayHi() {
        return 'hi';
      }
    }

    class Service2 {
      sayHi() {
        return 'hi2';
      }
    }

    @inject()
    class Test {
      @inject() private service: Service;

      private service2: Service2;

      constructor(service: Service2) {
        this.service2 = service;
        expect(() => this.service.sayHi()).toThrow();
        expect(this.service2.sayHi()).toBe('hi2');
      }

      sayServiceHi() {
        return this.service.sayHi();
      }
    }

    class MyModule implements Module {
      init(bind: Bind) {
        bind(Service).transient();
        bind(Test);
        bind(Service2);
      }
    }

    const s = new Container(new MyModule());

    const t1 = s.get(Test);
    expect(t1.sayServiceHi()).toBe('hi');

    const s1 = s.get(Service);
    const s2 = s.get(Service);
    expect(s1).toNotBe(s2);
  });

  it('bind to', () => {
    class Service {
      sayHi() {
        return 'hi';
      }
    }

    class Service2 {
      private greeting = 'hi2';

      sayHi() {
        return this.greeting;
      }
    }

    class Test {
      @inject() service: Service;

      sayServiceHi() {
        return this.service.sayHi();
      }
    }

    class MyModule implements Module {
      init(bind: Bind) {
        bind(Service)
          .to(Service2)
          .transient();
        bind(Test);
      }
    }

    const s = new Container(new MyModule());

    const t1 = s.get(Test);
    expect(t1.service).toBeA(Service2);
    expect(t1.sayServiceHi()).toBe('hi2');

    const s1 = s.get(Service);
    const s2 = s.get(Service);
    expect(s1).toNotBe(s2);
    expect(s1).toBeA(Service2);
  });

  it('factory', () => {
    class Service {
      private sectret: string;

      constructor(secret: string) {
        this.sectret = secret;
      }

      getSecret() {
        return this.sectret;
      }
    }

    class Test {
      @inject() service: Service;

      getSecret() {
        return this.service.getSecret();
      }
    }

    class MyModule implements Module {
      init(bind: Bind) {
        bind(Test);
        bind(Service)
          .toFactory(() => new Service('foo'))
          .transient();
      }
    }

    const s = new Container(new MyModule());

    const t1 = s.get(Test);
    expect(t1.getSecret()).toBe('foo');

    const s1 = s.get(Service);
    const s2 = s.get(Service);
    expect(s1).toNotBe(s2);
    expect(s1).toBeA(Service);
  });

  it('constant values', () => {
    const identifier = Symbol('constantValue');

    class Test {
      @inject(identifier) number: number;

      getNumber() {
        return this.number;
      }
    }

    class MyModule implements Module {
      init(bind: Bind) {
        bind(Test);
        bind(identifier).toValue(8);
      }
    }

    const s = new Container(new MyModule());

    const t1 = s.get(Test);
    expect(t1.getNumber()).toBe(8);
  });

  it('named', () => {
    const SERVICE = Symbol();
    const PRIMITIVE = Symbol();

    interface IService {
      sayHi(): string;
    }

    class Service implements IService {
      sayHi() {
        return 'hi';
      }
    }

    @inject([SERVICE, PRIMITIVE])
    class Test {
      @inject(SERVICE) service: IService;

      @inject(PRIMITIVE) primitive: number;

      constructor(service: IService, primitive: number) {
        expect(service.sayHi()).toBe('hi');
        expect(primitive).toBe(10);
      }
    }

    class MyModule implements Module {
      init(bind: Bind) {
        bind(SERVICE).to(Service);
        bind(PRIMITIVE).toValue(10);
        bind(Test);
      }
    }

    const container = new Container(new MyModule());
    const test = container.get(Test);

    expect(test.primitive).toBe(10);
    expect(test.service.sayHi()).toBe('hi');
  });

  it('bounded inject', () => {
    class Service {
      sayHi() {
        return 'hi';
      }
    }

    class MyModule implements Module {
      init(bind: Bind) {
        bind(Service);
      }
    }

    const container = new Container(new MyModule());
    const bInject = createBoundedInject(container);

    class Test {
      @bInject() service: Service;
    }

    const t = new Test();

    expect(t.service.sayHi()).toBe('hi');
  });
});
