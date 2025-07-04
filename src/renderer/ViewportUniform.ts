import { makeOrthoProjection } from "@/utils/mat4";
import GPUResources from "./GPUResources";
import { Uniform, ViewportSize } from "./type";

export default class ViewportUniform implements Uniform {
    public buffer: GPUBuffer;
    public bindGroup: GPUBindGroup;
    public bindGroupLayout: GPUBindGroupLayout;
    private _matrix = new Float32Array(16);

    constructor(gpu: GPUResources, { width, height }: ViewportSize) {
        this.buffer = gpu.initBuffer(
            64,
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        );

        this.bindGroupLayout = gpu.device.createBindGroupLayout({
            label: "viewport-layout",
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

        this.bindGroup = gpu.createBindGroup(this.bindGroupLayout, [
            { binding: 0, resource: { buffer: this.buffer } },
        ]);

        this.update(gpu, { width, height });
    }

    update(gpu: GPUResources, { width, height }: ViewportSize) {
        this._matrix = makeOrthoProjection(width, height);
        gpu.updateBuffer(this.buffer, this._matrix);
    }
}
