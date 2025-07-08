import { getType } from "@/utils/id";
import { InteractionTool } from "../Tool";
import { Interactor } from "../Interactor";
import Graph from "@/core/Graph";
import { DragNodeTool } from "./DragNodeTool";
import ConnectTool from "./ConnectTool";

export default class BaseTool implements InteractionTool {
    constructor(
        private interactor: Interactor,
        private graph: Graph,
    ) {}

    async update() {
        const id = await this.interactor.pick();

        if (id === this.interactor.hoveredId) return;

        this.interactor.setHoveredId(id);
    }

    async onPointerDown(e: PointerEvent) {
        if (!this.interactor.hoveredId) return;

        const type = getType(this.interactor.hoveredId);

        if (type === "node") {
            this.interactor.setTool(
                new DragNodeTool(
                    this.interactor,
                    this.graph,
                    this.interactor.hoveredId,
                ),
            );
        } else if (type === "handle") {
            this.interactor.setTool(
                new ConnectTool(
                    this.interactor,
                    this.graph,
                    this.interactor.hoveredId,
                ),
            );
        } else {
            return;
        }

        this.interactor.forwardEventToTool("onPointerDown", e);
    }
}
