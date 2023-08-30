import test from 'ava'
import { get, set } from './getSet.js'
import transform from './transform.js'
import { value } from '../transformers/value.js'
import { noopNext } from '../utils/stateHelpers.js'

import props from './props.js'

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

const threeLetters = () => async (value: unknown) =>
  typeof value === 'string' ? value.slice(0, 3) : value

const options = {}

// Tests -- forward

test('should mutate shallow object with map transformer', async (t) => {
  const def = {
    id: transform(value('ent1')),
    title: 'headline',
    text: transform(value('The text')),
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

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should mutate object with depth', async (t) => {
  const def = {
    item: {
      id: transform(value('ent1')),
      attributes: {
        title: get('headline'),
        text: transform(value('The text')),
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

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret.value, expectedValue)
})

test('should support root in value', async (t) => {
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

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret.value, expectedValue)
})

test('should mutate object with map pipe', async (t) => {
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

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should mutate object with props in the given order', async (t) => {
  const def = {
    item: {
      id: transform(value('ent1')),
      attributes: {
        title: get('headline'),
        text: transform(value('The text')),
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

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  const item = (
    ret.value as Record<string, Record<string, Record<string, unknown>>>
  ).item
  t.deepEqual(Object.keys(item), expectedPropsItem)
  t.deepEqual(Object.keys(item.attributes), expectedPropsAttrs)
  t.deepEqual(Object.keys(item.relationships), expectedPropsRels)
})

test('should skip slashed properties going forward', async (t) => {
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

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should mutate with set in pipeline', async (t) => {
  const def = {
    id: transform(value('ent1')),
    meta: ['user', set('user')],
  }
  const expected = {
    context: [{ data, params: { source: 'news1' } }, data],
    value: {
      id: 'ent1',
      meta: { user: 'johnf' },
    },
  }

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should shallow merge original object and transformed object', async (t) => {
  const def = {
    $modify: true,
    id: transform(value('ent1')),
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

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should skip rev $modify going forward', async (t) => {
  const def = {
    '.': '$modify',
    id: transform(value('ent1')),
    title: 'headline',
  }
  const expected = {
    context: [{ data, params: { source: 'news1' } }, data],
    value: {
      id: 'ent1',
      title: 'Entry 1',
    },
  }

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should support reverse $modify going forward when flipped', async (t) => {
  const def = {
    $flip: true,
    '.': '$modify',
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
  }
  const expectedValue = {
    headline: 'The title',
    content: {
      title: 'The title',
    },
  }

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should skip both direction $modify going forward', async (t) => {
  const def = {
    $modify: 'content.$modify',
    title: 'content.headline',
  }
  const data = { content: { headline: 'Entry 1', user: 'johnf' } }
  const state = {
    context: [],
    value: data,
  }
  const expected = {
    context: [],
    value: { title: 'Entry 1' },
  }

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should shallow merge a path from original object and transformed object', async (t) => {
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

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should shallow merge with $modify on a path', async (t) => {
  const def = {
    'content.$modify': 'response',
    'content.data': 'response.data.items',
  }
  const state = {
    context: [],
    value: { type: 'GET', response: { status: 'ok', data: { items: [] } } },
  }
  const expected = {
    context: [],
    value: {
      content: {
        status: 'ok',
        data: [],
      },
    },
  }

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should shallow merge in sub object and use $modify path', async (t) => {
  const state = {
    context: [{ data, params: { source: 'news1' } }],
    value: { data: { article: data[0], tags: ['news', 'sports'] } },
  }
  const def = {
    content: {
      $modify: 'data',
      article: {
        id: transform(value('ent1')),
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

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should modify on several levels', async (t) => {
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
        'Content-Type': transform(value('application/json')),
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

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should not treat prop starting with $modify as $modify', async (t) => {
  const def = {
    $modifySomething: true,
    id: transform(value('ent1')),
    title: get('headline'),
    headline: '^^params.source',
  }
  const expected = {
    context: [{ data, params: { source: 'news1' } }, data],
    value: {
      id: 'ent1',
      title: 'Entry 1',
      headline: 'news1',
    },
  }

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should skip prop with modify in both directions', async (t) => {
  const def = {
    $modify: 'content.$modify',
    id: transform(value('ent1')),
    title: get('headline'),
    headline: '^^params.source',
  }
  const expected = {
    context: [{ data, params: { source: 'news1' } }, data],
    value: {
      id: 'ent1',
      title: 'Entry 1',
      headline: 'news1',
    },
  }

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should iterate when $iterate is true', async (t) => {
  const def = {
    $iterate: true,
    title: get('headline'),
  }
  const expected = {
    context: [{ data }],
    value: [{ title: 'Entry 1' }, { title: 'Entry 2' }],
  }

  const ret = await props(def)(options)(noopNext)(stateWithArray)

  t.deepEqual(ret, expected)
})

test('should not iterate when $iterate is false', async (t) => {
  const def = {
    $iterate: false,
    title: get('headline'),
  }
  const expectedValue = {
    title: ['Entry 1', 'Entry 2'],
  }

  const ret = await props(def)(options)(noopNext)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should honor $iterate on sub objects', async (t) => {
  const def = {
    articles: {
      $iterate: true,
      title: get('headline'),
    },
  }
  const expectedValue = {
    articles: [{ title: 'Entry 1' }, { title: 'Entry 2' }],
  }

  const ret = await props(def)(options)(noopNext)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should iterate sub objects on brackets notation paths', async (t) => {
  const def = {
    'articles[]': {
      title: get('headline'),
    },
  }
  const expectedValue = {
    articles: [{ title: 'Entry 1' }, { title: 'Entry 2' }],
  }

  const ret = await props(def)(options)(noopNext)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should map missing array to empty array', async (t) => {
  const stateWithArray = {
    context: [],
    value: {},
  }
  const def = {
    'articles[]': [
      'articles[]',
      {
        $iterate: true,
        title: get('headline'),
      },
    ],
  }
  const expectedValue = {
    articles: [],
  }

  const ret = await props(def)(options)(noopNext)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should iterate pipelines on brackets notation paths', async (t) => {
  const def = {
    'articles[]': ['headline'],
  }
  const expectedValue = {
    articles: ['Entry 1', 'Entry 2'],
  }

  const ret = await props(def)(options)(noopNext)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should not iterate sub pipeline on brackets notation paths', async (t) => {
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

  const ret = await props(def)(options)(noopNext)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should not include values from value transformer when $noDefaults is true', async (t) => {
  const def = {
    $noDefaults: true,
    id: transform(value('ent1')),
    title: 'headline',
    text: transform(value('The text')),
    source: '^^params.source',
    age: 'unknown',
  }
  const expected = {
    context: [{ data, params: { source: 'news1' } }, data],
    value: {
      title: 'Entry 1',
      source: 'news1',
    },
  }

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should not include values in iterations from value transformer when $noDefaults is true', async (t) => {
  const def = {
    $iterate: true,
    $noDefaults: true,
    title: get('headline'),
    author: transform(value('johnf')),
  }
  const expected = {
    context: [{ data }],
    value: [{ title: 'Entry 1' }, { title: 'Entry 2' }],
  }

  const ret = await props(def)(options)(noopNext)(stateWithArray)

  t.deepEqual(ret, expected)
})

test('should include values from value transformer when $noDefaults is false', async (t) => {
  const def = {
    $noDefaults: false,
    id: transform(value('ent1')),
    title: 'headline',
    text: transform(value('The text')),
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

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should not clear $noDefaults when not set', async (t) => {
  const stateWithNoDefaults = { ...stateWithObject, noDefaults: true }
  const def = {
    id: transform(value('ent1')),
    title: 'headline',
    text: transform(value('The text')),
    source: '^^params.source',
    age: 'unknown',
  }
  const expected = {
    noDefaults: true,
    context: [{ data, params: { source: 'news1' } }, data],
    value: {
      title: 'Entry 1',
      source: 'news1',
    },
  }

  const ret = await props(def)(options)(noopNext)(stateWithNoDefaults)

  t.deepEqual(ret, expected)
})

test('should add array to context when iterating', async (t) => {
  const state = {
    context: [{ content: { items: data, section: 'news' } }],
    value: { items: data, section: 'news' },
  }
  const def = {
    'articles[]': [
      'items[]',
      {
        $iterate: true,
        title: get('headline'),
        tags: get('^.^.section'),
      },
    ],
  }
  const expected = {
    context: [{ content: { items: data, section: 'news' } }],
    value: {
      articles: [
        { title: 'Entry 1', tags: 'news' },
        { title: 'Entry 2', tags: 'news' },
      ],
    },
  }

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should add array to context when iterating through two arrays', async (t) => {
  const state = {
    context: [
      { data: [{ items: data, section: 'news' }], author: 'johnf' },
      [{ items: data, section: 'news' }],
    ],
    value: { items: data, section: 'news' },
  }
  const def = {
    'articles[]': [
      'items[]',
      {
        $iterate: true,
        title: get('headline'),
        tags: get('^.^.section'),
        author: get('^.^.^.^.author'),
      },
    ],
  }
  const expectedValue = {
    articles: [
      { title: 'Entry 1', tags: 'news', author: 'johnf' },
      { title: 'Entry 2', tags: 'news', author: 'johnf' },
    ],
  }

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should add array to context through two transform objects', async (t) => {
  const state = {
    context: [],
    value: { item: data[0], section: 'news' },
  }
  const def = {
    'articles[]': [
      'item',
      {
        title: get('headline'),
      },
      {
        title: get('title'),
        tags: get('^.section'),
      },
    ],
  }
  const expectedValue = {
    articles: [{ title: 'Entry 1', tags: 'news' }],
  }

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should add array to context through two iterations', async (t) => {
  const state = {
    context: [],
    value: { items: data, section: 'news' },
  }
  const def = {
    'articles[]': [
      'items[]',
      {
        $iterate: true,
        title: get('headline'),
      },
      {
        $iterate: true,
        title: get('title'),
        tags: get('^.^.section'),
      },
    ],
  }
  const expectedValue = {
    articles: [
      { title: 'Entry 1', tags: 'news' },
      { title: 'Entry 2', tags: 'news' },
    ],
  }

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should set on index notation paths', async (t) => {
  const def = {
    'articles[0]': { title: 'headline' },
  }
  const expectedValue = {
    articles: [{ title: 'Entry 1' }],
  }

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret.value, expectedValue)
})

test('should flip and mutate object', async (t) => {
  const def = {
    $flip: true,
    entry: {
      // id: transform(value('ent1'), // TODO: How to use value in reverse?
      headline: ['item.attributes.title', transform(threeLetters)],
      unknown: 'item.attributes.age',
      user: 'item.relationships.author',
    },
  }
  const stateWithObject = {
    context: [],
    value: { entry: data[0] },
  }
  const expected = {
    ...stateWithObject,
    value: {
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
    },
  }

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should flip and mutate object in reverse', async (t) => {
  const def = {
    $flip: true,
    item: {
      id: transform(value('ent1')),
      attributes: {
        title: ['headline', transform(threeLetters)],
        age: ['unknown'],
      },
      relationships: {
        author: 'user',
      },
    },
  }
  const state = { ...stateWithObject, rev: true }
  const expected = {
    ...state,
    value: {
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
    },
  }

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should map complex shape', async (t) => {
  const def = {
    item: {
      id: transform(value('ent1')),
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

  const ret = await props(def)(options)(noopNext)({ ...stateWithObject })

  t.deepEqual(ret.value, expectedValue)
})

test('should skip unknown dollar props', async (t) => {
  const def = {
    title: 'headline',
    text: transform(value('The text')),
    $unknown: 'user',
  }
  const expected = {
    context: [{ data, params: { source: 'news1' } }, data],
    value: {
      title: 'Entry 1',
      text: 'The text',
    },
  }

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should skip props without a pipeline', async (t) => {
  const def = {
    title: 'headline',
    text: transform(value('The text')),
    nothing: undefined,
  }
  const expected = {
    context: [{ data, params: { source: 'news1' } }, data],
    value: {
      title: 'Entry 1',
      text: 'The text',
    },
  }

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should not mutate undefined value', async (t) => {
  const def = {
    id: transform(value('ent1')),
    title: get('headline'),
  }
  const state = {
    context: [{ data }],
    value: undefined,
  }
  const expected = state

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not mutate null value when included in nonvalues', async (t) => {
  const optionsWithNullAsNone = { ...options, nonvalues: [undefined, null] }
  const def = {
    id: transform(value('ent1')),
    title: get('headline'),
  }
  const state = {
    context: [{ data }],
    value: null,
  }
  const expected = state

  const ret = await props(def)(optionsWithNullAsNone)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not mutate undefined value in array', async (t) => {
  const def = {
    $iterate: true,
    id: transform(value('ent1')),
    title: get('headline'),
  }
  const state = {
    context: [{ data }, data],
    value: [undefined],
  }
  const expected = state

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not mutate null value in array when included in nonvalues', async (t) => {
  const optionsWithNullAsNone = { ...options, nonvalues: [undefined, null] }
  const def = {
    $iterate: true,
    id: transform(value('ent1')),
    title: get('headline'),
  }
  const state = {
    context: [{ data }, data],
    value: [null],
  }
  const expected = state

  const ret = await props(def)(optionsWithNullAsNone)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set value to empty object on empty transform object', async (t) => {
  const def = {}
  const state = {
    context: [{ data: { headline: 'The title' } }],
    value: { headline: 'The title' },
  }
  const expected = {
    context: [{ data: { headline: 'The title' } }],
    value: {},
  }

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set value to empty object on empty, embeded transform object', async (t) => {
  const def = { content: {} }
  const state = {
    context: [{ data: { headline: 'The title' } }],
    value: { headline: 'The title' },
  }
  const expected = {
    context: [{ data: { headline: 'The title' } }],
    value: { content: {} },
  }

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set value to empty object on empty transform object within another object', async (t) => {
  const def = {}
  const state = {
    context: [{ data: { headline: 'The title' } }],
    value: { headline: 'The title' },
  }
  const expected = {
    context: [{ data: { headline: 'The title' } }],
    value: {},
  }

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

// Tests -- reverse

test('should reverse map', async (t) => {
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

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should skip values with no set in reverse', async (t) => {
  const def = {
    id: transform(value('ent1')), // This value has no place to go
    content: {
      title: 'headline',
      sections: transform(value('news')), // This value has no place to go
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

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should set value in reverse', async (t) => {
  const def = {
    id: ['key', transform(value('ent1'))], // A value with both get and set
    content: {
      title: 'headline',
      sections: ['tags[]', transform(value('news'))], // A value with both get and set
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
  const expectedValue = { key: 'ent1', headline: 'The title', tags: ['news'] }

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should reverse map with sub objects', async (t) => {
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

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should reverse map with sub objects flipped', async (t) => {
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

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should set slashed properties in reverse', async (t) => {
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

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should support $modify in reverse', async (t) => {
  const def = {
    '.': '$modify',
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
  const expectedValue = {
    headline: 'The title',
    content: {
      title: 'The title',
    },
  }

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should support $modify in a pipeline in reverse', async (t) => {
  const def = {
    '.': ['$modify'],
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
  const expectedValue = {
    headline: 'The title',
    content: {
      title: 'The title',
    },
  }

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should skip forward $modify in reverse', async (t) => {
  const def = {
    $modify: true, // This should do nothing in reverse
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

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should shallow merge original object and transformed object in reverse when flipped', async (t) => {
  const def = {
    $modify: true,
    $flip: true,
    id: transform(value('ent1')),
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
    rev: true,
  }

  const ret = await props(def)(options)(noopNext)({
    ...stateWithObject,
    rev: true,
  })

  t.deepEqual(ret, expected)
})

test('should skip prop with $modify in both directions in reverse', async (t) => {
  const def = {
    'content.$modify': '$modify',
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
  const expectedValue = {
    headline: 'The title',
  }

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should iterate in reverse', async (t) => {
  const def = {
    $iterate: true,
    headline: 'title',
  }
  const state = { ...stateWithArray, rev: true }
  const expectedValue = [{ title: 'Entry 1' }, { title: 'Entry 2' }]

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should iterate in reverse with get operation', async (t) => {
  const def = {
    $iterate: true,
    headline: get('title'),
  }
  const state = { ...stateWithArray, rev: true }
  const expectedValue = [{ title: 'Entry 1' }, { title: 'Entry 2' }]

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should reverse map with value array', async (t) => {
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

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should reverse map with several sets', async (t) => {
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

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should skip root path in reverse', async (t) => {
  const data = {
    data: {
      items: [{ title: 'Entry 1' }, { title: 'Entry 2' }],
    },
  }
  const def = {
    data: {
      'items[]': {
        title: get('headline'),
        source: '^^params.source', // Keep in this position to test if it clears the previous fields
      },
    },
  }
  const state = {
    context: [{ data, params: { source: 'news1' } }],
    value: data,
    rev: true,
  }
  const expectedValue = [{ headline: 'Entry 1' }, { headline: 'Entry 2' }]

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

// Tests -- $direction

test('should skip transform object with $direction: rev going forward', async (t) => {
  const def = {
    $direction: 'rev',
    id: transform(value('ent1')),
    title: get('headline'),
  }
  const expected = stateWithObject

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should transform object with $direction: rev in reverse', async (t) => {
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

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should skip transform object with $direction: fwd in reverse', async (t) => {
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

  const ret = await props(def)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should transform object with $direction: fwd going forward', async (t) => {
  const def = {
    $direction: 'fwd',
    id: transform(value('ent1')),
    title: get('headline'),
  }
  const expected = {
    ...stateWithObject,
    value: {
      id: 'ent1',
      title: 'Entry 1',
    },
  }

  const ret = await props(def)(options)(noopNext)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should use forward alias', async (t) => {
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

  const ret = await props(def)(optionsWithAlias)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should use reverse alias', async (t) => {
  const optionsWithAlias = { ...options, revAlias: 'to' }
  const def = {
    $direction: 'to',
    id: transform(value('ent1')),
    title: get('headline'),
  }
  const expected = stateWithObject

  const ret = await props(def)(optionsWithAlias)(noopNext)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should throw on unknown pipeline in an $apply operation', (t) => {
  const def = {
    title: { $apply: 'unknown' },
    viewCount: 'meta.hits',
  }

  const error = t.throws(() => props(def)(options)(noopNext))

  t.true(error instanceof Error)
  t.is(error?.message, "Failed to apply pipeline 'unknown'. Unknown pipeline")
})
