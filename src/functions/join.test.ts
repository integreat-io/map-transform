import test from 'ava'

import join from './join'

test('should join strings given by paths', (t) => {
  const path = ['firstName', 'lastName']
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = 'John Fjon'

  const ret = join({ path })(data)

  t.is(ret, expected)
})

test('should return the value of only one path', (t) => {
  const path = 'firstName'
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = 'John'

  const ret = join({ path })(data)

  t.is(ret, expected)
})

test('should return empty string when no path', (t) => {
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = ''

  const ret = join({})(data)

  t.is(ret, expected)
})

test('should skip unknown paths', (t) => {
  const path = ['firstName', 'unknown', 'lastName']
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = 'John Fjon'

  const ret = join({ path })(data)

  t.is(ret, expected)
})

test('should use given separator', (t) => {
  const path = ['lastName', 'firstName']
  const sep = ', '
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = 'Fjon, John'

  const ret = join({ path, sep })(data)

  t.is(ret, expected)
})
