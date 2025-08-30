import Graph from "@/core/Graph";

import { RenderContext } from "./type";

import SelectionRenderer from "./SelectionRenderer";

import NodeRenderer from "./NodeRenderer";
import EdgeRenderer from "./EdgeRenderer";
import HandleRenderer from "./HandleRenderer";

import { RenderQueue } from "./RenderQueue";

export default class Renderer {
    private context: RenderContext;

    private selectionRenderer: SelectionRenderer;

    private nodeRenderer: NodeRenderer;
    private handleRenderer: HandleRenderer;
    private edgeRenderer: EdgeRenderer;

    private renderQueue: RenderQueue = new RenderQueue();

    constructor(context: RenderContext) {
        this.context = context;
        this.selectionRenderer = new SelectionRenderer(this.context);
        this.nodeRenderer = new NodeRenderer(this.context);
        this.handleRenderer = new HandleRenderer(this.context);
        this.edgeRenderer = new EdgeRenderer(this.context);
    }

    async init() {
        await Promise.all([
            this.selectionRenderer.init(),
            this.nodeRenderer.init(),
            this.handleRenderer.init(),
            this.edgeRenderer.init(),
        ]);
    }

    render() {
        const { encoder, pass } = this.context.gpu.beginFrame();

        this.renderQueue.flush(pass);
        this.renderQueue.clear();

        this.selectionRenderer.render(pass);

        this.context.gpu.endFrame({ encoder, pass });
    }

    syncGraph(graph: Graph) {
        for (const node of graph.getAllNode()) {
            this.nodeRenderer.enqueue(node, this.renderQueue);
            this.handleRenderer.enqueue(node, this.renderQueue);
        }
        // this.edgeRenderer.sync(graph);
        this.selectionRenderer.sync(graph);
    }

    resize(size: ViewportSize) {
        this.context.gpu.update(size);
        this.context.viewport.update(this.context.gpu, size);
    }
}
