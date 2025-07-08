import { makeOrthoProjection } from "@/utils/mat4";
import GPUResources from "./GPUResources";
import { Uniform, ViewportSize } from "./type";

export default class Viewport implements Uniform {
    private _buffer: GPUBuffer;
    private _bindGroup: GPUBindGroup;
    private _bindGroupLayout: GPUBindGroupLayout;
    private _matrix = new Float32Array(16);

    constructor(gpu: GPUResources, { width, height }: ViewportSize) {
        this._buffer = gpu.initBuffer(
            64,
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        );

        this._bindGroupLayout = gpu.device.createBindGroupLayout({
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

        this._bindGroup = gpu.createBindGroup(this._bindGroupLayout, [
            { binding: 0, resource: { buffer: this._buffer } },
        ]);

        this.update(gpu, { width, height });
    }

    update(gpu: GPUResources, { width, height }: ViewportSize) {
        this._matrix = makeOrthoProjection(width, height);
        gpu.updateBuffer(this._buffer, this._matrix);
    }

    get buffer(): GPUBuffer {
        return this._buffer;
    }
    get bindGroup(): GPUBindGroup {
        return this._bindGroup;
    }
    get bindGroupLayout(): GPUBindGroupLayout {
        return this._bindGroupLayout;
    }
}
