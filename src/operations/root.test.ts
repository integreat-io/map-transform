import test from 'ava'
import { noopNext } from '../utils/stateHelpers.js'

import root from './root.js'

// Setup

const options = {}

// Tests

test('should apply pipeline to root', async (t) => {
  const state = {
    context: [{ content: { title: 'An article' }, section: 'news' }],
    value: { title: 'An article' },
  }
  const expected = {
    context: [{ content: { title: 'An article' }, section: 'news' }],
    value: 'news',
  }

  const ret = await root('section')(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})
