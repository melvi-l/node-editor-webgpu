import { RenderContext } from "@/renderer/type";

export class DebugTextureRenderer {
    private context: RenderContext;
    private pipeline!: GPURenderPipeline;

    private bindGroup!: GPUBindGroup;
    private vertexBuffer!: GPUBuffer;

    constructor(context: RenderContext) {
        this.context = context;
    }

    async init(pickingTexture: GPUTexture) {
        const sampler = this.context.gpu.device.createSampler({
            magFilter: "nearest",
            minFilter: "nearest",
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
        });

        const shader = await this.context.gpu.loadShaderModule("debug-picking");

        const vertices = new Float32Array([
            -1, -1, 0, 0, 1, -1, 1, 0, 1, 1, 1, 1, -1, -1, 0, 0, 1, 1, 1, 1, -1,
            1, 0, 1,
        ]);

        this.vertexBuffer = this.context.gpu.createBuffer(
            vertices,
            GPUBufferUsage.VERTEX,
        );

        console.log(pickingTexture);

        const textureView = pickingTexture.createView();

        const bindGroupLayout = this.context.gpu.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {},
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {},
                },
            ],
        });
        this.bindGroup = this.context.gpu.createBindGroup(bindGroupLayout, [
            { binding: 0, resource: textureView },
            { binding: 1, resource: sampler },
        ]);

        this.pipeline = this.context.gpu.device.createRenderPipeline({
            layout: this.context.gpu.device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout],
            }),
            vertex: {
                module: shader,
                entryPoint: "vs_main",
                buffers: [
                    {
                        arrayStride: 16,
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x2",
                            }, // pos
                            {
                                shaderLocation: 1,
                                offset: 8,
                                format: "float32x2",
                            }, // uv
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
            primitive: {
                topology: "triangle-list",
            },
        });
    }

    render(pass: GPURenderPassEncoder) {
        if (
            this.pipeline == null ||
            this.vertexBuffer == null ||
            this.bindGroup == null
        )
            return;

        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(6, 1);
    }
}
