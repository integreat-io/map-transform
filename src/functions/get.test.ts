import test from 'ava'

import get from './get'

// Setup

const data = {
  title: 'Heading 1',
  meta: { user: 'johnf' },
}

const arrayData = ['first', 'second', 'third']

const context = { rev: false, onlyMappedValues: false }

// Test

test('should return value at given path', (t) => {
  const path = 'meta.user'
  const expected = 'johnf'

  const ret = get({ path })(data, context)

  t.is(ret, expected)
})

test('should use . when no path', (t) => {
  const data = 'johnf'
  const expected = 'johnf'

  const ret = get({})(data, context)

  t.is(ret, expected)
})

test('should return undefined for unknown path', (t) => {
  const path = 'meta.missing'

  const ret = get({ path })(data, context)

  t.is(ret, undefined)
})

test('should return item at given array index', (t) => {
  const path = '[1]'
  const expected = 'second'

  const ret = get({ path })(arrayData, context)

  t.is(ret, expected)
})

test('should return undefined when index is too low', (t) => {
  // Note: Maybe this should return last item instead ...?
  const path = '[-1]'

  const ret = get({ path })(arrayData, context)

  t.is(ret, undefined)
})

test('should return undefined when index is too high', (t) => {
  const path = '[3]'

  const ret = get({ path })(arrayData, context)

  t.is(ret, undefined)
})

test('should return undefined when data is not an array', (t) => {
  const path = '[1]'

  const ret = get({ path })(data, context)

  t.is(ret, undefined)
})

test('should accept path instead of options object', (t) => {
  const path = 'meta.user'
  const expected = 'johnf'

  const ret = get(path)(data, context)

  t.is(ret, expected)
})
