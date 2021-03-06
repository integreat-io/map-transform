# MapTransform

Map and transform objects with mapping definitions.

[![npm Version](https://img.shields.io/npm/v/map-transform.svg)](https://www.npmjs.com/package/map-transform)
[![Build Status](https://travis-ci.org/integreat-io/map-transform.svg?branch=master)](https://travis-ci.org/integreat-io/map-transform)
[![Coverage Status](https://coveralls.io/repos/github/integreat-io/map-transform/badge.svg?branch=master)](https://coveralls.io/github/integreat-io/map-transform?branch=master)
[![Dependencies Status](https://tidelift.com/badges/github/integreat-io/map-transform?style=flat)](https://tidelift.com/subscriber/github/integreat-io/repositories/map-transform)
[![Maintainability](https://api.codeclimate.com/v1/badges/fbb6638a32ee5c5f60b7/maintainability)](https://codeclimate.com/github/integreat-io/map-transform/maintainability)

Behind this boring name hides a powerful object transformer.

Some highlighted features:

- You pretty much define the transformation by creating the JavaScript object
  you want as a result, setting paths and transformation functions, etc. where
  they apply.
- There's a concept of a transform pipeline, that your data is passed through,
  and you define pipelines anywhere you'd like on the target object.
- By defining a mapping from one object to another, you have at the same time
  defined a mapping back to the original format (with some gotchas).

Let's look at a simple example:

```javascript
const { mapTransform } = require('map-transform')

// You have this object
const source = {
  data: [
    {
      content: {
        name: 'An interesting piece',
        meta: {
          author: 'fredj',
          date: 1533750490952
        }
      }
    }
  ]
}

// You describe the object you want
const def = {
  title: 'data[0].content.name',
  author: 'data[0].content.meta.author',
  date: 'data[0].content.meta.date'
}

// You feed it to mapTransform and get a map function
const mapper = mapTransform(def)

// Now, run the source object through the mapper and get what you want
const target = mapper(source)
// --> {
//   title: 'An interesting piece',
//   author: 'fredj',
//   date: 1533750490952
// }

// And run it in reverse to get to what you started with:
const source2 = mapper.rev(target)
// -> {
  data: [
    {
      content: {
        name: 'An interesting piece'
      },
      meta: {
        author: 'fredj',
        date: 1533750490952
      }
    },
  ]
}
```

You may improve this with pipelines, expressed through arrays. For instance,
retrieve the `content` object first, so you don't have to write the entire
path for every attribute:

```javascript
const def2 = [
  'data[0].content',
  {
    title: 'name',
    author: 'meta.author',
    date: 'meta.date'
  }
]

const target2 = mapTransform(def2)(source)
// --> {
//   title: 'An interesting piece',
//   author: 'fredj',
//   date: 1533750490952
// }
```

Maybe you want the actual date instead of the microseconds since the seventies:

```javascript
const { mapTransform, transform } = require('map-transform')

// ....

// Write a transform function, that accepts a value and returns a value
const msToDate = ms => new Date(ms).toISOString()

const def3 = [
  'data[0].content',
  {
    title: 'name',
    author: 'meta.author',
    date: ['meta.date', transform(msToDate)]
  }
]

const target3 = mapTransform(def3)(source)
// --> {
//   title: 'An interesting piece',
//   author: 'fredj',
//   date: '2018-08-08T17:48:10.952Z'
// }

// You may also reverse this, as long as you write a reverse version of
// `msToDate` and provide as a second argument to the `trasform()` function.
```

... and so on.

## Getting started

### Prerequisits

Requires node v8.6.

### Installing

Install from npm:

```
npm install map-transform --save
```

## Usage

### The transform object

Think of the transform object as a description of the object structure you want.

#### Keys on the transform object

In essence, the keys on the transform object will be the keys on the target
object. You may, however, specify a key with dot notation, which will be split
out to child objects on the target. You can also specify the child objects
directly on the transform object, so in most cases this is just a matter of
taste.

```javascript
const def1 = {
  'data.entry.title': 'heading'
}

const def2 = {
  data: {
    entry: {
      title: 'heading'
    }
  }
}

// def1 and def2 are identical, and will result in an object like this:
// {
//   data: {
//     entry: {
//       title: 'The actual heading'
//     }
//   }
// }
```

If MapTransform happens upon an array in the source data, it will map it and
set an array where each item is mapped according to the mapping object. But to
ensure that you get an array, even when the source data contains only an object,
you may suffix a key with brackets `[]`.

```javascript
const def3 = {
  'data.entries[]': {
    title: 'heading'
  }
}

// def3 will always give you entries as an array:
// {
//   data: {
//     entries: [
//       {title: 'The actual heading'}
//     ]
//   }
// }
```

#### Values on the transform object

The values on the transform objects define how to retrieve and transform data
from the source object, before it is set on the target object.

As you have already seen, you may set a **transform object** as the value, which
will result in child objects on the target, but at some point, you'll have to
define how to get data from the source object.

The simplest form is a **dot notation path**, that describes what prop(s) to pick
from the source object for this particular target key. It will retrieve whatever
is at this path on the source object.

```javascript
const def4 = {
  title: 'data.item.heading'
}

const source1 = {
  data: {
    item: {
      id: 'item1',
      heading: 'The actual heading',
      intro: 'The actual intro'
    }
  }
}

// `mapTransform(def4)(source1)` will transform to:
// {
//   title: 'The actual heading'
// }
```

The target object will only include values from the source object that is
"mentioned" by the mapping object.

The paths for the source data may also include brackets to indicate arrays in
the data. It is usually not necessary, as MapTransform will map any array it
finds, but it may be good to indicate what you expect from the source data, and
it may be important if you plan to reverse transform the mapping object.

To pass on the value on the pipeline, use an empty path `''` or a dot `'.'`.

Another feature of the bracket notation, is that you may pick a single item from
an array by indicating the array index in the brackets.

```javascript
const def5 = {
  title: 'data.items[0].heading'
}

// def5 will pull the heading from the first item in the `items` array, and will
// not return any array:
// {
//   title: 'The actual heading'
// }
```

Finally, a transform object value may be set to a
[**transform pipeline**](#transform-pipeline), or one function that could go in
the transform pipeline (which the dot notation path really is, and – come to
think of it – the transform object itself too). This is explained in detail
below.

### Transform pipeline

The idea of the transform pipeline, is that you describe a set of
transformations that will be applied to the data given to it, so that the
data will come out on the other "end" of the pipeline in another format. You may
also insert data on the other end of the pipeline, and get it out in the
original format again (although with a potential loss of data, if not all
properties are transformed). This is what you do in a
[reverse mapping](#reverse-mapping).

One way to put it is that the pipeline describes the difference between the two
possible states of the data, and allows you to go back and forth between them.
Or you can just view it as operations applied in the order they are defined – or
back again.

You define a pipeline as an array that may hold dot notation paths, transform
objects and transform operations of different kinds (see below). If the pipeline
holds only one of these, you may actually skip the array. This is a handy
shortcut in some cases.

Here's an example pipeline that will retrieve an array of objects from the path
`data.items[]`, map each object to an object with the props `id`, `title`, and
`sections` (`title` is shortened to max 20 chars and `sections` will be an array
of ids pulled from an array of section objects), and finally filter away all
items with no values in the `sections` prop.

```javascript
import { transform, filter } from 'map-transform'

const def6 = [
  'data.items[]',
  {
    id: 'articleNo',
    title: ['headline', transform(maxLength(20))],
    sections: 'meta.sections[].id'
  },
  filter(onlyItemsWithSection)
]
```

(Note that in this example, both `maxLength` and `onlyItemsWithSection` are
custom functions for this case, but their implementations are not provided.)

#### `transform(fn, fnRev)` operation

The simple beauty of the `transform()` operation, is that it will apply whatever
function you provide it with to the data at that point in the pipeline. It's
completely up to you to write the function that does the transformation.

You may supply a second function (`fnRev`), that will be used when
[reverse mapping](#reverse-mapping). If you only supplies one function, it will
be used in both directions. You may supply `null` for either of these, to make
it uni-directional, but it might be clearer to use `fwd()` or `rev()` operations
for this.

The functions you write for the transform operation should accept the source
data as its only argument, and return the result of the relevant transformation.
The data may be an object, a string, a number, a boolean, or an array of these.
It's really just up to you to write the appropriate function and use it at the
right place in a transform pipeline.

A simple transform function could, for instance, try to parse an integer from
whatever you give it. This would be very useful in the pipeline for a property
expecting numeric values, but MapTransform would not protest should you use it
on an object. You would probably just not get the end result you expected.

```javascript
import { mapTransform, transform } from 'map-transform'

const ensureInteger = data => Number.parseInt(data, 10) || 0
const def7 = {
  count: ['statistics.views', transform(ensureInteger)]
}

const data = {
  statistics: {
    view: '18'
    // ...
  }
}

mapTransform(def7)(data)
// --> {
//   count: 18
// }
```

This is also a good example of a transformation that only makes sense in one
direction. This will still work in reverse, ending in almost the same object
that was provided, but with a numeric `view` property. You may supply a
reverse transform function called `ensureString`, if it makes sense in your
particular case.

The functions you provide for the transform operation are expected to be pure,
i.e. they should not have any side effects. This means they should

1. not alter the data their are given, and
2. not rely on any state outside the function

Principle 1 is an absolute requirement, and principle 2 should only be violated
when it is what you would expect for the particular case. As an example of the
latter, say you write the function `toAge`, that would return the number of
years since a given year or date. You would have to use the current date to be
able to do this, even though it would be a violation of principle 2.

That said, you should always search for ways to satisfy both principles. Instead
of a `toAge` function, you could instead write a curried `yearsSince` function,
that would accept the current date (or any date) as the first argument. This
would be a truly pure function.

Example transformation pipeline with a `yearsSince` function:

```javascript
const def8 = {
  age: ['birthyear', yearsSince(new Date())]
}
```

You may also define a transform operation as an object:

```javascript
import { mapTransform } from 'map-transform'

const ensureInteger = operands => data => Number.parseInt(data, 10) || 0
const customFunctions = { ensureInteger }
const def7asObject = {
  count: ['statistics.views', { $transform: 'ensureInteger' }]
}

const data = {
  statistics: {
    view: '18'
    // ...
  }
}

mapTransform(def7asObject, { customFunctions })(data)
// --> {
//   count: 18
// }
```

Note that the function itself is passed on the `customFunctions` object. When
you provide the custom function this way, it should be given as a function
accepting an object with operands / arguments, that returns the actual function
used in the transform. Any properties given on the operation object, apart from
`$transform`, will be passed in the `operands` object.

#### `filter(fn)` operation

Just like the transform operation, the filter operation will apply whatever
function you give it to the data at that point in the transform pipeline, but
instead of transformed data, you return a boolean value indicating whether to
keep the data or not. If you return `true` the data continues through the
pipeline, if you return `false` it is removed.

When filtering an array, the function is applied to each data item in the array,
like a normal filter function, and a new array with only the items that your
function returns `true` for. For data that is not in an array, a `false` value
from your function will simply mean that it is replaced with `undefined`.

The filter operation only accepts one argument, which is applied in both
directions through the pipeline. You'll have to use `fwd()` or `rev()`
operations to make it uni-directional.

Functions passed to the filter operation, should also be pure, but could, when
it is expected and absolutely necessary, rely on states outside the function.
See the explanation of this under the transform operation above.

Example of a filter, where only data of active members are returned:

```javascript
import { mapTransform, filter } from 'map-transform'

const onlyActives = (data) => data.active
const def9 = [
  'members'
  {
    name: 'name',
    active: 'hasPayed'
  },
  filter(onlyActives)
]
```

Defining a filter operation as an object:

```javascript
import { mapTransform } from 'map-transform'

const onlyActives = (data) => data.active
const customFunctions = { onlyActives }
const def9asObject = [
  'members'
  {
    name: 'name',
    active: 'hasPayed'
  },
  { $filter: 'onlyActives' }
]
```

See the `transform()` operation on how defining as an object works.

#### `value(data)` operation

The data given to the value operation, will be inserted in the pipeline in place
of any data that is already present at that point. The data may be an object,
a string, a number, a boolean, or an array of any of those.

This could be useful for:

- Setting a fixed value on a property in the target data
- Providing a default value to the alt operation

Example of both:

```javascript
import { value, alt } from 'map-transform'

const def10 = {
  id: 'data.customerNo',
  type: value('customer'),
  name: ['data.name', alt(value('Anonymous'))]
}
```

The operation will not set anything when mapping with `.onlyMappedValues()`.

#### `fixed(data)` operation

The data given to the fixed operation, will be inserted in the pipeline in place
of any data that is already present at that point. The data may be an object,
a string, a number, a boolean, or an array of any of those.

This is exactly the same as `value()`, except that the value set with `fixed()`
will be included when mapping with `.onlyMappedValues()` as well.

#### `alt(pipeline)` operation

The alt operation will apply the function or pipeline it is given when the data
already in the pipeline is `undefined`. This is how you provide default values
in MapTransform. The pipeline may be as simple as a `value()` operation, a dot
notation path into the source data, or a full pipeline of several operations.

```javascript
import { alt, transform, value } from 'map-transform'
const currentDate = data => new Date()
const formatDate = data => {
  /* implementation not included */
}

const def11 = {
  id: 'data.id',
  name: ['data.name', alt(value('Anonymous'))],
  updatedAt: [
    'data.updateDate',
    alt('data.createDate'),
    alt(transform(currentDate)),
    transform(formatDate)
  ]
}
```

In the example above, we first try to set the `updatedAt` prop to the data found
at `data.updateDate` in the source data. If that does not exist (i.e. we get
`undefined`), the alt operation kicks in and try the path `data.createDate`. If
we still have `undefined`, the second alt will call a transform operation with
the `currentDate` function, that simply returns the current date as a JS object.
Finally, another transform operation pipes whatever data we get from all of this
through the `formatDate` function.

You may also define an alt operation as an object:

```javascript
const def11asObject = {
  id: 'data.id',
  name: ['data.name', { $transform: 'alt', value: 'Anonymous' }]
}
```

For now, only the value operand is supported. In the example above, the value
`'Anonymous'` will be used when `data.name` is undefined.

#### `concat(pipeline, pipeline, ...)` operation

The `concat()` operation will flatten the result of every pipeline it is given
into one array. A pipeline that does not return an array will simple have its
return value appended to the array.

This operation will always return an array, even when it is given only one
pipeline that does not return an array. Pipelines that does not result in a
value (i.e. return `undefined`) will be filtered away.

#### `fwd(pipeline)` and `rev(pipeline)` operation

All operations in MapTransform will apply in both directions, although some of
them will behave a bit different dependending on the direction. If you want an
operation to only apply to one direction, you need to wrap it in a `fwd()` or
`rev()` operation. The `fwd()` operation will only apply its pipeline when we're
going forward, i.e. mapping in the normal direction, and its pipeline will be
skipped when we're mapping in reverse. The `rev()` operation will only apply its
pipeline when we're mapping in reverse.

```javascript
import { fwd, rev, transform } from 'map-transform'
const increment = data => data + 1
const decrement = data => data - 1

const def12 = {
  order: ['index', fwd(transform(increment)), rev(transform(decrement))]
}
```

In the example above, we increment a zero-based index in the source data to get
a one-based order prop. When reverse mapping, we decrement the order prop to get
back to the zero-based index.

Note that the `order` pipeline in the example above could also have been written
as `['index', transform(increment, decrement)]`, as the transform operation
supports seperate forward and reverse functions, when it is given two functions.
In this case you may choose what you think is clearer, but in other cases, the
`fwd()` and `rev()` operations are your only friends.

#### `divide(fwdPipeline, revPipeline)` operation

`divide()` is `fwd()` and `rev()` operations combined, where the first argument
is a pipeline to use when going forward and the second when going in reverse.

See `fwd()` and `rev()` for more details.

#### `get(path)` and `set(path)` operation

Both the `get()` and `set()` operations accepts a dot notation path to act on.
The get operation will pull the data at the path in the source data, and insert
it in the pipeline, while the set operation will take what's in the pipeline
and set it on the given path at a new object.

One reason they come as a pair, is that they will switch roles for reverse
mapping. Their names might make this a bit confusing, but in reverse, the get
operation will set and the set operation will get.

```javascript
import { get, set } from 'map-transform'

const def13 = [get('data.items[].content'), set('content[]')]
```

In the example above, the get operation will return an array of whatever is in
the `content` prop at each item in the `data.items[]` array. The set operation
will then create a new object with the array from the pipeline on the `content`
prop. Reverse map this end result, and you'll get what you started with, as the
get and set operations switch roles.

You may notice that the example above could have been written with a transform
object, and you're absolutely right. The transform object is actually an
alternative to using get and set operations, and will be converted to get and
set operations behind the curtains.

This example results in the exact same pipeline as the example above:

```javascript
const def14 = {
  'content[]': 'data.items[].content'
}
```

It's simply a matter of taste and of what's easiest in each case. We believe
that the transform object is best in cases where you describe a target object
with several properties, while get and set operations is best suited to define
root paths for objects or arrays.

The get operation also has a shortcut in transform pipelines: Simply provide the
path as a string, and will be treated as `get(path)`.

#### `root(pipeline)` operation

When you pass a pipeline to the root operation, the pipeline will be apply to
the data that was original passed to the pipeline. Note that the result of a
root pipeline will still be applied at the point you are in the parent pipeline,
so this is not a way to alter data out of the pipeline.

Let's look at an example:

```javascript
import { mapTransform, root } from 'map-transform'

const def15 = [
  'articles[]',
  {
    id: 'id',
    title: 'headline',
    section: root('meta.section')
  }
]

const data = {
  articles: [{ id: '1', headline: 'An article' } /* ... */],
  meta: { section: 'news' }
}

mapTransform(def15)(data)
// --> [
//   { id: '1', title: 'An article', section: 'news' }
//   /* ... */
// ]
```

As you see, every item in the `articles[]` array, will be mapped with the
`section` property from the `meta` object. This would not be available to the
items without the root operation.

There's also a shortcut notation for root, by prefixing a dot notation path with
`$`. This only works when the path is used for getting a value, and it will be
plugged when used as set (i.e., it will return no value). This may be used in
`get()` and `set()` operations, and in transformation objects.

In the following example, `def16` and `def17` is exactly the same:

```javascript
const def16 = get('$meta.section')
const def17 = divide(root('meta.section'), plug())
```

#### `plug()` operation

All the `plug()` operation does is set clear the value in the pipeline - it
plugs it. The value will be set to `undefined` regardless of what has happened
before that point. Any `alt()` operations etc. coming after the plug will still
have an effect.

This main use case for this is to clear the value going one way. E.g. if you
need a value when you map in reverse, but don't want it going forward, plug it
with `fwd(plug())`. You will also need it in a pipeline where the only operation
is uni-directional (i.e. using `fwd()` or `rev()`). An empty pipeline (which is
what a uni-directional pipeline will be in the other direction), will return
the data you give it, which is usually not what you want in these cases.
The solution is to plug it in the other direction.

You could have accomplished the same with `value(undefined)`, but this will not
work for `onlyMappedValues()`. `plug()` will do its trick in all cases.

#### `lookup(arrayPath, propPath)` operation

`lookup()` will take the value in the pipeline and replace it with the first
object in the `arrayPath` array with a value in `propPath` matching the value.

In reverse, the `propPath` will simply be used as a get path. (In the future,
MapTransform might support setting the items back on the `arrayPath` in
reverse.)

Example:

```javascript
const def18 = ['content.meta.authors[]', lookup('$users[]', 'id')]
const data = {
  content: { meta: { authors: ['user1', 'user3'] } },
  users: [
    { id: 'user1', name: 'User 1' },
    { id: 'user2', name: 'User 2' },
    { id: 'user3', name: 'User 3' }
  ]
}
const mapper = mapTransform(def18)
const mappedData = mapper(data)
// --> [
//   { id: 'user1', name: 'User 1' },
//   { id: 'user3', name: 'User 3' }
// ]

mapper.rev(mappedData)
// --> { content: { meta: { authors: ['user1', 'user3'] } } }
```

#### `compare(path, value)` helper

This is a helper intended for use with the `filter()` operation. You pass a dot
notation path and a value (string, number, boolean) to `compare()`, and it
returns a function that you can pass to `filter()` for filtering away data that
does not not have the value set at the provided path. If the path points to an
array, the value is expected to be one of the values in the array.

Here's an example where only data where role is set to 'admin' will be kept:

```javascript
import { filter, compare } from 'map-transform'

const def19 = [
  {
    name: 'name',
    role: 'editor'
  },
  filter(compare('role', 'admin'))
]
```

#### `validate(path, schema)` helper

This is a helper for validating the value at the path against a
[JSON Schema](http://json-schema.org). We won't go into details of JSON Schema
here, and the `validate()` helper simply retrieves the value at the path and
validates it according to the provided schema.

Note that if you provide a schema that is always valid, it will be valid even
when the data has no value at the given path.

```javascript
import { filter, validate } from 'map-transform'

const def20 = [
  'items',
  filter(validate('draft', { const: false })),
  {
    title: 'heading'
  }
]
```

#### `not(value)` helper

`not()` will return `false` when value if truthy and `true` when value is falsy.
This is useful for making the `filter()` operation do the opposite of what the
filter function implies.

Here we filter away all data where role is set to 'admin':

```javascript
import { filter, compare } from 'map-transform'

const def21 = [
  {
    name: 'name',
    role: 'role'
  },
  filter(not(compare('role', 'admin')))
]
```

### Reverse mapping

When you define a transform pipeline for MapTransform, you also define the
reverse transformation, i.e. you can run data in both direction through the
pipeline. This comes "for free" for simple mappings, but might require some
extra work for more complex mappings with transform operations, alt operations,
etc.

You should also keep in mind that, depending on your defined pipeline, the
mapping may result in data loss, as only the data that is mapped to the target
object is kept. This may be obvious, but it's an important fact to remember if
you plan to map back and forth between two states – all values must be mapped to
be able to map back to the original data.

Let's see an example of reverse mapping:

```javascript
import { mapTransform, alt, value } from 'map-transform'

const def22 = [
  'data.customers[]',
  {
    id: 'customerNo',
    name: ['fullname', alt(value('Anonymous'))]
  }
]

const dataInTargetState = [
  { id: 'cust1', name: 'Fred Johnsen' },
  { id: 'cust2', name: 'Lucy Knight' },
  { id: 'cust3' }
]

const dataInSourceState = mapTransform(def22).rev(dataInTargetState)
// --> {
// data: {
//   customers: [
//     { customerNo: 'cust1', fullname: 'Fred Johnsen' },
//     { customerNo: 'cust2', fullname: 'Lucy Knight' },
//     { customerNo: 'cust3', fullname: 'Anonymous' }
//   ]
// }
// }
```

Transform objects allow the same property on the source data to be mapped to
several properties on the target object, but to this in reverse, you have to use
a special syntax, as object properties need to be unique. By suffixing a key
with a slash and a number, you tell MapTransform to use it in reverse, but
skipping it going forward.

For example:

```javascript
import { mapTransform, transform } from 'map-transform'

const username = name => name.replace(/\s+/, '.').toLowerCase()

const def23 = [
  'data.customers[]',
  {
    id: 'customerNo',
    name: 'fullname',
    'name/1': ['username', rev(transform(username))]
  }
]

const dataInTargetState = [{ id: 'cust1', name: 'Fred Johnsen' }]

const dataInSourceState = mapTransform(def23).rev(dataInTargetState)
// --> {
// data: {
//   customers: [
//     { customerNo: 'cust1', fullname: 'Fred Johnsen', username: 'fred.johnsen' }
//   ]
// }
// }
```

### Mapping without fallbacks

MapTransform will try its best to map the data it gets to the state you want,
and will always set all properties, even though the mapping you defined result
in `undefined`. You may include `alt()` operations to provide default or fallback
values for these cases.

But sometimes, you want just the data that is actually present in the source
data, without defaults or properties set to `undefined`. MapTransform's
`onlyMappedValues()` method gives you this.

Note that `value()` operations will also be skipped when mapping with
`onlyMappedValues()`, to honor the request for only the values that comes from
the data source. To override this behavior, use the `fixed()` operation instead,
which will set a value also in this case.

```javascript
import { mapTransform, alt, value } from 'map-transform'

const def24 = {
  id: 'customerNo',
  name: ['fullname', alt(value('Anonymous'))]
}

const mapper = mapTransform(def24)

mapper({ customerNo: 'cust4' })
// --> { id: 'cust4', name: 'Anonymous' }

mapper.onlyMappedValues({ customerNo: 'cust4' })
// --> { id: 'cust4' }

mapper.onlyMappedValues({ customerNo: 'cust5', fullname: 'Alex Troy' })
// --> { id: 'cust5', name: 'Alex Troy' }

// The method is also available for reverse mapping
mapper.rev.onlyMappedValues({ id: 'cust4' })
// -> { customerNo: 'cust4' }
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
