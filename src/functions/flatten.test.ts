import test from 'ava'

import flatten from './flatten.js'

// Setup

const state = {
  rev: false,
  onlyMapped: false,
  context: [],
  value: {},
}

// Tests

test('should flatten an array', (t) => {
  const data = [[{ id: 'ent1' }, { id: 'ent2' }], [{ id: 'ent3' }]]
  const expected = [{ id: 'ent1' }, { id: 'ent2' }, { id: 'ent3' }]

  const ret = flatten({})(data, state)

  t.deepEqual(ret, expected)
})

test('should flatten a flat array (i.e. do nothing)', (t) => {
  const data = [{ id: 'ent1' }, { id: 'ent2' }]
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = flatten({})(data, state)

  t.deepEqual(ret, expected)
})

test('should only flatten one level of an array', (t) => {
  const data = [[[{ id: 'ent1' }], { id: 'ent2' }], [[{ id: 'ent3' }]]]
  const expected = [[{ id: 'ent1' }], { id: 'ent2' }, [{ id: 'ent3' }]]

  const ret = flatten({})(data, state)

  t.deepEqual(ret, expected)
})

test('should only flatten more levels of an array', (t) => {
  const data = [[[{ id: 'ent1' }], { id: 'ent2' }], [[{ id: 'ent3' }]]]
  const expected = [{ id: 'ent1' }, { id: 'ent2' }, { id: 'ent3' }]

  const ret = flatten({ depth: 2 })(data, state)

  t.deepEqual(ret, expected)
})

test('should not touch non-arrays', (t) => {
  t.is(flatten({})('none', state), 'none')
  t.is(flatten({})(true, state), true)
  t.deepEqual(flatten({})({}, state), {})
  t.is(flatten({})(null, state), null)
  t.is(flatten({})(undefined, state), undefined)
})
