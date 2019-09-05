export default {
  compileEnhancements: false,
  extensions: ['ts'],
  require: ['ts-node/register/transpile-only'],
  files: ['src/**/*.test.ts'],
  sources: ['src/**/!(*.test).ts']
}
