import test from 'ava'

import runPipeline from './index.js'

// Setup

const state = { rev: false }

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

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})
