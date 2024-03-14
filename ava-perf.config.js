export default {
  environmentVariables: {
    TSIMP_DIAG: 'ignore',
  },
  extensions: { js: true, ts: 'module' },
  nodeArguments: ['--import=tsimp'],
  watchMode: {
    ignoreChanges: ['{.nyc_output,dist,media,.tsimp}/**', '*.md'],
  },
  files: ['src/tests/performance/**/*.ts'],
}
