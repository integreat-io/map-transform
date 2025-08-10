# MapTransform

Map and transform objects with mapping definitions.

[![npm Version](https://img.shields.io/npm/v/map-transform.svg)](https://www.npmjs.com/package/map-transform)
[![Maintainability](https://api.codeclimate.com/v1/badges/fe35a58dd457837b457c/maintainability)](https://codeclimate.com/github/integreat-io/map-transform/maintainability)

Behind this rather boring name hides a powerful JavaScript object transformer.

Some highlighted features:

- You define how your data should be transformed by creating the JavaScript
  object you want as a result, setting paths and transform functions
  (transformers) etc. where they apply.
- Your data pass through transform pipelines, which may include several steps of
  paths and transformers. You define pipelines anywhere you'd like, both for
  transforming objects or array of values, or for object props and primite
  values.
- By defining how to transform data from one object to another, you implicitly
  define how to transform the other way – from the target to the original
  (with some gotchas).

## Getting started

### Prerequisits

Requires node v14.

**Note:** This package is native [ESM](https://nodejs.org/api/esm.html). See this
guide on how to
[convert to or use ESM packages](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

### Installing

Install from npm:

```
npm install map-transform
```

## Breaking changes in v0.5

- MapTransform now supports async transformers, and therefore the main
  function is async as well, and you'll have to await the result. In most cases
  nothing else will have to change, unless you want to start writing async
  transformers.

## Breaking changes in v0.4

- Map objects won't be mapped over an array by default. You have to specify
  `$iterate: true`
- The `alt` operation now accepts any type of pipeline, but not a helper
  function, and all alternative pipelines must be given as arguments to `alt`
- The root path prefix is changed from `$` to `^^`
- The `.rev()` method on `mapTransform()` has been removed, and instead you pass
  in `{ rev: true }` as the second argument to the regular method
- The named export `mapTransform` has been removed, and is provided as the
  default export instead

## Usage

Let's look at a simple example:

```javascript
import mapTransform from 'map-transform'

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

// You feed it to mapTransform and get a function that will transform data
// according to your defintion
const mapper = mapTransform(def)

// Now, run the source object through the mapper and get what you want
const target = await mapper(source)
// --> {
//   title: 'An interesting piece',
//   author: 'fredj',
//   date: 1533750490952
// }

// And run it in reverse to get to what you started with:
const source2 = await mapper(target, { rev: true })
// -> {
//   data: [
//     {
//       content: {
//         name: 'An interesting piece'
//       },
//       meta: {
//         author: 'fredj',
//         date: 1533750490952
//       }
//     },
//   ]
// }
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
    date: 'meta.date',
  },
]

mapTransform(def2)(source)
// --> {
//   title: 'An interesting piece',
//   author: 'fredj',
//   date: 1533750490952
// }
```

And if you want the actual date instead of the microseconds since the seventies:

```javascript
import mapTransform, { transform } from 'map-transform'

// ....

// Write a transformer that accepts a value and returns a value
const msToDate = () => (ms) => new Date(ms).toISOString()

const def3 = [
  'data[0].content',
  {
    title: 'name',
    author: 'meta.author',
    date: ['meta.date', transform(msToDate)],
  },
]

await mapTransform(def3)(source)
// --> {
//   title: 'An interesting piece',
//   author: 'fredj',
//   date: '2018-08-08T17:48:10.952Z'
// }

// You may also reverse this, as long as you write a reverse version of
// `msToDate` and provide as a second argument to the `transform()` function.
```

... and so on.

You may also provide MapTransform with a target that the transformation will be
applied to. Continuing from the previous example:

```javascript
const target = { id: '12345', title: 'Default title' }

await mapTransform(def3)(source, { target })
// --> {
//   id: '12345',
//   title: 'An interesting piece',
//   author: 'fredj',
//   date: '2018-08-08T17:48:10.952Z'
// }
```

### The transform object

Think of the transform object as a description of the object structure you want.

#### Keys on the transform object

In essence, the keys on the transform object will be the keys on the target
object. You may, however, specify keys with [dot notation](#dot-notation-paths),
which will be made into a structure of child objects and potentially arrays on
the target. You can also specify the child objects directly on the transform
object, so in most cases this is just a matter of taste or practicality.

```javascript
const def1 = {
  data: {
    entry: {
      title: 'heading',
    },
  },
}

const def2 = {
  'data.entry.title': 'heading',
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

When you transform an array of data with a mapping object, you'll have to set
`$iterate: true` to have each item in the data array be transformed with the
mapping object. If you don't, the entire array will be passed to the mapping
object.

```javascript
const def3 = {
  $iterate: true,
  title: 'heading',
}

// -->
// [
//   { title: 'The first heading' },
//   { title: 'The second heading' }
// ]
```

**Note:** Iterating used to be the default behavior on top level objects prior
to v0.4, but it now needs to be explisitly stated, to be consistent with how the
transform object behaves everywhere else.

A key will set whatever is returned by the pipeline (see
[next section](#values-on-the-transform-object)), whether it is a string, a
boolean, an array, etc. If you want to ensure that you always get an array, you
can suffix the key with `[]`. Any value that is not an array will be wrapped in
one.

```javascript
const def27 = {
  $iterate: false
  'articles[]': {
    title: 'heading'
  }
}

// -->
// {
//   articles: [
//     { title: 'Wrapped in an array, even if the data was just an object' },
//   ]
// }
```

A bonus of using the `[]` suffix, is that when key has another transform object
as its value, this transform object will be iterated by default (no need to set
the `$iterate` property). This does not happen to pipelines, paths, or
operations.

#### Values on the transform object

The values on the transform objects define how to retrieve and transform data
from the source object, before it is set on the target object.

As you have already seen, you may set a **transform object** as the value, which
will result in child objects on the target, but at some point, you'll probably
want to define how to get data from the source object.

The simplest form is a dot[ notation path](#dot-notation-paths), that describes
what prop to pick from the source object for this particular target key. It will
retrieve whatever is at this path on the source object.

```javascript
const def4 = {
  title: 'data.item.heading',
}

const source1 = {
  data: {
    item: {
      id: 'item1',
      heading: 'The actual heading',
      intro: 'The actual intro',
    },
  },
}

await mapTransform(def4)(source1)
// --> {
//   title: 'The actual heading'
// }
```

The target object will only include values from the source object that is
"picked up" by the paths on the mapping object. Other values are discarded.

The paths for the source data may also include brackets to indicate arrays in
the data. It is usually not necessary, as MapTransform will map any array it
finds, but it may be good to indicate what you expect from the source data, and
it may be important if you plan to reverse transform the mapping object.

To pass on the value in the pipeline, without going down a path, use a dot
`'.'`.

You may pick a single item from an array by indicating an index within brackets:

```javascript
const def5 = {
  title: 'data.items[0].heading',
}

// def5 will pull the heading from the first item in the `items` array, and will
// not return any array:
// {
//   title: 'The actual heading'
// }
```

Finally, a transform object value may be set to a
[**transform pipeline**](#transform-pipelines), or a function that could have
been in a transform pipeline (which the dot notation path really is, and – come
to think of it – the transform object itself too). This is explained in detail
below.

#### A note on undefined and null

MapTransform will treat `undefined` as "no value" in several ways:

- When using the `alt` operator, alternative pipelines are run as long as we get
  `undefined` (or there are no more alternative pipelines)
- When `state.noDefaults` is `true`, `undefined` values will not be set
- When forcing an array with brackets notation on a path, `undefined` will
  return an empty array (not `[undefined]`)

This is not the case for `null`, though. MapTransform treats `null` as a value,
an intended nothing. To change this behavior, set `nonvalues: [undefined, null]`
on the `options` object passed to MapTransform. This will essentially make
MapTransform treat `null` the same way as `undefined`.

You could in principle include any primitive value in `nonvalues` and it will be
treated as `undefined`, e.g. an empty string or the number `0`, to mention a few
possible use cases.

#### Directional transform objects

A transform object is by default applied both in forward and reverse
transformations. You may alter this by setting the `$direction` prop on a transform
object, with `fwd`, `rev`, or `both` (the default) as possible values.

When running a forward transformation, transform objects marked with
`$direction: 'rev'` will be skipped. The same goes for `$direction: 'fwd'` in
reverse. This will cause the value in the pipeline to be passed on unchanged.

You may specify aliases for `fwd` and `rev` in the `mapTransform` options:

```javascript
const options = { fwdAlias: 'from', revAlias: 'to' }
const mapper = mapTransform(def, options)
```

In this case, `from` and `to` may be used to specify forward and reverse
direction respectively. `fwd` and `rev` will still work in addition to the
aliases.

### Transform pipelines

The idea of the transform pipeline, is that you describe a set of
transformation steps that will be applied to the data given to it, so that the
data will come out on the other "end" of the pipeline in another format. The
result from each step is passed on to the next.

You may also run data through the pipeline in the oposite direction – in reverse
mode. The data that came out of the pipeline in forward mode, could be passed
back and get out in the original format again (although with a potential loss of
data, if not all properties are transformed to the target data). This is what
you do in a [reverse mapping](#reverse-mapping).

One way to put it, is that the pipeline describes the difference between the two
possible shapes of the data, and allows you to go back and forth between them.
Or you can just view it as transformation steps applied in the order they are
defined – or back again.

You define a pipeline as an array where each item is a step and may be a
[dot notation path](#dot-notation-paths), a
[transform object](#the-transform-object), or an [operation](#operations) of
some kind.

If the pipeline holds only one step, you may skip the array as a handy shortcut.
This is way we sometimes use the phrase "pipeline" to include anything that
could go into a pipeline as well, as e.g. a path is essentially a pipeline with
only one step.

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
    $iterate: true,
    id: 'articleNo',
    title: ['headline', transform(maxLength(20))],
    sections: 'meta.sections[].id',
  },
  filter(onlyItemsWithSection),
]
```

(Note that in this example, both `maxLength` and `onlyItemsWithSection` are
custom transformers for this case, but their implementations are not provided.)

**A note on arrays:** In a transform pipeline, the default behavior is to treat
an array as any other data. The array will be passed on to a `transform`
operation, the entire array will be set on a path, etc. This also means that a
mapping object will be applied to the entire array if nothing else is specified.
In the example above, we have set `$iterate: true` on the mapping object, to
signal that we want the mapping to be applied to the items of any array. See
also [the `iterate` operation](#iteratepipeline-operation) for more.

> Editors note: We should think through how we use the word "pipeline", as it is
> sometimes ment to refer to an array of operations that a value may be
> transformed through, other times any operation that could have been a part of
> such a pipeline (the thinking is that it's a pipeline with one step), and we
> also use the word to visualize a value going through a pipeline while it is
> being transformed, and we refer to "the value in the pipeline". All of these
> are related and makes sense when you look at the bigger picutre, but it may
> not be clear when you just read a few paragraphs here and there.

### Dot notation paths

A central building block of MapTransform is the path, which at the most basic
will be the key of an object prop to fetch, and you may fetch deeper values by
putting property keys together seperated by a dot (`.`).

For example, given the data below:

```javascript
const data = {
  id: '12345',
  content: {
    title: 'The title',
  },
  tags: [{ id: 'news' }, { id: 'sports' }],
}
```

... the path `id` will get `'12345'`, and 'content.title' will get
`'The title'`.

Paths that does not match a property in the data, will return `undefined`.
MapTransform will never return an error when paths don't match the data, not
even if the lower levels are missing (counter to the usual behavior of
JavaScript and other programming languages). So when getting `unknown.path` from
the data above, you will simply get `undefined`.

Setting with a dot notation path works just as expected: If you set `'The text'`
at the path `content.text`, you will get the following object:
`{ content: { text: 'The text' } }`. Inside a MapTransform transformation, you
would usually set on several paths that would combine to a bigger object
structure.

#### Paths and arrays

When a path points to an array, the entire array will be returned. Paths may
also point to props on objects within arrays, and MapTransform will resolve this
be mapping over the items in the array to its best effort. Getting `tags.id`
from the data above will return the array `['news', 'sports']`, as these are the
`id` props from the object in the array found at `tags`.

You may also explicitly state that you expect an array. You didn't really have
to in the example above, but you could have used the path `tags[].id` to make it
clearer what you expect. `tags.id[]` would have also given the same result. The
main big reason to explicitly include the brackets, is to make sure that you
always get an array, even if the data has no array. The path `content[].title`
would return `['The title']` as if `content` was an array.

When a path with bracket notation meets `undefined` or any other
[nonvalue](#a-note-on-undefined-and-null), an empty array will be returned,
as you have stated that you expect an array. The only exception from this is
when [`state.noDefaults` is `true`](#mapping-without-defaults), in which case
you'll get `undefined`.

It may not always be straight forward how MapTransform should set on a path with
array notation, but it will again do it's best. When there is no other
indications as to where the array belongs, MapTransform will set it where the
array notation is. So `content[].title` will return the object
`{ content: [{ title: 'The title' }] }`, while `content.title[]` would return
`{ content: { title: ['The title'] } }`, This will most likely work as you
expect, as long as you use the brackets notation to guide MapTransform.

> Editors note: We should give more complicated examples as well.

Finally, you may include index numbers between the brackets, to only get a
specified item. `tags[0].id` would get `'news'` from the data above. Use a
negative number to count from the end (`-1` being the last item). The index
version of the brackets notation won't return an array (as expected).

When setting with an index bracket notation, you'll get an array where the
brackets are, with one item at the index you've specified.

Note that keys starting with a dollar sign `$` has special meaning in
MapTransform, so when you need keys in your data to actualy start with `$`, you
need to escape it in your paths. E.g. `data[].\$type`. (Remember to
double-escape in JavaScript and other contexts that require it.)

#### Parent and root paths

A subtle aspect of using paths to get values in
[transform pipelines](#transform-pipelines), is that you are not only returning
the value, you are moving further down in the data structure. When you apply the
path `content` to the data above inside a transform pipeline, the object
`{ title: 'The title' }` will be returned and will in essense be the only data
that the next operation in the pipeline will know.

You don't have to understand this for simple cases, but in more advanced
transformations you may find yourself further down in the data, wanting values
further up. This is where parent and root paths come in handy.

In the example with the `content` path, you may access the `id` with the path
`^.id`. The carret (`'^'`) means going one step up, and you can think of it in
much the same way as `../` in file paths on any computer. You may go up several
levels with e.g. `^.^.^.prop` (not applicable to our example).

In an iteration you need to remember that the array counts as one level, so if
iterating the `tags[]` array from our example, you would have to use the path
`^.^.id` to get to the id. You could also use `^.[0]` to get the first item in
the array you're iterating.

The root notation follows the same logic, but will always go to the base level,
regardless of how many levels down you have moved. Roots are specified with
double carrets, so the path `^^.id` will get the id from our data from anywhere
in the data structure, be it in `content` or when iterating through `tags[]`.

Setting on parent and root paths are currently not supported.

### Operations

Operations may be used as steps in a transform pipeline.

#### `transform(transformFn, transformFnRev)` operation

The simple beauty of the `transform` operation, is that it will apply whatever
function (transformer) you provide it with to the data at that point in the
pipeline. It's up to you to write the function that does the transformation – or
use one of [the transformers that comes with MapTransform](#transformers).

You may supply a second transformer (`transformFnRev`), that will be used when
[reverse mapping](#reverse-mapping). If you only supplies one transformer, it
will be used in both directions. You may supply `null` for either of these, to
make it uni-directional, but it might be clearer to use `fwd` or `rev`
operations for this.

The transformers you write for the transform operation are a function that
returns a function, where the first function is given an `options` object from
MapTransform, and the second should accept the source data as its first
argument, and return the result of the relevant transformation. The data may be
any JavaScript primite value, object, or an array of these. Your transformer
should handle getting something unexpected, in which case it should usually
return the value untouched or `undefined` – depending on what seems most natural
in the case of your transformer.

The second argument of the second function will be a
[state object](#the-state-object), that give access to the context your
transformer is operating in. Most of the properties of the state object is
regarded as MapTransform internal, but you will probably use the `rev` prop at
some point, which indicates whether we are transforming forward or in reverse.

> Editors note: We should have a seperate description of transformer function,
> where we go into more details.

A simple transformer could, for instance, try to parse an integer from
whatever you give it. This would be very useful in the pipeline for a property
expecting numeric values, but keep in mind that MapTransform won't stop it from
being used on an object. In the implementation below you would not always get
the result you expected, so remember to handle unexpected values in your real
transformers.

```javascript
import mapTransform, { transform } from 'map-transform'

const ensureInteger = () => (data) => Number.parseInt(data, 10) || 0
const def7 = {
  count: ['statistics.views', transform(ensureInteger)],
}

const data = {
  statistics: {
    view: '18',
    // ...
  },
}

await mapTransform(def7)(data)
// --> {
//   count: 18
// }
```

This is also a good example of a transformation that only makes sense in one
direction. This will still work in reverse, ending in almost the same object
that was provided, but with a numeric `view` property. You may supply a
reverse transformer called `ensureString`, if it makes sense in your
particular case, or provide one transformer that parses to an integer going
forward and stringifies in reverse.

The functions you provide for the transform operation should, as far as
possible, be pure, i.e. they should not have any side effects. This means
they should

1. not alter the data their are given, and
2. not rely on anything besides the function arguments (the data and
   [the state](#the-state-object))

Principle 1 is an absolute requirement, and principle 2 should only be violated
when it's what you would expect for the particular case. As an example of the
latter, say you write the function `toAge`, that would return the number of
years since a given year or date. You would have to use the current date to be
able to do this, even though it would be a violation of principle 2.

Principle 2 will also often have to go when you write asyncronous transformers,
like the following:

```javascript
const readFile = () =>
  async function readFile(fileName: unknown) {
    if (typeof fileName === 'string') {
      // Insert code to read file
      return fileContent
    } else {
      return undefined
    }
  }
```

Reading a file, like in this example, is a side effect, but that's also the goal
of this transformer, so it wouldn't make sense without. However, it still
doesn't change anything. A transformer that writes to a file, would probably be
a bad idea, though.

That said, you should always search for ways to satisfy both principles. Instead
of a `toAge` function, you could instead write a curried `yearsSince` function,
that would accept the current date (or any date) as the first argument. This
would be a truly pure function.

Example transformation pipeline with a `yearsSince` function:

```javascript
const def8 = {
  age: ['birthyear', transform(yearsSince(new Date()))],
}
```

This might not be what you want, however, as you'll get the date at the time you
pass the definition to MapTransform, and some time may pass before the data is
transformed.

**Note:** When the `transform` operation is applied to an array, it will not
iterate the array. Mapping over each item needs to be handled in the transform
itself, or wrap the `transform` operation in an `iterate` operation.

So far we have used the `transform` function in our examples, but you also have
the option to define a transform operation as an operation object, referencing
the transformer with an id. The transformer themselves should be made available
on the `options.transformers` object:

```javascript
import mapTransform from 'map-transform'

// This is our transformer
const ensureInteger = (props) => () => (data) => Number.parseInt(data, 10) || 0

// We provide our transformers to mapTransform in an options object
const options = { transformers: { ensureInteger } }

// Then we may use an object in the pipeline and reference our transformer on a
// `$transform` prop. MapTransform will replace this with the transform
// operation and give it our transformer
const def7asObject = {
  count: ['statistics.views', { $transform: 'ensureInteger' }],
}

const data = {
  statistics: {
    view: '18',
    // ...
  },
}

await mapTransform(def7asObject, options)(data)
// --> {
//   count: 18
// }
```

When you provide a custom transformer this way, it should be given as a function
accepting an object with props, that returns the actual function used as the
transformer (which again returns a function mapping the data). Any properties
given on the operation object, apart from `$transform`, will be passed in the
`props` object.

If you provide `$transform` with an unknown transformer id, `mapTransform()`
will throw. Note that this happens right away, on the first function call, so
you don't have to try to run the mapper function with any data to discover the
mistake.

When you define the `transform` operation as an object, you may specify
`$iterate: true` on the object to apply the transform to every item on an array,
in case an array is encountered. You may also set `$direction: 'fwd'` or
`$direction: 'rev'` to have it transform in one direction only.

This way of defining transform operations is useful to seperate the transform
defintions and the transformers, and it also results in defintions that may be
stored as JSON (but see [the note on JSON](#a-note-on-json)).

There are a few useful shorthands for the operation objects, like
`{ $value: 'The value' }` instead of
`{ $transform: 'value', value: 'The value' }`. These are noted under the
relevant transformers etc.

You may also create your own shorthands by providing a `transformOperation`
function in the `options` object passed to `mapTransform`. This function
receives an operation object and my modify it to another operation object. In
fact, transform object (objects that are not operation objects) are also passed
through this function, so you may also use it to modify transform objects. Make
sure to return a valid object here, though, or you will kill your pipeline.

#### `filter(conditionFn)` operation

Just like the `transform` operation, the `filter` operation will apply whatever
transformer function you give it, to the data at that point in the transform
pipeline. But instead of transformed data, the `filter` operation expects a
boolean value indicating whether to keep the data or not. If you return `true`
the data continues through the pipeline, if you return `false` it is removed.
If the result is not a boolean, JavaScript rules will be used to force it to a
boolean, meaning that `undefined`, `null`, `0`, and empty string `""` will be
treated as `false`.

When filtering an array, the transformer is applied to each data item in the
array, like a normal filter function, and a new array with only the items that
your transformer returns `true` for. For data that is not in an array, a `false`
value from your transformer will simply mean that it is replaced with
`undefined`.

The filter operation only accepts one argument, which is applied in both
directions through the pipeline. You'll have to use `fwd` or `rev` operations to
make it uni-directional.

Transformers passed to the filter operation should also be pure, but
could, when it is expected and absolutely necessary, rely on anything outside
the function. See the comment in the transform operation section above.

Example of a filter, where only data of active members are returned:

```javascript
import mapTransform, { filter } from 'map-transform'

const onlyActives = () => (data) => data.active
const def9 = [
  'members'
  {
    name: 'name',
    active: 'hasPayed'
  },
  filter(onlyActives)
]
```

Defining a filter operation as an operation object:

```javascript
import mapTransform from 'map-transform'

const onlyActives = (data) => data.active
const options = { transformers: { onlyActives: () => onlyActives } }
const def9asObject = [
  'members'
  {
    name: 'name',
    active: 'hasPayed'
  },
  { $filter: 'onlyActives' }
]
```

If you provide `$filter` with an unknown transformer id, `mapTransform()`
will throw. Note that this happens right away, on the first function call, so
you don't have to try to run the mapper function with any data to discover the
mistake.

You may also set `$direction: 'fwd'` or `$direction: 'rev'` on the object, to
have it filter in one direction only.

See
[the `transform` operation](#transformtransformfn-transformfnrev-operation) for
more on how defining as an object works.

#### `ifelse(conditionFn, truePipeline, falsePipeline)` operation

The `ifelse` operation will run the `truePipeline` if the `conditionFn` results
in something truthy, JavaScript style, otherwise it will run the
`falsePipeline`. See [the `filter` operation](#filterconditionFn-operation)
for more on the requirements for the `conditionFn`.

Both `truePipeline` and `falsePipeline` are optional, in case you only need to
apply a pipeline in one of the cases. When no pipeline is provided, the value is
simply passed on untouched.

Example:

```javascript
import mapTransform, { ifelse } from 'map-transform'

const onlyActives = () => (data) => data.active
const def31 = [
  'members'
  {
    name: 'name',
    active: 'hasPayed'
  },
  ifelse(onlyActives, set('active[]'), set('inactive[]'))
]
```

Defining an if operation as an object:

```javascript
import mapTransform from 'map-transform'

const def31b = [
  'members'
  {
    name: 'name',
    active: 'hasPayed'
  },
  {
    $if: 'active',
    then: set('active[]'),
    else: set('inactive[]')
  }
]
```

Note that `$if`, `then`, and `else` in the object notation may be any type of
pipeline definition. The only gotcha is that if `$if` is a function, it is
treated as a `conditionFn`, like in `def31`, not as a state mapper.

Note also that the `conditionFn` pipeline will always be run in forward mode.

#### `iterate(pipeline)` operation

If you want to map over the items of an array, the `iterate` operation is your
friend. When you wrap another operation, a pipeline, or a mapping object in an
`iterate` operation, it will be applied to each item, instead of to the array
as a whole.

In this example, each value in the array returned by `statistics[].views` will
be transformed with the `ensureInteger` transformer, even though the transformer
itself does not support arrays:

```javascript
import mapTransform, { iterate } from 'map-transform'

const ensureInteger = () => (data) => Number.parseInt(data, 10) || 0
const def26 = {
  counts: ['statistics[].views', iterate(transform(ensureInteger))],
}
```

For transform objects, you have the option to set `$iterate: true` instead of
using the `iterate` operation:

```javascript
const def26c = [
  'statistics[].views',
  {
    $iterate: true,
    counts: { $transform: 'ensureInteger' },
  },
]
```

> Editors note: Here we should also document how a path ending in brackets will
> affect iteration.

#### `apply(pipelineId)` operation

The `apply` operation let you define named pipelines that you may apply in other
pipelines. This allows for cleaner definitions, clarity through good naming
practices, and reuse.

You provide an object with the pipeline names/ids as keys on the
`options.pipelines` given to `mapTransform()`. When an id is passed to the
`apply` operation as `pipelinedId`, the pipeline will be applied in the place of
the apply operation and executed as if it was part of the pipeline definition in
the first place.

Note that "pipeline" is used as a wide concept here, including what is described
as transform pipelines in this documentation, and also anything that could be
part of a pipeline, like dot notation paths, transform objects, operations, etc.
We think of these building blocks as pipelines with one step, even when they are
used without an array.

When a pipeline id is unknown or missing, `mapTransform()` will throw. This
happens in the first function call, i.e. on setup. If you first call
`mapTransform()` with the defintion to get a mapper function, you'll get the
error right away, you don't have to attempt to map data to discover the error.

```javascript
import mapTransform, { apply, transform } from 'map-transform'

const ensureInteger = () => (data) => Number.parseInt(data, 10) || 0
const ensureString = () => (data) => String(data)
const options = {
  pipelines: {
    cast_entry: {
      title: ['title', transform(ensureString)],
      count: ['count', transform(ensureInteger)],
    },
  },
}
const def25 = [
  {
    title: 'heading',
    count: 'statistics.views',
  },
  apply('cast_entry'),
]

const data = {
  heading: 'Entry 1',
  statistics: {
    view: '18',
  },
}

await mapTransform(def7, options)(data)
// --> {
//   title: 'Entry 1',
//   count: 18
// }
```

You may also define the apply operation as an operation object:

```javascript
const def25b = [
  {
    title: 'heading',
    count: 'statistics.views',
  },
  { $apply: 'cast_entry' },
]
```

When you define the `apply` operation as an operation object like we do in
`def25b`, you may set `$iterate: true` on the operation object to apply the
pipeline to every item in an array, even when the pipeline itself has not
specified any iteration.

You may also set `$direction: 'fwd'` or `$direction: 'rev'` to have it apply in
one direction only.

#### `alt(pipeline, pipeline, ...)` operation

The `alt` operation will apply the given pipelines in turn until it gets a
value, meaning that if the first pipeline returns `undefined`, it will try the
next and so on. This is how you provide default values in MapTransform. The
pipeline may be as simple as a `transform(value())` operation, a dot notation
path into the source data, or a full pipeline with several operations.

Note that when the return value is an array, it is treated as a value, as it is
not an `undefined` value. To provide the `alt` operation to every item in the
array, use the `iterate` operation.

```javascript
import { alt, transform, transformers } from 'map-transform'
const { value } = transformers
const currentDate = () => (data) => new Date()
const formatDate = () => (data) => {
  /* implementation not included */
}

const def11 = {
  id: 'data.id',
  name: alt('data.name', transform(value('Anonymous'))),
  updatedAt: [
    alt('data.updateDate', 'data.createDate', transform(currentDate)),
    transform(formatDate),
  ],
}
```

In the example above, we first try to set the `updatedAt` prop to the data found
at `data.updateDate` in the source data. If that does not exist (i.e. we get
`undefined`), the alt operation tries the path `data.createDate`. If we still
get `undefined`, the custom transformer `currentDate` will be called, simply
returning the current date as a JS object. Finally, another transform operation
pipes whatever data we get from all of this through the `formatDate`
transformer.

When `alt` is run in reverse, the alternative pipelines are run in the oposite
order, with the last being run first. The first pipeline is always run, though,
as it is common practice to let the first be a `get` that acts like a `set` in
reverse. This may be confusing, but will usually just be naturally when you
don't think too much about it. See
[the `get` and `set` operations](#getpath-and-setpath-operation) for more on how
`get` works in reverse.

`alt` will behave a bit differently when you give only one pipeline: The
pipeline will be run if the curent value is `undefined`, but skipped otherwise.
This is different from the multi-pipeline behavor, where the first is always run
and the rest is only run if the previous returns `undefined`.

You may also define an alt operation as an operation object:

```javascript
const def11asObject = {
  id: 'data.id',
  name: { $alt: ['data.name', { $value: 'Anonymous' }] },
  updatedAt: [
    { $alt: ['data.updateDate', 'data.createDate', transform('currentDate')] },
    { $transform: 'formatDate' },
  ],
}
```

When you define the `alt` operation as an object, you may specify
`$iterate: true` on the object to run its pipelines on every item in the array,
or – with only one pipeline – provide default values to every `undefined`
item.

You may also set `$direction: 'fwd'` or `$direction: 'rev'` to limit it to one
direction only.

#### `concat(pipeline, pipeline, ...)` operation

The `concat` operation will flatten the result of every pipeline it is given
into one array. A pipeline that does not return an array will simple have its
return value appended to the array. Even when there's only one pipeline, its
value will be forced to an array. `undefined` will be filtered away from the
returned array.

In reverse, the value (array) will be set on the first pipeline, and the rest of
the pipelines will be given an empty array. The results of all the pipelines
will be merged.

If `concat` is not given any pipelines, it will return an empty array going
forward, and an empty object in reverse. The reason for the empty object is that
the normal behavior for concat is to get with paths from an object, and with
no paths, we can't set any props, so an empty object is the best we can do.

> **Note:** This operation is destructive, in that the result from running it
> forward cannot reproduce the original data when run in reverse. Only the data
> fetched by the given pipelines will be preserved, and the merged arrays cannot
> be unmerged.

```javascript
import { concat } from 'map-transform'

const def39 = {
  id: 'data.id',
  users: concat('data.users', 'data.admins'),
}
```

You may also define a concat operation as an operation object:

```javascript
const def39asObject = {
  id: 'data.id',
  users: { $concat: ['data.users', 'data.admins'] },
}
```

#### `concatRev(pipeline, pipeline, ...)` operation

The `concatRev` operation is the exact oposite of the `concat` operation,
meaning that it will exhibit the same behavior in reverse as `concat` does
going forward, and vice versa. See the description of
[the `concat` operation](#concatpipeline-pipeline--operation) for more
details.

Note that `concatRev` does not have an operation object notation, but `concat`
will honor the [flipped mode](#flipping-a-transform-object).

`concatRev` is also available as an operation object with `$concatRev`.

#### `merge(pipeline, pipeline, ...)` operation

`merge` will run all given pipelines and deep merge their results. Conflicts are
resolved by prioritizing results from the rightmost of the conflicting
pipelines.

> Editors note: We need examples here.

#### `modify(pipeline)` operation

Use the `modify` operation when you want the pipeline to modify an object,
instead of replacing it.

Example:

```javascript
import { modify } from 'map-transform'

const def34 = modify({
  data: 'data.deeply.placed.items',
})
```

`def34` will in effect set the values placed at a deep path on the `data`
prop. Giving this an object like:

```javascript
const response = {
  status: 'ok',
  data: { deeply: { placed: { items: [{ id: 'ent1' }] } } },
}
```

... will result in:

```javascript
const response = {
  status: 'ok',
  data: [{ id: 'ent1' }],
}
```

Had we ran this without the `modify` operation, the returned object would only
have the `data` prop, as no props from the source data will be set in the target
data, unless they are "picked up" by dot notation paths.

This is equivalent to setting the `$modify` property to `true` on the transform
object:

```javascript
const def34b = {
  $modify: true,
  data: 'data.deeply.placed.items',
}
```

Note that `$modify` may also be set further down in the object structure. Also,
in some cases it may make more sense to specify a path in the source data to
merge with:

```javascript
const def34c = {
  $modify: 'response',
  data: 'response.data.deeply.placed.items',
}
```

The `$modify` flag may also be set on a path:

```javascript
const def34d = {
  'content.$modify': 'response',
  'content.data': 'response.data.deeply.placed.items',
}
```

This is the way to set it for reverse direction:

```javascript
const def34e = {
  response: '$modify',
  'response.data.deeply.placed.items': 'data',
}
```

Note that setting a path like this, is only available when the `modify`
operation is defined as an operation object.

#### `fwd(pipeline)` and `rev(pipeline)` operation

All operations in MapTransform will apply in both directions, although some of
them may behave a bit different dependending on the direction. If you want an
operation to only apply in one direction, you need to wrap it in a `fwd` or
`rev` operation. The `fwd` operation will only apply its pipeline when we're
going forward, i.e. mapping in the normal direction, and its pipeline will be
skipped when we're mapping in reverse. The `rev` operation will only apply its
pipeline when we're mapping in reverse.

The value in the pipeline will be untouched when we are encountering an
operation that is not intended for the direction we are currently going in.

```javascript
import { fwd, rev, transform } from 'map-transform'
const increment = () => (data) => data + 1
const decrement = () => (data) => data - 1

const def12 = {
  order: ['index', fwd(transform(increment)), rev(transform(decrement))],
}
```

In the example above, we increment a zero-based index in the source data to get
a one-based order prop. When reverse mapping, we decrement the order prop to get
back to the zero-based index.

Note that the `order` pipeline in the example above could also have been written
as `['index', transform(increment, decrement)]`, as the transform operation
supports seperate forward and reverse functions, when it is given two functions.
You may have a similar syntax with
[the `divide` operation](#dividefwdPipeline-revPipeline-operation), and its
usually just a matter of what you think is clearer.

When defining operations as operation objects, you may accomplish the same by
setting the `$direction` prop to `fwd` or `rev`. This is also mentioned in the
description of the operations this makes sense for. You should also take a look
at the description of
[how to set aliases for the directions](#directional-transform-objects).

#### `divide(fwdPipeline, revPipeline)` operation

`divide` is `fwd` and `rev` operations combined, where the first argument is a
pipeline to use when going forward and the second when going in reverse.

See [`fwd` and `rev`](#fwdpipeline-and-revpipeline-operation) for more details.

#### `get(path)` and `set(path)` operation

Both the `get` and `set` operations accepts a dot notation path to act on. The
get operation will pull the data at the path from the data currently in the
pipeline, and replace the value in the pipeline with it. The set operation will
take what ever's in the pipeline and set it on the given path at a new object.

One reason they come as a pair, is that they will switch roles for reverse
mapping. Their names might make this a bit confusing, but in reverse, the `get`
operation will set and the `set` operation will get.

```javascript
import { get, set } from 'map-transform'

const def13 = [get('data.items[].content'), set('content[]')]
```

In the example above, the `get` operation will return an array of whatever is in
the `content` prop at each item in the `data.items[]` array. The set operation
will then create a new object with the array from the pipeline on the `content`
prop. Reverse map this end result, and you'll get what you started with, as the
`get` and `set` operations switch roles.

Using the `get` operation is equivalent to just providing the dot notation path
as a string. There is also an similar shortcut to the `set` operation, where you
provide the dot notation path with a `>` prefix. For compatability, you may also
use a `<` prefix for `get`, but there is usually no need to do that.

This is exactly the same as `def13`:

```javascript
const def13b = ['data.items[].content', '>content[]']
```

You may notice that the examples above could have been written with a transform
object, and you're absolutely right. The transform object is actually an
alternative to using `get` and `set` operations, and will be converted to
operations behind the curtains. There's however a big different, in that the
transform object will replace any data at the path it is set on, while a
pipeline with `set` will be merged with the existing structure.

This example results in the exact same pipeline as the examples above:

```javascript
const def13c = {
  'content[]': 'data.items[].content',
}
```

It's simply a matter of taste and of what's easiest in each case. We believe
that the transform object is best in cases where you describe a target object
with several properties, while `get` and `set` operations is best suited to
define paths for objects or arrays.

#### `root(pipeline)` operation

When you pass a pipeline to the root operation, the pipeline will be applied to
the data that was original passed to the pipeline – before any operations where
applied to it. The result of a root pipeline will still be inserted in the
pipeline at the point of the `root` operation, so this is not a way to alter
data out of the pipeline.

Let's look at an example:

```javascript
import mapTransform, { root } from 'map-transform'

const def15 = [
  'articles[]',
  {
    id: 'id',
    title: 'headline',
    section: root('meta.section'),
  },
]

const data = {
  articles: [{ id: '1', headline: 'An article' } /* ... */],
  meta: { section: 'news' },
}

await mapTransform(def15)(data)
// --> [
//   { id: '1', title: 'An article', section: 'news' }
//   /* ... */
// ]
```

As you see, every item in the `articles[]` array, will be mapped with the
`section` property from the `meta` object. This would not be available to the
items without the root operation.

There's also a shortcut notation for root, by prefixing a dot notation path with
`^^.`. This only works when the path is used for getting a value, and it will be
plugged when used as set (i.e., it will return no value). This shortcut may be
used wherever a path may be used.

The following examples, `def16` and `def16b`, are equal:

```javascript
const def16 = get('^^.meta.section')
const def16b = divide(root('meta.section'), plug())
```

#### `plug()` operation

The `plug` operation simply clears the value in the pipeline - it plugs it.
The value will be set to `undefined` regardless of what has happened before that
point. Any `alt` operations etc. coming after the plug will still have an
effect.

This main use case for this is to clear the value going one way. E.g. if you
need a value when you map in reverse, but don't want it going forward, plug it
with `fwd(plug())`. You will also need it in a pipeline where the only operation
is uni-directional (i.e. using `fwd` or `rev`). An empty pipeline (which is what
a uni-directional pipeline will be in the other direction), will return the data
you give it, which is usually not what you want in these cases. The solution is
to plug it in the other direction.

You could have accomplished the same with `transform(value(undefined))`, but
this will not work when `state.noDefaults` is `true`. `plug` will do its trick
in all cases.

#### `lookdown({ arrayPath, propPath, matchSeveral })` operation

The `lookdown` operation works the same as `lookup` but in the opposite direction. See
[the `lookup` operation](#lookup-arraypath-proppath-matchseveral-operation)
for more on how it works, just reverse the directions.

Note that `lookdown` does not have an operation object notation, but `lookup`
will honor the [flipped mode](#flipping-a-transform-object).

`lookdown` is also available as an operation object with `$lookdown`.

#### `lookup({ arrayPath, propPath, matchSeveral })` operation

`lookup` will take the value in the pipeline and replace it with the first
object in the `arrayPath` array that has a value in `propPath` matching it.
`arrayPath` may be a pipeline, but `propPath` can only be a dot notation path.

When `matchSeveral` is `true`, all matches – not only the first – will be
returned. Default is `false`.

In reverse, the `propPath` will simply be used as a get path, getting the prop
of the objects out of the objects, so to speak. (In the future, MapTransform
_might_ support setting the items back on the `arrayPath` in reverse.)

> **Note:** When `lookup` is called within a transform object in
> [flipped mode](#flipping-a-transform-object), it will behave in the opposite
> way, looking up in reverse mode and extracting `propPath` going forward.

Example:

```javascript
const def18 = [
  'content.meta.authors[]',
  lookup({ arrayPath: '^^.users[]', propPath: 'id' }),
]
const data = {
  content: { meta: { authors: ['user1', 'user3'] } },
  users: [
    { id: 'user1', name: 'User 1' },
    { id: 'user2', name: 'User 2' },
    { id: 'user3', name: 'User 3' },
  ],
}
const mapper = mapTransform(def18)
const mappedData = await mapper(data)
// --> [
//   { id: 'user1', name: 'User 1' },
//   { id: 'user3', name: 'User 3' }
// ]

mapper(mappedData, { rev: true })
// --> { content: { meta: { authors: ['user1', 'user3'] } } }
```

You may also define this as an operation object:

```javascript
const def18b = ['content.meta.authors[]', { $lookup: '$users[]', path: 'id' }]
```

The path on `$lookup` refers to `arrayPath` and `path` refers to `propPath`.

### Transformers

The following transformers may be applied to the value in a pipeline with the
[`transform` operation](#transformtransformfn-transformfnrev-operation), or used
with the [`filter` operation](#filterconditionFn-operation) to filter away
values in the pipeline.

#### `bucket({ path, buckets, groupByPath })` transformer

The `bucket` transformer will split an array out in buckets based on condition
pipelines (pipelines that will return truthy for the items that belong in
a certain bucket) or by size (how many items from the array to put in a bucket).
There's also an alternative way of using `groupByPath` (see below).

You may specify a `path` to the array that will be sorted into buckets.

The buckets are defined in an array on the `buckets` property, with one object
per bucket. The object has a `key` property that will be the key of the bucket
on the target object. When distributing based on condition pipelines, you set a
`condition` property to a pipeline that will return truthy for the items that
belong in the bucket. When distributing based on size, you set `size` to the
number of items you want to put in this bucket. You may also combine `condition`
and `size`, to get the provided number of items matching the condition.

Each item is tested against the bucket condition in the order the buckets are
defined, and will be placed in the first bucket that matches. You may have
a bucket without a condition or size, which will serve as a catch-all bucket,
and should therefore be placed last.

As an alternative to specifying `buckets`, you may provide a path or a pipeline
in `groupByPath`. The transformer will then fetch the value from that path or
pipeline for every item in the array, and use it as keys for buckets. Every item
with the same value returned from `groupByPath` will be grouped together. You
may for example set `groupByPath: 'category'` to get an object with all
available categories as keys, and items with a certain category grouped in an
array on the category property.

The value returned from the `groupByPath` pipeline will be forced to a string.
When the value from an item is a non-value, the item will not be put in any
group.

When a bucket is run in reverse, the items in the buckets will be merged into
one array. The order of the items will be the same as the order of the buckets
and not the order of the items in the original array. When a path is given, the
array will be set on this path.

```javascript
const def40 = transform(bucket({
  path: 'users[]',
  buckets: [
    {
      key: 'admin',
      condition: { $transform: 'compare', path: 'role', match: 'admin' },
    },
    {
      key: 'editor',
      condition: { $transform: 'compare', path: 'role', match: 'editor' },
    },
    {
      key: 'users',
    },
  ],
}))

const data = {
  users: [
    { id: 'user1', name: 'User 1', role: 'editor' },
    { id: 'user2', name: 'User 2', role: undefined },
    { id: 'user2', name: 'User 3' },
    { id: 'user3', name: 'User 4', role: 'admin' },
    { id: 'user3', name: 'User 5' },
    { id: 'user3', name: 'User 6', role: 'editor' },
  ],
}
const mapper = mapTransform(def40)
const mappedData = await mapper(data)
// --> {
//   admin: [
//     { id: 'user3', name: 'User 4', role: 'admin' },
//   ],
//   editor: [
//     { id: 'user1', name: 'User 1', role: 'editor' },
//     { id: 'user3', name: 'User 6', role: 'editor' },
//   ],
//   users: [
//     { id: 'user2', name: 'User 2', role: undefined },
//     { id: 'user2', name: 'User 3' },
//     { id: 'user3', name: 'User 5' },
//   ]
// }
```

Or by size:

```javascript
const def41 = transform(bucket({
  buckets: [{ key: 'top3', size: 3 }, { key: 'theOthers' }],
}))

const data = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7']

const mapper = mapTransform(def41)
const mappedData = await mapper(data)
// --> {
//   top3: ['user1', 'user2', 'user3'],
//   theOthers: ['user4', 'user5', 'user6', 'user7']
// }
```

You may also define this as an operation object:

```javascript
const def40b = {
  $transform: 'bucket',
  path: 'users[]',
  buckets: [
    {
      key: 'admin',
      condition: { $transform: 'compare', path: 'role', match: 'admin' },
    },
    {
      key: 'editor',
      condition: { $transform: 'compare', path: 'role', match: 'editor' },
    },
    {
      key: 'users',
    },
  ],
}

const def41b = {
  $transform: 'buckets',
  buckets: [{ key: 'top3', size: 3 }, { key: 'theOthers' }],
}
```

#### `compare({ path, operator, match, matchPath, not })` transformer

This is a transformer intended for use with the `filter` operation. You
pass a dot notation `path` and a `match` value (string, number, boolean, `null`
or `undefined`) to `compare`, and it returns a function that you can pass to
`filter` for filtering away data that does not not have the value set at the
provided path.

As an alternative to `match`, you may specify a `matchPath`, which is a dot
notation path, in which case the match value will be fetched from the provided
data.

The default is to check wheter the values resulting from `path` and `match` or
`matchPath` are the same (equality), but other operations may be set on the
`operator` property. Alternatives: `'='`, `'!='`, `'>'`, `'>='`, `'<'`, or
`'<='`, `in`, or `exists`. `in` requires equality to at least one of the
elements in an array, and `exists` requires any value besides `undefined`.

Dates are compared using their milliseconds since epoc (1970-01-01) numeric
values.

If the `path` points to an array, the value is expected to be one of the values
in the array.

Set `not` to `true` to reverse the result of the comparison.

Note: `value` and `valuePath` may be used as aliases for `match` and `matchPath`
for consistency with other transformers.

Here's an example where only data where `role` is set to 'admin' will be kept:

```javascript
import { filter, transformers } from 'map-transform'
const { compare } = transformers

const def19 = [
  {
    name: 'username',
    role: 'group',
  },
  filter(compare({ path: 'role', operator: '=', match: 'admin' })),
]
```

You may also define this with an operation object:

```javascript
const def19b = [
  {
    name: 'username',
    role: 'group',
  },
  { $filter: 'compare', path: 'role', operator: '=', match: 'admin' },
]
```

When you define the `compare` transformer as an operation object in JSON and need
to compare to `undefined`, use `**undefined**` instead.

#### `explode()` transformer

Given an object, the `explode` transformer will return an array with one object
for each property in the source object, with a `key` property for the property
key, and a `value` property for the value.

When given an array, the `explode` transformer will return on object for every
item in the array, with a `key` property set to the index number in the source
array and a `value` property to the item value.

When transforming in reverse, `explode` will try to compile an object or an
array from an array of key/value objects. If all `key` props are numbers, an
array is produced, otherwise an object. Anything that don't match the expected
structure will be skipped.

Example:

```javascript
import mapTransform, { transform, transformers } from 'map-transform'
const { explode } = transformers

const data = {
  currencies: { NOK: 1, USD: 0.125, EUR: 0.1 },
}

const def32 = ['currencies', transform(explode())]

await mapTransform(def32)(data)
// --> [{ key: 'NOK', value: 1 }, { key: 'USD', value: 0.125 },
//      { key: 'EUR', value: 0.1 }]
```

Or as an operation object:

```javascript
const def32b = ['currencies', { $transform: 'explode' }]
```

#### `fixed(data)` transformer

The data given to the fixed transformer, will be inserted in the pipeline in
place of any data that is already present at that point. The data may be an
object, a string, a number, a boolean, `null`, or `undefined – or an array of
any of these.

This is almost the same behavior as
[the `value` transformer](#valuedata-transformer), which is more commonly used,
except that the value set with `fixed` will be included even when
`state.noDefaults` is `true`. Use `value` for default values, and `fixed` for
values that should be set no matter what.

#### `flatten({ depth })` transformer

Will flatten an array the number of depths given by `depth`. Default depth is
`1`.

> Editors note: We need an example.

#### `index()` transformer

When iterating, this will return the index of the current item in the array.
When used outside of an iteration, it always returns `0`.

> Editors note: We need an example.

#### `implode()` transformer

This is the exact opposite of the `explode` helper, imploding going forward and
exploding in reverse. See
[the documentation for `explode`](#explode-transformer) for how this works.

#### `logical({ path, operator })` transformer

Will run all provided pipelines, force their return values to boolean, according
to JavaScript rules, and apply the logic specified by `operator`; either `AND`
or `OR`. If no `operator` is specified, `AND` is the default.

This transformer is typically used as a short-hand operation object, together
with
[the `ifelse` operation](#ifelseconditionFn-truePipeline-falsePipeline-operation),
to support AND logic:

```javascript
const def36 = [
  {
    $if: { $and: ['active', 'authorized'] },
    then: 'content',
    else: { $value: undefined },
  },
]
```

... or OR logic:

```javascript
const def37 = [
  {
    $if: { $or: ['active', 'draft'] },
    then: 'content',
    else: { $value: undefined },
  },
]
```

> Editors note: We should have an example of how to use it as a function too.

#### `map(dictionary)` transformer

This transformer accepts a dictionary described as an array of tuples, where
each tuple holds a _from_ value and a _to_ value. When a value is given to the
`map` transformer, it is replaced with a value from the dictionary. When going
forward, the first value in the tuple will be matched with the given data value,
and the second value will be returned. In reverse, the second value is matched
and the first is returned.

When there are more than one matches, the first one is applied.

The wildcard value `*` will match any value, and is applied if there is no other
match in the dictionary. When the returned value is `*`, the original data value
is used instead. This is useful when you only want to map a few values, and keep
everything else. Add a `['*', '*']` tupple at the end, and it will match
anything that is not already matched, and return it untouched.

The `map` transformer only supports primitive values, so when trying to map an
object, you will get the value given by the wildcard in the dictionary, or
`undefined`. Arrays will be iterated to map each value in the array.

To map to or from `undefined` with a dictionary defined in JSON, use the value
`**undefined**`.

Example:

```javascript
import { transform, transformers } from 'map-transform'
const { map } = transformers

const dictionary = [
  [200, 'ok'],
  [404, 'notfound'],
  ['*', 'error'],
]

const def28 = {
  status: ['result', transform(map({ dictionary }))],
}
```

When using `map` in an operation object, you may provide a dictionary array
or a named dictionary on the `dictionary` property. Here's an example with a
named dictionary:

```javascript
import mapTransform from 'map-transform'

const dictionary = [
  [200, 'ok'],
  [404, 'notfound'],
  ['*', 'error'],
]
const options = { dictionaries: { statusCodes: dictionary } }

const def28b = {
  status: ['result', { $transform: 'map', dictionary: 'statusCodes' }],
}

const mapper = mapTransform(def28b, options)
```

You may also provide a `flip` property on the operation object, and when set to
`true`, it will use the dictionary in the opposite direction. This means that
if may e.g. use a dictionary in reverse, as if you were going forward. The
default value is `false`.

#### `merge({path})` transformer

The `merge` transformer accepts a pipeline or an array of pipelines in `path`,
and the objects or array of objects these pipline(s) return will be merge into
one object. Merging happens from left to right, so the props of the last object
will have priority. However, `undefined` values will never overwrite another
value.

In reverse, the pipeline data will be provided to every pipeline in `path`, as
there is no way of splitting up the "original" data. In most cases the pipeline
data will be set on the props they were "originally" fetched and merged from.

> **Note:** This transformer is destructive, in that the result from running it
> forward cannot reproduce the original data when run in reverse. Only the data
> fetched by the given pipelines will be preserved, and the merged object cannot
> be unmerged.

```javascript
import mapTransform, { transform, transformers } from 'map-transform'
const { merge } = transformers

const data = {
  original: { id: 'ent1', title: 'Entry 1', text: null },
  updated: { id: undefined, title: 'Better title' },
  final: { text: 'Here we are now' },
}

const def38 = {
  data: transform(merge({ path: ['original', 'updated', 'final'] })),
}

await mapTransform(def38)(data)
// --> { id: 'ent1', title: 'Better title', text: 'Here we are now' }
```

The `merge` transformer is available through a short-cut operation object:

```javascript
const def38b = {
  data: { $merge: ['original', 'updated', 'final'] },
}
```

#### `mergeRev({path})` transformer

The `mergeRev` transformer has the opposite behavior of the `merge` transformer,
in that it will do forward what `merge` does in reverse, and vice versa. See
[the `merge` transformer](#mergepath-transformer) for more details.

#### `not(value)` transformer

`not` will return `false` when the value in the pipeline is truthy, and `true`
when value is falsy. This is useful for making the `filter` operation do the
opposite of what the filter transformer implies.

Here we filter _away_ all data where role is set to 'admin':

```javascript
import { filter, transformers } from 'map-transform'
const { compare } = transformers

const def21 = [
  {
    name: 'username',
    role: 'group',
  },
  filter(not(compare({ path: 'role', match: 'admin' }))),
]
```

When using operation objects, you don't have an equivalent yet, but with the
`compare` transformer, you could do it like this:

```javascript
const def21b = [
  {
    name: 'username',
    role: 'group',
  },
  { $filter: 'compare', path: 'role', not: true, match: 'admin' },
]
```

#### `project({include, exclude})` transformer

Will return an object with only the props specified in `include` or none of the
props in `exclude`. Both `include` and `exclude` may be array of strings, and
they should not be used in combination. If both are provided, `include` will be
used.

You may also specify an `includePath` or `excludePath`. These are dot notation
paths to arrays of strings, and will be used instead of `include` or `exclude`.
If `include` or `exclude` are also provided, they will be used as default
values when the corresponding path yields no value. Note that "no value" here
means `undefined`, and we don't support custom nonvalues here yet.

When given an array of object, each object will be projected. When given
anything that is not an object, undefined will be returned.

As we cannot bring back the removed props when mapping in reverse, this
transformer will pass on the object data as is in reverse.

```javascript
import { transform, transformers } from 'map-transform'
const { project } = transformers

const def42 = transform(project({ include: ['id', 'name'] }))

const data = {
  id: 'ent1',
  name: 'Entry 1',
  text: 'Do not include',
  created: new Date('2023-12-01T00:00:00Z'),
}

const mapper = mapTransform(def42)
const mappedData = await mapper(data)
// --> {
//   id: 'ent1',
//   name: 'Entry 1',
// }
```

You may also define this as an operation object:

```javascript
const def42b = { $transform: 'project', include: ['id', 'name'] }
```

#### `sort({asc, path})` transformer

The `sort` transformer will sort the array at the given `path`, in the direction
given by `asc`. The default direction is ascending (`asc` is `true` by default).

When no `path` is given, the sort is performed on the array in pipeline. Note
that `path` needs to be a dot notation path when specified, it cannot be a full
pipeline.

Example:

```javascript
import mapTransform, { transform, transformers } from 'map-transform'
const { sort } = transformers

const data = {
  items: [{ id: 'ent5' }, { id: 'ent1' }, { id: 'ent3' }],
}

const def35 = {
  data: ['items', transform(sort({ asc: true, path: 'id' }))],
}

await mapTransform(def35)(data)
// --> [{ id: 'ent1' }, { id: 'ent3' }, { id: 'ent5' }]
```

The `sort` transformer is also available as an operation object:

```javascript
const def35b = {
  data: ['items', { $transform: 'sort', asc: true, path: 'id' }],
}
```

> Editors note: What happens if the value is not an array?

#### `value(data)` transformer

The data given to the `value` transformer, will be inserted in the pipeline in
place of any data that is already present at that point. The data may be an
object, a string, a number, a boolean, `null`, or `undefined` – or an array of
any of these.

This could be useful for:

- Setting a value on a property, that is not found in the source data
- Providing a default value to
  [the `alt` operation](#altpipeline-pipeline--operation)

Example of both:

```javascript
import { alt, transform, transformers } from 'map-transform'
const { value } = transformers

const def10 = {
  id: 'data.customerNo',
  type: transform(value('customer')),
  name: alt('data.name', transform(value('Anonymous'))),
}
```

Important: The `value` transformer will not set anything when mapping when
`state.noDefaults` is `true`. Use
[the `fixed` transformer](#fixeddata-transformer) if this is not your wanted
behavior.

As the `value` transformer is very common, it has it's own short-hand operation
object notation, that can be used insted of the `transformer` operation object.
In the following example, you'll see both:

```javascript
const def10b = {
  id: 'data.customerNo',
  type: { $transform: 'value', value: 'customer' },
  name: { $alt: ['data.name', { $value: 'Anonymous' }] },
}
```

I.e., `{ $value: 'Anonymous' }` is the same as
`{ $transform: 'value', value: 'Anonymous' }`.

### Reverse mapping

When you define a transform pipeline for MapTransform, you also define the
reverse transformation, i.e. you can run data in both direction through the
pipeline. This comes "for free" for simple mappings, but might require some
extra work for more complex mappings with `transform` operations, `alt`
operations, etc.

You should also keep in mind that, depending on your defined pipeline, the
mapping may result in data loss, as only the data that is mapped to the target
object is kept. This may be obvious, but it's an important fact to remember if
you plan to map back and forth between two data "shapes" – all values must be
mapped to be able to map back to the original data.

Let's see an example of reverse mapping:

```javascript
import mapTransform, { alt, value } from 'map-transform'

const def22 = [
  'data.customers[]',
  {
    id: 'customerNo',
    name: [alt('fullname', transform(value('Anonymous')))],
  },
]

const data = [
  { id: 'cust1', name: 'Fred Johnsen' },
  { id: 'cust2', name: 'Lucy Knight' },
  { id: 'cust3' },
]

await mapTransform(def22)(data, { rev: true })
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

Transform objects allow one value in the source data to be used for several
properties on the target object, but to do this in reverse, you have to use a
special syntax where you suffix the keys with a slash and a number. The reason
for this, is that you would otherwise get several equal keys, which is not
supported in neighter JavaScript nor JSON.

For example:

```javascript
import mapTransform, { transform } from 'map-transform'

const username = (name) => name.replace(/\s+/, '.').toLowerCase()

const def23 = [
  'data.customers[]',
  {
    id: 'customerNo',
    name: 'fullname',
    'name/1': ['username', rev(transform(username))],
  },
]

const data = [{ id: 'cust1', name: 'Fred Johnsen' }]

await mapTransform(def23)(data, { rev: true })
// --> {
// data: {
//   customers: [
//     { customerNo: 'cust1', fullname: 'Fred Johnsen', username: 'fred.johnsen' }
//   ]
// }
// }
```

When seeing MapTransform encounters paths with such suffixes going forward, it
will simply skip them. The convention is to have the first occurence without a
slash suffix, and let this be the one to use in forward mode.

#### Flipping a transform object

In some cases, the reverse transform is more complex than the forward transform.
For that reason, there is a `$flip` property that may be set to `true` on a
transform object, to indicate that it is defined from the reverse perspective
and should be flipped before transforming data with it.

A flipped transformation object will – in forward transformations – get with the
properties on the object and set with the paths in the value. The order of paths
and operations in a pipeline will also be reversed.

Important: Flipping a transform object will not affect any operations that
behaves differently depending on direction, and they will run as if they were
used in a non-flipped transformation object. The only exceptions from this, are
[the `get` and `set` operations](#getpath-and-setpath-operation) and
[the `lookup` operation](#lookup-arrayPath-propPath-matchSeveral--operation),
which will all behave as if we were in forward mode, when we're really in
reverse in a flipped transform object.

Also note that flipping will affect the `get` and `set` operations in the same
way as paths on a transform object.

This flipped defintion:

```javascript
const def33 = {
  $flip: true,
  id: 'key',
  attributes: {
    title: ['headline', transform(threeLetters)],
    age: ['unknown'],
  },
  relationships: {
    author: transform(value('johnf')),
  },
}
```

... is identical to:

```javascript
const def33b = {
  key: 'id',
  headline: ['attributes.title', transform(threeLetters)],
  unknown: ['attributes.age']
  },
  'none/1': ['relationships.author': transform(value('johnf'))]
}
```

The flipped definition is (in this case) easier to read.

Note also the `'none/1'` property in `def33b`, that will stop this property from
being set when going forward. This is not necessary on the flipped definition,
but also results in a definition that will not work as expected going forward.
This is a weakness in how MapTransform treats pipelines right now, and will
probably be resolved in the future. For now, make sure to always have a path
at the beginning of all pipelines if you plan to reverse transform – and the
same goes for flipped transform objects if you want to forward transform.

### Mapping without defaults

MapTransform will try its best to map the data to the shape you want, and will
always set all properties, even though the mapping you defined result in
`undefined`. You may include `alt` operations to provide default or fallback
values for these cases.

But sometimes, you only want the data that is actually present in the source
data, without defaults or properties set to `undefined`. You may accomplish this
by setting `state.noDefaults` to true, either by setting in on the initial state
given to `mapTransform()` or by setting the `$noDefaults` flag on a transform
object (will set `noDefaults` on the state for everything happening within that
transform object).

This will keep values from the `value` transformer from being used in the
mutation, but note that values from the `fixed` transformer will still be
included. This is by design.

```javascript
import mapTransform, { alt, transform, transformers } from 'map-transform'
const { value } = transformers

const def17 = {
  id: 'customerNo',
  name: alt('fullname', transform(value('Anonymous'))),
}

const def24 = {
  $noDefaults: true, // This is the only difference from `def17`
  id: 'customerNo',
  name: alt('fullname', transform(value('Anonymous'))),
}

const mapper17 = await mapTransform(def17)
const mapper24 = await mapTransform(def24)

mapper17({ customerNo: 'cust4' })
// --> { id: 'cust4', name: 'Anonymous' }
mapper17({ customerNo: 'cust4' }, { noDefaults: true }) // We may set this flag on the initial state
// --> { id: 'cust4' }

mapper24({ customerNo: 'cust4' })
// --> { id: 'cust4' }
mapper24({ customerNo: 'cust5', fullname: 'Alex Troy' })
// --> { id: 'cust5', name: 'Alex Troy' }

// This also applies in reverse mapping
mapper17({ id: 'cust4' }, { rev: true })
// -> { customerNo: 'cust4', name: 'Anonymous' }
mapper17({ id: 'cust4' }, { rev: true, noDefaults: true })
// -> { customerNo: 'cust4' }
mapper24({ id: 'cust4' }, { rev: true })
// -> { customerNo: 'cust4' }
```

### The state object

MapTransform uses a state object internally to pass on data, context, target,
etc. between pipelines and operations. You may, however, encounter this state
object when you write your own transformers, as it is passed to the transformer
function as the second argument (the current pipeline value is the first).

Most of the props on the state object should be regarded as MapTransform
internal and subject to change without notice, but a few is good to know and
might also be necessary to make your transformer work the way you want:

- `rev`: When this is `true`, we are in reverse mode, so if your transformer
  should work differently depending on direction, you should check this prop.
- `flip`: When `true`, we are being called from a transform object in
  [flip mode](#flipping-a-transform-object), meaning that the transform object
  is defined from the perspective of the reverse mode and flipped before it's
  used in a transformation. This should not affect most transformers, as we will
  treat the direction the same regardless of how the transformer object is
  defined, but there might still be cases where you want to xor `rev` and `flip``
  to get direction.
- `noDefaults`: This is `true` when we have asked MapTransform in some way to
  [not include default values](#mapping-without-defaults). This may or may not
  concern your transformer.
- `iterate`: When `true`, we are currently iterating.
- `index`: When iterating, this will be the index of the current item in an
  array. When not iterating, `index` will be `0` or `undefined`.

The following props should not be trusted to stay stable across MapTransform
versions, and should not be used in custom transformers:

- `value`: This is the value of the pipeline, and will be the same as passed to
  the transformer in the first argument.
- `context`: An array with the "history" of the transformation from the root up
  to the current point. This is used to support parent and root notations.
- `target`: The target object at the current point. When setting on a path, the
  setting will happen on this target.

Note that you may provide the `mapTransform()` function with an initial state
object as its second argument. Only `rev`, `noDefaults`, and `target` will be
passed on from the state object you provide.

### Defining transformations with JSON

The definition format of MapTransform is well suited for JSON, which may be
useful when storing the definitions in a database or transferring it over http
or whatever the need would be.

Most of the operations has operation object equivalents, allowing the operations
to be expressed as JSON-friendly objects. With a set of commonly shared
transformers passed to `mapTransform()` on the `options` object, storing and
sharing definitions over JSON is quite trivial. This is how we use MapTransform
in [Integreat](https://github.com/integreat-io/integreat#readme), which it was
initially written for.

There's probably only one real challenge in turning a transformation defition
into JSON: `undefined`. JSON have no way of specifying `undefined` other than
omiting properties that would have had `undefined` as a value. So when we e.g.
needs to specify that a value should be mapped to `undefined`, or we would like
to specifically set a value to `undefined` with `{ $value: undefined }`, JSON
has in itself no real solution.

The "hack" we have chosen for MapTransform is to use the value
`'**undefined**'`, as we think it's unlikely that anyone will use that value for
any other reason. (We should probably make it configurable, just in case.) The
operations and transformers where it is important to specify `undefined` also
supports this keyword, and you'll find it in the documentation where it's
relevant.

Another value that is often used in transformations and is not natively
supported in JSON, is the Date object. A convention is to specify dates in the
ISO8601 format ("2023-03-07T07:03:17Z") or as a UNIX timestamp, and use
a transformer to turn it into an actual Date object.

### TypeScript

MapTransform is written completely in TypeScript, even though all the examples
in this documentation are in JavaScript for simplicity and readability.

All relevent types are exposed at `map-transform/types`, and may be imported
into your project like so:

```javascript
import type { Transformer } from 'map-transform/types'
```

The most usefull types will probably be `Transformer`, that you should use when
writing your own transformer, and `TransformDefinition`, that types the full
definition format of MapTransform.

Data given to and returned from MapTransform is typed as `unknown`, as we can't
know what it will be, and to signal that it should be typed by the user.

## Running the tests

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
