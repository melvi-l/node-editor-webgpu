import Graph from "@/core/Graph";

import Handle from "@/core/Handle";
import { HandleRender } from "../HandleRenderer";

import { add, Vec2 } from "@/utils/math";

function toHandleRender(
    handle: Handle,
    nodePosition: Vec2,
): HandleRender | null {
    if (handle.position == null) {
        console.warn(
            `Unable to adapt for render handle ${handle.id}. Handle position should be compute before rendering`,
        );
        return null;
    }

    return {
        position: add(nodePosition, handle.position),
        color: handle.color,
        radius: handle.radius,
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
