import test from 'node:test'
import assert from 'node:assert/strict'
import type { Options } from './index.js'

import preparePipeline from './index.js'

// Tests

test('should prepare apply step', () => {
  const def = { $apply: 'entry' }
  const entryPipeline = { id: 'key', title: 'name' }
  const options = { pipelines: { entry: entryPipeline } }
  const expected = [{ type: 'apply', id: 'entry' }]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare apply step with symbol as id', () => {
  const def = { $apply: Symbol.for('entry') }
  const entryPipeline = { id: 'key', title: 'name' }
  const options = { pipelines: { [Symbol.for('entry')]: entryPipeline } }
  const expected = [{ type: 'apply', id: Symbol.for('entry') }]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should mark pipelines as needed', () => {
  const def = [{ $apply: 'entry' }, { $apply: 'comment' }]
  const pipeline = { id: 'key' }
  const options: Options = {
    pipelines: { entry: pipeline, user: pipeline, comment: pipeline },
  }
  const expected = ['entry', 'comment']

  preparePipeline(def, options)

  assert.ok(options.neededPipelineIds instanceof Set)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  assert.deepEqual([...options.neededPipelineIds!.values()], expected)
})

test('should throw when pipeline is not found', () => {
  const def = { $apply: 'unknown' }
  const options = { pipelines: {} }
  const expectedError = new Error(
    "Failed to apply pipeline 'unknown'. Unknown pipeline",
  )

  assert.throws(() => preparePipeline(def, options), expectedError)
})

test('should throw when no id', () => {
  const def = { $apply: null }
  const options = { pipelines: {} }
  const expectedError = new Error('Failed to apply pipeline. No id provided')

  assert.throws(() => preparePipeline(def, options), expectedError)
})

test('should throw when no valid id', () => {
  const def = { $apply: { id: 'what?' } }
  const options = { pipelines: {} }
  const expectedError = new Error(
    'Failed to apply pipeline. Id is not string or symbol',
  )

  assert.throws(() => preparePipeline(def, options), expectedError)
})

test('should throw when no pipelines', () => {
  const def = { $apply: 'entry' }
  const options = {} // No pipelines
  const expectedError = new Error(
    "Failed to apply pipeline 'entry'. No pipelines",
  )

  assert.throws(() => preparePipeline(def, options), expectedError)
})
