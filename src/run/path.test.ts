import test from 'ava'

import runPipeline from './index.js'

// Setup

const state = { rev: false }

// Tests -- get path

test('should run simple path pipeline', (t) => {
  const pipeline = ['item']
  const value = { item: { id: 'ent1' } }
  const expected = { id: 'ent1' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should run pipeline with several paths', (t) => {
  const pipeline = ['response', 'data', 'item']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expectedValue = { id: 'ent1' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expectedValue)
})

// Tests -- get array index

test('should get pipeline with array index', (t) => {
  const pipeline = ['response', 'data', '[1]', 'item']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expectedValue = { id: 'ent2' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expectedValue)
})

test('should get pipeline with array index only', (t) => {
  const pipeline = ['[1]']
  const value = [{ id: 'ent1' }, { id: 'ent2' }]
  const expectedValue = { id: 'ent2' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expectedValue)
})

test('should get pipeline with several array indices', (t) => {
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

  t.deepEqual(ret, expectedValue)
})

test('should get pipeline with several array indices directly after each other', (t) => {
  const pipeline = ['response', 'data', '[0]', '[1]']
  const value = {
    response: {
      data: [[{ id: 'ent1' }, { id: 'ent2' }], [{ id: 'ent3' }]],
    },
  }
  const expected = { id: 'ent2' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should get pipeline with negative array index', (t) => {
  const pipeline = ['response', 'data', '[-2]', 'item']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = { id: 'ent1' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should return undefined when index in pipeline does not match an item', (t) => {
  const pipeline = ['response', 'data', '[10]', 'item']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

test('should return undefined when index in pipeline addresses a non-array', (t) => {
  const pipeline = ['response', 'data', '[0]', 'item']
  const value = {
    response: { data: { item: { id: 'ent1' } } },
  }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

// Test -- get array

test('should get array from pipeline without array notation', (t) => {
  const pipeline = ['response', 'data', 'items']
  const value = { response: { data: { items: [{ id: 'ent1' }] } } }
  const expected = [{ id: 'ent1' }]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should get values within an array without array notation', (t) => {
  const pipeline = ['response', 'data', 'item']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should get array from pipeline with array notation', (t) => {
  const pipeline = ['response', 'data', 'items', '[]']
  const value = { response: { data: { items: [{ id: 'ent1' }] } } }
  const expected = [{ id: 'ent1' }]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should get array from pipeline with array notation even when the path points to an object', (t) => {
  const pipeline = ['response', 'data', 'item', '[]']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = [{ id: 'ent1' }]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should get pipeline with array notation in the middle', (t) => {
  const pipeline = ['response', 'data', '[]', 'item']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = [{ id: 'ent1' }]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should get pipeline with several levels after array', (t) => {
  const pipeline = ['responses', 'data', 'item']
  const value = { responses: [{ data: { item: { id: 'ent1' } } }] }
  const expected = [{ id: 'ent1' }]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should get pipeline with array notion where the array is', (t) => {
  const pipeline = ['responses', '[]', 'data', 'item']
  const value = { responses: [{ data: { item: { id: 'ent1' } } }] }
  const expected = [{ id: 'ent1' }]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should get pipeline with array notion after the actual array', (t) => {
  const pipeline = ['responses', 'data', 'item', '[]']
  const value = { responses: [{ data: { item: { id: 'ent1' } } }] }
  const expected = [{ id: 'ent1' }]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should flatten array when data has several levels of arrays', (t) => {
  const pipeline = ['responses', 'data', 'items']
  const value = {
    responses: [
      { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
      { data: { items: [{ id: 'ent3' }] } },
    ],
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }, { id: 'ent3' }]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should flatten array with array brackets in the right places', (t) => {
  const pipeline = ['responses', '[]', 'data', 'items', '[]']
  const value = {
    responses: [
      { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
      { data: { items: [{ id: 'ent3' }] } },
    ],
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }, { id: 'ent3' }]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should flatten array with more array brackets than needed', (t) => {
  const pipeline = ['response', '[]', 'data', 'items', '[]']
  const value = {
    response: { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should get array from pipeline with index notation', (t) => {
  const pipeline = ['responses', '[1]', 'data', 'items', '[]']
  const value = {
    responses: [
      { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
      { data: { items: [{ id: 'ent3' }] } },
    ],
  }
  const expected = [{ id: 'ent3' }]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

// Tests -- get parent

test('should get from parent', (t) => {
  const pipeline = ['response', 'data', 'item', '^', 'count']
  const value = { response: { data: { item: { id: 'ent1' }, count: 1 } } }
  const expected = 1

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

test('should get from parent several steps up', (t) => {
  const pipeline = ['response', 'data', 'item', '^', '^', 'count']
  const value = { response: { data: { item: { id: 'ent1' } }, count: 1 } }
  const expected = 1

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

test('should get from parent after array notation', (t) => {
  const pipeline = ['response', 'data', '[]', 'item', '^', 'count']
  const value = { response: { data: { item: { id: 'ent1' }, count: 1 } } }
  const expected = [1]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should get from parent throught array notation', (t) => {
  const pipeline = ['response', 'data', '[]', 'item', '^', '^', '^', 'count']
  const value = {
    response: {
      data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }],
      count: 2,
    },
  }
  const expected = [2, 2]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

// TODO: I'm not at all sure this is correct behavior. I'm also not
// sure we every defined an expected behavior for a parent directly
// after a set.
test('should get from parent after set', (t) => {
  const pipeline = ['response', 'data', 'item', '>value', '^', 'count']
  const value = { response: { data: { item: { id: 'ent1' }, count: 1 } } }
  const expected = 1

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

// Tests -- get root

test('should get pipeline with root', (t) => {
  const pipeline = ['response', 'data', 'item', '^^', 'response']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { data: { item: { id: 'ent1' } } }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should get pipeline with root after array', (t) => {
  const pipeline = ['response', 'data', '[]', 'item', '^^']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = [value, value] // It is correct that we get one for every item

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should get pipeline with root after parent', (t) => {
  const pipeline = ['response', 'data', 'item', '^', '^^', 'response']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { data: { item: { id: 'ent1' } } }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should get from root when we are at the root', (t) => {
  const pipeline = ['^^', 'response', 'data', 'item']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { id: 'ent1' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

// Tests -- set path

test('should set pipeline', (t) => {
  const pipeline = ['response', 'data', 'item', '>value']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { value: { id: 'ent1' } }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should set pipeline with several set paths', (t) => {
  const pipeline = ['response', 'data', 'item', '>value', '>data']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { data: { value: { id: 'ent1' } } }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should set pipeline with array index', (t) => {
  const pipeline = ['response', 'data', 'item', '>[0]', '>values']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { values: [{ id: 'ent1' }] }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should set pipeline with array index greater than 0', (t) => {
  const pipeline = ['response', 'data', 'item', '>[2]', '>values']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { values: [undefined, undefined, { id: 'ent1' }] }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

// TODO: This will only ever set on index 0, as it does not make sense
// to set on a negative index on an empty array. This will start having
// an effect when we set on targets, so make sure to revist this then.
test('should set pipeline with negative array index', (t) => {
  const pipeline = ['response', 'data', 'item', '>[-2]', '>values']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { values: [{ id: 'ent1' }] }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should set array with pipeline ', (t) => {
  const pipeline = ['response', 'data', 'items', '>values']
  const value = {
    response: { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
  }
  const expected = { values: [{ id: 'ent1' }, { id: 'ent2' }] }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should set array after iteration', (t) => {
  const pipeline = ['response', 'data', 'item', '>values']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = { values: [{ id: 'ent1' }, { id: 'ent2' }] }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should set pipeline with array notation', (t) => {
  const pipeline = ['response', 'data', 'item', '>[]', '>values']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = { values: [{ id: 'ent1' }, { id: 'ent2' }] }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should set pipeline with array notation in the middle of a path', (t) => {
  const pipeline = ['response', 'data', 'item', '>item', '>[]', '>values']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = {
    values: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }],
  }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should set pipeline with set iteration', (t) => {
  const pipeline = ['response', 'data', 'item', '>value', '>[]']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = [{ value: { id: 'ent1' } }, { value: { id: 'ent2' } }]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should set pipeline with array notation in the middle of a path when iteration is started by bracket notation', (t) => {
  const pipeline = ['response', 'data', '[]', 'item', '>item', '>[]', '>values']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = {
    values: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }],
  }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should set pipeline with array notation in the middle of a path when iteration is not started', (t) => {
  const pipeline = ['>item', '>[]', '>values']
  const value = [{ id: 'ent1' }, { id: 'ent2' }]
  const expected = {
    values: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }],
  }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should disregard one set step for each parent notation', (t) => {
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

  t.deepEqual(ret, expected)
})

// TODO: Is this correct?
test('should apply parent to non-path steps too', (t) => {
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

  t.deepEqual(ret, expected)
})

test('should disregard everything after a set root notation', (t) => {
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
  const expected = { value: { id: 'ent1' } }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

// Tests -- set on target

test('should set pipeline on target', (t) => {
  const pipeline = ['response', 'data', 'item', '>value']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const target = { count: 1 }
  const state = { target }
  const expected = { value: { id: 'ent1' }, count: 1 }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should set pipeline one level into target', (t) => {
  const pipeline = ['response', 'data', 'item', 'id', '>id', '>value']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const target = { value: { title: 'Entry 1' } }
  const state = { target }
  const expected = { value: { id: 'ent1', title: 'Entry 1' } }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should set pipeline several levels into target', (t) => {
  const pipeline = ['response', 'data', 'item', 'id', '>id', '>value', '>data']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const target = { data: { value: { title: 'Entry 1' }, count: 1 } }
  const state = { target }
  const expected = {
    data: { value: { id: 'ent1', title: 'Entry 1' }, count: 1 },
  }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should set pipeline on target with index', (t) => {
  const pipeline = ['response', 'data', 'item', '>[1]', '>values']
  const value = { response: { data: { item: { id: 'ent2' } } } }
  const target = { count: 1, values: [{ id: 'ent1' }] }
  const state = { target }
  const expected = { values: [{ id: 'ent1' }, { id: 'ent2' }], count: 1 }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should set pipeline on target with array notation', (t) => {
  const pipeline = ['response', 'data', 'item', '>[]', '>values']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const target = { count: 0, values: null }
  const state = { target }
  const expected = { values: [{ id: 'ent1' }], count: 0 }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test.todo('should set pipeline on target inside array')

test.todo('should flatten array when setting')

test.todo('should not set nonvalues')
