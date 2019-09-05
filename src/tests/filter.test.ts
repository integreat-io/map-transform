import test from 'ava'
import { ObjectWithProps } from '../types'

import {
  mapTransform,
  set,
  filter,
  fwd,
  rev,
  validate,
  not,
  Data,
  functions as fns
} from '..'
const { compare } = fns

// Setup

const isObject = (item: Data): item is ObjectWithProps =>
  !!item && typeof item === 'object'

const noHeadingTitle = () => (item: Data) =>
  isObject(item) && !/heading/gi.test(item.title as string)

const noAlso = (item: Data) =>
  isObject(item) && !/also/gi.test(item.title as string)

const functions = {
  noHeadingTitle
}

// Tests

test('should filter out item', t => {
  const def = [
    {
      title: 'content.heading'
    },
    filter(noHeadingTitle())
  ]
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = undefined

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter out items in array', t => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading'
    },
    filter(noHeadingTitle())
  ]
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Just this' } },
    { content: { heading: 'Another heading' } }
  ]
  const expected = [{ title: 'Just this' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter with several filters', t => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading'
    },
    filter(noHeadingTitle()),
    filter(noAlso)
  ]
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Just this' } },
    { content: { heading: 'Another heading' } },
    { content: { heading: 'Also this' } }
  ]
  const expected = [{ title: 'Just this' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set filtered items on path', t => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading'
    },
    filter(noHeadingTitle()),
    set('items[]')
  ]
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Just this' } }
  ]
  const expected = {
    items: [{ title: 'Just this' }]
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter items from parent mapping for reverse mapping', t => {
  const def = {
    'items[]': [
      {
        $iterate: true,
        title: 'content.heading'
      },
      filter(noHeadingTitle())
    ]
  }
  const data = {
    items: [{ title: 'The heading' }, { title: 'Just this' }]
  }
  const expected = [{ content: { heading: 'Just this' } }]

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should filter on reverse mapping', t => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading'
    },
    filter(noHeadingTitle()),
    filter(noAlso)
  ]
  const data = [
    { title: 'The heading' },
    { title: 'Just this' },
    { title: 'Another heading' },
    { title: 'Also this' }
  ]
  const expected = [{ content: { heading: 'Just this' } }]

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should use directional filters - going forward', t => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading'
    },
    fwd(filter(noAlso)),
    rev(filter(noHeadingTitle()))
  ]
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Just this' } },
    { content: { heading: 'Another heading' } },
    { content: { heading: 'Also this' } }
  ]
  const expected = [
    { title: 'The heading' },
    { title: 'Just this' },
    { title: 'Another heading' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use directional filters - going reverse', t => {
  const def = [
    {
      $iterate: true,
      title: 'content.heading'
    },
    fwd(filter(noAlso)),
    rev(filter(noHeadingTitle()))
  ]
  const data = [
    { title: 'The heading' },
    { title: 'Just this' },
    { title: 'Another heading' },
    { title: 'Also this' }
  ]
  const expected = [
    { content: { heading: 'Just this' } },
    { content: { heading: 'Also this' } }
  ]

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should filter before mapping', t => {
  const def = [
    'content',
    filter(noHeadingTitle()),
    {
      heading: 'title'
    }
  ]
  const data = {
    content: { title: 'The heading' }
  }
  const expected = undefined

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter with filter before mapping on reverse mapping', t => {
  const def = [
    'content',
    filter(noHeadingTitle()),
    {
      heading: 'title'
    }
  ]
  const data = {
    heading: 'The heading'
  }
  const expected = { content: undefined }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should filter with compare helper', t => {
  const def = [
    {
      title: 'heading',
      meta: {
        section: 'section'
      }
    },
    filter(compare({ path: 'meta.section', match: 'news' }))
  ]
  const data = { heading: 'The heading', section: 'fashion' }
  const expected = undefined

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter with not and compare helpers', t => {
  const def = [
    {
      title: 'heading',
      meta: {
        section: 'section'
      }
    },
    filter(not(compare({ path: 'meta.section', match: 'news' })))
  ]
  const data = { heading: 'The heading', section: 'fashion' }
  const expected = {
    title: 'The heading',
    meta: { section: 'fashion' }
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter with validate', t => {
  const def = [
    'content',
    filter(validate('draft', { const: false })),
    {
      $iterate: true,
      title: 'heading'
    }
  ]
  const data = [
    { content: { heading: 'The heading', draft: true } },
    { content: { heading: 'Just this', draft: false } },
    { content: { heading: 'Another heading' } }
  ]
  const expected = [{ title: 'Just this' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should apply filter from operation object', t => {
  const def = [
    {
      title: 'content.heading'
    },
    { $filter: 'noHeadingTitle' }
  ]
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = undefined

  const ret = mapTransform(def, { functions })(data)

  t.deepEqual(ret, expected)
})

test('should apply filter with compare function from operation object', t => {
  const def = [
    { title: 'content.heading' },
    { $filter: 'compare', path: 'title', operator: '=', match: 'Other heading' }
  ]
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = undefined

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should skip filter when unknown function', t => {
  const def = [{ title: 'content.heading' }, { $filter: 'unknown' }]
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = { title: 'The heading' }

  const ret = mapTransform(def, { functions })(data)

  t.deepEqual(ret, expected)
})

test('should only apply filter from operation object going forward', t => {
  const def = [
    { title: 'content.heading' },
    { $filter: 'noHeadingTitle', $direction: 'fwd' }
  ]
  const dataFwd = { content: { heading: 'The heading' } }
  const dataRev = { title: 'The heading' }

  const retFwd = mapTransform(def, { functions })(dataFwd)
  const retRev = mapTransform(def, { functions }).rev(dataRev)

  t.is(retFwd, undefined)
  t.deepEqual(retRev, dataFwd)
})

test('should only apply filter from operation object going in reverse', t => {
  const def = [
    { title: 'content.heading' },
    { $filter: 'noHeadingTitle', $direction: 'rev' }
  ]
  const dataFwd = { content: { heading: 'The heading' } }
  const dataRev = { title: 'The heading' }

  const retFwd = mapTransform(def, { functions })(dataFwd)
  const retRev = mapTransform(def, { functions }).rev(dataRev)

  t.deepEqual(retFwd, dataRev)
  t.is(retRev, undefined)
})
