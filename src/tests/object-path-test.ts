import test from 'ava'

import * as mapTransform from '..'

test('should map with object path', (t) => {
  const def = {
    mapping: {
      title: { path: 'content.heading' }
    },
    path: 'content.articles'
  }
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } }
      ]
    }
  }
  const expected = [
    { title: 'Heading 1' },
    { title: 'Heading 2' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with object array path', (t) => {
  const def = {
    mapping: {
      title: { path: 'content.heading' }
    },
    path: 'content.articles[]'
  }
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } }
      ]
    }
  }
  const expected = [
    { title: 'Heading 1' },
    { title: 'Heading 2' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with root array path', (t) => {
  const def = {
    mapping: {
      title: { path: 'content.heading' }
    },
    path: '[]'
  }
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]
  const expected = [
    { title: 'Heading 1' },
    { title: 'Heading 2' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map data as is when no mapping', (t) => {
  const def = {
    path: 'content'
  }
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = {
    heading: 'The heading'
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with pathFrom', (t) => {
  const def = {
    mapping: {
      title: { path: 'content.heading' }
    },
    pathFrom: 'content.articles'
  }
  const data = {
    content: {
      articles: [{ content: { heading: 'Heading 1' } }]
    }
  }
  const expected = [{ title: 'Heading 1' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with object pathTo', (t) => {
  const def = {
    mapping: {
      title: { path: 'content.heading' }
    },
    pathTo: 'content.articles'
  }
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]
  const expected = {
    content: {
      articles: [
        { title: 'Heading 1' },
        { title: 'Heading 2' }
      ]
    }
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with array pathTo', (t) => {
  const def = {
    mapping: {
      title: { path: 'content.heading' }
    },
    pathTo: 'content.articles[].item'
  }
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]
  const expected = {
    content: {
      articles: [
        { item: { title: 'Heading 1' } },
        { item: { title: 'Heading 2' } }
      ]
    }
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return data when no mapping def', (t) => {
  const def = null
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]
  const expected = data

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return data when mapping def is empty', (t) => {
  const def = {}
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]
  const expected = data

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return null when no data is given', (t) => {
  const def = {
    mapping: {
      title: 'content.heading'
    }
  }

  const ret = mapTransform(def)(null)

  t.is(ret, null)
})

test('should return null when path points to a non-existing prop', (t) => {
  const def = {
    mapping: {
      title: 'title'
    },
    path: 'missing'
  }
  const data = {
    content: {
      title: 'Entry 1'
    }
  }

  const ret = mapTransform(def)(data)

  t.is(ret, null)
})

test('should set empty data array on pathTo', (t) => {
  const def = {
    mapping: {
      title: 'heading'
    },
    pathTo: 'items[]'
  }
  const data: any[] = []
  const expected = {
    items: []
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})
