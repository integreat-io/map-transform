# MapTransform
Map and transform objects with mapping definitions.

Behind this boring name hides a powerful object transformer. There are a lot of
these around, but MapTransform's main differentiator is the mapping object,
which is a simple JavaScript object that defines every part of a transformation
up front, and by defining a mapping from one object, you would also define a
mapping back to the original format (with some gotchas).

Let's look at a simple example:

```javascript
import mapTransform from 'map-transform'

const mapping = {
  fields: {
    'title': 'content.headline',
    'author': 'meta.writer.username'
  },
  path: 'sections[0].articles'
}

const mapper = mapTransform(mapping)

// `mapper` is now a function that will always map as defined by `mapping`

const data = {
  sections: [
    {
      articles: [
        {
          content: {
            headline: 'Shocking news!',
            abstract: 'An insignificant event was hyped by the media.',
            date: '2018-05-31T18:43:01Z'
          },
          meta: {
            writer: {
              name: 'Fred Johnson',
              username: 'fredj'
            }
          }
        },
        {
          content: {
            headline: 'Even more shocking news!',
            abstract: 'The hyped event turned out to be significant after all.',
            date: '2018-05-31T19:01:17Z'
          },
          meta: {
            writer: {
              name: 'Martha Redding',
              username: 'marthar'
            }
          }
        }
      ]
    }
  ]
}

const mappedData = mapper(data)
// --> [
//   {
//     title: 'Shocking news!',
//     author: 'fredj'
//   },
//   {
//     title: 'Even more shocking news!',
//     author: 'marthar'
//   }
// ]
```

A mapper function may also be run the other way, by calling `mapper.rev(data)`:

```javascript
// Using the same mapper as in the first example:

const data = [
  {
    title: 'Shocking news!',
    author: 'fredj'
  },
  {
    title: 'Even more shocking news!',
    author: 'marthar'
  }
]

const revData = mapper.rev(data)
// --> {
//   sections: [
//     {
//       articles: [
//         {
//           content: {
//             headline: 'Shocking news!'
//           },
//           meta: {
//             writer: {
//               username: 'fredj'
//             }
//           }
//         },
//         {
//           content: {
//             headline: 'Even more shocking news!',
//           },
//           meta: {
//             writer: {
//               username: 'marthar'
//             }
//           }
//         }
//       ]
//     }
//   ]
// }
```

## Getting started

### Prerequisits

Requires node v8.6.

### Installing and using

Install from npm:

```
npm install map-transform --save
```

### Running the tests

The tests can be run with `npm test`.

## Contributing

Please read
[CONTRIBUTING](https://github.com/integreat-io/map-transform/blob/master/CONTRIBUTING.md)
for details on our code of conduct, and the process for submitting pull
requests.

## License

This project is licensed under the ISC License - see the
[LICENSE](https://github.com/integreat-io/map-transform/blob/master/LICENSE)
file for details.
