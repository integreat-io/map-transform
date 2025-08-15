# MapTransform

Map and transform data with mapping definitions.

[![npm Version](https://img.shields.io/npm/v/map-transform.svg)](https://www.npmjs.com/package/map-transform)
[![Maintainability](https://qlty.sh/gh/integreat-io/projects/map-transform/maintainability.svg)](https://qlty.sh/gh/integreat-io/projects/map-transform)

Behind this rather boring name hides a powerful JavaScript/TypeScript object
transformer.

Some highlighted features:

- You define how your data should be transformed by creating the (JavaScript)
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

Requires node v14, but note that we are not actively testing older versions than
v18.19 anymore. We recommend using node v22 or v24.

We're working towards a v2.0 of `map-transform`, that will drop support for
older node versions, among other breaking changes. We expect to still support
node versions from v20, but might also drop anything below v22, depending on the
state of the node world at the time we release our v2.0.

> [!NOTE]
> This package is native [ESM](https://nodejs.org/api/esm.html). See this guide
> on how to
> [convert to or use ESM packages](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

### Installing

Install from npm:

```
npm install map-transform
```

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
          date: 1533750490952,
        },
      },
    },
  ],
}

// You describe the object you want
const def = {
  title: 'data[0].content.name',
  author: 'data[0].content.meta.author',
  date: 'data[0].content.meta.date',
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
const def = [
  'data[0].content',
  {
    title: 'name',
    author: 'meta.author',
    date: 'meta.date',
  },
]

await mapTransform(def)(source)
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
const msToDate = () => () => (ms) => new Date(ms).toISOString()
const options = {
  transformers: { msToDate },
}

const def = [
  'data[0].content',
  {
    title: 'name',
    author: 'meta.author',
    date: ['meta.date', { $transform: 'msToDate' }],
  },
]

await mapTransform(def, options)(source)
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

await mapTransform(def)(source, { target }) // We're reusing `def` from the previous example
// --> {
//   id: '12345',
//   title: 'An interesting piece',
//   author: 'fredj',
//   date: '2018-08-08T17:48:10.952Z'
// }
```

> [!NOTE]
> We are preparing for an upcoming 2.0 version, which will include breaking
> changes.
>
> The biggest change will be that we drop support for the approach where
> operation functions can be used directly in the pipelines. Instead, the only
> way of defining operations will be through the object notation (operation
> objects). This doesn't change what you can do with `map-transform`, it only
> simplifies the implementation and makes it faster and more memory efficient.
>
> This change also follows the ideal in MapTransform that any pipeline or
> transform definition should be expressable in pure JSON (but see
> [the note on JSON](#a-note-on-json)).
>
> You can already start using the upcoming v2.0 implementation by using
> `import { mapTransformSync, mapTransformAsync } from 'map-transform'`. As the
> exported names imply, there is a synchronious and an asynchronious version.
> Note that these function have some breaking changes and are not to be
> considered stable until the 2.0 version.
>
> We have also rewritten this README to focus on object notations first, and
> the functional approach second. We have tried to mention what has changed in
> the new `mapTransformSync` and `mapTransformAsync`, but there might still be
> gaps in the documentation here.

### The mutation object

Think of a mutation object as a description of the object structure you want.

> [!NOTE]
> Mutation objects were previously called "transform objects", and
> "mapping objects" before that. We're changing our terminalogy to keep in line
> with the [Integreat project](https://github.com/integreat-io/integreat), where
> MapTransform originally started and was spawned out from.

#### Keys on the mutation object

In essence, the keys on a mutation object will be the keys on the target object.
You may, however, specify keys with [dot notation](#dot-notation-paths), which
will be made into a structure of child objects and potentially arrays on the
target. You can also specify the child objects directly on the mutation object,
so in most cases this is just a matter of taste or practicality.

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

When you transform an array of data with a mutation object, you'll have to set
`$iterate: true` to have each item in the data array be transformed with the
mutation object. If you don't, the entire array will be passed to the mutation
object. This will in most cases have the (propably unwanted) effect of returning
one object with an array of values on every property.

```javascript
const def = {
  $iterate: true,
  title: 'heading',
}

// -->
// [
//   { title: 'The first heading' },
//   { title: 'The second heading' }
// ]
```

A key will set whatever is returned by the pipeline (see
[next section](#values-on-the-transform-object)), whether it is a string, a
boolean, an array, etc. If you want to ensure that you always get an array, you
can suffix the key with `[]`. Any value that is not an array will be wrapped in
one.

```javascript
const def = {
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

A bonus of using the `[]` suffix, is that when key has another mutation object
as its value, this mutation object will be iterated by default (no need to set
the `$iterate` property). This does not happen to pipelines, paths, or
operations.

> [!NOTE]
> This automatic iteration will disappear in v2.0 and is also removed in the
> new `mapTransformSync` and `mapTransformAsync` exports.

#### Values on the mutation object

Values on a mutation objects define how to retrieve and transform data from the
source object, before it is set on the target object.

As you have already seen, you may set a **mutation object** as the value, which
will result in child objects on the target, but at some point, you'll want to
define how to get data from the source object.

The simplest form is a [dot notation path](#dot-notation-paths), that describes
what prop to pick from the source object for this particular target key. It will
retrieve whatever is at this path on the source object.

```javascript
const def = {
  title: 'data.item.heading',
}

const sourceData = {
  data: {
    item: {
      id: 'item1',
      heading: 'The actual heading',
      intro: 'The actual intro',
    },
  },
}

await mapTransform(def)(sourceData)
// --> {
//   title: 'The actual heading'
// }
```

The target object will only include values from the source object that are
"picked up" by the paths on the mutation object. Other values are discarded.

The paths for the source data may also include brackets to indicate arrays in
the data. It is usually not necessary, as MapTransform will map any array it
finds, but it may be good to indicate what you expect from the source data, and
it may be important if you plan to reverse transform with the mutation object.

To pass on the value in the pipeline, without going down a path, simply use a
dot `'.'`.

You may pick a single item from an array by indicating an index within brackets:

```javascript
const def = {
  title: 'data.items[0].heading',
}

// Will pull the heading from the first item in the `items` array, and not
// return any array:
// {
//   title: 'The actual heading'
// }
```

Finally, a mutation object value may be set to a
[**transform pipeline**](#transform-pipelines), or an operation that could have
been a step in a transform pipeline (which the dot notation path really is, and
– come to think of it – the mutation object itself too). This is explained in
detail below.

#### A note on undefined and null

MapTransform will treat `undefined` as a "non-value" in several ways:

- When using the `alt` operator, alternative pipelines are run as long as we get
  `undefined`
- When `state.noDefaults` is `true`, `undefined` values will not be set (see
  [mapping without defaults](#mapping-without-defaults) for more on this)
- When forcing an array with brackets notation on a path, `undefined` will
  return an empty array (not `[undefined]`)

This is not the case for `null`, though. MapTransform treats `null` as a value,
an _intended nothing_. To change this behavior,
set `nonvalues: [undefined, null]` on the `options` object passed to
MapTransform. This will essentially make MapTransform treat `null` the same way
as `undefined`.

You could in principle include any primitive value in `nonvalues` and it will be
treated as `undefined`, e.g. an empty string or the number `0`.

A mutation object will be skipped in its entirety when it encounters a non-value
in the pipeline. This is not always wanted, e.g. when the mutation object has
defaults that we want to set in the mutation object. In these cases, you may set
`$alwaysApply: true` on the mutation object. Note that you also have to set this
for sub-mutation objects if you want to apply those as well, as this prop is not
inherited.

#### Directional mutation objects

A mutation object will by default applied both when transforming forward, which
is the default, and in reverse (by setting the option `rev: true`). You may
alter this by setting the `$direction` prop on a mutation object, with `fwd`
`rev`, or `both` (the default) as possible values.

When running a forward transformation, mutation objects marked with
`$direction: 'rev'` will be skipped. The same goes for `$direction: 'fwd'` in
reverse. This will cause the value in the pipeline to be passed unchanged.

You may specify aliases for `fwd` and `rev` in the `mapTransform` options:

```javascript
const options = { fwdAlias: 'from', revAlias: 'to' }
const mapper = mapTransform(def, options)
```

In this case, `from` and `to` may be used to specify forward and reverse
direction respectively. `fwd` and `rev` will still work in addition to the
aliases.

#### Modifying an object instead of replacing it

Normal behavior for a mutation object is to create a new object and replace
whatever is in the pipeline. By setting `$modify: true` on a mutation object,
you will instead modify an object in the pipeline, keeping all properties not
set by the mutation object. This is essentially the same as using the spread
notation in JavaScript `{ ...existing, newProp: 'something' }`.

An example:

```javascript
const def = {
  $modify: true,
  data: 'data.deeply.placed.items',
}
```

The modification only applies to the level you set `$modify` on, so the entire
`data` property will be overwritten here. It will _not_ be merged with any
existing `data` property on the object in the pipeline.

`$modify` may also be set further down in the object structure. Also, you may
specify a path to the object to merge with. In this example, the returned object
will modify the object on the `response` property, instead of the root object,
and the root object will be completely overwritten:

```javascript
const def = {
  $modify: 'response',
  data: 'response.data.deeply.placed.items',
}
```

The `$modify: true` notation is actually an alias for `$modify: '.'`.

This is the way to set it for reverse direction (this is the exact same as the
example above, just reversed):

```javascript
const def = {
  response: '$modify',
  'response.data.deeply.placed.items': 'data',
}
```

If you prefer, you may modify deeper down in the object structure by setting
the `$modify` flag at the end of a path:

```javascript
const def = {
  'content.$modify': 'response',
  'content.data': 'response.data.deeply.placed.items',
}
```

### Transform pipelines

The idea of the transform pipeline, or "pipeline" for short, is that you
describe a set of transformation steps, often called operations, that will be
applied to the data given to it, so that the data will come out on the other
"end" of the pipeline in another format. The result from each step is passed on
to the next.

You may also run data through the pipeline in the opposite direction – in
**reverse mode**, by setting the MapTransform option `rev: true`. Data that came
out of the pipeline in forward mode, could in principle be run through the
pipeline in reverse mode and come out in the original form again. We say "in
principle", because some operations are not reversible and you may have data
loss by not including all props from the original data in the target data.

See [reverse mapping](#reverse-mapping) for more on this.

One way to put it, is that a pipeline describes the difference between the two
possible shapes of the data, and allows you to go back and forth between them.
Or you can just view it as transformation steps applied in the order they are
defined – or back again.

You define a pipeline as an array where each item is a step, like a
[dot notation path](#dot-notation-paths), a
[mutation object](#the-mutation-object), or an
[operation object](#operation-objects) of some kind.

If the pipeline holds only one step, you may skip the array, as a handy
shortcut. This is why we sometimes use the phrase "pipeline" to include anything
that could go into a pipeline as well. As an example, a path is essentially a
pipeline with only one step – the path.

Here's an example pipeline that will retrieve an array of objects from the path
`data.items[]`, map each object to an object with the props `id`, `title`, and
`sections` (`title` is shortened to max 20 chars and `sections` will be an array
of ids pulled from an array of section objects), and finally filter away all
items with no values in the `sections` prop.

```javascript
import { transform, filter } from 'map-transform'

const def = [
  'data.items[]',
  {
    $iterate: true,
    id: 'articleNo',
    title: ['headline', { $transform: 'maxLength', length: 20 }],
    sections: 'meta.sections[].id',
  },
  { $filter: 'onlyItemsWithSection' },
]
```

(Note that in this example, both `maxLength` and `onlyItemsWithSection` are
custom transformers for this case, but their implementations are not provided
here.)

**A note on arrays:** In a transform pipeline, the default behavior is to treat
an array as any other data. The array will be passed on to a `transform`
operation, the entire array will be set on a path, etc. This also means that a
mutation object will be applied to the entire array if nothing else is specified.
In the example above, we have set `$iterate: true` on the mutation object, to
signal that we want the mutation to be applied to each item of any array. See
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
putting property keys together seperated by a dot `.`.

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
would usually set several paths that would combine to a bigger object structure.

Note that keys starting with a dollar sign `$` has special meaning in
MapTransform, so when you need keys in your data to actualy start with `$`, you
need to escape it in your paths. E.g. `data[].\$type`. (Remember to
double-escape in JavaScript and other contexts that require it.)

#### Paths and arrays

When a path points to an array, the entire array will be returned. Paths may
also point to props on objects within arrays, and MapTransform will resolve this
be mapping over the items in the array to its best effort. Getting `tags.id`
from the data above will return the array `['news', 'sports']`, as these are the
`id` props from the object in the array found at `tags`.

You may also explicitly state that you expect an array. You didn't really have
to in the example above, but you could have used the path `tags[].id` to make it
clearer what you expect. `tags.id[]` would have also given the same result. The
main big reason to explicitly include the brackets here, is to make sure that
you always get an array, even if the data has no array. The path
`content[].title` would return `['The title']` as if `content` was an array.

Also, by setting the bracket notation at the right place, you help MapTransform
getting the structure right when transforming in reverse mode. When running
`['news', 'sports']` through `tags[].id` in reverse, you would get
`{ tags: [{ id: 'news' }, { id: 'sports' }] }`, while `tags.id[]` would result
in `{ tags: { id: ['news', 'sports'] } }`.

When a path with bracket notation meets `undefined` or any other
[nonvalue](#a-note-on-undefined-and-null), an empty array will be returned,
as you have stated that you expect an array. The only exception from this is
when [`state.noDefaults` is `true`](#mapping-without-defaults), in which case
you'll get `undefined`.

It may not always be straight forward how MapTransform should set on a path with
array notation, but it will again do its best. When there is no other
indications as to where the array belongs, MapTransform will set it where the
bracket notation is. So `content[].title` will return the object
`{ content: [{ title: 'The title' }] }`, while `content.title[]` would return
`{ content: { title: ['The title'] } }`, This will most likely work as you
expect, as long as you use the brackets notation to guide MapTransform.

> Editors note: We should give more complicated examples as well.

Finally, you may include index numbers between the brackets, to only get a
specific item. `tags[0].id` would get `'news'` from the data above. Use a
negative number to count from the end (`-1` being the last item). The index
version of the brackets notation won't return an array (as expected), unless
the item at the index is another array (a sub-array).

When setting with an index bracket notation, you'll get an array where the
bracket notation is, with one item at the index you've specified.

#### Parent and root paths

A subtle aspect of using paths to get values in
[transform pipelines](#transform-pipelines), is that you are not only returning
a value, you are also "moving" further down in the data structure. When you
apply the path `content` to the data above inside a transform pipeline, the
object `{ title: 'The title' }` will be returned and will in essence be the only
data that the next operation in the pipeline will know.

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

> Editors note: We should probably have more examples here, especially on what
> happens in a pipeline where we go up and down.

The root notation follows the same logic, but will always go to the base level
of the original data structure, regardless of how many levels down you have
moved. Roots are specified with double carrets, so the path `^^.id` will get the
id from our data from anywhere in the data structure, be it in `content` or when
iterating through `tags[]`.

There is a big gotcha here, for both parent and root paths, relating to whether
you're moving up in the original or the transformed data. The correct answer is
that you're moving in the transformed data – if it is transformed. This need
some explaining. Say you have a pipeline where you first transforms the data on
the level you're at with a mutation object. The following steps in the pipeline
will relate to the mutated object, and if you move into the mutated data with a
path, and the go up again with a parent path, you are moving up in the mutated
data. But if you instead just move into the data without transforming it, moving
up with a parent path will give you the original data – there's nothing else,
as you have not transformed it.

This is probably as expected, but the confusing part comes into play when there
is some "distance" between transforming the data and referencing it with a root
or parent path, especially the root. Say you first transform the root level with
a mutation object, then move on with other operations, and then at some point,
further down in the data, you want to reference something at the root level in
_the original data_. Well, now you can't, as you have transformed the root
level, but you might have not realized you actually did that. This is even more
confusing when you write a named pipeline and reference it with an `$apply`
operation, as you have no knowledge in the named pipeline about any mutation of
the root outside it.

All of this should make sense when you think about it the right way, but might
be confusing in practice. Try to picture the pipeline and how data changes in
it, and you will always reference the transformed data – if it has been
transformed. And sometimes, in complex cases, you might just have to test it.

Note also, that if you are within a mutation object and move down into the data,
the data above where you are isn't transformed yet. As long as you are within a
mutation object, you're referencing the data as it was before entering that
mutation object. But as soon as you move to the next step in the pipeline –
after the mutation object, you are left with the results of that mutation
object.

> Editor's note: We need examples.

> [!NOTE]
> Setting on parent and root paths is currently not supported, but may be in
> the future.

#### Setting on a path

You have already seen how paths can be used in mutation objects to set values,
like you do when you set a path on a key. But paths are by default getting
values, like in `['data.items[].content']`, where this pipeline will give you
whatever is in the inner `content` props (this will be an array).

But there is a way to turn a path into a set path without using a mutation
object, by giving it a `>` prefix, like this:

```javascript
const def = ['data.items[].content', '>content[]']
```

This pipeline will get the inner `content` props as an array, and then set this
array on a `content` prop on a new object, which will be the result of this
pipeline.

The example above could also have been written with a mutation object, like
this:

```javascript
const def1 = {
  'content[]': 'data.items[].content',
}
```

This is simply a matter of taste and of what's easiest in each case. The
mutation object will usually be the best choice in cases where you describe a
target object with several properties.

For compatability, you may also use a `<` prefix on a get path, but there is
really no need to do that, other than for better readability in complex cases.
`<data.items[].content` and `data.items[].content` means exactly the same.

When we're transforming in reverse mode, a get path will act as a set path, and
a set path will act as a get path. This can be confusing, but will often be
easier to understand in practice, as it will just work as expected in many
cases.

### Operations

Operations may be used as steps in a transform pipeline.

#### `transform` operation

The simple beauty of the `transform` operation, is that it will apply whatever
transformer function (or simply "transformer") you give it, to the data at that
point in the pipeline. It's up to you to write your own transformers – or use
[the transformers that comes with MapTransform](#transformers).

You may define a transform operation as an operation object, referencing the
transformer with an id. You provide the transformer functions themselves on the
`options.transformers` object:

```javascript
import mapTransform from 'map-transform'

// This is our transformer
const ensureInteger = (props) => () => (data) => Number.parseInt(data, 10) || 0

// We provide our transformers to mapTransform in an options object
const options = { transformers: { ensureInteger } }

// Then we may use an object in the pipeline and reference our transformer on a
// `$transform` prop. MapTransform will replace this with the transform
// operation and give it our transformer
const def = {
  count: ['statistics.views', { $transform: 'ensureInteger' }],
}

const data = {
  statistics: {
    view: '18',
    // ...
  },
}

await mapTransform(def, options)(data)
// --> {
//   count: 18
// }
```

To pass on properties to a transformer, set them as properties on the transform
operation object. We saw an example of this under
[Transform pipelines](#transform-pipelines):
`{ $transform: 'maxLength', length: 20 }`. Here, `length` will be a property
given to the transformer function. Any property on a transform operation object
that doesn't have any special meaning to MapTransform, will be passed on as
properties to the transformer function.

See [the documentation on transformer functions](#transformer-function) on how
to write these functions.

If you provide `$transform` with an unknown transformer id, `mapTransform()`
will throw. Note that this happens right away, when setting up MapTransform, so
you don't have to try to run the returned mapper function with any data to
discover the mistake.

The `transform` operation object also accepts `$iterate: true`, which will apply
the transformer to every item in an array, should the data in the pipeline be
an array. You may also set `$direction: 'fwd'` or `$direction: 'rev'` to have it
transform in one direction only.

There are a few useful shorthands for the operation objects, like
`{ $value: 'The value' }` instead of
`{ $transform: 'value', value: 'The value' }`. These are noted under the
relevant transformers.

To create your own shorthands, provide a `transformOperation` function in the
`options` object passed to `mapTransform`. This function receives an operation
object and may modify it to another operation object. In fact, mutation objects
(objects that are not operation objects) are also passed through this function,
so you may also use it to modify mutation objects. Make sure to return a valid
object here, though, or you will kill your pipeline.

As an alternative to transform operation objects, you may call the `transform`
operation function, but remember that this option will go away in v2.0.

```javascript
import mapTransform, { transform } from 'map-transform'

const ensureInteger = () => (data) => Number.parseInt(data, 10) || 0
const def = {
  count: ['statistics.views', transform(ensureInteger)],
}

const data = {
  statistics: {
    view: '18',
    // ...
  },
}

await mapTransform(def)(data)
// --> {
//   count: 18
// }
```

`transform()` also accepts a second transformer (`transformFnRev`), that will be
used when [reverse mapping](#reverse-mapping). If you only supplies one
transformer, it will be used in both directions. You may supply `null` for
either of these, to make it uni-directional, but it might be clearer to use
`fwd` or `rev` operations for this.

##### Transformer functions

A transformer function is a higher-order function, or a nested function factory.
The outer function will be given the object with the properties from the
operation object. The next function will be given an `options` object similar to
the one passed in to MapTransform, but with default values and potentially
altered by previous operations.

The inner function is the actual transformer function, which will be given the
`data` currently in the pipeline and a `state` object. The state is an object
that gives access to the context your transformer is operating in. Many of the
properties of the state object is regarded as MapTransform internals, but you
will probably use the `rev` prop at some point, which indicates whether we are
transforming forward or in reverse. See [the state object](#the-state-object)
for more.

An example:

```javascript
const maxLength = (props: Props) =>
  (options: Options) =>
    (data: unknown, state: State) => {
      if (typeof data === 'string') {
        return data.length <= props.length ? data : data.slice(0, length)
      } else {
        return data
      }
    }
```

Your transformer should handle getting something unexpected, as you can't really
know what data will be in the pipeline when it reaches your transformer. In some
cases it makes sense to return the original data as-is. In other cases, it may
be better to return `undefined` to indicate that the data is invalid or should
be discarded. This depends on what seems most "natural" or "expected" for your
transformer.

Transformer functions should, as far as possible, be pure, i.e. they should not
have any side effects. This means they should

1. not alter the data their are given, and
2. not rely on anything besides the function arguments (the data and
   [the state](#the-state-object))

Principle 1 is an absolute requirement, and principle 2 should only be violated
when it's what you would expect for the particular case. As an example of the
latter, say you write the function `toAge`, that would return the number of
years since a given year or date. You would have to use the current date to be
able to do this, even though it would be a violation of principle 2.

That said, you should always search for ways to satisfy both principles. Instead
of a `toAge` function, you could instead write a curried `yearsSince` function,
that would accept the current date (or any date) as the first argument. This
would be a truly pure function.

> [!NOTE]
> When you provide a transform function directly to a transform operation,
> MapTransform will not provide any property object, so you should call the
> outer function yourself with any relevant props. This option will be removed
> in v2.0, but is still available to the regular MapTransform function.

#### `filter` operation

The `filter` operation will use a transformer function or a pipeline to decide
what data to filter out. The operation may be specified in one of two ways:

1. The "traditional" way is to define it just like the `transform` operation,
   with a transform id and props on the operation object as props for the
   transformer. `filter` will just use the transformer you give it, and force
   whatever it returns to a boolean. When the transformer returns something truthy,
   the value is kept, and when it returns something falsy, the value is removed.
   JavaScript rules will be used to force the return value to a boolean, meaning
   `undefined`, `null`, `0`, and empty string `""` will be treated as `false`.

2. The "new" way is to set a pipeline on `$filter`. This pipeline will then be
   run just like the transformer in the first case, and the value it returns will
   be forced to a boolean. Not the you may not provide a path string as a pipeline
   here, as that would be treated as the "traditional" approach with a transformer
   id. Instead you will have to wrap a path in an array, to make it clear that it's
   a pipeline, like `['path.to.wherever']`.

When filtering an array, the transformer or pipeline is applied to each data
item in the array, like you would expect of a filter function, and a new array
with only the items that we get truthy for. For data that is not in an array, a
falsy value from the transformer will simply mean that it is replaced with
`undefined`.

An example with a transformer id:

```javascript
import mapTransform from 'map-transform'

const onlyActives = () =>  () => (data) => data.active
const options = { transformers: { onlyActives } }
const def = [
  'members[]'
  {
    $iterate: true,
    name: 'name',
    active: 'hasPayed'
  },
  { $filter: 'onlyActives', not: true }
]
```

An example with a pipeline:

```javascript
import mapTransform from 'map-transform'

const onlyActives = () =>  () => (data) => data.active
const options = { transformers: { onlyActives } }
const def = [
  'members[]'
  {
    $iterate: true,
    name: 'name',
    active: 'hasPayed'
  },
  { $filter: ['item', {$transform:'onlyActives'}, {$transform: 'not'}] }
]
```

If you provide `$filter` with an unknown transformer id or no pipeline,
`mapTransform()` will throw. This happens right away, so you don't have to run
the returned mapper function with any data to discover the mistake.

Set `$direction: 'fwd'` or `$direction: 'rev'` on the object, to have it filter
in only one direction.

You may use [the transformers that comes with MapTransform](#transformers) or
see [the documentation on transformer functions](#transformer-function) for more
on how to write your own transformer functions.

As an alternative to filter operation objects, you may call the `filter`
operation function, but remember that this option will go away in v2.0.

Example of using the filter operation function:

```javascript
import mapTransform, { filter } from 'map-transform'

const onlyActives = () => () => (data) => data.active
const def = [
  'members'
  {
    name: 'name',
    active: 'hasPayed'
  },
  filter(onlyActives())
]
```

The filter operation function only accepts one argument, which is applied in
both directions through the pipeline. You'll have to use `fwd` or `rev`
operations to make it uni-directional.

#### `if` operation

The `if` operation accepts a condition pipeline, and if the result is "truthy",
it will run a `then` pipeline, and if it's "falsy", it will run an `else`
pipeline. We use JavaScript rules to what's truthy or not, and `false`,
`undefined`, `null`, `0`, and empty string `""` will be treated as falsy.

Example:

```javascript
import mapTransform from 'map-transform'

const def = [
  'members'
  {
    name: 'name',
    active: 'hasPayed'
  },
  {
    $if: 'active', // A simple path pipeline that will get the value of `active`
    then: '>active[]',
    else: '>inactive[]'
  }
]
```

`$if`, `then`, and `else` in the object notation may be any type of pipeline
definition. The `$if` (or condition) pipeline will always be run in forward
mode, even if we are transforming in reverse mode. (Editor's note: Is this what
we want? How does `$if` behave in rev?)

The `then` and `else` pipelines are both optional, and when omitted, will only
pass on the current value in the pipeline. This means you can do
`{ $if: <condition>, then: <pipeline> }` to only specify what happens in the
truthy case.

As an alternative to the `if` operation object, you may call the `ifelse`
operation function, but remember that this option will go away in v2.0.

`ifelse()` accepts three arguments; the condition pipeline, the then pipeline,
and the else pipeline.

Example:

```javascript
import mapTransform, { ifelse } from 'map-transform'

const onlyActives = () => () => (data) => data.active
const def = [
  'members'
  {
    name: 'name',
    active: 'hasPayed'
  },
  ifelse(onlyActives(), set('active[]'), set('inactive[]'))
]
```

#### `iterate` operation

For mutation objects, you may set `$iterate: true` to apply the mutation to each
item in an array.

When you need to iterate a pipeline or an operation that is not a mutation
object or an operation that supports the `$iterate` flag direction, you may wrap
it in an `$iterate` operation object like this:

```javascript
const def = { $iterate: '>content' }
```

This example would iterate over an array and return another array where every
item is an object with the original value on a `content` prop. Note that this
could have also been accomplished by the `>content[]` path, so this is often a
matter of taste or convenience, and it's a fallback for any case where there is
not a valid alternative.

There is also an operation function that will do this, the `iterate` operation
function, but remember that this option will go away in v2.0. Wrap any pipeline
(or other operation function) in this function, and the pipeline will be apply
to each item in an array.

In this example, each value in the array returned by `statistics[].views` will
be transformed with the `ensureInteger` transformer, even though the transformer
itself does not support arrays:

```javascript
import mapTransform, { iterate } from 'map-transform'

const ensureInteger = () => () => (data) => Number.parseInt(data, 10) || 0
const def = {
  counts: ['statistics[].views', iterate(transform(ensureInteger()))],
}
```

#### `apply` operation

The `apply` operation let you define named pipelines that you may apply in other
pipelines. This allows for cleaner definitions, clarity through good naming
practices, and reuse.

You provide an object with the pipeline names/ids as keys on the
`options.pipelines` given to `mapTransform()`. When an id is passed to the
`apply` operation, the pipeline will be applied in the place of the apply
operation and executed as if it was part of the pipeline definition in the first
place.

Note that "pipeline" is used as a wide concept here, including what is described
as transform pipelines in this documentation, and also anything that could be
part of a pipeline, like dot notation paths, mutation objects, operations, etc.
We think of these building blocks as pipelines with one step, even when they are
used without an array.

When a pipeline id is unknown or missing, `mapTransform()` will throw. This
happens when calling `mapTransform()` with the defintion, and you don't need to
call the returned mapper function to discover the error.

Example:

```javascript
import mapTransform, { apply, transform } from 'map-transform'

const options = {
  pipelines: {
    cast_entry: {
      title: ['title', { $transform: 'ensureString' }],
      count: ['count', { $transform: 'ensureInteger' }],
    },
  },
}

const def = [
  {
    title: 'heading',
    count: 'statistics.views',
  },
  { $apply: 'cast_entry' },
]

const data = {
  heading: 'Entry 1',
  statistics: {
    view: '18',
  },
}

await mapTransform(def, options)(data)
// --> {
//   title: 'Entry 1',
//   count: 18
// }
```

Note that the implementation of the two transformer functions is omitted from
this example.

To apply the pipeline to each item in an array, set `$iterate: true` on the
`apply` operation object. You may also set `$direction: 'fwd'` or
$direction: 'rev'` to have it apply in one direction only.

As an alternative to the `apply` operation object, you may call the `apply`
operation function, but remember that this option will go away in v2.0.

```javascript
const def = [
  {
    title: 'heading',
    count: 'statistics.views',
  },
  apply('cast_entry'),
]
```

#### `alt` operation

The `alt` operation will apply the given pipelines in turn until it gets a
value, meaning that if the first pipeline returns `undefined`, it will try the
next and so on. This is how you provide default values in MapTransform. The
pipeline may be as simple as a dot notation, a transform operation, or a full
pipeline with several operations.

Note that when the return value is an array, it is treated as a value, as it is
not an `undefined` value. To provide the `alt` operation to every item in the
array, use the `iterate` operation.

An example:

```javascript
const def = {
  id: 'data.id',
  name: { $alt: ['data.name', { $value: 'Anonymous' }] }, // Use `'Anonymous'` when no name
  updatedAt: [
    {
      $alt: [
        'data.updateDate', // First try to get this date, but if it doesn't exist, ...
        'data.createDate', // ... try to get this date instead. If that doesn't exist either, ...
        { $transform: 'currentDate' }, // ... use a transformer to set the current date
      ],
    },
    { $transform: 'formatDate' }, // Format whatever date comes from `$alt`
  ],
}
```

The implementation of the transformer functions is not included.

When `alt` is run in reverse, the alternative pipelines are run in the oposite
order, with the last being run first. The first pipeline is always run, though,
as it is common practice to let the first be a `get` that acts like a `set` in
reverse. This may be confusing, but will usually just be naturally when you
don't think too much about it. See
[the `get` and `set` operations](#getpath-and-setpath-operation) for more on how
`get` works in reverse.

To apply the `alt` operation to each item in an array, set `$iterate: true` on
the operation object. You may also set `$direction: 'fwd'` or
`$direction: 'rev'` to limit it to one direction only.

There's a special case of the `alt` operation for backward compability, that may
be removed in MapTransform v2.0. With only one pipeline, the operation will
first check if the current value is `undefined`. If it is, it will run the
one pipeline and return its value. If it's not, nothing happens. This is
different from the multi-pipeline behavior, where the first is always run and
the rest is only run if the previous returns `undefined`.

As an alternative to the `alt` operation object, you may call the `alt`
operation function, but remember that this option will go away in v2.0.

```javascript
const def = {
  id: 'data.id',
  name: alt('data.name', transform(value('Anonymous'))),
  updatedAt: [
    alt('data.updateDate', 'data.createDate', transform(currentDate)),
    transform(formatDate),
  ],
}
```

#### `array` operation

The `array` operation will run all the pipelines it's given, and return an array
of the values returned from each of them. The values are kept in the same
position as the pipeline that returned them, and `undefined` values are also
kept in place.

```javascript
const def = {
  $array: [
    'path.into.data',
    ['name', { $transform: 'trim' }],
    { $value: 'A set value' },
  ],
}
```

If there are no pipelines, the operation will return an empty array.

The `array` operation also supports `$iterate` and `$direction`.

When going in reverse, the array operation will run each pipeline in reverse
on the item in the array matching the position of the pipeline. The result of
a pipeline will be given to the next as a target. This is the closest we can
get to recreating the original data.

To reverse the direction, so that we create an array in reverse mode, set
`$flip: true` on the operation object.

There is no related operation function.

#### `concat` operation

The `concat` operation will flatten the result of every pipeline it is given
into one array. A pipeline that does not return an array will simple have its
return value appended to the final array. Even when there's only one pipeline,
its value will be forced to an array. `undefined` will be filtered away from the
returned array.

In reverse, the value (array) will be set on the first pipeline, and the rest of
the pipelines will be given an empty array. The results of all the pipelines
will be merged. There's really no other way to do it, as MapTransform can't know
what array items to set on which pipeline.

If `concat` is not given any pipelines, it will return an empty array going
forward, and an empty object in reverse. The reason for the empty object is that
the normal behavior for concat is to get with paths from an object, and with
no paths, we can't set any props, so an empty object is the best we can do.

> **Note:** This operation is destructive, in that the result from running it
> forward cannot reproduce the original data when run in reverse. Only the data
> fetched by the given pipelines will be preserved, and the merged arrays cannot
> be unmerged.

Example:

```javascript
const def = {
  id: 'data.id',
  users: { $concat: ['data.users', 'data.admins'] },
}
```

As an alternative to the `concat` operation object, you may call the `concat`
operation function, but remember that this option will go away in v2.0.

```javascript
import { concat } from 'map-transform'

const def = {
  id: 'data.id',
  users: concat('data.users', 'data.admins'),
}
```

#### `concatRev` operation

The `concatRev` operation is the exact opposite of the `concat` operation,
meaning that it will exhibit the same behavior in reverse as `concat` does
going forward, and vice versa. See the description of
[the `concat` operation](#concat-operation) for more details.

`concatRev` is available as an operation object with `$concatRev`.

#### `merge` operation

`merge` will run all given pipelines and deep merge their results. Conflicts are
resolved by prioritizing results from the rightmost of the conflicting
pipelines.

This is only available as an operation function, and will be removed in
MapTransform v2.0.

> Editors note: We need examples here.

#### `modify` operation

In a mutation object, you may use `$modify: true` to modify the object in the
pipeline instead of replacing it. See
[the $modify section](#modifying-an-object-instead-of-replacing-it) for more on
this.

There is a `modify` operation function that does the same.

Example:

```javascript
import { modify } from 'map-transform'

const def = modify({
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

#### `fwd` and `rev` operations

With operation and mutation objects, you may specify that the operation should
only be run in one direction by setting the `$direction` prop to `fwd` or `rev`.
This is mentioned in the description of the operations this makes sense for, and
you should also take a look at the description of
[how to set aliases for the directions](#directional-mutation-objects).

There aren operation functions for this as well, but these will be removed in
MapTransform v2.0. If you want an operation to only apply in one direction, you
need to wrap it in a `fwd` or `rev` operation. The `fwd` operation will only
apply its pipeline when we're going forward, i.e. mapping in the normal
direction, and its pipeline will be skipped when we're mapping in reverse.
The `rev` operation will only apply its pipeline when we're mapping in reverse.

The value in the pipeline will be untouched when we are encountering an
operation that is not intended for the direction we are currently going in.

```javascript
import { fwd, rev, transform } from 'map-transform'
const increment = () => () => (data) => data + 1
const decrement = () => () => (data) => data - 1

const def12 = {
  order: ['index', fwd(transform(increment())), rev(transform(decrement()))],
}
```

In the example above, we increment a zero-based index in the source data to get
a one-based order prop. When reverse mapping, we decrement the order prop to get
back to the zero-based index.

Note that the `order` pipeline in the example above could also have been written
as `['index', transform(increment, decrement)]`, as the transform operation
supports seperate forward and reverse functions, when it is given two functions.
You may have a similar syntax with [the `divide` operation](#divide-operation),
and it's usually just a matter of what you think is clearer.

#### `divide(fwdPipeline, revPipeline)` operation

`divide` is `fwd` and `rev` operations combined, where the first argument is a
pipeline to use when going forward and the second when going in reverse.

See [`fwd` and `rev`](#fwd-and-rev-operations) for more details.

This will be removed in MapTransform v2.0

#### `get` and `set` operations

A simple path will get a value from the data, and a path with a `>` prefix will
[set a value on the path](#setting-on-a-path).

There are operation functions for this too, but they will be removed in v2.0.

Both the `get` and `set` operations accepts a dot notation path to act on. The
get operation will pull the data at the path from the data currently in the
pipeline, and replace the value in the pipeline with it. The set operation will
take whatever's in the pipeline and set it on the given path at a new object.

One reason they come as a pair, is that they will switch roles for reverse
mapping. Their names might make this a bit confusing, but in reverse, the `get`
operation will set and the `set` operation will get.

```javascript
import { get, set } from 'map-transform'

const def = [get('data.items[].content'), set('content[]')]
```

In the example above, the `get` operation will return an array of whatever is in
the `content` prop at each item in the `data.items[]` array. The set operation
will then create a new object with the array from the pipeline on the `content`
prop. Reverse map this end result, and you'll get what you started with, as the
`get` and `set` operations switch roles.

#### `root` operation

The `root` operation is equivalent to a `^^` path, and will be removed in v2.0.

When you pass a pipeline to the root operation, the pipeline will be applied to
the data that was original passed to the pipeline – before any operations where
applied to it. The result of a root pipeline will still be inserted in the
pipeline at the point of the `root` operation, so this is not a way to alter
data out of the pipeline.

Let's look at an example:

```javascript
import mapTransform, { root } from 'map-transform'

const def = [
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

#### `plug` operation

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

The `plug` operation will be removed in v2.0.

#### `lookdown` operation

The `lookdown` operation works the same as `lookup` but in the opposite
direction. See [the `lookup` operation](#lookup-operation) for more on how this
works, just reverse the directions.

Note that `lookdown` does not have an operation object notation, but `lookup`
will honor the [flipped mode](#flipping-a-mutation-object).

`lookdown` is available as an operation object with `$lookdown` and as the
operation function `lookdown()`, but the latter will be removed in v2.0.

#### `lookup` operation

`lookup` will take the value in the pipeline and replace it with the first
object in a given array that matches it. The array comes from whatever the path
given on the `$lookup` property points to, and the value in the pipeline is
compare a value on each of the items in the array, given by the path on the
`path` prop. The first item where the value in the pipline and the value on the
item matches, will be returned.

````javascript
import mapTransform from 'map-transform'

const def = ['content.meta.authors[]', { $lookup: '$users[]', path: 'id' }]

const data = {
  content: { meta: { authors: ['user1', 'user3'] } },
  users: [
    { id: 'user1', name: 'User 1' },
    { id: 'user2', name: 'User 2' },
    { id: 'user3', name: 'User 3' },
  ],
}
const mapper = mapTransform(def)
const mappedData = await mapper(data)
// --> [
//   { id: 'user1', name: 'User 1' },
//   { id: 'user3', name: 'User 3' }
// ]

mapper(mappedData, { rev: true })
// --> { content: { meta: { authors: ['user1', 'user3'] } } }```

Note that value on `$lookup` may be a full pipeline, not just a path. The value
on `path` can only be a path.

You may also set `matchSeveral: true` to get all matches as an array – not only
the first. Default is `false`, and will get the matching item (not an array,
unless that item _is_ an array).

The path on `$lookup` refers to `arrayPath` and `path` refers to `propPath`.

In reverse, the `path` will simply be used as a get path, getting the prop
of the objects out of the objects, so to speak. (In the future, MapTransform
_might_ support setting the items back on the `arrayPath` in reverse.)

> [!NOTE]
> When `lookup` is called within a mutation object in
> [flipped mode](#flipping-a-mutation-object), it will behave in the opposite
> way, looking up in reverse mode and just extracting `path` going forward.


As an alternative, there's a `lookup` operation function, but this will be
removed in v2.0:

```javascript
const def = [
  'content.meta.authors[]',
  lookup({ arrayPath: '^^.users[]', propPath: 'id' }),
]
````

Here, `arrayPath` is the same as the path/pipeline given to `$lookup`, and
`propPath` is the same as the `path` on the operation object.

### Transformers

The following transformers may be used with the
[`transform` operation](#transform-operation) to transform the value in the
pipeline, or the [`filter` operation](#filter-operation) to filter away values.

See [transformer functions](#transformer-functions) for more on how to write
your own transformers.

#### `bucket` transformer

The `bucket` transformer will split an array out in buckets based on condition
pipelines (pipelines that will return truthy for the items that belong in
a certain bucket) or by size (how many items from the array to put in a bucket).
There's also an alternative way of using `groupByPath` (see below).

Here's an example using condition pipelines:

```javascript
const def = {
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

const mappedData = await mapTransform(def)(data)
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

You may specify a `path` to get the array that will be sorted into buckets,
otherwise the value in the pipeline will be used.

Each bucket is defined with an object of props in an array on the `buckets`
property. The object has a `key` property that will be the key used for the
bucket on the target object. When distributing based on condition pipelines, you
set a `condition` property to a pipeline that will return truthy for the items
that belong in the bucket.

Each item is tested against the bucket condition in the order the buckets are
defined, and will be placed in the first bucket that matches. You may have
a bucket without a condition or size, which will serve as a catch-all bucket,
and should therefore be placed last.

Here's an example of distributing to buckets by size:

```javascript
const def = {
  $transform: 'bucket',
  buckets: [{ key: 'top3', size: 3 }, { key: 'theOthers' }],
}

const data = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7']

const mappedData = await mapTransform(def)(data)
// --> {
//   top3: ['user1', 'user2', 'user3'],
//   theOthers: ['user4', 'user5', 'user6', 'user7']
// }
```

When distributing based on size, you set `size` to the
number of items you want to put in this bucket. You may also combine `condition`
and `size`, to get the provided number of items matching the condition.

As an alternative to specifying `buckets`, you may provide a path or a pipeline
in `groupByPath`. The transformer will then fetch the value from this path or
pipeline for every item in the array, and use it as keys for buckets. Every item
with the same value returned from `groupByPath`, after being forced to a string,
will be grouped together. You may for example set `groupByPath: 'category'` to
get an object with all available categories as keys, and items with a certain
category grouped in an array on the category property. When the value from an
item is a non-value (usually `undefined`), the item will not be put in any
group.

When a bucket is run in reverse, the items in the buckets will be merged into
one array. The order of the items will be the same as the order of the buckets
and not the order of the items in the original array. When a path is given, the
array will be set on this path. This may not recreate the original array
exactly, but it is the best MapTransform can do.

#### `compare` transformer

This is a transformer intended for use with the `filter` operation, but it can
also be used with the `transform` operation to get the boolean value that
results from the compare.

In the simplest case, you pass a dot notation `path` and a `match` value
(string, number, boolean, `null` or `undefined`) to `compare`, and it returns
`true` if the value at the path and the `match` value is equal.

Here's an example with the `filter` operation:

```javascript
const def1 = [
  {
    name: 'username',
    role: 'group',
  },
  { $filter: 'compare', path: 'role', match: 'admin' },
]
```

Actually, youcan also drop the `path` if you just want to compare the value in
the pipeline with the `match` value, but it's more common to filter objects
by one of it's properties.

If you need to match the value at the path with another value in the data, you
may use `matchPath` instead of `match`. This will be a dot notation path,
getting a value from the data item. You may also use parent `^` or root `^^`
prefixes here, to compare with values outside the array you're filtering, but
remember that one step up with `^` will be the array itself, so you need two
parents `^.^` to get to the object above the array. It's also possible to
compare to, say, the first item in the array with a path like `^.[0].role`.

The default is to check whether the values resulting from `path` and `match` or
`matchPath` are the same (equality), but other operations may be set on the
`operator` property too. The alternatives are `'='`, `'!='`, `'>'`, `'>='`,
`'<'`, `'<='`, `in`, or `exists`. `in` requires equality to at least one of the
elements in an array, and `exists` requires any value besides `undefined`.

Dates are compared using their milliseconds since epoc (1970-01-01) numeric
values.

If the `path` points to an array, compare returns `true` if any of the items
in the array is a match.

Set `not: true` to reverse the result of the comparison.

You may also use `value` or `valuePath` as aliases for `match` and `matchPath`.
This is provided for consistency with other transformers.

If you define the `compare` transformer as an operation object in JSON and need
to compare to `undefined`, use `**undefined**` instead. This is a special
shortcut in MapTransform, as `undefined` does not exist in JSON.

#### `explode` transformer

Given an object in the pipeline, the `explode` transformer will return an array
with one object for each property in this object, with a `key` property for the
property key, and a `value` property for the value.

When given an array, the `explode` transformer will return on object for every
item in the array, with a `key` property set to the index number in the array
and a `value` property to the item value.

When transforming in reverse, `explode` will try to compile an object or an
array from an array of key/value objects. If all `key` props are numbers, an
array is produced, otherwise an object. Anything that don't match the expected
structure will be skipped.

Example:

```javascript
import mapTransform from 'map-transform'

const data = {
  currencies: { NOK: 1, USD: 0.125, EUR: 0.1 },
}

const def = ['currencies', { $transform: 'explode' }]

await mapTransform(def)(data)
// --> [
//       { key: 'NOK', value: 1 },
//       { key: 'USD', value: 0.125 },
//       { key: 'EUR', value: 0.1 }
//     ]
```

#### `fixed` transformer

The data given to the fixed transformer, will be inserted in the pipeline,
replacing any data that is already there. The data may be an object, a string,
a number, a boolean, `null`, or `undefined – or an array of any of these.

This is almost the same behavior as
[the `value` transformer](#value-transformer), which is more commonly used,
except that the value set with `fixed` will be included even when
`state.noDefaults` is `true`. Use `value` for default values, and `fixed` for
values that should be set no matter what.

#### `flatten` transformer

Will flatten an array in the pipeline. The default is to flatten one layer deep,
but this may be changed by setting the `depth` property to the wanted number
of levels.

Example:

```javascript
const def = ['array.from.path', { $transform: 'flatten', depth: 3 }]
```

#### `index` transformer

When iterating, this will return the index of the current item in the array.
When used outside of an iteration, it always returns `0`.

Example:

```javascript
const def = {
  $iterate: true,
  id: { $transform: 'index' },
  name: 'fullName',
}
```

In this example, the resulting array of objects will have `id: 0` for the first
item, `id: 1` for the second, and so on.

#### `implode` transformer

This is the exact opposite of the `explode` helper, imploding going forward and
exploding in reverse. See
[the documentation for `explode`](#explode-transformer) for how this works.

#### `logical` transformer

Will run all provided pipelines, force their return values to boolean, according
to JavaScript rules, and apply the logic specified by `operator`; either `AND`
or `OR`. If no `operator` is specified, `AND` is the default.

This transformer is typically used as a short-hand operation object, together
with [the `if` operation](#if-operation), to support AND logic:

```javascript
const def = [
  {
    $if: { $and: ['active', 'authorized'] },
    then: 'content',
    else: { $value: undefined },
  },
]
```

... or OR logic:

```javascript
const def = [
  {
    $if: { $or: ['active', 'draft'] },
    then: 'content',
    else: { $value: undefined },
  },
]
```

#### `map` transformer

The `map` transformer accepts a dictionary described as an array of tuples,
where each tuple holds a _from_ value and a _to_ value. The transformer will
replace the value in the pipeline with a matching value from the dictionary.

When going forward, the first value in the tuple will be matched with the given
data value, and the second value will be returned. In reverse, the second value
is matched and the first is returned.

When there are more than one matches, the first one is applied.

The wildcard value `*` will match any value, and is applied if there is no other
match in the dictionary. When the returned value is `*`, the original data value
is used instead. This is useful when you only want to map a few values, and keep
everything else. Add a `['*', '*']` tupple at the end, and it will match
anything that is not already matched, and return it untouched.

The `map` transformer only supports primitive values, so when trying to map an
object, you will get the value given by the wildcard in the dictionary, or
`undefined` (when no wildcard). Arrays will be iterated to map each value in the
array.

To map to or from `undefined` with a dictionary defined in JSON, use the value
`**undefined**`.

You may provide the dictionary directly on the `dictionary` prop, but the most
common way to use this transformer, is to provide an id to the `dictionary`
prop, that references a dictionary in the `dictionaries` options given to
´mapTransform()`. Here's an example of that:

```javascript
import mapTransform from 'map-transform'

const dictionary = [
  [200, 'ok'],
  [404, 'notfound'],
  ['*', 'error'],
]
const options = { dictionaries: { statusCodes: dictionary } }

const def = {
  status: ['result', { $transform: 'map', dictionary: 'statusCodes' }],
}

const mapper = mapTransform(def, options)
```

Set `flip: true` on the operation object to use the dictionary in the opposite
direction. The transformer will then use the dictionary in reverse, as if you
were going forward, or the other way around. The default value is `false`.

#### `merge` transformer

The `merge` transformer accepts a pipeline or an array of pipelines in `path`,
and the objects or array of objects these pipline(s) return will be merge into
one object. Merging happens from left to right, so the props of the last object
will have priority. However, `undefined` values will never overwrite another
value.

In reverse, the pipeline data will be provided to every pipeline in `path`, as
there is no way of splitting up the "original" data. This makes sense, as in
many cases there will be mutation objects or paths returning the relevant props
of the data object to the props they were "originally" fetched and merged from.

> **Note:** This transformer is destructive, in that the result from running it
> forward cannot reproduce the original data when run in reverse. Only the data
> fetched by the given pipelines will be preserved, and the merged object cannot
> be unmerged.

There's a short-cut operation object for this transformer, so it may be used
like this:

```javascript
import mapTransform, { transform, transformers } from 'map-transform'
const { merge } = transformers

const data = {
  original: { id: 'ent1', title: 'Entry 1', text: null },
  updated: { id: undefined, title: 'Better title' },
  final: { text: 'Here we are now' },
}

const def = { content: { $merge: ['original', 'updated', 'final'] } }

await mapTransform(def)(data)
// --> {
//       content: {
//         id: 'ent1',
//         title: 'Better title',
//         text: 'Here we are now'
//       }
//     }
```

The `def` in this example is equivalent to the full form
`{ content: { $transform: 'merge', merge: ['original', 'updated', 'final'] } }`.

#### `mergeRev` transformer

The `mergeRev` transformer has the opposite behavior of the `merge` transformer,
in that it will do forward what `merge` does in reverse, and vice versa. See
[the `merge` transformer](#merge-transformer) for more details.

Note that there is no operation short-form for `mergeDev`, i.e. it has to be
written in full like
`{ $transform: 'mergeRev', merge: ['original', 'updated', 'final'] }`.

#### `not` transformer

`not` will return `false` when the value in the pipeline is truthy, and `true`
when value is falsy.

Here's an example:

```javascript
const def = [
  {
    name: { $alt: ['fullName', 'username'] },
    nameIsUserName: ['fullName', { $transform: 'not' }],
    isFreemium: ['payingCustomer', { $transform: 'not' }],
  },
]
```

In this example `nameIsUserName` will be `true` if `fullName` is `undefined`,
`null`, or empty string (`''`). `isFreemium` will be `true` if `payingCustomer`
is `false`.

When filtering with operation objects, there's no way of using this transformer
toghether with another transformer (yet), but with the `compare` transformer,
you can do it like this:

```javascript
const def = [
  {
    name: 'username',
    role: 'group',
  },
  { $filter: 'compare', path: 'role', not: true, match: 'admin' },
]
```

#### `project` transformer

Will return an object with only the props specified in `include` or none of the
props in `exclude`. Both `include` and `exclude` may be array of strings, and
they should not be used in combination. If both are provided, `include` will be
used.

You may also specify an `includePath` or `excludePath`. These are dot notation
paths to arrays of strings, and will be used instead of `include` or `exclude`.
If `include` or `exclude` are also provided, they will be used as default
values when the corresponding path yields no value. Note that "no value" here
means `undefined`, and we don't support custom non-values here yet.

When given an array of object, each object will be projected. When given
anything that is not an object, `undefined` will be returned.

As we cannot bring back the removed props when mapping in reverse, this
transformer will pass on the object data as is in reverse.

```javascript
import { transform, transformers } from 'map-transform'
const { project } = transformers

const def = { $transform: 'project', include: ['id', 'name'] }

const data = {
  id: 'ent1',
  name: 'Entry 1',
  text: 'Do not include',
  created: new Date('2023-12-01T00:00:00Z'),
}

const mappedData = await mapTransform(def)(data)
// --> {
//   id: 'ent1',
//   name: 'Entry 1',
// }
```

#### `sort` transformer

The `sort` transformer will sort the array at the given `path`, in the direction
given by `asc`. The default direction is ascending (`asc: true`).

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

const def = {
  data: ['items', { $transform: 'sort', asc: true, path: 'id' }],
}

await mapTransform(def)(data)
// --> [{ id: 'ent1' }, { id: 'ent3' }, { id: 'ent5' }]
```

> Editors note: What happens if the value is not an array?

#### `value` transformer

The data given to the `value` transformer, will be inserted in the pipeline in
place of any data that is already present at that point. The data may be an
object, a string, a number, a boolean, `null`, or `undefined` – or an array of
any of these.

This could be useful for:

- Setting a value on a property, that is not found in the source data
- Providing a default value to [the `alt` operation](#alt-operation)

Example of both:

```javascript
import { alt, transform, transformers } from 'map-transform'
const { value } = transformers

const def10 = {
  id: 'data.customerNo',
  type: { $transform: 'value', value: 'customer' },
  name: alt('data.name', { $transform: 'value', value: 'Anonymous' },
}
```

As the `value` transformer is very common, it has its own short-hand operation
object notation, that can be used instead of the `transformer` operation object.
You will usually write the first example above like `{ $value: 'customer' }`.

**Important:** The `value` transformer will not set anything when mapping when
`state.noDefaults` is `true`. Use
[the `fixed` transformer](#fixeddata-transformer) if this is not your wanted
behavior.

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
mapped to be able to map back to the original data, unless some of the data can
be "recreated" based on other data.

Let's see an example of reverse mapping:

```javascript
import mapTransform from 'map-transform'

const def = [
  'data.customers[]',
  {
    id: 'customerNo',
    name: { $alt: ['fullname', { $value: 'Anonymous' }] },
  },
]

const data = [
  { id: 'cust1', name: 'Fred Johnsen' },
  { id: 'cust2', name: 'Lucy Knight' },
  { id: 'cust3' },
]

await mapTransform(def)(data, { rev: true })
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

Mutation objects allow one value in the source data to be used for several
properties on the target object, but to do this in reverse, you have to use a
special syntax where you suffix the keys with a slash and a number. The reason
for this, is that you would otherwise get several equal keys, which is not
supported in neighter JavaScript nor JSON.

For example:

```javascript
import mapTransform from 'map-transform'

const createUsername = () => () => (name) =>
  name.replace(/\s+/, '.').toLowerCase()
const options = { transformers: { createUsername } }

const def = [
  'data.customers[]',
  {
    id: 'customerNo',
    name: 'fullname',
    'name/1': ['username', { $transform: 'createUsername', $direction: 'rev' }],
  },
]

const data = [{ id: 'cust1', name: 'Fred Johnsen' }]

await mapTransform(def, options)(data, { rev: true })
// --> {
//   data: {
//     customers: [
//       {
//         customerNo: 'cust1',
//         fullname: 'Fred Johnsen',
//         username: 'fred.johnsen'
//       }
//     ]
//   }
// }
```

When going forward paths with such suffixes will simply be skipped. The
convention is to have the first occurrence without a slash suffix, and this will
be the one used in forward mode.

#### Flipping a mutation object

In some cases, the reverse transform is more complex than the forward transform.
For that reason, there is a `$flip` property that may be set to `true` on a
mutation object, to indicate that it is defined from the reverse perspective
and should be "flipped" before transforming data with it.

A flipped mutation object will – in forward mode – get with the properties on
the object and set with the paths in the value. The order of paths and
operations in a pipeline will also be reversed.

**Important:** Flipping a transform object will not affect any operations that
behaves differently depending on direction, and they will run as if they were
used in a non-flipped transformation object. The only exceptions from this, are
[the `get` and `set` operations](#get-and-set-operation) and
[the `lookup` operation](#lookup-operation), which will all behave as if we were
in forward mode, when we're really in reverse in a flipped transform object.

This flipped defintion:

```javascript
const def = {
  $flip: true,
  id: 'key',
  attributes: {
    title: ['headline', { $transform: 'threeLetters' }],
    age: ['unknown'],
  },
  relationships: {
    author: { $value: 'johnf' },
  },
}
```

... is identical to:

```javascript
const def = {
  key: 'id',
  headline: ['attributes.title', { $transform: 'threeLetters' }],
  unknown: ['attributes.age']
  'none/1': ['relationships.author': { $value: 'johnf' }]
}
```

The flipped definition is (in this case) easier to read.

Note also the `'none/1'` property in the unflipped version, will stop this
property from being set when going forward. This is not necessary on the flipped
definition, but also results in a definition that will not work as expected
going forward. This is a weakness in how MapTransform treats pipelines right
now, and will probably be resolved in the future. For now, make sure to always
have a path at the beginning of all pipelines if you plan to reverse transform –
and the same goes for flipped transform objects if you want to forward
transform.

(Editor's note: Does the slashed path work in the new `mapTransformSync` and
`mapTransformAsync`?)

### Mapping without defaults

MapTransform will try its best to map the data to the shape you want, and will
always set all properties, even though the mapping you defined result in
`undefined`. You may include `alt` operations to provide defaults or fallback
values for these cases.

But sometimes, you only want the data that is actually present in the source
data, without defaults or properties set to `undefined`. You may accomplish this
by setting `state.noDefaults` to true, either by setting it on the initial state
given to `mapTransform()` or by setting the `$noDefaults` flag on a mutation
object (will set `noDefaults` on the state for everything happening within that
mutation object).

When `noDefaults` is `true`, the `value` transformer will always return
`undefined`. The `fixed` transformer, however, will still return its value. This
is by design.

See [the note on undefined and null](#a-note-on-undefined-and-null) for more on
how to have more values (like `null`) be treated as a non-value (i.e. the same
way as `undefined`), and how to apply a mutation object to a non-value.

```javascript
import mapTransform from 'map-transform'

const def1 = {
  id: 'customerNo',
  name: { $alt: ['fullname', { $value: 'Anonymous' }] },
}

const def2 = {
  $noDefaults: true, // This is the only difference from `def1`
  id: 'customerNo',
  name: { $alt: ['fullname', { $value: 'Anonymous' }] },
}

const mapper1 = await mapTransform(def1)
const mapper2 = await mapTransform(def2)

mapper1({ customerNo: 'cust4' })
// --> { id: 'cust4', name: 'Anonymous' }
mapper1({ customerNo: 'cust4' }, { noDefaults: true }) // We may set this flag on the initial state
// --> { id: 'cust4' }

mapper2({ customerNo: 'cust4' })
// --> { id: 'cust4' }
mapper2({ customerNo: 'cust5', fullname: 'Alex Troy' })
// --> { id: 'cust5', name: 'Alex Troy' }

// This also applies in reverse mapping
mapper1({ id: 'cust4' }, { rev: true })
// -> { customerNo: 'cust4', name: 'Anonymous' }
mapper1({ id: 'cust4' }, { rev: true, noDefaults: true })
// -> { customerNo: 'cust4' }
mapper2({ id: 'cust4' }, { rev: true })
// -> { customerNo: 'cust4' }
```

### The state object

MapTransform uses a state object internally to pass on data, context, target,
etc., between pipelines and operations. You may encounter this state object
when you write your own transformers, as it is passed to the transformer
function as the second argument (the current pipeline value is the first).

Most of the props on the state object should be regarded as MapTransform
internals and subject to change without notice, but a few props are good to know
and might also be necessary to make your transformer work the way you want:

- `rev`: When this is `true`, we are in reverse mode, so if your transformer
  should work differently depending on direction, you should check this prop.
- `flip`: When `true`, we are being called from a mutation object in
  [flip mode](#flipping-a-mutation-object), meaning that the mutation object
  is defined from the perspective of the reverse mode. This will not affect most
  transformers, as we will treat the direction the same regardless of how the
  mutation object is defined, but there are cases where you want to xor `rev`
  and `flip` to get the direction. The guiding principle here is what "feels
  natural", which is not a rule that is easy to follow. A good rule of thumb is
  to disregard `flip` unless there's a very good reason one would expect the
  operation of the transformer to be flipped along with the mutation object.
- `noDefaults`: This is `true` when we have asked MapTransform in some way to
  [not include default values](#mapping-without-defaults). This may or may not
  concern your transformer.
- `iterate`: When `true`, we are currently iterating.
- `index`: When iterating, this will be the index of the current item in an
  array. When not iterating, `index` will be `0` or `undefined`.

The following props should not be trusted to stay stable across MapTransform
versions, and should not be used in any custom transformers:

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
useful when storing the definitions in a database, transferring it over http(s),
etc.

We are now favoring operation object notations, and the "old" operation
functions will be removed in MapTransform v2.0, in line with the goal of
being able to express all definitions as JSON-friendly objects. With a set of
commonly shared transformers passed to `mapTransform()` on the `options` object,
storing and sharing definitions over JSON is quite trivial. This is how we use
MapTransform in [Integreat](https://github.com/integreat-io/integreat), which it
was initially written for.

There's probably only one real challenge in turning a transformation defition
into JSON: `undefined`. JSON has no way of specifying `undefined` other than
omiting properties that would have had `undefined` as a value. So when we for
example need to specify that a value should be mapped to `undefined`, or we
would like to specifically set a value to `undefined` with
`{ $value: undefined }`, JSON has no real solution.

The "hack" we have chosen for MapTransform is to use the value
`'**undefined**'`, as we think it's unlikely that anyone would use that value
for any other reason. (We should probably make it configurable, just in case.)
The operations and transformers where it is important to specify `undefined`
also supports this keyword, and you'll find it in the documentation where it's
relevant.

Another type of JavaScript value that is not natively supported in JSON, is the
`Date` object. A convention is to specify dates in the ISO8601 format
("2023-03-07T07:03:17Z") or as a UNIX timestamp, and use a transformer to turn
it into an actual date that way.

### TypeScript

MapTransform is written completely in TypeScript, even though most examples in
this documentation are in JavaScript for simplicity and readability.

All relevent types are exposed at `map-transform/types`, and may be imported
into your project like so:

```javascript
import type { Transformer } from 'map-transform/types'
```

The most usefull types will probably be `Transformer`, that you should use when
writing your own transformer, and `TransformDefinition`, that types the full
definition format of MapTransform.

Data given to and returned from MapTransform is typed as `unknown`, as we can't
know what it will be, and to signal that it should be typed by the user. We
would have loved to provide a typed return value based on the definition given
to `mapTransform`, but that is a task we have not been able to prioritize yet,
and frankly we're not sure if it is at all possible. If you have the stomack
for this, please create an issue with an outline of how you would do this. :)

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
