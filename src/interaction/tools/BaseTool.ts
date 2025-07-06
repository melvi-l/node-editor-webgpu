import { getType } from "@/utils/id";
import { InteractionTool } from "../Tool";
import { Interactor } from "../Interactor";
import Graph from "@/core/Graph";
import { DragNodeTool } from "./DragNodeTool";
import ConnectTool from "./ConnectTool";

export default class BaseTool implements InteractionTool {
    private hoveredId: string | null = null;

    constructor(
        private interactor: Interactor,
        private graph: Graph,
    ) { }

    async update() {
        const id = await this.interactor.pick();

        if (id === null) {
            this.hoveredId = null;
            return;
        }

        if (id === this.hoveredId) return;

        const element: Hoverable | undefined = this.graph.getElement(id);
        if (element == null) {
            console.warn(`Hovering an inexistant element ${id}`);
            return;
        }
        element.isHovered = true;

        this.hoveredId = id;
    }

    async onPointerDown(e: PointerEvent) {
        if (!this.hoveredId) return;

        const type = getType(this.hoveredId);

        if (type === "node") {
            this.interactor.setTool(
                new DragNodeTool(this.interactor, this.graph, this.hoveredId),
            );
        } else if (type === "handle") {
            this.interactor.setTool(
                new ConnectTool(this.interactor, this.graph, this.hoveredId),
            );
        } else {
            return;
        }

        this.interactor.forwardEventToTool("onPointerDown", e);
    }
}
