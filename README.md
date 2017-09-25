# simple-ts-di
[![Build Status](https://travis-ci.org/otbe/di.svg?branch=master)](https://travis-ci.org/otbe/di)

Simple DI framework written in and for TypeScript.
By default all bindings are in singleton scope. Where possible you can call a ```transient()``` binder function to create a transient binding.

## Setup
Make sure your ```tsconfig.json``` contains

```json
{
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true
}
```

Install ```reflect-metadata``` and include it somewhere.

Make sure your setup supports Maps and Symbols.

## Example
### Constructor injection
```typescript
class Service {
  sayHi() { return 'hi'; }
}

@inject()
class Test {
  constructor(service: Service) {
    service.sayHi();
  }
}

class MyModule implements Module {
  init(bind: Bind) {
    bind(Service).transient(); // transient scope
    bind(Test); // singleton scope
                // shortcut for bind(Test).to(Test)
  }
}

const container = new Container(new MyModule());
const test = container.get(Test);
```

### Property injection
```simple-ts-di``` supports property injection. It will only work if the type (here ```Service```) has a meaningful runtime representation. So it only works for classes (as of now). If you want to inject some primitives or a service which implements an interface you have to use named injection. If your environment dont let you control how the class is instantiated (e.g. react components are instantiated by react and not via container.get(...)), you can use an special version of inject - uncontrolledInject. See "uncontrolled property injection".

```typescript
class Service {
  sayHi() { return 'hi'; }
}

class Test {
  @inject()
  private service: Service;

  sayHelloToService() {
    return this.service.sayHi();
  }
}

class MyModule implements Module {
  init(bind: Bind) {
    bind(Service).transient(); // transient scope
    bind(Test); // singleton scope
                // shortcut for bind(Test).to(Test)
  }
}

const container = new Container(new MyModule());
const test = container.get(Test);
```

### named injection
```typescript
const SERVICE = Symbol();
const PRIMITIVE = Symbol();

interface IService {
  sayHi(): string;
}

class Service implements IService {
  sayHi() { return 'hi'; }
}

@inject([SERVICE, PRIMITIVE])
class Test {
  @inject(SERVICE)
  private service: IService;

  @inject(PRIMITIVE)
  private primitive: number;

  constructor(service: IService, primitive: number) {
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
```

### uncontrolled property injection
```typescript
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
const uncontrolledInject = createUncontrolledInject(container);

class Test {
  @uncontrolledInject() service: Service;
}

const t = new Test();

t.service.sayHi(); // returns Hi
```

See ```tests/``` for more complex examples and API.
