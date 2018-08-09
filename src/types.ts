export interface ObjectWithProps {
  [key: string]: Data
}

type Prop = string | number | boolean | object | null | undefined | ObjectWithProps

export type Data = Prop | Prop[]

export interface State {
  root: Data,
  context: Data,
  value: Data,
  rev?: boolean,
  arr?: boolean
}

export type Path = string

export interface MapFunction {
  (state: State): State
}

export type MapPipe = (MapFunction | Path | MapObject)[]

export interface MapObject {
  [key: string]: MapDefinition
}

export type MapDefinition = MapObject | MapFunction | MapPipe | Path | null

export interface DataMapper {
  (data: Data): Data
}

export interface DataMapperWithRev extends DataMapper {
  rev: DataMapper
}
