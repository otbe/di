import 'reflect-metadata';
import 'babel-polyfill';
import {
  Container,
  Bind,
  Module,
  inject,
  CONTAINER_INSTANCE_PROP
} from '../src/index';

describe('simple-ts-di', () => {
  it('unbind and rebind', async () => {
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
    const t1 = await s.get(Test);
    const t2 = await s.get(Test);
    expect(t1).toBe(t2);

    s.unbind(Test);

    expect(s.isBound(Test)).toBeFalsy();
    expect(s.get<Test>(Test)).rejects.toThrow();

    s.bind(Test).to(Test2);

    expect(s.isBound(Test)).toBeTruthy();

    const r1 = await s.get<Test2>(Test);

    expect(r1).toBeInstanceOf(Test2);
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

    expect(c.get(Test)).resolves.toBeTruthy();
    expect(c.get(Test2)).resolves.toBeTruthy();

    expect(() => new Container(new MyModule(), new MyModule())).toThrow();
  });

  it('simple', async () => {
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
    const t1 = await s.get(Test);
    const t2 = await s.get(Test);
    expect(t1).toBe(t2);

    expect(t1.sayHi()).toBe('hi');
    expect(t2.sayHi()).toBe('hi');
  });

  it('sub dependencies', async () => {
    class Service {
      sayHi() {
        return 'hi';
      }
    }

    @inject()
    class Service2 {
      constructor(private readonly service: Service) {}

      sayHi() {
        return this.service.sayHi();
      }
    }

    @inject()
    class Test {
      constructor(private readonly service: Service2) {}

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

    const t1 = await s.get(Test);
    expect(t1.sayServiceHi()).toBe('hi');

    const s1 = await s.get(Service);
    const s2 = await s.get(Service);
    expect(s1).not.toBe(s2);
  });

  it('bind to', async () => {
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

    @inject()
    class Test {
      constructor(public service: Service) {}

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

    const t1 = await s.get(Test);
    expect(t1.service).toBeInstanceOf(Service2);
    expect(t1.sayServiceHi()).toBe('hi2');

    const s1 = await s.get(Service);
    const s2 = await s.get(Service);
    expect(s1).not.toBe(s2);
    expect(s1).toBeInstanceOf(Service2);
  });

  it('factory', async () => {
    class Service {
      private sectret: string;

      constructor(secret: string) {
        this.sectret = secret;
      }

      getSecret() {
        return this.sectret;
      }
    }

    @inject()
    class Test {
      constructor(private readonly service: Service) {}

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

    const t1 = await s.get(Test);
    expect(t1.getSecret()).toBe('foo');

    const s1 = await s.get(Service);
    const s2 = await s.get(Service);
    expect(s1).not.toBe(s2);
    expect(s1).toBeInstanceOf(Service);
  });

  it('constant values', async () => {
    const identifier = Symbol('constantValue');

    @inject([identifier])
    class Test {
      constructor(private readonly number: number) {}

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

    const t1 = await s.get(Test);
    expect(t1.getNumber()).toBe(8);
  });

  it('named', async () => {
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
      constructor(public service: IService, public primitive: number) {
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
    const test = await container.get(Test);

    expect(test.primitive).toBe(10);
    expect(test.service.sayHi()).toBe('hi');
  });

  it('should only resolve things that a ask for (transitive)', async () => {
    class Service2 {
      sayHi() {
        return 'hi';
      }
    }
    class Service3 {}

    @inject()
    class Service {
      constructor(public service2: Service2) {}
    }

    @inject()
    class Test {
      constructor(public service: Service) {}
    }

    const s2Spy = jest.fn();
    const s3Spy = jest.fn();

    class MyModule implements Module {
      init(bind: Bind) {
        bind(Test);
        bind(Service);
        bind(Service2).toFactory(async () => {
          s2Spy();
          return await Promise.resolve(new Service2());
        });
        bind(Service3).toFactory(async () => {
          s3Spy();
          return await Promise.resolve(new Service3());
        });
      }
    }

    const container = new Container(new MyModule());
    const test = await container.get(Test);

    expect(s2Spy).toHaveBeenCalled();
    expect(s3Spy).not.toHaveBeenCalled();
    expect(test.service.service2).toBeInstanceOf(Service2);
    expect(test.service.service2.sayHi()).toBe('hi');
  });

  it('deep resolution', async () => {
    class Service3 {
      sayHi() {
        return 'hi';
      }
    }

    @inject()
    class Service2 {
      constructor(public service3: Service3) {}
    }

    @inject()
    class Service {
      constructor(public service2: Service2) {}
    }

    @inject()
    class Test {
      constructor(public service: Service) {}
    }

    const s3Spy = jest.fn();

    class MyModule implements Module {
      init(bind: Bind) {
        bind(Test);
        bind(Service);
        bind(Service2);
        bind(Service3).toFactory(async () => {
          s3Spy();
          return Promise.resolve(new Service3());
        });
      }
    }

    const container = new Container(new MyModule());
    const test = await container.get(Test);

    expect(s3Spy).toHaveBeenCalled();
    expect(test.service.service2).toBeInstanceOf(Service2);
    expect(test.service.service2.service3.sayHi()).toBe('hi');
  });

  it('should define an instance prop on each resolved class', async () => {
    class Test {
      constructor() {}
    }

    class MyModule implements Module {
      init(bind: Bind) {
        bind(Test);
      }
    }

    const container = new Container(new MyModule());
    const test = await container.get(Test);
    expect(test[CONTAINER_INSTANCE_PROP]).toBe(container);
  });

  it('should inject me the container in fatcories', async () => {
    const Test = Symbol();
    const Foo = Symbol();

    class MyModule implements Module {
      init(bind: Bind) {
        bind(Foo).toValue('bar');
        bind(Test).toFactory(container => container.get<string>(Foo));
      }
    }

    const container = new Container(new MyModule());
    const test = await container.get(Test);
    expect(test).toBe('bar');
  });
});
