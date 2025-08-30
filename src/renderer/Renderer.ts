import Graph from "@/core/Graph";

import { RenderContext, ViewportSize } from "./type";

import SelectionRenderer from "./SelectionRenderer";
import NodeRenderer from "./NodeRenderer";
import EdgeRenderer from "./EdgeRenderer";

export default class Renderer {
    private context: RenderContext;

    private selectionRenderer: SelectionRenderer;

    private nodeRenderer: NodeRenderer;
    private edgeRenderer: EdgeRenderer;

    constructor(context: RenderContext) {
        this.context = context;
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
        const { encoder, pass } = this.context.gpu.beginFrame();

        this.edgeRenderer.render(pass);
        this.nodeRenderer.render(pass);
        this.selectionRenderer.render(pass);

        this.context.gpu.endFrame({ encoder, pass });
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
