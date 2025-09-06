import Graph from "@/core/Graph";
import { RenderContext } from "@/renderer/type";

import { InteractionTool } from "./Tool";
import BaseTool from "./tools/BaseTool";
import Viewport from "@/renderer/Viewport";

import { scale, sub, Vec2 } from "@/utils/math";
import { getType } from "@/utils/id";
import { AreaPicker, PositionPicker } from "@/picking/Picker";
import { Zone } from "@/picking/type";

const UPDATE_INTERVAL = 1000 / 60;

type ToolEventMap = {
    onPointerDown: PointerEvent;
    onPointerMove: PointerEvent;
    onPointerUp: PointerEvent;
    onKeyDown: KeyboardEvent;
    onWheel: WheelEvent;
};

export class Interactor {
    private picker: PositionPicker<string> & AreaPicker<string>;
    private _graph: Graph;
    private context: RenderContext;

    private currentTool: InteractionTool;

    private _isPressing: boolean = false;
    private _mousePosition: Vec2 = [0, 0];
    private mouseMoved = false;

    constructor(
        picker: PositionPicker<string> & AreaPicker<string>,
        graph: Graph,
        context: RenderContext,
    ) {
        this.picker = picker;
        this._graph = graph;
        this.context = context;

        this.currentTool = new BaseTool(this, this._graph);

        this.initEvents();
    }

    private initEvents() {
        const canvas = this.context.gpu.canvas;
        canvas.addEventListener("pointermove", this.onPointerMove);
        canvas.addEventListener("pointerdown", this.onPointerDown);
        canvas.addEventListener("pointerup", this.onPointerUp);

        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
        window.addEventListener("wheel", this.onWheel);
    }

    update = (() => {
        let lastUpdate = 0;
        return async (now: number) => {
            if (now - lastUpdate < UPDATE_INTERVAL) return;
            lastUpdate = now;

            if (!this.mouseMoved) return;
            this.currentTool?.update?.();

            this.mouseMoved = false;
        };
    })();

    pickPosition(): string {
        return this._graph.getClosestElement(
            this.picker.pickPosition(this.mousePosition),
        );
    }

    pickArea(area: Zone): string[] {
        return this.picker.pickArea(area);
    }

    onPointerMove = (e: PointerEvent) => {
        const rect = this.context.gpu.canvas.getBoundingClientRect();
        this._mousePosition = [e.clientX - rect.left, e.clientY - rect.top];

        this.mouseMoved = true;
        this.currentTool?.onPointerMove?.(e);
    };
    onPointerDown = (e: PointerEvent) => {
        this._isPressing = true;
        this.currentTool?.onPointerDown?.(e);
    };
    onPointerUp = (e: PointerEvent) => {
        this._isPressing = false;
        this.currentTool?.onPointerUp?.(e);
    };
    onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "a") {
            const size: Vec2 = [200, 100];
            const node = this._graph.addNode({
                position: sub(this.mousePosition, scale(size, 0.5)),
                size,
            });
            this._graph.addHandle(node.id, { type: "input" });
            this._graph.addHandle(node.id, { type: "output" });
            return;
        }

        if (e.key === "I" || e.key === "O") {
            if (this.hoveredId == null || getType(this.hoveredId) !== "node")
                return;

            const type = e.key === "I" ? "input" : "output";

            this._graph.addHandle(this.hoveredId, { type });

            return;
        }
        if (e.key === "i" || e.key === "o") {
            if (this.hoveredId == null || getType(this.hoveredId) !== "node")
                return;

            const node = this._graph.getNode(this.hoveredId);
            if (node == null) return;

            const type = e.key === "i" ? "input" : "output";

            const typeHandle = node.handles.filter(
                (handle) => handle.type === type,
            );
            if (typeHandle.length === 0) return;

            this._graph.removeHandle(
                typeHandle[typeHandle.length - 1].id,
                node,
            );

            return;
        }
        if (e.key === "Backspace" || e.key === "Delete") {
            for (const selectedId of this.context.state.selectedIdSet) {
                const type = getType(selectedId);
                if (type === "node") {
                    this._graph.removeNode(selectedId);
                }
                if (type === "edge") {
                    this._graph.removeEdge(selectedId);
                }
            }
        }
        if (e.key === "Escape") {
            this.clearSelectedIdSet();
        }
        this.currentTool?.onKeyDown?.(e);
    };
    onKeyUp = (e: KeyboardEvent) => {
        this.currentTool?.onKeyUp?.(e);
    };
    onWheel = (e: WheelEvent) => {
        this.currentTool?.onWheel?.(e);
    };

    get isPressing() {
        return this._isPressing;
    }
    get mousePosition() {
        return this._mousePosition;
    }

    // Tool
    setTool(tool: InteractionTool) {
        console.log("[INTERACTOR] Switch to tool:", tool.constructor.name);
        this.currentTool = tool;
    }
    forwardEventToTool<K extends keyof ToolEventMap>(
        method: K,
        event: ToolEventMap[K],
    ): void {
        const fn = this.currentTool?.[method] as
            | ((this: InteractionTool, e: ToolEventMap[K]) => void)
            | undefined;
        fn?.call(this.currentTool, event);
    }
    resetTool() {
        this.setTool(new BaseTool(this));
    }

    // State
    get hoveredId(): Readonly<string | null> {
        return this.context.state.hoveredId;
    }
    get selectedIdIterator(): Readonly<SetIterator<string>> {
        return this.context.state.selectedIdSet.values();
    }
    selectId(selectedId: string) {
        return this.context.state.selectedIdSet.add(selectedId);
    }
    unselectId(selectedId: string) {
        return this.context.state.selectedIdSet.delete(selectedId);
    }
    isSelected(id: string) {
        return this.context.state.selectedIdSet.has(id);
    }
    clearSelectedIdSet() {
        return this.context.state.selectedIdSet.clear();
    }
    setHoveredId(hoveredId: string | null) {
        this.context.state.hoveredId = hoveredId;
    }

    get graph(): Graph {
        return this._graph;
    }
    get viewport(): Viewport {
        return this.context.viewport;
    }
}
