import test from 'ava'

import runPipeline from './run.js'

// Setup

const isRev = true

// Tests -- set path

test('should run simple path pipeline in reverse', (t) => {
  const pipeline = ['item']
  const value = { id: 'ent1' }
  const expected = { item: { id: 'ent1' } }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should run pipeline with several paths', (t) => {
  const pipeline = ['response', 'data', 'item']
  const value = { id: 'ent1' }
  const expectedValue = { response: { data: { item: { id: 'ent1' } } } }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expectedValue)
})

// Tests -- set array index

test('should set pipeline with array index', (t) => {
  const pipeline = ['response', 'data', '[1]', 'item']
  const value = { id: 'ent2' }
  const expectedValue = {
    response: { data: [undefined, { item: { id: 'ent2' } }] },
  }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expectedValue)
})

test('should set pipeline with array index only', (t) => {
  const pipeline = ['[1]']
  const value = { id: 'ent2' }
  const expectedValue = [undefined, { id: 'ent2' }]

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expectedValue)
})

test('should set pipeline with several array indices', (t) => {
  const pipeline = ['response', 'data', '[0]', 'items', '[1]']
  const value = { id: 'ent2' }
  const expectedValue = {
    response: {
      data: [{ items: [undefined, { id: 'ent2' }] }],
    },
  }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expectedValue)
})

