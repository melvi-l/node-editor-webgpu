import { Vec2, Vec4 } from "@/utils/math";
import Handle from "./Handle";
import { getColorFromUUID } from "@/utils/color";
import { id } from "@/utils/id";

export type NodeArgs = {
    position: Vec2;
    size: Vec2;
    color?: Vec4;
    handles?: Handle[];
};
export default class Node implements Hoverable, Selectable {
    id: string;
    position: Vec2;
    size: Vec2;
    color: Vec4;
    handles: Handle[];

    isHovered: boolean = false;
    isSelected: boolean = false;

    constructor({ position, size, color, handles }: NodeArgs) {
        this.id = id("node");
        this.position = position;
        this.size = size;
        this.color = color ?? getColorFromUUID(this.id);
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
