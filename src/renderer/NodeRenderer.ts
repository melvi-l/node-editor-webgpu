import Graph from "@/core/Graph";
import { RenderContext } from "./type";
import { Vec2, Vec4 } from "@/utils/math";
import { ResizableFloat32Array } from "./ResizableFloat32Array";

const bufferSize = 32 * 1_000_000; // instanceSize * maxInstanceCount

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
    private idToIndex = new Map<string, number>();
    private instanceArray = new ResizableFloat32Array();

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
                        arrayStride: 32,
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
            bufferSize,
            GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        );
    }

    sync(graph: Graph) {
        if (this.instanceBuffer == null) return;

        this.instanceCount = graph.nodes.size;

        this.instanceArray.ensureCapacity(this.instanceCount * 8);
        const array = this.instanceArray.data;
        this.idToIndex.clear();

        let i = 0;
        for (const node of graph.getAllNode()) {
            this.idToIndex.set(node.id, i);

            const base = i * 8;
            array.set(node.position, base + 0);
            array.set(node.size, base + 2);
            array.set(node.color, base + 4);
            i++;
        }

        const slice = this.instanceArray.used;

        this.context.gpu.updateSubBuffer(
            this.instanceBuffer,
            0,
            slice.buffer,
            slice.byteOffset,
            slice.byteLength,
        );
    }

    syncPartial(graph: Graph) {
        const dirtyNodeIdSet = graph.dirty.nodes;

        if (dirtyNodeIdSet.size === 0) return;

        for (const nodeId of dirtyNodeIdSet) {
            const index = this.idToIndex.get(nodeId);
            if (index == null) continue;

            const node = graph.getNode(nodeId);
            if (node == null) continue;

            const array = this.instanceArray.data;

            const base = index * 8;
            array.set(node.position, base + 0);
            array.set(node.size, base + 2);
            array.set(node.color, base + 4);

            const dataSlice = array.subarray(base, base + 8);

            this.context.gpu.updateSubBuffer(
                this.instanceBuffer,
                index * 32,
                dataSlice.buffer,
                dataSlice.byteOffset,
                dataSlice.byteLength,
            );
        }

        graph.dirty.nodes.clear();
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
