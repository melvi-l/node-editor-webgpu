import { Vec4 } from "@/utils/math";
import { colorHEX } from "@/utils/color";
import { id } from "@/utils/id";

export type EdgeArgs = {
    source: {
        nodeId: string;
        handleId?: string;
    };
    target: {
        nodeId: string;
        handleId?: string;
    };
    color?: Vec4;
};
export default class Edge implements Hoverable, Selectable {
    id: string;
    source: {
        nodeId: string;
        handleId?: string;
    };
    target: {
        nodeId: string;
        handleId?: string;
    };
    color: Vec4;

    isHovered: boolean = false;
    isSelected: boolean = false;

    // path: Vec2[]; maybe I enable manual edge creation

    constructor({ source, target, color }: EdgeArgs) {
        this.id = id("edge");
        this.source = source;
        this.target = target;
        this.color = color ?? colorHEX("#FF0054");
    }
}
