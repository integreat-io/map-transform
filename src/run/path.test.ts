import test from 'node:test'
import assert from 'node:assert/strict'
import type { Path } from '../types.js'

import runPipeline from './index.js'

// Setup

const state = { rev: false }

// Tests -- get path

test('should run simple path pipeline', () => {
  const pipeline = ['item']
  const value = { item: { id: 'ent1' } }
  const expected = { id: 'ent1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should run pipeline with several paths', () => {
  const pipeline = ['response', 'data', 'item']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { id: 'ent1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should return the value untouched with an empty pipeline', () => {
  const pipeline: Path[] = []
  const value = { item: { id: 'ent1' } }

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, value)
})

test('should skip get dot step', () => {
  const pipeline = ['item', '.']
  const value = { item: { id: 'ent1' } }
  const expected = { id: 'ent1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should return undefined when we reach a forward plug', () => {
  const pipeline = ['|', 'response', 'data', 'item']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should skip a reverse plug', () => {
  const pipeline = ['response', 'data', 'item', '>|']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { id: 'ent1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should skip a reverse plug and continue the pipeline', () => {
  const pipeline = ['response', '>|', 'data', 'item']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { id: 'ent1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

// Tests -- get array index

test('should get pipeline with array index', () => {
  const pipeline = ['response', 'data', '[1]', 'item']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expectedValue = { id: 'ent2' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expectedValue)
})

test('should get pipeline with array index only', () => {
  const pipeline = ['[1]']
  const value = [{ id: 'ent1' }, { id: 'ent2' }]
  const expectedValue = { id: 'ent2' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expectedValue)
})

test('should get pipeline with several array indices', () => {
  const pipeline = ['response', 'data', '[0]', 'items', '[1]']
  const value = {
    response: {
      data: [
        { items: [{ id: 'ent1' }, { id: 'ent2' }] },
        { items: [{ id: 'ent3' }] },
      ],
    },
  }
  const expectedValue = { id: 'ent2' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expectedValue)
})

test('should get pipeline with several array indices directly after each other', () => {
  const pipeline = ['response', 'data', '[0]', '[1]']
  const value = {
    response: {
      data: [[{ id: 'ent1' }, { id: 'ent2' }], [{ id: 'ent3' }]],
    },
  }
  const expected = { id: 'ent2' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get pipeline with negative array index', () => {
  const pipeline = ['response', 'data', '[-2]', 'item']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = { id: 'ent1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should return undefined when index in pipeline does not match an item', () => {
  const pipeline = ['response', 'data', '[10]', 'item']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should return undefined when index in pipeline addresses a non-array', () => {
  const pipeline = ['response', 'data', '[0]', 'item']
  const value = {
    response: { data: { item: { id: 'ent1' } } },
  }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should return undefined when value is null', () => {
  const pipeline = ['item']
  const value = null
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

// Test -- get array

test('should get array from pipeline without array notation', () => {
  const pipeline = ['response', 'data', 'items']
  const value = { response: { data: { items: [{ id: 'ent1' }] } } }
  const expected = [{ id: 'ent1' }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get values within an array without array notation', () => {
  const pipeline = ['response', 'data', 'item']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get array from pipeline with array notation', () => {
  const pipeline = ['response', 'data', 'items', '[]']
  const value = { response: { data: { items: [{ id: 'ent1' }] } } }
  const expected = [{ id: 'ent1' }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should return empty array from array notation value is undefined', () => {
  const pipeline = ['[]']
  const value = undefined
  const expected: unknown[] = []

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should return empty array from array notation value is a non-value', () => {
  const pipeline = ['[]']
  const value = ''
  const state = { nonvalues: [undefined, ''] }
  const expected: unknown[] = []

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should not return empty array from array notation when noDefaults is true', () => {
  const pipeline = ['[]']
  const value = undefined
  const state = { noDefaults: true }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should not return empty array from array notation when noDefaults is true and value is a non-value', () => {
  const pipeline = ['[]']
  const value = ''
  const state = { noDefaults: true, nonvalues: [undefined, ''] }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should get array from pipeline with array notation even when the path points to an object', () => {
  const pipeline = ['response', 'data', 'item', '[]']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = [{ id: 'ent1' }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get pipeline with array notation in the middle', () => {
  const pipeline = ['response', 'data', '[]', 'item']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = [{ id: 'ent1' }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get pipeline with several levels after array', () => {
  const pipeline = ['responses', 'data', 'item']
  const value = { responses: [{ data: { item: { id: 'ent1' } } }] }
  const expected = [{ id: 'ent1' }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get pipeline with array notion where the array is', () => {
  const pipeline = ['responses', '[]', 'data', 'item']
  const value = { responses: [{ data: { item: { id: 'ent1' } } }] }
  const expected = [{ id: 'ent1' }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get pipeline with array notion after the actual array', () => {
  const pipeline = ['responses', 'data', 'item', '[]']
  const value = { responses: [{ data: { item: { id: 'ent1' } } }] }
  const expected = [{ id: 'ent1' }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should flatten array when data has several levels of arrays', () => {
  const pipeline = ['responses', 'data', 'items']
  const value = {
    responses: [
      { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
      { data: { items: [{ id: 'ent3' }] } },
    ],
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }, { id: 'ent3' }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should flatten array with array brackets in the right places', () => {
  const pipeline = ['responses', '[]', 'data', 'items', '[]']
  const value = {
    responses: [
      { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
      { data: { items: [{ id: 'ent3' }] } },
    ],
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }, { id: 'ent3' }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should flatten array with more array brackets than needed', () => {
  const pipeline = ['response', '[]', 'data', 'items', '[]']
  const value = {
    response: { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get array from pipeline with index notation', () => {
  const pipeline = ['responses', '[1]', 'data', 'items', '[]']
  const value = {
    responses: [
      { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
      { data: { items: [{ id: 'ent3' }] } },
    ],
  }
  const expected = [{ id: 'ent3' }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get wrap null in array with array notation', () => {
  const pipeline = ['response', 'data', 'items', '[]']
  const value = { response: { data: { items: null } } }
  const expected = [null]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

// Tests -- get parent

test('should get from parent', () => {
  const pipeline = ['response', 'data', 'item', '^', 'count']
  const value = { response: { data: { item: { id: 'ent1' }, count: 1 } } }
  const expected = 1

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should get from parent several steps up', () => {
  const pipeline = ['response', 'data', 'item', '^', '^', 'count']
  const value = { response: { data: { item: { id: 'ent1' } }, count: 1 } }
  const expected = 1

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should get from parent after array notation', () => {
  const pipeline = ['response', 'data', '[]', 'item', '^', 'count']
  const value = { response: { data: { item: { id: 'ent1' }, count: 1 } } }
  const expected = [1]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get from parent throught array notation', () => {
  const pipeline = ['response', 'data', '[]', 'item', '^', '^', '^', 'count']
  const value = {
    response: {
      data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }],
      count: 2,
    },
  }
  const expected = [2, 2]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get from parent through an iteration inside another iteration', () => {
  const pipeline = [
    'response',
    'data',
    '[]',
    'items',
    '[]',
    'props',
    '^',
    '^',
    '^',
    'count',
  ]
  const value = {
    response: {
      data: [
        {
          items: [{ props: { id: 'ent1' } }, { props: { id: 'ent2' } }],
          count: 2,
        },
        { items: [{ props: { id: 'ent3' } }], count: 1 },
      ],
    },
  }
  const expected = [2, 2, 1]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

// TODO: I'm not at all sure this is correct behavior. I'm also not
// sure we every defined an expected behavior for a parent directly
// after a set.
test('should get from parent after set', () => {
  const pipeline = ['response', 'data', 'item', '>value', '^', 'count']
  const value = { response: { data: { item: { id: 'ent1' }, count: 1 } } }
  const expected = 1

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

// Tests -- get root

test('should get pipeline with root', () => {
  const pipeline = ['response', 'data', 'item', '^^', 'response']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { data: { item: { id: 'ent1' } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get pipeline with root after array', () => {
  const pipeline = ['response', 'data', '[]', 'item', '^^']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = [value, value] // It is correct that we get one for every item

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get pipeline with root after parent', () => {
  const pipeline = ['response', 'data', 'item', '^', '^^', 'response']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { data: { item: { id: 'ent1' } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should get from root when we are at the root', () => {
  const pipeline = ['^^', 'response', 'data', 'item']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { id: 'ent1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

// Tests -- set path

test('should set pipeline', () => {
  const pipeline = ['response', 'data', 'item', '>value']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { value: { id: 'ent1' } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline with several set paths', () => {
  const pipeline = ['response', 'data', 'item', '>value', '>data']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { data: { value: { id: 'ent1' } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set undefined value', () => {
  const pipeline = ['>value']
  const value = undefined
  const expected = { value: undefined }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should keep the original value of a non-value', () => {
  const pipeline = ['>value']
  const value = ''
  const state = { nonvalues: [undefined, ''] }
  const expected = { value: '' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should not set undefined value when noDefaults is true', () => {
  const pipeline = ['>value']
  const value = undefined
  const state = { noDefaults: true }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should still set a non-value when noDefaults is true', () => {
  const pipeline = ['>value']
  const value = ''
  const state = { nonvalues: [undefined, ''], noDefaults: true }
  const expected = { value: '' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline with array index', () => {
  const pipeline = ['response', 'data', 'item', '>[0]', '>values']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { values: [{ id: 'ent1' }] }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline with array index greater than 0', () => {
  const pipeline = ['response', 'data', 'item', '>[2]', '>values']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  // eslint-disable-next-line no-sparse-arrays
  const expected = { values: [, , { id: 'ent1' }] }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline with negative array index', () => {
  const pipeline = ['response', 'data', 'item', '>[-2]', '>values']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { values: [{ id: 'ent1' }] }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set array with pipeline ', () => {
  const pipeline = ['response', 'data', 'items', '>values']
  const value = {
    response: { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
  }
  const expected = { values: [{ id: 'ent1' }, { id: 'ent2' }] }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set array after iteration', () => {
  const pipeline = ['response', 'data', 'item', '>values']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = { values: [{ id: 'ent1' }, { id: 'ent2' }] }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline with array notation', () => {
  const pipeline = ['response', 'data', 'item', '>[]', '>values']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = { values: [{ id: 'ent1' }, { id: 'ent2' }] }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should flatten with array notation', () => {
  const pipeline = ['responses', 'data', 'item', '>[]', '>values']
  const value = {
    responses: [{ data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] }],
  }
  const expected = { values: [{ id: 'ent1' }, { id: 'ent2' }] }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline with array notation in the middle of a path', () => {
  const pipeline = ['response', 'data', 'item', '>item', '>[]', '>values']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = {
    values: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }],
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline with set iteration', () => {
  const pipeline = ['response', 'data', 'item', '>value', '>[]']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = [{ value: { id: 'ent1' } }, { value: { id: 'ent2' } }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline with array notation in the middle of a path when iteration is started by bracket notation', () => {
  const pipeline = ['response', 'data', '[]', 'item', '>item', '>[]', '>values']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = {
    values: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }],
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline with an inner array notation', () => {
  const pipeline = [
    'response',
    'data',
    '[]',
    'item',
    'keywords',
    '>[]',
    '>tags',
    '>item',
    '>[]',
    '>values',
  ]
  const value = {
    response: {
      data: [
        { item: { id: 'ent1', keywords: ['news', 'politics'] } },
        { item: { id: 'ent2', keywords: ['sports'] } },
      ],
    },
  }
  const expected = {
    values: [
      { item: { tags: ['news', 'politics'] } },
      { item: { tags: ['sports'] } },
    ],
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline with array notation in the middle of a path when iteration is not started', () => {
  const pipeline = ['>item', '>[]', '>values']
  const value = [{ id: 'ent1' }, { id: 'ent2' }]
  const expected = {
    values: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }],
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set undefined as empty array with array notation', () => {
  const pipeline = ['>[]']
  const value = undefined
  const expected: unknown[] = []

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should not set undefined as empty array when noDefaults is true', () => {
  const pipeline = ['>[]']
  const value = undefined
  const stateWithNoDefaults = { ...state, noDefaults: true }
  const expected = undefined

  const ret = runPipeline(value, pipeline, stateWithNoDefaults)

  assert.equal(ret, expected)
})

test('should disregard one set step for each parent notation', () => {
  const pipeline = [
    'response',
    'data',
    'item',
    '>value',
    '>^',
    '>^',
    '>items',
    '>content',
    '>data',
  ]
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { data: { value: { id: 'ent1' } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

// TODO: Is this correct?
test('should apply parent to non-path steps too', () => {
  const pipeline = [
    'response',
    'data',
    'item',
    '>value',
    '>^',
    '>^',
    { type: 'mutation' as const, pipelines: [['value', '>here']] },
    '>content',
    '>data',
  ]
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { data: { value: { id: 'ent1' } } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should return undefined when trying to set with root notation', () => {
  const pipeline = [
    'response',
    'data',
    'item',
    '>value',
    '>^^',
    '>items',
    '>content',
    '>data',
  ]
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

// Tests -- set on target

test('should set pipeline on target', () => {
  const pipeline = ['response', 'data', 'item', '>value']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const target = { count: 1 }
  const state = { target }
  const expected = { value: { id: 'ent1' }, count: 1 }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline one level into target', () => {
  const pipeline = ['response', 'data', 'item', 'id', '>id', '>value']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const target = { value: { title: 'Entry 1' } }
  const state = { target }
  const expected = { value: { id: 'ent1', title: 'Entry 1' } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline several levels into target', () => {
  const pipeline = ['response', 'data', 'item', 'id', '>id', '>value', '>data']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const target = { data: { value: { title: 'Entry 1' }, count: 1 } }
  const state = { target }
  const expected = {
    data: { value: { id: 'ent1', title: 'Entry 1' }, count: 1 },
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline on target with set array notation', () => {
  const pipeline = ['meta', 'keywords', '>id', '>[]', '>topics']
  const value = {
    meta: { keywords: ['news', 'latest'], userId: 'johnf' },
  }
  const target = { topics: [{ name: 'News' }, { name: 'Latest' }] }
  const state = { target }
  const expected = {
    topics: [
      { id: 'news', name: 'News' },
      { id: 'latest', name: 'Latest' },
    ],
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline on target with set array notation when target has an object in the array position', () => {
  const pipeline = ['meta', 'keywords', '>id', '>[]', '>topics']
  const value = {
    meta: { keywords: ['news', 'latest'], userId: 'johnf' },
  }
  const target = { topics: { name: 'News' } }
  const state = { target }
  const expected = {
    topics: [{ id: 'news', name: 'News' }, { id: 'latest' }],
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline on target with set array notation and more levels in iteration', () => {
  const pipeline = ['meta', 'keywords', '>id', '>item', '>[]', '>topics']
  const value = {
    content: { heading: 'Heading 1' },
    meta: { keywords: ['news', 'latest'], userId: 'johnf' },
  }
  const target = {}
  const state = { target }
  const expected = {
    topics: [{ item: { id: 'news' } }, { item: { id: 'latest' } }],
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set undefined on target', () => {
  const pipeline = ['>value']
  const value = undefined
  const target = { count: 1 }
  const state = { target }
  const expected = { count: 1, value: undefined }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set the original value of a non-value on target', () => {
  const pipeline = ['>value']
  const value = ''
  const target = { count: 1 }
  const state = { target, nonvalues: [undefined, ''] }
  const expected = { count: 1, value: '' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should not set undefined on target when noDefaults is true', () => {
  const pipeline = ['>value']
  const value = undefined
  const target = { count: 1 }
  const state = { target, noDefaults: true }
  const expected = { count: 1 }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should still set a non-value on target when noDefaults is true', () => {
  const pipeline = ['>value']
  const value = ''
  const target = { count: 1 }
  const state = { target, nonvalues: [undefined, ''], noDefaults: true }
  const expected = { count: 1, value: '' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline on target with index', () => {
  const pipeline = ['response', 'data', 'item', '>[1]', '>values']
  const value = { response: { data: { item: { id: 'ent2' } } } }
  const target = { count: 1, values: [{ id: 'ent1' }] }
  const state = { target }
  const expected = { values: [{ id: 'ent1' }, { id: 'ent2' }], count: 1 }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline with array index on target', () => {
  const pipeline = ['content', 'prop2', '>value', '>[1]', '>props']
  const value = { content: { prop2: 'Value 2' } }
  const target = { props: [{ value: 'Value 1' }] }
  const state = { target }
  const expected = { props: [{ value: 'Value 1' }, { value: 'Value 2' }] }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline with negative array index on target', () => {
  const pipeline = ['response', 'data', 'item', 'id', '>id', '>[-2]', '>values']
  const value = { response: { data: { item: { id: 'ent2' } } } }
  const target = {
    values: [{ value: 'Value 1' }, { value: 'Value 2' }, { value: 'Value 3' }],
  }
  const state = { target }
  const expected = {
    values: [
      { value: 'Value 1' },
      { id: 'ent2', value: 'Value 2' },
      { value: 'Value 3' },
    ],
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline on target with array notation', () => {
  const pipeline = ['response', 'data', 'item', '>[]', '>values']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const target = { count: 0, values: null }
  const state = { target }
  const expected = { values: [{ id: 'ent1' }], count: 0 }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should set pipeline on target with array notation and inner workings', () => {
  const pipeline = ['response', 'data', 'items', 'id', '>[]', '>values']
  const value = { response: { data: { items: [{ id: 'ent1' }] } } }
  const target = { count: 0, values: null }
  const state = { target }
  const expected = { values: ['ent1'], count: 0 }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should merge with target when we reach a set dot step', () => {
  const pipeline = ['response', 'data', 'item', '>.']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const target = { count: 1 }
  const state = { target }
  const expected = { id: 'ent1', count: 1 }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should prioritize value when merging with target', () => {
  const pipeline = ['response', 'data', 'item', '>.']
  const value = {
    response: { data: { item: { id: 'ent1', title: 'Use this' } } },
  }
  const target = { count: 1, title: 'Not this' }
  const state = { target }
  const expected = { id: 'ent1', title: 'Use this', count: 1 }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should merge and prioritize target over value', () => {
  const pipeline = ['response', 'data', 'item', '>...']
  const value = {
    response: { data: { item: { id: 'ent1', title: "Don't use this" } } },
  }
  const target = { count: 1, title: 'But this' }
  const state = { target }
  const expected = { id: 'ent1', title: 'But this', count: 1 }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should merge and return target when value is not an object', () => {
  const pipeline = ['response', 'data', 'item', '>...']
  const value = undefined
  const target = { count: 1, title: 'But this' }
  const state = { target }
  const expected = { title: 'But this', count: 1 }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should merge and return value when target is not an object', () => {
  const pipeline = ['response', 'data', 'item', '>...']
  const value = {
    response: { data: { item: { id: 'ent1', title: 'Actually use this' } } },
  }
  const target = undefined
  const state = { target }
  const expected = { id: 'ent1', title: 'Actually use this' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should return target when we reach a forward plug', () => {
  const pipeline = ['|', 'response', 'data', 'item']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const target = { count: 0, values: null }
  const state = { target }
  const expected = { count: 0, values: null }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})
