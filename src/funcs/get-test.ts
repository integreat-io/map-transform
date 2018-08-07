import test from 'ava'
import { compose } from 'ramda'

import get from './get'

// Helpers

const object = {
  data: {
    items: [
      { id: 'item1', title: 'First item', tags: ['one', 'odd'], active: true },
      { id: 'item2', title: 'Second item', tags: ['two', 'even'], active: false },
      { id: 'item3', title: 'Third, but not last', tags: ['three', 'odd'] },
      { id: 'item4', title: 'Fourth and last', tags: ['four', 'even'], active: true }
    ]
  },
  meta: {
    author: 'Someone',
    tags: []
  },
  list: [{ id: 'no1' }, { id: 'no2' }, { id: 'no3' }]
}

// Tests

test('should get from path and set on value', (t) => {
  const state = {
    root: object,
    context: object,
    value: object
  }
  const expected = {
    root: object,
    context: object,
    value: 'Someone'
  }

  const ret = get('meta.author')(state)

  t.deepEqual(ret, expected)
})

test('should be composable', (t) => {
  const state = {
    root: object,
    context: object,
    value: object
  }
  const expected = {
    root: object,
    context: object,
    value: 'Second item'
  }

  const ret = compose(get('title'), get('data.items[1]'))(state)

  t.deepEqual(ret, expected)
})

test('should set value to undefined when path is missing on value', (t) => {
  const state = {
    root: object,
    context: object,
    value: object
  }
  const expected = {
    root: object,
    context: object,
    value: undefined
  }

  const ret = get('unknown.path')(state)

  t.deepEqual(ret, expected)
})
