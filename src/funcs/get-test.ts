import test from 'ava'
import { compose } from 'ramda'

import { get } from './getSet'

// Tests

test('should get from path and set on value', (t) => {
  const data = { meta: { author: 'Someone' } }
  const state = {
    root: data,
    context: data,
    value: data
  }
  const expected = {
    root: data,
    context: data,
    value: 'Someone',
    arr: false
  }

  const ret = get('meta.author')(state)

  t.deepEqual(ret, expected)
})

test('should be composable', (t) => {
  const data = {
    data: {
      items: [{ title: 'First item' }, { title: 'Second item' }]
    }
  }
  const state = {
    root: data,
    context: data,
    value: data
  }
  const expectedValue = 'Second item'

  const ret = compose(get('title'), get('data.items[1]'))(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should set value to undefined when path is missing on value', (t) => {
  const state = {
    root: {},
    context: {},
    value: {}
  }

  const ret = get('unknown.path')(state)

  t.is(ret.value, undefined)
})

test('should set on path when reversed', (t) => {
  const state = {
    root: 'Someone',
    context: 'Someone',
    value: 'Someone',
    rev: true
  }
  const expected = {
    root: 'Someone',
    context: 'Someone',
    value: { meta: { author: 'Someone' } },
    rev: true
  }

  const ret = get('meta.author')(state)

  t.deepEqual(ret, expected)
})
