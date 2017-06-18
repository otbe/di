# simple-ts-di
Simple DI framework written in and for TypeScript.
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
  init(bind: Binder) {
    bind(Service).transient(); // transient scope
    bind(Test); // singleton scope
  }
}

const injector = Injector.getInjector(new MyModule());
const test = injector.get(Test);
```

### Property injection
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
  init(bind: Binder) {
    bind(Service).transient(); // transient scope
    bind(Test); // singleton scope
  }
}

const injector = Injector.getInjector(new MyModule());
const test = injector.get(Test);
```

See ```tests/``` for more complex examples and API.
