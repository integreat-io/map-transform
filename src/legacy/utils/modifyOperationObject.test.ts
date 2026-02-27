import test from 'node:test'
import assert from 'node:assert/strict'

import modifyOperationObject from './modifyOperationObject.js'

// Tests

test('should return operation object untouched', () => {
  const operation = { $transform: 'now' }
  const expected = { $transform: 'now' }

  const ret = modifyOperationObject(operation)

  assert.deepEqual(ret, expected)
})

test('should change $value to $transform', () => {
  const operation = { $value: 'Hello' }
  const expected = { $transform: 'value', value: 'Hello' }

  const ret = modifyOperationObject(operation)

  assert.deepEqual(ret, expected)
})

test('should change $value to $transform even with undefined value', () => {
  const operation = { $value: undefined }
  const expected = { $transform: 'value', value: undefined }

  const ret = modifyOperationObject(operation)

  assert.deepEqual(ret, expected)
})

test('should keep other props', () => {
  const operation = { $value: 'Hello', $direction: 'fwd' }
  const expected = { $transform: 'value', value: 'Hello', $direction: 'fwd' }

  const ret = modifyOperationObject(operation)

  assert.deepEqual(ret, expected)
})

test('should change $and to $transform', () => {
  const operation = { $and: ['this', 'that'] }
  const expected = {
    $transform: 'logical',
    path: ['this', 'that'],
    operator: 'AND',
  }

  const ret = modifyOperationObject(operation)

  assert.deepEqual(ret, expected)
})

test('should change $or to $transform', () => {
  const operation = { $or: ['this', 'that'] }
  const expected = {
    $transform: 'logical',
    path: ['this', 'that'],
    operator: 'OR',
  }

  const ret = modifyOperationObject(operation)

  assert.deepEqual(ret, expected)
})

test('should change $not to $transform', () => {
  const operation = { $not: 'this' }
  const expected = {
    $transform: 'not',
    path: 'this',
  }

  const ret = modifyOperationObject(operation)

  assert.deepEqual(ret, expected)
})

test('should change $merge to $transform', () => {
  const operation = { $merge: ['this', 'that'] }
  const expected = {
    $transform: 'merge',
    path: ['this', 'that'],
  }

  const ret = modifyOperationObject(operation)

  assert.deepEqual(ret, expected)
})

test('should run custom modifier', () => {
  const modify = (operation: Record<string, unknown>) =>
    operation.$cast ? { $transform: `cast_${operation.$cast}` } : operation
  const operation = { $cast: 'entry' }
  const expected = { $transform: 'cast_entry' }

  const ret = modifyOperationObject(operation, modify)

  assert.deepEqual(ret, expected)
})
