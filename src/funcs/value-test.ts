import test from 'ava'

import value from './value'

test('should set on value', (t) => {
  const state = {
    root: {},
    context: {},
    value: undefined
  }
  const expected = {
    root: {},
    context: {},
    value: 'Splendid!'
  }

  const ret = value('Splendid!')(state)

  t.deepEqual(ret, expected)
})
