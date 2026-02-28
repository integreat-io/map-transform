# Writing MapTransform Pipelines

A guide for AI agents on how to write MapTransform definitions. MapTransform is a JavaScript/TypeScript library for transforming data between two shapes using declarative definitions. Definitions are plain JavaScript objects (JSON-compatible) and are bidirectional — the same definition transforms data forward and in reverse.

## Core Concepts

**MapTransform** takes a definition and returns a mapper function. The mapper transforms source data into target data. Run it with `{ rev: true }` to reverse the transformation.

```js
import { mapTransformSync } from 'map-transform'

const def = { title: 'content.heading' }
const mapper = mapTransformSync(def, options)

const target = mapper(sourceData)                    // Forward
const source = mapper(targetData, { rev: true })     // Reverse
```

There are three exports: `mapTransform` (default, async, legacy), `mapTransformSync` (sync), and `mapTransformAsync` (async). Prefer `mapTransformSync` or `mapTransformAsync`.

## Pipelines

A **pipeline** is an array of steps. Data flows through each step in order. Steps can be paths, mutation objects, or operation objects.

```js
const def = [
  'data.items[]',                                    // Get path
  {                                                  // Mutation object
    $iterate: true,
    id: 'articleNo',
    title: ['headline', { $transform: 'maxLength', length: 20 }],
  },
  { $filter: 'onlyActive' },                        // Operation object
]
```

If a pipeline has only one step, the array can be omitted. A single path string is a valid pipeline.

In **reverse mode**, the pipeline runs backwards: the last step runs first, and get/set paths swap roles.

## Dot Notation Paths

Paths navigate into objects using dot-separated keys.

| Path | Forward | Reverse|
|---|---|---|
| `'content.title'` | Gets `content.title` | Sets value at `content.title` |
| `'>'` prefix, e.g. `'>content.title'` | Sets value at `content.title` | Gets `content.title` |
| `'.'` | Returns current value as-is | Returns current value as-is |

### Arrays in Paths

- `'tags[].id'` — iterates `tags` array, gets `id` from each item. In reverse, wraps values back into `{ id: ... }` objects in a `tags` array.
- `'tags.id[]'` — gets `id` from each item in `tags`, ensures result is an array. In reverse, array stays at `id` level.
- `'items[0]'` — gets first item from `items` array. Negative indices count from end.
- `'content[]'` — ensures result is always an array, even for a single value.

The position of `[]` matters for reverse mapping. Place `[]` where the array actually is in the data structure.

When a path with `[]` meets `undefined` (or any nonvalue), an empty array is returned (unless `noDefaults` is true).

### Parent and Root Paths

