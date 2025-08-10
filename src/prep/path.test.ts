import test from 'node:test'
import assert from 'node:assert/strict'
import type { Path } from '../types.js'

import prep from './index.js'

// Setup

const options = {}

// Tests -- prepare get prop

test('should prepare simple path', () => {
  const def = 'item'
  const expected = ['item']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path with dot notation', () => {
  const def = 'response.data.item'
  const expected = ['response', 'data', 'item']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path that is already split up', () => {
  const def = ['response', 'data', 'item']
  const expected = ['response', 'data', 'item']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path already in array', () => {
  const def = ['response.data.item']
  const expected = ['response', 'data', 'item']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare $modify as ellipse', () => {
  const def = '$modify'
  const expected = ['...']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path with escaped dollar', () => {
  const def = '\\$item'
  const expected = ['$item']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path with escaped backslash', () => {
  const def = 'item\\\\data'
  const expected = ['item\\data']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path with get indicator', () => {
  const def = '<response.data.item'
  const expected = ['response', 'data', 'item']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare dot path as an empty pipeline', () => {
  const def = '.'
  const expected: Path[] = []

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare set dot path as an empty pipeline', () => {
  const def = '>.'
  const expected: Path[] = []

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should keep forward plug step', () => {
  const def = ['|', 'response.data.item', '>data']
  const expected = ['|', 'response', 'data', 'item', '>data']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should keep reverse plug step', () => {
  const def = ['response.data.item', '>|']
  const expected = ['response', 'data', 'item', '>|']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

// Tests -- prepare get index

test('should prepare path with array index', () => {
  const def = 'response.data[1].item'
  const expected = ['response', 'data', '[1]', 'item']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare array index with no path', () => {
  const def = '[1]'
  const expected = ['[1]']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path with several array indices', () => {
  const def = 'response.data[0].items[1]'
  const expected = ['response', 'data', '[0]', 'items', '[1]']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should get from path with several array indices directly after each other', () => {
  const def = 'response.data[0][1]'
  const expected = ['response', 'data', '[0]', '[1]']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path with negative array index', () => {
  const def = 'response.data[-2].item'
  const expected = ['response', 'data', '[-2]', 'item']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

// Tests -- prepare get array

test('should prepare path with array notation', () => {
  const def = 'response.data.items[]'
  const expected = ['response', 'data', 'items', '[]']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path with array notation in the middle of the path', () => {
  const def = 'response.data[].item'
  const expected = ['response', 'data', '[]', 'item']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path with several array brackets', () => {
  const def = 'responses[].data.items[]'
  const expected = ['responses', '[]', 'data', 'items', '[]']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path with escaped array notation', () => {
  const def = 'response.data.items\\[]'
  const expected = ['response', 'data', 'items[]']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should allow escaped slashes', () => {
  const def = 'response.data.items\\\\_1'
  const expected = ['response', 'data', 'items\\_1']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should allow escaped slashes in front of brackets', () => {
  const def = 'response.data.items\\\\[]'
  const expected = ['response', 'data', 'items\\', '[]']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should recognize several escaped slashes', () => {
  const def = 'response.data.items\\\\\\[]'
  const expected = ['response', 'data', 'items\\[]']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

// Tests -- parent and root

test('should prepare path with parent', () => {
  const def = ['response.data.item', '^.count']
  const expected = ['response', 'data', 'item', '^', 'count']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path with several parents', () => {
  const def = ['response.data.item', '^.^.count']
  const expected = ['response', 'data', 'item', '^', '^', 'count']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path from root', () => {
  const def = '^^.response'
  const expected = ['^^', 'response']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path with dot-less root notation', () => {
  const def = '^^response'
  const expected = ['^^', 'response']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path from obsolete root format', () => {
  const def = '^response'
  const expected = ['^^', 'response']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path with dot-less root notation and index', () => {
  const def = '^^responses[1]'
  const expected = ['^^', 'responses', '[1]']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

// Tests -- set

test('should prepare set path', () => {
  const def = ['response.data.item', '>value']
  const expected = ['response', 'data', 'item', '>value']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare set path with dot notation', () => {
  const def = ['response.data.item', '>data.value']
  const expected = ['response', 'data', 'item', '>value', '>data']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare set with array index', () => {
  const def = ['response.data.item', '>values[0]']
  const expected = ['response', 'data', 'item', '>[0]', '>values']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare set with negative array index', () => {
  const def = ['response.data.item', '>values[-2]']
  const expected = ['response', 'data', 'item', '>[-2]', '>values']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should set with array notation', () => {
  const def = ['response.data.item', '>values[]']
  const expected = ['response', 'data', 'item', '>[]', '>values']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare path with array notation in the middle', () => {
  const def = ['response.data.item', '>values[].item']
  const expected = ['response', 'data', 'item', '>item', '>[]', '>values']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare set path starting with brackets', () => {
  const def = ['response.data.item', '>[].value']
  const expected = ['response', 'data', 'item', '>value', '>[]']

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})
