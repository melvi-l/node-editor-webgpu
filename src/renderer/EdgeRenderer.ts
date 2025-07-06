import { RenderContext, Uniform } from "./type";
import { computeMitter, direction, normal, Vec2, Vec4 } from "@/utils/math";

type EdgeRendererOptions = {
    width: number;
};

export type EdgeRender = {
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

    sync(edgeArray: EdgeRender[]) {
        const instanceData: number[] = [];

        edgeArray.forEach((edge) => {
            const { color, path } = edge;

            let lastMiter: {
                miter: Vec2;
                miterFactor: number;
            } | null = null;
            for (let i = 1; i < path.length; i++) {
                const last = path[i - 1];
                const curr = path[i];
                const next = i < path.length - 1 ? path[i + 1] : null;

                const dirA = direction(last, curr);
                if (i === 1) {
                    lastMiter = {
                        miter: normal(dirA),
                        miterFactor: 1,
                    };
                }
                if (lastMiter == null)
                    throw new Error("Should be possible to access lastMitter");
                if (next != null) {
                    const dirB = direction(curr, next);
                    const { miter, miterFactor } = computeMitter(dirA, dirB);
                    instanceData.push(
                        ...color,
                        ...last,
                        ...lastMiter.miter,
                        ...curr,
                        ...miter,
                        lastMiter.miterFactor,
                        miterFactor,
                    );
                    lastMiter = {
                        miter,
                        miterFactor,
                    };
                } else {
                    instanceData.push(
                        ...color,
                        ...last,
                        ...lastMiter.miter,
                        ...curr,
                        ...normal(dirA),
                        lastMiter.miterFactor,
                        1,
                    );
                    lastMiter = null; // clean
                }
            }
        });

        this.instanceCount = instanceData.length / 8;
        this.context.gpu.updateBuffer(
            this.instanceBuffer,
            new Float32Array(instanceData),
        );
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
