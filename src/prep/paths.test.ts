import test from 'ava'

import prep from './index.js'

// Tests -- get prop

test('should get from simple path', (t) => {
  const def = 'item'
  const value = { item: { id: 'ent1' } }
  const expected = { id: 'ent1' }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get from path with dot notation', (t) => {
  const def = 'response.data.item'
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { id: 'ent1' }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get from path in pipeline', (t) => {
  const def = ['response.data.item']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { id: 'ent1' }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get from path with get indicator', (t) => {
  const def = '<response.data.item'
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { id: 'ent1' }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

// Tests -- get index

test('should get from path with array index', (t) => {
  const def = 'response.data[1].item'
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = { id: 'ent2' }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get from array index with no path', (t) => {
  const def = '[1]'
  const value = [{ id: 'ent1' }, { id: 'ent2' }]
  const expected = { id: 'ent2' }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get from path with several array indices', (t) => {
  const def = 'response.data[0].items[1]'
  const value = {
    response: {
      data: [
        { items: [{ id: 'ent1' }, { id: 'ent2' }] },
        { items: [{ id: 'ent3' }] },
      ],
    },
  }
  const expected = { id: 'ent2' }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get from path with several array indices directly after each other', (t) => {
  const def = 'response.data[0][1]'
  const value = {
    response: {
      data: [[{ id: 'ent1' }, { id: 'ent2' }], [{ id: 'ent3' }]],
    },
  }
  const expected = { id: 'ent2' }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get from path with negative array index', (t) => {
  const def = 'response.data[-2].item'
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = { id: 'ent1' }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should return undefined when array index does not match an item', (t) => {
  const def = 'response.data[10].item'
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = undefined

  const ret = prep(def)(value)

  t.is(ret, expected)
})

test('should return undefined for array index when value is not an array', (t) => {
  const def = 'response.data[0].item'
  const value = {
    response: { data: { item: { id: 'ent1' } } },
  }
  const expected = undefined

  const ret = prep(def)(value)

  t.is(ret, expected)
})

// Tests -- get array

test('should get array at path', (t) => {
  const def = 'response.data.items'
  const value = { response: { data: { items: [{ id: 'ent1' }] } } }
  const expected = [{ id: 'ent1' }]

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get values within an array', (t) => {
  const def = 'response.data.item'
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get array with array notation', (t) => {
  const def = 'response.data.items[]'
  const value = { response: { data: { items: [{ id: 'ent1' }] } } }
  const expected = [{ id: 'ent1' }]

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get array with array notation even when the path points to an object', (t) => {
  const def = 'response.data.item[]'
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = [{ id: 'ent1' }]

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get from path with array notation in the middle of the path', (t) => {
  const def = 'response.data[].item'
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = [{ id: 'ent1' }]

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get from path with several levels after array', (t) => {
  const def = 'responses.data.item'
  const value = { responses: [{ data: { item: { id: 'ent1' } } }] }
  const expected = [{ id: 'ent1' }]

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get from path with array notion where the array is', (t) => {
  const def = 'responses[].data.item'
  const value = { responses: [{ data: { item: { id: 'ent1' } } }] }
  const expected = [{ id: 'ent1' }]

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get from path with array notion after the actual array', (t) => {
  const def = 'responses.data.item[]'
  const value = { responses: [{ data: { item: { id: 'ent1' } } }] }
  const expected = [{ id: 'ent1' }]

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should flatten array when data has several levels of arrays', (t) => {
  const def = 'responses.data.items'
  const value = {
    responses: [
      { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
      { data: { items: [{ id: 'ent3' }] } },
    ],
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }, { id: 'ent3' }]

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should flatten array with array brackets in the right places', (t) => {
  const def = 'responses[].data.items[]'
  const value = {
    responses: [
      { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
      { data: { items: [{ id: 'ent3' }] } },
    ],
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }, { id: 'ent3' }]

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should flatten array with more array brackets than needed', (t) => {
  const def = 'response[].data.items[]'
  const value = {
    response: { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get array from path with index notation', (t) => {
  const def = 'responses[1].data.items[]'
  const value = {
    responses: [
      { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
      { data: { items: [{ id: 'ent3' }] } },
    ],
  }
  const expected = [{ id: 'ent3' }]

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

// Tests -- parent

test('should get from parent', (t) => {
  const def = ['response.data.item', '^.count']
  const value = { response: { data: { item: { id: 'ent1' }, count: 1 } } }
  const expected = 1

  const ret = prep(def)(value)

  t.is(ret, expected)
})

test('should get from parent several steps up', (t) => {
  const def = ['response.data.item', '^.^.count']
  const value = { response: { data: { item: { id: 'ent1' } }, count: 1 } }
  const expected = 1

  const ret = prep(def)(value)

  t.is(ret, expected)
})

test('should get from parent after array notation', (t) => {
  const def = ['response.data[].item', '^.count']
  const value = { response: { data: { item: { id: 'ent1' }, count: 1 } } }
  const expected = [1]

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get from parent throught array notation', (t) => {
  const def = ['response.data[].item', '^.^.^.count', '>[].total']
  const value = {
    response: {
      data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }],
      count: 2,
    },
  }
  const expected = [{ total: 2 }, { total: 2 }]

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

// TODO: I'm not at all this is correct behavior. I'm also not
// sure we every defined an expected behavior for a parent directly
// after a set.
test('should get from parent after set', (t) => {
  const def = ['response.data.item', '>value', '^.count']
  const value = { response: { data: { item: { id: 'ent1' }, count: 1 } } }
  const expected = 1

  const ret = prep(def)(value)

  t.is(ret, expected)
})

// Tests -- root

test('should get from root', (t) => {
  const def = ['response.data.item', '^^.response']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { data: { item: { id: 'ent1' } } }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get from root after array', (t) => {
  const def = ['response.data[].item', '^^']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = [value, value] // It is correct that we get one for every item

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get from root after parent', (t) => {
  const def = ['response.data.item', '^', '^^.response']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { data: { item: { id: 'ent1' } } }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get from root when we are at the root', (t) => {
  const def = '^^.response.data.item'
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { id: 'ent1' }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

// Tests -- set

test('should get and set', (t) => {
  const def = ['response.data.item', '>value']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { value: { id: 'ent1' } }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should get and set with dot notation', (t) => {
  const def = ['response.data.item', '>data.value']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { data: { value: { id: 'ent1' } } }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should set on array index', (t) => {
  const def = ['response.data.item', '>values[0]']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { values: [{ id: 'ent1' }] }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should set on array index greater than 0', (t) => {
  const def = ['response.data.item', '>values[2]']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { values: [undefined, undefined, { id: 'ent1' }] }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

// TODO: This will only ever set on index 0, as it does not make sense
// to set on a negative index on an empty array. This will start having
// an effect when we set on targets, so make sure to revist this then.
test('should set on negative array index', (t) => {
  const def = ['response.data.item', '>values[-2]']
  const value = { response: { data: { item: { id: 'ent1' } } } }
  const expected = { values: [{ id: 'ent1' }] }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should set array', (t) => {
  const def = ['response.data.items', '>values']
  const value = {
    response: { data: { items: [{ id: 'ent1' }, { id: 'ent2' }] } },
  }
  const expected = { values: [{ id: 'ent1' }, { id: 'ent2' }] }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should set array after iteration', (t) => {
  const def = ['response.data.item', '>values']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = { values: [{ id: 'ent1' }, { id: 'ent2' }] }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should set with array notation', (t) => {
  const def = ['response.data.item', '>values[]']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = { values: [{ id: 'ent1' }, { id: 'ent2' }] }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should set with array notation in the middle of a path', (t) => {
  const def = ['response.data.item', '>values[].item']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = {
    values: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }],
  }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should set array with set iteration', (t) => {
  const def = ['response.data.item', '>[].value']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = [{ value: { id: 'ent1' } }, { value: { id: 'ent2' } }]

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})

test('should set with array notation in the middle of a path when iteration is started by bracket notation', (t) => {
  const def = ['response.data[].item', '>values[].item']
  const value = {
    response: { data: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }] },
  }
  const expected = {
    values: [{ item: { id: 'ent1' } }, { item: { id: 'ent2' } }],
  }

  const ret = prep(def)(value)

  t.deepEqual(ret, expected)
})
