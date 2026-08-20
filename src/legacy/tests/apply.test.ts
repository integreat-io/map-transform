import test from 'node:test'
import assert from 'node:assert/strict'

import mapTransform, {
  transform,
  apply,
  fwd,
  rev,
  filter,
  prepareOptions,
} from '../../index.js'
import type { Operation, Options } from '../types.js'

// Setup

const castEntry = [
  fwd(filter(() => async () => true)),
  rev(transform(() => async (data) => data)),
  {
    $iterate: true,
    id: 'id',
    title: ['title', transform(() => async (value) => String(value))],
    viewCount: ['viewCount', transform(() => async (value) => Number(value))],
  },
  fwd(transform(() => async (data) => data)),
  rev(filter(() => async () => true)),
]

const getItems = 'data.entries'

const entryMutation = [
  'items[]',
  {
    $iterate: true,
    id: 'key',
    title: 'header',
    source: '^^params.source',
    viewCount: 'views',
  },
  { $apply: 'cast_entry' },
]

const hitsOnly = { hits: 'meta.hits' }

const recursive = {
  id: 'key',
  title: 'heading',
  comments: ['children[]', { $apply: 'recursive', $iterate: true }],
}

const pipelineWithRoot = {
  id: 'id',
  type: '^^.settings.type',
}

const pipelines = {
  cast_entry: castEntry,
  getItems,
  [Symbol.for('getItems')]: getItems,
  hitsOnly,
  entry: entryMutation,
  recursive,
  pipelineWithRoot,
}

const options = { pipelines }

// Tests

