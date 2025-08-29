import { Vec2 } from "@/utils/math"
import { Zone } from "./type"

export interface PositionPicker<T> {
   pickPosition(position: Vec2): T[]
}
export interface AreaPicker<T> {
    pickArea(area: Zone): T[]
}
