import { add, scale, Vec2, Vec4 } from "@/utils/math";
import { colorHEX } from "@/utils/color";
import { id } from "@/utils/id";

export type EdgeArgs = {
    source: {
        nodeId: string;
        handleId: string;
    };
    target: {
        nodeId: string;
        handleId: string;
    };
    color?: Vec4;
};
export default class Edge implements Hoverable, Selectable {
    id: string;
    source: {
        nodeId: string;
        handleId: string;
    };
    target: {
        nodeId: string;
        handleId: string;
    };
    color: Vec4;

    isHovered: boolean = false;
    isSelected: boolean = false;

    private _pathRelative: Vec2[] | null = null; // maybe I enable manual edge creation

    constructor({ source, target, color }: EdgeArgs) {
        this.id = id("edge");
        this.source = source;
        this.target = target;
        this.color = color ?? colorHEX("#FF0054");
    }

    computePath(start: Vec2, end: Vec2): Vec2[] {
        if (this._pathRelative != null) throw new Error("Unimplemented");

        const mid = scale(add(start, end), 0.5);
        return [start, [mid[0], start[1]], [mid[0], end[1]], end];
    }
}
