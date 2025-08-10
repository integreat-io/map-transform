import test from 'node:test'
import assert from 'node:assert/strict'

import preparePipline from './index.js'

// Setup

const options = {}

// Tests

test('should prepare value step', () => {
  const def = { $value: 'Hello' }
  const expected = [{ type: 'value', value: 'Hello', fixed: false }]

  const ret = preparePipline(def, options)

  assert.deepEqual(ret, expected)
})

test('should unescape **undefined**', () => {
  const def = { $value: '**undefined**' }
  const expected = [{ type: 'value', value: undefined, fixed: false }]

  const ret = preparePipline(def, options)

  assert.deepEqual(ret, expected)
})

test('should support value step with undefined value', () => {
  const def = { $value: undefined }
  const expected = [{ type: 'value', value: undefined, fixed: false }]

  const ret = preparePipline(def, options)

  assert.deepEqual(ret, expected)
})

test('should support value step with value function', () => {
  const fn = () => 'Hello'
  const def = { $value: fn }
  const expected = [{ type: 'value', value: fn, fixed: false }]

  const ret = preparePipline(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare fixed value step', () => {
  const def = { $value: 'Hello', fixed: true }
  const expected = [{ type: 'value', value: 'Hello', fixed: true }]

  const ret = preparePipline(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare fixed step', () => {
  const def = { $fixed: 'Hello' }
  const expected = [{ type: 'value', value: 'Hello', fixed: true }]

  const ret = preparePipline(def, options)

  assert.deepEqual(ret, expected)
})
