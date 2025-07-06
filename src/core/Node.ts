import { Vec2, Vec4 } from "@/utils/math";
import Handle from "./Handle";

export default class Node {
    id: string;
    position: Vec2;
    size: Vec2;
    color: Vec4;
    handles: Handle[];
    constructor({
        position,
        size,
        color,
        handles,
    }: {
        position: Vec2;
        size: Vec2;
        color?: Vec4;
        handles?: Handle[];
    }) {
        this.id = crypto.randomUUID();
        this.position = position;
        this.size = size;
        this.color = color ?? getColorFromUUID(this.id);
        this.handles = handles ?? [];
    }
}

const colors: [number, number, number, number][] = [
    [38, 70, 83, 255],
    [42, 157, 143, 255],
    [233, 196, 106, 255],
    [244, 162, 97, 255],
    [231, 111, 81, 255],
];

function getColorFromUUID(uuid: string): [number, number, number, number] {
    let hash = 0;
    for (let i = 0; i < uuid.length; i++) {
        const code = uuid.charCodeAt(i);
        hash = (hash * 31 + code) >>> 0;
    }
    const index = hash % colors.length;

    return colors[index];
}
