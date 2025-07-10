import Graph from "@/core/Graph";
import { RenderContext } from "./type";
import { Vec2, Vec4, add } from "@/utils/math";
import { ResizableFloat32Array } from "./ResizableFloat32Array";

const bufferSize = 32 * 1_000_000; // instanceSize * maxInstanceCount

export default class NodeRenderer {
    private context: RenderContext;
    private pipeline!: GPURenderPipeline;
    private vertexBuffer!: GPUBuffer;
    private instanceBuffer!: GPUBuffer;
    private instanceCount = 0;
    private instanceArray = new ResizableFloat32Array();
    private idToIndex = new Map<string, number>();

    constructor(context: RenderContext) {
        this.context = context;
    }

    async init() {
        const quadVertices = new Float32Array([
            -1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,
        ]);

        this.vertexBuffer = this.context.gpu.createBuffer(
            quadVertices,
            GPUBufferUsage.VERTEX,
        );

        const shader = await this.context.gpu.loadShaderModule("unified");

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
                        arrayStride: 36,
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
                            }, // size or radius
                            {
                                shaderLocation: 3,
                                offset: 16,
                                format: "float32x4",
                            }, // color
                            { shaderLocation: 4, offset: 32, format: "uint32" }, // kind
                        ],
                    },
                ],
            },
            fragment: {
                module: shader,
                entryPoint: "fs_main",
                targets: [
                    {
                        format: this.context.gpu.format,
                        blend: {
                            color: {
                                srcFactor: "src-alpha",
                                dstFactor: "one-minus-src-alpha",
                                operation: "add",
                            },
                            alpha: {
                                srcFactor: "one",
                                dstFactor: "one-minus-src-alpha",
                                operation: "add",
                            },
                        },
                    },
                ],
            },
        });

        this.instanceBuffer = this.context.gpu.initBuffer(
            bufferSize,
            GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        );
    }

    sync(graph: Graph) {
        this.instanceCount = 0;
        this.instanceArray.ensureCapacity(
            (graph.nodeCount + graph.handleCount + graph.edgeCount) * 9 * 10,
        );

        const array = this.instanceArray.data;
        this.idToIndex.clear();
        let i = 0;

        for (const node of graph.getAllNode()) {
            this.idToIndex.set(node.id, i);

            const base = i * 9;
            array.set(node.position, base + 0);
            array.set(node.size, base + 2);
            array.set(
                node.style.backgroundColor[
                    this.context.state.selectedIdSet.has(node.id)
                        ? "selected"
                        : "default"
                ],
                base + 4,
            );
            array[base + 8] = 0; // kind = node
            i++;

            for (const handle of node.handles) {
                if (!handle.position) continue;
                const hbase = i * 9;
                const worldPosition = add(node.position, handle.position);

                array.set(worldPosition, hbase + 0);
                array.set([handle.radius, 0], hbase + 2);
                array.set(handle.color, hbase + 4);
                array[hbase + 8] = 1; // kind = handle
                i++;
            }
        }

        this.instanceCount = i;

        const slice = this.instanceArray.used;
        this.context.gpu.device.queue.writeBuffer(
            this.instanceBuffer,
            0,
            slice.buffer,
            slice.byteOffset,
            slice.byteLength,
        );
    }

    syncPartial(graph: Graph) {
        const dirtyNodeIds = graph.dirty.nodes;
        if (dirtyNodeIds.size === 0) return;

        const array = this.instanceArray.data;

        for (const nodeId of dirtyNodeIds) {
            const baseIndex = this.idToIndex.get(nodeId);
            if (baseIndex == null) continue;

            const node = graph.getNode(nodeId);
            if (node == null) continue;

            const base = baseIndex * 9;
            array.set(node.position, base + 0);
            array.set(node.size, base + 2);
            array.set(
                node.style.backgroundColor[
                    this.context.state.selectedIdSet.has(node.id)
                        ? "selected"
                        : "default"
                ],
                base + 4,
            );
            array[base + 8] = 0; // kind = node

            const nodeSlice = array.subarray(base, base + 9);
            this.context.gpu.updateSubBuffer(
                this.instanceBuffer,
                base * 4,
                nodeSlice.buffer,
                nodeSlice.byteOffset,
                nodeSlice.byteLength,
            );

            for (let h = 0; h < node.handles.length; h++) {
                const handle = node.handles[h];
                if (!handle.position) continue;

                const hbase = (baseIndex + 1 + h) * 9;

                const worldPosition = add(node.position, handle.position);
                array.set(worldPosition, hbase + 0);
                array.set([handle.radius, 0], hbase + 2);
                array.set(handle.color, hbase + 4);
                array[hbase + 8] = 1;

                const handleSlice = array.subarray(hbase, hbase + 9);
                this.context.gpu.updateSubBuffer(
                    this.instanceBuffer,
                    hbase * 4,
                    handleSlice.buffer,
                    handleSlice.byteOffset,
                    handleSlice.byteLength,
                );
            }
        }

        graph.dirty.nodes.clear();
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
