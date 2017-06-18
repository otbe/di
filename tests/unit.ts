import 'reflect-metadata';
import 'babel-polyfill';
import * as expect from 'expect';
import { Injector, Binder, Module, inject } from '../src/index';

describe('di', () => {
  it('simple', () => {
    class Test {
      sayHi() {
        return 'hi';
      }
    }

    class MyModule implements Module {
      init(bind: Binder) {
        bind(Test);
      }
    }

    const s = Injector.getInjector(new MyModule());
    const t1 = s.get(Test);
    const t2 = s.get(Test);
    expect(t1).toBe(t2);

    expect(t1.sayHi()).toBe('hi');
    expect(t2.sayHi()).toBe('hi');
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
      init(bind: Binder) {
        bind(Service).transient();
        bind(Test);
        bind(Service2);
      }
    }

    const s = Injector.getInjector(new MyModule());

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
      init(bind: Binder) {
        bind(Service).to(Service2).transient();
        bind(Test);
      }
    }

    const s = Injector.getInjector(new MyModule());

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
      init(bind: Binder) {
        bind(Test);
        bind(Service).toFactory(() => new Service('foo')).transient();
      }
    }

    const s = Injector.getInjector(new MyModule());

    const t1 = s.get(Test);
    expect(t1.getSecret()).toBe('foo');

    const s1 = s.get(Service);
    const s2 = s.get(Service);
    expect(s1).toNotBe(s2);
    expect(s1).toBeA(Service);
  });

  it('constant values', () => {
    const identifier = 'constantValue';

    class Test {
      @inject(identifier) number: number;

      getNumber() {
        return this.number;
      }
    }

    class MyModule implements Module {
      init(bind: Binder) {
        bind(Test);
        bind(identifier).toConstant(8);
      }
    }

    const s = Injector.getInjector(new MyModule());

    const t1 = s.get(Test);
    expect(t1.getNumber()).toBe(8);
  });

  it('named', () => {
    const foo = 'foo';

    class Service {
      getSecret() {
        return 'baz';
      }
    }

    @inject([foo])
    class Test {
      @inject(foo) secret: string;

      constructor(secret: string, service: Service) {
        expect(secret).toBe('bar');
        expect(service.getSecret()).toBe('baz');
      }

      getSecret() {
        return this.secret;
      }
    }

    class MyModule implements Module {
      init(bind: Binder) {
        bind(Test);
        bind(Service);
        bind(foo).toFactory(() => 'bar');
      }
    }

    const s = Injector.getInjector(new MyModule());

    const t1 = s.get(Test);
    expect(t1.getSecret()).toBe('bar');
  });
});
