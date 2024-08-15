import test from 'ava'

import preparePipline from './index.js'

// Setup

const options = {}

// Tests

test('should prepare value step', (t) => {
  const def = { $value: 'Hello' }
  const expected = [{ type: 'value', value: 'Hello' }]

  const ret = preparePipline(def, options)

  t.deepEqual(ret, expected)
})

test('should unescape **undefined**', (t) => {
  const def = { $value: '**undefined**' }
  const expected = [{ type: 'value', value: undefined }]

  const ret = preparePipline(def, options)

  t.deepEqual(ret, expected)
})

test('should support value step with undefined value', (t) => {
  const def = { $value: undefined }
  const expected = [{ type: 'value', value: undefined }]

  const ret = preparePipline(def, options)

  t.deepEqual(ret, expected)
})

test('should support value step with value function', (t) => {
  const fn = () => 'Hello'
  const def = { $value: fn }
  const expected = [{ type: 'value', value: fn }]

  const ret = preparePipline(def, options)

  t.deepEqual(ret, expected)
})
