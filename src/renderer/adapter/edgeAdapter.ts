import Graph from "@/core/Graph";

import Edge from "@/core/Edge";
import { EdgeRender } from "../EdgeRenderer";

import { add, scale, Vec2 } from "@/utils/math";

function toEdgeRender(graph: Graph, edge: Edge): EdgeRender | null {
    const { source, target, color } = edge;

    // Source
    const sourceNode = graph.getNode(source.nodeId);
    const sourceHandle =
        source.handleId == null
            ? sourceNode?.handles[0]
            : graph.getHandle(source.handleId)?.handle;

    if (sourceHandle == null || sourceNode == null) {
        console.warn(
            `Edge ${edge.id} referenced an unexistant ${sourceHandle == null ? "source handle" : "source node"}`,
        );
        return null;
    }
    if (sourceHandle.position == null) {
        console.warn(
            `Unable to adapt for render edge ${edge.id} source handle ${sourceHandle.id}. Handle position should be compute before rendering`,
        );
        return null;
    }

    const start = add(sourceNode.position, sourceHandle.position);

    // Target
    const targetNode = graph.getNode(target.nodeId);
    const targetHandle =
        target.handleId == null
            ? targetNode?.handles[0]
            : graph.getHandle(target.handleId)?.handle;

    if (targetHandle == null || targetNode == null) {
        console.warn(
            `Edge ${edge.id} referenced an unexistant ${target == null ? "target handle" : "target node"}`,
        );
        return null;
    }
    if (targetHandle.position == null) {
        console.warn(
            `Unable to adapt for render edge ${edge.id} target handle ${sourceHandle.id}. Handle position should be compute before rendering`,
        );
        return null;
    }

    const end = add(targetNode.position, targetHandle.position);

    const mid = scale(add(start, end), 0.5);
    const path: Vec2[] = [start, [mid[0], start[1]], [mid[0], end[1]], end];

    return {
        path,
        color,
    };
}

export function toEdgeRenderArray(graph: Graph): EdgeRender[] {
    const edgeIterator = graph.getAllEdge();
    const edgeRenderArray: EdgeRender[] = [];
    for (const edge of edgeIterator) {
        const edgeRender = toEdgeRender(graph, edge);
        if (edgeRender == null) continue;
        edgeRenderArray.push(edgeRender);
    }
    return edgeRenderArray;
}
