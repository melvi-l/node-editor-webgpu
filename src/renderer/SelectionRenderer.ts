import Graph from "@/core/Graph";
import { RenderContext, Uniform } from "./type";

import { Vec4 } from "@/utils/math";
import { colorHEX } from "@/utils/color";

type SelectionRenderOptions = {
    backgroundColor: Vec4;
    outlineColor: Vec4;
    outlineWidth: number;
};
export default class SelectionRenderer {
    private context: RenderContext;
    private pipeline!: GPURenderPipeline;
    private vertexBuffer!: GPUBuffer;
    private opts!: SelectionRenderOptions;
    private uniform!: Uniform;

    constructor(
        context: RenderContext,
        opts: SelectionRenderOptions = {
            backgroundColor: colorHEX("#7180E440"),
            outlineColor: colorHEX("#7180E4"),
            outlineWidth: 2,
        },
    ) {
        this.context = context;
        this.opts = opts;
    }

    async init() {
        const vertexArray = new Float32Array([
            // uvPos, uv
            0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
        ]);

        this.vertexBuffer = this.context.gpu.createBuffer(
            vertexArray,
            GPUBufferUsage.VERTEX,
        );

        const shader = await this.context.gpu.loadShaderModule("selection");

        this.uniform = this.computeOptsUniform();

        this.pipeline = this.context.gpu.createRenderPipeline({
            layout: this.context.gpu.device.createPipelineLayout({
                bindGroupLayouts: [
                    this.context.viewport.bindGroupLayout,
                    this.uniform.bindGroupLayout,
                ],
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
                        writeMask: GPUColorWrite.ALL,
                    },
                ],
            },
            primitive: { topology: "triangle-strip" },
        });
    }

    sync(graph: Graph) {
        if (graph.selectionZone == null) {
            this.context.gpu.updateBuffer(
                this.uniform.buffer,
                new Float32Array([0, 0, 0, 0]),
            );
            return;
        }
        if (graph.dirty.selection === false) return;

        const [x, y] = graph.selectionZone.position;
        const [w, h] = graph.selectionZone.size;

        this.context.gpu.updateBuffer(
            this.uniform.buffer,
            new Float32Array([x, y, w, h]),
        );

        graph.dirty.selection = false;
    }

    render(pass: GPURenderPassEncoder) {
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.context.viewport.bindGroup);
        pass.setBindGroup(1, this.uniform.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(4, 1);
    }

    private computeOptsUniform(): Uniform {
        const transformBuffer = this.context.gpu.createBuffer(
            new Float32Array([0, 0, 0, 0]),
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        );
        const { backgroundColor, outlineColor, outlineWidth } = this.opts;
        const styleBuffer = this.context.gpu.createBuffer(
            new Float32Array([
                ...backgroundColor,
                ...outlineColor,
                outlineWidth,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
            ]),
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        );
        const bindGroupLayout = this.context.gpu.device.createBindGroupLayout({
            label: "selection",
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "uniform",
                    },
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "uniform",
                    },
                },
            ],
        });
        const bindGroup = this.context.gpu.createBindGroup(bindGroupLayout, [
            { binding: 0, resource: transformBuffer },
            { binding: 1, resource: styleBuffer },
        ]);
        return {
            buffer: transformBuffer, // only transform modified, type my need to evolve
            bindGroupLayout,
            bindGroup,
        };
    }
}
