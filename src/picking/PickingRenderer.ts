import Graph from "@/core/Graph";

import { RenderContext } from "@/renderer/type";

import { PickingManager } from "./PickingManager";

import { add, sub } from "@/utils/math";

export class PickingRenderer {
    private context: RenderContext;
    private picking: PickingManager;

    private pipeline!: GPURenderPipeline;
    private vertexBuffer!: GPUBuffer;
    private instanceBuffer!: GPUBuffer;
    private instanceCount = 0;

    constructor(context: RenderContext, picking: PickingManager) {
        this.context = context;
        this.picking = picking;
    }

    async init() {
        const shader = await this.context.gpu.loadShaderModule("picking");

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
                        arrayStride: 32, // pos(2x4) + size(2x4) + rgb(3x4) + padding(1x4) = 32 BYTES
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
                            }, // position
                            {
                                shaderLocation: 3,
                                offset: 16,
                                format: "float32x3",
                            }, // RGB
                        ],
                    },
                ],
            },

            fragment: {
                module: shader,
                entryPoint: "fs_main",
                targets: [{ format: "rgba8unorm" }],
            },
        });

        const quad = new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]);

        this.vertexBuffer = this.context.gpu.createBuffer(
            quad,
            GPUBufferUsage.VERTEX,
        );

        this.instanceBuffer = this.context.gpu.initBuffer(
            1024 * 64,
            GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        );
    }

    render(graph: Graph, pass: GPURenderPassEncoder) {
        const instanceData: number[] = [];
        let instanceCount = 0;

        const handleIterator = graph.getAllHandle(); // returns Iterable<Handle>
        for (const { nodeId, handle } of handleIterator) {
            const id = this.picking.getOrCreateId(handle.id);
            const [r, g, b] = this.picking
                .encodeIdToColor(id)
                .map((v) => v / 255);

            const node = graph.getNode(nodeId);
            if (
                node == null ||
                handle.position == null ||
                handle.radius == null
            )
                continue;

            const center = add(node.position, handle.position);
            const position = sub(center, [handle.radius, handle.radius]);
            const size = [handle.radius * 2, handle.radius * 2];

            instanceData.push(...position, ...size, r, g, b, 0);
            instanceCount++;
        }

        const nodeIterator = graph.getAllNode();
        for (const node of nodeIterator) {
            const id = this.picking.getOrCreateId(node.id);
            const [r, g, b] = this.picking
                .encodeIdToColor(id)
                .map((v) => v / 255);

            instanceData.push(...node.position, ...node.size, r, g, b, 0);
            instanceCount++;
        }

        // TODO: edge

        this.instanceCount = instanceCount;

        const instanceArray = new Float32Array(instanceData);
        this.context.gpu.updateBuffer(this.instanceBuffer, instanceArray);

        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.context.viewport.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setVertexBuffer(1, this.instanceBuffer);
        pass.draw(6, this.instanceCount);
    }
}
