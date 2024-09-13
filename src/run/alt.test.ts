import test from 'ava'

import runPipeline, { runPipelineAsync, PreppedPipeline } from './index.js'

// Setup

const state = { rev: false }
const stateRev = { rev: true }

// Tests -- sync

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

test('should return value from last pipeline even when it returns a non-value', (t) => {
  const value = { id: 'ent1', title: '' }
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      pipelines: [['name'], ['title']],
    },
  ]
  const state = { nonvalues: [undefined, ''] }
  const expected = ''

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

test('should support parent in pipeline', (t) => {
  const value = { id: 'ent1', name: 'Parent name', props: { title: 'Entry 1' } }
  const pipeline: PreppedPipeline = [
    'props',
    {
      type: 'alt',
      pipelines: [['^', 'name'], ['title']],
    },
  ]
  const state = {
    context: [{ item: { id: 'ent1', props: { title: 'Entry 1' } } }],
  }
  const expected = 'Parent name'

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should support parent in iterating pipeline', (t) => {
  const value = {
    id: 'ent1',
    name: 'Parent name',
    props: [{ title: 'Entry 1' }, { title: 'Entry 2' }],
  }
  const pipeline: PreppedPipeline = [
    'props',
    {
      type: 'mutation',
      it: true,
      pipelines: [
        [
          {
            type: 'alt',
            pipelines: [['^', '^', 'name'], ['title']],
          },
        ],
      ],
    },
  ]
  const state = {
    context: [{ item: { id: 'ent1', props: { title: 'Entry 1' } } }],
  }
  const expected = ['Parent name', 'Parent name']

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

test('should get a default value from the last pipeline', (t) => {
  const value = undefined
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
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

test('should not get a default value from the last pipeline', (t) => {
  const value = undefined
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
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

test('should skip pipelines with wrong direction when getting default value', (t) => {
  const value = undefined
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      pipelines: [
        ['name'],
        ['title'],
        [{ type: 'value', value: 'Default name' }],
        [{ type: 'value', value: 'Wrong name', dir: 1 }], // Only run when going forward
      ],
    },
  ]
  const expected = { name: 'Default name' }

  const ret = runPipeline(value, pipeline, stateRev)

  t.deepEqual(ret, expected)
})

// TODO: Change the behavior here? We are only continuing how we did it in the old version, but it is odd.
test('should skip not provide special case when no default pipeline in reverse', (t) => {
  const value = undefined
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      pipelines: [['name'], ['title']],
    },
  ]
  const expected = { name: { title: undefined } } // This is probably not what we wanted, but it is how the $alt operation has been working so far

  const ret = runPipeline(value, pipeline, stateRev)

  t.deepEqual(ret, expected)
})

test('should not run alt step in rev when dir is 1 (fwd)', (t) => {
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

// Tests -- async

test('should use value from async pipelines', async (t) => {
  const fn1 = async () => undefined
  const fn2 = async () => 'From async'
  const value = { id: 'ent1', title: 'Entry 1' } // No `name` property, so first pipeline will return undefined
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      pipelines: [
        [{ type: 'transform' as const, fn: fn1 }],
        [{ type: 'transform' as const, fn: fn2 }],
      ],
    },
  ]
  const expected = 'From async'

  const ret = await runPipelineAsync(value, pipeline, state)

  t.is(ret, expected)
})

test('should set a default value with async pipelines', async (t) => {
  const fn = async () => 'From async'
  const value = undefined
  const pipeline: PreppedPipeline = [
    {
      type: 'alt',
      pipelines: [['name'], ['title'], [{ type: 'value', value: fn }]],
    },
  ]
  const expected = { name: 'From async' }

  const ret = await runPipelineAsync(value, pipeline, stateRev)

  t.deepEqual(ret, expected)
})
