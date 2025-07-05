import Edge from "@/core/Edge";
import { RenderContext, Uniform } from "./type";

type EdgeRendererOptions = {
    width: number;
};

const FLOATS_PER_VERTEX = 9; // position:2 + normal:2 + miter:1 + color:4
const VERTICES_PER_SEGMENT = 4; // start:2 + end:2
const FLOATS_PER_SEGMENT = FLOATS_PER_VERTEX * VERTICES_PER_SEGMENT;

export default class EdgeRenderer {
    private context: RenderContext;
    private pipeline!: GPURenderPipeline;
    private vertexBuffer!: GPUBuffer;
    private vertexCount = 0;
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
                        arrayStride: 48,
                        stepMode: "vertex",
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x4",
                            }, // color
                            {
                                shaderLocation: 1,
                                offset: 16,
                                format: "float32x2",
                            }, // position
                            {
                                shaderLocation: 2,
                                offset: 24,
                                format: "float32x2",
                            }, // normal
                            {
                                shaderLocation: 3,
                                offset: 32,
                                format: "float32",
                            }, // mitter
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
        });

        this.vertexBuffer = this.context.gpu.initBuffer(
            1024 * 256, // should maybe increase (256 KiB ~= 7281 vertices (~1213 segments))
            GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        );
    }

    sync(edgeArray: Edge[]) {
        const instanceArray: number[] = [];

        edgeArray.forEach((edge) => {
            const { path, color } = edge;

            for (let i = 0; i < path.length - 1; i++) {
                if (path.length < 2)
                    throw new Error("Segment should have 2 vertices");
                const start = path[i];
                const end = path[i + 1];

                const dx = end[0] - start[0];
                const dy = end[1] - start[1];

                if (dx !== 0 && dy !== 0)
                    throw new Error("Segment should be vertical OR horizontal");

                const normal = dy !== 0 ? [1, 0] : [0, 1];

                instanceArray.push(
                    ...color,
                    ...start,
                    ...normal,
                    +1,
                    ...color,
                    ...start,
                    ...normal,
                    -1,
                    ...color,
                    ...end,
                    ...normal,
                    +1,
                    ...color,
                    ...end,
                    ...normal,
                    -1,
                );
            }
        });

        this.vertexCount = instanceArray.length / FLOATS_PER_VERTEX;

        this.context.gpu.updateBuffer(
            this.vertexBuffer,
            new Float32Array(instanceArray),
        );
    }

    render(pass: GPURenderPassEncoder) {
        if (
            this.pipeline == null ||
            this.vertexBuffer == null ||
            this.vertexCount === 0
        )
            return;

        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.context.viewport.bindGroup);
        pass.setBindGroup(1, this.optsUniform.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(this.vertexCount);
        console.log("draw edge");
    }

    computeOptsUniform() {
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
