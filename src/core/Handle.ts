import { colorRGBA } from "@/utils/color";
import { id } from "@/utils/id";
import { Vec2, Vec4 } from "@/utils/math";

const DEFAULT_RADIUS = 8;

export type HandleType = "input" | "output";

export type HandleArgs = { type: HandleType; color?: Vec4; radius?: number };

export default class Handle implements Hoverable, Selectable {
    id: string;
    type: HandleType;
    color: Vec4;
    radius: number;

    // internally updated
    position?: Vec2;

    isHovered: boolean = false;
    isSelected: boolean = false;

    constructor({ type, color, radius }: HandleArgs) {
        this.id = id("handle");
        this.type = type;
        this.color = color ?? colorRGBA([160, 160, 160, 255]);
        this.radius = radius ?? DEFAULT_RADIUS;
    }
}
