import test from 'ava'
import mapTransform, { mapTransformAsync } from '../mapTransform.js'

// Tests

test('should run `then` pipeline when transform returns true', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should run `else` pipeline when transform returns false', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should run async condition pipeline ', async (t) => {
  const isFalse = () => () => async () => false
  const def = [
    'content',
    {
      $if: { $transform: 'isFalse' },
      then: { title: 'heading' },
      else: { title: 'title' },
    },
  ]
  const data = {
    content: { heading: 'The heading', title: 'The title', section: 'sports' },
  }
  const options = { transformers: { isFalse } }
  const expected = { title: 'The title' }

  const ret = await mapTransformAsync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should run with set pipeline', (t) => {
  const def = [
    'content.article',
    {
      title: 'content.heading',
      published: 'published',
    },
    { $if: 'published', then: '>articles[]', else: '>drafts[]' },
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return undefined from else pipeline', (t) => {
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

  const ret = mapTransform(def)(data)

  t.is(ret, undefined)
})

test('should run $if deeper in the structure', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should support $and - matching', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should support $and - not matching', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should support $and - matching in reverse', (t) => {
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

  const ret = mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should support $and - not matching in reverse', (t) => {
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

  const ret = mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should support $or - matching', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should support $or - matching with root', (t) => {
  const def = [
    'content',
    {
      $if: {
        $or: [
          { $transform: 'compare', path: 'section', match: 'sports' },
          { $transform: 'compare', path: '^^.acceptAll', match: true },
        ],
      },
      then: { title: 'heading' },
      else: { title: 'title' },
    },
  ]
  const data = {
    acceptAll: true,
    content: {
      heading: 'The heading',
      title: 'The title',
      section: 'news',
      archived: false,
    },
  }
  const expected = { title: 'The heading' }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should support $or - not matching', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should support $not', (t) => {
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
      section: 'news',
      archived: false,
    },
  }
  const expected = { title: 'The title' }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})
