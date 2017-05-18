import expect from 'expect';
import { Injector, Binder, Module, inject } from '../src/index';

describe('ts-di', () => {
  it('simple', () => {
    class Test {
      sayHi() { return 'hi'; }
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

  it('advanced', () => {
    class Service {
      sayHi() { return 'hi'; }
    }

    class Service2 {
      sayHi() { return 'hi2'; }
    }

    @inject
    class Test {
      @inject
      private service: Service;

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
        bind(Service).inTransientScope();
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

  it('resolveTo', () => {
    class Service {
      sayHi() { return 'hi'; }
    }

    class Service2 {
      private greeting = 'hi2';

      sayHi() { return this.greeting; }
    }

    class Test {
      @inject
      service: Service;

      sayServiceHi() {
        return this.service.sayHi();
      }
    }

    class MyModule implements Module {
      init(bind: Binder) {
        bind(Service).to(Service2).inTransientScope();
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
});
