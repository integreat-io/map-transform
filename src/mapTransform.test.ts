import test from 'node:test'
import assert from 'node:assert/strict'
import { createDataMapper, createDataMapperAsync } from './createDataMapper.js'
import type State from './state.js'
import type { Options } from './prep/index.js'
import type { Transformer, AsyncTransformer } from './typesNext.js'

import mapTransform, {
  mapTransformAsync,
  prepareOptions,
} from './mapTransform.js'

// Tests -- sync

test('should create mapper', () => {
  const def = { id: 'key', title: 'name' }
  const options = {}

  const ret = mapTransform(def, options)

  assert.equal(typeof ret, 'function')
})

test('should create mapper without options', () => {
  const def = { id: 'key', title: 'name' }

  const ret = mapTransform(def)

  assert.equal(typeof ret, 'function')
})

test('should map data with created mapper', () => {
  const def = { id: 'key', title: 'name' }
  const value = { key: 'ent1', name: 'Entry 1' }
  const state = {}
  const options = {}
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = mapTransform(def, options)(value, state)

  assert.deepEqual(ret, expected)
})

test('should prepare needed pipelines', () => {
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

  assert.deepEqual(ret, expected)
})

test('should not prepare uneeded pipelines', () => {
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
      state.pipelines.size,
  }
  const value = { key: 'ent1', name: 'Entry 1' }
  const state = {}
  const options = { pipelines, transformers }
  const expected = {
    item: { id: 'ent1', title: 'Entry 1', props: { slug: 'ent1' } },
    pipelines: 2,
  }

  const ret = mapTransform(def, options)(value, state)

  assert.deepEqual(ret, expected)
})

test('should pass on prepared pipelines to a data mapper in transformer', () => {
  const def = { $apply: 'entry' }
  const pipelines = {
    entry: { id: 'key', title: 'name', props: { $transform: 'props' } },
    props: { slug: 'key' },
    user: { id: 'username' },
  }
  const transformers = {
    props: () => (options: Options) =>
      createDataMapper({ $apply: 'props' }, options),
  }
  const value = { key: 'ent1', name: 'Entry 1' }
  const state = {}
  const options = { pipelines, transformers }
  const expected = { id: 'ent1', title: 'Entry 1', props: { slug: 'ent1' } }

  const ret = mapTransform(def, options)(value, state)

  assert.deepEqual(ret, expected)
})

test('should pass on context to a data mapper in transformer', () => {
  const def = ['name', { $transform: 'props' }]
  const transformers = {
    props: () => (options: Options) => createDataMapper(['^.key'], options),
  }
  const value = { key: 'ent1', name: 'Entry 1' }
  const state = {}
  const options = { transformers }
  const expected = 'ent1'

  const ret = mapTransform(def, options)(value, state)

  assert.deepEqual(ret, expected)
})

test('should include built-in transformers', () => {
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

  assert.deepEqual(ret, expected)
})

test('should pass on nonvalues to the run function', () => {
  const def = { id: 'key', title: { $alt: ['name', 'nickname'] } }
  const value = { key: 'ent1', name: '', nickname: 'jf' }
  const state = {}
  const options = { nonvalues: [undefined, ''] }
  const expected = { id: 'ent1', title: 'jf' }

  const ret = mapTransform(def, options)(value, state)

  assert.deepEqual(ret, expected)
})

test('should prepare pipelines once for several calls with prepared options', () => {
  let prepareCount = 0
  const counted: Transformer = () => () => {
    prepareCount++
    return (value) => value
  }
  const pipelines = { entry: [{ $transform: 'counted' }, { id: 'key' }] }
  const options = prepareOptions({ pipelines, transformers: { counted } })
  const def = { $apply: 'entry' }
  const value = { key: 'ent1' }
  const expected = { id: 'ent1' }

  const mapperA = mapTransform(def, options)
  const mapperB = mapTransform(def, options)

  assert.equal(prepareCount, 1)
  assert.deepEqual(mapperA(value), expected)
  assert.deepEqual(mapperB(value), expected)
})