test('should apply pipeline by id', async () => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits',
    },
    apply('cast_entry'),
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { hits: '45' },
  }
  const expected = {
    id: undefined,
    title: 'The heading',
    viewCount: 45,
  }

  const ret = await mapTransform(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should apply path pipeline by id', async () => {
  const def = [
    apply('getItems'),
    {
      title: 'content.heading',
    },
  ]
  const data = {
    data: {
      entries: {
        content: { heading: 'The heading' },
      },
    },
  }
  const expected = {
    title: 'The heading',
  }

  const ret = await mapTransform(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should apply path pipeline by id as Symbol', async () => {
  const def = [
    apply(Symbol.for('getItems')),
    {
      title: 'content.heading',
    },
  ]
  const data = {
    data: {
      entries: {
        content: { heading: 'The heading' },
      },
    },
  }
  const expected = {
    title: 'The heading',
  }

  const ret = await mapTransform(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should apply pipeline by id in reverse', async () => {
  const def = [
    apply('getItems'),
    {
      title: 'content.heading',
    },
  ]
  const data = {
    title: 'The heading',
  }
  const expected = {
    data: {
      entries: {
        content: { heading: 'The heading' },
      },
    },
  }

  const ret = await mapTransform(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should apply pipeline as operation object', async () => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits',
    },
    { $apply: 'cast_entry' },
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { hits: '45' },
  }
  const expected = {
    id: undefined,
    title: 'The heading',
    viewCount: 45,
  }

  const ret = await mapTransform(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should iterate applied pipeline', async () => {
  const def = [{ $apply: 'hitsOnly', $iterate: true }]
  const data = [
    {
      content: { heading: 'The heading' },
      meta: { hits: '45' },
    },
    {
      content: { heading: 'The next heading' },
      meta: { hits: '111' },
    },
  ]
  const expected = [
    {
      hits: '45',
    },
    {
      hits: '111',
    },
  ]

  const ret = await mapTransform(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should apply pipeline from array path', async () => {
  const def = { data: ['content.data[].createOrMutate', apply('entry')] }
  const data = {
    content: {
      data: [
        {
          createOrMutate: {
            items: [
              {
                key: 'ent1',
                header: 'The heading',
                views: 42,
              },
            ],
          },
        },
      ],
    },
  }
  const expected = {
    data: [
      {
        id: 'ent1',
        title: 'The heading',
        viewCount: 42,
      },
    ],
  }

  const ret = await mapTransform(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should apply pipeline from array path in reverse', async () => {
  const def = {
    data: ['content.data[].createOrMutate', apply('entry')],
  }
  const data = {
    data: [
      {
        id: 'ent1',
        title: 'The heading',
        viewCount: 42,
      },
    ],
  }
  const expected = {
    content: {
      data: [
        {
          createOrMutate: {
            items: [
              {
                key: 'ent1',
                header: 'The heading',
                views: 42,
              },
            ],
          },
        },
      ],
    },
  }

  const ret = await mapTransform(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should apply pipeline as operation object going forward only', async () => {
  const def = [
    { title: 'content.heading', viewCount: 'meta.hits' },
    { $apply: 'cast_entry', $direction: 'fwd' },
  ]
  const dataFwd = { content: { heading: 'The heading' }, meta: { hits: '45' } }
  const expectedFwd = { title: 'The heading', viewCount: 45, id: undefined }
  const dataRev = { title: 'The heading', viewCount: '45' }
  const expectedRev = {
    content: { heading: 'The heading' },
    meta: { hits: '45' },
  }

  const retFwd = await mapTransform(def, options)(dataFwd)
  const retRev = await mapTransform(def, options)(dataRev, { rev: true })

  assert.deepEqual(retFwd, expectedFwd)
  assert.deepEqual(retRev, expectedRev)
})

test('should apply pipeline as operation object going in reverse only', async () => {
  const def = [
    { title: 'content.heading', viewCount: 'meta.hits' },
    { $apply: 'cast_entry', $direction: 'rev' },
  ]
  const dataFwd = { content: { heading: 'The heading' }, meta: { hits: '45' } }
  const expectedFwd = { title: 'The heading', viewCount: '45' }
  const dataRev = { title: 'The heading', viewCount: '45' }
  const expectedRev = {
    content: { heading: 'The heading' },
    meta: { hits: 45 },
  }

  const retFwd = await mapTransform(def, options)(dataFwd)
  const retRev = await mapTransform(def, options)(dataRev, { rev: true })

  assert.deepEqual(retFwd, expectedFwd)
  assert.deepEqual(retRev, expectedRev)
})

test('should use forward alias', async () => {
  const optionsWithAlias = { ...options, fwdAlias: 'from' }
  const def = [
    { title: 'content.heading', viewCount: 'meta.hits' },
    { $apply: 'cast_entry', $direction: 'from' },
  ]
  const dataFwd = { content: { heading: 'The heading' }, meta: { hits: '45' } }
  const expectedFwd = { title: 'The heading', viewCount: 45, id: undefined }
  const dataRev = { title: 'The heading', viewCount: '45' }
  const expectedRev = {
    content: { heading: 'The heading' },
    meta: { hits: '45' },
  }

  const retFwd = await mapTransform(def, optionsWithAlias)(dataFwd)
  const retRev = await mapTransform(def, optionsWithAlias)(dataRev, {
    rev: true,
  })

  assert.deepEqual(retFwd, expectedFwd)
  assert.deepEqual(retRev, expectedRev)
})

test('should use reverse alias', async () => {
  const optionsWithAlias = { ...options, revAlias: 'to' }
  const def = [
    { title: 'content.heading', viewCount: 'meta.hits' },
    { $apply: 'cast_entry', $direction: 'to' },
  ]
  const dataFwd = { content: { heading: 'The heading' }, meta: { hits: '45' } }
  const expectedFwd = { title: 'The heading', viewCount: '45' }
  const dataRev = { title: 'The heading', viewCount: '45' }
  const expectedRev = {
    content: { heading: 'The heading' },
    meta: { hits: 45 },
  }

  const retFwd = await mapTransform(def, optionsWithAlias)(dataFwd)
  const retRev = await mapTransform(def, optionsWithAlias)(dataRev, {
    rev: true,
  })

  assert.deepEqual(retFwd, expectedFwd)
  assert.deepEqual(retRev, expectedRev)
})

test('should apply path pipeline through operaion object with id as Symbol', async () => {
  const def = [
    { $apply: Symbol.for('getItems') },
    {
      title: 'content.heading',
    },
  ]
  const data = {
    data: {
      entries: {
        content: { heading: 'The heading' },
      },
    },
  }
  const expected = {
    title: 'The heading',
  }

  const ret = await mapTransform(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should support root in applied pipeline', async () => {
  const def = {
    $direction: 'from',
    response: [
      'data',
      {
        id: 'key',
        title: 'content.heading',
        settings: { type: { $value: 'wrong' } },
        viewCount: { $value: '183' },
      },
      { $apply: 'cast_entry' },
      {
        $modify: true,
        meta: { $apply: 'pipelineWithRoot' },
      },
    ],
  }
  const data = {
    data: {
      key: 'key1',
      content: { heading: 'The heading' },
    },
    settings: { type: 'other' },
  }
  const expected = {
    response: {
      id: 'key1',
      title: 'The heading',
      viewCount: 183,
      meta: { id: 'key1', type: 'other' },
    },
  }

  const ret = await mapTransform(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should handle pipelines that applies themselves', async () => {
  const def = [{ $apply: 'recursive' }]
  const data = {
    key: 'ent1',
    heading: 'Entry 1',
    children: [
      {
        key: 'ent1.1',
        heading: 'Entry 1.1',
      },
      {
        key: 'ent1.2',
        heading: 'Entry 1.2',
      },
    ],
  }
  const expected = {
    id: 'ent1',
    title: 'Entry 1',
    comments: [
      {
        id: 'ent1.1',
        title: 'Entry 1.1',
        comments: [],
      },
      {
        id: 'ent1.2',
        title: 'Entry 1.2',
        comments: [],
      },
    ],
  }

  const ret = await mapTransform(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should keep unused pipelines available on the pipelines map', async () => {
  const getPipelineIds: Operation = (options) => (next) => async (state) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return { ...(await next(state)), value: Object.keys(options.pipelines!) }
  }
  const def = {
    entries: apply('getItems'),
    pipelines: [getPipelineIds],
  }
  const data = {
    data: {
      entries: [{ id: 'ent1' }],
    },
  }
  const expected = {
    entries: [{ id: 'ent1' }],
    pipelines: [
      'cast_entry',
      'getItems',
      'hitsOnly',
      'entry',
      'recursive',
      'pipelineWithRoot',
    ],
  }

  const ret = await mapTransform(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should throw when applying an unknown pipeline id', () => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits',
    },
    apply('unknown'),
  ]
  const expectedError = new Error(
    "Failed to apply pipeline 'unknown'. Unknown pipeline",
  )

  assert.throws(() => mapTransform(def, options), expectedError)
})

test('should throw when applying an unknown pipeline id as Symbol', () => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits',
    },
    apply(Symbol.for('unknown')),
  ]
  const expectedError = new Error(
    "Failed to apply pipeline 'Symbol(unknown)'. Unknown pipeline",
  )

  assert.throws(() => mapTransform(def, options), expectedError)
})

test('should throw when applying an unknown pipeline as operation object', () => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits',
    },
    { $apply: 'unknown' },
  ]
  const expectedError = new Error(
    "Failed to apply pipeline 'unknown'. Unknown pipeline",
  )

  assert.throws(() => mapTransform(def, options), expectedError)
})

