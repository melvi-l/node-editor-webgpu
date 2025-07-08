import Graph from "@/core/Graph";

import { RenderContext, ViewportSize } from "./type";

import NodeRenderer from "./NodeRenderer";
import { toNodeRenderArray } from "./adapter/nodeAdapter";

import HandleRenderer from "./HandleRenderer";
import { toHandleRenderArray } from "./adapter/handleAdapter";

import EdgeRenderer from "./EdgeRenderer";
import { toEdgeRenderArray } from "./adapter/edgeAdapter";

import { DebugTextureRenderer } from "@/debug/DebugRenderer";

export default class Renderer {
    private context: RenderContext;

    private nodeRenderer: NodeRenderer;
    private handleRenderer: HandleRenderer;
    private edgeRenderer: EdgeRenderer;

    private debugRenderer?: DebugTextureRenderer;

    constructor(context: RenderContext, debugRenderer?: DebugTextureRenderer) {
        this.context = context;
        this.debugRenderer = debugRenderer;
        this.nodeRenderer = new NodeRenderer(this.context);
        this.handleRenderer = new HandleRenderer(this.context);
        this.edgeRenderer = new EdgeRenderer(this.context);
    }

    async init() {
        await Promise.all([
            this.nodeRenderer.init(),
            this.handleRenderer.init(),
            this.edgeRenderer.init(),
        ]);
    }

    render() {
        const pass = this.context.gpu.beginFrame();

        this.edgeRenderer.render(pass);
        this.nodeRenderer.render(pass);
        this.handleRenderer.render(pass);

        if (this.debugRenderer != null) {
            this.debugRenderer.render(pass);
        }

        this.context.gpu.endFrame();
    }

    syncGraph(graph: Graph) {
        if (graph.dirty.global === false) {
            this.nodeRenderer.syncPartial(graph);
            // this.handleRenderer.syncPartial(graph)
            // this.edgeRenderer.syncPartial(graph)
            return;
        }
        this.nodeRenderer.sync(graph);
        this.handleRenderer.sync(toHandleRenderArray(graph));
        this.edgeRenderer.sync(toEdgeRenderArray(graph));

        graph.dirty.global = false;
    }

    resize(size: ViewportSize) {
        this.context.gpu.update(size);
        this.context.viewport.update(this.context.gpu, size);
    }
}