test('should prepare pipelines again with unprepared options', () => {
  let prepareCount = 0
  const counted: Transformer = () => () => {
    prepareCount++
    return (value) => value
  }
  const pipelines = { entry: [{ $transform: 'counted' }, { id: 'key' }] }
  const options = { pipelines, transformers: { counted } }
  const def = { $apply: 'entry' }
  const value = { key: 'ent1' }
  const expected = { id: 'ent1' }

  const mapperA = mapTransform(def, options)
  const mapperB = mapTransform(def, options)

  assert.equal(prepareCount, 2)
  assert.deepEqual(mapperA(value), expected)
  assert.deepEqual(mapperB(value), expected)
})

test('should not share prepared pipelines between sync and async', async () => {
  let prepareCount = 0
  const counted: Transformer = () => () => {
    prepareCount++
    return (value) => value
  }
  const pipelines = { entry: [{ $transform: 'counted' }, { id: 'key' }] }
  const options = prepareOptions({ pipelines, transformers: { counted } })
  const def = { $apply: 'entry' }
  const value = { key: 'ent1' }
  const expected = { id: 'ent1' }

  const mapperSync = mapTransform(def, options)
  const mapperAsync = mapTransformAsync(def, options)

  assert.equal(prepareCount, 2)
  assert.deepEqual(mapperSync(value), expected)
  assert.deepEqual(await mapperAsync(value), expected)
})

test('should apply pipeline with a transformer that runs map-transform during preparation', () => {
  const templateLike: Transformer = () => (options: Options) => {
    const inner = mapTransform('title', options)
    return (value, state) => inner(value, state)
  }
  const pipelines = { entry: [{ $transform: 'templateLike' }] }
  const options = prepareOptions({ pipelines, transformers: { templateLike } })
  const def = { result: { $apply: 'entry' } }
  const value = { title: 'Entry 1' }
  const expected = { result: 'Entry 1' }

  const ret = mapTransform(def, options)(value)

  assert.deepEqual(ret, expected)
})

test('should apply pipeline with a transformer that applies the pipeline under preparation through createDataMapper', () => {
  const self: Transformer = () => (options: Options) => {
    const mapChild = createDataMapper({ $apply: 'entry' }, options)
    return (value, state) => {
      const { key, child } = value as { key: string; child?: unknown }
      return child ? { id: key, child: mapChild(child, state) } : { id: key }
    }
  }
  const pipelines = { entry: [{ $transform: 'self' }] }
  const options = prepareOptions({ pipelines, transformers: { self } })
  const def = { $apply: 'entry' }
  const value = { key: 'ent1', child: { key: 'ent1.1' } }
  const expected = { id: 'ent1', child: { id: 'ent1.1' } }

  const ret = mapTransform(def, options)(value)

  assert.deepEqual(ret, expected)
})

test('should apply pipeline with a transformer that applies the pipeline under preparation through mapTransform', () => {
  const self: Transformer = () => (options: Options) => {
    const mapChild = mapTransform({ $apply: 'entry' }, options)
    return (value) => {
      const { key, child } = value as { key: string; child?: unknown }
      return child ? { id: key, child: mapChild(child) } : { id: key }
    }
  }
  const pipelines = { entry: [{ $transform: 'self' }] }
  const options = prepareOptions({ pipelines, transformers: { self } })
  const def = { $apply: 'entry' }
  const value = { key: 'ent1', child: { key: 'ent1.1' } }
  const expected = { id: 'ent1', child: { id: 'ent1.1' } }

  const ret = mapTransform(def, options)(value)

  assert.deepEqual(ret, expected)
})

test('should apply pipeline with a transformer that applies the pipeline under preparation through mapTransform with unprepared options', () => {
  const self: Transformer = () => (options: Options) => {
    const mapChild = mapTransform({ $apply: 'entry' }, options)
    return (value) => {
      const { key, child } = value as { key: string; child?: unknown }
      return child ? { id: key, child: mapChild(child) } : { id: key }
    }
  }
  const pipelines = { entry: [{ $transform: 'self' }] }
  const options = { pipelines, transformers: { self } }
  const def = { $apply: 'entry' }
  const value = { key: 'ent1', child: { key: 'ent1.1' } }
  const expected = { id: 'ent1', child: { id: 'ent1.1' } }

  const ret = mapTransform(def, options)(value)

  assert.deepEqual(ret, expected)
})

// Tests -- async

test('should create async mapper', async () => {
  const fn = () => () => async () => 'From async'
  const def = { id: 'key', title: 'name', asyncValue: { $transform: 'async' } }
  const value = { key: 'ent1', name: 'Entry 1' }
  const state = {}
  const options = { transformers: { async: fn } }
  const expected = { id: 'ent1', title: 'Entry 1', asyncValue: 'From async' }

  const ret = await mapTransformAsync(def, options)(value, state)

  assert.deepEqual(ret, expected)
})