test('should throw when applying an unknown pipeline in a provided pipeline', () => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits',
    },
    { $apply: 'ourPipeline' },
  ]
  const ourPipeline = [{ $apply: 'unknownInPipeline' }]
  const options = { pipelines: { ourPipeline } }
  const expectedError = new Error(
    "Failed to apply pipeline 'unknownInPipeline'. Unknown pipeline",
  )

  assert.throws(() => mapTransform(def, options), expectedError)
})

test('should throw when applying an unknown pipeline inside an operation', () => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits',
    },
    fwd({ $apply: 'unknown' }),
  ]
  const expectedError = new Error(
    "Failed to apply pipeline 'unknown'. Unknown pipeline",
  )

  assert.throws(() => mapTransform(def, options), expectedError)
})

test('should throw when applying an unknown pipeline inside a transform object', () => {
  const def = [
    {
      title: ['content.heading', { $apply: 'unknown' }],
      viewCount: 'meta.hits',
    },
  ]
  const expectedError = new Error(
    "Failed to apply pipeline 'unknown'. Unknown pipeline",
  )

  assert.throws(() => mapTransform(def, options), expectedError)
})

// Tests -- sharing a pipelines object across `mapTransform()` calls
//
// Integreat calls `mapTransform()` many times with the same `pipelines`
// object, so resolved pipelines may be shared across calls for performance.
// Sharing is fine, but it must never let one call's options affect another's,
// and it must never modify the object the caller passed in.

