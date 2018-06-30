import { Identifier, INJECTION_MAP } from './Container';

export function inject(named?: Array<Identifier<any>>) {
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
          merge(constructorTypes || [], named || []),
          target
        );
        return;
      // old property injection code
      // case 2:
      // case 3:
      //   if (named != null && Array.isArray(named)) {
      //     throw new Error('named must not be an array');
      //   }

      //   const propertyKey = args[1];
      //   const identifier: Identifier<any> =
      //     named || Reflect.getMetadata('design:type', target, propertyKey!);

      //   Object.defineProperty(target, propertyKey, {
      //     configurable: false,
      //     enumerable: false,
      //     get() {
      //       if (!Reflect.hasMetadata(INJECTED_DEP, this, propertyKey)) {
      //         const c: Container | undefined =
      //           container || this[CONTAINER_PROP];

      //         if (c == null) {
      //           throw 'You can not use field injected dependencies in class constrcutor';
      //         }

      //         Reflect.defineMetadata(
      //           INJECTED_DEP,
      //           c.get(identifier),
      //           this,
      //           propertyKey
      //         );
      //       }

      //       return Reflect.getMetadata(INJECTED_DEP, this, propertyKey);
      //     },
      //     set() {
      //       throw 'setter not supported';
      //     }
      //   });
      //   return;
    }

    throw 'not supported target for @inject';
  };
}

// export const createBoundedInject = (container: Container) => (
//   named?: Identifier<any> | Array<Identifier<any>>
// ) => inject(named, container);

function merge(
  arr1: Array<Identifier<any>>,
  arr2: Array<Identifier<any>>
): Array<any> {
  return arr2.reduce(
    (acc, curr, currentIndex) => {
      acc[currentIndex] = curr;
      return acc;
    },
    [...arr1]
  );
}