- `'^.prop'` — goes up one level (like `../` in file paths)
- `'^.^.prop'` — goes up two levels
- `'^^.prop'` — goes to root level (the current pipeline's root, which may be mutated by earlier steps)
- `'^^^.prop'` — goes to the original root level (always the original source data, regardless of prior transformations)

Inside an iteration, the array counts as one level. So from inside iterating `tags[]`, use `'^.^.id'` to reach the object above the array. You reach the array with one `^`, which can be useful to reach other items, like `^.[0].id` to get the id of the first item in the parent array.

**`^^` vs `^^^`:** In a multi-step pipeline, `^^` refers to the root as it exists at the current point in the pipeline — if a previous step mutated it, `^^` sees the mutated version. Use `^^^` when you need the original, unmutated source data:

```js
const def = [
  { title: 'content.heading', type: { $value: 'article' } },  // Step 1: transforms root
  {
    $modify: true,
    meta: {
      mutatedType: '^^.type',   // 'article' (from step 1 output)
      originalType: '^^^.type', // original value from source data
    },
  },
]
```

### Escaped Keys

Keys starting with `$` have special meaning. Escape with backslash: `'data.\\$type'`.

## Mutation Objects

A mutation object describes the target object shape. Each key becomes a key on the result, and each value is a pipeline describing how to get the data.

```js
const def = {
  title: 'content.heading',
  author: 'content.meta.author',
  tags: 'content.tags[].name',
}
```

### Dot Notation Keys

Keys support dot notation to create nested structures:

```js
// These are equivalent:
const def1 = { 'data.entry.title': 'heading' }
const def2 = { data: { entry: { title: 'heading' } } }
```

### Keys with `[]` Suffix

Appending `[]` to a key ensures the value is always wrapped in an array:

```js
const def = { 'articles[]': 'content.items' }
// Result: { articles: [/* always an array */] }
```

### Special Properties on Mutation Objects

| Property | Description |
|---|---|
| `$iterate: true` | Apply mutation to each item in an array. Will still apply to single value |
| `$modify: true` | Modify existing object instead of replacing it |
| `$modify: 'path'` | Modify the object at the given path |
| `$flip: true` | Definition is written from reverse perspective |
| `$direction: 'fwd'` | Only apply this mutation going forward |
| `$direction: 'rev'` | Only apply this mutation going in reverse |
| `$noDefaults: true` | Don't include default values or undefined props in this mutation object or its children |
| `$alwaysApply: true` | Apply mutation even when input is a nonvalue |

### `$modify`

Normally a mutation replaces the pipeline value. With `$modify: true`, it merges with the existing object (keeping properties not set by the mutation).

```js
const def = {
  $modify: true,
  data: 'data.deeply.placed.items',
}
// Keeps all existing top-level props, only overwrites `data`
```

`$modify` can also be a path: `$modify: 'response'` merges with the object at `response`.

For reverse, `$modify` is expressed as a value: `{ response: '$modify', ... }`.

### `$flip`

When the reverse transformation is more complex, define the mutation from the reverse perspective and set `$flip: true`. In forward mode, keys become get paths and values become set paths (the reverse of normal).

The mutation object is still run as it would if it was defined "the right way".

### Slashed Keys (Reverse-Only Properties)

To set a property only in reverse, suffix the key with `/` and a number:

```js
const def = {
  name: 'fullname',
  'name/1': ['username', { $transform: 'createUsername', $direction: 'rev' }],
}
```

The `/1` variant is skipped in forward mode. In reverse, both `name` and `name/1` pipelines run. Use this when one source value maps to multiple target properties. Escaped slashes (`\\/`) in keys are treated as literal slashes.

## Operation Objects

Operation objects are steps in a pipeline that perform specific actions. The presence of any of these `$` prefixed keys makes this an operation object -- as opposed to a mutation object.

### `$transform` — Apply a Transformer

```js
{ $transform: 'transformerName', ...props }
```

Runs the named transformer on the pipeline value. Extra properties are passed to the transformer. Supports `$iterate: true` and `$direction`.

### `$filter` — Filter Values

```js
{ $filter: 'transformerName', ...props }
// or with a pipeline:
{ $filter: ['path', { $transform: 'check' }] }
```

Uses a transformer or pipeline as a predicate. For arrays, removes items where the predicate is falsy. For non-arrays, replaces value with `undefined` when falsy. Supports `$direction`.

### `$if` — Conditional

```js
{
  $if: 'active',              // Condition pipeline (always runs forward)
  then: '>activeUsers[]',     // Pipeline when truthy
  else: '>inactiveUsers[]',   // Pipeline when falsy (optional)
}
```

`$if`, `then`, and `else` can each be any pipeline definition.

### `$iterate` — Iterate a Pipeline

```js
{ $iterate: '>content' }
```

Wraps a pipeline so it applies to each item in an array individually, rather than the array as a whole.

Note that the presence of `$iterate` by itself does not turn this into an operation object, it will just make a mutation object iterate.

### `$apply` — Named Pipelines

```js
{ $apply: 'pipelineName' }
```

Applies a named pipeline from `options.pipelines`. Supports `$iterate: true` and `$direction`.

### `$alt` — Alternatives / Defaults

```js
{ $alt: ['data.name', 'data.username', { $value: 'Anonymous' }] }
```

Tries each pipeline in order until one returns a non-`undefined` value. Common pattern for default values. Supports `$iterate: true` and `$direction`.

In reverse, alternatives run in reverse order, but the first pipeline always runs (as it typically acts as the set path).

### `$array` — Build an Array

```js
{
  $array: [
    'path.to.first',
    ['name', { $transform: 'trim' }],
    { $value: 'fixed' },
  ]
}
```

Runs each pipeline and collects results into an array (maintaining positions). In reverse, each pipeline receives the item at its position from the input array. Supports `$flip: true` to reverse the direction (create array in reverse instead of forward). Supports `$iterate` and `$direction`.

### `$concat` — Concatenate Arrays

```js
{ $concat: ['data.users', 'data.admins'] }
```

Flattens results of all pipelines into one array. `undefined` values are filtered out. Destructive in reverse (all data goes to first pipeline). There is also `$concatRev` which reverses the direction.

### `$merge` — Merge Objects (Shorthand)

```js
{ $merge: ['original', 'updated', 'final'] }
```

Deep-merges results of all pipelines. Rightmost values win on conflicts. `undefined` never overwrites. Destructive in reverse.

### `$lookup` — Look Up in Array

```js
{ $lookup: '^^.users[]', path: 'id' }
```

Replaces the pipeline value with the first matching object from the array at `$lookup`, matched by the `path` property. Set `matchSeveral: true` to get all matches. In reverse, extracts the `path` value from each object. Honors `$flip` mode.

### `$lookdown` — Reverse Lookup

```js
{ $lookdown: '^^.users[]', path: 'id' }
```

Same as `$lookup` but in the opposite direction. Looks up going in reverse, extracts going forward.

### `$value` — Set a Value (Shorthand)

```js
{ $value: 'Anonymous' }
```

Shorthand for `{ $transform: 'value', value: 'Anonymous' }`. Sets a fixed value in the pipeline. Respects `noDefaults` (returns `undefined` when `noDefaults` is true). Use `{ $transform: 'fixed', value: ... }` for values that should persist even with `noDefaults`.

### `$and` / `$or` — Logical Operations (Shorthand)

```js
{ $and: ['active', 'authorized'] }
{ $or: ['active', 'draft'] }
```

Shorthands for the `logical` transformer. Runs pipelines, forces to boolean, applies AND/OR logic. Typically used with `$if`.

## Built-in Transformers

Provide these via `options.transformers` or use them by name in `$transform`/`$filter` operations.

| Transformer | Description |
|---|---|
| `bucket` | Splits array into named buckets by condition, size, or `groupByPath` |
| `compare` | Compares values. Props: `path`, `match`/`matchPath`, `operator` (`=`, `!=`, `>`, `>=`, `<`, `<=`, `in`, `exists`), `not` |
| `explode` | Object → array of `{ key, value }` pairs. In reverse, array → `{ key: index, value }` |
| `implode` | Opposite of `explode`. Implodes forward, explodes in reverse. |
| `fixed` | Sets a value. Like `value` but ignores `noDefaults`. |
| `flatten` | Flattens nested arrays. Props: `depth` (default: 1) |
| `index` | Returns current iteration index (0 outside iteration) |
| `logical` | AND/OR logic on pipelines. Props: `operator` (`AND`/`OR`), `pipelines` |
| `map` | Dictionary mapping with array of `[from, to]` tuples. Props: `dictionary` (a dictionary or the id of a dictionary), `flip`. Wildcard: `'*'` |
| `merge` | Deep-merges objects from pipelines in `path`. |
| `mergeRev` | Opposite direction of `merge`. |
| `not` | Boolean negation of the value |
| `project` | Keeps/removes object props. Props: `include`/`exclude` (arrays of strings), `includePath`/`excludePath` |
| `sort` | Sorts arrays. Props: `path` (dot notation), `asc` (default: true) |
| `value` | Sets a fixed value. Skipped when `noDefaults` is true. |

## Options Object

Passed as second argument to `mapTransformSync(def, options)`:

```js
const options = {
  transformers: {
    myTransformer: (props) => (options) => (data, state) => { /* ... */ },
  },
  pipelines: {
    castEntry: { title: ['title', { $transform: 'ensureString' }] },
  },
  dictionaries: {
    statusCodes: [[200, 'ok'], [404, 'notfound'], ['*', 'error']],
  },
  nonvalues: [undefined, null],   // Values treated as "no value" (default: [undefined])
  fwdAlias: 'from',               // Alias for 'fwd' in $direction
  revAlias: 'to',                 // Alias for 'rev' in $direction
}
```

### Transformer Function Signature

```js
const myTransformer = (props) => (options) => (data, state) => {
  // props: properties from the operation object (e.g., { length: 20 })
  // options: MapTransform options with defaults
  // data: current value in the pipeline
  // state: { rev, flip, noDefaults, iterate, index, ... }
  return transformedData
}
```

Transformers should be pure functions: don't mutate `data`, don't rely on external state.

## Reverse Mapping

Every definition implicitly defines a reverse transformation:

1. **Paths swap roles**: get paths become set paths, set paths become get paths.
2. **Pipeline order reverses**: steps run last-to-first.
3. **Mutation objects reverse**: keys become get sources, values become set targets.
4. **Transformers run in both directions** by default, but may have the opposite effect in rev.

```js
const def = {
  title: 'content.heading',
  author: 'content.meta.author',
}

// Forward: { content: { heading: 'X', meta: { author: 'Y' } } } → { title: 'X', author: 'Y' }
// Reverse: { title: 'X', author: 'Y' } → { content: { heading: 'X', meta: { author: 'Y' } } }
```

### Data Loss

Reverse mapping can only reconstruct data that was mapped. Properties not included in the definition are lost.

### Direction Control

Use `$direction: 'fwd'` or `$direction: 'rev'` on operation and mutation objects to limit them to one direction. Use slashed keys (`name/1`) for reverse-only mutation properties.

## Nonvalues and `undefined`

- `undefined` is treated as a "nonvalue": it triggers `$alt` alternatives, is excluded with `noDefaults`, and `[]` paths return empty arrays for it.
- `null` is treated as a value by default. Set `nonvalues: [undefined, null]` in options to treat `null` as a nonvalue too.
- In JSON definitions, use `'**undefined**'` to represent `undefined`.
- A mutation object is skipped entirely when its input is a nonvalue (unless `$alwaysApply: true`).

## Providing a Target

You can provide an initial target object that gets merged with the transformation result:

```js
const target = { id: '12345', title: 'Default title' }
mapper(sourceData, { target })
```

## Common Patterns

### Simple field mapping
```js
{ targetField: 'source.path' }
```

### Iterating an array of objects
```js
{
  $iterate: true,
  id: 'itemId',
  name: 'itemName',
}
```

### Pipeline with path + transform
```js
{ date: ['meta.date', { $transform: 'formatDate' }] }
```

### Default values
```js
{ name: { $alt: ['fullName', { $value: 'Unknown' }] } }
```

### Conditional mapping
```js
{
  $if: 'isActive',
  then: { status: { $value: 'active' } },
  else: { status: { $value: 'inactive' } },
}
```

### Dictionary mapping
```js
{ status: ['statusCode', { $transform: 'map', dictionary: 'statusCodes' }] }
```

### Concatenating arrays from multiple sources
```js
{ allUsers: { $concat: ['data.users', 'data.admins'] } }
```

### Nested mutation objects
```js
{
  user: {
    name: 'profile.fullName',
    address: {
      city: 'profile.location.city',
      country: 'profile.location.country',
    },
  },
}
```

### Named pipelines with `$apply`
```js
// In options.pipelines:
// userShape: { id: 'userId', name: 'fullName' }

const def = ['data.users[]', { $iterate: true }, { $apply: 'userShape' }]
```