test('should not let transformers from one call leak into another sharing the same pipelines object', async () => {
  const suffixed = (suffix: string) => () => () => async (value: unknown) =>
    `${value}${suffix}`
  const pipelines = { addSuffix: [{ $transform: 'suffix' }] }
  const def = { value: ['value', { $apply: 'addSuffix' }] }

  const mapperA = mapTransform(def, {
    pipelines,
    transformers: { suffix: suffixed('-A') },
  })
  const mapperB = mapTransform(def, {
    pipelines,
    transformers: { suffix: suffixed('-B') },
  })

  assert.deepEqual(await mapperA({ value: 'ent1' }), { value: 'ent1-A' })
  assert.deepEqual(await mapperB({ value: 'ent1' }), { value: 'ent1-B' })
})

test('should not let nonvalues from one call leak into another sharing the same pipelines object', async () => {
  const pipelines = { orDefault: [{ $alt: ['value', { $value: 'fallback' }] }] }
  const def = [{ $apply: 'orDefault' }]

  const mapperA = mapTransform(def, { pipelines }) // Only `undefined` is a nonvalue
  const mapperB = mapTransform(def, { pipelines, nonvalues: [undefined, null] })

  assert.equal(await mapperA({ value: null }), null) // `null` is a value here
  assert.equal(await mapperB({ value: null }), 'fallback') // `null` is a nonvalue here
})

test('should not modify the pipelines object passed by the caller', async () => {
  const addSuffix = [{ $transform: 'suffix' }]
  const unused = ['unused', 'pipeline']
  const pipelines = { addSuffix, unused }
  const options = {
    pipelines,
    transformers: { suffix: () => () => async (value: unknown) => `${value}!` },
  }
  const def = { value: ['value', { $apply: 'addSuffix' }] }

  await mapTransform(def, options)({ value: 'ent1' })

  assert.equal(pipelines.addSuffix, addSuffix) // The applied pipeline is untouched
  assert.equal(pipelines.unused, unused) // The unused pipeline is untouched
  assert.deepEqual(Reflect.ownKeys(pipelines), ['addSuffix', 'unused']) // No pipelines are removed
})

test('should share prepared pipelines when given options from prepareOptions', async () => {
  const pipelines = { addSuffix: [{ $transform: 'suffix' }] }
  const options = prepareOptions({
    pipelines,
    transformers: { suffix: () => () => async (value: unknown) => `${value}!` },
  })
  const defA = { value: ['value', { $apply: 'addSuffix' }] }
  const defB = { title: ['title', { $apply: 'addSuffix' }] }

  const mapperA = mapTransform(defA, options)
  const preparedByA = options.preparedPipelines?.get('addSuffix')
  const mapperB = mapTransform(defB, options)

  assert.deepEqual(await mapperA({ value: 'ent1' }), { value: 'ent1!' })
  assert.deepEqual(await mapperB({ title: 'Entry 1' }), { title: 'Entry 1!' })
  assert.equal(typeof preparedByA, 'function') // The first call prepared the pipeline
  assert.equal(options.preparedPipelines?.get('addSuffix'), preparedByA) // The second call reused it
  assert.equal(pipelines.addSuffix, options.pipelines?.addSuffix) // The pipelines object is untouched
})

test('should not share prepared pipelines when options are not prepared up front', async () => {
  const pipelines = { addSuffix: [{ $transform: 'suffix' }] }
  const options = {
    pipelines,
    transformers: { suffix: () => () => async (value: unknown) => `${value}!` },
  }
  const def = { value: ['value', { $apply: 'addSuffix' }] }

  await mapTransform(def, options)({ value: 'ent1' })

  // The Map is set on the internal options only, so we don't accidentally share it
  assert.equal(
    (options as { preparedPipelines?: unknown }).preparedPipelines,
    undefined,
  )
})

