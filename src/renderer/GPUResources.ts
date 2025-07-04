export default class GPUResources {
    device!: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;
    adapter!: GPUAdapter;
    canvas: HTMLCanvasElement;

    private encoder!: GPUCommandEncoder;
    private pass!: GPURenderPassEncoder;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    async init({ isDebugEnable } = { isDebugEnable: true }) {
        this.adapter =
            (await navigator.gpu.requestAdapter()) ??
            (() => {
                throw new Error("WebGPU adapter not available");
            })();
        this.device = await this.adapter.requestDevice();
        this.context = this.canvas.getContext("webgpu")!;
        this.format = navigator.gpu.getPreferredCanvasFormat();

        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: "opaque",
        });

        if (isDebugEnable) {
            this.device.addEventListener("uncapturederror", (ev) =>
                console.warn(ev.error.message),
            );
        }
    }

    createShader(code: string): GPUShaderModule {
        return this.device.createShaderModule({ code });
    }
    async loadShaderModule(name: string): Promise<GPUShaderModule> {
        const code = (await import(`@/shaders/${name}.wgsl?raw`)).default;
        return this.device.createShaderModule({ code });
    }

    initBuffer(size: number, usage: GPUBufferUsageFlags): GPUBuffer {
        return this.device.createBuffer({
            size,
            usage,
        });
    }
    createBuffer(data: Float32Array, usage: GPUBufferUsageFlags): GPUBuffer {
        const buffer = this.device.createBuffer({
            size: data.byteLength,
            usage,
            mappedAtCreation: true,
        });
        new Float32Array(buffer.getMappedRange()).set(data);
        buffer.unmap();
        return buffer;
    }
    createUniformBuffer(data: Float32Array): GPUBuffer {
        return this.createBuffer(
            data,
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        );
    }

    updateBuffer(buffer: GPUBuffer, data: Float32Array): void {
        this.device.queue.writeBuffer(buffer, 0, data);
    }

    createRenderPipeline({
        vertex,
        fragment,
        layout = "auto",
        primitive = { topology: "triangle-list" },
    }: {
        vertex: GPUVertexState;
        fragment: GPUFragmentState;
        layout?: GPUPipelineLayout | "auto";
        primitive?: GPUPrimitiveState;
    }): GPURenderPipeline {
        const renderPipeline = this.device.createRenderPipeline({
            layout,
            vertex,
            fragment,
            primitive,
        });
        return renderPipeline;
    }

    createBindGroup(
        layout: GPUBindGroupLayout,
        entries: GPUBindGroupEntry[],
    ): GPUBindGroup {
        return this.device.createBindGroup({
            layout: layout,
            entries: entries,
        });
    }

    beginFrame(): GPURenderPassEncoder {
        this.encoder = this.device.createCommandEncoder();
        const view = this.context.getCurrentTexture().createView();

        this.pass = this.encoder.beginRenderPass({
            colorAttachments: [
                {
                    view,
                    clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
                    loadOp: "clear",
                    storeOp: "store",
                },
            ],
        });

        return this.pass;
    }
    endFrame(): void {
        this.pass.end();
        this.device.queue.submit([this.encoder.finish()]);
    }
}
