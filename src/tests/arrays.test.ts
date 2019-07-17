import test from 'ava'

import pipe from '../operations/pipe'
import { mapTransform, value, set } from '..'

test('should map specified array over transform object', t => {
  const def = [
    'content.articles[]',
    {
      title: 'content.heading'
    }
  ]
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } }
      ]
    }
  }
  const expected = [{ title: 'Heading 1' }, { title: 'Heading 2' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map specified array over transform object in reverse', t => {
  const def = [
    'content.articles[]',
    {
      title: 'content.heading'
    }
  ]
  const data = [{ title: 'Heading 1' }, { title: 'Heading 2' }]
  const expected = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } }
      ]
    }
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test.skip('should not iterate over unspecified array', t => {
  const def = [
    'content.articles',
    {
      title: 'content.heading'
    }
  ]
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } }
      ]
    }
  }
  const expected = { title: ['Heading 1', 'Heading 2'] }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

// test.skip('should iterate with iterate operation', t => {
//   const def = [
//     'content.articles',
//     iterate({
//       title: 'content.heading'
//     })
//   ]
//   const data = {
//     content: {
//       articles: [
//         { content: { heading: 'Heading 1' } },
//         { content: { heading: 'Heading 2' } }
//       ]
//     }
//   }
//   const expected = [{ title: 'Heading 1' }, { title: 'Heading 2' }]
//
//   const ret = mapTransform(def)(data)
//
//   t.deepEqual(ret, expected)
// })

