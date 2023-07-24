// Dictionary types

export type DictionaryValue = string | number | boolean | null | undefined

export type DictionaryTuple = readonly [DictionaryValue, DictionaryValue]
export type Dictionary = DictionaryTuple[]

export interface Dictionaries {
  [key: string]: Dictionary
}

// State type

export interface InitialState {
  target?: unknown
  rev?: boolean
  noDefaults?: boolean
}

export interface State extends InitialState {
  context: unknown[]
  value: unknown
  flip?: boolean
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
  modifyOperationObject?: (
    operation: Record<string, unknown>
  ) => Record<string, unknown>
}

// Data mapper types

export interface DataMapper {
  (data: unknown, state: State): unknown
}

export interface DataMapperEntry {
  (data: unknown, state?: InitialState): unknown
}

export interface DataMapperWithOptions {
  (options: Options): DataMapper
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

export interface Transformer<T = TransformerProps> {
  (props: T): DataMapperWithOptions
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
  | ConcatOperation
  | LookupOperation

export type Pipeline = (
  | TransformObject
  | Operation
  | OperationObject
  | Path
  | Pipeline
)[]

export interface TransformObject
  extends Record<string, TransformDefinition | undefined | boolean> {
  $iterate?: boolean
  $modify?: boolean | Path
  $noDefaults?: boolean
  $flip?: boolean
  $direction?: string
}

export type TransformDefinition =
  | TransformObject
  | Operation
  | OperationObject
  | Pipeline
  | Path
  | null
