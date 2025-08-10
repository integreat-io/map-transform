import test from 'node:test'
import assert from 'node:assert/strict'
import { noopNext } from '../utils/stateHelpers.js'

import root from './root.js'

// Setup

const options = {}

// Tests

test('should apply pipeline to root', async () => {
  const state = {
    context: [{ content: { title: 'An article' }, section: 'news' }],
    value: { title: 'An article' },
  }
  const expected = {
    context: [{ content: { title: 'An article' }, section: 'news' }],
    value: 'news',
  }

  const ret = await root('section')(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})
