import { getType } from "@/utils/id";
import { InteractionTool } from "../Tool";
import { Interactor } from "../Interactor";
import Graph from "@/core/Graph";
import { DragTool } from "./DragTool";
import ConnectTool from "./ConnectTool";
import SelectionTool from "./SelectionTool";

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

    onPointerDown(e: PointerEvent) {
        const { hoveredId } = this.interactor;

        if (hoveredId == null) {
            this.interactor.clearSelectedIdSet();
            return;
        }

        if (!this.interactor.isSelected(hoveredId)) {
            this.interactor.clearSelectedIdSet();
        }

        const type = getType(hoveredId);
        if (type === "node") {
            this.interactor.selectId(hoveredId);
        }
        if (type === "handle") {
            this.interactor.setTool(
                new ConnectTool(this.interactor, this.graph, hoveredId),
            );
        }

        this.interactor.setTool(new DragTool(this.interactor, this.graph));

        this.interactor.forwardEventToTool("onPointerDown", e);
    }

    onKeyDown(e: KeyboardEvent): void {
        if (e.key === "Shift") {
            this.interactor.setTool(
                new SelectionTool(this.interactor, this.graph),
            );
        }
    }
}
