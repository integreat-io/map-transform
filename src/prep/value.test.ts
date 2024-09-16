import test from 'ava'

import preparePipline from './index.js'

// Setup

const options = {}

// Tests

test('should prepare value step', (t) => {
  const def = { $value: 'Hello' }
  const expected = [{ type: 'value', value: 'Hello', fixed: false }]

  const ret = preparePipline(def, options)

  t.deepEqual(ret, expected)
})

test('should unescape **undefined**', (t) => {
  const def = { $value: '**undefined**' }
  const expected = [{ type: 'value', value: undefined, fixed: false }]

  const ret = preparePipline(def, options)

  t.deepEqual(ret, expected)
})

test('should support value step with undefined value', (t) => {
  const def = { $value: undefined }
  const expected = [{ type: 'value', value: undefined, fixed: false }]

  const ret = preparePipline(def, options)

  t.deepEqual(ret, expected)
})

test('should support value step with value function', (t) => {
  const fn = () => 'Hello'
  const def = { $value: fn }
  const expected = [{ type: 'value', value: fn, fixed: false }]

  const ret = preparePipline(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare fixed value step', (t) => {
  const def = { $value: 'Hello', fixed: true }
  const expected = [{ type: 'value', value: 'Hello', fixed: true }]

  const ret = preparePipline(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare fixed step', (t) => {
  const def = { $fixed: 'Hello' }
  const expected = [{ type: 'value', value: 'Hello', fixed: true }]

  const ret = preparePipline(def, options)

  t.deepEqual(ret, expected)
})
