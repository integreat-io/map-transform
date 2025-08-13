import test from 'node:test'
import assert from 'node:assert/strict'
import { isObject } from '../utils/is.js'
import { mapTransformSync, mapTransformAsync } from '../index.js'

// Tests

test('should map with object path', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map to sub paths', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should replace prop with transform object', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map to target', () => {
  const def = ['content.article.content.heading', '>title']
  const data = { content: { article: { content: { heading: 'Heading 1' } } } }
  const target = { id: 'ent1', title: 'Default title' }
  const expected = { id: 'ent1', title: 'Heading 1' }

  const ret = mapTransformSync(def)(data, { target })

  assert.deepEqual(ret, expected)
})

test('should map to target with sub-objects', () => {
  const def = ['content.article.content.heading', '>attributes.title']
  const data = { content: { article: { content: { heading: 'Heading 1' } } } }
  const target = {
    id: 'ent1',
    attributes: {
      title: 'Default title',
      text: 'What a great article!',
    },
  }
  const expected = {
    id: 'ent1',
    attributes: {
      title: 'Heading 1',
      text: 'What a great article!',
    },
  }

  const ret = mapTransformSync(def)(data, { target })

  assert.deepEqual(ret, expected)
})

test('should get object from alt path', () => {
  const def = [
    { $alt: ['Content.Article', 'content.article'] },
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map with object shape', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should skip transform object with $direction: rev', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should skip transform object when $direction is revAlias', () => {
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

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should map null values path', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should allow colons in paths', () => {
  const def = [
    {
      'b:title': 'content.a:heading',
    },
  ]
  const data = { content: { 'a:heading': 'Heading 1' } }
  const expected = { 'b:title': 'Heading 1' }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should allow escaped chars in target paths', () => {
  const def = [
    {
      'created\\[gt]': 'payload.updatedAfter',
      '\\$modify': { $value: true },
      'data.\\$value': 'payload.value',
    },
  ]
  const data = {
    payload: { updatedAfter: new Date('2022-05-01T00:18:14Z'), value: 3 },
  }
  const expected = {
    'created[gt]': new Date('2022-05-01T00:18:14Z'),
    data: { $value: 3 },
    $modify: true,
  }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should allow escaped chars in source paths', () => {
  const def = [
    {
      'payload.updatedAfter': 'created\\[gt]',
      'payload.type': 'data.\\$type',
    },
  ]
  const data = {
    'created[gt]': new Date('2022-05-01T00:18:14Z'),
    data: { id: 'ent1', $type: 'entry' },
  }
  const expected = {
    payload: { updatedAfter: new Date('2022-05-01T00:18:14Z'), type: 'entry' },
  }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should skip slashed properties going forward', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should fetch item from array within bigger mutation', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map with root path', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map with root path in pipeline', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should set on array index', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should set on array index when iterating to an array prop', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map several layers of arrays with bracket notation in set path', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should flatten array with several levels and iterating operations', () => {
  const def = {
    payload: {
      $modify: 'payload',
      id: [
        '^^getClients.response.data[].integrations[].tables[]',
        { $apply: 'getIds', $iterate: true },
      ],
    },
  }
  const data = {
    payload: { type: 'date' },
    getClients: {
      response: {
        status: 'ok',
        data: [
          {
            id: 'client2',
            integrations: [
              {
                id: 'int1',
                source: { id: 'src1' },
                tables: [
                  { id: 'transaction', name: 'Hovedbok' },
                  { id: 'vat', name: 'MVA-oppsett' },
                ],
              },
              {
                id: 'int2',
                source: { id: 'src2' },
                tables: [{ id: 'salesItem', name: 'Salg varer' }],
              },
              {
                id: 'int3',
                source: { id: 'src3' },
                tables: [
                  { id: 'transaction', name: 'Hovedbok' },
                  { id: 'workingOrder', name: 'Arbeidsordrer' },
                ],
              },
              {
                id: 'int4',
                source: { id: 'src4' },
                tables: [{ id: 'transaction', name: 'Hovedbok' }],
              },
            ],
          },
          {
            id: 'client3',
            integrations: [],
          },
        ],
      },
    },
  }
  const combineIds = () => (value: Record<string, unknown>) =>
    `${value.clientId}:lastSyncedAt:${value.sourceId}:${value.tableId}`
  const getIds = [
    {
      tableId: 'id',
      sourceId: '^.^.source.id',
      clientId: '^.^.^.^.id',
    },
    { $transform: combineIds },
  ]
  const options = { pipelines: { getIds } }
  const expected = {
    payload: {
      type: 'date',
      id: [
        'client2:lastSyncedAt:src1:transaction',
        'client2:lastSyncedAt:src1:vat',
        'client2:lastSyncedAt:src2:salesItem',
        'client2:lastSyncedAt:src3:transaction',
        'client2:lastSyncedAt:src3:workingOrder',
        'client2:lastSyncedAt:src4:transaction',
      ],
    },
  }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should map with lookup', () => {
  const def = {
    title: 'content.heading',
    authors: [
      'content.authors[]',
      { $lookup: '^^meta.users[]', path: 'id' },
      'name',
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should treat lookdown as get going forward', () => {
  const def = {
    'content.heading': 'title',
    'content.authors': [
      'authors[]',
      { $lookdown: '^meta.users[]', path: 'id' },
    ],
  }
  const data = {
    title: 'The heading',
    authors: [
      { id: 'user1', name: 'User 1' },
      { id: 'user3', name: 'User 3' },
    ],
  }
  const expected = {
    content: { heading: 'The heading', authors: ['user1', 'user3'] },
  }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map with lookup as transform object', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should set all props from source object and override some', () => {
  const def = {
    article: {
      '.': 'content',
      title: 'content.heading',
      heading: { $value: 'Just in:' },
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should disregard pipeline with no get', () => {
  const def = {
    title: 'content.heading',
    '/1': ['meta', { $value: { tags: ['news'] } }], // We're setting an object here, as that would replace the target object
  }
  const data = {
    content: { heading: 'New article' },
    meta: { tags: ['news'] },
  }
  const expected = { title: 'New article' }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should spread array to mapping objects', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should skip mutation object for undefined ', () => {
  const def = ['items', { attributes: { title: 'content.heading' } }]
  const data = { items: undefined }
  const expected = undefined

  const ret = mapTransformSync(def)(data)

  assert.equal(ret, expected)
})

test('should skip mutation object for non-value', () => {
  const def = ['items', { attributes: { title: 'content.heading' } }]
  const options = { nonvalues: [undefined, null] }
  const data = { items: null }
  const expected = undefined

  const ret = mapTransformSync(def, options)(data)

  assert.equal(ret, expected)
})

test('should run mutation object on undefined when $alwaysApply is true', () => {
  const def = [
    'items',
    {
      $alwaysApply: true,
      attributes: { $alwaysApply: true, title: 'content.heading' },
    },
  ]
  const data = { items: undefined }
  const expected = { attributes: { title: undefined } }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should run mutation object on non-value when $alwaysApply is true', () => {
  const def = [
    'items',
    {
      $alwaysApply: true,
      attributes: { $alwaysApply: true, title: 'content.heading' },
    },
  ]
  const options = { nonvalues: [undefined, null] }
  const data = { items: null }
  const expected = { attributes: { title: undefined } }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should map with root operation', () => {
  const def = [
    'content',
    {
      attributes: {
        title: 'heading',
      },
      relationships: {
        author: '^^.meta.writer.username',
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should modify object even when it has no other props', () => {
  const def = [
    {
      id: 'key',
      title: 'heading',
    },
    { $modify: true },
  ]
  const data = { key: 'ent1', heading: 'The heading' }
  const expected = { id: 'ent1', title: 'The heading' }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should provide root in $if condition', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should use root as $transform path', () => {
  const def = {
    $modify: true,
    response: {
      $modify: 'response',
      data: [
        'response.data[]',
        {
          $iterate: true,
          $modify: true,
          isEvent: {
            $transform: 'compare',
            path: '^^payload.type',
            match: 'event',
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
        { id: 'ent1', $type: 'entry' },
        { id: 'ent2', $type: 'entry' },
        { id: 'ent3', $type: 'entry' },
        { id: 'ent4', $type: 'entry' },
      ],
    },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = mapTransformSync(def)(data)

  assert.equal(
    ((ret as typeof data).response.data[0] as Record<string, unknown>).isEvent,
    true,
  )
})

test('should not map fields without pipeline', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map data as is when no mapping', () => {
  const def = ['content']
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = {
    heading: 'The heading',
  }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map with nested mappings', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should not iterate when $iterate is not set', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should not iterate a pipeline by default after a path with bracket notation', () => {
  const def = {
    articles: ['data[]', { title: 'content.heading' }],
  }
  const data = {
    data: [
      { content: { heading: 'Heading 1' } },
      { content: { heading: 'Heading 2' } },
    ],
  }
  const expected = {
    articles: { title: ['Heading 1', 'Heading 2'] },
  }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should not iterate rest of pipeline after one iterating step', () => {
  const def = {
    'articles[]': [
      { $iterate: true, title: 'content.heading' },
      {
        $filter: 'compare',
        path: 'title',
        not: true,
        match: 'Heading 2',
      },
    ],
  }
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
    { content: { heading: 'Heading 3' } },
  ]
  const expected = {
    articles: [{ title: 'Heading 1' }, { title: 'Heading 3' }],
  }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should iterate with the $iterate operation', () => {
  const def = {
    'articles[]': [{ $iterate: { title: 'content.heading' } }],
  }
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
  ]
  const expected = {
    articles: [{ title: 'Heading 1' }, { title: 'Heading 2' }],
  }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should shallow merge (modify) original object with transformed object', () => {
  const def = {
    article: {
      $modify: 'content',
      '.': 'article.$modify',
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should shallow merge (modify) original object with transformed object on several levels', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should return data when no mapping def', () => {
  const def = null
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
  ]
  const expected = data

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should return empty object when mapping def is empty object', () => {
  const def = {}
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
  ]

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, {})
})

test('should set empty transform object to empty object on a path', () => {
  const def = {
    'content.article': {},
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
      article: {},
    },
  }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should try to map even when no data is given', () => {
  const def = {
    title: 'content.heading',
  }
  const expected = {
    title: undefined,
  }

  const ret = mapTransformSync(def)(null)

  assert.deepEqual(ret, expected)
})

test('should map with parent', () => {
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

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map with parent through several iterations', () => {
  const generateId = () => () => (value: unknown) =>
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

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should map with parent through several iterations async', async () => {
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

  const ret = await mapTransformAsync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should map with parent when parents yielded undefined', () => {
  const def = {
    status: ['response.data.invoices', '^.^.status'], // A contrived example, but it tests the parent path
  }
  const data = {
    response: {
      status: 'ok',
      data: {},
    },
  }
  const expected = {
    status: 'ok',
  }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})
