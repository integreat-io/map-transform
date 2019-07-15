import test from 'ava'

import { mapTransform, transform, apply } from '..'

// Setup

const castEntry = {
  title: ['title', transform(String)],
  viewCount: ['viewCount', transform(Number)]
}

const getItems = 'data.entries'

const pipelines = {
  castEntry,
  getItems
}

// Tests

test('should apply pipeline by id', t => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits'
    },
    apply('castEntry')
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { hits: '45' }
  }
  const expected = {
    title: 'The heading',
    viewCount: 45
  }

  const ret = mapTransform(def, { pipelines })(data)

  t.deepEqual(ret, expected)
})

test('should apply path pipeline by id', t => {
  const def = [
    apply('getItems'),
    {
      title: 'content.heading'
    }
  ]
  const data = {
    data: {
      entries: {
        content: { heading: 'The heading' }
      }
    }
  }
  const expected = {
    title: 'The heading'
  }

  const ret = mapTransform(def, { pipelines })(data)

  t.deepEqual(ret, expected)
})

test('should apply pipeline by id in reverse', t => {
  const def = [
    apply('getItems'),
    {
      title: 'content.heading'
    }
  ]
  const data = {
    title: 'The heading'
  }
  const expected = {
    data: {
      entries: {
        content: { heading: 'The heading' }
      }
    }
  }

  const ret = mapTransform(def, { pipelines }).rev(data)

  t.deepEqual(ret, expected)
})

test('should do nothing when no pipelines is supplied', t => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits'
    },
    apply('castEntry')
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { hits: '45' }
  }
  const expected = {
    title: 'The heading',
    viewCount: '45'
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should apply pipeline as operation object', t => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits'
    },
    { $apply: 'castEntry' }
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { hits: '45' }
  }
  const expected = {
    title: 'The heading',
    viewCount: 45
  }

  const ret = mapTransform(def, { pipelines })(data)

  t.deepEqual(ret, expected)
})

test('should do nothing on unknown pipeline in operation object', t => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits'
    },
    { $apply: 'unknown' }
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { hits: '45' }
  }
  const expected = {
    title: 'The heading',
    viewCount: '45'
  }

  const ret = mapTransform(def, { pipelines })(data)

  t.deepEqual(ret, expected)
})