import GPUResources from "./GPUResources";
import Node from "@/core/Node";

export default class NodeRenderer {
    private gpu: GPUResources;
    private pipeline!: GPURenderPipeline;
    private instanceBuffer!: GPUBuffer;
    private vertexBuffer!: GPUBuffer;
    private instanceCount = 0;

    constructor(gpu: GPUResources) {
        this.gpu = gpu;
    }

    async init() {
        const vertices = new Float32Array([0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1]);

        this.vertexBuffer = this.gpu.createBuffer(vertices, GPUBufferUsage.VERTEX);

        const shader = await this.gpu.loadShaderModule("node");

        this.pipeline = this.gpu.createRenderPipeline({
            vertex: {
                module: shader,
                entryPoint: "vs_main",
                buffers: [
                    {
                        arrayStride: 8,
                        attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
                    },
                    {
                        arrayStride: 48,
                        stepMode: "instance",
                        attributes: [
                            { shaderLocation: 1, offset: 0, format: "float32x2" }, // position
                            { shaderLocation: 2, offset: 8, format: "float32x2" }, // size
                            { shaderLocation: 3, offset: 16, format: "float32x4" }, // color
                        ],
                    },
                ],
            },
            fragment: {
                module: shader,
                entryPoint: "fs_main",
                targets: [{ format: this.gpu.format }],
            },
        });

        this.instanceBuffer = this.gpu.initBuffer(
            1024 * 64, // 64 KB
            GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        );
    }

    sync(nodeArray: Node[]) {
        if (this.instanceBuffer == null) return;
        this.instanceCount = nodeArray.length;
        const flat = new Float32Array(nodeArray.length * 12);

        nodeArray.forEach((node, i) => {
            flat.set(node.position, i * 12 + 0);
            flat.set(node.size, i * 12 + 2);
            flat.set(node.color, i * 12 + 4);
        });

        this.gpu.updateBuffer(this.instanceBuffer, flat);
    }

    render(pass: GPURenderPassEncoder) {
        if (!this.pipeline || !this.vertexBuffer || !this.instanceBuffer) return;

        pass.setPipeline(this.pipeline);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setVertexBuffer(1, this.instanceBuffer);
        pass.draw(6, this.instanceCount);
    }
}
