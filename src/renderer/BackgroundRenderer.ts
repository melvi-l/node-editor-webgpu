import { Vec4 } from "@/utils/math";
import { Layer, makeSortKey, RenderQueue } from "./RenderQueue";
import { RenderContext, Uniform } from "./type";
import { colorHEX } from "@/utils/color";

type BackgroundRendererOptions = {
    unit: number;
    width: number;
    color: Vec4;
};
export default class BackgroundRenderer {
    private context: RenderContext;
    private shaderName: string;
    private opts: BackgroundRendererOptions;
    private vertexBuffer!: GPUBuffer;
    private pipeline!: GPURenderPipeline;
    private uniform!: Uniform;
    constructor(
        context: RenderContext,
        shaderName: string,
        opts: BackgroundRendererOptions = {
            color: colorHEX("#333"),
            unit: 20,
            width: 1,
        },
    ) {
        this.context = context;
        this.shaderName = shaderName;
        this.opts = opts;
    }

    async init() {
        const vertexArray = new Float32Array([
            -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0,
        ]);

        this.vertexBuffer = this.context.gpu.createBuffer(
            vertexArray,
            GPUBufferUsage.VERTEX,
        );

        this.uniform = this.computeOptsUniform();

        const shader = await this.context.gpu.loadShaderModule(this.shaderName);

        this.pipeline = this.context.gpu.createRenderPipeline({
            layout: this.context.gpu.device.createPipelineLayout({
                bindGroupLayouts: [
                    this.context.viewport.invertedBindGroupLayout,
                    this.uniform.bindGroupLayout,
                ],
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
                        writeMask: GPUColorWrite.ALL,
                    },
                ],
            },
            primitive: { topology: "triangle-strip" },
        });
    }

    enqueue(renderQueue: RenderQueue) {
        const key = makeSortKey(Layer.Background, 0);
        renderQueue.push({
            key,
            execute: (pass) => this.render(pass),
        });
    }

    render(pass: GPURenderPassEncoder) {
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.context.viewport.invertedBindGroup);
        pass.setBindGroup(1, this.uniform.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(4, 1);
    }

    private computeOptsUniform(): Uniform {
        const buffer = this.context.gpu.createBuffer(
            new Float32Array([
                ...this.opts.color,
                this.opts.unit,
                this.opts.width,
                0,
                0,
            ]),
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        );
        console.log(
            new Float32Array([
                this.opts.unit,
                this.opts.width,
                ...this.opts.color,
                0,
                0,
            ]),
        );

        const bindGroupLayout = this.context.gpu.device.createBindGroupLayout({
            label: "background",
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "uniform",
                    },
                },
            ],
        });
        const bindGroup = this.context.gpu.createBindGroup(bindGroupLayout, [
            { binding: 0, resource: buffer },
        ]);
        return {
            buffer,
            bindGroupLayout,
            bindGroup,
        };
    }
}
