import test from 'ava'
import type { PreppedPipeline } from './index.js'
import type { State } from '../types.js'

import runPipeline from './index.js'

// Setup

const uppercase = (val: unknown, _state: State) =>
  typeof val === 'string' ? val.toUpperCase() : val

const state = { rev: false }
const stateRev = { rev: true }

// Tests

test('should run mutation object', (t) => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
  ]
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should keep the order of the pipelines on the target object', (t) => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        ['key', '>slug'],
      ],
    },
  ]
  const expected = ['id', 'title', 'slug']

  const ret = runPipeline(value, pipeline, state)

  const keys = Object.keys(ret as Record<string, unknown>)
  t.deepEqual(keys, expected)
})

test('should support parent steps in pipelines', (t) => {
  const value = { item: { key: 'ent1', props: { name: 'Entry 1' } } }
  const pipeline: PreppedPipeline = [
    'item',
    'props',
    {
      type: 'mutation',
      pipelines: [
        ['^', 'key', '>id'],
        ['name', '>title'],
      ],
    },
  ]
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should run several mutation objects in a pipeline', (t) => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
    {
      type: 'mutation',
      pipelines: [['title', '>text']],
    },
  ]
  const expected = { text: 'Entry 1' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should support parent step through a previous mutation step', (t) => {
  const value = { props: { key: 'ent1', name: 'Entry 1' }, index: 1 }
  const pipeline: PreppedPipeline = [
    'props',
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
    {
      type: 'mutation',
      pipelines: [
        ['^', 'index', '>id'],
        ['title', '>text'],
      ],
    },
  ]
  const expected = { id: 1, text: 'Entry 1' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should iterate mutation object', (t) => {
  const value = [
    { key: 'ent1', name: 'Entry 1' },
    { key: 'ent2', name: 'Entry 2' },
  ]
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      it: true,
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
  ]
  const expected = [
    { id: 'ent1', title: 'Entry 1' },
    { id: 'ent2', title: 'Entry 2' },
  ]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should modify pipeline value when mod is a pipeline', (t) => {
  const value = { item: { key: 'ent1', props: { name: 'Entry 1' } } }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      mod: ['item', 'props'],
      pipelines: [['item', 'key', '>id']],
    },
  ]
  const expected = { id: 'ent1', name: 'Entry 1' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should modify pipeline value with parent step in mod pipeline', (t) => {
  const value = { item: { key: 'ent1', props: { name: 'Entry 1' } } }
  const pipeline: PreppedPipeline = [
    'item',
    'props',
    {
      type: 'mutation',
      mod: ['^'],
      pipelines: [['name', '>title']],
    },
  ]
  const expected = { key: 'ent1', title: 'Entry 1', props: { name: 'Entry 1' } }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should use modify pipelines on several steps', (t) => {
  const value = { item: { key: 'ent1', props: { name: 'Entry 1' } } }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      mod: ['item'],
      pipelines: [
        ['item', 'props', 'name', '>desc'],
        [
          'item',
          'props',
          { type: 'mutation', mod: [], pipelines: [['^', 'key', '>slug']] },
          '>props',
        ],
      ],
    },
  ]
  const expected = {
    key: 'ent1',
    desc: 'Entry 1',
    props: { name: 'Entry 1', slug: 'ent1' },
  }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should modify pipeline value when mod is an empty pipeline', (t) => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      mod: [],
      pipelines: [['key', { type: 'transform', fn: uppercase }, '>slug']],
    },
  ]
  const expected = { key: 'ent1', name: 'Entry 1', slug: 'ENT1' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should run mutation object in reverse', (t) => {
  const value = { id: 'ent1', title: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
  ]
  const expected = { key: 'ent1', name: 'Entry 1' }

  const ret = runPipeline(value, pipeline, stateRev)

  t.deepEqual(ret, expected)
})

test('should run mutation object as in reverse when flip is true', (t) => {
  const value = { id: 'ent1', title: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      flip: true,
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
  ]
  const expected = { key: 'ent1', name: 'Entry 1' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should pass on flip to sub-mutation', (t) => {
  const value = { id: 'ent1', title: 'Entry 1', props: { archived: true } }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      flip: true,
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        [
          'meta',
          { type: 'mutation', pipelines: [['old', '>archived']] },
          '>props',
        ],
      ],
    },
  ]
  const expected = { key: 'ent1', name: 'Entry 1', meta: { old: true } }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should override flip on sub-mutation', (t) => {
  const value = { id: 'ent1', title: 'Entry 1', props: { archived: true } }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      flip: true,
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        [
          'meta',
          { type: 'mutation', flip: false, pipelines: [['archived', '>old']] },
          '>props',
        ],
      ],
    },
  ]
  const expected = { key: 'ent1', name: 'Entry 1', meta: { old: true } }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test.todo('should not mutate non-values')
test.todo('should not mutate non-values in array')

test.todo(
  'should not include values from value operation when $noDefaults is true',
)
test.todo(
  'should not include values in iterations from value transformer when $noDefaults is true',
)
test.todo('should not override $noDefaults in state when not set')
