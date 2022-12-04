/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  forceExit: true,
  detectOpenHandles: true,
  //detectLeaks: true,
  setupFilesAfterEnv: ["@alex_neo/jest-expect-message"],
};
