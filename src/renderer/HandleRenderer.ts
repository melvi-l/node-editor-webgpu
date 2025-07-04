import Handle from "@/core/Handle";
import { RenderContext } from "./type";

type HandleInstance = {
    position: [number, number];
    color: [number, number];
};
type HandleRendererOptions = {
    radius: number;
    segmentCount: number;
};
export default class HandleRenderer {
    private context: RenderContext;
    private pipeline!: GPURenderPipeline;
    private vertexBuffer!: GPUBuffer;
    private instanceBuffer!: GPUBuffer;
    private instanceCount = 0;
    private opts: HandleRendererOptions;

    constructor(
        context: RenderContext,
        opts: HandleRendererOptions = { radius: 1, segmentCount: 32 },
    ) {
        this.context = context;
        this.opts = opts;
    }

    async init() {
        const { radius, segmentCount } = this.opts;
        const vertices = new Float32Array(segmentCount * 3 * 2);

        for (let i = 0; i < segmentCount; i++) {
            const angle1 = (i / segmentCount) * Math.PI * 2;
            const angle2 = ((i + 1) / segmentCount) * Math.PI * 2;

            vertices[i * 6] = 0;
            vertices[i * 6 + 1] = 0;
            vertices[i * 6 + 2] = Math.cos(angle1) * radius;
            vertices[i * 6 + 3] = Math.sin(angle1) * radius;
            vertices[i * 6 + 4] = Math.cos(angle2) * radius;
            vertices[i * 6 + 5] = Math.sin(angle2) * radius;
        }
        console.log(vertices);

        this.vertexBuffer = this.context.gpu.createBuffer(
            vertices,
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
                            { shaderLocation: 1, offset: 0, format: "float32x2" }, // position
                            { shaderLocation: 2, offset: 8, format: "float32x4" }, // color
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
            1024 * 32,
            GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        );
    }

    sync(handles: Handle[]) {
        console.log(handles);

        this.instanceCount = handles.length;

        const flat = new Float32Array(handles.length * 8); // 2+4 floats

        handles.forEach((h, i) => {
            flat.set(h.position, i * 8);
            flat.set(h.color, i * 8 + 2);
        });

        this.context.gpu.updateBuffer(this.instanceBuffer, flat);
    }

    render(pass: GPURenderPassEncoder) {
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.context.viewport.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setVertexBuffer(1, this.instanceBuffer);
        pass.draw(this.vertexBuffer.size / 4 / 2, this.instanceCount);
    }
}
