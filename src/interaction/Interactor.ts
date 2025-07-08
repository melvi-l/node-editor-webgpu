import Graph from "@/core/Graph";
import { InteractionTool } from "./Tool";
import { Vec2 } from "@/utils/math";
import BaseTool from "./tools/BaseTool";
import { RenderContext } from "@/renderer/type";

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
        canvas.addEventListener("pointermove", (e) => {
            const rect = canvas.getBoundingClientRect();
            this._mousePosition = [e.clientX - rect.left, e.clientY - rect.top];

            this.mouseMoved = true;
            this.currentTool?.onPointerMove?.(e);
        });
        canvas.addEventListener("pointerdown", (e) =>
            this.currentTool?.onPointerDown?.(e),
        );
        canvas.addEventListener("pointerup", (e) =>
            this.currentTool?.onPointerUp?.(e),
        );

        window.addEventListener("keydown", (e) =>
            this.currentTool?.onKeyDown?.(e),
        );
        window.addEventListener("keyup", (e) => this.currentTool?.onKeyUp?.(e));
        window.addEventListener("wheel", (e) => this.currentTool?.onWheel?.(e));
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
    setHovered(hoveredId: string) {
        this.context.state.hoveredId = hoveredId;
    }
    setSelected(selectedId: string) {
        this.context.state.selectedId = selectedId;
    }
}
