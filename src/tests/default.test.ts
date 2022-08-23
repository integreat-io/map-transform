import test from 'ava'
import { mapTransform, alt, fwd, rev } from '..'
import value from '../operations/value'
import { get } from '../operations/getSet'

// Tests

test('should use default value', (t) => {
  const def = {
    $iterate: true,
    title: [alt('content.heading', value('Default heading'))],
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [{ title: 'Default heading' }, { title: 'From data' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use default value for null', (t) => {
  const optionsWithNullAsNoValue = { noneValues: [undefined, null] }
  const def = {
    $iterate: true,
    title: [alt('content.heading', value('Default heading'))],
  }
  const data = [
    { content: { heading: null } },
    { content: { heading: 'From data' } },
  ]
  const expected = [{ title: 'Default heading' }, { title: 'From data' }]

  const ret = mapTransform(def, optionsWithNullAsNoValue)(data)

  t.deepEqual(ret, expected)
})

test('should use default value in array', (t) => {
  const def = {
    $iterate: true,
    id: [alt('id', get('key'))],
  }
  const data = [{ id: 'id1', key: 'key1' }, { key: 'key2' }]
  const expected = [{ id: 'id1' }, { id: 'key2' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use default value in reverse', (t) => {
  const def = {
    $iterate: true,
    title: alt('content.heading', rev(value('Default heading'))),
  }
  const data = [{}, { title: 'From data' }]
  const expected = [
    { content: { heading: 'Default heading' } },
    { content: { heading: 'From data' } },
  ]

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should run function as default value', (t) => {
  const def = {
    $iterate: true,
    title: [
      alt(
        'content.heading',
        value(() => 'Default from function')
      ),
    ],
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [{ title: 'Default from function' }, { title: 'From data' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use alternative path', (t) => {
  const def = {
    $iterate: true,
    title: [alt('heading', 'headline')],
  }
  const data = [{ heading: 'Entry 1' }, { headline: 'Entry 2' }]
  const expected = [{ title: 'Entry 1' }, { title: 'Entry 2' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use alternative path with dot notation', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should not set on alternative path in reverse', (t) => {
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

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should set missing values to undefined when no default', (t) => {
  const def = {
    $iterate: true,
    title: 'content.heading',
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [{ title: undefined }, { title: 'From data' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use directional default value - forward', (t) => {
  const def = {
    $iterate: true,
    title: [
      alt(
        'content.heading',
        fwd(value('Default heading')),
        rev(value('Wrong way'))
      ),
    ],
  }
  const data = [{}, { content: { heading: 'From data' } }]
  const expected = [{ title: 'Default heading' }, { title: 'From data' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use directional default value - reverse', (t) => {
  const def = {
    $iterate: true,
    title: [
      alt(
        'content.heading',
        fwd(value('Wrong way')),
        rev(value('Default heading'))
      ),
    ],
  }
  const data = [{}, { title: 'From data' }]
  const expected = [
    { content: { heading: 'Default heading' } },
    { content: { heading: 'From data' } },
  ]

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test.failing('should not use default values', (t) => {
  const def = {
    $iterate: true,
    title: [alt('content.heading', value('Default heading'))],
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [undefined, { title: 'From data' }]

  const ret = mapTransform(def).onlyMappedValues(data)

  t.deepEqual(ret, expected)
})

test.failing('should map with missing data', (t) => {
  const def = [
    'data',
    {
      id: 'id',
      attributes: 'attributes',
      relationships: 'relationships',
    },
  ]
  const data = { data: { id: 'item', type: 'other' } }
  const expected = {
    id: 'item',
  }

  const ret = mapTransform(def).onlyMappedValues(data)

  t.deepEqual(ret, expected)
})

test.failing('should not set missing prop to undefined in array', (t) => {
  const def = {
    $iterate: true,
    title: 'content.heading',
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [undefined, { title: 'From data' }]

  const ret = mapTransform(def).onlyMappedValues(data)

  t.deepEqual(ret, expected)
})

test.failing('should not use default values on rev', (t) => {
  const def = {
    $iterate: true,
    title: [alt('content.heading', value('Default heading'))],
  }
  const data = [{}, { title: 'From data' }]
  const expected = [undefined, { content: { heading: 'From data' } }]

  const ret = mapTransform(def).rev.onlyMappedValues(data)

  t.deepEqual(ret, expected)
})

test('should return undefined for undefined', (t) => {
  const def = {
    title: 'content.heading',
  }
  const data = undefined
  const expected = undefined

  const ret = mapTransform(def).onlyMappedValues(data)

  t.deepEqual(ret, expected)
})

test('should apply default value from an operation object', (t) => {
  const def = [
    '[]',
    {
      $iterate: true,
      title: [{ $alt: ['content.heading', { $value: 'Default heading' }] }],
    },
  ]
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [{ title: 'Default heading' }, { title: 'From data' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should apply default value to null from an operation object', (t) => {
  const def = [
    '[]',
    {
      $iterate: true,
      title: {
        $alt: [
          'content.heading',
          {
            $value: 'Default heading',
          },
        ],
        $undefined: ['**undefined**', null],
      },
    },
  ]
  const data = [
    { content: { heading: null } },
    { content: { heading: 'From data' } },
  ]
  const expected = [{ title: 'Default heading' }, { title: 'From data' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should apply default value through iteration of operation object', (t) => {
  const def = {
    $alt: ['heading', { $value: 'Default heading' }],
    $iterate: true,
  }
  const data = [{}, { heading: 'From data' }]
  const expected = ['Default heading', 'From data']

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test.failing(
  'should apply default value from an operation object going forward only',
  (t) => {
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
    const dataRev = undefined
    const expectedRev = { content: { heading: undefined } }

    const retFwd = mapTransform(def)(dataFwd)
    const retRev = mapTransform(def).rev(dataRev)

    t.deepEqual(retFwd, expectedFwd)
    t.deepEqual(retRev, expectedRev)
  }
)

test.failing(
  'should apply default value from an operation object going in reverse only',
  (t) => {
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
    const dataRev = undefined
    const expectedRev = { content: { heading: 'Default heading' } }

    const retFwd = mapTransform(def)(dataFwd)
    const retRev = mapTransform(def).rev(dataRev)

    t.deepEqual(retFwd, expectedFwd)
    t.deepEqual(retRev, expectedRev)
  }
)

test('should apply default in iterated deep structure', (t) => {
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

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})
