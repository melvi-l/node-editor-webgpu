import { Vec2, Vec4 } from "@/utils/math";
import Handle from "./Handle";
import { colorHEX, getNodeStyleFromUUID } from "@/utils/color";
import { id } from "@/utils/id";

export type NodeArgs = {
    position: Vec2;
    size: Vec2;
    handles?: Handle[];
    style?: NodeStyle;
};
export type NodeStyle = {
    backgroundColor: { default: Vec4; selected: Vec4 };
    outlineColor: { default: Vec4; selected: Vec4 };
    outlineWidth: number;
};
export default class Node implements Hoverable, Selectable {
    id: string;
    position: Vec2;
    size: Vec2;
    style: NodeStyle;
    handles: Handle[];

    isHovered: boolean = false;
    isSelected: boolean = false;

    constructor({ position, size, style, handles }: NodeArgs) {
        this.id = id("node");
        this.position = position;
        this.size = size;
        this.style = style ?? getNodeStyleFromUUID(this.id);
        this.style.backgroundColor.selected = colorHEX("#fff");
        this.handles = handles ?? [];
    }

    updateHandlesPosition() {
        const inputArray = this.handles.filter(
            (handle) => handle.type === "input",
        );
        const outputArray = this.handles.filter(
            (handle) => handle.type === "output",
        );

        const spacing =
            this.size[1] /
            (Math.max(inputArray.length, outputArray.length) + 1);

        inputArray.forEach((handle, i) => {
            handle.position = [0, spacing * (i + 1)];
        });

        outputArray.forEach((handle, i) => {
            handle.position = [this.size[0], spacing * (i + 1)];
        });
    }
}
