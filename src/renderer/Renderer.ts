import Graph from "@/core/Graph";
import GPUResources from "./GPUResources";
import NodeRenderer from "./NodeRenderer";
import EdgeRenderer from "./EdgeRenderer";

export default class Renderer {
    private gpu: GPUResources;

    private nodeRenderer: NodeRenderer;
    private edgeRenderer: EdgeRenderer;

    constructor(gpu: GPUResources) {
        this.gpu = gpu;
        this.nodeRenderer = new NodeRenderer(gpu);
        this.edgeRenderer = new EdgeRenderer(gpu);
    }

    async init() {
        await Promise.all([this.nodeRenderer.init(), this.edgeRenderer.init()]);
    }

    render() {
        const pass = this.gpu.beginFrame();

        this.edgeRenderer.render(pass); // d'abord les liens (sous les nœuds)
        this.nodeRenderer.render(pass); // ensuite les nœuds (au-dessus)

        this.gpu.endFrame();
    }

    syncGraph(graph: Graph) {
        this.nodeRenderer.sync(graph.nodes);
        this.edgeRenderer.sync(graph.edges);
    }
}
