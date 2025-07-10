import { InteractionTool } from "../Tool";
import { Interactor } from "../Interactor";
import Graph from "@/core/Graph";
import BaseTool from "./BaseTool";

import { add, sub, Vec2 } from "@/utils/math";
import { getType } from "@/utils/id";

export class DragTool implements InteractionTool {
    private graph: Graph;
    private interactor: Interactor;
    private lastPosition: Vec2;

    constructor(interactor: Interactor, graph: Graph) {
        this.graph = graph;
        this.interactor = interactor;

        this.lastPosition = interactor.mousePosition;
    }

    update() {
        const offset = sub(this.interactor.mousePosition, this.lastPosition);
        for (const elementId of this.interactor.selectedIdIterator) {
            if (getType(elementId) !== "node") continue;
            const node = this.graph.getNode(elementId);
            if (node == null) continue;

            this.graph.moveNode(node, add(node.position, offset));
        }
        this.lastPosition = this.interactor.mousePosition;
    }

    onPointerMove(e: PointerEvent): void {}

    onPointerUp(event: PointerEvent) {
        this.interactor.setTool?.(new BaseTool(this.interactor, this.graph));
        // forward if selected after a drag
        // this.interactor.forwardEventToTool("onPointerUp", event);
    }
}
