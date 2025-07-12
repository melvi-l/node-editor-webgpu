import Graph from "@/core/Graph";

import { RenderContext } from "@/renderer/type";

import { PickingManager } from "./PickingManager";

import { add, scale, sub, Vec2 } from "@/utils/math";
import { ResizableFloat32Array } from "@/renderer/ResizableFloat32Array";

const bufferSize = 32 * 1_000_000; // instanceSize * maxInstanceCount

export class PickingRenderer {
    private context: RenderContext;
    private picking: PickingManager;

    private pipeline!: GPURenderPipeline;
    private vertexBuffer!: GPUBuffer;
    private instanceBuffer!: GPUBuffer;
    private instanceArray = new ResizableFloat32Array();
    private instanceCount = 0;
    private idToIndex = new Map<string, number>();

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
                            }, // size
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
            bufferSize,
            GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        );
    }

    sync(graph: Graph) {
        const array = this.instanceArray.data;
        this.instanceCount = 0;
        this.instanceArray.ensureCapacity(
            (graph.nodeCount + graph.handleCount + graph.edgeCount) * 9 * 10,
        );
        this.idToIndex.clear();

        let i = 0;
        for (const node of graph.getAllNode()) {
            this.idToIndex.set(node.id, i);

            const id = this.picking.getOrCreateId(node.id);
            const [r, g, b] = this.picking
                .encodeIdToColor(id)
                .map((v) => v / 255);

            const base = i * 8;
            array.set(node.position, base + 0);
            array.set(node.size, base + 2);
            array.set([r, g, b], base + 4);
            array[base + 7] = 0; // padding
            i++;

            for (const handle of node.handles) {
                if (!handle.position) continue;

                const uId = handle.id;
                const hId = this.picking.getOrCreateId(uId);
                const [hr, hg, hb] = this.picking
                    .encodeIdToColor(hId)
                    .map((v) => v / 255);

                const demiSize = [handle.radius + 2, handle.radius + 2] as Vec2;
                const pos = sub(add(node.position, handle.position), demiSize);
                const size = scale(demiSize, 2);

                const hbase = i * 8;

                array.set(pos, hbase + 0);

                array.set(size, hbase + 2);
                array.set([hr, hg, hb], hbase + 4);
                array[hbase + 7] = 0; // padding
                i++;
            }
        }

        this.instanceCount = i;

        const slice = this.instanceArray.used;
        this.context.gpu.updateSubBuffer(
            this.instanceBuffer,
            0,
            slice.buffer,
            slice.byteOffset,
            slice.byteLength,
        );
    }

    /*
     * Not precise enough, should find a way to target only updated node
     * TODO: aim bette
     */
    syncPartial(graph: Graph) {
        const dirtyNodeIds = graph.dirty.nodes;
        if (dirtyNodeIds.size === 0) return;

        const array = this.instanceArray.data;

        for (const nodeId of dirtyNodeIds) {
            const baseIndex = this.idToIndex.get(nodeId);
            if (baseIndex === undefined) continue;

            const node = graph.getNode(nodeId);

            if (!node) continue;

            const base = baseIndex * 8;
            const id = this.picking.getOrCreateId(node.id);

            const [r, g, b] = this.picking
                .encodeIdToColor(id)
                .map((v) => v / 255);

            array.set(node.position, base + 0);
            array.set(node.size, base + 2);
            array.set([r, g, b], base + 4);

            this.context.gpu.updateSubBuffer(
                this.instanceBuffer,
                base * 4,
                array.buffer,
                base * 4,
                32,
            );

            for (let h = 0; h < node.handles.length; h++) {
                const handle = node.handles[h];
                if (!handle.position) continue;

                const hIndex = baseIndex + 1 + h;
                const hbase = hIndex * 8;
                const hId = this.picking.getOrCreateId(handle.id);

                const [hr, hg, hb] = this.picking
                    .encodeIdToColor(hId)
                    .map((v) => v / 255);

                const demiSize = [handle.radius + 2, handle.radius + 2] as Vec2;
                const pos = sub(add(node.position, handle.position), demiSize);
                const size = scale(demiSize, 2);

                array.set(pos, hbase + 0);
                array.set(size, hbase + 2);

                array.set([hr, hg, hb], hbase + 4);

                this.context.gpu.updateSubBuffer(
                    this.instanceBuffer,
                    hbase * 4,
                    array.buffer,
                    hbase * 4,
                    32,
                );
            }
        }
    }

    render(pass: GPURenderPassEncoder) {
        if (this.instanceCount === 0) return;

        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.context.viewport.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setVertexBuffer(1, this.instanceBuffer);
        pass.draw(6, this.instanceCount);
    }
}
