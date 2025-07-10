import Graph from "@/core/Graph";
import { InteractionTool } from "../Tool";
import { Interactor } from "../Interactor";

import { Vec2 } from "@/utils/math";
import { getType } from "@/utils/id";

export default class ConnectTool implements InteractionTool {
    private graph: Graph;
    private interactor: Interactor;

    private sourceHandleId: string;
    private sourceNodeId: string;

    private sourceWorldPos: Vec2;

    constructor(interactor: Interactor, graph: Graph, handleId: string) {
        this.graph = graph;
        this.interactor = interactor;
        this.sourceHandleId = handleId;

        const entry = this.graph.getHandle(handleId);

        if (!entry) throw new Error(`Handle ${handleId} not found`);

        this.sourceNodeId = entry.nodeId;
        // TODO anim
        // this.sourceWorldPos = this.graph.getHandleWorldPos(
        //     this.sourceNodeId,
        //     handleId,
        // )!;
    }

    update() {
        // ici tu peux stocker la position de preview (source → souris)
        // pour affichage visuel dans le renderer
        // TODO anim
    }

    async onPointerUp(e: PointerEvent) {
        const targetId = await this.interactor.pick();
        if (!targetId || getType(targetId) !== "handle") {
            this.interactor.resetTool();
            return;
        }

        const entry = this.graph.getHandle(targetId);

        if (!entry) {
            this.interactor.resetTool();
            return;
        }

        const { nodeId, handle: target } = entry;
        if (nodeId === this.sourceNodeId && target.id === this.sourceHandleId) {
            this.interactor.resetTool();
            return;
        }

        this.graph.addEdge({
            source: {
                nodeId: this.sourceNodeId,
                handleId: this.sourceHandleId,
            },
            target: { nodeId: entry.nodeId, handleId: entry.handle.id },
        });

        this.interactor.resetTool();
    }

    onPointerMove(e: PointerEvent) {
        // TODO anim
        // via this.interactor.getMousePosition()
    }
}
