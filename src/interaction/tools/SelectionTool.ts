import { InteractionTool } from "../Tool";
import { Interactor } from "../Interactor";
import Graph from "@/core/Graph";

import { QuadTree } from "@/picking/QuadTree";
import { sub, Vec2 } from "@/utils/math";

export default class SelectionTool implements InteractionTool {
    private quadTree!: QuadTree<string>;

    private isPressing: boolean = false;

    private zoneStart: Vec2 = [0, 0];
    private zoneEnd: Vec2 = [0, 0];

    constructor(
        private interactor: Interactor,
        private graph: Graph,
    ) {
        this.init();
    }

    init() {
        this.quadTree = new QuadTree({
            position: [-10_000, -10_000],
            size: [20_000, 20_000],
        });
        for (const node of this.graph.getAllNode()) {
            this.quadTree.insert({
                bounds: {
                    position: node.position,
                    size: node.size,
                },
                data: node.id,
            });
            for (const sourceHandle of node.handles) {
                const edge = this.graph.getEdgeByHandleId(sourceHandle.id);
                if (edge == null || edge.source.handleId != sourceHandle.id)
                    continue;

                const startEnd = this.graph.computeEdgeStartEnd(edge);
                if (startEnd == null) continue;
                const path = edge.computePath(...startEnd);

                const [minX, minY, maxX, maxY] = path.reduce(
                    ([minX, minY, maxX, maxY], [x, y]) => [
                        Math.min(minX, x),
                        Math.min(minY, y),
                        Math.max(maxX, x),
                        Math.max(maxY, x),
                    ],
                    [Infinity, Infinity, -Infinity, -Infinity],
                );

                this.quadTree.insert({
                    bounds: {
                        position: [minX, minY],
                        size: [maxX - minX, maxY - minY],
                    },
                    data: edge.id,
                });
            }
        }
    }

    update(): void { }

    onPointerDown(e: PointerEvent) {
        if (this.interactor.hoveredId) {
            this.interactor.selectedIdSet.add(this.interactor.hoveredId);
        }

        this.zoneStart = this.interactor.mousePosition;
        this.zoneEnd = this.interactor.mousePosition;

        this.isPressing = true;
    }

    onPointerMove(e: PointerEvent): void {
        if (!this.isPressing) return;

        this.zoneEnd = this.interactor.mousePosition;

        this.quadTree
            .query({
                position: this.zoneStart,
                size: sub(this.zoneEnd, this.zoneStart),
            })
            .forEach((selectedId) =>
                this.interactor.selectedIdSet.add(selectedId),
            );
    }

    onPointerUp(e: PointerEvent): void {
        this.zoneStart = [0, 0];
        this.zoneEnd = [0, 0];

        this.isPressing = false;
    }

    onKeyUp(e: KeyboardEvent): void {
        if (e.key === "Shift") {
            this.interactor.resetTool();
        }
    }
}
