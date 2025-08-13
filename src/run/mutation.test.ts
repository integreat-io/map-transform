import test from 'node:test'
import assert from 'node:assert/strict'
import type { PreppedPipeline } from './index.js'
import type { State } from '../types.js'

import runPipeline, { runPipelineAsync } from './index.js'

// Setup

const uppercase = (val: unknown, _state: State) =>
  typeof val === 'string' ? val.toUpperCase() : val

const state = { rev: false }
const stateRev = { rev: true }

// Tests -- sync

test('should run mutation object', () => {
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

  assert.deepEqual(ret, expected)
})

test('should iterate in pipeline', () => {
  const value = {
    key: 'ent1',
    name: 'Entry 1',
    meta: { keywords: ['news', 'latest'], ['user_id']: 'johnf' },
  }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        ['meta', 'keywords', '>id', '>[]', '>topics'],
      ],
    },
  ]
  const expected = {
    id: 'ent1',
    title: 'Entry 1',
    topics: [{ id: 'news' }, { id: 'latest' }],
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should keep the order of the pipelines on the target object', () => {
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
  assert.deepEqual(keys, expected)
})

test('should set undefined value', () => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        ['unknown', '>age'],
      ],
    },
  ]
  const expected = { id: 'ent1', title: 'Entry 1', age: undefined }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should keep the value of a non-value', () => {
  const value = { key: 'ent1', name: 'Entry 1', empty: '' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        ['empty', '>age'],
      ],
    },
  ]
  const state = { nonvalues: [undefined, ''] }
  const expected = { id: 'ent1', title: 'Entry 1', age: '' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should not run mutation object on undefined', () => {
  const value = undefined
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
  ]
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should not run mutation object on a non-value', () => {
  const value = ''
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
  ]
  const state = { nonvalues: [undefined, ''] }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should run mutation object on undefined when always is true', () => {
  const value = undefined
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
      always: true,
    },
  ]
  const expected = { id: undefined, title: undefined }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should run mutation object with sub-mutations', () => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        [{ type: 'mutation', pipelines: [['name', '>title']] }, '>attributes'],
      ],
    },
  ]
  const expected = { id: 'ent1', attributes: { title: 'Entry 1' } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should support parent steps in pipelines', () => {
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

  assert.deepEqual(ret, expected)
})

test('should support parent steps through iteration', () => {
  const value = { items: [{ key: 'ent1', name: 'Entry 1' }], count: 1 }
  const pipeline: PreppedPipeline = [
    'items',
    {
      type: 'mutation',
      it: true,
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        ['^', '^', 'count', '>count'],
      ],
    },
  ]
  const expected = [{ id: 'ent1', title: 'Entry 1', count: 1 }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should run several mutation objects in a pipeline', () => {
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

  assert.deepEqual(ret, expected)
})

test('should support parent step through a previous mutation step', () => {
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

  assert.deepEqual(ret, expected)
})

test('should iterate mutation object', () => {
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

  assert.deepEqual(ret, expected)
})

test('should not mutate non-values when iterating', () => {
  const value = [undefined, { key: 'ent1', name: 'Entry 1' }, '']
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      it: true,
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
      noDefaults: true,
    },
  ]
  const state = { nonvalues: [undefined, ''] }
  const expected = [undefined, { id: 'ent1', title: 'Entry 1' }, undefined]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test.skip('should set pipelines on the given target', () => {
  const value = { key: 'ent1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', { type: 'transform', fn: uppercase }, '>slug'],
        ['>...'], // $modify
      ],
    },
  ]
  const stateWithTarget = { ...state, target: { name: 'Entry 1' } }
  const expected = { key: 'ent1', name: 'Entry 1', slug: 'ENT1' }

  const ret = runPipeline(value, pipeline, stateWithTarget)

  assert.deepEqual(ret, expected)
})

test('should merge mutated object with pipeline value ($modify)', () => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', { type: 'transform', fn: uppercase }, '>slug'],
        ['>...'], // $modify
      ],
    },
  ]
  const expected = { key: 'ent1', name: 'Entry 1', slug: 'ENT1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should modify pipeline value with a pipeline', () => {
  const value = { item: { key: 'ent1', props: { name: 'Entry 1' } } }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['item', 'key', '>id'],
        ['item', 'props', '>...'], // $modify
      ],
    },
  ]
  const expected = { id: 'ent1', name: 'Entry 1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should modify pipeline value with parent step in mod pipeline', () => {
  const value = { item: { key: 'ent1', props: { name: 'Entry 1' } } }
  const pipeline: PreppedPipeline = [
    'item',
    'props',
    {
      type: 'mutation',
      pipelines: [
        ['name', '>title'],
        ['^', '>...'], // $modify
      ],
    },
  ]
  const expected = { key: 'ent1', title: 'Entry 1', props: { name: 'Entry 1' } }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should use modify pipelines on several levels', () => {
  const value = { item: { key: 'ent1', props: { name: 'Entry 1' } } }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['item', 'props', 'name', '>desc'],
        [
          'item',
          'props',
          {
            type: 'mutation',
            pipelines: [['^', 'key', '>slug'], ['>...']], // $modify
          },
          '>props',
        ],
        ['item', '>...'], // $modify
      ],
    },
  ]
  const expected = {
    key: 'ent1',
    desc: 'Entry 1',
    props: { name: 'Entry 1', slug: 'ent1' },
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should merge with flip ($modify)', () => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['slug', { type: 'transform', fn: uppercase }, '>key'],
        ['...'], // Reverse $modify
      ],
    },
  ]
  const stateWithFlip = { state, flip: true }
  const expected = { key: 'ent1', name: 'Entry 1', slug: 'ENT1' }

  const ret = runPipeline(value, pipeline, stateWithFlip)

  assert.deepEqual(ret, expected)
})

