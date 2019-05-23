import test from 'ava'
import { Operands } from '../types'

import operation from './operation'

// Setup

const operations = {
  fix: (value: any, { prefix }: Operands) =>
    (typeof value === 'string' && typeof prefix === 'string')
      ? `${prefix}${value}` : value
}

// Tests

test('should perform operation with given operands', (t) => {
  const op = { $op: 'fix', prefix: 'entry-' }
  const state = {
    root: { id: '1' },
    context: { id: '1' },
    value: '1',
    operations
  }
  const expected = {
    root: { id: '1' },
    context: { id: '1' },
    value: 'entry-1',
    operations
  }

  const ret = operation(op)(state)

  t.deepEqual(ret, expected)
})

test('should do nothing when given an unknown operation', (t) => {
  const op = { $op: 'unknown', magic: 'Enhance!' }
  const state = {
    root: { id: '1' },
    context: { id: '1' },
    value: '1',
    operations
  }
  const expected = {
    root: { id: '1' },
    context: { id: '1' },
    value: '1',
    operations
  }

  const ret = operation(op)(state)

  t.deepEqual(ret, expected)
})

test('should do nothing when missing operations object', (t) => {
  const op = { $op: 'fix', prefix: 'entry-' }
  const state = {
    root: { id: '1' },
    context: { id: '1' },
    value: '1'
  }
  const expected = {
    root: { id: '1' },
    context: { id: '1' },
    value: '1'
  }

  const ret = operation(op)(state)

  t.deepEqual(ret, expected)
})
