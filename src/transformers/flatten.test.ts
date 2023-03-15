import test from 'ava'

import flatten from './flatten.js'

// Setup

const state = {
  rev: false,
  noDefaults: false,
  context: [],
  value: {},
}

const options = {}

// Tests

test('should flatten an array', (t) => {
  const data = [[{ id: 'ent1' }, { id: 'ent2' }], [{ id: 'ent3' }]]
  const expected = [{ id: 'ent1' }, { id: 'ent2' }, { id: 'ent3' }]

  const ret = flatten({})(options)(data, state)

  t.deepEqual(ret, expected)
})

test('should flatten a flat array (i.e. do nothing)', (t) => {
  const data = [{ id: 'ent1' }, { id: 'ent2' }]
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = flatten({})(options)(data, state)

  t.deepEqual(ret, expected)
})

test('should only flatten one level of an array', (t) => {
  const data = [[[{ id: 'ent1' }], { id: 'ent2' }], [[{ id: 'ent3' }]]]
  const expected = [[{ id: 'ent1' }], { id: 'ent2' }, [{ id: 'ent3' }]]

  const ret = flatten({})(options)(data, state)

  t.deepEqual(ret, expected)
})

test('should only flatten more levels of an array', (t) => {
  const data = [[[{ id: 'ent1' }], { id: 'ent2' }], [[{ id: 'ent3' }]]]
  const expected = [{ id: 'ent1' }, { id: 'ent2' }, { id: 'ent3' }]

  const ret = flatten({ depth: 2 })(options)(data, state)

  t.deepEqual(ret, expected)
})

test('should not touch non-arrays', (t) => {
  t.is(flatten({})(options)('none', state), 'none')
  t.is(flatten({})(options)(true, state), true)
  t.deepEqual(flatten({})(options)({}, state), {})
  t.is(flatten({})(options)(null, state), null)
  t.is(flatten({})(options)(undefined, state), undefined)
})
