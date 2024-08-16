import test from 'ava'
import type { Options } from './index.js'

import preparePipeline from './index.js'

// Tests

test('should prepare apply step', (t) => {
  const def = { $apply: 'entry' }
  const entryPipeline = { id: 'key', title: 'name' }
  const options = { pipelines: { entry: entryPipeline } }
  const expected = [{ type: 'apply', id: 'entry' }]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should mark pipelines as needed', (t) => {
  const def = [{ $apply: 'entry' }, { $apply: 'comment' }]
  const pipeline = { id: 'key' }
  const options: Options = {
    pipelines: { entry: pipeline, user: pipeline, comment: pipeline },
  }
  const expected = ['entry', 'comment']

  preparePipeline(def, options)

  t.true(options.neededPipelineIds instanceof Set)
  t.deepEqual([...options.neededPipelineIds!.values()], expected)
})

test('should throw when pipeline is not found', (t) => {
  const def = { $apply: 'unknown' }
  const options = { pipelines: {} }

  const error = t.throws(() => preparePipeline(def, options))

  t.true(error instanceof Error)
  t.is(error.message, "Failed to apply pipeline 'unknown'")
})

test('should throw if no id', (t) => {
  const def = { $apply: null }
  const options = { pipelines: {} }

  const error = t.throws(() => preparePipeline(def, options))

  t.true(error instanceof Error)
  t.is(error.message, 'Failed to apply pipeline. No id provided')
})

test('should throw if no pipelines', (t) => {
  const def = { $apply: 'entry' }
  const options = {} // No pipelines

  const error = t.throws(() => preparePipeline(def, options))

  t.true(error instanceof Error)
  t.is(error.message, "Failed to apply pipeline 'entry'. No pipelines")
})
