import test from 'node:test'
import assert from 'node:assert/strict'

import preparePipeline from './index.js'

// Setup

const stringFn = () => () => String

const options = {
  transformers: {
    string: stringFn,
  },
}

// Tests

test('should prepare array operation', () => {
  const def = {
    $array: [
      ['title', { $transform: 'string' }],
      'props.name',
      { $value: 'Third' },
    ],
  }
  const expected = [
    {
      type: 'array' as const,
      pipelines: [
        ['title', { type: 'transform', fn: String }],
        ['props', 'name'],
        [{ type: 'value', value: 'Third', fixed: false }],
      ],
    },
  ]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should return step when no pipelines', () => {
  const def = {
    $array: [],
  }
  const expected = [
    {
      type: 'array' as const,
      pipelines: [],
    },
  ]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should pass on $direction as dir', () => {
  const def = { $array: [['title'], 'props.name'], $direction: 'rev' }
  const expected = [
    {
      type: 'array' as const,
      dir: -1,
      pipelines: [['title'], ['props', 'name']],
    },
  ]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should pass on $iterate as it', () => {
  const def = { $array: [['title'], 'props.name'], $iterate: true }
  const expected = [
    {
      type: 'array' as const,
      it: true,
      pipelines: [['title'], ['props', 'name']],
    },
  ]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should pass on $flip as flip', () => {
  const def = { $array: [['title'], 'props.name'], $flip: true }
  const expected = [
    {
      type: 'array' as const,
      flip: true,
      pipelines: [['title'], ['props', 'name']],
    },
  ]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should throw when $array is not an array', () => {
  const def = { $array: 'title' }
  const expectedError = new Error(
    'Array operation was given a value that is not an array of pipelines',
  )

  assert.throws(() => preparePipeline(def, options), expectedError)
})
