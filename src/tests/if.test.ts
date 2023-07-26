import test from 'ava'
import { isObject } from '../utils/is.js'
import mapTransform, { set, ifelse } from '../index.js'

// Tests

test('should map with ifelse', async (t) => {
  const isPublished = async (data: unknown) =>
    isObject(data) && !!data.published
  const def = [
    'content.article',
    {
      title: 'content.heading',
      published: 'published',
    },
    ifelse(isPublished, set('articles[]'), set('drafts[]')),
  ]
  const data = {
    content: {
      article: {
        content: { heading: 'Heading 1' },
        published: false,
      },
    },
  }
  const expected = { drafts: [{ title: 'Heading 1', published: false }] }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should run `then` pipeline when transform returns true', async (t) => {
  const def = [
    'content',
    {
      $if: { $transform: 'compare', path: 'section', match: 'news' },
      then: { title: 'heading' },
      else: { title: 'title' },
    },
  ]
  const data = {
    content: { heading: 'The heading', title: 'The title', section: 'news' },
  }
  const expected = { title: 'The heading' }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should run `else` pipeline when transform returns false', async (t) => {
  const def = [
    'content',
    {
      $if: { $transform: 'compare', path: 'section', match: 'news' },
      then: { title: 'heading' },
      else: { title: 'title' },
    },
  ]
  const data = {
    content: { heading: 'The heading', title: 'The title', section: 'sports' },
  }
  const expected = { title: 'The title' }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return undefined from else pipeline', async (t) => {
  const def = [
    'content',
    {
      $if: { $transform: 'compare', path: 'section', match: 'news' },
      then: { title: 'heading' },
      else: { $value: undefined },
    },
  ]
  const data = {
    content: { heading: 'The heading', title: 'The title', section: 'sports' },
  }

  const ret = await mapTransform(def)(data)

  t.is(ret, undefined)
})

test('should run $if deeper in the structure', async (t) => {
  const def = [
    'content',
    {
      'articles[]': {
        title: {
          $if: { $transform: 'compare', path: 'section', match: 'news' },
          then: 'heading',
          else: 'title',
        },
      },
    },
  ]
  const data = {
    content: { heading: 'The heading', title: 'The title', section: 'news' },
  }
  const expected = { articles: [{ title: 'The heading' }] }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should support $and - matching', async (t) => {
  const def = [
    'content',
    {
      $if: {
        $and: [
          { $transform: 'compare', path: 'section', match: 'news' },
          { $transform: 'compare', path: 'archived', match: false },
        ],
      },
      then: { title: 'heading' },
      else: { title: 'title' },
    },
  ]
  const data = {
    content: {
      heading: 'The heading',
      title: 'The title',
      section: 'news',
      archived: false,
    },
  }
  const expected = { title: 'The heading' }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should support $and - not matching', async (t) => {
  const def = [
    'content',
    {
      $if: {
        $and: [
          { $transform: 'compare', path: 'section', match: 'news' },
          { $transform: 'compare', path: 'archived', match: true },
        ],
      },
      then: { title: 'heading' },
      else: { title: 'title' },
    },
  ]
  const data = {
    content: {
      heading: 'The heading',
      title: 'The title',
      section: 'news',
      archived: false,
    },
  }
  const expected = { title: 'The title' }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should support $and - matching in reverse', async (t) => {
  const def = [
    'content',
    {
      $if: {
        $and: [
          { $transform: 'compare', path: 'section', match: 'news' },
          { $transform: 'compare', path: 'archived', match: false },
        ],
      },
      then: { heading: 'heading' },
      else: { heading: 'title' },
    },
  ]
  const data = {
    title: 'The title',
    heading: 'The heading',
    section: 'news',
    archived: false,
  }
  const expected = {
    content: {
      heading: 'The heading',
    },
  }

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should support $and - not matching in reverse', async (t) => {
  const def = [
    'content',
    {
      $if: {
        $and: [
          { $transform: 'compare', path: 'section', match: 'news' },
          { $transform: 'compare', path: 'archived', match: true },
        ],
      },
      then: { heading: 'heading' },
      else: { heading: 'title' },
    },
  ]
  const data = {
    title: 'The title',
    heading: 'The heading',
    section: 'news',
    archived: false,
  }
  const expected = {
    content: {
      title: 'The heading',
    },
  }

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should support $or - matching', async (t) => {
  const def = [
    'content',
    {
      $if: {
        $or: [
          { $transform: 'compare', path: 'section', match: 'news' },
          { $transform: 'compare', path: 'archived', match: true },
        ],
      },
      then: { title: 'heading' },
      else: { title: 'title' },
    },
  ]
  const data = {
    content: {
      heading: 'The heading',
      title: 'The title',
      section: 'news',
      archived: false,
    },
  }
  const expected = { title: 'The heading' }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should support $or - not matching', async (t) => {
  const def = [
    'content',
    {
      $if: {
        $or: [
          { $transform: 'compare', path: 'section', match: 'news' },
          { $transform: 'compare', path: 'archived', match: true },
        ],
      },
      then: { title: 'heading' },
      else: { title: 'title' },
    },
  ]
  const data = {
    content: {
      heading: 'The heading',
      title: 'The title',
      section: 'sports',
      archived: false,
    },
  }
  const expected = { title: 'The title' }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should support $not', async (t) => {
  const def = [
    'content',
    {
      $if: {
        $not: { $transform: 'compare', path: 'section', match: 'news' },
      },
      then: { title: 'heading' },
      else: { title: 'title' },
    },
  ]
  const data = {
    content: {
      heading: 'The heading',
      title: 'The title',
      section: 'sports',
      archived: false,
    },
  }
  const expected = { title: 'The heading' }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})
