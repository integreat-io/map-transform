import test from 'ava'

import root from './root'

// Setup

const options = {}

// Tests

test('should apply pipeline to root', (t) => {
  const state = {
    root: { content: { title: 'An article' }, section: 'news' },
    context: { title: 'An article' },
    value: { title: 'An article' },
    arr: false,
  }
  const expected = {
    root: { content: { title: 'An article' }, section: 'news' },
    context: { title: 'An article' },
    value: 'news',
    arr: false,
  }

  const ret = root('section')(options)(state)

  t.deepEqual(ret, expected)
})
