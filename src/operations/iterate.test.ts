import test from 'ava'

import iterate from './iterate'

// Setup

const data = [
  { key: 'ent1', headline: 'Entry 1' },
  { key: 'ent2', headline: 'Entry 2' }
]

const options = {}

// Tests

test('should map over a value array', t => {
  const def = {
    id: 'key',
    title: 'headline'
  }
  const state = {
    root: data,
    context: data,
    value: data
  }
  const expected = {
    root: data,
    context: data,
    value: [{ id: 'ent1', title: 'Entry 1' }, { id: 'ent2', title: 'Entry 2' }]
  }

  const ret = iterate(def)(options)(state)

  t.deepEqual(ret, expected)
})

test('should map over non-array', t => {
  const def = {
    id: 'key',
    title: 'headline'
  }
  const state = {
    root: data[0],
    context: data[0],
    value: data[0]
  }
  const expectedValue = { id: 'ent1', title: 'Entry 1' }

  const ret = iterate(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should return undefined when no def', t => {
  const def = {}
  const state = {
    root: data,
    context: data,
    value: data
  }

  const ret = iterate(def)(options)(state)

  t.is(typeof ret.value, 'undefined')
})
