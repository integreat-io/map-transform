import test from 'ava'
import { mapTransformSync } from '../index.js'

// Tests

test('should use $alt to provide a default value', (t) => {
  const def = {
    $iterate: true,
    title: { $alt: ['content.heading', { $value: 'Default heading' }] },
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [{ title: 'Default heading' }, { title: 'From data' }]

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should use $alt with only one pipeline', (t) => {
  const def = { $alt: [{ $value: 'No value' }] }
  const data = undefined
  const expected = 'No value'

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should treat null as a non-value', (t) => {
  const optionsWithNullAsNoValue = { nonvalues: [undefined, null] }
  const def = {
    $iterate: true,
    title: { $alt: ['content.heading', { $value: 'Default heading' }] },
  }
  const data = [
    { content: { heading: null } },
    { content: { heading: 'From data' } },
  ]
  const expected = [{ title: 'Default heading' }, { title: 'From data' }]

  const ret = mapTransformSync(def, optionsWithNullAsNoValue)(data)

  t.deepEqual(ret, expected)
})

test('should run $alt in iteration', (t) => {
  const def = {
    $iterate: true,
    id: { $alt: ['id', 'key'] },
  }
  const data = [{ id: 'id1', key: 'key1' }, { key: 'key2' }]
  const expected = [{ id: 'id1' }, { id: 'key2' }]

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should run $alt in reverse', (t) => {
  const def = {
    $iterate: true,
    title: {
      $alt: [
        'content.heading',
        { $value: 'Default heading', $direction: 'rev' },
      ],
    },
  }
  const data = [{}, { title: 'From data' }]
  const expected = [
    { content: { heading: 'Default heading' } },
    { content: { heading: 'From data' } },
  ]

  const ret = mapTransformSync(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should run function in $value', (t) => {
  const def = {
    $iterate: true,
    title: {
      $alt: ['content.heading', { $value: () => 'Default from function' }],
    },
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [{ title: 'Default from function' }, { title: 'From data' }]

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should use alternative path', (t) => {
  const def = {
    $iterate: true,
    title: { $alt: ['heading', 'headline'] },
  }
  const data = [{ heading: 'Entry 1' }, { headline: 'Entry 2' }]
  const expected = [{ title: 'Entry 1' }, { title: 'Entry 2' }]

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should use alternative path with dot notation', (t) => {
  const def = {
    $iterate: true,
    attributes: {
      title: { $alt: ['content.heading', 'content.headline'] },
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

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should not set on alternative path in reverse', (t) => {
  const def = {
    $iterate: true,
    attributes: {
      title: { $alt: ['content.heading', 'content.headline'] },
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

  const ret = mapTransformSync(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should set missing values to undefined when no default', (t) => {
  const def = {
    $iterate: true,
    title: 'content.heading',
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [{ title: undefined }, { title: 'From data' }]

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should use directional default value - forward', (t) => {
  const def = {
    $iterate: true,
    title: {
      $alt: [
        'content.heading',
        { $value: 'Default heading', $direction: 'fwd' },
        { $value: 'Wrong way', $direction: 'rev' },
      ],
    },
  }
  const data = [{}, { content: { heading: 'From data' } }]
  const expected = [{ title: 'Default heading' }, { title: 'From data' }]

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should use directional default value - reverse', (t) => {
  const def = {
    $iterate: true,
    title: {
      $alt: [
        'content.heading',
        { $value: 'Wrong way', $direction: 'fwd' },
        { $value: 'Default heading', $direction: 'rev' },
      ],
    },
  }
  const data = [{}, { title: 'From data' }]
  const expected = [
    { content: { heading: 'Default heading' } },
    { content: { heading: 'From data' } },
  ]

  const ret = mapTransformSync(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should not use default values', (t) => {
  const def = {
    $iterate: true,
    $noDefaults: true,
    title: { $alt: ['content.heading', { $value: 'Default heading' }] },
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [undefined, { title: 'From data' }]

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should not set missing data when $noDefaults is true', (t) => {
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
  const expected = { id: 'item' }

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should not set undefined on prop in array when $noDefaults is true', (t) => {
  const def = {
    $iterate: true,
    $noDefaults: true,
    title: 'content.heading',
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [undefined, { title: 'From data' }]

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should not force nonvalue to empty array when $noDefaults is true', (t) => {
  const def = {
    $iterate: true,
    $noDefaults: true,
    id: 'id',
    items: 'content[]',
  }
  const options = { nonvalues: [undefined, null] }
  const data = { id: 'ent1', content: null }
  const expected = { id: 'ent1' }

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should not force nonvalue to empty array when $noDefaults is true - flipped', (t) => {
  const def = {
    $iterate: true,
    $flip: true,
    $noDefaults: true,
    id: 'id',
    content: 'items[]',
  }
  const options = { nonvalues: [undefined, null] }
  const data = { id: 'ent1', content: null }
  const expected = { id: 'ent1' }

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should not use default values on rev', (t) => {
  const def = {
    $iterate: true,
    $noDefaults: true,
    title: { $alt: ['content.heading', { $value: 'Default heading' }] },
  }
  const data = [{}, { title: 'From data' }]
  const expected = [undefined, { content: { heading: 'From data' } }]

  const ret = mapTransformSync(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should not force nonvalue to empty array when $noDefaults is true in reverse', (t) => {
  const def = {
    $iterate: true,
    $noDefaults: true,
    id: 'id',
    items: 'content[]',
  }
  const options = { nonvalues: [undefined, null] }
  const data = { id: 'ent1', items: null }
  const expected = { id: 'ent1' }

  const ret = mapTransformSync(def, options)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should not force non-value to empty array when $noDefaults is true and applied from a pipeline', (t) => {
  const def = { $apply: 'entry', $noDefaults: true }
  const pipelines = {
    entry: { $iterate: true, id: 'id', items: 'content[]' },
  }
  const options = { nonvalues: [undefined, null], pipelines }
  const data = { id: 'ent1', content: null }
  const expected = { id: 'ent1' }

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should not use default values when noDefault is provided on initial state', (t) => {
  const noDefaults = true
  const def = {
    $iterate: true,
    title: { $alt: ['content.heading', { $value: 'Default heading' }] },
  }
  const data = [{ content: {} }, { content: { heading: 'From data' } }]
  const expected = [undefined, { title: 'From data' }]

  const ret = mapTransformSync(def)(data, { noDefaults })

  t.deepEqual(ret, expected)
})

test('should return undefined for undefined', (t) => {
  const def = {
    $noDefaults: true,
    title: 'content.heading',
  }
  const data = undefined
  const expected = undefined

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should stay on the right context level when using $alt after a path that doesn not exist', (t) => {
  const def = ['content', { $alt: ['$value', '.'] }]
  const data = { other: 'Do not include' }
  const expected = undefined

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should apply default value from an operation object in reverse', (t) => {
  const def = [
    '[]',
    {
      $iterate: true,
      title: [
        {
          $alt: ['content.heading', { $value: 'Default heading' }],
        },
      ],
    },
  ]
  const data = [{}, { title: 'From data' }]
  const expected = [
    { content: { heading: 'Default heading' } },
    { content: { heading: 'From data' } },
  ]

  const ret = mapTransformSync(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should apply default value from an operation object in flipped reverse', (t) => {
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

  const ret = mapTransformSync(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should apply default value to null from an operation object', (t) => {
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

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should apply default value through iteration of operation object', (t) => {
  const def = {
    $alt: ['heading', { $value: 'Default heading' }],
    $iterate: true,
  }
  const data = [{}, { heading: 'From data' }]
  const expected = ['Default heading', 'From data']

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should preserve context during alt paths', (t) => {
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

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should preserve context during alt paths when not in a root pipeline', (t) => {
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

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should provide correct context for parent during alt paths', (t) => {
  const def = [
    'items[]',
    {
      $iterate: true,
      article: [
        { $alt: ['content', 'original'] },
        { id: '^.id', title: 'title', note: 'text' },
      ],
    },
  ]
  const data = {
    items: [
      { id: '12345', content: { title: 'Entry 12345', text: 'Awesome text' } },
      { id: '12346', original: { title: 'Entry 12346', text: 'Marvelous' } },
    ],
  }
  const expected = [
    { article: { id: '12345', title: 'Entry 12345', note: 'Awesome text' } },
    { article: { id: '12346', title: 'Entry 12346', note: 'Marvelous' } },
  ]

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should provide correct context for parent during alt paths with different number of levels', (t) => {
  const def = [
    'items[]',
    {
      $iterate: true,
      article: [
        { $alt: ['content', 'original.content'] },
        { id: '^.id', title: 'title', note: 'text' },
      ],
    },
  ]
  const data = {
    items: [
      { id: '12345', content: { title: 'Entry 12345', text: 'Awesome text' } },
      {
        original: {
          id: '12346',
          content: { title: 'Entry 12346', text: 'Marvelous' },
        },
      },
    ],
  }
  const expected = [
    { article: { id: '12345', title: 'Entry 12345', note: 'Awesome text' } },
    { article: { id: '12346', title: 'Entry 12346', note: 'Marvelous' } },
  ]

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should provide correct context for parent when all alt pipelines return undefined', (t) => {
  const def = [
    'items[]',
    {
      $iterate: true,
      title: [
        { $alt: ['original.heading', 'content.title', 'content.headline'] },
        '^.id', // The reason for this odd looking use of parent, is that the $alt operation will push the pipeline value to the context when getting `undefined`, so we need to go up again one level to get the id
      ],
    },
  ]
  const data = {
    items: [{ id: '12345' }, { id: '12346' }],
  }
  const expected = [{ title: '12345' }, { title: '12346' }]

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should provide correct context for parent during alt paths that moves us further down', (t) => {
  const def = [
    'items[]',
    {
      $iterate: true,
      title: [{ $alt: ['content', 'original.content'] }, 'article', '^.id'],
    },
  ]
  const data = {
    items: [
      { content: { id: '12345', article: { title: 'The title' } } },
      {
        original: {
          content: { id: '12346', article: { heading: 'The heading' } },
        },
      },
    ],
  }
  const expected = [{ title: '12345' }, { title: '12346' }]

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

// Note: This is a breaking change from the old way, as we do not support the
// special case for alt with only one pipeline.
test('should provide correct context for parent when alt yields no value', (t) => {
  const def = [
    'items[]',
    {
      $iterate: true,
      title: ['title', { $alt: ['heading'] }, '^.^.id'], // This path doesn't make sense, but does the job of testing the context
    },
  ]
  const data = {
    items: [
      { id: '12345', title: 'The title' },
      { id: '12346', heading: 'The heading' },
    ],
  }
  const expected = [{ title: '12345' }, { title: '12346' }]

  const ret = mapTransformSync(def)(data)

  t.deepEqual(ret, expected)
})

test('should apply default value from an operation object going in reverse only', (t) => {
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

  const retFwd = mapTransformSync(def)(dataFwd)
  const retRev = mapTransformSync(def)(dataRev, { rev: true })

  t.deepEqual(retFwd, expectedFwd)
  t.deepEqual(retRev, expectedRev)
})

// TODO?
// test('should apply default in iterated deep structure', (t) => {
//   const def = [
//     'data',
//     {
//       $iterate: true,
//       attributes: {
//         title: 'heading',
//         num: { $alt: ['values.first', fwd('values.second')] },
//       },
//     },
//   ]
//   const data = {
//     data: [
//       { values: { first: 1 }, heading: 'First' },
//       { values: { second: 2 }, heading: 'Second' },
//     ],
//   }
//   const expected = [
//     { attributes: { title: 'First', num: 1 } },
//     { attributes: { title: 'Second', num: 2 } },
//   ]

//   const ret = mapTransform(def)(data)

//   t.deepEqual(ret, expected)
// })
