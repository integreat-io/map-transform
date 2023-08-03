import test from 'ava'
import { isObject } from '../utils/is.js'
import mapTransform, {
  alt,
  fwd,
  get,
  lookup,
  plug,
  rev,
  root,
  set,
  transform,
  transformers,
} from '../index.js'
const { value } = transformers
import type { Options, State } from '../types.js'

// Tests

test('should map with object path', async (t) => {
  const def = [
    'content.article',
    {
      title: 'content.heading',
    },
  ]
  const data = {
    content: {
      article: {
        content: { heading: 'Heading 1' },
      },
    },
  }
  const expected = { title: 'Heading 1' }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map to sub paths', async (t) => {
  const def = [
    'content',
    {
      article: 'meta',
      'article.title': 'article.content.heading',
    },
  ]
  const data = {
    content: {
      article: {
        content: { heading: 'Heading 1' },
      },
      meta: { id: 'ent1' },
    },
  }
  const expected = { article: { id: 'ent1', title: 'Heading 1' } }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should replace prop with transform object', async (t) => {
  const def = {
    content: 'content',
    'content.article': {
      title: 'content.article.content.heading',
    },
  }
  const data = {
    content: {
      article: {
        content: { heading: 'Heading 1' },
      },
      meta: { id: 'ent1' },
    },
  }
  const expected = {
    content: {
      article: { title: 'Heading 1' },
      meta: { id: 'ent1' },
    },
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with target', async (t) => {
  const def = ['content.article.content.heading', '>title']
  const data = { content: { article: { content: { heading: 'Heading 1' } } } }
  const target = { id: 'ent1', title: 'Default title' }
  const expected = { id: 'ent1', title: 'Heading 1' }

  const ret = await mapTransform(def)(data, { target })

  t.deepEqual(ret, expected)
})

test('should get object from alt path', async (t) => {
  const def = [
    alt('Content.Article', fwd('content.article')),
    {
      title: 'content.heading',
    },
  ]
  const data = {
    content: {
      article: {
        content: { heading: 'Heading 1' },
      },
    },
  }
  const expected = { title: 'Heading 1' }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with object shape', async (t) => {
  const def = {
    attributes: {
      title: 'content.heading',
      text: 'content.copy',
    },
    relationships: {
      author: 'meta.writer.username',
    },
  }
  const data = {
    content: { heading: 'The heading', copy: 'A long text' },
    meta: { writer: { username: 'johnf' } },
  }
  const expected = {
    attributes: {
      title: 'The heading',
      text: 'A long text',
    },
    relationships: {
      author: 'johnf',
    },
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should skip transform object with $direction: rev', async (t) => {
  const def = {
    $direction: 'rev',
    attributes: {
      title: 'content.heading',
      text: 'content.copy',
    },
    relationships: {
      author: 'meta.writer.username',
    },
  }
  const data = {
    content: { heading: 'The heading', copy: 'A long text' },
    meta: { writer: { username: 'johnf' } },
  }
  const expected = data

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should skip transform object when $direction is revAlias', async (t) => {
  const options = {
    revAlias: 'to',
  }
  const def = {
    $direction: 'to',
    attributes: {
      title: 'content.heading',
      text: 'content.copy',
    },
    relationships: {
      author: 'meta.writer.username',
    },
  }
  const data = {
    content: { heading: 'The heading', copy: 'A long text' },
    meta: { writer: { username: 'johnf' } },
  }
  const expected = data

  const ret = await mapTransform(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should map null values path', async (t) => {
  const def = [
    'content.article',
    {
      title: 'content.heading',
    },
  ]
  const data = {
    content: {
      article: {
        content: { heading: null },
      },
    },
  }
  const expected = { title: null }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should allow colons in paths', async (t) => {
  const def = [
    {
      'b:title': 'content.a:heading',
    },
  ]
  const data = { content: { 'a:heading': 'Heading 1' } }
  const expected = { 'b:title': 'Heading 1' }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should allow escaped brackets in target paths', async (t) => {
  const def = [
    {
      'created\\[gt]': 'payload.updatedAfter',
    },
  ]
  const data = { payload: { updatedAfter: new Date('2022-05-01T00:18:14Z') } }
  const expected = { 'created[gt]': new Date('2022-05-01T00:18:14Z') }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should allow escaped brackets in source paths', async (t) => {
  const def = [
    {
      'payload.updatedAfter': 'created\\[gt]',
    },
  ]
  const data = { 'created[gt]': new Date('2022-05-01T00:18:14Z') }
  const expected = {
    payload: { updatedAfter: new Date('2022-05-01T00:18:14Z') },
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should skip slashed properties going forward', async (t) => {
  const def = [
    'content.article',
    {
      title: 'content.heading',
      'title/1': 'content.title',
      'title/2': 'title',
    },
  ]
  const data = {
    content: {
      article: {
        content: { heading: 'Heading 1', title: 'Heading 2' },
        title: 'Heading 3',
      },
    },
  }
  const expected = { title: 'Heading 1' }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should fetch item from array within bigger mutation', async (t) => {
  const def = [
    '$action',
    {
      '.': '.',
      'response.data': 'response.data[0]',
    },
  ]
  const data = {
    $action: {
      type: 'GET',
      response: { data: [{ id: 'ent1', $type: 'entry' }] },
    },
  }
  const expected = {
    type: 'GET',
    response: { data: { id: 'ent1', $type: 'entry' } },
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with root path', async (t) => {
  const def = [
    {
      attributes: {
        title: 'content.heading',
        section: '^^meta.section',
      },
    },
  ]
  const data = {
    content: { heading: 'The heading', copy: 'A long text' },
    meta: { section: 'news' },
  }
  const expected = {
    attributes: {
      title: 'The heading',
      section: 'news',
    },
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with root path in pipeline', async (t) => {
  const def = [
    {
      attributes: {
        title: 'content.heading',
        section: ['content.copy', '^^meta.section'], // This pipeline doesn't really make sense, but does the job of testing the root path
      },
    },
  ]
  const data = {
    content: { heading: 'The heading', copy: 'A long text' },
    meta: { section: 'news' },
  }
  const expected = {
    attributes: {
      title: 'The heading',
      section: 'news',
    },
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set on array index', async (t) => {
  const def = {
    'props[0].value': 'content.prop1',
    'props[1].value': 'content.prop2',
  }
  const data = {
    content: {
      prop1: 'Value 1',
      prop2: 'Value 2',
    },
  }
  const expected = {
    props: [{ value: 'Value 1' }, { value: 'Value 2' }],
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set on array index when iterating to an array prop', async (t) => {
  const def = {
    'data[]': [
      'values',
      {
        $direction: 'fwd',
        $iterate: true,
        $modify: '.',
        'props[0]': { id: { $value: 'prop1' }, value: 'prop1', name: 'name' },
      },
      {
        $iterate: true,
        $modify: '.',
        person: 'name',
        props: [
          'props',
          { $filter: 'compare', path: 'value', not: true, operator: 'in' },
        ],
      },
    ],
  }
  const data = {
    values: [
      {
        prop1: 'Value 1',
        name: 'Someone',
      },
    ],
  }
  const expected = {
    data: [
      {
        prop1: 'Value 1',
        name: 'Someone',
        person: 'Someone',
        props: [{ id: 'prop1', value: 'Value 1', name: 'Someone' }],
      },
    ],
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map several layers of arrays with bracket notation in set path', async (t) => {
  const def = {
    'data[]': [
      'content.articles',
      {
        $iterate: true,
        title: 'heading',
        topics: 'keywords',
        'author.id': 'user_id',
      },
    ],
  }
  const data = {
    content: {
      articles: [
        {
          heading: 'Heading 1',
          keywords: [{ id: 'news' }, { id: 'latest' }],
          ['user_id']: 'johnf',
        },
        {
          heading: 'Heading 2',
          keywords: [{ id: 'tech' }],
          ['user_id']: 'maryk',
        },
        {
          heading: 'Heading 3',
          keywords: [],
          ['user_id']: 'maryk',
        },
      ],
    },
  }
  const expected = {
    data: [
      {
        title: 'Heading 1',
        topics: [{ id: 'news' }, { id: 'latest' }],
        author: { id: 'johnf' },
      },
      {
        title: 'Heading 2',
        topics: [{ id: 'tech' }],
        author: { id: 'maryk' },
      },
      {
        title: 'Heading 3',
        topics: [],
        author: { id: 'maryk' },
      },
    ],
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with lookup', async (t) => {
  const def = {
    title: 'content.heading',
    authors: [
      'content.authors[]',
      lookup({ arrayPath: '^^meta.users[]', propPath: 'id' }),
      get('name'),
    ],
  }
  const data = {
    content: { heading: 'The heading', authors: ['user1', 'user3'] },
    meta: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' },
        { id: 'user3', name: 'User 3' },
      ],
    },
  }
  const expected = {
    title: 'The heading',
    authors: ['User 1', 'User 3'],
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with lookup as transform object', async (t) => {
  const def = {
    title: 'content.heading',
    authors: [
      'content.authors[]',
      [{ $lookup: '^^.meta.users[]', path: 'id' }, 'name'],
    ],
  }
  const data = {
    content: { heading: 'The heading', authors: ['user1', 'user3'] },
    meta: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' },
        { id: 'user3', name: 'User 3' },
      ],
    },
  }
  const expected = {
    title: 'The heading',
    authors: ['User 1', 'User 3'],
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set all props from source object and override some', async (t) => {
  const def = {
    article: {
      '.': 'content',
      title: 'content.heading',
      heading: transform(value('Just in:')),
    },
  }
  const data = {
    content: {
      heading: 'The heading',
      abstract: 'So it begins ...',
    },
  }
  const expected = {
    article: {
      heading: 'Just in:',
      title: 'The heading',
      abstract: 'So it begins ...',
    },
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should spread array to mapping objects', async (t) => {
  const def = [
    'ids[]',
    {
      $iterate: true,
      id: '.',
    },
  ]
  const data = {
    ids: ['ent1', 'ent2'],
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map undefined to undefined', async (t) => {
  const def = ['items', { attributes: { title: 'content.heading' } }]
  const data = { items: undefined }

  const ret = await mapTransform(def)(data)

  t.is(ret, undefined)
})

test('should treat nonvalues as undefined', async (t) => {
  const def = ['items', { attributes: { title: 'content.heading' } }]
  const data = { items: null }

  const ret = await mapTransform(def, { nonvalues: [undefined, null] })(data)

  t.is(ret, null)
})

test('should map with root operation', async (t) => {
  const def = [
    'content',
    {
      attributes: {
        title: 'heading',
      },
      relationships: {
        author: root('meta.writer.username'),
      },
    },
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } },
  }
  const expected = {
    attributes: {
      title: 'The heading',
    },
    relationships: {
      author: 'johnf',
    },
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should provide root in $if condition', async (t) => {
  const def = {
    $modify: true,
    response: {
      $modify: 'response',
      data: [
        'response.data[]',
        {
          $if: '^^payload.onlyKnownEntries', // This should get false and skip filter
          then: {
            $filter: 'compare',
            path: 'id',
            operator: 'in',
            match: ['ent1', 'ent4'],
          },
        },
      ],
    },
  }
  const data = {
    type: 'GET',
    payload: {
      type: 'event',
      onlyKnownEntries: false,
    },
    response: {
      status: 'ok',
      data: [
        { id: 'ent1', $type: 'entry' },
        { id: 'ent2', $type: 'entry' },
        { id: 'ent3', $type: 'entry' },
        { id: 'ent4', $type: 'entry' },
      ],
    },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = data

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use root as $transform path', async (t) => {
  const def = {
    $modify: true,
    response: {
      $modify: 'response',
      data: [
        'response.data[]',
        {
          $iterate: true,
          $modify: true,
          itemType: {
            $transform: 'get',
            path: '^^payload.type',
          },
        },
      ],
    },
  }
  const data = {
    type: 'GET',
    payload: {
      type: 'event',
    },
    response: {
      status: 'ok',
      data: [
        { id: 'ent1', $type: 'entry', itemType: 'event' },
        { id: 'ent2', $type: 'entry', itemType: 'event' },
        { id: 'ent3', $type: 'entry', itemType: 'event' },
        { id: 'ent4', $type: 'entry', itemType: 'event' },
      ],
    },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = data

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should not map fields without pipeline', async (t) => {
  const def = {
    title: null,
    author: 'meta.writer.username',
  }
  const data = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } },
  }
  const expected = {
    author: 'johnf',
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map data as is when no mapping', async (t) => {
  const def = ['content']
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = {
    heading: 'The heading',
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with nested mappings', async (t) => {
  const def = [
    {
      content: {
        'articles[]': [
          {
            $iterate: true,
            title: 'content.heading',
          },
        ],
      },
    },
  ]
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
  ]
  const expected = {
    content: {
      articles: [{ title: 'Heading 1' }, { title: 'Heading 2' }],
    },
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should not iterate when $iterate is not set', async (t) => {
  const def = {
    'articles[]': [{ title: 'content.heading' }],
  }
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
  ]
  const expected = {
    articles: [{ title: ['Heading 1', 'Heading 2'] }],
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should forward map with directional paths', async (t) => {
  const def = [
    fwd(get('content.articles[]')),
    rev(get('wrong.path[]')),
    {
      $iterate: true,
      title: 'content.heading',
    },
    fwd(set('items[]')),
    rev(set('wrong.path[]')),
  ]
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } },
      ],
    },
  }
  const expected = {
    items: [{ title: 'Heading 1' }, { title: 'Heading 2' }],
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set to undefined when moving forward', async (t) => {
  const def = {
    title: [fwd(plug()), rev('content.heading')],
  }
  const data = { content: { heading: 'Heading 1' } }
  const expected = { title: undefined }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with sub pipeline', async (t) => {
  const def = ['content', ['articles']]
  const data = {
    content: { articles: [{ id: 'ent1' }, { id: 'ent2' }] },
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should shallow merge (modify) original object with transformed object', async (t) => {
  const def = {
    article: {
      $modify: 'content',
      title: 'name',
    },
  }
  const data = {
    name: 'The real title',
    content: {
      title: 'Oh, this must go',
      text: 'This is high quality content for sure',
    },
  }
  const expected = {
    article: {
      title: 'The real title',
      text: 'This is high quality content for sure',
    },
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should shallow merge (modify) original object with transformed object on several levels', async (t) => {
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
        'Content-Type': {
          $value: 'application/json',
        },
      },
    },
  }
  const data = {
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
  }
  const expected = {
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

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return data when no mapping def', async (t) => {
  const def = null
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
  ]
  const expected = data

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return undefined when mapping def is empty object', async (t) => {
  const def = {}
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
  ]

  const ret = await mapTransform(def)(data)

  t.is(ret, undefined)
})

test('should try to map even when no data is given', async (t) => {
  const def = {
    title: 'content.heading',
  }
  const expected = {
    title: undefined,
  }

  const ret = await mapTransform(def)(null)

  t.deepEqual(ret, expected)
})

test('should map with parent', async (t) => {
  const def = {
    items: [
      'response.data.invoices[].lines[]',
      {
        $iterate: true,
        id: 'rowId',
        quantity: 'count',
        invoiceNo: '^.^.number',
      },
    ],
  }
  const data = {
    response: {
      data: {
        invoices: [
          {
            number: '18843-11',
            lines: [
              { rowId: 1, count: 2 },
              { rowId: 2, count: 1 },
            ],
          },
          {
            number: '18843-12',
            lines: [],
          },
        ],
      },
    },
  }
  const expected = {
    items: [
      { id: 1, quantity: 2, invoiceNo: '18843-11' },
      { id: 2, quantity: 1, invoiceNo: '18843-11' },
    ],
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with parent through several iterations', async (t) => {
  const generateId = () => () => async (value: unknown) =>
    isObject(value) ? `${value.invoiceNo}-${value.rowId}` : undefined
  const options = { transformers: { generateId } }
  const def = {
    items: [
      'response.data.invoice.lines[]',
      {
        $iterate: true,
        $modify: true,
        id: [
          { rowId: 'rowId', invoiceNo: '^.^.number' },
          { $transform: 'generateId' },
        ],
      },
      {
        $iterate: true,
        id: 'id',
        quantity: 'count',
        invoiceNo: '^.^.number',
      },
    ],
  }
  const data = {
    response: {
      data: {
        invoice: {
          number: '18843-11',
          lines: [
            { rowId: 1, count: 2 },
            { rowId: 2, count: 1 },
          ],
        },
      },
    },
  }
  const expected = {
    items: [
      { id: '18843-11-1', quantity: 2, invoiceNo: '18843-11' },
      { id: '18843-11-2', quantity: 1, invoiceNo: '18843-11' },
    ],
  }

  const ret = await mapTransform(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should apply modifyGetValue to value from path', async (t) => {
  const modifyGetValue = (value: unknown, _state: State, _options: Options) =>
    isObject(value) && value.$value ? value.$value : value // A simplified implementation
  const def = [
    'content.article',
    {
      title: 'content.heading',
    },
  ]
  const data = {
    content: {
      article: {
        content: { heading: { $value: 'Heading 1' } },
      },
    },
  }
  const expected = { title: 'Heading 1' }

  const ret = await mapTransform(def, { modifyGetValue })(data)

  t.deepEqual(ret, expected)
})
