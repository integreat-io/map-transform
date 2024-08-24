import test from 'ava'
import type { Path } from '../types.js'

import prep from './index.js'

// Setup

const options = {}

// Tests -- prepare get prop

test('should prepare simple path', (t) => {
  const def = 'item'
  const expected = ['item']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path with dot notation', (t) => {
  const def = 'response.data.item'
  const expected = ['response', 'data', 'item']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path that is already split up', (t) => {
  const def = ['response', 'data', 'item']
  const expected = ['response', 'data', 'item']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path already in array', (t) => {
  const def = ['response.data.item']
  const expected = ['response', 'data', 'item']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare $modify as ellipse', (t) => {
  const def = '$modify'
  const expected = ['...']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path with escaped dollar', (t) => {
  const def = '\\$item'
  const expected = ['$item']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path with escaped backslash', (t) => {
  const def = 'item\\\\data'
  const expected = ['item\\data']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path with get indicator', (t) => {
  const def = '<response.data.item'
  const expected = ['response', 'data', 'item']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare dot path as an empty pipeline', (t) => {
  const def = '.'
  const expected: Path[] = []

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare set dot path as an empty pipeline', (t) => {
  const def = '>.'
  const expected: Path[] = []

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should keep forward plug step', (t) => {
  const def = ['|', 'response.data.item', '>data']
  const expected = ['|', 'response', 'data', 'item', '>data']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should keep reverse plug step', (t) => {
  const def = ['response.data.item', '>|']
  const expected = ['response', 'data', 'item', '>|']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

// Tests -- prepare get index

test('should prepare path with array index', (t) => {
  const def = 'response.data[1].item'
  const expected = ['response', 'data', '[1]', 'item']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare array index with no path', (t) => {
  const def = '[1]'
  const expected = ['[1]']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path with several array indices', (t) => {
  const def = 'response.data[0].items[1]'
  const expected = ['response', 'data', '[0]', 'items', '[1]']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should get from path with several array indices directly after each other', (t) => {
  const def = 'response.data[0][1]'
  const expected = ['response', 'data', '[0]', '[1]']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path with negative array index', (t) => {
  const def = 'response.data[-2].item'
  const expected = ['response', 'data', '[-2]', 'item']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

// Tests -- prepare get array

test('should prepare path with array notation', (t) => {
  const def = 'response.data.items[]'
  const expected = ['response', 'data', 'items', '[]']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path with array notation in the middle of the path', (t) => {
  const def = 'response.data[].item'
  const expected = ['response', 'data', '[]', 'item']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path with several array brackets', (t) => {
  const def = 'responses[].data.items[]'
  const expected = ['responses', '[]', 'data', 'items', '[]']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path with escaped array notation', (t) => {
  const def = 'response.data.items\\[]'
  const expected = ['response', 'data', 'items[]']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

// Tests -- parent and root

test('should prepare path with parent', (t) => {
  const def = ['response.data.item', '^.count']
  const expected = ['response', 'data', 'item', '^', 'count']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path with several parents', (t) => {
  const def = ['response.data.item', '^.^.count']
  const expected = ['response', 'data', 'item', '^', '^', 'count']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path from root', (t) => {
  const def = '^^.response'
  const expected = ['^^', 'response']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path with dot-less root notation', (t) => {
  const def = '^^response'
  const expected = ['^^', 'response']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path from obsolete root format', (t) => {
  const def = '^response'
  const expected = ['^^', 'response']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path with dot-less root notation and index', (t) => {
  const def = '^^responses[1]'
  const expected = ['^^', 'responses', '[1]']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

// Tests -- set

test('should prepare set path', (t) => {
  const def = ['response.data.item', '>value']
  const expected = ['response', 'data', 'item', '>value']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare set path with dot notation', (t) => {
  const def = ['response.data.item', '>data.value']
  const expected = ['response', 'data', 'item', '>value', '>data']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare set with array index', (t) => {
  const def = ['response.data.item', '>values[0]']
  const expected = ['response', 'data', 'item', '>[0]', '>values']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare set with negative array index', (t) => {
  const def = ['response.data.item', '>values[-2]']
  const expected = ['response', 'data', 'item', '>[-2]', '>values']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should set with array notation', (t) => {
  const def = ['response.data.item', '>values[]']
  const expected = ['response', 'data', 'item', '>[]', '>values']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare path with array notation in the middle', (t) => {
  const def = ['response.data.item', '>values[].item']
  const expected = ['response', 'data', 'item', '>item', '>[]', '>values']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare set path starting with brackets', (t) => {
  const def = ['response.data.item', '>[].value']
  const expected = ['response', 'data', 'item', '>value', '>[]']

  const ret = prep(def, options)

  t.deepEqual(ret, expected)
})