test('should skip reverse merge going forward ($modify)', () => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', { type: 'transform', fn: uppercase }, '>slug'],
        ['...'], // Reverse $modify
      ],
    },
  ]
  const expected = { slug: 'ENT1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should not return empty object when noDefaults is true', () => {
  const value = { item: {} }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      noDefaults: true,
      pipelines: [['item', 'key', '>id']],
    },
  ]
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should not include value from value operation when noDefaults is true', () => {
  const value = { item: { key: 'ent1', props: { name: 'Entry 1' } } }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      noDefaults: true,
      pipelines: [
        ['item', 'key', '>id'],
        [{ type: 'value', value: true }, '>archived', '>|'],
        [
          'item',
          'props',
          {
            type: 'mutation',
            pipelines: [
              ['name', '>title'],
              [{ type: 'value', value: 'news' }, '>section', '>|'],
            ],
          },
          '>props',
        ],
      ],
    },
  ]
  const expected = {
    id: 'ent1',
    props: { title: 'Entry 1' },
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should override noDefaults in a sub-mutation', () => {
  const value = { item: { key: 'ent1', props: { name: 'Entry 1' } } }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      noDefaults: true,
      pipelines: [
        ['item', 'key', '>id'],
        [{ type: 'value', value: true }, '>archived', '>|'],
        [
          'item',
          'props',
          {
            type: 'mutation',
            noDefaults: false,
            pipelines: [
              ['name', '>title'],
              [{ type: 'value', value: 'news' }, '>section', '>|'],
            ],
          },
          '>props',
        ],
      ],
    },
  ]
  const expected = {
    id: 'ent1',
    props: { title: 'Entry 1', section: 'news' },
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should run mutation object in reverse', () => {
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

  assert.deepEqual(ret, expected)
})

test('should run mutation object with sub-mutations in reverse', () => {
  const value = { id: 'ent1', attributes: { title: 'Entry 1' } }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        [
          '.', // This is set when prepping, for sub-mutations
          { type: 'mutation', pipelines: [['name', '>title']] },
          '>attributes',
        ],
      ],
    },
  ]
  const expected = { key: 'ent1', name: 'Entry 1' }

  const ret = runPipeline(value, pipeline, stateRev)

  assert.deepEqual(ret, expected)
})

test('should run mutation object as in reverse when flip is true', () => {
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

  assert.deepEqual(ret, expected)
})

test('should pass on flip to sub-mutation', () => {
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

  assert.deepEqual(ret, expected)
})

test('should override flip on sub-mutation', () => {
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

  assert.deepEqual(ret, expected)
})

test('should skip pipeline with forward plug', () => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        ['|', 'desc', '>title'],
      ],
    },
  ]
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should not skip pipeline with forward plug in reverse', () => {
  const value = { id: 'ent1', title: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        ['|', 'desc', '>title'],
      ],
    },
  ]
  const expected = { key: 'ent1', name: 'Entry 1', desc: 'Entry 1' }

  const ret = runPipeline(value, pipeline, stateRev)

  assert.deepEqual(ret, expected)
})

test('should merge in reverse ($modify)', () => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['slug', { type: 'transform', fn: uppercase }, '>key'],
        ['...'], // Reverse $modify
      ],
    },
  ]
  const expected = { key: 'ent1', name: 'Entry 1', slug: 'ENT1' }

  const ret = runPipeline(value, pipeline, stateRev)

  assert.deepEqual(ret, expected)
})

test('should merge with flip in reverse ($modify)', () => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', { type: 'transform', fn: uppercase }, '>slug'],
        ['>...'], // $modify
      ],
    },
  ]
  const stateRevWithFlip = { ...stateRev, flip: true }
  const expected = { key: 'ent1', name: 'Entry 1', slug: 'ENT1' }

  const ret = runPipeline(value, pipeline, stateRevWithFlip)

  assert.deepEqual(ret, expected)
})

test('should skip forward merge in reverse ($modify)', () => {
  const value = { key: 'ent1', name: 'Entry 1', slug: 'ENT1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', { type: 'transform', fn: uppercase }, '>slug'],
        ['>...'], // $modify
      ],
    },
  ]
  const expected = { key: 'ENT1' }

  const ret = runPipeline(value, pipeline, stateRev)

  assert.deepEqual(ret, expected)
})

// Tests -- async

test('should run mutation object asynchronously', async () => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const fn = async () => 'From async'
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        [{ type: 'transform' as const, fn }, '>asyncValue'],
      ],
    },
  ]
  const expected = { id: 'ent1', title: 'Entry 1', asyncValue: 'From async' }

  const ret = await runPipelineAsync(value, pipeline, state)

  assert.deepEqual(ret, expected)
})
