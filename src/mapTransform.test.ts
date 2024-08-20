import test from 'ava'
import { createDataMapper } from './createDataMapper.js'
import type StateNext from './state.js'
import type { Options as OptionsNext } from './prep/index.js'
import type { State, Options, Transformer, AsyncTransformer } from './types.js'

import mapTransform, { mapTransformAsync } from './mapTransform.js'

// Tests -- sync

test('should create mapper', (t) => {
  const def = { id: 'key', title: 'name' }
  const options = {}

  const ret = mapTransform(def, options)

  t.is(typeof ret, 'function')
})

test('should map data with created mapper', (t) => {
  const def = { id: 'key', title: 'name' }
  const value = { key: 'ent1', name: 'Entry 1' }
  const state = {}
  const options = {}
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = mapTransform(def, options)(value, state)

  t.deepEqual(ret, expected)
})

test('should prepare needed pipelines', (t) => {
  const def = { $apply: 'entry' }
  const pipelines = {
    entry: { id: 'key', title: 'name', props: { $apply: 'props' } },
    props: { slug: 'key' },
    user: { id: 'username' },
  }
  const value = { key: 'ent1', name: 'Entry 1' }
  const state = {}
  const options = { pipelines }
  const expected = { id: 'ent1', title: 'Entry 1', props: { slug: 'ent1' } }

  const ret = mapTransform(def, options)(value, state)

  t.deepEqual(ret, expected)
})

test('should not prepare uneeded pipelines', (t) => {
  const def = {
    item: { $apply: 'entry' },
    pipelines: { $transform: 'countPipelines' },
  }
  const pipelines = {
    entry: { id: 'key', title: 'name', props: { $apply: 'props' } },
    props: { slug: 'key' },
    user: { id: 'username' },
  }
  const transformers = {
    countPipelines: () => () => (_value: unknown, state: State) =>
      (state as StateNext).pipelines.size, // We know we get the new State here, but it's not typed that way
  }
  const value = { key: 'ent1', name: 'Entry 1' }
  const state = {}
  const options = { pipelines, transformers }
  const expected = {
    item: { id: 'ent1', title: 'Entry 1', props: { slug: 'ent1' } },
    pipelines: 2,
  }

  const ret = mapTransform(def, options)(value, state)

  t.deepEqual(ret, expected)
})

test('should pass on prepared pipelines to a data mapper in transformer', (t) => {
  const def = { $apply: 'entry' }
  const pipelines = {
    entry: { id: 'key', title: 'name', props: { $transform: 'props' } },
    props: { slug: 'key' },
    user: { id: 'username' },
  }
  const transformers = {
    props: () => (options: Options) =>
      createDataMapper({ $apply: 'props' }, options as OptionsNext),
  }
  const value = { key: 'ent1', name: 'Entry 1' }
  const state = {}
  const options = { pipelines, transformers }
  const expected = { id: 'ent1', title: 'Entry 1', props: { slug: 'ent1' } }

  const ret = mapTransform(def, options)(value, state)

  t.deepEqual(ret, expected)
})

test('should pass on context to a data mapper in transformer', (t) => {
  const def = ['name', { $transform: 'props' }]
  const transformers = {
    props: () => (options: Options) =>
      createDataMapper(['^.key'], options as OptionsNext),
  }
  const value = { key: 'ent1', name: 'Entry 1' }
  const state = {}
  const options = { transformers }
  const expected = 'ent1'

  const ret = mapTransform(def, options)(value, state)

  t.deepEqual(ret, expected)
})

test('should include built-in transformers', (t) => {
  const uppercase: Transformer = () => () => (value) =>
    typeof value === 'string' ? value.toUpperCase() : value
  const def = {
    id: 'key',
    title: 'name',
    isSports: [
      {
        $transform: 'compare',
        path: ['section', { $transform: 'uppercase' }],
        match: 'SPORTS',
      },
    ],
  }
  const value = { key: 'ent1', name: 'Entry 1', section: 'sports' }
  const state = {}
  const options = { transformers: { uppercase } }
  const expected = { id: 'ent1', title: 'Entry 1', isSports: true }

  const ret = mapTransform(def, options)(value, state)

  t.deepEqual(ret, expected)
})

test('should pass on nonvalues to the run function', (t) => {
  const def = { id: 'key', title: 'name' }
  const value = { key: 'ent1', name: '' }
  const state = {}
  const options = { nonvalues: [undefined, ''] }
  const expected = { id: 'ent1' }

  const ret = mapTransform(def, options)(value, state)

  t.deepEqual(ret, expected)
})

// Tests -- async

test('should create async mapper', async (t) => {
  const fn = () => () => async () => 'From async'
  const def = { id: 'key', title: 'name', asyncValue: { $transform: 'async' } }
  const value = { key: 'ent1', name: 'Entry 1' }
  const state = {}
  const options = { transformers: { async: fn } }
  const expected = { id: 'ent1', title: 'Entry 1', asyncValue: 'From async' }

  const ret = await mapTransformAsync(def, options)(value, state)

  t.deepEqual(ret, expected)
})

test('should include built-in transformers async', async (t) => {
  const uppercase: AsyncTransformer = () => () => async (value) =>
    typeof value === 'string' ? value.toUpperCase() : value
  const def = {
    id: 'key',
    title: 'name',
    isSports: [
      {
        $transform: 'compare',
        path: ['section', { $transform: 'uppercase' }], // This path will return a Promise, so we know we have included the async transformers if it succeeds
        match: 'SPORTS',
      },
    ],
  }
  const value = { key: 'ent1', name: 'Entry 1', section: 'sports' }
  const state = {}
  const options = { transformers: { uppercase } }
  const expected = { id: 'ent1', title: 'Entry 1', isSports: true }

  const ret = await mapTransformAsync(def, options)(value, state)

  t.deepEqual(ret, expected)
})
