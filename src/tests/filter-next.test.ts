import test from 'ava'
import { isObject } from '../utils/is.js'
import { mapTransformSync, mapTransformAsync } from '../index.js'

// Setup

const noHeadingTitle = () => () => (value: unknown) =>
  isObject(value) && !/heading/gi.test(value.title as string)
const noHeadingTitleAsync = () => () => async (value: unknown) =>
  isObject(value) && !/heading/gi.test(value.title as string)

const noAlso = () => () => (value: unknown) =>
  isObject(value) && !/also/gi.test(value.title as string)

const options = {
  transformers: {
    noAlso,
    noHeadingTitle,
    noHeadingTitleAsync,
    [Symbol.for('noHeadingTitle')]: noHeadingTitle,
  },
}

// Tests

test('should filter out item', (t) => {
  const def = [{ title: 'content.heading' }, { $filter: 'noHeadingTitle' }]
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = undefined

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should filter out item with async transform function', async (t) => {
  const def = [{ title: 'content.heading' }, { $filter: 'noHeadingTitleAsync' }]
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = undefined

  const ret = await mapTransformAsync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should filter out items in array', (t) => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading',
    },
    { $filter: 'noHeadingTitle' },
  ]
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Just this' } },
    { content: { heading: 'Another heading' } },
  ]
  const expected = [{ title: 'Just this' }]

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should filter with several filters', (t) => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading',
    },
    { $filter: 'noHeadingTitle' },
    { $filter: 'noAlso' },
  ]
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Just this' } },
    { content: { heading: 'Another heading' } },
    { content: { heading: 'Also this' } },
  ]
  const expected = [{ title: 'Just this' }]

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should set filtered items on path', (t) => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading',
    },
    { $filter: 'noHeadingTitle' },
    '>items[]',
  ]
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Just this' } },
  ]
  const expected = {
    items: [{ title: 'Just this' }],
  }

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should filter items from parent mapping for reverse mapping', (t) => {
  const def = {
    'items[]': [
      {
        $iterate: true,
        title: 'content.heading',
      },
      { $filter: 'noHeadingTitle' },
      ,
    ],
  }
  const data = {
    items: [{ title: 'The heading' }, { title: 'Just this' }],
  }
  const expected = [{ content: { heading: 'Just this' } }]

  const ret = mapTransformSync(def, options)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should filter on reverse mapping', (t) => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading',
    },
    { $filter: 'noHeadingTitle' },
    { $filter: 'noAlso' },
  ]
  const data = [
    { title: 'The heading' },
    { title: 'Just this' },
    { title: 'Another heading' },
    { title: 'Also this' },
  ]
  const expected = [{ content: { heading: 'Just this' } }]

  const ret = mapTransformSync(def, options)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should use directional filters - going forward', (t) => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading',
    },
    { $filter: 'noAlso', $direction: 'fwd' },
    { $filter: 'noHeadingTitle', $direction: 'rev' },
  ]
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Just this' } },
    { content: { heading: 'Another heading' } },
    { content: { heading: 'Also this' } },
  ]
  const expected = [
    { title: 'The heading' },
    { title: 'Just this' },
    { title: 'Another heading' },
  ]

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should use directional filters - going reverse', (t) => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading',
    },
    { $filter: 'noAlso', $direction: 'fwd' },
    { $filter: 'noHeadingTitle', $direction: 'rev' },
  ]
  const data = [
    { title: 'The heading' },
    { title: 'Just this' },
    { title: 'Another heading' },
    { title: 'Also this' },
  ]
  const expected = [
    { content: { heading: 'Just this' } },
    { content: { heading: 'Also this' } },
  ]

  const ret = mapTransformSync(def, options)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should filter before mapping', (t) => {
  const def = ['content', { $filter: 'noHeadingTitle' }, { heading: 'title' }]
  const data = { content: { title: 'The heading' } }
  const expected = undefined

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should filter with filter before mapping on reverse mapping', (t) => {
  const def = ['content', { $filter: 'noHeadingTitle' }, { heading: 'title' }]
  const data = { heading: 'The heading' }
  const expected = { content: undefined }

  const ret = mapTransformSync(def, options)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should filter with compare transformer', (t) => {
  const def = [
    {
      title: 'heading',
      meta: { section: 'section' },
    },
    { $filter: 'compare', path: 'meta.section', match: 'news' },
  ]
  const data = { heading: 'The heading', section: 'fashion' }
  const expected = undefined

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should filter after a lookup', (t) => {
  const def = [
    'ids',
    { $lookup: '^^.content', path: 'id' },
    {
      $iterate: true,
      title: 'heading',
    },
    { $filter: 'noHeadingTitle' },
  ]
  const data = {
    ids: ['ent1', 'ent2'],
    content: [
      { id: 'ent1', heading: 'The heading' },
      { id: 'ent2', heading: 'Just this' },
      { id: 'ent3', heading: 'Another heading' },
      { id: 'ent3', heading: 'And not this' },
    ],
  }
  const expected = [{ title: 'Just this' }]

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should apply filter from operation object with Symbol id', (t) => {
  const def = [
    { title: 'content.heading' },
    { $filter: Symbol.for('noHeadingTitle') },
  ]
  const data = { content: { heading: 'The heading' } }
  const expected = undefined

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should throw when filter is given an unknown transformer id', (t) => {
  const def = [{ title: 'content.heading' }, { $filter: 'unknown' }]
  const data = {
    content: { heading: 'The heading' },
  }

  const error = t.throws(() => mapTransformSync(def, options)(data))

  t.true(error instanceof Error)
  t.is(
    error?.message,
    "Transformer 'unknown' was not found for filter operation",
  )
})

test('should throw when filter is given an unknown transformer id as symbol', (t) => {
  const def = [{ title: 'content.heading' }, { $filter: Symbol.for('unknown') }]
  const data = {
    content: { heading: 'The heading' },
  }

  const error = t.throws(() => mapTransformSync(def, options)(data))

  t.true(error instanceof Error)
  t.is(
    error?.message,
    "Transformer 'Symbol(unknown)' was not found for filter operation",
  )
})

test('should throw when filter operator is missing a transformer id', (t) => {
  const def = [{ title: 'content.heading' }, { $filter: null }] // Missing transformer id
  const data = {
    content: { heading: 'The heading' },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const error = t.throws(() => mapTransformSync(def as any, options)(data))

  t.true(error instanceof Error)
  t.is(error?.message, 'Filter operation is missing transformer id')
})
