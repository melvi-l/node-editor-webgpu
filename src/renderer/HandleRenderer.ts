import Handle from "@/core/Handle";
import { RenderContext } from "./type";

type HandleInstance = {
    position: [number, number];
    color: [number, number];
    radius: number;
};
type HandleRendererOptions = {};
export default class HandleRenderer {
    private context: RenderContext;
    private pipeline!: GPURenderPipeline;
    private vertexBuffer!: GPUBuffer;
    private instanceBuffer!: GPUBuffer;
    private instanceCount = 0;
    private opts: HandleRendererOptions;

    constructor(context: RenderContext, opts: HandleRendererOptions = {}) {
        this.context = context;
        this.opts = opts;
    }

    async init() {
        const quadVertices = new Float32Array([
            -1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,
        ]);

        this.vertexBuffer = this.context.gpu.createBuffer(
            quadVertices,
            GPUBufferUsage.VERTEX,
        );

        const shader = await this.context.gpu.loadShaderModule("handle");

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
                        attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
                    },
                    {
                        arrayStride: 32,
                        stepMode: "instance",
                        attributes: [
                            { shaderLocation: 1, offset: 0, format: "float32x4" }, // color
                            { shaderLocation: 2, offset: 16, format: "float32x2" }, // center
                            { shaderLocation: 3, offset: 24, format: "float32" }, // radius
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
            1024 * 32,
            GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        );
    }

    sync(handles: Handle[]) {
        console.log(handles);

        this.instanceCount = handles.length;

        const flat = new Float32Array(handles.length * 8); // 2+4 floats

        handles.forEach((h, i) => {
            flat.set(h.color, i * 8);
            flat.set(h.position, i * 8 + 4);
            flat[i * 8 + 6] = h.radius ?? 30;
        });

        this.context.gpu.updateBuffer(this.instanceBuffer, flat);
    }

    render(pass: GPURenderPassEncoder) {
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.context.viewport.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setVertexBuffer(1, this.instanceBuffer);
        pass.draw(6, this.instanceCount);
    }
}
