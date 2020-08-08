import test from 'ava'

import not from './not'

// Setup

const returnIt = (value: unknown) => !!value
const context = { rev: false, onlyMappedValues: false }

// Tests

test('should return true for false and vice versa', (t) => {
  t.true(not(returnIt)(false, context))
  t.false(not(returnIt)(true, context))
})
