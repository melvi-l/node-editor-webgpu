import { Vec4 } from "@/utils/math";

export default class Edge {
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
    // path: Vec2[]; maybe I enable manual edge creation

    constructor({
        source,
        target,
        color,
    }: {
        source: {
            nodeId: string;
            handleId: string;
        };
        target: {
            nodeId: string;
            handleId: string;
        };
        color?: Vec4;
    }) {
        this.id = crypto.randomUUID();
        this.source = source;
        this.target = target;
        this.color = color ?? [255, 0, 84, 1];
    }
}
