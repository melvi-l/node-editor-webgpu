import { InteractionTool } from "../Tool";
import { Interactor } from "../Interactor";

import { add, sub, Vec2 } from "@/utils/math";

export default class ViewportTool implements InteractionTool {
    private lastMousePosition!: Vec2;

    constructor(private interactor: Interactor) { }

    async update() { }

    onPointerDown(e: PointerEvent) {
        this.lastMousePosition = this.interactor.mousePosition;
    }

    onPointerUp(e: PointerEvent): void {
        this.interactor.resetTool();
    }

    onPointerMove(e: PointerEvent): void {
        if (this.interactor.isPressing) {
            console.log(
                sub(this.lastMousePosition, this.interactor.mousePosition),
            );
            this.interactor.viewport.pan = add(
                this.interactor.viewport.pan,
                sub(this.lastMousePosition, this.interactor.mousePosition),
            );
            this.lastMousePosition = this.interactor.mousePosition;
        }
    }
    onWheel(e: WheelEvent): void {
        this.interactor.viewport.zoom += e.wheelDelta / 1000;
        this.interactor.resetTool();
    }
}
