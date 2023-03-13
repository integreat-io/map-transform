import test from 'ava'
import { isObject } from '../utils/is.js'
import mapTransform, {
  set,
  filter,
  fwd,
  rev,
  validate,
  not,
  transformers as coreTransformers,
} from '../index.js'
const { compare } = coreTransformers

// Setup

const noHeadingTitle = () => (item: unknown) =>
  isObject(item) && !/heading/gi.test(item.title as string)

const noAlso = (item: unknown) =>
  isObject(item) && !/also/gi.test(item.title as string)

const transformers = {
  noHeadingTitle,
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

  const ret = mapTransform(def).rev(data)

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

  const ret = mapTransform(def).rev(data)

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

  const ret = mapTransform(def).rev(data)

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

  const ret = mapTransform(def).rev(data)

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

test('should filter with validate', (t) => {
  const def = [
    'content',
    filter(validate({ path: 'draft', schema: { const: false } })),
    {
      $iterate: true,
      title: 'heading',
    },
  ]
  const data = [
    { content: { heading: 'The heading', draft: true } },
    { content: { heading: 'Just this', draft: false } },
    { content: { heading: 'Another heading' } },
  ]
  const expected = [{ title: 'Just this' }]

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

test('should skip filter when unknown function', (t) => {
  const def = [{ title: 'content.heading' }, { $filter: 'unknown' }]
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = { title: 'The heading' }

  const ret = mapTransform(def, { transformers })(data)

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
  const retRev = mapTransform(def, { transformers }).rev(dataRev)

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
  const retRev = mapTransform(def, { transformers }).rev(dataRev)

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
