import test from 'node:test'
import assert from 'node:assert/strict'

import unwindTarget from './unwindTarget.js'

// Setup

const isRev = true

// Tests

test('should unwind one level target', () => {
  const pipeline = ['response', 'data', 'item', '>value']
  const target = { count: 1 }
  const expected = [{ count: 1 }]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should unwind two level target', () => {
  const pipeline = ['response', 'data', 'item', 'id', '>id', '>value']
  const target = { value: { title: 'Entry 1' } }
  const expected = [{ value: { title: 'Entry 1' } }, { title: 'Entry 1' }]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should unwind three level target', () => {
  const pipeline = ['response', '>item', '>data', '>response']
  const target = { response: { data: { item: { id: 'ent1' } } } }
  const expected = [
    { response: { data: { item: { id: 'ent1' } } } },
    { data: { item: { id: 'ent1' } } },
    { item: { id: 'ent1' } },
  ]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should unwind three level target where only two level exists', () => {
  const pipeline = ['response', '>item', '>data', '>response']
  const target = { response: { data: {} } }
  const expected = [{ response: { data: {} } }, { data: {} }, {}]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should unwind three level target where only one level exists', () => {
  const pipeline = ['response', '>item', '>data', '>response']
  const target = { response: {} }
  const expected = [{ response: {} }, {}, undefined]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should unwind three level target where no level exists', () => {
  const pipeline = ['response', '>item', '>data', '>response']
  const target = {}
  const expected = [{}, undefined, undefined]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should unwind three level target with no target', () => {
  const pipeline = ['response', '>item', '>data', '>response']
  const target = undefined
  const expected = [undefined, undefined, undefined]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should unwind where set paths matches a non-value', () => {
  const pipeline = ['response', '>item', '>data', '>response']
  const target = { response: 'No response' }
  const expected = [{ response: 'No response' }, undefined, undefined]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should unwind where set paths matches a non-value on the last level', () => {
  const pipeline = ['response', '>item', '>data', '>response']
  const target = { response: { data: 'Hello' } }
  const expected = [
    { response: { data: 'Hello' } },
    { data: 'Hello' },
    undefined,
  ]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should return empty array when no set steps', () => {
  const pipeline = ['response', 'data', 'item']
  const target = { count: 1 }
  const expected: unknown[] = []

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should unwind with index notation', () => {
  const pipeline = ['response', '>id', '>[1]', '>data']
  const target = { data: [{ id: 'ent1' }, {}] }
  const expected = [{ data: [{ id: 'ent1' }, {}] }, [{ id: 'ent1' }, {}], {}]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should unwind with negative index notation', () => {
  const pipeline = ['response', '>id', '>[-2]', '>data']
  const target = { data: [{ id: 'ent1' }, {}] }
  const expected = [
    { data: [{ id: 'ent1' }, {}] },
    [{ id: 'ent1' }, {}],
    { id: 'ent1' },
  ]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should unwind with an array', () => {
  const pipeline = ['>id', '>values']
  const target = { values: [{ title: 'Entry 1' }, { title: 'Entry 2' }] }
  const expected = [
    { values: [{ title: 'Entry 1' }, { title: 'Entry 2' }] },
    [{ title: 'Entry 1' }, { title: 'Entry 2' }],
  ]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should unwind with an array at the top level', () => {
  const pipeline = ['>id', '>value']
  const target = [
    { value: { title: 'Entry 1' } },
    { value: { title: 'Entry 2' } },
  ]
  const expected = [
    [{ value: { title: 'Entry 1' } }, { value: { title: 'Entry 2' } }],
  ]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should unwind with an array in the middle', () => {
  const pipeline = ['>id', '>value', '>data']
  const target = {
    data: [{ value: { title: 'Entry 1' } }, { value: { title: 'Entry 2' } }],
  }
  const expected = [
    {
      data: [{ value: { title: 'Entry 1' } }, { value: { title: 'Entry 2' } }],
    },
    [{ value: { title: 'Entry 1' } }, { value: { title: 'Entry 2' } }],
  ]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should unwind to array notation', () => {
  const pipeline = ['meta', 'keywords', '>id', '>[]', '>topics']
  const target = { topics: [{ name: 'News' }, { name: 'Latest' }] }
  const expected = [
    { topics: [{ name: 'News' }, { name: 'Latest' }] },
    [{ name: 'News' }, { name: 'Latest' }],
  ]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should unwind to array notation with an object at the array position', () => {
  const pipeline = ['meta', 'keywords', '>id', '>[]', '>topics']
  const target = { topics: { name: 'News' } }
  const expected = [{ topics: { name: 'News' } }, { name: 'News' }]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should skip plug when unwinding', () => {
  const pipeline = ['response', '>item', '>data', '>response', '>|']
  const target = { response: { data: { item: { id: 'ent1' } } } }
  const expected = [
    { response: { data: { item: { id: 'ent1' } } } },
    { data: { item: { id: 'ent1' } } },
    { item: { id: 'ent1' } },
  ]

  const ret = unwindTarget(target, pipeline)

  assert.deepEqual(ret, expected)
})

test('should unwind from get steps in reverse', () => {
  const pipeline = ['>response', 'item', 'data', 'response'] // The order has already been reversed when we get here
  const target = { response: { data: { item: { id: 'ent1' } } } }
  const expected = [
    { response: { data: { item: { id: 'ent1' } } } },
    { data: { item: { id: 'ent1' } } },
    { item: { id: 'ent1' } },
  ]

  const ret = unwindTarget(target, pipeline, isRev)

  assert.deepEqual(ret, expected)
})

test('should skip plug when unwinding in reverse', () => {
  const pipeline = ['>response', 'item', 'data', 'response', '|'] // The order has already been reversed when we get here
  const target = { response: { data: { item: { id: 'ent1' } } } }
  const expected = [
    { response: { data: { item: { id: 'ent1' } } } },
    { data: { item: { id: 'ent1' } } },
    { item: { id: 'ent1' } },
  ]

  const ret = unwindTarget(target, pipeline, isRev)

  assert.deepEqual(ret, expected)
})
