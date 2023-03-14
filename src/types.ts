// Dictionary types

export type DictionaryValue = string | number | boolean | null | undefined

export type DictionaryTuple = readonly [DictionaryValue, DictionaryValue]
export type Dictionary = DictionaryTuple[]

export interface Dictionaries {
  [key: string]: Dictionary
}

// State type

export interface State {
  context: unknown[]
  value: unknown
  target?: unknown
  rev?: boolean
  flip?: boolean
  noDefaults?: boolean
  arr?: boolean
  iterate?: boolean
  index?: number
}

// MapTransform options type

export interface Options {
  transformers?: {
    [key: string]: Transformer
  }
  pipelines?: {
    [key: string]: TransformDefinition
  }
  dictionaries?: Dictionaries
  nonvalues?: unknown[]
  fwdAlias?: string
  revAlias?: string
}

// Data mapper types

export interface DataMapper {
  (data: unknown, state: State): unknown
}

export interface DataMapperWithRev {
  (data: unknown): unknown
  rev: (data: unknown) => unknown
}

// Operation types

export interface StateMapper {
  (state: State): State
}

export interface Operation {
  (options: Options): (next: StateMapper) => StateMapper
}

// Transformer types

export type TransformerProps = Record<string, unknown>

export interface Transformer<T extends TransformerProps = TransformerProps> {
  (props: T, options: Options): DataMapper
}

// Transform definition types

export type Path = string

export interface TransformOperation extends TransformerProps {
  $transform: string
  $iterate?: boolean
  $direction?: string
}

export interface FilterOperation extends TransformerProps {
  $filter: string
  $direction?: string
}

export interface IfOperation extends TransformerProps {
  $if: TransformDefinition
  $direction?: string
  then?: TransformDefinition
  else?: TransformDefinition
}

export interface ApplyOperation extends TransformerProps {
  $apply: string
  $iterate?: boolean
  $direction?: string
}

export interface AltOperation extends TransformerProps {
  $alt: TransformDefinition[]
  $iterate?: boolean
  $direction?: string
  $undefined?: unknown[]
}

export interface MergeOperation extends TransformerProps {
  $merge: unknown
  $iterate?: boolean
  $direction?: string
}

export interface ValueOperation extends TransformerProps {
  $value: unknown
  $iterate?: boolean
  $direction?: string
}

export interface AndOperation extends TransformerProps {
  $and: TransformDefinition[]
}

export interface OrOperation extends TransformerProps {
  $or: TransformDefinition[]
}

export interface ConcatOperation extends TransformerProps {
  $concat: TransformDefinition[]
}

export interface LookupOperation extends TransformerProps {
  $lookup: Path
  path: Path
}

export type OperationObject =
  | TransformOperation
  | FilterOperation
  | IfOperation
  | ApplyOperation
  | AltOperation
  | ValueOperation
  | MergeOperation
  | AndOperation
  | OrOperation
  | ConcatOperation
  | LookupOperation

export type Pipeline = (
  | TransformObject
  | Operation
  | OperationObject
  | Path
  | Pipeline
)[]

export interface TransformObject {
  [key: string]: TransformDefinition | undefined | boolean
  $iterate?: boolean
  $modify?: boolean | Path
  $noDefaults?: boolean
  $flip?: boolean
  // The following props are included to make sure they don't appear on the TransformObject
  $transform?: undefined
  $filter?: undefined
  $if?: undefined
  $apply?: undefined
  $value?: undefined
  $alt?: undefined
  $and?: undefined
  $or?: undefined
  $concat?: undefined
  $lookup?: undefined
  $merge?: undefined
}

export type TransformDefinition =
  | TransformObject
  | Operation
  | OperationObject
  | Pipeline
  | Path
  | null
