module.exports = {
  collectCoverage: true,
  coverageReporters: ['text'],
  transform: {
    '^.+\\.ts?$': '<rootDir>/node_modules/ts-jest/preprocessor.js'
  },
  testRegex: '(/tests/.*)\\.(ts?|tsx?)$',
  testPathIgnorePatterns: ['/node_modules/', '/example/'],
  moduleFileExtensions: ['ts', 'json', 'js']
};
