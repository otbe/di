import {
  Identifier,
  INJECTION_MAP,
  Container,
  CONTAINER_PROP
} from './Container';

export function inject(
  named?: Identifier<any> | Array<Identifier<any>>,
  container?: Container
) {
  return (...args: any[]) => {
    const target = args[0];
    switch (args.length) {
      // class
      case 1:
        if (named != null && !Array.isArray(named)) {
          throw new Error('named must be an array');
        }

        const constructorTypes = Reflect.getMetadata(
          'design:paramtypes',
          target
        );
        Reflect.defineMetadata(
          INJECTION_MAP,
          merge(constructorTypes, named || []),
          target
        );
        return;
      // property
      case 2:
      case 3:
        if (named != null && Array.isArray(named)) {
          throw new Error('named must not be an array');
        }

        const propertyKey = args[1];
        const identifier: Identifier<any> =
          named || Reflect.getMetadata('design:type', target, propertyKey!);

        Object.defineProperty(target, propertyKey, {
          configurable: false,
          enumerable: false,
          get() {
            const c: Container | undefined = container || this[CONTAINER_PROP];

            if (c == null) {
              throw 'You can not use field injected dependencies in class constrcutor';
            }

            return c.get(identifier);
          },
          set() {
            throw 'setter not supported';
          }
        });
        return;
    }

    throw 'not supported target for @inject';
  };
}

function merge(arr1: Array<any>, arr2: Array<any>): Array<any> {
  return arr2.reduce(
    (acc, curr, currentIndex) => {
      acc[currentIndex] = curr;
      return acc;
    },
    [...arr1]
  );
}
