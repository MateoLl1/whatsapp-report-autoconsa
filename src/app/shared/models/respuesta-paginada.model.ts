export interface RespuestaPaginada<T> {
  pagina: number
  limite: number
  total: number
  datos: T[]
}
