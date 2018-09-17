import test from 'ava'
import { get } from '../funcs/getSet'

import { mapTransform, alt, value, fwd, rev } from '..'

test('should use default value', (t) => {
  const def = {
    title: [
      'content.heading',
      alt(value('Default heading'))
    ]
  }
  const data = [
    { content: {} },
    { content: { heading: 'From data' } }
  ]
  const expected = [
    { title: 'Default heading' },
    { title: 'From data' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use default value in array', (t) => {
  const def = {
    id: [
      'id',
      alt(get('key'))
    ]
  }
  const data = [
    { id: 'id1', key: 'key1' },
    { key: 'key2' }
  ]
  const expected = [
    { id: 'id1' },
    { id: 'key2' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set missing values to undefined when no default', (t) => {
  const def = {
    title: 'content.heading'
  }
  const data = [
    { content: {} },
    { content: { heading: 'From data' } }
  ]
  const expected = [
    { title: undefined },
    { title: 'From data' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use directional default value - forward', (t) => {
  const def = {
    title: [
      'content.heading',
      fwd(alt(value('Default heading'))),
      rev(alt(value('Wrong way')))
    ]
  }
  const data = [
    {},
    { content: { heading: 'From data' } }
  ]
  const expected = [
    { title: 'Default heading' },
    { title: 'From data' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use directional default value - reverse', (t) => {
  const def = {
    title: [
      'content.heading',
      fwd(alt(value('Wrong way'))),
      rev(alt(value('Default heading')))
    ]
  }
  const data = [
    {},
    { title: 'From data' }
  ]
  const expected = [
    { content: { heading: 'Default heading' } },
    { content: { heading: 'From data' } }
  ]

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should not use default values', (t) => {
  const def = {
    title: [
      'content.heading',
      alt(value('Default heading'))
    ]
  }
  const data = [
    { content: {} },
    { content: { heading: 'From data' } }
  ]
  const expected = [
    undefined,
    { title: 'From data' }
  ]

  const ret = mapTransform(def).onlyMappedValues(data)

  t.deepEqual(ret, expected)
})

test('should not set missing prop to undefined', (t) => {
  const def = {
    title: 'content.heading'
  }
  const data = [
    { content: {} },
    { content: { heading: 'From data' } }
  ]
  const expected = [
    undefined,
    { title: 'From data' }
  ]

  const ret = mapTransform(def).onlyMappedValues(data)

  t.deepEqual(ret, expected)
})

test('should not use default values on rev', (t) => {
  const def = {
    title: [
      'content.heading',
      alt(value('Default heading'))
    ]
  }
  const data = [
    {},
    { title: 'From data' }
  ]
  const expected = [
    undefined,
    { content: { heading: 'From data' } }
  ]

  const ret = mapTransform(def).rev.onlyMappedValues(data)

  t.deepEqual(ret, expected)
})
