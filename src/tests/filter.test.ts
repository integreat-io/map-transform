import test from 'ava'
import { isObject } from '../utils/is.js'
import mapTransform, {
  set,
  filter,
  fwd,
  rev,
  transformers as coreTransformers,
} from '../index.js'
const { compare, not } = coreTransformers

// Setup

const noHeadingTitle = () => () => (item: unknown) =>
  isObject(item) && !/heading/gi.test(item.title as string)

const noAlso = () => (item: unknown) =>
  isObject(item) && !/also/gi.test(item.title as string)

const transformers = {
  noHeadingTitle,
  [Symbol.for('noHeadingTitle')]: noHeadingTitle,
}

// Tests

test('should filter out item', (t) => {
  const def = [
    {
      title: 'content.heading',
    },
    filter(noHeadingTitle()),
  ]
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = undefined

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter out items in array', (t) => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading',
    },
    filter(noHeadingTitle()),
  ]
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Just this' } },
    { content: { heading: 'Another heading' } },
  ]
  const expected = [{ title: 'Just this' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter with several filters', (t) => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading',
    },
    filter(noHeadingTitle()),
    filter(noAlso),
  ]
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Just this' } },
    { content: { heading: 'Another heading' } },
    { content: { heading: 'Also this' } },
  ]
  const expected = [{ title: 'Just this' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set filtered items on path', (t) => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading',
    },
    filter(noHeadingTitle()),
    set('items[]'),
  ]
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Just this' } },
  ]
  const expected = {
    items: [{ title: 'Just this' }],
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter items from parent mapping for reverse mapping', (t) => {
  const def = {
    'items[]': [
      {
        $iterate: true,
        title: 'content.heading',
      },
      filter(noHeadingTitle()),
    ],
  }
  const data = {
    items: [{ title: 'The heading' }, { title: 'Just this' }],
  }
  const expected = [{ content: { heading: 'Just this' } }]

  const ret = mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should filter on reverse mapping', (t) => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading',
    },
    filter(noHeadingTitle()),
    filter(noAlso),
  ]
  const data = [
    { title: 'The heading' },
    { title: 'Just this' },
    { title: 'Another heading' },
    { title: 'Also this' },
  ]
  const expected = [{ content: { heading: 'Just this' } }]

  const ret = mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should use directional filters - going forward', (t) => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading',
    },
    fwd(filter(noAlso)),
    rev(filter(noHeadingTitle())),
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use directional filters - going reverse', (t) => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading',
    },
    fwd(filter(noAlso)),
    rev(filter(noHeadingTitle())),
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

  const ret = mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should filter before mapping', (t) => {
  const def = [
    'content',
    filter(noHeadingTitle()),
    {
      heading: 'title',
    },
  ]
  const data = {
    content: { title: 'The heading' },
  }
  const expected = undefined

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter with filter before mapping on reverse mapping', (t) => {
  const def = [
    'content',
    filter(noHeadingTitle()),
    {
      heading: 'title',
    },
  ]
  const data = {
    heading: 'The heading',
  }
  const expected = { content: undefined }

  const ret = mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should filter with compare helper', (t) => {
  const def = [
    {
      title: 'heading',
      meta: {
        section: 'section',
      },
    },
    filter(compare({ path: 'meta.section', match: 'news' })),
  ]
  const data = { heading: 'The heading', section: 'fashion' }
  const expected = undefined

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter with not and compare helpers', (t) => {
  const def = [
    {
      title: 'heading',
      meta: {
        section: 'section',
      },
    },
    filter(not(compare({ path: 'meta.section', match: 'news' }))),
  ]
  const data = { heading: 'The heading', section: 'fashion' }
  const expected = {
    title: 'The heading',
    meta: { section: 'fashion' },
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should apply filter from operation object', (t) => {
  const def = [
    {
      title: 'content.heading',
    },
    { $filter: 'noHeadingTitle' },
  ]
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = undefined

  const ret = mapTransform(def, { transformers })(data)

  t.deepEqual(ret, expected)
})

test('should apply filter with compare function from operation object', (t) => {
  const def = [
    { title: 'content.heading' },
    {
      $filter: 'compare',
      path: 'title',
      operator: '=',
      match: 'Other heading',
    },
  ]
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = undefined

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should only apply filter from operation object going forward', (t) => {
  const def = [
    { title: 'content.heading' },
    { $filter: 'noHeadingTitle', $direction: 'fwd' },
  ]
  const dataFwd = { content: { heading: 'The heading' } }
  const dataRev = { title: 'The heading' }

  const retFwd = mapTransform(def, { transformers })(dataFwd)
  const retRev = mapTransform(def, { transformers })(dataRev, { rev: true })

  t.is(retFwd, undefined)
  t.deepEqual(retRev, dataFwd)
})

test('should only apply filter from operation object going in reverse', (t) => {
  const def = [
    { title: 'content.heading' },
    { $filter: 'noHeadingTitle', $direction: 'rev' },
  ]
  const dataFwd = { content: { heading: 'The heading' } }
  const dataRev = { title: 'The heading' }

  const retFwd = mapTransform(def, { transformers })(dataFwd)
  const retRev = mapTransform(def, { transformers })(dataRev, { rev: true })

  t.deepEqual(retFwd, dataRev)
  t.is(retRev, undefined)
})

test('should filter after a lookup', (t) => {
  const def = [
    'ids',
    { $lookup: '^^.content', path: 'id' },
    {
      $iterate: true,
      title: 'heading',
    },
    filter(noHeadingTitle()),
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should apply filter from operation object with Symbol id', (t) => {
  const def = [
    {
      title: 'content.heading',
    },
    { $filter: Symbol.for('noHeadingTitle') },
  ]
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = undefined

  const ret = mapTransform(def, { transformers })(data)

  t.deepEqual(ret, expected)
})

test('should throw when filter is given an unknown transformer id', (t) => {
  const def = [{ title: 'content.heading' }, { $filter: 'unknown' }]
  const data = {
    content: { heading: 'The heading' },
  }

  const error = t.throws(() => mapTransform(def, { transformers })(data))

  t.true(error instanceof Error)
  t.is(
    error?.message,
    "Filter operator was given the unknown transformer id 'unknown'"
  )
})

test('should throw when filter is given an unknown transformer id as symbol', (t) => {
  const def = [{ title: 'content.heading' }, { $filter: Symbol.for('unknown') }]
  const data = {
    content: { heading: 'The heading' },
  }

  const error = t.throws(() => mapTransform(def, { transformers })(data))

  t.true(error instanceof Error)
  t.is(
    error?.message,
    "Filter operator was given the unknown transformer id 'Symbol(unknown)'"
  )
})

test('should throw when filter operator is missing a transformer id', (t) => {
  const def = [{ title: 'content.heading' }, { $filter: null }] // Missing transformer id
  const data = {
    content: { heading: 'The heading' },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const error = t.throws(() => mapTransform(def as any, { transformers })(data))

  t.true(error instanceof Error)
  t.is(
    error?.message,
    'Filter operator was given no transformer id or an invalid transformer id'
  )
})
