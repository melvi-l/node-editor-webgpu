import { Vec2, Vec4 } from "@/utils/math";
import GPUResources from "./GPUResources";

import { Uniform, ViewportParams } from "./type";

import { makeinvertedOrthoProjection, makeOrthoProjection } from "@/utils/mat4";

export default class Viewport implements Uniform {
    private _gpu: GPUResources;

    private _buffer: GPUBuffer;
    private _bindGroup: GPUBindGroup;
    private _bindGroupLayout: GPUBindGroupLayout;
    private _matrix = new Float32Array(16);
    private _invertedBuffer: GPUBuffer;
    private _invertedBindGroup: GPUBindGroup;
    private _invertedBindGroupLayout: GPUBindGroupLayout;
    private _invertedMatrix = new Float32Array(16);

    private _panX: number;
    private _panY: number;
    private _zoom: number;
    private _width: number;
    private _height: number;

    constructor(
        gpu: GPUResources,
        { width, height, zoom = 1, panX = 0, panY = 0 }: ViewportParams,
    ) {
        this._gpu = gpu;

        this._buffer = this._gpu.initBuffer(
            64,
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        );

        this._bindGroupLayout = this._gpu.device.createBindGroupLayout({
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

        this._bindGroup = this._gpu.createBindGroup(this._bindGroupLayout, [
            { binding: 0, resource: { buffer: this._buffer } },
        ]);

        this._invertedBuffer = this._gpu.initBuffer(
            64,
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        );

        this._invertedBindGroupLayout = this._gpu.device.createBindGroupLayout({
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

        this._invertedBindGroup = this._gpu.createBindGroup(
            this._invertedBindGroupLayout,
            [{ binding: 0, resource: { buffer: this._invertedBuffer } }],
        );

        this._width = width;
        this._height = height;
        this._zoom = zoom;
        this._panX = panX;
        this._panY = panY;

        this.update({});
    }

    update({
        width = this._width,
        height = this._height,
        zoom = this._zoom,
        panX = this._panX,
        panY = this._panY,
    }: Partial<ViewportParams>) {
        this._matrix = makeOrthoProjection(width, height, zoom, panX, panY);
        this._invertedMatrix = makeinvertedOrthoProjection(
            width,
            height,
            zoom,
            panX,
            panY,
        );
        this._gpu.updateBuffer(this._buffer, this._matrix);
        this._gpu.updateBuffer(this._invertedBuffer, this._invertedMatrix);
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

    get invertedBuffer(): GPUBuffer {
        return this._invertedBuffer;
    }
    get invertedBindGroup(): GPUBindGroup {
        return this._invertedBindGroup;
    }
    get invertedBindGroupLayout(): GPUBindGroupLayout {
        return this._invertedBindGroupLayout;
    }

    get width() {
        return this._width;
    }
    set width(value: number) {
        this._width = value;
        this.update({ width: value });
    }

    get height() {
        return this._height;
    }
    set height(value: number) {
        this._height = value;
        this.update({ height: value });
    }

    get size(): Vec2 {
        return [this.width, this.height];
    }
    set size(value: Vec2) {
        this._width = value[0];
        this._height = value[1];
        this.update({
            width: value[0],
            height: value[1],
        });
    }

    get zoom() {
        return this._zoom;
    }
    set zoom(value: number) {
        this._zoom = value;
        this.update({ zoom: value });
    }

    get panX() {
        return this._panX;
    }
    set panX(value: number) {
        this._panX = value;
        this.update({ panX: value });
    }

    get panY() {
        return this._panY;
    }
    set panY(value: number) {
        this._panY = value;
        this.update({ panY: value });
    }

    get pan(): Vec2 {
        return [this.panX, this.panY];
    }
    set pan(value: Vec2) {
        console.log("current", this.pan);
        console.log("next", value);

        this._panX = value[0];
        this._panY = value[1];
        this.update({
            panX: value[0],
            panY: value[1],
        });
    }
}
