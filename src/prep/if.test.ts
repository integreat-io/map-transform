import test from 'node:test'
import assert from 'node:assert/strict'

import preparePipeline from './index.js'

// Setup

const options = {}

// Tests

test('should prepare if operation', () => {
  const def = { $if: 'isActive', then: '>ok', else: '>err' }
  const expected = [
    { type: 'if', condition: ['isActive'], then: ['>ok'], else: ['>err'] },
  ]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare if operation without else pipeline', () => {
  const def = { $if: 'isActive', then: '>ok' }
  const expected = [
    { type: 'if', condition: ['isActive'], then: ['>ok'], else: [] },
  ]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare if operation without then pipeline', () => {
  const def = { $if: 'isActive', else: '>err' }
  const expected = [
    { type: 'if', condition: ['isActive'], then: [], else: ['>err'] },
  ]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})
