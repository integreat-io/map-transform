import test from 'ava'
import type { PreppedPipeline } from '../run/index.js'

import preparePipeline from './index.js'

// Setup

const options = {}

// Tests

test('should prepare alt operation', (t) => {
  const def = { $alt: [['title'], 'props.name'] }
  const expected = [
    { type: 'alt' as const, pipelines: [['title'], ['props', 'name']] },
  ]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should pass on $nonvalues as nonvalues', (t) => {
  const def = { $alt: [['title'], 'props.name'], $nonvalues: [undefined, ''] }
  const expected = [
    {
      type: 'alt' as const,
      nonvalues: [undefined, ''],
      pipelines: [['title'], ['props', 'name']],
    },
  ]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should pass on $undefined as nonvalues', (t) => {
  const def = { $alt: [['title'], 'props.name'], $undefined: [undefined, ''] }
  const expected = [
    {
      type: 'alt' as const,
      nonvalues: [undefined, ''],
      pipelines: [['title'], ['props', 'name']],
    },
  ]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should pass on $direction as dir', (t) => {
  const def = { $alt: [['title'], 'props.name'], $direction: 'rev' }
  const expected = [
    {
      type: 'alt' as const,
      dir: -1,
      pipelines: [['title'], ['props', 'name']],
    },
  ]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should pass on useLastAsDefault', (t) => {
  const def = { $alt: [['title'], 'props.name'], useLastAsDefault: true }
  const expected = [
    {
      type: 'alt' as const,
      useLastAsDefault: true,
      pipelines: [['title'], ['props', 'name']],
    },
  ]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should return no step when no pipelines', (t) => {
  const def = { $alt: [] }
  const expected: PreppedPipeline = []

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})
