module.exports = {
  extensions: { js: true, ts: 'module' },
  nodeArguments: ['--loader=ts-node/esm', '--no-warnings'],
  ignoredByWatcher: ['{.nyc_output,dist,media}/**', '*.md'],
  files: ['src/**/*.test.ts'],
}
