import test from 'ava'

import runPipeline, { PreppedPipeline } from './index.js'

// Setup

const state = { rev: false }
const stateRev = { rev: true }

// Tests

test('should use value from first pipeline', (t) => {
  const value = { id: 'ent1', title: 'Entry 1', name: 'The real name' }
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      pipelines: [['name'], ['title']],
    },
  ]
  const expected = 'The real name'

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

test('should use value from second pipeline when first returns undefined', (t) => {
  const value = { id: 'ent1', title: 'Entry 1' } // No `name` property, so first pipeline will return undefined
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      pipelines: [['name'], ['title']],
    },
  ]
  const expected = 'Entry 1'

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

test('should return undefined when no pipelines returns a value', (t) => {
  const value = { id: 'ent1' } // No `title` or `name`
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      pipelines: [['name'], ['title']],
    },
  ]
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

test('should use value from an empty pipeline', (t) => {
  const value = { id: 'ent1', title: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      pipelines: [[], ['title']],
    },
  ]
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should not use value from a plugged pipeline', (t) => {
  const value = { id: 'ent1', title: 'Entry 1', name: 'Not used' }
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      pipelines: [['|', 'name'], ['title']],
    },
  ]
  const expected = 'Entry 1'

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should use alt operation in an iteration', (t) => {
  const value = [
    { id: 'ent1', title: 'Entry 1' },
    { id: 'ent2', title: 'Entry 2', name: 'The second' },
  ]
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      it: true,
      pipelines: [['name'], ['title']],
    },
  ]
  const expected = ['Entry 1', 'The second']

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should apply alt operation to an array when not iterating', (t) => {
  const value = [undefined, 'The second']
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      // No it
      pipelines: [['[0]'], ['[1]']],
    },
  ]
  const expected = 'The second'

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should use value from second pipeline when first returns non-value', (t) => {
  const value = { id: 'ent1', title: 'Entry 1', name: '' }
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      pipelines: [['name'], ['title']],
    },
  ]
  const state = { nonvalues: [undefined, ''] }
  const expected = 'Entry 1'

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

test('should use non-values provided on the operation', (t) => {
  const value = { id: 'ent1', title: 'Entry 1', name: '' }
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      nonvalues: [undefined, ''],
      pipelines: [['name'], ['title']],
    },
  ]
  const state = {} // nonvalues are not specified here
  const expected = 'Entry 1'

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

test('should use context from the "winning" pipeline', (t) => {
  const value = { id: 'ent1', props: { title: 'Entry 1' } }
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      pipelines: [['name'], ['props', 'title']],
    },
    '^', // Lets us see what's in the context
  ]
  const state = {
    context: [{ item: { id: 'ent1', props: { title: 'Entry 1' } } }],
  }
  const expected = { title: 'Entry 1' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should not let "loosing" pipelines polute the context', (t) => {
  const value = { id: 'ent1', props: {}, title: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      pipelines: [['name'], ['props', 'title'], ['title']],
    },
    '^', // Lets us see what's in the context
    '^', // We do it twice to reveal if the 'props.title' context is there
  ]
  const state = {
    context: [{ item: { id: 'ent1', props: { title: 'Entry 1' } } }],
  }
  const expected = { item: { id: 'ent1', props: { title: 'Entry 1' } } }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should use first pipeline when setting', (t) => {
  const value = 'The real name'
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      pipelines: [['name'], ['title']],
    },
  ]
  const expected = { name: 'The real name' }

  const ret = runPipeline(value, pipeline, stateRev)

  t.deepEqual(ret, expected)
})

test('should not try the other pipelines when setting', (t) => {
  const value = undefined
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      pipelines: [
        ['name'],
        [
          {
            type: 'transform',
            fn: () => 'Should not be used',
          },
        ],
        ['title'],
      ],
    },
  ]
  const expected = undefined

  const ret = runPipeline(value, pipeline, stateRev)

  t.is(ret, expected)
})

test('should get a default value from the last pipeline when useLastAsDefault is true', (t) => {
  const value = undefined
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      useLastAsDefault: true,
      pipelines: [
        ['name'],
        ['title'],
        [{ type: 'value', value: 'Default name' }],
      ],
    },
  ]
  const expected = { name: 'Default name' }

  const ret = runPipeline(value, pipeline, stateRev)

  t.deepEqual(ret, expected)
})

test('should not get a default value from the last pipeline when useLastAsDefault is not true', (t) => {
  const value = undefined
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      // No useLastAsDefault
      pipelines: [
        ['name'],
        ['title'],
        [{ type: 'value', value: 'Default name' }],
      ],
    },
  ]
  const expected = undefined

  const ret = runPipeline(value, pipeline, stateRev)

  t.is(ret, expected)
})

test('should not run alt step in rev', (t) => {
  const value = 'The real name'
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      dir: 1, // Only run when going forward
      pipelines: [['name'], ['title']],
    },
  ]
  const expected = 'The real name' // The pipeline value should be untouched

  const ret = runPipeline(value, pipeline, stateRev)

  t.is(ret, expected)
})
