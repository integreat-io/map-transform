module.exports = {
  extensions: { ts: 'module' },
  nodeArguments: ['--loader=ts-node/esm', '--no-warnings'],
  ignoredByWatcher: ['{.nyc_output,dist,media}/**'],
  files: ['src/**/*.test.ts'],
}
