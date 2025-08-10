import test from 'node:test'
import assert from 'node:assert/strict'
import type { Path } from '../types.js'

import runPipeline from './index.js'

// Setup

const state = { rev: true }

// Tests -- set path

test('should run simple path pipeline in reverse', () => {
  const pipeline = ['item']
  const value = { id: 'ent1' }
  const expected = { item: { id: 'ent1' } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should run pipeline with several paths', () => {
  const pipeline = ['response', 'data', 'item']
  const value = { id: 'ent1' }
  const expected = { response: { data: { item: { id: 'ent1' } } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should return the value untouched with an empty pipeline', () => {
  const pipeline: Path[] = []
  const value = { item: { id: 'ent1' } }

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, value)
})

test('should skip get dot steps', () => {
  const pipeline = ['.', 'item', '.']
  const value = { id: 'ent1' }
  const expected = { item: { id: 'ent1' } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should skip set dot steps', () => {
  const pipeline = ['>.', '>item', '>.']
  const value = { item: { id: 'ent1' } }
  const expected = { id: 'ent1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should return undefined when we reach a reverse plug', () => {
  const pipeline = ['response', 'data', 'item', '>|']
  const value = { id: 'ent1' }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should skip a forward plug', () => {
  const pipeline = ['|', 'response', 'data', 'item']
  const value = { id: 'ent1' }
  const expected = { response: { data: { item: { id: 'ent1' } } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should skip a forward plug and continue the pipeline', () => {
  const pipeline = ['response', '|', 'data', 'item']
  const value = { id: 'ent1' }
  const expected = { response: { data: { item: { id: 'ent1' } } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

// Tests -- set array index

test('should set pipeline with array index', () => {
  const pipeline = ['response', 'data', '[1]', 'item']
  const value = { id: 'ent2' }
  // eslint-disable-next-line no-sparse-arrays
  const expectedValue = { response: { data: [, { item: { id: 'ent2' } }] } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expectedValue)
})

test('should set pipeline with array index only', () => {
  const pipeline = ['[1]']
  const value = { id: 'ent2' }
  // eslint-disable-next-line no-sparse-arrays
  const expectedValue = [, { id: 'ent2' }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expectedValue)
})

test('should set pipeline with several array indices', () => {
  const pipeline = ['response', 'data', '[0]', 'items', '[1]']
  const value = { id: 'ent2' }
  // eslint-disable-next-line no-sparse-arrays
  const expectedValue = { response: { data: [{ items: [, { id: 'ent2' }] }] } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expectedValue)
})

test('should set pipeline with several array indices directly after each other', () => {
  const pipeline = ['response', 'data', '[0]', '[1]']
  const value = { id: 'ent2' }
  // eslint-disable-next-line no-sparse-arrays
  const expected = { response: { data: [[, { id: 'ent2' }]] } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline with negative array index', () => {
  const pipeline = ['response', 'data', '[-2]', 'item']
  const value = { id: 'ent1' }
  const expected = {
    response: { data: [{ item: { id: 'ent1' } }] },
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline with an index higher than 0', () => {
  const pipeline = ['response', 'data', '[2]', 'item']
  const value = { id: 'ent3' }
  // eslint-disable-next-line no-sparse-arrays
  const expected = { response: { data: [, , { item: { id: 'ent3' } }] } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

// Test -- set array

test('should set array to pipeline without array notation', () => {
  const pipeline = ['response', 'data', 'items']
  const value = [{ id: 'ent1' }]
  const expected = { response: { data: { items: [{ id: 'ent1' }] } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set values at lowermost end when no array notation', () => {
  const pipeline = ['response', 'data', 'items']
  const value = [{ id: 'ent1' }, { id: 'ent2' }]
  const expected = {
    response: { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set array from pipeline with array notation', () => {
  const pipeline = ['response', 'data', 'items', '[]']
  const value = [{ id: 'ent1' }]
  const expected = { response: { data: { items: [{ id: 'ent1' }] } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set array at the place of array notation', () => {
  const pipeline = ['response', 'data', '[]', 'item', '>[]', '>items']
  const value = { items: [{ id: 'ent1' }, { id: 'ent2' }] }
  const expected = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set object as array to pipeline with array notation', () => {
  const pipeline = ['response', 'data', 'item', '[]']
  const value = { id: 'ent1' }
  const expected = { response: { data: { item: [{ id: 'ent1' }] } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set array from pipeline with index notation', () => {
  const pipeline = ['responses', '[1]', 'data', 'items', '[]']
  const value = [{ id: 'ent3' }]
  // eslint-disable-next-line no-sparse-arrays
  const expected = { responses: [, { data: { items: [{ id: 'ent3' }] } }] }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

// Tests -- get parent

test('should set with parent', () => {
  const pipeline = ['response', 'data', 'item', '^', 'count']
  const value = 1
  const expected = { response: { data: { count: 1 } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set with several parents', () => {
  const pipeline = ['response', 'data', 'item', '^', '^', 'count']
  const value = 1
  const expected = { response: { count: 1 } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set with parent after array notation', () => {
  const pipeline = ['response', 'data', '[]', 'item', '^', 'count']
  const value = [1]
  const expected = { response: { data: [{ count: 1 }] } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set with parents throught array notation', () => {
  const pipeline = ['response', 'data', '[]', 'item', '^', '^', '^', 'count']
  const value = [2, 2]
  const expected = {
    response: {
      count: [2, 2], // The reverse of this was a single count, but there is no way we can know to get back to that
    },
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set from parent after set', () => {
  const pipeline = ['response', 'data', 'item', '>value', '^', 'count']
  const value = 1
  const expected = { response: { data: { item: { count: 1 } } } } // The `item` is set, but the reverse would not get from it ...

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

// Tests -- get root

test('should return undefined when setting with root', () => {
  const pipeline = ['response', 'data', 'item', '^^', 'response']
  const value = { data: { item: { id: 'ent1' } } }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should return undefined when setting with root in reverse', () => {
  const pipeline = ['^^', 'response', 'data', 'item']
  const value = { id: 'ent1' }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

// Tests -- get path

test('should get with set steps and set with get steps', () => {
  const pipeline = ['response', 'data', 'item', '>value']
  const value = { value: { id: 'ent1' } }
  const expected = { response: { data: { item: { id: 'ent1' } } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get pipeline with several set paths', () => {
  const pipeline = ['response', 'data', 'item', '>value', '>data']
  const value = { data: { value: { id: 'ent1' } } }
  const expected = { response: { data: { item: { id: 'ent1' } } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get pipeline with array index', () => {
  const pipeline = ['response', 'data', 'item', '>[0]', '>values']
  const value = { values: [{ id: 'ent1' }] }
  const expected = { response: { data: { item: { id: 'ent1' } } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get pipeline with array index greater than 0', () => {
  const pipeline = ['response', 'data', 'item', '>[2]', '>values']
  const value = { values: [{ id: 'ent1' }, { id: 'ent2' }, { id: 'ent3' }] }
  const expected = { response: { data: { item: { id: 'ent3' } } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get pipeline with negative array index', () => {
  const pipeline = ['response', 'data', 'item', '>[-2]', '>values']
  const value = { values: [{ id: 'ent1' }, { id: 'ent2' }] }
  const expected = { response: { data: { item: { id: 'ent1' } } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get array with pipeline ', () => {
  const pipeline = ['response', 'data', 'items', '>values']
  const value = { values: [{ id: 'ent1' }, { id: 'ent2' }] }
  const expected = {
    response: { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get pipeline with array notation', () => {
  const pipeline = ['response', 'data', '>[]', '>values']
  const value = { values: [{ id: 'ent1' }, { id: 'ent2' }] }
  const expected = {
    response: { data: [{ id: 'ent1' }, { id: 'ent2' }] },
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get pipeline with array notation in the middle of a path', () => {
  const pipeline = ['response', 'data', '>item', '>[]', '>values']
  const value = {
    values: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }],
  }
  const expected = {
    response: { data: [{ id: 'ent1' }, { id: 'ent2' }] },
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get pipeline with set iteration', () => {
  const pipeline = ['response', 'data', '[]', 'item', '>value', '>[]']
  const value = [{ value: { id: 'ent1' } }, { value: { id: 'ent2' } }]
  const expected = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline with array notation in the middle of a path when iteration is started by bracket notation', () => {
  const pipeline = ['response', 'data', '[]', 'item', '>item', '>[]', '>values']
  const value = {
    values: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }],
  }
  const expected = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

// Tests -- set on target

test('should set pipeline on target in reverse', () => {
  const pipeline = ['response', 'data', 'item', '>value']
  const value = { value: { id: 'ent1' } }
  const target = { response: { count: 1 } }
  const state = { target, rev: true }
  const expected = { response: { data: { item: { id: 'ent1' } }, count: 1 } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline one level into target in reverse', () => {
  const pipeline = ['response', 'data', 'item', 'id', '>id', '>value']
  const value = { value: { id: 'ent1' } }
  const target = {
    response: { data: { item: { title: 'Entry 1' } } },
  }
  const state = { target, rev: true }
  const expected = {
    response: { data: { item: { id: 'ent1', title: 'Entry 1' } } },
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline on target with index', () => {
  const pipeline = ['response', 'data', '[1]', '>values']
  const value = { values: { id: 'ent2' }, count: 1 }
  const target = { response: { count: 1, data: [{ id: 'ent1' }] } }
  const state = { target, rev: true }
  const expected = {
    response: { count: 1, data: [{ id: 'ent1' }, { id: 'ent2' }] },
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline on target with array notation', () => {
  const pipeline = ['response', 'data', 'items', '[]', '>values']
  const value = { values: { id: 'ent1' } }
  const target = { response: { data: { count: 0, items: null } } }
  const state = { target, rev: true }
  const expected = { response: { data: { items: [{ id: 'ent1' }], count: 0 } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline on target with iteration', () => {
  const pipeline = ['topics', '[]', 'id', '>keywords', '>meta']
  const value = {
    meta: { keywords: ['news', 'latest'], userId: 'johnf' },
  }
  const target = { topics: [{ name: 'News' }, { name: 'Latest' }] }
  const state = { target, rev: true }
  const expected = {
    topics: [
      { id: 'news', name: 'News' },
      { id: 'latest', name: 'Latest' },
    ],
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should merge with target when we reach a get dot step', () => {
  const pipeline = ['.', '>data']
  const value = { data: { id: 'ent1' } }
  const target = { count: 1 }
  const state = { target, rev: true }
  const expected = { id: 'ent1', count: 1 }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should return target when we reach a reverse plug', () => {
  const pipeline = ['response', 'data', 'item', '>|']
  const value = { id: 'ent1' }
  const target = { response: { data: { count: 0, items: null } } }
  const state = { target, rev: true }
  const expected = { response: { data: { count: 0, items: null } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})
