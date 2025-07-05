import Graph from "@/core/Graph";

import { RenderContext, ViewportSize } from "./type";
import GPUResources from "./GPUResources";
import ViewportUniform from "./ViewportUniform";

import NodeRenderer from "./NodeRenderer";
import HandleRenderer from "./HandleRenderer";
import EdgeRenderer from "./EdgeRenderer";

export default class Renderer {
    private context: RenderContext;

    private nodeRenderer: NodeRenderer;
    private handleRenderer: HandleRenderer;
    private edgeRenderer: EdgeRenderer;

    constructor(gpu: GPUResources) {
        this.context = {
            gpu,
            viewport: new ViewportUniform(gpu, gpu.canvasSize),
        };
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
        // this.nodeRenderer.render(pass);
        // this.handleRenderer.render(pass);

        this.context.gpu.endFrame();
    }

    syncGraph(graph: Graph) {
        this.nodeRenderer.sync(graph.nodes);
        this.handleRenderer.sync(graph.handles);
        this.edgeRenderer.sync(graph.edges);
    }

    resize(size: ViewportSize) {
        this.context.gpu.update(size);
        this.context.viewport.update(this.context.gpu, size);
    }
}
