import Graph from "@/core/Graph";

import { NodeRender } from "../NodeRenderer";

export function toNodeRenderArray(graph: Graph): NodeRender[] {
    return [...graph.getAllNode()];
}
