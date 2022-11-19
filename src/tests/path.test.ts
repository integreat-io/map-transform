import test from 'ava'
import {
  mapTransform,
  alt,
  fwd,
  get,
  lookup,
  plug,
  rev,
  root,
  set,
  value,
} from '..'

// Tests

test('should map with object path', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should get object from alt path', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with object shape', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should skip transform object with $direction: rev', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should skip transform object when $direction is revAlias', (t) => {
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

  const ret = mapTransform(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should map null values path', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should allow colons in paths', (t) => {
  const def = [
    {
      'b:title': 'content.a:heading',
    },
  ]
  const data = { content: { 'a:heading': 'Heading 1' } }
  const expected = { 'b:title': 'Heading 1' }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should allow escaped brackets in target paths', (t) => {
  const def = [
    {
      'created\\[gt]': 'payload.updatedAfter',
    },
  ]
  const data = { payload: { updatedAfter: new Date('2022-05-01T00:18:14Z') } }
  const expected = { 'created[gt]': new Date('2022-05-01T00:18:14Z') }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should allow escaped brackets in source paths', (t) => {
  const def = [
    {
      'payload.updatedAfter': 'created\\[gt]',
    },
  ]
  const data = { 'created[gt]': new Date('2022-05-01T00:18:14Z') }
  const expected = {
    payload: { updatedAfter: new Date('2022-05-01T00:18:14Z') },
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should skip slashed properties going forward', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should fetch item from array within bigger mutation', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with root path', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set on array index', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set on array index when iterating to an array prop', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with lookup', (t) => {
  const def = {
    title: 'content.heading',
    authors: ['content.authors[]', lookup('^^meta.users[]', 'id'), get('name')],
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with lookup as transform object', (t) => {
  const def = {
    title: 'content.heading',
    authors: [
      'content.authors[]',
      [{ $lookup: '^meta.users[]', path: 'id' }, 'name'],
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set all props from source object and override some', (t) => {
  const def = {
    article: {
      '.': 'content',
      title: 'content.heading',
      heading: value('Just in:'),
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should spread array to mapping objects', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map undefined to undefined', (t) => {
  const def = ['items', { attributes: { title: 'content.heading' } }]
  const data = { items: undefined }

  const ret = mapTransform(def)(data)

  t.is(ret, undefined)
})

test('should treat noneValues as undefined', (t) => {
  const def = ['items', { attributes: { title: 'content.heading' } }]
  const data = { items: null }

  const ret = mapTransform(def, { noneValues: [undefined, null] })(data)

  t.is(ret, null)
})

test('should map with root operation', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should not map fields without pipeline', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map data as is when no mapping', (t) => {
  const def = ['content']
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = {
    heading: 'The heading',
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with nested mappings', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should forward map with directional paths', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set to undefined when moving forward', (t) => {
  const def = {
    title: [fwd(plug()), rev('content.heading')],
  }
  const data = { content: { heading: 'Heading 1' } }
  const expected = { title: undefined }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with sub pipeline', (t) => {
  const def = ['content', ['articles']]
  const data = {
    content: { articles: [{ id: 'ent1' }, { id: 'ent2' }] },
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should shallow merge (modify) original object with transformed object', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should shallow merge (modify) original object with transformed object on several levels', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return data when no mapping def', (t) => {
  const def = null
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
  ]
  const expected = data

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return undefined when mapping def is empty object', (t) => {
  const def = {}
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
  ]

  const ret = mapTransform(def)(data)

  t.is(ret, undefined)
})

test('should try to map even when no data is given', (t) => {
  const def = {
    title: 'content.heading',
  }
  const expected = {
    title: undefined,
  }

  const ret = mapTransform(def)(null)

  t.deepEqual(ret, expected)
})

test('should map with parent', (t) => {
  const def = [
    'invoices[].lines[]',
    {
      $iterate: true,
      id: 'rowId',
      quantity: 'count',
      invoiceNo: '^.^.number',
    },
  ]
  const data = {
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
  }
  const expected = [
    { id: 1, quantity: 2, invoiceNo: '18843-11' },
    { id: 2, quantity: 1, invoiceNo: '18843-11' },
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test.todo('should set on given target')
