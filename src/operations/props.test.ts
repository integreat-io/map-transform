import test from 'ava'
import value from './value'
import { get, set } from './getSet'
import transform from './transform'
import { identity } from '../utils/functional'

import props from './props'

// Setup

const data = [
  { headline: 'Entry 1', user: 'johnf' },
  { headline: 'Entry 2', user: 'lucyk' },
]

const stateWithObject = {
  context: [{ data, params: { source: 'news1' } }, data],
  value: data[0],
}

const stateWithArray = {
  context: [{ data }],
  value: data,
}

const threeLetters = (value: unknown) =>
  typeof value === 'string' ? value.slice(0, 3) : value

const options = {}

// Tests -- forward

test('should mutate shallow object with map functions', (t) => {
  const def = {
    id: value('ent1'),
    title: 'headline',
    text: value('The text'),
    source: '^^params.source',
    age: 'unknown',
  }
  const expected = {
    context: [{ data, params: { source: 'news1' } }, data],
    value: {
      id: 'ent1',
      title: 'Entry 1',
      text: 'The text',
      source: 'news1',
      age: undefined,
    },
  }

  const ret = props(def)(options)(identity)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should mutate object with depth', (t) => {
  const def = {
    item: {
      id: value('ent1'),
      attributes: {
        title: get('headline'),
        text: value('The text'),
        age: get('unknown'),
      },
      relationships: {
        author: get('user'),
        'source.id': '^^params.source',
      },
    },
  }
  const expectedValue = {
    item: {
      id: 'ent1',
      attributes: {
        title: 'Entry 1',
        text: 'The text',
        age: undefined,
      },
      relationships: {
        author: 'johnf',
        source: { id: 'news1' },
      },
    },
  }

  const ret = props(def)(options)(identity)(stateWithObject)

  t.deepEqual(ret.value, expectedValue)
})

test('should support always put root in context', (t) => {
  const def = {
    attributes: {
      title: 'content.heading',
      section: '^^meta.section',
    },
  }
  const stateWithObject = {
    context: [],
    value: {
      content: { heading: 'The heading', copy: 'A long text' },
      meta: { section: 'news' },
    },
  }
  const expectedValue = {
    attributes: {
      title: 'The heading',
      section: 'news',
    },
  }

  const ret = props(def)(options)(identity)(stateWithObject)

  t.deepEqual(ret.value, expectedValue)
})

test('should mutate object with map pipe', (t) => {
  const def = {
    item: {
      attributes: {
        title: ['data', 'headline'],
      },
    },
  }
  const state = {
    context: [{}],
    value: { data: { headline: 'The title' } },
  }
  const expectedValue = {
    item: {
      attributes: {
        title: 'The title',
      },
    },
  }

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should mutate object with props in the given order', (t) => {
  const def = {
    item: {
      id: value('ent1'),
      attributes: {
        title: get('headline'),
        text: value('The text'),
        age: get('unknown'),
      },
      relationships: {
        author: get('user'),
      },
    },
  }
  const expectedPropsItem = ['id', 'attributes', 'relationships']
  const expectedPropsAttrs = ['title', 'text', 'age']
  const expectedPropsRels = ['author']

  const ret = props(def)(options)(identity)(stateWithObject)

  const item = (
    ret.value as Record<string, Record<string, Record<string, unknown>>>
  ).item
  t.deepEqual(Object.keys(item), expectedPropsItem)
  t.deepEqual(Object.keys(item.attributes), expectedPropsAttrs)
  t.deepEqual(Object.keys(item.relationships), expectedPropsRels)
})

