import { InteractionTool } from "../Tool";
import { Interactor } from "../Interactor";
import Graph from "@/core/Graph";

import { DragTool } from "./DragTool";
import ConnectTool from "./ConnectTool";
import SelectionTool from "./SelectionTool";

import { getType } from "@/utils/id";
import ViewportTool from "./ViewportTool";

export default class BaseTool implements InteractionTool {
    constructor(private interactor: Interactor) { }

    async update() {
        const id = this.interactor.pickPosition();
        if (id === this.interactor.hoveredId) return;
        this.interactor.setHoveredId(id);
    }

    onPointerDown(e: PointerEvent) {
        const { hoveredId } = this.interactor;

        if (hoveredId == null) {
            this.interactor.clearSelectedIdSet();
            this.interactor.setTool(new ViewportTool(this.interactor));
            this.interactor.forwardEventToTool("onPointerDown", e);
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
                new ConnectTool(
                    this.interactor,
                    this.interactor.graph,
                    hoveredId,
                ),
            );
        }

        this.interactor.setTool(
            new DragTool(this.interactor, this.interactor.graph),
        );

        this.interactor.forwardEventToTool("onPointerDown", e);
    }

    onKeyDown(e: KeyboardEvent): void {
        if (e.key === "Shift") {
            this.interactor.setTool(
                new SelectionTool(this.interactor, this.interactor.graph),
            );
        }
    }

    onWheel(e: WheelEvent): void {
        this.interactor.setTool(new ViewportTool(this.interactor));
        this.interactor.forwardEventToTool("onWheel", e);
    }
}
