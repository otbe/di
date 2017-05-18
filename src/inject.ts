export function inject(target: any, propertyKey?: string | symbol) {
  switch (arguments.length) {
    case 1:
      return;
    case 2:
    case 3:
      const type = Reflect.getMetadata('design:type', target, propertyKey!);

      Reflect.defineProperty(target, propertyKey!, {
        configurable: false,
        enumerable: false,
        get() {
          if (this.__injector == null) {
            throw new Error('You can not use field injected dependencies in class constrcutor');
          }

          return this.__injector.get(type);
        },
        set() {
          throw new Error('setter not supported');
        }
      });
      return;
  }

  throw 'not supported2';
}
