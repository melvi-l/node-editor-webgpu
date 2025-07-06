import Graph from "@/core/Graph";
import { Interactor } from "../Interactor";
import { sub, Vec2 } from "@/utils/math";
import { InteractionTool } from "../Tool";
import BaseTool from "./BaseTool";

export class DragNodeTool implements InteractionTool {
    private graph: Graph;
    private interactor: Interactor;
    private nodeId: string;
    private offset: Vec2;

    constructor(interactor: Interactor, graph: Graph, nodeId: string) {
        this.graph = graph;
        this.interactor = interactor;
        this.nodeId = nodeId;

        const node = graph.getNode(nodeId);
        if (!node) throw new Error(`Node ${nodeId} not found`);

        this.offset = sub(interactor.mousePosition, node.position);
    }

    update() {
        const newPos: Vec2 = sub(this.interactor.mousePosition, this.offset);

        this.graph.moveNode(this.nodeId, newPos);
    }

    onPointerUp() {
        this.interactor.setTool?.(new BaseTool(this.interactor, this.graph));
    }
}
