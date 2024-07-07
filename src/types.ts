// Dictionary types

export type DictionaryValue = string | number | boolean | null | undefined

export type DictionaryTuple = readonly [DictionaryValue, DictionaryValue]
export type Dictionary = DictionaryTuple[]

export type Dictionaries = Record<string, Dictionary>

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
  untouched?: boolean
}

// MapTransform options type

export interface Options {
  transformers?: Record<string | symbol, Transformer | AsyncTransformer>
  pipelines?: Record<string | symbol, TransformDefinition>
  neededPipelineIds?: Set<string | symbol>
  dictionaries?: Dictionaries
  nonvalues?: unknown[]
  fwdAlias?: string
  revAlias?: string
  modifyOperationObject?: (
    operation: Record<string, unknown>,
  ) => Record<string, unknown>
  modifyGetValue?: (value: unknown, state: State, options: Options) => unknown
}

// Data mapper types

export interface DataMapper<T extends InitialState | undefined = State> {
  (data: unknown, state?: T): Promise<unknown>
}

export interface AsyncDataMapperWithState {
  (data: unknown, state: State): Promise<unknown>
}

export interface DataMapperWithState {
  (data: unknown, state: State): unknown
}

export interface AsyncDataMapperWithOptions {
  (options: Options): AsyncDataMapperWithState
}

export interface DataMapperWithOptions {
  (options: Options): DataMapperWithState
}

// Operation types

export interface StateMapper {
  (state: State): Promise<State>
}

export interface NextStateMapper {
  (next: StateMapper): StateMapper
}

export interface Operation {
  (options: Options): NextStateMapper
}

// Transformer types

export type TransformerProps = Record<string, unknown>

export interface Transformer<T = TransformerProps> {
  (props: T): DataMapperWithOptions
}

export interface AsyncTransformer<T = TransformerProps> {
  (props: T): AsyncDataMapperWithOptions
}

// Transform definition types

export type Path = string

export interface TransformOperation extends TransformerProps {
  $transform: string | symbol
  $iterate?: boolean
  $direction?: string
}

export interface FilterOperation extends TransformerProps {
  $filter: string | symbol
  $direction?: string
}

export interface IfOperation extends TransformerProps {
  $if: TransformDefinition
  $direction?: string
  then?: TransformDefinition
  else?: TransformDefinition
}

export interface ApplyOperation extends TransformerProps {
  $apply: string | symbol
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

export interface ConcatRevOperation extends TransformerProps {
  $concatRev: TransformDefinition[]
}

export interface LookupOperation extends TransformerProps {
  $lookup: Path
  path: Path
}

export interface LookdownOperation extends TransformerProps {
  $lookdown: Path
  path: Path
}

export type OperationObject =
  | TransformOperation
  | FilterOperation
  | IfOperation
  | ApplyOperation
  | AltOperation
  | ConcatOperation
  | ConcatRevOperation
  | LookupOperation
  | LookdownOperation

export type Pipeline = (
  | TransformObject
  | Operation
  | OperationObject
  | Path
  | Pipeline
)[]

// Note: We need to accept `unknown` on all unspecified keys, to support
// custom Operators that may add their own $-prefixed keys.
// We would ideally like to type all keys _not_ starting with $ as
// `TransformDefinition | undefined | boolean`, but that's not possible as far
// as I know.
export interface TransformObject extends Record<string, unknown> {
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
