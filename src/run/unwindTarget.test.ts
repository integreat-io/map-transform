import test from 'ava'

import unwindTarget from './unwindTarget.js'

// Setup

const isRev = true

// Tests

test('should unwind one level target', (t) => {
  const pipeline = ['response', 'data', 'item', '>value']
  const target = { count: 1 }
  const expected = [{ count: 1 }]

  const ret = unwindTarget(target, pipeline)

  t.deepEqual(ret, expected)
})

test('should unwind two level target', (t) => {
  const pipeline = ['response', 'data', 'item', 'id', '>id', '>value']
  const target = { value: { title: 'Entry 1' } }
  const expected = [{ value: { title: 'Entry 1' } }, { title: 'Entry 1' }]

  const ret = unwindTarget(target, pipeline)

  t.deepEqual(ret, expected)
})

test('should unwind three level target', (t) => {
  const pipeline = ['response', '>item', '>data', '>response']
  const target = { response: { data: { item: { id: 'ent1' } } } }
  const expected = [
    { response: { data: { item: { id: 'ent1' } } } },
    { data: { item: { id: 'ent1' } } },
    { item: { id: 'ent1' } },
  ]

  const ret = unwindTarget(target, pipeline)

  t.deepEqual(ret, expected)
})

test('should unwind three level target where only two level exists', (t) => {
  const pipeline = ['response', '>item', '>data', '>response']
  const target = { response: { data: {} } }
  const expected = [{ response: { data: {} } }, { data: {} }, {}]

  const ret = unwindTarget(target, pipeline)

  t.deepEqual(ret, expected)
})

test('should unwind three level target where only one level exists', (t) => {
  const pipeline = ['response', '>item', '>data', '>response']
  const target = { response: {} }
  const expected = [{ response: {} }, {}, undefined]

  const ret = unwindTarget(target, pipeline)

  t.deepEqual(ret, expected)
})

test('should unwind three level target where no level exists', (t) => {
  const pipeline = ['response', '>item', '>data', '>response']
  const target = {}
  const expected = [{}, undefined, undefined]

  const ret = unwindTarget(target, pipeline)

  t.deepEqual(ret, expected)
})

test('should unwind three level target with no target', (t) => {
  const pipeline = ['response', '>item', '>data', '>response']
  const target = undefined
  const expected = [undefined, undefined, undefined]

  const ret = unwindTarget(target, pipeline)

  t.deepEqual(ret, expected)
})

test('should unwind where set paths matches a non-value', (t) => {
  const pipeline = ['response', '>item', '>data', '>response']
  const target = { response: 'No response' }
  const expected = [{ response: 'No response' }, undefined, undefined]

  const ret = unwindTarget(target, pipeline)

  t.deepEqual(ret, expected)
})

test('should unwind where set paths matches a non-value on the last level', (t) => {
  const pipeline = ['response', '>item', '>data', '>response']
  const target = { response: { data: 'Hello' } }
  const expected = [
    { response: { data: 'Hello' } },
    { data: 'Hello' },
    undefined,
  ]

  const ret = unwindTarget(target, pipeline)

  t.deepEqual(ret, expected)
})

test('should return empty array when no set steps', (t) => {
  const pipeline = ['response', 'data', 'item']
  const target = { count: 1 }
  const expected: unknown[] = []

  const ret = unwindTarget(target, pipeline)

  t.deepEqual(ret, expected)
})

test('should unwind with index notation', (t) => {
  const pipeline = ['response', '>id', '>[1]', '>data']
  const target = { data: [{ id: 'ent1' }, {}] }
  const expected = [{ data: [{ id: 'ent1' }, {}] }, [{ id: 'ent1' }, {}], {}]

  const ret = unwindTarget(target, pipeline)

  t.deepEqual(ret, expected)
})

test('should unwind with an array', (t) => {
  const pipeline = ['>id', '>values']
  const target = { values: [{ title: 'Entry 1' }, { title: 'Entry 2' }] }
  const expected = [
    { values: [{ title: 'Entry 1' }, { title: 'Entry 2' }] },
    [{ title: 'Entry 1' }, { title: 'Entry 2' }],
  ]

  const ret = unwindTarget(target, pipeline)

  t.deepEqual(ret, expected)
})

test('should unwind with an array at the top level', (t) => {
  const pipeline = ['>id', '>value']
  const target = [
    { value: { title: 'Entry 1' } },
    { value: { title: 'Entry 2' } },
  ]
  const expected = [
    [{ value: { title: 'Entry 1' } }, { value: { title: 'Entry 2' } }],
  ]

  const ret = unwindTarget(target, pipeline)

  t.deepEqual(ret, expected)
})

test('should unwind with an array in the middle', (t) => {
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

  t.deepEqual(ret, expected)
})

test('should unwind to array notation', (t) => {
  const pipeline = ['meta', 'keywords', '>id', '>[]', '>topics']
  const target = { topics: [{ name: 'News' }, { name: 'Latest' }] }
  const expected = [
    { topics: [{ name: 'News' }, { name: 'Latest' }] },
    [{ name: 'News' }, { name: 'Latest' }],
  ]

  const ret = unwindTarget(target, pipeline)

  t.deepEqual(ret, expected)
})

test('should unwind to array notation with an object at the array position', (t) => {
  const pipeline = ['meta', 'keywords', '>id', '>[]', '>topics']
  const target = { topics: { name: 'News' } }
  const expected = [{ topics: { name: 'News' } }, { name: 'News' }]

  const ret = unwindTarget(target, pipeline)

  t.deepEqual(ret, expected)
})

test('should skip plug when unwinding', (t) => {
  const pipeline = ['response', '>item', '>data', '>response', '>|']
  const target = { response: { data: { item: { id: 'ent1' } } } }
  const expected = [
    { response: { data: { item: { id: 'ent1' } } } },
    { data: { item: { id: 'ent1' } } },
    { item: { id: 'ent1' } },
  ]

  const ret = unwindTarget(target, pipeline)

  t.deepEqual(ret, expected)
})

test('should unwind from get steps in reverse', (t) => {
  const pipeline = ['>response', 'item', 'data', 'response'] // The order has already been reversed when we get here
  const target = { response: { data: { item: { id: 'ent1' } } } }
  const expected = [
    { response: { data: { item: { id: 'ent1' } } } },
    { data: { item: { id: 'ent1' } } },
    { item: { id: 'ent1' } },
  ]

  const ret = unwindTarget(target, pipeline, isRev)

  t.deepEqual(ret, expected)
})

test('should skip plug when unwinding in reverse', (t) => {
  const pipeline = ['>response', 'item', 'data', 'response', '|'] // The order has already been reversed when we get here
  const target = { response: { data: { item: { id: 'ent1' } } } }
  const expected = [
    { response: { data: { item: { id: 'ent1' } } } },
    { data: { item: { id: 'ent1' } } },
    { item: { id: 'ent1' } },
  ]

  const ret = unwindTarget(target, pipeline, isRev)

  t.deepEqual(ret, expected)
})
