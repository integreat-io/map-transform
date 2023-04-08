import test from 'ava'
import { identity } from '../utils/functional.js'

import root from './root.js'

// Setup

const options = {}

// Tests

test('should apply pipeline to root', (t) => {
  const state = {
    context: [{ content: { title: 'An article' }, section: 'news' }],
    value: { title: 'An article' },
  }
  const expected = {
    context: [{ content: { title: 'An article' }, section: 'news' }],
    value: 'news',
  }

  const ret = root('section')(options)(identity)(state)

  t.deepEqual(ret, expected)
})
