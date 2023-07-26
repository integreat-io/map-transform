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

test('should return value at given path', async (t) => {
  const path = 'meta.user'
  const expected = 'johnf'

  const ret = await get({ path })(options)(data, state)

  t.is(ret, expected)
})

test('should return pipeline value when no path', async (t) => {
  const data = 'johnf'
  const expected = 'johnf'

  const ret = await get({})(options)(data, state)

  t.is(ret, expected)
})

test('should return undefined for unknown path', async (t) => {
  const path = 'meta.missing'

  const ret = await get({ path })(options)(data, state)

  t.is(ret, undefined)
})

test('should return item at given array index', async (t) => {
  const path = '[1]'
  const expected = 'second'

  const ret = await get({ path })(options)(arrayData, state)

  t.is(ret, expected)
})

test('should return the last item', async (t) => {
  const path = '[-1]'

  const ret = await get({ path })(options)(arrayData, state)

  t.is(ret, 'third')
})

test('should return undefined when index is too high', async (t) => {
  const path = '[3]'

  const ret = await get({ path })(options)(arrayData, state)

  t.is(ret, undefined)
})

test('should return undefined when data is not an array', async (t) => {
  const path = '[1]'

  const ret = await get({ path })(options)(data, state)

  t.is(ret, undefined)
})

test('should support root in path', async (t) => {
  const path = '^^meta.user'
  const data = { id: 'ent1', $type: 'entry' }
  const state = {
    context: [{ data: [data], meta: { user: 'maryk' } }, [data]],
    value: data,
    rev: false,
    noDefaults: false,
  }
  const expected = 'maryk'

  const ret = await get({ path })(options)(data, state)

  t.is(ret, expected)
})
