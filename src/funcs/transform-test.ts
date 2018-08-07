import test from 'ava'

import transform, { TransformFunction } from './transform'

// Helpers

const upper: TransformFunction = (str) => (typeof str === 'string') ? str.toUpperCase() : str

// Tests

test('should run transform function on value', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1'
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'ENTRY 1'
  }

  const ret = transform(upper)(state)

  t.deepEqual(ret, expected)
})

test('should not touch value run with anything else than a function', (t) => {
  const state = {
    root: {},
    context: {},
    value: 'Entry 1'
  }

  const ret = transform('wrong' as any)(state)

  t.deepEqual(ret, state)
})
