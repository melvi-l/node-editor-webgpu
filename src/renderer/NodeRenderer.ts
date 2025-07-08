import { RenderContext } from "./type";
import { Vec2, Vec4 } from "@/utils/math";

export type NodeRender = {
    id: string;
    position: Vec2;
    size: Vec2;
    color: Vec4;
};

export default class NodeRenderer {
    private context: RenderContext;
    private pipeline!: GPURenderPipeline;
    private instanceBuffer!: GPUBuffer;
    private vertexBuffer!: GPUBuffer;
    private instanceCount = 0;

    constructor(context: RenderContext) {
        this.context = context;
    }

    async init() {
        const vertices = new Float32Array([0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1]);

        this.vertexBuffer = this.context.gpu.createBuffer(
            vertices,
            GPUBufferUsage.VERTEX,
        );

        const shader = await this.context.gpu.loadShaderModule("node");

        this.pipeline = this.context.gpu.createRenderPipeline({
            layout: this.context.gpu.device.createPipelineLayout({
                bindGroupLayouts: [this.context.viewport.bindGroupLayout],
            }),
            vertex: {
                module: shader,
                entryPoint: "vs_main",
                buffers: [
                    {
                        arrayStride: 8,
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x2",
                            },
                        ],
                    },
                    {
                        arrayStride: 48,
                        stepMode: "instance",
                        attributes: [
                            {
                                shaderLocation: 1,
                                offset: 0,
                                format: "float32x2",
                            }, // position
                            {
                                shaderLocation: 2,
                                offset: 8,
                                format: "float32x2",
                            }, // size
                            {
                                shaderLocation: 3,
                                offset: 16,
                                format: "float32x4",
                            }, // color
                        ],
                    },
                ],
            },
            fragment: {
                module: shader,
                entryPoint: "fs_main",
                targets: [{ format: this.context.gpu.format }],
            },
        });

        this.instanceBuffer = this.context.gpu.initBuffer(
            1024 * 64, // 64 KB
            GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        );
    }

    sync(nodeArray: NodeRender[]) {
        if (this.instanceBuffer == null) return;

        this.instanceCount = nodeArray.length;

        const instanceArray = new Float32Array(nodeArray.length * 12);

        nodeArray.forEach((node, i) => {
            instanceArray.set(node.position, i * 12 + 0);
            instanceArray.set(node.size, i * 12 + 2);
            instanceArray.set(node.color, i * 12 + 4);
        });

        this.context.gpu.updateBuffer(this.instanceBuffer, instanceArray);
    }

    render(pass: GPURenderPassEncoder) {
        if (
            this.pipeline == null ||
            this.vertexBuffer == null ||
            this.instanceBuffer == null ||
            this.instanceCount === 0
        )
            return;

        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.context.viewport.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setVertexBuffer(1, this.instanceBuffer);
        pass.draw(6, this.instanceCount);
    }
}
