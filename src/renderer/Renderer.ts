import Graph from "@/core/Graph";

import { RenderContext, ViewportSize } from "./type";

import NodeRenderer from "./NodeRenderer";

import EdgeRenderer from "./EdgeRenderer";

import { DebugTextureRenderer } from "@/debug/DebugRenderer";
import SelectionRenderer from "./SelectionRenderer";

export default class Renderer {
    private context: RenderContext;

    private selectionRenderer: SelectionRenderer;

    private nodeRenderer: NodeRenderer;
    private edgeRenderer: EdgeRenderer;

    private debugRenderer?: DebugTextureRenderer;

    constructor(context: RenderContext, debugRenderer?: DebugTextureRenderer) {
        this.context = context;
        this.debugRenderer = debugRenderer;
        this.selectionRenderer = new SelectionRenderer(this.context);
        this.nodeRenderer = new NodeRenderer(this.context);
        this.edgeRenderer = new EdgeRenderer(this.context);
    }

    async init() {
        await Promise.all([
            this.selectionRenderer.init(),
            this.nodeRenderer.init(),
            this.edgeRenderer.init(),
        ]);
    }

    render() {
        const pass = this.context.gpu.beginFrame();

        this.edgeRenderer.render(pass);
        this.nodeRenderer.render(pass);
        this.selectionRenderer.render(pass);

        if (this.debugRenderer != null) {
            this.debugRenderer.render(pass);
        }

        this.context.gpu.endFrame();
    }

    syncGraph(graph: Graph) {
        this.selectionRenderer.sync(graph);
        if (graph.dirty.global === false) {
            this.nodeRenderer.syncPartial(graph);
            this.edgeRenderer.syncPartial(graph);
            return;
        }
        this.nodeRenderer.sync(graph);
        this.edgeRenderer.sync(graph);

        graph.dirty.global = false;
    }

    resize(size: ViewportSize) {
        this.context.gpu.update(size);
        this.context.viewport.update(this.context.gpu, size);
    }
}
