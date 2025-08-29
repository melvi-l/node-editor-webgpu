import { InteractionTool } from "../Tool";
import { Interactor } from "../Interactor";
import Graph from "@/core/Graph";

import SelectionZone from "@/core/SelectionZone";
import { QuadTree } from "@/picking/QuadTree";

import { sub, Vec2 } from "@/utils/math";

export default class SelectionTool implements InteractionTool {
    private quadTree!: QuadTree<string>;

    private zoneStart!: Vec2;
    private zoneEnd!: Vec2;

    constructor(
        private interactor: Interactor,
        private graph: Graph,
    ) {
        this.init();
    }

    init() {
        this.zoneStart = this.interactor.mousePosition;
        this.zoneEnd = this.interactor.mousePosition;

        const size = sub(this.zoneEnd, this.zoneStart);

        this.graph.selectionZone = new SelectionZone(this.zoneStart, size);
        this.graph.selectionZone?.setPosition(this.zoneStart);
        this.graph.selectionZone?.setSize(size);

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

    async update() {
        const id = await this.interactor.pick();
        if (id === this.interactor.hoveredId) return;
        this.interactor.setHoveredId(id);
    }

    onPointerDown(e: PointerEvent) {
        if (this.interactor.hoveredId) {
            if (this.interactor.isSelected(this.interactor.hoveredId)) {
                this.interactor.unselectId(this.interactor.hoveredId);
            } else {
                this.interactor.selectId(this.interactor.hoveredId);
            }
        }

        this.zoneStart = this.interactor.mousePosition;
        this.zoneEnd = this.interactor.mousePosition;

        this.graph.selectionZone?.setPosition(this.zoneStart);
        this.graph.dirty.selection = true;
    }

    onPointerMove(e: PointerEvent): void {
        if (!this.interactor.isPressing) return;

        this.zoneEnd = this.interactor.mousePosition;

        const size = sub(this.zoneEnd, this.zoneStart);

        this.graph.selectionZone?.setSize(size);
        this.graph.dirty.selection = true;

        this.quadTree.pickArea({
                position: this.zoneStart,
                size,
            })
            .forEach((selectedId) => this.interactor.selectId(selectedId));
    }

    onPointerUp(e: PointerEvent): void {
        this.zoneStart = [0, 0];
        this.zoneEnd = [0, 0];
        this.graph.selectionZone?.reset();
    }

    onKeyUp(e: KeyboardEvent): void {
        if (e.key === "Shift") {
            this.graph.selectionZone = null;
            this.interactor.resetTool();
        }
    }
}
