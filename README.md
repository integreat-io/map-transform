# MapTransform

Map and transform objects with mapping definitions.

[![npm Version](https://img.shields.io/npm/v/map-transform.svg)](https://www.npmjs.com/package/map-transform)
[![Build Status](https://travis-ci.org/integreat-io/map-transform.svg?branch=master)](https://travis-ci.org/integreat-io/map-transform)
[![Coverage Status](https://coveralls.io/repos/github/integreat-io/map-transform/badge.svg?branch=master)](https://coveralls.io/github/integreat-io/map-transform?branch=master)
[![Dependencies Status](https://tidelift.com/badges/github/integreat-io/map-transform?style=flat)](https://tidelift.com/subscriber/github/integreat-io/repositories/map-transform)
[![Maintainability](https://api.codeclimate.com/v1/badges/fbb6638a32ee5c5f60b7/maintainability)](https://codeclimate.com/github/integreat-io/map-transform/maintainability)

Behind this boring name hides a powerful object transformer. There are a lot of
these around, but MapTransform has some differentating features:
- You pretty much define the transformation by creating the JavaScript object
you want as a result, setting paths and transformation functions, etc. where
they apply.
- There's a concept of a transform pipeline, that your data is passed through,
and you define pipelines anywhere you'd like on the target object.
- By defining a mapping from one object to another, you have at the same time
defined a mapping back to the original format (with some gotchas).

Let's look at a simple example:

```javascript
import mapTransform from 'map-transform'

const def = [
  'sections[0].articles',
  {
    title: 'content.headline',
    author: 'meta.writer.username'
  }
]

const mapper = mapTransform(def)

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

**Note:** This description is obsolete. All the same features (and more) will be
available in version 0.2, but with different syntax.

```javascript
{
  filterFrom: <filter pipeline>,
  filterFromRev: <filter pipeline>,
  pathFrom: <path string>,
  pathFromRev: <path string>,
  transformFrom: <transform pipeline>,
  transformFromRev: <transform pipeline>,
  mapping: {
    <path string>: {
      path: <path string>,
      default: <any value>,
      defaultRev: <any value>,
      transform: <transform pipeline>,
      transformRev: <transform pipeline>
    }
  },
  transformTo: <transform pipeline>,
  transformToRev: <transform pipeline>,
  filterTo: <filter pipeline>,
  filterToRev: <filter pipeline>,
  pathTo: <path string>,
  pathToRev: <path string>
}
```

(The order of the props hints at the order in which they are applied during the
mapping process.)

There are four path strings here (plus the ones ending in 'Rev'), which are dot
paths like e.g. `'documents.content'`.

First of all, if there's the `pathFrom` property on the root object is set, with
`path` as a handy alias. It is used to retrieve an object or an array of objects
from the source data. When this `path` is not set, the source data is just used
as is.

Then the `path` property of each object on `mapping`, is used to retrieve field
values from the object(s) returned from the root `path`, using the value of
`default` when the path does not match a value in the source data.

Next, the path string used as keys for the object in `mapping`, is used to set
each value on the target object(s).

Finally, if a `pathTo` is set on the root object, the object or array of objects
we have at this point is set at this path on an empty object and returned.

When using the `rev()` method, this is performed in the opposite order, and
`defaultRev` is used as default value instead of `default`. If a `pathToRev` is
specified, it is used instead of `pathTo` when extracting _from_ the data (to is
now from - as confusing as that is), and a `pathRev` or `pathFromRev` is used
instead of `path` or `pathRev` to set the data on an empty object just before
returning it.

There is a shortcut when defining mappings without default values. The `mapping`
object `{'title': 'content.heading'}` is exactly the same as `{'title': {path:
'content.heading'}}`.

The `path` properties below the `mapping` object will relate to the data
extracted and transformed (see below) by the definition properties on the root
object. If you need to get values from the original data object, prefix the path
with a `$`. E.g. when mapping items from `content.items[]`, a field may still
have a path like `$meta.author.id` to retrieve a value from the root of the
original data. Note that `$` paths will never be used to set values, as this
could lead to many items setting the same root property, which would be
unpredictable.

The `transformTo` and `transformToRev` props, with `transform` and
`transformRev` as aliases, will transform a field or an object, and should be
set to a transform function or an array of transform functions, also called a
transform pipeline. A transform function is a pure function that accepts a value
and returns a value, and whatever happens between that is up to the transform
function. An array of transform functions will be run from left to right, and
each function will be called with the return value from the previous function.
The return value of the final function is set used as the field value or the
object.

There's also `tranformFrom` and `transformFromRev`, which are applied just
before the field mapping (or after in a reverse mapping).

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

The filter props lets you filter the transformed objects at different stages in
the process. The most common is perhaps `filterTo`, with the alias `filter`,
that will be applied just before the transformed data is set on `pathTo`
(if present). The filter pipeline is a filter function or an array of filter
functions, where each function accepts the object as it is at that time in the
mapping process, and returns true to include it and false to filter it out of
the final result. When several filter functions are set, all of them must return
true for the item to be included.

The filter pipelines are used on reverse mapping as well, in the opposite order.
They all have reverse counterparts with the 'Rev' postfix, and these might be
set to `null` to keep a filter pipeline from being applied on reverse mapping.

The `mapping` object defines the shape of the target item(s) to map _to_, with
options for how values _from_ the source object should be mapped to it. Another
way of specifying this shape, is simply supplying it as nested objects. In the
following example, `def1` and `def2` are two ways of defining the exact same
mapping, it's simply a matter of taste:

```
const def1 = {
  mapping: {
    'attributes.title': {path: 'headline', default: 'Untitled'},
    'attributes.text': 'content.text'
  }
}

const def2 = {
  mapping: {
    attributes: {
      title: {path: 'headline', default: 'Untitled'},
      text: 'content.text'
    }
  }
}
```

The only difference is that `path` is a reserved property name in mapping
definitions unless it is set directly on the `mapping` object, so to map to an
object with a `path` property, you will have to use the dot notation.

```
// NOT okay:
const def3 = {
  mapping: {
    attributes: {
      path: { path: 'meta.path'}
    }
  }
}

// Okay:
const def4 = {
  mapping: {
    'attributes.path': { path: 'meta.path' }
  }
}
```

In some cases, you might want to include only values that are present in the
source and not use `default` and `defaultRev`. To do this, call
`mapTransform(def).noDefaults(data)` or
`mapTransform(def).rev.noDefaults(data)`. Any property that is not found in
the data will not be set in the resulting object, neither with default value
nor `undefined`.

Filters, transforms, and mappings are applied in the following order:
- pathFrom (alias: path)
- filterFrom
- transformFrom
- mapping
  - path
  - transform
  - pathTo (the prop)
- transformTo (alias: transform)
- filterTo (alias: filter)
- pathTo

When reverse mapping, the order is the exact opposite, but keep in mind that
transform pipelines will use the `.rev()` functions instead, and everything
except the mapping may have a reverse version, e.g. `filterToRev`.

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