test('should create async mapper without options', () => {
  const def = { id: 'key', title: 'name' }

  const ret = mapTransformAsync(def)

  assert.equal(typeof ret, 'function')
})

test('should include built-in transformers async', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should prepare pipelines once for several async calls with prepared options', async () => {
  let prepareCount = 0
  const counted: AsyncTransformer = () => () => {
    prepareCount++
    return async (value) => value
  }
  const pipelines = { entry: [{ $transform: 'counted' }, { id: 'key' }] }
  const options = prepareOptions({ pipelines, transformers: { counted } })
  const def = { $apply: 'entry' }
  const value = { key: 'ent1' }
  const expected = { id: 'ent1' }

  const mapperA = mapTransformAsync(def, options)
  const mapperB = mapTransformAsync(def, options)

  assert.equal(prepareCount, 1)
  assert.deepEqual(await mapperA(value), expected)
  assert.deepEqual(await mapperB(value), expected)
})

test('should apply pipeline with an async transformer that runs map-transform during preparation', async () => {
  const templateLike: AsyncTransformer = () => (options: Options) => {
    const inner = mapTransformAsync('title', options)
    return async (value, state) => inner(value, state)
  }
  const pipelines = { entry: [{ $transform: 'templateLike' }] }
  const options = prepareOptions({ pipelines, transformers: { templateLike } })
  const def = { result: { $apply: 'entry' } }
  const value = { title: 'Entry 1' }
  const expected = { result: 'Entry 1' }

  const ret = await mapTransformAsync(def, options)(value)

  assert.deepEqual(ret, expected)
})

test('should apply pipeline with an async transformer that applies the pipeline under preparation through createDataMapperAsync', async () => {
  const self: AsyncTransformer = () => (options: Options) => {
    const mapChild = createDataMapperAsync({ $apply: 'entry' }, options)
    return async (value, state) => {
      const { key, child } = value as { key: string; child?: unknown }
      return child
        ? { id: key, child: await mapChild(child, state) }
        : { id: key }
    }
  }
  const pipelines = { entry: [{ $transform: 'self' }] }
  const options = prepareOptions({ pipelines, transformers: { self } })
  const def = { $apply: 'entry' }
  const value = { key: 'ent1', child: { key: 'ent1.1' } }
  const expected = { id: 'ent1', child: { id: 'ent1.1' } }

  const ret = await mapTransformAsync(def, options)(value)

  assert.deepEqual(ret, expected)
})

test('should apply pipeline with an async transformer that applies the pipeline under preparation through mapTransformAsync', async () => {
  const self: AsyncTransformer = () => (options: Options) => {
    const mapChild = mapTransformAsync({ $apply: 'entry' }, options)
    return async (value) => {
      const { key, child } = value as { key: string; child?: unknown }
      return child ? { id: key, child: await mapChild(child) } : { id: key }
    }
  }
  const pipelines = { entry: [{ $transform: 'self' }] }
  const options = prepareOptions({ pipelines, transformers: { self } })
  const def = { $apply: 'entry' }
  const value = { key: 'ent1', child: { key: 'ent1.1' } }
  const expected = { id: 'ent1', child: { id: 'ent1.1' } }

  const ret = await mapTransformAsync(def, options)(value)

  assert.deepEqual(ret, expected)
})

test('should prepare the pipeline for both modes when an async run has a transformer calling sync mapTransform', async () => {
  let prepareCount = 0
  const self: Transformer = () => (options: Options) => {
    prepareCount++
    const mapChild = mapTransform({ $apply: 'entry' }, options)
    return (value) => {
      const { key, child } = value as { key: string; child?: unknown }
      return child ? { id: key, child: mapChild(child) } : { id: key }
    }
  }
  const pipelines = { entry: [{ $transform: 'self' }] }
  const options = prepareOptions({ pipelines, transformers: { self } })
  const def = { $apply: 'entry' }
  const value = { key: 'ent1', child: { key: 'ent1.1' } }
  const expected = { id: 'ent1', child: { id: 'ent1.1' } }

  const ret = await mapTransformAsync(def, options)(value)

  assert.equal(prepareCount, 2)
  assert.deepEqual(ret, expected)
})
