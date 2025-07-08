import Graph from "@/core/Graph";

import Handle from "@/core/Handle";
import { HandleRender } from "../HandleRenderer";

import { add, Vec2 } from "@/utils/math";

function toHandleRender(
    { id, position, color, radius }: Handle,
    nodePosition: Vec2,
): HandleRender | null {
    if (position == null) {
        console.warn(
            `Unable to adapt for render handle ${id}. Handle position should be compute before rendering`,
        );
        return null;
    }

    return {
        id,
        position: add(nodePosition, position),
        color,
        radius,
    };
}
export function toHandleRenderArray(graph: Graph): HandleRender[] {
    const handleIterator = graph.getAllHandle();
    const handleRenderArray: HandleRender[] = [];
    for (const { handle, nodeId } of handleIterator) {
        const node = graph.getNode(nodeId);
        if (node == null) continue;
        const handleRender = toHandleRender(handle, node.position);
        if (handleRender == null) continue;
        handleRenderArray.push(handleRender);
    }
    return handleRenderArray;
}
