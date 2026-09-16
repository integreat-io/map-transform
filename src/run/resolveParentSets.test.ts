import test from 'node:test'
import assert from 'node:assert/strict'
import type { PreppedPipeline } from './index.js'

import resolveParentSets from './resolveParentSets.js'

// Tests -- forward

test('should return pipeline untouched when there are no parent set steps', () => {
  const pipeline = ['response', '>value', '>data']
  const expected = [['response', '>value', '>data'], undefined]

  const ret = resolveParentSets(pipeline, false, 0)

  assert.deepEqual(ret, expected)
  assert.equal(ret[0], pipeline)
})

test('should cancel the next set step with a parent set step', () => {
  const pipeline = ['response', '>value', '>^', '>item', '>data']
  const expected = [['response', '>value', '>data'], undefined]

  const ret = resolveParentSets(pipeline, false, 0)

  assert.deepEqual(ret, expected)
})

test('should cancel one set step for each parent set step', () => {
  const pipeline = ['response', '>value', '>^', '>^', '>item', '>data']
  const expected = [['response', '>value'], undefined]

  const ret = resolveParentSets(pipeline, false, 0)

  assert.deepEqual(ret, expected)
})

test('should skip operation steps when cancelling', () => {
  const pipeline: PreppedPipeline = [
    '>value',
    '>^',
    { type: 'mutation', it: true, pipelines: [] },
    '>item',
  ]
  const expected = [
    ['>value', { type: 'mutation', it: true, pipelines: [] }],
    undefined,
  ]

  const ret = resolveParentSets(pipeline, false, 0)

  assert.deepEqual(ret, expected)
})

test('should skip merge and plug steps when cancelling', () => {
  const pipeline = ['>value', '>^', '>.', '>|', '>item']
  const expected = [['>value', '>.', '>|'], undefined]

  const ret = resolveParentSets(pipeline, false, 0)

  assert.deepEqual(ret, expected)
})

test('should cancel array notation as a level', () => {
  const pipeline = ['>count', '>^', '>^', '>item', '>[]', '>data']
  const expected = [['>count', '>data'], undefined]

  const ret = resolveParentSets(pipeline, false, 0)

  assert.deepEqual(ret, expected)
})

test('should give the parent level for a trailing parent set step', () => {
  const pipeline = ['section', '>section', '>^']
  const expected = [['section', '>section'], 1]

  const ret = resolveParentSets(pipeline, false, 2)

  assert.deepEqual(ret, expected)
})

test('should give the level two up for two trailing parent set steps', () => {
  const pipeline = ['section', '>section', '>meta', '>^', '>^']
  const expected = [['section', '>section', '>meta'], 0]

  const ret = resolveParentSets(pipeline, false, 2)

  assert.deepEqual(ret, expected)
})

test('should give -1 when the parent level does not exist', () => {
  const pipeline = ['section', '>section', '>^']
  const expected = [['section', '>section'], -1]

  const ret = resolveParentSets(pipeline, false, 0)

  assert.deepEqual(ret, expected)
})

test('should give level 0 for a root set step and cancel the following set steps', () => {
  const pipeline = ['>value', '>^^', '>item', '>data']
  const expected = [['>value'], 0]

  const ret = resolveParentSets(pipeline, false, 2)

  assert.deepEqual(ret, expected)
})

test('should give level 0 for an original root set step', () => {
  const pipeline = ['>value', '>^^^']
  const expected = [['>value'], 0]

  const ret = resolveParentSets(pipeline, false, 2)

  assert.deepEqual(ret, expected)
})

test('should give undefined level for a root set step when there are no parent levels', () => {
  const pipeline = ['>value', '>^^', '>item']
  const expected = [['>value'], undefined]

  const ret = resolveParentSets(pipeline, false, 0)

  assert.deepEqual(ret, expected)
})

test('should not touch get parent steps', () => {
  const pipeline = ['item', '^', 'count', '>value']
  const expected = [['item', '^', 'count', '>value'], undefined]

  const ret = resolveParentSets(pipeline, false, 0)

  assert.deepEqual(ret, expected)
})

// Tests -- reverse

test('should treat get steps as set steps in reverse', () => {
  const pipeline = ['count', '^', 'item', 'data']
  const expected = [['count', 'data'], undefined]

  const ret = resolveParentSets(pipeline, true, 0)

  assert.deepEqual(ret, expected)
})

test('should give the parent level for trailing parent steps in reverse', () => {
  const pipeline = ['>section', 'section', 'meta', '^', '^']
  const expected = [['>section', 'section', 'meta'], 0]

  const ret = resolveParentSets(pipeline, true, 2)

  assert.deepEqual(ret, expected)
})

test('should not touch set parent steps in reverse', () => {
  const pipeline = ['>value', '>^', '>item', 'data']
  const expected = [['>value', '>^', '>item', 'data'], undefined]

  const ret = resolveParentSets(pipeline, true, 0)

  assert.deepEqual(ret, expected)
})
