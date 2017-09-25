import { Identifier, Container } from './Container';
import { inject } from './inject';
export { Newable } from './Container';

export const createUncontrolledInject = (container: Container) =>
  function(named?: Identifier<any> | Array<Identifier<any>>) {
    return (...args: any[]) => {
      const target = args[0];
      switch (args.length) {
        // class
        case 1:
          throw new Error('an uncontrolled inject cannot be used on a class');

        // property
        case 2:
        case 3:
          if (named != null && Array.isArray(named)) {
            throw new Error('named must not be an array');
          }

          const propertyKey = args[1];
          return inject(named, container)(target, propertyKey);
      }

      throw 'not supported target for @inject';
    };
  };
