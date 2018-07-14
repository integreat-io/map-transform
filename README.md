# MapTransform

Map and transform objects with mapping definitions.

[![npm Version](https://img.shields.io/npm/v/map-transform.svg)](https://www.npmjs.com/package/map-transform)
[![Build Status](https://travis-ci.org/integreat-io/map-transform.svg?branch=master)](https://travis-ci.org/integreat-io/map-transform)
[![Coverage Status](https://coveralls.io/repos/github/integreat-io/map-transform/badge.svg?branch=master)](https://coveralls.io/github/integreat-io/map-transform?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/fbb6638a32ee5c5f60b7/maintainability)](https://codeclimate.com/github/integreat-io/map-transform/maintainability)

Behind this boring name hides a powerful object transformer. There are a lot of
these around, but MapTransform's main differentiator is the mapping definition
object, which is a simple JavaScript object that defines every part of a
transformation up front, and by defining a mapping from one object, you would
also define a mapping back to the original format (with some gotchas).

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

### Mapping definition

```javascript
{
  fields: {
    <path string>: {
      path: <path string>,
      default: <any value>,
      defaultRev: <any value>,
      transform: <transform pipeline>,
      transformRev: <transform pipeline>
    }
  },
  path: <path string>,
  pathRev: <path string>,
  pathTo: <path string>,
  pathToRev: <path string>,
  transform: <transform pipeline>,
  transformRev: <transform pipeline>,
  filter: <filter pipeline>
}
```

There are four path strings here, which are dot paths like `'documents.content'`.

First of all, if there's the `path` property on the root object is set, it is
used to retrieve an object or an array of objects from the source data. When
this `path` is not set, the source data is just used as is.

Then the `path` property of each field is used to retrieve field values from
the object(s) returned from the root `path`, using the value of `default` when
the path does not match a value in the source data.

Next, the path string used as keys for the object in `fields`, is used to set
each field value on the target object(s).

Finally, if a `pathTo` is set on the root object, the object or array of objects
we have at this point is set at this path on an empty object and returned.

When using the `rev()` method, this is performed in the opposite order, and
`defaultRev` is used as default value instead of `default`. If a `pathToRev` is
specified, it is used instead of `pathTo` when extracting _from_ the data (to is
now from - as confusing as that is), and a `pathRev` is used instead of `path` to
set the data on an empty object just before returning it.

There is a shortcut when defining fields without default values. The `fields`
object `{'title': 'content.heading'}` is exactly the same as `{'title': {path:
'content.heading'}}`.

The `transform` and `transformRev` props will transform a field or an object,
and should be set to a transform function or an array of transform functions,
also called a transform pipeline. A transform function is a pure function that
accepts a value and returns a value, and whatever happens between that is up to
the transform function. An array of transform functions will be run from left to
right, and each function will be called with the return value from the previous
function. The return value of the final function is set used as the field value
or the object.

Note that MapTransform does not put any restriction on the transform functions,
so it is up to you to make sure the transformations make sense for the field or
object it is used on.

A special feature of the transform pipeline, is that a transform function might
have another transform function specified on a `rev` prop, that should do the
opposite of the base function. When specifying a `transform` pipeline and no
`transformRev`, MapTransform will create a reverse pipeline from the `rev`
functions on the `transform` pipeline, which will be executed from right to
left. This might be handy in some cases, as you might have reusable transform
functions that will know how to reverse their transformations, and by defining
a transform pipeline, you also define the reverse option.

The `filter` prop lets you filter the transformed objects before they are set
on `pathTo` (if present) and returned. The filter pipeline is a filter function
or an array of filter functions, where each function accepts the transformed
object and returns true to include it and false to filter it out of the final
result. When several filter functions are set, all of them must return true for
the item to be included. The `filter` is used on reverse mapping as well,
directly after the items are extracted from any `pathTo`.

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
