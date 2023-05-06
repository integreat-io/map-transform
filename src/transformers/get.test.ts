import test from 'ava'

import get from './get.js'

// Setup

const data = {
  title: 'Heading 1',
  meta: { user: 'johnf' },
}

const arrayData = ['first', 'second', 'third']

const state = {
  rev: false,
  noDefaults: false,
  context: [],
  value: {},
}

const options = {}

// Test

test('should return value at given path', (t) => {
  const path = 'meta.user'
  const expected = 'johnf'

  const ret = get({ path })(options)(data, state)

  t.is(ret, expected)
})

test('should return pipeline value when no path', (t) => {
  const data = 'johnf'
  const expected = 'johnf'

  const ret = get({})(options)(data, state)

  t.is(ret, expected)
})

test('should return undefined for unknown path', (t) => {
  const path = 'meta.missing'

  const ret = get({ path })(options)(data, state)

  t.is(ret, undefined)
})

test('should return item at given array index', (t) => {
  const path = '[1]'
  const expected = 'second'

  const ret = get({ path })(options)(arrayData, state)

  t.is(ret, expected)
})

test('should return the last item', (t) => {
  const path = '[-1]'

  const ret = get({ path })(options)(arrayData, state)

  t.is(ret, 'third')
})

test('should return undefined when index is too high', (t) => {
  const path = '[3]'

  const ret = get({ path })(options)(arrayData, state)

  t.is(ret, undefined)
})

test('should return undefined when data is not an array', (t) => {
  const path = '[1]'

  const ret = get({ path })(options)(data, state)

  t.is(ret, undefined)
})

test('should support root in path', (t) => {
  const path = '^^meta.user'
  const data = { id: 'ent1', $type: 'entry' }
  const state = {
    context: [{ data: [data], meta: { user: 'maryk' } }, [data]],
    value: data,
    rev: false,
    noDefaults: false,
  }
  const expected = 'maryk'

  const ret = get({ path })(options)(data, state)

  t.is(ret, expected)
})