test('should prepare pipeline applied within an $alt with $undefined', async () => {
  const pipelines = { addSuffix: [{ $transform: 'suffix' }] }
  const options = prepareOptions({
    pipelines,
    transformers: { suffix: () => () => async (value: unknown) => `${value}!` },
  })
  const def = {
    value: [
      'value',
      {
        $alt: [{ $apply: 'addSuffix' }, { $value: 'none' }],
        $undefined: [undefined, null],
      },
    ],
  }

  const mapper = mapTransform(def, options)

  // The pipeline is prepared up front, even though it is applied within an `$alt`
  assert.equal(typeof options.preparedPipelines?.get('addSuffix'), 'function')
  assert.deepEqual(await mapper({ value: 'ent1' }), { value: 'ent1!' })
})

test('should prepare pipeline applied within an $alt without $undefined', async () => {
  const pipelines = { addSuffix: [{ $transform: 'suffix' }] }
  const options = prepareOptions({
    pipelines,
    transformers: { suffix: () => () => async (value: unknown) => `${value}!` },
  })
  const def = {
    value: ['value', { $alt: [{ $apply: 'addSuffix' }, { $value: 'none' }] }],
  }

  const mapper = mapTransform(def, options)

  assert.equal(typeof options.preparedPipelines?.get('addSuffix'), 'function')
  assert.deepEqual(await mapper({ value: 'ent1' }), { value: 'ent1!' })
})

test('should not let nonvalues from an $alt leak into a shared prepared pipeline', async () => {
  const pipelines = { orDefault: [{ $alt: ['value', { $value: 'fallback' }] }] }
  const options = prepareOptions({ pipelines }) // Only `undefined` is a nonvalue
  const altDef = {
    out: [
      {
        $alt: [{ $apply: 'orDefault' }, { $value: 'none' }],
        $undefined: [undefined, null],
      },
    ],
  }
  const plainDef = [{ $apply: 'orDefault' }]

  const altMapper = mapTransform(altDef, options)
  await altMapper({ value: null }) // Run before the next mapper is created, to catch any late preparation
  const plainMapper = mapTransform(plainDef, options)

  assert.equal(await plainMapper({ value: null }), null) // `null` is a value here
})

test('should pass options to pipelines registered as Operation functions', async () => {
  const receivedOptions: Options[] = []
  const pipelineAsOperation: Operation =
    (options) => (next) => async (state) => {
      receivedOptions.push(options)
      return next(state)
    }
  const def = { result: { $apply: 'myPipeline' } }
  const data = { value: 'test' }
  const options = {
    pipelines: { myPipeline: pipelineAsOperation },
    transformers: { someTransformer: () => () => async (v: unknown) => v },
  }

  await mapTransform(def, options)(data)

  assert.equal(receivedOptions.length, 1)
  assert.deepEqual(receivedOptions[0].pipelines, options.pipelines)
  assert.equal(
    receivedOptions[0].transformers?.someTransformer,
    options.transformers.someTransformer,
  )
})

test('should apply different pipelines from the same prepared options', async () => {
  const pipelines = {
    addSuffix: [{ $transform: 'suffix' }],
    addPrefix: [{ $transform: 'prefix' }],
  }
  const options = prepareOptions({
    pipelines,
    transformers: {
      suffix: () => () => async (value: unknown) => `${value}!`,
      prefix: () => () => async (value: unknown) => `- ${value}`,
    },
  })
  const defA = { value: ['value', { $apply: 'addSuffix' }] }
  const defB = { title: ['title', { $apply: 'addPrefix' }] }

  const mapperA = mapTransform(defA, options)
  const mapperB = mapTransform(defB, options)

  assert.deepEqual(await mapperA({ value: 'ent1' }), { value: 'ent1!' })
  assert.deepEqual(await mapperB({ title: 'Entry 1' }), { title: '- Entry 1' })
  assert.equal(typeof options.preparedPipelines?.get('addSuffix'), 'function')
  assert.equal(typeof options.preparedPipelines?.get('addPrefix'), 'function')
})
