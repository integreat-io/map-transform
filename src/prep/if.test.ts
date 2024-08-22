import test from 'ava'

import preparePipeline from './index.js'

// Setup

const options = {}

// Tests

test('should prepare if operation', (t) => {
  const def = { $if: 'isActive', then: '>ok', else: '>err' }
  const expected = [
    { type: 'if', condition: ['isActive'], then: ['>ok'], else: ['>err'] },
  ]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare if operation without else pipeline', (t) => {
  const def = { $if: 'isActive', then: '>ok' }
  const expected = [
    { type: 'if', condition: ['isActive'], then: ['>ok'], else: [] },
  ]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare if operation without then pipeline', (t) => {
  const def = { $if: 'isActive', else: '>err' }
  const expected = [
    { type: 'if', condition: ['isActive'], then: [], else: ['>err'] },
  ]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})
