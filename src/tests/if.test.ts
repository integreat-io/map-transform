import test from 'ava'
import { isObject } from '../utils/is'
import { mapTransform, set, ifelse } from '..'

// Tests

test('should map with ifelse', (t) => {
  const isPublished = (data: unknown) => isObject(data) && !!data.published
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should run `then` pipeline when filter returns true', (t) => {
  const def = [
    'content',
    {
      $if: { $filter: 'compare', path: 'section', match: 'news' },
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

test('should run `else` pipeline when filter returns false', (t) => {
  const def = [
    'content',
    {
      $if: { $filter: 'compare', path: 'section', match: 'news' },
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

test('should run $if deeper in the structure', (t) => {
  const def = [
    'content',
    {
      'articles[]': {
        title: {
          $if: { $filter: 'compare', path: 'section', match: 'news' },
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
