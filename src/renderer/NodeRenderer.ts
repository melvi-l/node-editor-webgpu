import { RenderContext, Uniform } from "./type";

import Node from "@/core/Node";
import { Vec2, Vec4 } from "@/utils/math";

import { Layer, makeSortKey, RenderQueue } from "./RenderQueue";

type DrawNode = {
    position: Vec2;
    size: Vec2;
    color: Vec4;
};

const _data = new Float32Array(8);

export default class NodeRenderer {
    private context: RenderContext;
    private pipeline!: GPURenderPipeline;
    private vertexBuffer!: GPUBuffer;
    private uniform!: Uniform;

    constructor(context: RenderContext) {
        this.context = context;
    }

    async init() {
        const quadVertices = new Float32Array([
            -1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,
        ]);

        this.vertexBuffer = this.context.gpu.createBuffer(
            quadVertices,
            GPUBufferUsage.VERTEX,
        );

        this.uniform = this.initUniform();

        const shader = await this.context.gpu.loadShaderModule("node");

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
                    },
                ],
            },
        });
    }

    enqueue(node: Node, renderQueue: RenderQueue) {
        const drawNode = this.toDraw(node);

        const key = makeSortKey(Layer.Default, 0);

        renderQueue.push({
            key,
            execute: (pass) => this.render(pass, drawNode),
        });
    }

    toDraw(node: Node): DrawNode {
        if (node.isSelected)
            return {
                position: node.position,
                size: node.size,
                color: node.style.backgroundColor.selected,
            };
        return {
            position: node.position,
            size: node.size,
            color: node.style.backgroundColor.default,
        };
    }

    toUniformBindGroup(drawNode: DrawNode): GPUBindGroup {
        _data.set(
            [...drawNode.position, ...drawNode.size, ...drawNode.color],
            0,
        );
        const buffer = this.context.gpu.createBuffer(
            _data,
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        );
        return this.context.gpu.createBindGroup(this.uniform.bindGroupLayout, [
            { binding: 0, resource: buffer },
        ]);
    }

    initUniform(): Uniform {
        if (this.uniform != null) {
            console.warn("init already instanciated uniform");
        }
        const buffer = this.context.gpu.createBuffer(
            _data,
            GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        );
        const bindGroupLayout = this.context.gpu.device.createBindGroupLayout({
            label: "node",
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

    render(pass: GPURenderPassEncoder, drawNode: DrawNode) {
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.context.viewport.bindGroup);
        pass.setBindGroup(1, this.toUniformBindGroup(drawNode));
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(6, 1);
    }
}
