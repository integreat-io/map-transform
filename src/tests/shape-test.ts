import test from 'ava'

import mapTransform = require('..')

test('should map with object shape', (t) => {
  const def = {
    mapping: {
      attributes: {
        title: 'content.heading',
        text: 'content.copy'
      },
      relationships: {
        author: 'meta.writer.username'
      }
    }
  }
  const data = {
    content: { heading: 'The heading', copy: 'A long text' },
    meta: { writer: { username: 'johnf' } }
  }
  const expected = {
    attributes: {
      title: 'The heading',
      text: 'A long text'
    },
    relationships: {
      author: 'johnf'
    }
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})
