import test from 'ava'
import * as sinon from 'sinon'

import transform, { TransformFunction } from './transform'

// Helpers

const upper: TransformFunction = (str) => (typeof str === 'string') ? str.toUpperCase() : str
const lower: TransformFunction = (str) => (typeof str === 'string') ? str.toLowerCase() : str

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

test('should run transform in reverse', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: true
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'ENTRY 1',
    rev: true
  }

  const ret = transform(upper)(state)

  t.deepEqual(ret, expected)
})

test('should run dedicated transform in reverse', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: true
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'entry 1',
    rev: true
  }

  const ret = transform(upper, lower)(state)

  t.deepEqual(ret, expected)
})

test('should not mind reverse transform going forward', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: false
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'ENTRY 1',
    rev: false
  }

  const ret = transform(upper, lower)(state)

  t.deepEqual(ret, expected)
})

test('should pass rev and onlyMapped to transform function', (t) => {
  const fn = sinon.stub().returnsArg(0)
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: false,
    onlyMapped: true
  }
  const expected = {
    rev: false,
    onlyMappedValues: true
  }

  transform(fn)(state)

  t.deepEqual(fn.args[0][1], expected)
})

test('should pass rev and onlyMapped to rev transform function', (t) => {
  const fn = sinon.stub().returnsArg(0)
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: true,
    onlyMapped: false
  }
  const expected = {
    rev: true,
    onlyMappedValues: false
  }

  transform(upper, fn)(state)

  t.deepEqual(fn.args[0][1], expected)
})
