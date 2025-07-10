import Graph from "@/core/Graph";
import { RenderContext } from "@/renderer/type";

import { InteractionTool } from "./Tool";
import BaseTool from "./tools/BaseTool";

import { scale, sub, Vec2 } from "@/utils/math";
import { getType } from "@/utils/id";

const UPDATE_INTERVAL = 1000 / 60;

type ToolEventMap = {
    onPointerDown: PointerEvent;
    onPointerMove: PointerEvent;
    onPointerUp: PointerEvent;
    onKeyDown: KeyboardEvent;
    onWheel: WheelEvent;
};

type PickingManager = {
    pick: (x: number, y: number) => Promise<string | null>;
};

export class Interactor {
    private picking: PickingManager;
    private graph: Graph;
    private context: RenderContext;

    private currentTool: InteractionTool;

    private _mousePosition: Vec2 = [0, 0];
    private mouseMoved = false;

    constructor(picking: PickingManager, graph: Graph, context: RenderContext) {
        this.picking = picking;
        this.graph = graph;
        this.context = context;

        this.currentTool = new BaseTool(this, this.graph);

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

    async pick(): Promise<string | null> {
        return this.picking.pick(...this.mousePosition);
    }

    onPointerMove = (e: PointerEvent) => {
        const rect = this.context.gpu.canvas.getBoundingClientRect();
        this._mousePosition = [e.clientX - rect.left, e.clientY - rect.top];

        this.mouseMoved = true;
        this.currentTool?.onPointerMove?.(e);
    };
    onPointerDown = (e: PointerEvent) => {
        this.currentTool?.onPointerDown?.(e);
    };
    onPointerUp = (e: PointerEvent) => {
        this.currentTool?.onPointerUp?.(e);
    };
    onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "a") {
            const size: Vec2 = [200, 100];
            const node = this.graph.addNode({
                position: sub(this.mousePosition, scale(size, 0.5)),
                size,
            });
            this.graph.addHandle(node.id, { type: "input" });
            this.graph.addHandle(node.id, { type: "output" });
            return;
        }

        if (e.key === "I" || e.key === "O") {
            if (this.hoveredId == null || getType(this.hoveredId) !== "node")
                return;

            const type = e.key === "I" ? "input" : "output";

            this.graph.addHandle(this.hoveredId, { type });

            return;
        }
        if (e.key === "i" || e.key === "o") {
            if (this.hoveredId == null || getType(this.hoveredId) !== "node")
                return;

            const node = this.graph.getNode(this.hoveredId);
            if (node == null) return;

            const type = e.key === "i" ? "input" : "output";

            const typeHandle = node.handles.filter(
                (handle) => handle.type === type,
            );
            if (typeHandle.length === 0) return;

            this.graph.removeHandle(typeHandle[typeHandle.length - 1].id, node);

            return;
        }
        if (e.key === "Backspace" || e.key === "Delete") {
            for (const selectedId of this.selectedIdSet) {
                const type = getType(selectedId);
                if (type === "node") {
                    this.graph.removeNode(selectedId);
                }
                if (type === "edge") {
                    this.graph.removeEdge(selectedId);
                }
            }
        }
        if (e.key === "Escape") {
            this.selectedIdSet.clear();
        }
        this.currentTool?.onKeyDown?.(e);
    };
    onKeyUp = (e: KeyboardEvent) => {
        this.currentTool?.onKeyUp?.(e);
    };
    onWheel = (e: WheelEvent) => {
        this.currentTool?.onWheel?.(e);
    };

    get mousePosition() {
        return this._mousePosition;
    }

    // Tool
    setTool(tool: InteractionTool) {
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
        this.currentTool = new BaseTool(this, this.graph);
    }

    // State
    get hoveredId(): Readonly<string | null> {
        return this.context.state.hoveredId;
    }
    get selectedIdSet(): Set<string> {
        return this.context.state.selectedIdSet;
    }
    setHoveredId(hoveredId: string | null) {
        this.context.state.hoveredId = hoveredId;
    }
}
