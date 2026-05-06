import State, { type InitialState } from './state.js'
import type { Options } from './prep/index.js'
import type { TransformDefinition } from './prep/index.js'

export type { TransformDefinition, Options, InitialState }

// Dictionary types

export type DictionaryValue = string | number | boolean | null | undefined
export type DictionaryTuple = readonly [DictionaryValue, DictionaryValue]
export type Dictionary = DictionaryTuple[]
export type Dictionaries = Record<string, Dictionary>

// Data mapper types

export type AsyncDataMapper<T extends InitialState | undefined = State> = (
  data: unknown,
  state?: T,
) => Promise<unknown>

export type SyncDataMapper<T extends InitialState | undefined = State> = (
  data: unknown,
  state?: T,
) => unknown

export type DataMapper<T extends InitialState | undefined = State> =
  | AsyncDataMapper<T>
  | SyncDataMapper<T>

export type AsyncDataMapperWithState = (
  data: unknown,
  state: State,
) => Promise<unknown>

export type DataMapperWithState = (data: unknown, state: State) => unknown

export type AsyncDataMapperWithOptions = (
  options: Options,
) => AsyncDataMapperWithState

export type DataMapperWithOptions = (options: Options) => DataMapperWithState

// Operation types

export type StateMapper = (state: State) => Promise<State>

export type NextStateMapper = (next: StateMapper) => StateMapper

export type Operation = (options: Options) => NextStateMapper

// Transformer types

export type TransformerProps = Record<string, unknown>

export type Transformer<T = TransformerProps> = (
  props: T,
) => DataMapperWithOptions

export type AsyncTransformer<T = TransformerProps> = (
  props: T,
) => AsyncDataMapperWithOptions

// Transform definition types

export type Path = string

export interface TransformOperation extends TransformerProps {
  $transform:
    | string
    | symbol
    | DataMapperWithOptions
    | AsyncDataMapperWithOptions
  $iterate?: boolean
  $direction?: string
}

export interface FilterOperation extends TransformerProps {
  $filter: string | symbol | TransformDefinition
  $direction?: string
}

export interface ValueOperation extends TransformerProps {
  $value: unknown
  fixed?: boolean
  $iterate?: boolean
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
  $noDefaults?: boolean
}

export interface AltOperation extends TransformerProps {
  $alt: TransformDefinition[]
  $iterate?: boolean
  $direction?: string
  $undefined?: unknown[]
}

export interface ArrayOperation extends TransformerProps {
  $array: TransformDefinition[]
  $iterate?: boolean
  $direction?: string
  $flip?: boolean
}

export interface IterateOperation extends TransformerProps {
  $iterate: TransformDefinition
}

// Note: We need to accept `unknown` on all unspecified keys, to support
// custom Operators that may add their own $-prefixed keys.
// We would ideally like to type all keys _not_ starting with $ as
// `TransformDefinition | undefined | boolean`, but that's not possible as far
// as I know.
export interface MutationObject extends Record<string, unknown> {
  $iterate?: boolean
  $modify?: boolean | Path
  $direction?: string
  $noDefaults?: boolean
  $flip?: boolean
  $alwaysApply?: boolean
}
