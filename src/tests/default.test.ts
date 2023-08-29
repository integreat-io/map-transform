import test from 'ava'
import mapTransform, { alt, fwd, rev, transform } from '../index.js'
import { value } from '../transformers/value.js'
import { get } from '../operations/getSet.js'

// Tests

test('should use default value', async (t) => {
  const def = {
    $iterate: true,
    title: [alt('content.heading', transform(value('Default heading')))],
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [{ title: 'Default heading' }, { title: 'From data' }]

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use default value on root', async (t) => {
  const def = alt(transform(value('No value')))
  const data = undefined
  const expected = 'No value'

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use default value for null', async (t) => {
  const optionsWithNullAsNoValue = { nonvalues: [undefined, null] }
  const def = {
    $iterate: true,
    title: [alt('content.heading', transform(value('Default heading')))],
  }
  const data = [
    { content: { heading: null } },
    { content: { heading: 'From data' } },
  ]
  const expected = [{ title: 'Default heading' }, { title: 'From data' }]

  const ret = await mapTransform(def, optionsWithNullAsNoValue)(data)

  t.deepEqual(ret, expected)
})

test('should use default value in array', async (t) => {
  const def = {
    $iterate: true,
    id: [alt('id', get('key'))],
  }
  const data = [{ id: 'id1', key: 'key1' }, { key: 'key2' }]
  const expected = [{ id: 'id1' }, { id: 'key2' }]

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use default value in reverse', async (t) => {
  const def = {
    $iterate: true,
    title: alt('content.heading', rev(transform(value('Default heading')))),
  }
  const data = [{}, { title: 'From data' }]
  const expected = [
    { content: { heading: 'Default heading' } },
    { content: { heading: 'From data' } },
  ]

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should run function as default value', async (t) => {
  const def = {
    $iterate: true,
    title: [
      alt('content.heading', transform(value(() => 'Default from function'))),
    ],
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [{ title: 'Default from function' }, { title: 'From data' }]

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use alternative path', async (t) => {
  const def = {
    $iterate: true,
    title: [alt('heading', 'headline')],
  }
  const data = [{ heading: 'Entry 1' }, { headline: 'Entry 2' }]
  const expected = [{ title: 'Entry 1' }, { title: 'Entry 2' }]

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use alternative path with dot notation', async (t) => {
  const def = {
    $iterate: true,
    attributes: {
      title: [alt('content.heading', 'content.headline')],
    },
  }
  const data = [
    { content: { heading: 'Entry 1' } },
    { content: { headline: 'Entry 2' } },
  ]
  const expected = [
    { attributes: { title: 'Entry 1' } },
    { attributes: { title: 'Entry 2' } },
  ]

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should not set on alternative path in reverse', async (t) => {
  const def = {
    $iterate: true,
    attributes: {
      title: [alt('content.heading', 'content.headline')],
    },
  }
  const data = [
    { attributes: { title: 'Entry 1' }, content: { headline: 'Not this one' } },
    { attributes: { title: 'Entry 2' } },
  ]
  const expected = [
    { content: { heading: 'Entry 1' } },
    { content: { heading: 'Entry 2' } },
  ]

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should set missing values to undefined when no default', async (t) => {
  const def = {
    $iterate: true,
    title: 'content.heading',
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [{ title: undefined }, { title: 'From data' }]

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use directional default value - forward', async (t) => {
  const def = {
    $iterate: true,
    title: [
      alt(
        'content.heading',
        fwd(transform(value('Default heading'))),
        rev(transform(value('Wrong way')))
      ),
    ],
  }
  const data = [{}, { content: { heading: 'From data' } }]
  const expected = [{ title: 'Default heading' }, { title: 'From data' }]

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use directional default value - reverse', async (t) => {
  const def = {
    $iterate: true,
    title: [
      alt(
        'content.heading',
        fwd(transform(value('Wrong way'))),
        rev(transform(value('Default heading')))
      ),
    ],
  }
  const data = [{}, { title: 'From data' }]
  const expected = [
    { content: { heading: 'Default heading' } },
    { content: { heading: 'From data' } },
  ]

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should not use default values', async (t) => {
  const def = {
    $iterate: true,
    $noDefaults: true,
    title: [alt('content.heading', transform(value('Default heading')))],
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [undefined, { title: 'From data' }]

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should not set missing data when $noDefaults is true', async (t) => {
  const def = [
    'data',
    {
      $noDefaults: true,
      id: 'id',
      attributes: 'attributes',
      relationships: 'relationships',
    },
  ]
  const data = { data: { id: 'item', type: 'other' } }
  const expected = {
    id: 'item',
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should not set missing prop to undefined in array', async (t) => {
  const def = {
    $iterate: true,
    $noDefaults: true,
    title: 'content.heading',
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [undefined, { title: 'From data' }]

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should not use default values on rev', async (t) => {
  const def = {
    $iterate: true,
    $noDefaults: true,
    title: [alt('content.heading', transform(value('Default heading')))],
  }
  const data = [{}, { title: 'From data' }]
  const expected = [undefined, { content: { heading: 'From data' } }]

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should not use default values when noDefault is provided on initial state', async (t) => {
  const noDefaults = true
  const def = {
    $iterate: true,
    title: [alt('content.heading', transform(value('Default heading')))],
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [undefined, { title: 'From data' }]

  const ret = await mapTransform(def)(data, { noDefaults })

  t.deepEqual(ret, expected)
})

test('should return undefined for undefined', async (t) => {
  const def = {
    $noDefaults: true,
    title: 'content.heading',
  }
  const data = undefined
  const expected = undefined

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should apply default value from an operation object', async (t) => {
  const def = [
    '[]',
    {
      $iterate: true,
      title: [{ $alt: ['content.heading', { $value: 'Default heading' }] }],
    },
  ]
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [{ title: 'Default heading' }, { title: 'From data' }]

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should apply default value from an operation object in reverse', async (t) => {
  const def = [
    '[]',
    {
      $iterate: true,
      title: [{ $alt: ['content.heading', { $value: 'Default heading' }] }],
    },
  ]
  const data = [{}, { title: 'From data' }]
  const expected = [
    { content: { heading: 'Default heading' } },
    { content: { heading: 'From data' } },
  ]

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should apply default value from an operation object in flipped reverse', async (t) => {
  const def = [
    '[]',
    {
      $flip: true,
      $iterate: true,
      title: [{ $alt: ['content.heading', { $value: 'Default heading' }] }],
    },
  ]
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [{ title: 'Default heading' }, { title: 'From data' }]

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should apply default value to null from an operation object', async (t) => {
  const def = [
    '[]',
    {
      $iterate: true,
      title: {
        $alt: ['content.heading', { $value: 'Default heading' }],
        $undefined: ['**undefined**', null],
      },
    },
  ]
  const data = [
    { content: { heading: null } },
    { content: { heading: 'From data' } },
  ]
  const expected = [{ title: 'Default heading' }, { title: 'From data' }]

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should apply default value through iteration of operation object', async (t) => {
  const def = {
    $alt: ['heading', { $value: 'Default heading' }],
    $iterate: true,
  }
  const data = [{}, { heading: 'From data' }]
  const expected = ['Default heading', 'From data']

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

// The problem here is that every pipeline given to $alt gets the original value,
// and when the $value is skipped due to $direction, it simply returns this
// value untouched. This results in the original value being returned instead of
// the undefined from the first path
test('should apply default value from an operation object going forward only', async (t) => {
  const def = {
    title: {
      $alt: [
        'content.heading',
        { $value: 'Default heading', $direction: 'fwd' },
      ],
    },
  }
  const dataFwd = { content: {} }
  const expectedFwd = { title: 'Default heading' }
  const dataRev = { content: {} }
  const expectedRev = { content: { heading: undefined } }

  const retFwd = await mapTransform(def)(dataFwd)
  const retRev = await mapTransform(def)(dataRev, { rev: true })

  t.deepEqual(retFwd, expectedFwd)
  t.deepEqual(retRev, expectedRev)
})

test('should preserve context during alt paths', async (t) => {
  const def = [
    'items[]',
    {
      $iterate: true,
      title: [{ $alt: ['content.heading', 'content.title'] }, '^^.id'], // This path doesn't make sense, but does the job of testing the context
    },
  ]
  const data = {
    items: [
      { content: { title: 'The title' } },
      { content: { heading: 'The heading' } },
    ],
    id: '12345',
  }
  const expected = [{ title: '12345' }, { title: '12345' }]

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should preserve context during alt paths on top level object', async (t) => {
  const def = {
    'ids[]': ['response', { $alt: ['items', 'entries'] }, '^^.id'], // This path doesn't make sense, but does the job of testing the context
  }
  const data = {
    response: {
      items: [
        { content: { title: 'The title' } },
        { content: { heading: 'The heading' } },
      ],
    },
    id: '12345',
  }
  const expected = {
    ids: ['12345'],
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

// The problem here is that every pipeline given to $alt gets the original value,
// and when the $value is skipped due to $direction, it simply returns this
// value untouched. This results in the original value being returned instead of
// the undefined from the first path
test('should apply default value from an operation object going in reverse only', async (t) => {
  const def = {
    title: {
      $alt: [
        'content.heading',
        { $value: 'Default heading', $direction: 'rev' },
      ],
    },
  }
  const dataFwd = { content: {} }
  const expectedFwd = { title: undefined }
  const dataRev = { content: {} }
  const expectedRev = { content: { heading: 'Default heading' } }

  const retFwd = await mapTransform(def)(dataFwd)
  const retRev = await mapTransform(def)(dataRev, { rev: true })

  t.deepEqual(retFwd, expectedFwd)
  t.deepEqual(retRev, expectedRev)
})

test('should apply default in iterated deep structure', async (t) => {
  const def = [
    'data',
    {
      $iterate: true,
      attributes: {
        title: 'heading',
        num: alt('values.first', fwd('values.second')),
      },
    },
  ]
  const data = {
    data: [
      { values: { first: 1 }, heading: 'First' },
      { values: { second: 2 }, heading: 'Second' },
    ],
  }
  const expected = [
    { attributes: { title: 'First', num: 1 } },
    { attributes: { title: 'Second', num: 2 } },
  ]

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})
