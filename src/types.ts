export interface ObjectWithProps {
  [key: string]: Data
}

export type Prop = string | number | boolean | object | null | undefined | ObjectWithProps

export type Data = Prop | Prop[]

export interface State {
  root: Data,
  context: Data,
  value: Data,
  rev?: boolean,
  onlyMapped?: boolean,
  arr?: boolean
}

export type Path = string

export interface MapFunction {
  (state: State): State
}

type MapPipeSimple = (MapFunction | Path | MapObject)[]

export type MapPipe = (MapFunction | Path | MapObject | MapPipeSimple)[]

export interface MapObject {
  [key: string]: MapDefinition
}

export type MapDefinition = MapObject | MapFunction | MapPipe | Path | null

export interface DataMapper {
  (data: Data): Data
}

export interface DataMapperWithOnlyMappedValues extends DataMapper {
  onlyMappedValues: DataMapper
}

export interface MapTransform extends DataMapperWithOnlyMappedValues {
  rev: DataMapperWithOnlyMappedValues
}
