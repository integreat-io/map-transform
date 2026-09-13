import test from 'node:test'
import assert from 'node:assert/strict'
import type { PreppedPipeline } from '../run/index.js'

import preparePipeline from './index.js'

// Setup

const stringFn = () => () => String

const options = {
  transformers: {
    string: stringFn,
  },
}

// Tests

test('should prepare iterate operation', () => {
  const def = {
    $iterate: { $transform: 'string' },
  }
  const expected = [
    {
      type: 'iterate' as const,
      it: true,
      pipeline: [{ type: 'transform', id: 'string', fn: String }],
    },
  ]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should return no step when empty pipeline', () => {
  const def = { $iterate: [] }
  const expected: PreppedPipeline = []

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})
