import { Identifier, INJECTION_MAP } from './Container';

export function inject(named?: Array<Identifier<any>>): ClassDecorator {
  return target => {
    if (named != null && !Array.isArray(named)) {
      throw new Error('named must be an array');
    }

    const constructorTypes = Reflect.getMetadata('design:paramtypes', target);
    Reflect.defineMetadata(
      INJECTION_MAP,
      merge(constructorTypes || [], named || []),
      target
    );
  };
}

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