test('should skip slashed properties going forward', (t) => {
  const def = {
    title: 'headline',
    'title/1': 'headlineAgain',
    'title/2': 'alsoHeadline',
  }
  const expected = {
    context: [{ data, params: { source: 'news1' } }, data],
    value: {
      title: 'Entry 1',
    },
  }

  const ret = props(def)(options)(identity)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should mutate with set in pipeline', (t) => {
  const def = {
    id: value('ent1'),
    meta: ['user', set('user')],
  }
  const expected = {
    context: [{ data, params: { source: 'news1' } }, data],
    value: {
      id: 'ent1',
      meta: { user: 'johnf' },
    },
  }

  const ret = props(def)(options)(identity)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should shallow merge original object and transformed object', (t) => {
  const def = {
    $modify: true,
    id: value('ent1'),
    title: get('headline'),
    headline: '^^params.source',
  }
  const expected = {
    context: [{ data, params: { source: 'news1' } }, data],
    value: {
      id: 'ent1',
      title: 'Entry 1',
      headline: 'news1',
      user: 'johnf',
    },
  }

  const ret = props(def)(options)(identity)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should shallow merge a path from original object and transformed object', (t) => {
  const def = {
    $modify: 'response',
    data: 'response.data.items',
  }
  const state = {
    context: [],
    value: { type: 'GET', response: { status: 'ok', data: { items: [] } } },
  }
  const expected = {
    context: [],
    value: {
      status: 'ok',
      data: [],
    },
  }

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should shallow merge in sub object and use $modify path', (t) => {
  const state = {
    context: [{ data, params: { source: 'news1' } }],
    value: { data: { article: data[0], tags: ['news', 'sports'] } },
  }
  const def = {
    content: {
      $modify: 'data',
      article: {
        id: value('ent1'),
        title: get('data.article.headline'),
        headline: '^^params.source',
      },
      user: 'data.article.user',
    },
  }
  const expected = {
    context: [{ data, params: { source: 'news1' } }],
    value: {
      content: {
        article: {
          id: 'ent1',
          title: 'Entry 1',
          headline: 'news1',
        },
        user: 'johnf',
        tags: ['news', 'sports'],
      },
    },
  }

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should modify on several levels', (t) => {
  const def = {
    $modify: '.',
    payload: {
      $modify: 'payload',
      data: 'payload.data.items[]',
    },
    meta: {
      $modify: 'meta',
      options: {
        $modify: 'meta.options',
        'Content-Type': value('application/json'),
      },
    },
  }
  const state = {
    context: [],
    value: {
      type: 'DELETE',
      payload: {
        data: { items: [{ id: 'ent1', $type: 'entry' }] },
        service: 'entries',
      },
      meta: {
        ident: { id: 'johnf' },
        options: {
          uri: 'http://api1.test/database/bulk_delete',
        },
      },
    },
  }
  const expectedValue = {
    type: 'DELETE',
    payload: {
      data: [{ id: 'ent1', $type: 'entry' }],
      service: 'entries',
    },
    meta: {
      ident: { id: 'johnf' },
      options: {
        uri: 'http://api1.test/database/bulk_delete',
        'Content-Type': 'application/json',
      },
    },
  }

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should iterate when $iterate is true', (t) => {
  const def = {
    $iterate: true,
    title: get('headline'),
  }
  const expectedValue = [{ title: 'Entry 1' }, { title: 'Entry 2' }]

  const ret = props(def)(options)(identity)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should not iterate when $iterate is false', (t) => {
  const def = {
    $iterate: false,
    title: get('headline'),
  }
  const expectedValue = {
    title: ['Entry 1', 'Entry 2'],
  }

  const ret = props(def)(options)(identity)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should honor $iterate on sub objects', (t) => {
  const def = {
    articles: {
      $iterate: true,
      title: get('headline'),
    },
  }
  const expectedValue = {
    articles: [{ title: 'Entry 1' }, { title: 'Entry 2' }],
  }

  const ret = props(def)(options)(identity)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should iterate sub objects on brackets notation paths', (t) => {
  const def = {
    'articles[]': {
      title: get('headline'),
    },
  }
  const expectedValue = {
    articles: [{ title: 'Entry 1' }, { title: 'Entry 2' }],
  }

  const ret = props(def)(options)(identity)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should map missing array to empty array', (t) => {
  const stateWithArray = {
    context: [],
    value: {},
  }
  const def = {
    'articles[]': [
      'articles[]',
      {
        title: get('headline'),
      },
    ],
  }
  const expectedValue = {
    articles: [],
  }

  const ret = props(def)(options)(identity)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should iterate pipelines on brackets notation paths', (t) => {
  const def = {
    'articles[]': ['headline'],
  }
  const expectedValue = {
    articles: ['Entry 1', 'Entry 2'],
  }

  const ret = props(def)(options)(identity)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test.failing(
  'should not iterate sub pipeline on brackets notation paths',
  (t) => {
    const def = {
      'articles[]': [
        {
          title: get('headline'),
        },
      ],
    }
    const expectedValue = {
      articles: [{ title: ['Entry 1', 'Entry 2'] }],
    }

    const ret = props(def)(options)(identity)(stateWithArray)

    t.deepEqual(ret.value, expectedValue)
  }
)

test('should flip and mutate object', (t) => {
  const def = {
    $flip: true,
    entry: {
      // id: value('ent1'), // TODO: How to use value in reverse?
      headline: ['item.attributes.title', transform(threeLetters)],
      unknown: 'item.attributes.age',
      user: 'item.relationships.author',
    },
  }
  const stateWithObject = {
    context: [],
    value: { entry: data[0] },
  }
  const expectedValue = {
    item: {
      // id: 'ent1',
      attributes: {
        title: 'Ent',
        age: undefined,
      },
      relationships: {
        author: 'johnf',
      },
    },
  }

  const ret = props(def)(options)(identity)(stateWithObject)

  t.deepEqual(ret.value, expectedValue)
})

test('should flip and mutate object in reverse', (t) => {
  const def = {
    $flip: true,
    item: {
      id: value('ent1'),
      attributes: {
        title: ['headline', transform(threeLetters)],
        age: ['unknown'],
      },
      relationships: {
        author: 'user',
      },
    },
  }
  const expectedValue = {
    item: {
      id: 'ent1',
      attributes: {
        title: 'Ent',
        age: undefined,
      },
      relationships: {
        author: 'johnf',
      },
    },
  }

  const ret = props(def)(options)(identity)({ ...stateWithObject, rev: true })

  t.deepEqual(ret.value, expectedValue)
})

test('should map complex shape', (t) => {
  const def = {
    item: {
      id: value('ent1'),
      attributes: {
        title: ['headline', transform(threeLetters)],
        age: ['unknown'],
      },
      relationships: {
        author: 'user',
      },
    },
  }
  const expectedValue = {
    item: {
      id: 'ent1',
      attributes: {
        title: 'Ent',
        age: undefined,
      },
      relationships: {
        author: 'johnf',
      },
    },
  }

  const ret = props(def)(options)(identity)({ ...stateWithObject })

  t.deepEqual(ret.value, expectedValue)
})

test('should skip unknown dollar props', (t) => {
  const def = {
    title: 'headline',
    text: value('The text'),
    $unknown: 'user',
  }
  const expected = {
    context: [{ data, params: { source: 'news1' } }, data],
    value: {
      title: 'Entry 1',
      text: 'The text',
    },
  }

  const ret = props(def)(options)(identity)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should skip props without a pipeline', (t) => {
  const def = {
    title: 'headline',
    text: value('The text'),
    nothing: undefined,
  }
  const expected = {
    context: [{ data, params: { source: 'news1' } }, data],
    value: {
      title: 'Entry 1',
      text: 'The text',
    },
  }

  const ret = props(def)(options)(identity)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should not mutate undefined value', (t) => {
  const def = {
    id: value('ent1'),
    title: get('headline'),
  }
  const state = {
    context: [{ data }],
    value: undefined,
  }
  const expected = state

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not mutate null value when included in noneValues', (t) => {
  const optionsWithNullAsNone = { ...options, noneValues: [undefined, null] }
  const def = {
    id: value('ent1'),
    title: get('headline'),
  }
  const state = {
    context: [{ data }],
    value: null,
  }
  const expected = state

  const ret = props(def)(optionsWithNullAsNone)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not mutate undefined value in array', (t) => {
  const def = {
    $iterate: true,
    id: value('ent1'),
    title: get('headline'),
  }
  const state = {
    context: [{ data }, data],
    value: [undefined],
  }
  const expected = state

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not mutate null value in array when included in noneValues', (t) => {
  const optionsWithNullAsNone = { ...options, noneValues: [undefined, null] }
  const def = {
    $iterate: true,
    id: value('ent1'),
    title: get('headline'),
  }
  const state = {
    context: [{ data }, data],
    value: [null],
  }
  const expected = state

  const ret = props(def)(optionsWithNullAsNone)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set value to undefined when no map functions', (t) => {
  const def = {}
  const state = {
    context: [{ data: { headline: 'The title' } }],
    value: { headline: 'The title' },
  }
  const expected = {
    context: [{ data: { headline: 'The title' } }],
    value: undefined,
  }

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

// Tests -- reverse

test('should reverse map', (t) => {
  const def = {
    content: {
      title: 'headline',
    },
  }
  const state = {
    context: [{ params: { source: 'news1' } }],
    value: {
      content: {
        title: 'The title',
      },
    },
    rev: true,
  }
  const expectedValue = { headline: 'The title' }

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should reverse map with sub objects', (t) => {
  const def = {
    $iterate: true,
    attributes: {
      title: 'content.heading',
    },
    relationships: {
      'topics[].id': 'meta.keywords',
      'author.id': 'meta.user_id',
    },
  }
  const data = {
    attributes: { title: 'Heading 1' },
    relationships: {
      topics: [{ id: 'news' }, { id: 'latest' }],
      author: { id: 'johnf' },
    },
  }
  const state = {
    context: [],
    value: data,
    rev: true,
  }
  const expectedValue = {
    content: { heading: 'Heading 1' },
    meta: { keywords: ['news', 'latest'], ['user_id']: 'johnf' },
  }

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should reverse map with sub objects flipped', (t) => {
  const def = {
    $iterate: true,
    $flip: true,
    content: {
      heading: 'attributes.title',
    },
    meta: {
      keywords: 'relationships.topics[].id',
      user_id: 'relationships.author.id',
    },
  }
  const data = {
    attributes: { title: 'Heading 1' },
    relationships: {
      topics: [{ id: 'news' }, { id: 'latest' }],
      author: { id: 'johnf' },
    },
  }
  const state = {
    context: [],
    value: data,
    rev: true,
  }
  const expectedValue = {
    content: { heading: 'Heading 1' },
    meta: { keywords: ['news', 'latest'], ['user_id']: 'johnf' },
  }

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should set slashed properties in reverse', (t) => {
  const def = {
    headline: 'title',
    'headline/1': 'titleAgain',
    'headline/2': 'alsoTitle',
  }
  const state = { ...stateWithObject, rev: true }
  const expected = {
    ...state,
    value: {
      title: 'Entry 1',
      titleAgain: 'Entry 1',
      alsoTitle: 'Entry 1',
    },
  }

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should iterate in reverse', (t) => {
  const def = {
    $iterate: true,
    headline: 'title',
  }
  const state = { ...stateWithArray, rev: true }
  const expectedValue = [{ title: 'Entry 1' }, { title: 'Entry 2' }]

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should iterate in reverse with get operation', (t) => {
  const def = {
    $iterate: true,
    headline: get('title'),
  }
  const state = { ...stateWithArray, rev: true }
  const expectedValue = [{ title: 'Entry 1' }, { title: 'Entry 2' }]

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should reverse map with value array', (t) => {
  const def = {
    data: {
      'items[]': {
        title: get('headline'),
      },
    },
  }
  const state = {
    context: [],
    value: {
      data: {
        items: [{ title: 'Entry 1' }, { title: 'Entry 2' }],
      },
    },
    rev: true,
  }
  const expectedValue = [{ headline: 'Entry 1' }, { headline: 'Entry 2' }]

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should reverse map with several sets', (t) => {
  const def = {
    content: {
      title: 'headline',
      author: ['meta', 'user'],
      section: ['meta', 'tag'],
    },
  }
  const state = {
    context: [{ params: { source: 'news1' } }],
    value: {
      content: {
        title: 'The title',
        author: 'johnf',
        section: 'news',
      },
    },
    rev: true,
  }
  const expectedValue = {
    headline: 'The title',
    meta: { user: 'johnf', tag: 'news' },
  }

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test.failing('should skip root path in reverse', (t) => {
  const data = {
    data: {
      items: [{ title: 'Entry 1' }, { title: 'Entry 2' }],
    },
  }
  const def = {
    data: {
      'items[]': {
        title: get('headline'),
        source: '^^params.source', // Keep in this position to ensure it does not clear the previous fields
      },
    },
  }
  const state = {
    context: [{ data, params: { source: 'news1' } }],
    value: data,
    rev: true,
  }
  const expectedValue = [{ headline: 'Entry 1' }, { headline: 'Entry 2' }]

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

// Tests -- $direction

test('should skip transform object with $direction: rev going forward', (t) => {
  const def = {
    $direction: 'rev',
    id: value('ent1'),
    title: get('headline'),
  }
  const expected = stateWithObject

  const ret = props(def)(options)(identity)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should transform object with $direction: rev in reverse', (t) => {
  const def = {
    $direction: 'rev',
    content: {
      title: 'headline',
    },
  }
  const state = {
    context: [],
    value: {
      content: {
        title: 'The title',
      },
    },
    rev: true,
  }
  const expectedValue = { headline: 'The title' }

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should skip transform object with $direction: fwd in reverse', (t) => {
  const def = {
    $direction: 'fwd',
    content: {
      title: 'headline',
    },
  }
  const state = {
    context: [],
    value: {
      content: {
        title: 'The title',
      },
    },
    rev: true,
  }
  const expected = state

  const ret = props(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should transform object with $direction: fwd going forward', (t) => {
  const def = {
    $direction: 'fwd',
    id: value('ent1'),
    title: get('headline'),
  }
  const expected = {
    ...stateWithObject,
    value: {
      id: 'ent1',
      title: 'Entry 1',
    },
  }

  const ret = props(def)(options)(identity)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should use forward alias', (t) => {
  const optionsWithAlias = { ...options, fwdAlias: 'from' }
  const def = {
    $direction: 'from',
    content: {
      title: 'headline',
    },
  }
  const state = {
    context: [],
    value: {
      content: {
        title: 'The title',
      },
    },
    rev: true,
  }
  const expected = state

  const ret = props(def)(optionsWithAlias)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should use reverse alias', (t) => {
  const optionsWithAlias = { ...options, revAlias: 'to' }
  const def = {
    $direction: 'to',
    id: value('ent1'),
    title: get('headline'),
  }
  const expected = stateWithObject

  const ret = props(def)(optionsWithAlias)(identity)(stateWithObject)

  t.deepEqual(ret, expected)
})
