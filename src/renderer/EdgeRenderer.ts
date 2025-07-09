import Graph from "@/core/Graph";
import { ResizableFloat32Array } from "./ResizableFloat32Array";
import { RenderContext, Uniform } from "./type";
import { computeMitter, direction, normal, Vec2, Vec4 } from "@/utils/math";
import { toEdgeRender } from "./adapter/edgeAdapter";

type EdgeRendererOptions = {
    width: number;
};

export type EdgeRender = {
    id: string;
    color: Vec4;
    path: Vec2[];
};

// Instanciated (and triangle-stip) version of the stroke extension in vertex shader
export default class EdgeRenderer {
    private context: RenderContext;
    private pipeline!: GPURenderPipeline;
    private unitQuadBuffer!: GPUBuffer;
    private instanceBuffer!: GPUBuffer;
    private instanceCount = 0;
    private instanceArray = new ResizableFloat32Array();
    private idToIndex = new Map<string, number>();

    private opts: EdgeRendererOptions;
    private optsUniform!: Uniform;

    constructor(
        context: RenderContext,
        opts: EdgeRendererOptions = { width: 2 },
    ) {
        this.context = context;
        this.opts = opts;
    }
    async init() {
        const unitQuad = new Float32Array([
            // miter, t (=0 for start, =1 for end)
            +1, 0, -1, 0, +1, 1, -1, 1,
        ]);
        this.unitQuadBuffer = this.context.gpu.createBuffer(
            unitQuad,
            GPUBufferUsage.VERTEX,
        );

        const shader = await this.context.gpu.loadShaderModule("edge");

        this.optsUniform = this.computeOptsUniform();
        this.pipeline = this.context.gpu.createRenderPipeline({
            layout: this.context.gpu.device.createPipelineLayout({
                bindGroupLayouts: [
                    this.context.viewport.bindGroupLayout,
                    this.optsUniform.bindGroupLayout,
                ],
            }),
            vertex: {
                module: shader,
                entryPoint: "vs_main",
                buffers: [
                    {
                        arrayStride: 8, // 2 floats per vertex
                        stepMode: "vertex",
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x2",
                            }, // miter, t
                        ],
                    },
                    {
                        arrayStride: 56, // 14 floats = 56 bytes per instance
                        stepMode: "instance",
                        attributes: [
                            {
                                shaderLocation: 1,
                                offset: 0,
                                format: "float32x4",
                            }, // color
                            {
                                shaderLocation: 2,
                                offset: 16,
                                format: "float32x2",
                            }, // start
                            {
                                shaderLocation: 3,
                                offset: 24,
                                format: "float32x2",
                            }, // startNormal
                            {
                                shaderLocation: 4,
                                offset: 32,
                                format: "float32x2",
                            }, // end
                            {
                                shaderLocation: 5,
                                offset: 40,
                                format: "float32x2",
                            }, // endNormal
                            {
                                shaderLocation: 6,
                                offset: 48,
                                format: "float32",
                            }, // startMiterLength
                            {
                                shaderLocation: 7,
                                offset: 52,
                                format: "float32",
                            }, // startMiterLength
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
                        // blend: {
                        //   color: {
                        //     srcFactor: "src-alpha",
                        //     dstFactor: "one-minus-src-alpha",
                        //     operation: "add",
                        //   },
                        //   alpha: {
                        //     srcFactor: "one",
                        //     dstFactor: "one-minus-src-alpha",
                        //     operation: "add",
                        //   },
                        // },
                    },
                ],
            },
            primitive: { topology: "triangle-strip" },
        });

        this.instanceBuffer = this.context.gpu.initBuffer(
            1024 * 256, // should maybe increase
            GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        );
    }

    sync(graph: Graph) {
        let i = 0;
        this.idToIndex.clear();

        for (const edge of graph.getAllEdge()) {
            const edgeRender = toEdgeRender(graph, edge);
            if (edgeRender == null) continue;

            this.idToIndex.set(edge.id, i);
            i += this.writeEdge(edgeRender, i);
        }

        this.instanceCount = i;
        this.instanceArray.ensureCapacity(i * 14);

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
        const dirtyEdges = graph.dirty.edges;
        if (dirtyEdges.size === 0) return;
        console.log("partsync");

        for (const edgeId of dirtyEdges) {
            const baseIndex = this.idToIndex.get(edgeId);
            if (baseIndex === undefined) continue;

            const edge = graph.getEdge(edgeId);
            if (!edge) continue;

            const edgeRender = toEdgeRender(graph, edge);
            if (edgeRender == null) continue;

            this.writeEdge(edgeRender, baseIndex, true);
        }

        graph.dirty.edges.clear();
    }

    render(pass: GPURenderPassEncoder) {
        if (
            this.pipeline == null ||
            this.instanceBuffer == null ||
            this.instanceCount === 0
        )
            return;

        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.context.viewport.bindGroup);
        pass.setBindGroup(1, this.optsUniform.bindGroup);
        pass.setVertexBuffer(0, this.unitQuadBuffer); // 4 vertices
        pass.setVertexBuffer(1, this.instanceBuffer); // N segments
        pass.draw(4, this.instanceCount); // 4 vertices per quad, N instances
    }

    private writeEdge(
        edge: EdgeRender,
        baseIndex: number,
        upload = false,
    ): number {
        const { color, path } = edge;
        const array = this.instanceArray.data;
        let i = baseIndex;

        let lastMiter: { miter: Vec2; miterFactor: number } | null = null;

        for (let p = 1; p < path.length; p++) {
            const last = path[p - 1];
            const curr = path[p];
            const next = p < path.length - 1 ? path[p + 1] : null;

            const dirA = direction(last, curr);
            if (p === 1) {
                lastMiter = { miter: normal(dirA), miterFactor: 1 };
            }
            if (!lastMiter) continue;

            let endNormal: Vec2,
                miterFactor = 1;

            if (next) {
                const dirB = direction(curr, next);
                const m = computeMitter(dirA, dirB);
                endNormal = m.miter;
                miterFactor = m.miterFactor;
            } else {
                endNormal = normal(dirA);
            }

            const base = i * 14;
            array.set(color, base + 0);
            array.set(last, base + 4);
            array.set(lastMiter.miter, base + 6);
            array.set(curr, base + 8);
            array.set(endNormal, base + 10);
            array[base + 12] = lastMiter.miterFactor;
            array[base + 13] = miterFactor;

            if (upload) {
                this.context.gpu.device.queue.writeBuffer(
                    this.instanceBuffer,
                    base * 4,
                    array.buffer,
                    base * 4,
                    14 * 4,
                );
            }

            lastMiter = { miter: endNormal, miterFactor };
            i++;
        }

        return i - baseIndex;
    }

    private computeOptsUniform() {
        const buffer = this.context.gpu.createBuffer(
            new Float32Array([this.opts.width]),
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        );
        const bindGroupLayout = this.context.gpu.device.createBindGroupLayout({
            label: "edge-opts-layout",
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "uniform",
                    },
                },
            ],
        });
        const bindGroup = this.context.gpu.createBindGroup(bindGroupLayout, [
            { binding: 0, resource: buffer },
        ]);
        return { buffer, bindGroupLayout, bindGroup };
    }
}