test.skip('should map array in transform object', t => {
  const def = [
    {
      $iterate: false,
      'entries[]': {
        title: 'content.heading'
      },
      'authors[]': ['content.author']
    }
  ]
  const data = [
    { content: { heading: 'Heading 1', author: 'johnf' } },
    { content: { heading: 'Heading 2', author: 'lucyk' } }
  ]
  const expected = {
    entries: [{ title: 'Heading 1' }, { title: 'Heading 2' }],
    authors: ['johnf', 'lucyk']
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test.skip('should map several layers of arrays', t => {
  const def = [
    'content.articles[]',
    {
      attributes: {
        title: 'content.heading'
      },
      relationships: {
        'topics[].id': 'meta.keywords',
        'author.id': 'meta.user_id'
      }
    }
  ]
  const data = {
    content: {
      articles: [
        {
          content: { heading: 'Heading 1' },
          meta: { keywords: ['news', 'latest'], user_id: 'johnf' }
        },
        {
          content: { heading: 'Heading 2' },
          meta: { keywords: ['tech'], user_id: 'maryk' }
        }
      ]
    }
  }
  const expected = [
    {
      attributes: { title: 'Heading 1' },
      relationships: {
        topics: [{ id: 'news' }, { id: 'latest' }],
        author: { id: 'johnf' }
      }
    },
    {
      attributes: { title: 'Heading 2' },
      relationships: { topics: [{ id: 'tech' }], author: { id: 'maryk' } }
    }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

// test.skip('should map several layers of arrays - seperate pipelines', t => {
//   const def = [
//     'content.articles[]',
//     merge(
//       ['content.heading', set('attributes.title')],
//       ['meta.keywords', set('relationships.topics[].id')],
//       ['meta.user_id', set('relationships.author.id')]
//     )
//   ]
//   const data = {
//     content: {
//       articles: [
//         {
//           content: { heading: 'Heading 1' },
//           meta: { keywords: ['news', 'latest'], user_id: 'johnf' }
//         },
//         {
//           content: { heading: 'Heading 2' },
//           meta: { keywords: ['tech'], user_id: 'maryk' }
//         }
//       ]
//     }
//   }
//   const expected = [
//     {
//       attributes: { title: 'Heading 1' },
//       relationships: {
//         topics: [{ id: 'news' }, { id: 'latest' }],
//         author: { id: 'johnf' }
//       }
//     },
//     {
//       attributes: { title: 'Heading 2' },
//       relationships: { topics: [{ id: 'tech' }], author: { id: 'maryk' } }
//     }
//   ]
//
//   const ret = mapTransform(def)(data)
//
//   t.deepEqual(ret, expected)
// })

test('should flatten arrays', t => {
  const def = [
    'content.articles[].content[]',
    {
      attributes: {
        title: 'heading'
      }
    }
  ]
  const data = {
    content: {
      articles: [
        {
          content: [{ heading: 'Heading 1' }, { heading: 'Heading 2' }]
        }
      ]
    }
  }
  const expected = [
    { attributes: { title: 'Heading 1' } },
    { attributes: { title: 'Heading 2' } }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map empty array as empty array', t => {
  const def = {
    title: 'content.heading'
  }
  const data: any[] = []
  const expected: any[] = []

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with object array path', t => {
  const def = [
    'content.articles[]',
    {
      title: 'content.heading'
    }
  ]
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } },
        { content: { heading: 'Heading 3' } }
      ]
    }
  }
  const expected = [
    { title: 'Heading 1' },
    { title: 'Heading 2' },
    { title: 'Heading 3' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test.skip('should handle array paths in object mappings', t => {
  const def = [
    {
      $iterate: false,
      id: 'key',
      relationships: {
        sections: 'sections[]'
      }
    }
  ]
  const data = [{ key: 'ent1', sections: ['news', 'sports'] }, { key: 'ent2' }]
  const expected = [
    { id: 'ent1', relationships: { sections: ['news', 'sports'] } },
    { id: 'ent2', relationships: { sections: [] } }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with array index path', t => {
  const def = [
    'content.articles[1]',
    {
      title: 'content.heading'
    }
  ]
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } }
      ]
    }
  }
  const expected = { title: 'Heading 2' }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with array index in middle of path', t => {
  const def = ['content.articles[0].content.heading']
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } }
      ]
    }
  }
  const expected = 'Heading 1'

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set several props in array', t => {
  const def = {
    'props[0].key': value('prop1'),
    'props[0].value': 'content.prop1',
    'props[1].key': value('prop2'),
    'props[1].value': 'content.prop2'
  }
  const data = {
    content: {
      prop1: 'Value 1',
      prop2: 'Value 2'
    }
  }
  const expected = {
    props: [
      { key: 'prop1', value: 'Value 1' },
      { key: 'prop2', value: 'Value 2' }
    ]
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test.skip('should map with value array', t => {
  const def = {
    $iterate: false,
    data: {
      'items[]': [
        {
          title: 'headline'
        }
      ]
    }
  }
  const data = [{ headline: 'Entry 1' }, { headline: 'Entry 2' }]
  const expected = {
    data: {
      items: [{ title: 'Entry 1' }, { title: 'Entry 2' }]
    }
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return undefined from non-matching path with array index in middle', t => {
  const def = ['content.articles[0].content.heading']
  const data = {
    content: {
      articles: {
        content: {
          heading: 'Heading 1'
        }
      }
    }
  }
  const expected = undefined

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with root array path', t => {
  const def = [
    '[]',
    {
      title: 'content.heading'
    }
  ]
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]
  const expected = [{ title: 'Heading 1' }, { title: 'Heading 2' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map array of objects', t => {
  const def = {
    content: {
      heading: 'title'
    },
    meta: {
      writer: {
        username: 'author'
      }
    }
  }
  const data = [
    { title: 'The heading', author: 'johnf' },
    { title: 'Second heading', author: 'maryk' }
  ]
  const expected = [
    {
      content: { heading: 'The heading' },
      meta: { writer: { username: 'johnf' } }
    },
    {
      content: { heading: 'Second heading' },
      meta: { writer: { username: 'maryk' } }
    }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test.skip('should set empty data array', t => {
  const def = {
    $iterate: false,
    'items[]': {
      title: 'heading'
    }
  }
  const data: any[] = []
  const expected = {
    items: []
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test.skip('should not hijack array', t => {
  const def = [
    {
      $iterate: false,
      content: { title: 'heading' },
      meta: {
        'sections[].id': 'tags'
      }
    }
  ]
  const data = [
    { heading: 'Entry 1', tags: ['news', 'top_ten'] },
    { heading: 'Entry 2', tags: ['news'] }
  ]
  const expected = [
    {
      content: { title: 'Entry 1' },
      meta: { sections: [{ id: 'news' }, { id: 'top_ten' }] }
    },
    { content: { title: 'Entry 2' }, meta: { sections: [{ id: 'news' }] } }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map undefined from path even with array path', t => {
  const def = ['items[]', { title: 'content.heading' }]
  const data = { items: undefined }

  const ret = mapTransform(def)(data)

  t.is(typeof ret, 'undefined')
})

test.todo('should split mappings with array path in the middle')
