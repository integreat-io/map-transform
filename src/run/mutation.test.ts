import test from 'ava'

import runPipeline from './index.js'

// Tests

test('should run mutation object', (t) => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline = [
    {
      type: 'mutation' as const,
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
  ]
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = runPipeline(value, pipeline)

  t.deepEqual(ret, expected)
})