test('should set pipeline with several array indices directly after each other', (t) => {
  const pipeline = ['response', 'data', '[0]', '[1]']
  const value = { id: 'ent2' }
  const expected = {
    response: {
      data: [[undefined, { id: 'ent2' }]],
    },
  }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should set pipeline with negative array index', (t) => {
  const pipeline = ['response', 'data', '[-2]', 'item']
  const value = { id: 'ent1' }
  const expected = {
    response: { data: [{ item: { id: 'ent1' } }] },
  }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should set pipeline with an index higher than 0', (t) => {
  const pipeline = ['response', 'data', '[2]', 'item']
  const value = { id: 'ent3' }
  const expected = {
    response: { data: [undefined, undefined, { item: { id: 'ent3' } }] },
  }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

// Test -- set array

test('should set array to pipeline without array notation', (t) => {
  const pipeline = ['response', 'data', 'items']
  const value = [{ id: 'ent1' }]
  const expected = { response: { data: { items: [{ id: 'ent1' }] } } }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should set values at lowermost end when no array notation', (t) => {
  const pipeline = ['response', 'data', 'items']
  const value = [{ id: 'ent1' }, { id: 'ent2' }]
  const expected = {
    response: { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
  }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should set array from pipeline with array notation', (t) => {
  const pipeline = ['response', 'data', 'items', '[]']
  const value = [{ id: 'ent1' }]
  const expected = { response: { data: { items: [{ id: 'ent1' }] } } }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should set array at the place of array notation', (t) => {
  const pipeline = ['response', 'data', '[]', 'item', '>[]', '>items']
  const value = { items: [{ id: 'ent1' }, { id: 'ent2' }] }
  const expected = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should set object as array to pipeline with array notation', (t) => {
  const pipeline = ['response', 'data', 'item', '[]']
  const value = { id: 'ent1' }
  const expected = { response: { data: { item: [{ id: 'ent1' }] } } }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should set array from pipeline with index notation', (t) => {
  const pipeline = ['responses', '[1]', 'data', 'items', '[]']
  const value = [{ id: 'ent3' }]
  const expected = {
    responses: [undefined, { data: { items: [{ id: 'ent3' }] } }],
  }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

// Tests -- get parent

test.skip('should get from parent', (t) => {
  const pipeline = ['response', 'data', 'item', '^', 'count']
  const value = { response: { data: { item: { id: 'ent1' }, count: 1 } } }
  const expected = 1

  const ret = runPipeline(value, pipeline)

  t.is(ret, expected)
})

test.skip('should get from parent several steps up', (t) => {
  const pipeline = ['response', 'data', 'item', '^', '^', 'count']
  const value = { response: { data: { item: { id: 'ent1' } }, count: 1 } }
  const expected = 1

  const ret = runPipeline(value, pipeline)

  t.is(ret, expected)
})

test.skip('should get from parent after array notation', (t) => {
  const pipeline = ['response', 'data', '[]', 'item', '^', 'count']
  const value = { response: { data: { item: { id: 'ent1' }, count: 1 } } }
  const expected = [1]

  const ret = runPipeline(value, pipeline)

  t.deepEqual(ret, expected)
})

test.skip('should get from parent throught array notation', (t) => {
  const pipeline = ['response', 'data', '[]', 'item', '^', '^', '^', 'count']
  const value = {
    response: {
      data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }],
      count: 2,
    },
  }
  const expected = [2, 2]

  const ret = runPipeline(value, pipeline)

  t.deepEqual(ret, expected)
})

// TODO: I'm not at all sure this is correct behavior. I'm also not
// sure we every defined an expected behavior for a parent directly
// after a set.
test.skip('should get from parent after set', (t) => {
  const pipeline = ['response', 'data', 'item', '>value', '^', 'count']
  const value = { response: { data: { item: { id: 'ent1' }, count: 1 } } }
  const expected = 1

  const ret = runPipeline(value, pipeline)

  t.is(ret, expected)
})

// Tests -- get root

test.skip('should get pipeline with root', (t) => {
  const pipeline = ['response', 'data', 'item', '^^', 'response']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { data: { item: { id: 'ent1' } } }

  const ret = runPipeline(value, pipeline)

  t.deepEqual(ret, expected)
})

test.skip('should get pipeline with root after array', (t) => {
  const pipeline = ['response', 'data', '[]', 'item', '^^']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = [value, value] // It is correct that we get one for every item

  const ret = runPipeline(value, pipeline)

  t.deepEqual(ret, expected)
})

test.skip('should get pipeline with root after parent', (t) => {
  const pipeline = ['response', 'data', 'item', '^', '^^', 'response']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { data: { item: { id: 'ent1' } } }

  const ret = runPipeline(value, pipeline)

  t.deepEqual(ret, expected)
})

test.skip('should get from root when we are at the root', (t) => {
  const pipeline = ['^^', 'response', 'data', 'item']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { id: 'ent1' }

  const ret = runPipeline(value, pipeline)

  t.deepEqual(ret, expected)
})

// Tests -- get path

test('should get with set steps and set with get steps', (t) => {
  const pipeline = ['response', 'data', 'item', '>value']
  const value = { value: { id: 'ent1' } }
  const expected = { response: { data: { item: { id: 'ent1' } } } }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should get pipeline with several set paths', (t) => {
  const pipeline = ['response', 'data', 'item', '>value', '>data']
  const value = { data: { value: { id: 'ent1' } } }
  const expected = { response: { data: { item: { id: 'ent1' } } } }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should get pipeline with array index', (t) => {
  const pipeline = ['response', 'data', 'item', '>[0]', '>values']
  const value = { values: [{ id: 'ent1' }] }
  const expected = { response: { data: { item: { id: 'ent1' } } } }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should get pipeline with array index greater than 0', (t) => {
  const pipeline = ['response', 'data', 'item', '>[2]', '>values']
  const value = { values: [{ id: 'ent1' }, { id: 'ent2' }, { id: 'ent3' }] }
  const expected = { response: { data: { item: { id: 'ent3' } } } }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should get pipeline with negative array index', (t) => {
  const pipeline = ['response', 'data', 'item', '>[-2]', '>values']
  const value = { values: [{ id: 'ent1' }, { id: 'ent2' }] }
  const expected = { response: { data: { item: { id: 'ent1' } } } }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should get array with pipeline ', (t) => {
  const pipeline = ['response', 'data', 'items', '>values']
  const value = { values: [{ id: 'ent1' }, { id: 'ent2' }] }
  const expected = {
    response: { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
  }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should get pipeline with array notation', (t) => {
  const pipeline = ['response', 'data', '>[]', '>values']
  const value = { values: [{ id: 'ent1' }, { id: 'ent2' }] }
  const expected = {
    response: { data: [{ id: 'ent1' }, { id: 'ent2' }] },
  }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should get pipeline with array notation in the middle of a path', (t) => {
  const pipeline = ['response', 'data', '>item', '>[]', '>values']
  const value = {
    values: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }],
  }
  const expected = {
    response: { data: [{ id: 'ent1' }, { id: 'ent2' }] },
  }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should get pipeline with set iteration', (t) => {
  const pipeline = ['response', 'data', '[]', 'item', '>value', '>[]']
  const value = [{ value: { id: 'ent1' } }, { value: { id: 'ent2' } }]
  const expected = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

test('should set pipeline with array notation in the middle of a path when iteration is started by bracket notation', (t) => {
  const pipeline = ['response', 'data', '[]', 'item', '>item', '>[]', '>values']
  const value = {
    values: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }],
  }
  const expected = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }

  const ret = runPipeline(value, pipeline, undefined, isRev)

  t.deepEqual(ret, expected)
})

// Tests -- set on target

test('should set pipeline on target in reverse', (t) => {
  const pipeline = ['response', 'data', 'item', '>value']
  const value = { value: { id: 'ent1' } }
  const target = { response: { count: 1 } }
  const expected = { response: { data: { item: { id: 'ent1' } }, count: 1 } }

  const ret = runPipeline(value, pipeline, target, isRev)

  t.deepEqual(ret, expected)
})

test('should set pipeline one level into target in reverse', (t) => {
  const pipeline = ['response', 'data', 'item', 'id', '>id', '>value']
  const value = { value: { id: 'ent1' } }
  const target = {
    response: { data: { item: { title: 'Entry 1' } } },
  }
  const expected = {
    response: { data: { item: { id: 'ent1', title: 'Entry 1' } } },
  }

  const ret = runPipeline(value, pipeline, target, isRev)

  t.deepEqual(ret, expected)
})

test('should set pipeline on target with index', (t) => {
  const pipeline = ['response', 'data', '[1]', '>values']
  const value = { values: { id: 'ent2' }, count: 1 }
  const target = { response: { count: 1, data: [{ id: 'ent1' }] } }
  const expected = {
    response: { count: 1, data: [{ id: 'ent1' }, { id: 'ent2' }] },
  }

  const ret = runPipeline(value, pipeline, target, isRev)

  t.deepEqual(ret, expected)
})

test('should set pipeline on target with array notation', (t) => {
  const pipeline = ['response', 'data', 'items', '[]', '>values']
  const value = { values: { id: 'ent1' } }
  const target = { response: { data: { count: 0, items: null } } }
  const expected = { response: { data: { items: [{ id: 'ent1' }], count: 0 } } }

  const ret = runPipeline(value, pipeline, target, isRev)

  t.deepEqual(ret, expected)
})

test.todo('should set pipeline on target inside array')
