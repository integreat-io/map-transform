import test from 'node:test'
import assert from 'node:assert/strict'
import type { Options } from './index.js'

import preparePipeline from './index.js'

// Tests

test('should prepare apply step', () => {
  const def = { $apply: 'entry' }
  const entryPipeline = { id: 'key', title: 'name' }
  const options = {
    pipelines: { entry: entryPipeline },
    preparedPipelines: new Map(),
  }
  const expected = [{ type: 'apply', id: 'entry' }]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare apply step with symbol as id', () => {
  const def = { $apply: Symbol.for('entry') }
  const entryPipeline = { id: 'key', title: 'name' }
  const options = {
    pipelines: { [Symbol.for('entry')]: entryPipeline },
    preparedPipelines: new Map(),
  }
  const expected = [{ type: 'apply', id: Symbol.for('entry') }]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare applied pipelines into the Map', () => {
  const def = [{ $apply: 'entry' }, { $apply: 'comment' }]
  const pipeline = { id: 'key' }
  const preparedPipelines = new Map()
  const options: Options = {
    pipelines: { entry: pipeline, user: pipeline, comment: pipeline },
    preparedPipelines,
  }
  const expectedPipeline = [{ type: 'mutation', pipelines: [['key', '>id']] }]

  preparePipeline(def, options)

  assert.deepEqual([...preparedPipelines.keys()], ['entry', 'comment'])
  assert.deepEqual(preparedPipelines.get('entry'), expectedPipeline)
  assert.deepEqual(preparedPipelines.get('comment'), expectedPipeline)
})

test('should prepare pipelines that apply each other', () => {
  const def = { $apply: 'entry' }
  const preparedPipelines = new Map()
  const options: Options = {
    pipelines: {
      entry: { id: 'key', props: { $apply: 'props' } },
      props: { parent: { $apply: 'entry' } },
    },
    preparedPipelines,
  }

  preparePipeline(def, options)

  assert.deepEqual([...preparedPipelines.keys()], ['entry', 'props'])
  assert.ok(preparedPipelines.get('entry').length > 0)
  assert.ok(preparedPipelines.get('props').length > 0)
})

test('should reuse an already prepared pipeline', () => {
  const def = { $apply: 'entry' }
  const alreadyPrepared = ['key']
  const preparedPipelines = new Map([['entry', alreadyPrepared]])
  const options: Options = {
    pipelines: { entry: 'name' },
    preparedPipelines,
  }

  preparePipeline(def, options)

  assert.equal(preparedPipelines.get('entry'), alreadyPrepared)
})

test('should remove the pipeline from the Map when preparation throws', () => {
  const def = { $apply: 'entry' }
  const preparedPipelines = new Map()
  const options: Options = {
    pipelines: { entry: { $apply: 'unknown' } },
    preparedPipelines,
  }
  const expectedError = new Error(
    "Failed to apply pipeline 'unknown'. Unknown pipeline",
  )

  assert.throws(() => preparePipeline(def, options), expectedError)
  assert.equal(preparedPipelines.has('entry'), false)
})

test('should throw when options have no prepared pipelines Map', () => {
  const def = { $apply: 'entry' }
  const options = { pipelines: { entry: 'name' } }
  const expectedError = new Error(
    "Failed to apply pipeline 'entry'. Options have no prepared pipelines Map",
  )

  assert.throws(() => preparePipeline(def, options), expectedError)
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
