import Graph from "@/core/Graph";
import { InteractionTool } from "./Tool";
import { Vec2 } from "@/utils/math";
import BaseTool from "./tools/BaseTool";

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
    private canvas: HTMLCanvasElement;
    private picking: PickingManager;
    private graph: Graph;
    private currentTool: InteractionTool;
    private _mousePosition: Vec2 = [0, 0];
    private mouseMoved = false;

    constructor(
        picking: PickingManager,
        graph: Graph,
        canvas: HTMLCanvasElement,
    ) {
        this.picking = picking;
        this.graph = graph;
        this.canvas = canvas;
        this.currentTool = new BaseTool(this, this.graph);

        this.initEvents();
    }

    private initEvents() {
        this.canvas.addEventListener("pointermove", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this._mousePosition = [e.clientX - rect.left, e.clientY - rect.top];

            this.mouseMoved = true;
            this.currentTool?.onPointerMove?.(e);
        });
        this.canvas.addEventListener("pointerdown", (e) =>
            this.currentTool?.onPointerDown?.(e),
        );
        this.canvas.addEventListener("pointerup", (e) =>
            this.currentTool?.onPointerUp?.(e),
        );

        window.addEventListener("keydown", (e) =>
            this.currentTool?.onKeyDown?.(e),
        );
        window.addEventListener("keyup", (e) => this.currentTool?.onKeyUp?.(e));
        window.addEventListener("wheel", (e) => this.currentTool?.onWheel?.(e));
    }

    async update() {
        if (!this.mouseMoved) return;
        this.currentTool?.update?.();

        this.mouseMoved = false;
    }

    async pick(): Promise<string | null> {
        return this.picking.pick(...this.mousePosition);
    }

    get mousePosition() {
        return this._mousePosition;
    }

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
}
