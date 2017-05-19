import { Identifier, INJECTION_MAP } from './Injector';

export function inject(named?: Identifier<any> | Array<Identifier<any>>) {
  return (...args: any[]) => {
    const target = args[0];
    switch (args.length) {
      // class
      case 1:
        if (named != null && !Array.isArray(named)) {
          throw new Error('named must be an array');
        }

        const constructorTypes = Reflect.getMetadata('design:paramtypes', target);
        Reflect.defineMetadata(INJECTION_MAP, merge(constructorTypes, named || []), target);
        return;
      // property
      case 2:
      case 3:
        if (named != null && Array.isArray(named)) {
          throw new Error('named must not be an array');
        }

        const propertyKey = args[1];
        const type = named || Reflect.getMetadata('design:type', target, propertyKey!);

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
  };
}

function merge(arr1: Array<any>, arr2: Array<any>): Array<any> {
  return arr2.reduce((acc, curr, currentIndex) => {
    acc[currentIndex] = curr;
    return acc;
  }, [...arr1]);
}
