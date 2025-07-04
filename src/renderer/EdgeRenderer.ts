import Edge from "@/core/Edge";
import GPUResources from "./GPUResources";

export default class EdgeRenderer {
    gpu: GPUResources;
    constructor(gpu: GPUResources) {
        this.gpu = gpu;
    }
    async init() {}
    sync(edgeArray: Edge[]) { }
    render(pass: GPURenderPassEncoder) { }
}
